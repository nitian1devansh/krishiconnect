import { ProductStatus, VendorStatus } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export class CartService {
  static async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                category: {
                  select: { name: true }
                },
                images: {
                  take: 1,
                  orderBy: { isPrimary: 'desc' }
                },
                vendor: {
                  select: {
                    id: true,
                    businessName: true,
                    status: true,
                  }
                }
              }
            },
            variant: {
              include: {
                inventory: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  status: true,
                  category: { select: { name: true } },
                  images: { take: 1, orderBy: { isPrimary: 'desc' } },
                  vendor: { select: { id: true, businessName: true, status: true } }
                }
              },
              variant: {
                include: { inventory: true }
              }
            }
          }
        }
      });
    }

    // Filter out items where product or vendor is no longer active/approved
    const activeItems = cart.items.filter(item => 
      item.product.status === ProductStatus.APPROVED &&
      item.product.vendor.status === VendorStatus.APPROVED
    );

    // Group items by vendor
    const vendorGroups: Record<string, { vendor: any; items: any[]; subtotal: number }> = {};
    let grandSubtotal = 0;

    for (const item of activeItems) {
      const vId = item.product.vendor.id;
      if (!vendorGroups[vId]) {
        vendorGroups[vId] = {
          vendor: item.product.vendor,
          items: [],
          subtotal: 0,
        };
      }
      const itemTotal = Number(item.variant.price) * item.quantity;
      grandSubtotal += itemTotal;
      vendorGroups[vId].items.push(item);
      vendorGroups[vId].subtotal += itemTotal;
    }

    // Delivery charge calculation: free over ₹999 per vendor, else ₹50
    let totalDeliveryFee = 0;
    Object.values(vendorGroups).forEach(group => {
      if (group.subtotal > 0 && group.subtotal < 999) {
        totalDeliveryFee += 50;
      }
    });

    return {
      cartId: cart.id,
      items: activeItems,
      vendorGroups: Object.values(vendorGroups),
      itemCount: activeItems.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: grandSubtotal,
      deliveryFee: totalDeliveryFee,
      totalAmount: grandSubtotal + totalDeliveryFee,
    };
  }

  static async addItem(userId: string, productId: string, variantId: string, quantity: number) {
    if (quantity <= 0) {
      throw new AppError('Quantity must be at least 1.', 400);
    }

    // Verify product and variant
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true,
        variants: {
          where: { id: variantId },
          include: { inventory: true }
        }
      }
    });

    if (!product || product.status !== ProductStatus.APPROVED || product.vendor.status !== VendorStatus.APPROVED) {
      throw new AppError('Product is not available for purchase.', 400);
    }

    const variant = product.variants[0];
    if (!variant) {
      throw new AppError('Product variant not found.', 404);
    }

    const availableStock = (variant.inventory?.stockQuantity || 0) - (variant.inventory?.reservedQuantity || 0);
    if (availableStock < quantity) {
      throw new AppError(`Only ${availableStock} units available in stock.`, 400);
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        }
      }
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (availableStock < newQty) {
        throw new AppError(`Cannot add more. Only ${availableStock} units available in stock.`, 400);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        }
      });
    }

    return this.getOrCreateCart(userId);
  }

  static async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('Cart not found.', 404);

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
      include: {
        variant: { include: { inventory: true } }
      }
    });

    if (!item) throw new AppError('Cart item not found.', 404);

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      const availableStock = (item.variant.inventory?.stockQuantity || 0) - (item.variant.inventory?.reservedQuantity || 0);
      if (availableStock < quantity) {
        throw new AppError(`Only ${availableStock} units available in stock.`, 400);
      }

      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity }
      });
    }

    return this.getOrCreateCart(userId);
  }

  static async removeItem(userId: string, cartItemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('Cart not found.', 404);

    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, cartId: cart.id }
    });

    return this.getOrCreateCart(userId);
  }

  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
}

