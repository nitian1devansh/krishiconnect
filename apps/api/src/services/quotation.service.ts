import { QuotationStatus, CreateQuotationRequestInput, SubmitVendorQuotationInput } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export class QuotationService {
  static async createRequest(userId: string, input: CreateQuotationRequestInput) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId }
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    return prisma.quotationRequest.create({
      data: {
        userId,
        productId: input.productId,
        quantity: input.quantity,
        unit: input.unit,
        targetPricePerUnit: input.targetPricePerUnit,
        deliveryLocation: input.deliveryLocation,
        deliveryPincode: input.deliveryPincode,
        neededByDate: new Date(input.neededByDate),
        additionalNotes: input.additionalNotes,
        status: QuotationStatus.PENDING,
      },
      include: {
        product: {
          select: { id: true, title: true, images: { take: 1 } }
        }
      }
    });
  }

  static async getCustomerRequests(userId: string) {
    return prisma.quotationRequest.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, title: true, images: { take: 1 } }
        },
        vendorQuotations: {
          include: {
            vendor: {
              select: { id: true, businessName: true, rating: true, user: { select: { phone: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getVendorOpenRequests(vendorProfileId: string) {
    return prisma.quotationRequest.findMany({
      where: {
        status: { in: [QuotationStatus.PENDING, QuotationStatus.SUBMITTED] }
      },
      include: {
        product: { select: { id: true, title: true, images: { take: 1 } } },
        user: { select: { fullName: true } },
        vendorQuotations: {
          where: { vendorId: vendorProfileId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async submitVendorQuote(vendorProfileId: string, requestId: string, input: SubmitVendorQuotationInput) {
    const request = await prisma.quotationRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new AppError('Quotation request not found.', 404);
    }

    const quotation = await prisma.vendorQuotation.create({
      data: {
        quotationRequestId: requestId,
        vendorId: vendorProfileId,
        quotedPricePerUnit: input.quotedPricePerUnit,
        shippingCostTotal: input.shippingCostTotal,
        validUntil: new Date(input.validUntil),
        paymentTerms: input.paymentTerms,
        vendorNotes: input.vendorNotes,
        status: QuotationStatus.SUBMITTED,
      }
    });

    await prisma.quotationRequest.update({
      where: { id: requestId },
      data: { status: QuotationStatus.SUBMITTED }
    });

    return quotation;
  }

  static async acceptQuotation(userId: string, quotationId: string) {
    const quote = await prisma.vendorQuotation.findUnique({
      where: { id: quotationId },
      include: { quotationRequest: true }
    });

    if (!quote || quote.quotationRequest.userId !== userId) {
      throw new AppError('Quotation not found or unauthorized.', 404);
    }

    await prisma.$transaction([
      prisma.vendorQuotation.update({
        where: { id: quotationId },
        data: { status: QuotationStatus.ACCEPTED }
      }),
      prisma.quotationRequest.update({
        where: { id: quote.quotationRequestId },
        data: { status: QuotationStatus.ACCEPTED }
      })
    ]);

    return { success: true, message: 'Quotation accepted.' };
  }
}
