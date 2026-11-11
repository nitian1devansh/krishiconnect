import { VendorStatus, ProductStatus, DisputeStatus, VerificationStatus } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export class AdminService {
  static async getPlatformMetrics() {
    const [
      totalFarmers,
      totalVendors,
      pendingVendors,
      pendingFarmers,
      totalProducts,
      pendingProducts,
      orders,
      activeDisputes,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.vendorProfile.count(),
      prisma.vendorProfile.count({ where: { status: VendorStatus.PENDING } }),
      prisma.farmerProfile.count({ where: { status: VerificationStatus.PENDING_VERIFICATION } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: ProductStatus.PENDING_REVIEW } }),
      prisma.order.findMany({
        select: { netAmount: true, status: true, createdAt: true }
      }),
      prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
    ]);

    const totalGMV = orders.reduce((sum, o) => sum + Number(o.netAmount), 0);
    const paidOrders = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'PENDING_PAYMENT');
    const successfulGMV = paidOrders.reduce((sum, o) => sum + Number(o.netAmount), 0);
    const estimatedCommissions = successfulGMV * 0.05; // 5% platform fee

    return {
      totalFarmers,
      totalVendors,
      pendingVendors,
      pendingFarmers,
      totalProducts,
      pendingProducts,
      totalOrders: orders.length,
      successfulOrders: paidOrders.length,
      totalGMV,
      successfulGMV,
      estimatedCommissions,
      activeDisputes,
    };
  }

  static async getFarmers(status?: VerificationStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return prisma.farmerProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true, createdAt: true }
        },
        soilTestReports: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async reviewFarmer(adminId: string, farmerProfileId: string, decision: VerificationStatus, remarks: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerProfileId },
      include: { user: true }
    });

    if (!farmer) {
      throw new AppError('Farmer profile not found.', 404);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.farmerProfile.update({
        where: { id: farmerProfileId },
        data: {
          status: decision,
          rejectionReason: decision === VerificationStatus.REJECTED ? remarks : null,
        }
      });

      // Update User isVerified
      await tx.user.update({
        where: { id: farmer.userId },
        data: { isVerified: decision === VerificationStatus.APPROVED }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          adminId,
          action: `FARMER_${decision}`,
          targetType: 'FarmerProfile',
          targetId: farmerProfileId,
          details: JSON.stringify({
            previousStatus: farmer.status,
            newStatus: decision,
            remarks,
            farmerName: farmer.user.fullName,
            email: farmer.user.email,
          })
        }
      });

      // Notification to farmer user
      await tx.notification.create({
        data: {
          userId: farmer.userId,
          title: `Farmer Verification: ${decision}`,
          message: `Your farmer account verification status is now ${decision}. Remarks: ${remarks}`,
          type: 'FARMER_APPROVAL',
          linkUrl: '/account/profile',
        }
      });

      return updated;
    });
  }

  static async getVendors(status?: VendorStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return prisma.vendorProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        documents: true,
        _count: {
          select: { products: true, vendorOrders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async reviewVendor(adminId: string, vendorId: string, decision: VendorStatus, remarks: string) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { user: true }
    });

    if (!vendor) {
      throw new AppError('Vendor not found.', 404);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.vendorProfile.update({
        where: { id: vendorId },
        data: {
          status: decision,
          verificationRemarks: remarks,
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          adminId,
          action: `VENDOR_${decision}`,
          targetType: 'VendorProfile',
          targetId: vendorId,
          details: JSON.stringify({
            previousStatus: vendor.status,
            newStatus: decision,
            remarks,
            vendorName: vendor.businessName,
          })
        }
      });

      // Notification to vendor user
      await tx.notification.create({
        data: {
          userId: vendor.userId,
          title: `Vendor Verification Status: ${decision}`,
          message: `Your vendor business profile has been marked as ${decision}. Remarks: ${remarks}`,
          type: 'VENDOR_APPROVAL',
          linkUrl: '/vendor/verification',
        }
      });

      return updated;
    });
  }

  static async getProductsForReview(status?: ProductStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = ProductStatus.PENDING_REVIEW;
    }

    return prisma.product.findMany({
      where,
      include: {
        images: true,
        variants: { include: { inventory: true } },
        category: true,
        vendor: {
          select: { id: true, businessName: true, status: true, licenseNumber: true }
        },
        approvalHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async reviewProduct(adminId: string, productId: string, decision: ProductStatus, remarks: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: { include: { user: true } } }
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          status: decision,
          rejectionReason: decision !== ProductStatus.APPROVED ? remarks : null,
        }
      });

      // Create Approval History
      await tx.productApprovalHistory.create({
        data: {
          productId,
          fromStatus: product.status,
          toStatus: decision,
          actionBy: adminId,
          remarks,
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          adminId,
          action: `PRODUCT_${decision}`,
          targetType: 'Product',
          targetId: productId,
          details: JSON.stringify({
            productTitle: product.title,
            vendorName: product.vendor.businessName,
            previousStatus: product.status,
            newStatus: decision,
            remarks,
          })
        }
      });

      // Notify vendor
      await tx.notification.create({
        data: {
          userId: product.vendor.userId,
          title: `Product Review Update: ${product.title}`,
          message: `Your product listing "${product.title}" has been ${decision.toLowerCase().replace('_', ' ')}. ${remarks}`,
          type: 'PRODUCT_REVIEW',
          linkUrl: `/vendor/products`,
        }
      });

      return updated;
    });
  }

  static async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          admin: {
            select: { id: true, fullName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

