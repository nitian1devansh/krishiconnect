import { OrderStatus, PaymentStatus, PaymentMethod } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';
import { CartService } from './cart.service';

export interface CreateOrderInput {
  userId: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  customerNotes?: string;
}

export class OrderService {
  static async createOrderFromCart(input: CreateOrderInput) {
    const { userId, addressId, paymentMethod, couponCode, customerNotes } = input;

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId }
    });
    if (!address) {
      throw new AppError('Delivery address not found.', 404);
    }

    // Get validated cart
    const cartSummary = await CartService.getOrCreateCart(userId);
    if (!cartSummary.items.length) {
      throw new AppError('Your shopping cart is empty.', 400);
    }

    // Generate unique order number (e.g. KC-2026-XXXX)
    const orderNumber = `KC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Optional coupon discount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() }
      });
      if (coupon && coupon.isActive && new Date(coupon.validUntil) > new Date()) {
        if (Number(coupon.minOrderVal) <= cartSummary.subtotal) {
          if (coupon.discountPct) {
            discountAmount = (cartSummary.subtotal * Number(coupon.discountPct)) / 100;
            if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
              discountAmount = Number(coupon.maxDiscount);
            }
          } else if (coupon.discountAmt) {
            discountAmount = Number(coupon.discountAmt);
          }
        }
      }
    }

    const netAmount = Math.max(0, cartSummary.subtotal + cartSummary.deliveryFee - discountAmount);

    // Run order creation and inventory reservation in transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Double check and lock inventory for all variants
      for (const item of cartSummary.items) {
        const inv = await tx.inventory.findUnique({
          where: { variantId: item.variantId }
        });
        const currentAvailable = (inv?.stockQuantity || 0) - (inv?.reservedQuantity || 0);
        if (currentAvailable < item.quantity) {
          throw new AppError(`Item "${item.product.title} (${item.variant.title})" has insufficient stock. Only ${currentAvailable} left.`, 400);
        }

        // Reserve inventory
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: {
            reservedQuantity: { increment: item.quantity }
          }
        });
      }

      // 2. Create parent Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          status: paymentMethod === PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.PENDING_PAYMENT,
          totalAmount: cartSummary.subtotal,
          deliveryFee: cartSummary.deliveryFee,
          discountAmount,
          netAmount,
          paymentMethod,
          paymentStatus: paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
          couponCode,
          customerNotes,
        }
      });

      // 3. Create inventory reservations
      const reservationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes reservation
      for (const item of cartSummary.items) {
        await tx.inventoryReservation.create({
          data: {
            variantId: item.variantId,
            orderId: newOrder.id,
            quantity: item.quantity,
            expiresAt: reservationExpiry,
          }
        });
      }

      // 4. Create vendor-specific VendorOrder and OrderItems
      for (const group of cartSummary.vendorGroups) {
        const commissionRate = Number(group.vendor.commissionRate || 5.0);
        const commissionAmt = (group.subtotal * commissionRate) / 100;
        const payoutAmount = group.subtotal - commissionAmt;

        const vendorOrder = await tx.vendorOrder.create({
          data: {
            orderId: newOrder.id,
            vendorId: group.vendor.id,
            subtotalAmount: group.subtotal,
            commissionRate,
            commissionAmt,
            payoutAmount,
            status: paymentMethod === PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.PENDING_PAYMENT,
          }
        });

        // Create OrderItems under this VendorOrder
        for (const item of group.items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              vendorOrderId: vendorOrder.id,
              productId: item.productId,
              variantId: item.variantId,
              productTitle: item.product.title,
              variantTitle: item.variant.title,
              sku: item.variant.sku,
              unitPrice: item.variant.price,
              quantity: item.quantity,
              totalPrice: Number(item.variant.price) * item.quantity,
            }
          });
        }

        // Initialize Shipment tracking
        await tx.shipment.create({
          data: {
            vendorOrderId: vendorOrder.id,
            status: paymentMethod === PaymentMethod.COD ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT,
          }
        });
      }

      // 5. Clear cart
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return newOrder;
    });

    return this.getOrderDetails(order.id, userId);
  }

  static async getOrderDetails(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: { take: 1, orderBy: { isPrimary: 'desc' } }
              }
            }
          }
        },
        vendorOrders: {
          include: {
            vendor: {
              select: { id: true, businessName: true, storeSlug: true, user: { select: { phone: true } } }
            },
            shipment: true,
            items: true,
          }
        },
        payments: true,
      }
    });

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    return order;
  }

  static async getCustomerOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: { take: 1, orderBy: { isPrimary: 'desc' } }
              }
            }
          }
        },
        vendorOrders: {
          include: {
            vendor: { select: { id: true, businessName: true } },
            shipment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getVendorOrders(vendorProfileId: string) {
    return prisma.vendorOrder.findMany({
      where: { vendorId: vendorProfileId },
      include: {
        order: {
          include: {
            user: { select: { id: true, fullName: true, phone: true, email: true } },
            address: true,
          }
        },
        items: {
          include: {
            product: {
              select: { id: true, title: true, images: { take: 1 } }
            }
          }
        },
        shipment: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateVendorOrderStatus(
    vendorProfileId: string,
    vendorOrderId: string,
    status: OrderStatus,
    trackingNumber?: string,
    carrierName?: string
  ) {
    const vendorOrder = await prisma.vendorOrder.findFirst({
      where: { id: vendorOrderId, vendorId: vendorProfileId },
      include: { order: true }
    });

    if (!vendorOrder) {
      throw new AppError('Vendor order record not found.', 404);
    }

    // Update VendorOrder status and Shipment
    const updated = await prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: {
        status,
        shipment: {
          upsert: {
            create: {
              status,
              trackingNumber,
              carrierName,
              ...(status === OrderStatus.SHIPPED && { shippedAt: new Date() }),
              ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
            },
            update: {
              status,
              ...(trackingNumber && { trackingNumber }),
              ...(carrierName && { carrierName }),
              ...(status === OrderStatus.SHIPPED && { shippedAt: new Date() }),
              ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
            }
          }
        }
      },
      include: { shipment: true }
    });

    // Check if all vendor orders in parent order are in this status to advance parent status
    const allVendorOrders = await prisma.vendorOrder.findMany({
      where: { orderId: vendorOrder.orderId }
    });

    const allMatch = allVendorOrders.every(vo => vo.status === status);
    if (allMatch) {
      await prisma.order.update({
        where: { id: vendorOrder.orderId },
        data: { status }
      });
    }

    return updated;
  }
}
