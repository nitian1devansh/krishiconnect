import { ProductStatus, VendorStatus } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export interface ProductFilterQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  crop?: string;
  organicOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  vendorId?: string;
}

export class CatalogService {
  static async getCategories() {
    return prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: {
          select: {
            products: {
              where: {
                status: ProductStatus.APPROVED,
                vendor: { status: VendorStatus.APPROVED }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getProducts(filters: ProductFilterQuery) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 12));
    const skip = (page - 1) * limit;

    // Must be approved product from approved vendor
    const where: any = {
      status: ProductStatus.APPROVED,
      vendor: {
        status: VendorStatus.APPROVED
      }
    };

    if (filters.category) {
      where.category = {
        slug: filters.category
      };
    }

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters.organicOnly) {
      where.organicCertified = true;
    }

    if (filters.crop) {
      where.suitableCrops = {
        has: filters.crop
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { brand: { name: { contains: filters.search, mode: 'insensitive' } } },
        { suitableCrops: { has: filters.search } }
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
            ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
          }
        }
      };
    }

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' };
    if (filters.sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (filters.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: {
            orderBy: { isPrimary: 'desc' }
          },
          variants: {
            include: {
              inventory: true
            },
            orderBy: { price: 'asc' }
          },
          category: {
            select: { id: true, name: true, slug: true }
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              storeSlug: true,
              rating: true,
              city: true,
              state: true,
            }
          }
        }
      })
    ]);

    // Handle price sorting in JS if needed across variants
    let sortedProducts = products;
    if (filters.sortBy === 'price_asc') {
      sortedProducts = [...products].sort((a, b) => {
        const minA = Number(a.variants[0]?.price || 0);
        const minB = Number(b.variants[0]?.price || 0);
        return minA - minB;
      });
    } else if (filters.sortBy === 'price_desc') {
      sortedProducts = [...products].sort((a, b) => {
        const maxA = Number(a.variants[a.variants.length - 1]?.price || 0);
        const maxB = Number(b.variants[b.variants.length - 1]?.price || 0);
        return maxB - maxA;
      });
    }

    return {
      products: sortedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.APPROVED,
        vendor: { status: VendorStatus.APPROVED }
      },
      include: {
        images: {
          orderBy: { isPrimary: 'desc' }
        },
        variants: {
          include: {
            inventory: true
          },
          orderBy: { price: 'asc' }
        },
        category: true,
        brand: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            storeSlug: true,
            description: true,
            rating: true,
            totalSales: true,
            city: true,
            state: true,
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!product) {
      throw new AppError('Product not found or currently unavailable.', 404);
    }

    return product;
  }

  static async getVendorStorefront(storeSlug: string) {
    const vendor = await prisma.vendorProfile.findFirst({
      where: {
        storeSlug,
        status: VendorStatus.APPROVED
      },
      include: {
        products: {
          where: { status: ProductStatus.APPROVED },
          include: {
            images: { orderBy: { isPrimary: 'desc' } },
            variants: { orderBy: { price: 'asc' } },
            category: true,
          }
        }
      }
    });

    if (!vendor) {
      throw new AppError('Vendor storefront not found.', 404);
    }

    return vendor;
  }
}

