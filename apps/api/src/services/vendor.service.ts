import { ProductStatus, VendorStatus, ProductCreateInput } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export class VendorService {
  static async getVendorProfile(userId: string) {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        documents: true,
        _count: {
          select: {
            products: true,
            vendorOrders: true,
          }
        }
      }
    });

    if (!profile) {
      throw new AppError('Vendor profile not found.', 404);
    }

    return profile;
  }

  static async updateVendorProfile(userId: string, data: any) {
    const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError('Vendor profile not found.', 404);

    return prisma.vendorProfile.update({
      where: { id: profile.id },
      data: {
        businessName: data.businessName || profile.businessName,
        description: data.description !== undefined ? data.description : profile.description,
        businessAddress: data.businessAddress || profile.businessAddress,
        city: data.city || profile.city,
        state: data.state || profile.state,
        pincode: data.pincode || profile.pincode,
        gstin: data.gstin !== undefined ? data.gstin : profile.gstin,
        panNumber: data.panNumber !== undefined ? data.panNumber : profile.panNumber,
        licenseNumber: data.licenseNumber !== undefined ? data.licenseNumber : profile.licenseNumber,
        bankAccountNumber: data.bankAccountNumber !== undefined ? data.bankAccountNumber : profile.bankAccountNumber,
        bankIfsc: data.bankIfsc !== undefined ? data.bankIfsc : profile.bankIfsc,
        bankAccountName: data.bankAccountName !== undefined ? data.bankAccountName : profile.bankAccountName,
      }
    });
  }

  static async uploadDocument(
    vendorProfileId: string,
    documentType: string,
    documentUrl: string,
    fileName: string,
    fileSize?: number
  ) {
    return prisma.vendorVerificationDocument.create({
      data: {
        vendorProfileId,
        documentType,
        documentUrl,
        fileName,
        fileSize,
      }
    });
  }

  static async createProduct(vendorProfileId: string, input: ProductCreateInput) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId }
    });

    if (!vendor) {
      throw new AppError('Vendor profile not found.', 404);
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      throw new AppError('Only verified vendors can submit products for review.', 403);
    }

    // Slug generation
    const baseSlug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    return prisma.$transaction(async (tx) => {
      let resolvedBrandId: string | undefined;
      const cleanBrand = input.brandName?.trim();
      if (cleanBrand) {
        const brandSlug = cleanBrand
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        if (brandSlug) {
          const brand = await tx.brand.upsert({
            where: { name: cleanBrand },
            create: { name: cleanBrand, slug: brandSlug },
            update: {},
          });
          resolvedBrandId = brand.id;
        }
      }

      const product = await tx.product.create({
        data: {
          vendorId: vendorProfileId,
          categoryId: input.categoryId,
          brandId: resolvedBrandId,
          title: input.title,
          titleHi: input.titleHi,
          slug,
          description: input.description,
          descriptionHi: input.descriptionHi,
          status: ProductStatus.PENDING_REVIEW, // Requires admin review!
          suitableCrops: input.suitableCrops,
          dosageInstructions: input.dosageInstructions,
          activeIngredients: input.activeIngredients,
          batchNumber: input.batchNumber,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          organicCertified: input.organicCertified,
          cibRegistrationNo: input.cibRegistrationNo,
          hsnCode: input.hsnCode,
          images: {
            create: input.images.map((url, idx) => ({
              url,
              order: idx,
              isPrimary: idx === 0,
            }))
          },
          variants: {
            create: input.variants.map((v) => ({
              title: v.title,
              sku: v.sku,
              price: v.price,
              mrp: v.mrp,
              weightKg: v.weightKg,
              inventory: {
                create: {
                  stockQuantity: v.stock,
                  reservedQuantity: 0,
                  lowStockAlert: 10,
                }
              }
            }))
          },
          approvalHistory: {
            create: {
              fromStatus: ProductStatus.DRAFT,
              toStatus: ProductStatus.PENDING_REVIEW,
              actionBy: vendor.userId,
              remarks: 'Initial submission by vendor',
            }
          }
        },
        include: {
          images: true,
          variants: { include: { inventory: true } },
          category: true,
        }
      });

      return product;
    });
  }

  static async getVendorProducts(vendorProfileId: string) {
    return prisma.product.findMany({
      where: { vendorId: vendorProfileId },
      include: {
        images: true,
        variants: { include: { inventory: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateInventoryStock(vendorProfileId: string, variantId: string, stockQuantity: number) {
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        product: { vendorId: vendorProfileId }
      }
    });

    if (!variant) {
      throw new AppError('Variant not found or access denied.', 404);
    }

    return prisma.inventory.update({
      where: { variantId },
      data: { stockQuantity }
    });
  }

  static async getVendorAnalytics(vendorProfileId: string) {
    const [orders, products, settlements] = await Promise.all([
      prisma.vendorOrder.findMany({
        where: { vendorId: vendorProfileId }
      }),
      prisma.product.findMany({
        where: { vendorId: vendorProfileId },
        select: { id: true, status: true }
      }),
      prisma.settlement.findMany({
        where: { vendorId: vendorProfileId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.subtotalAmount), 0);
    const totalPayouts = orders.reduce((acc, o) => acc + Number(o.payoutAmount), 0);
    const totalCommissions = orders.reduce((acc, o) => acc + Number(o.commissionAmt), 0);

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalPayouts,
      totalCommissions,
      productCounts: {
        total: products.length,
        approved: products.filter(p => p.status === ProductStatus.APPROVED).length,
        pending: products.filter(p => p.status === ProductStatus.PENDING_REVIEW).length,
        rejected: products.filter(p => p.status === ProductStatus.REJECTED).length,
      },
      recentSettlements: settlements,
    };
  }
}

