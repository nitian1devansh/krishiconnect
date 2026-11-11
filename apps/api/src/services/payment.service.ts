import crypto from 'crypto';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export class PaymentService {
  /**
   * Create Razorpay payment order or return sandbox payload
   */
  static async createPaymentOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId }
    });

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new AppError('This order has already been paid.', 400);
    }

    const amountInPaise = Math.round(Number(order.netAmount) * 100);
    const razorpayOrderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.netAmount,
        currency: 'INR',
        method: order.paymentMethod,
        status: PaymentStatus.PENDING,
        razorpayOrderId,
      }
    });

    return {
      paymentId: payment.id,
      razorpayOrderId,
      amount: order.netAmount,
      amountInPaise,
      currency: 'INR',
      keyId: config.payment.razorpayKeyId,
      isSandbox: config.payment.sandboxMode,
    };
  }

  /**
   * Verify signature from Razorpay or sandbox callback
   */
  static async verifyPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const payment = await prisma.payment.findFirst({
      where: { orderId, razorpayOrderId }
    });

    if (!payment) {
      throw new AppError('Payment record not found.', 404);
    }

    // In sandbox mode with mock signature, allow testing
    let isValid = false;
    if (config.payment.sandboxMode && razorpaySignature.startsWith('sandbox_sig_')) {
      isValid = true;
    } else {
      const expectedSignature = crypto
        .createHmac('sha256', config.payment.razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      isValid = expectedSignature === razorpaySignature;
    }

    if (!isValid) {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          gatewayEvent: 'payment.failed',
          success: false,
          errorMessage: 'Invalid payment signature',
        }
      });
      throw new AppError('Payment signature verification failed.', 400);
    }

    // Process payment success inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          razorpayPaymentId,
          razorpaySignature,
        }
      });

      // 2. Update Order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
        }
      });

      // 3. Update all VendorOrders to CONFIRMED
      const vendorOrders = await tx.vendorOrder.findMany({
        where: { orderId }
      });

      for (const vo of vendorOrders) {
        await tx.vendorOrder.update({
          where: { id: vo.id },
          data: { status: OrderStatus.CONFIRMED }
        });

        // Record platform commission and vendor payout ledger entry
        await tx.commissionRecord.create({
          data: {
            vendorId: vo.vendorId,
            orderId: orderId,
            grossAmount: vo.subtotalAmount,
            rate: vo.commissionRate,
            netFee: vo.commissionAmt,
          }
        });

        await tx.financialLedgerEntry.create({
          data: {
            entityType: 'ORDER',
            entityId: vo.id,
            credit: vo.payoutAmount,
            balance: vo.payoutAmount,
            description: `Order ${orderId} settlement allocated for Vendor ${vo.vendorId}`,
          }
        });
      }

      // 4. Release inventory reservations and permanently deduct stock
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, isReleased: false }
      });

      for (const res of reservations) {
        await tx.inventory.update({
          where: { variantId: res.variantId },
          data: {
            stockQuantity: { decrement: res.quantity },
            reservedQuantity: { decrement: res.quantity },
          }
        });

        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { isReleased: true }
        });
      }

      // 5. Log successful attempt
      await tx.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          gatewayEvent: 'payment.captured',
          success: true,
          payload: JSON.stringify({ razorpayOrderId, razorpayPaymentId }),
        }
      });
    });

    return { success: true, message: 'Payment successfully verified and order confirmed.' };
  }
}

