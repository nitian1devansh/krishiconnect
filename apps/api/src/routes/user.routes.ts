import { Router } from 'express';
import { AddressSchema, UpdateProfileSchema, ChangePasswordSchema } from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { authenticate, forbidVendorBuying } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { AuthService } from '../services/auth.service';

const router = Router();

router.use(authenticate);

router.get('/profile', async (req, res, next) => {
  try {
    const profile = await AuthService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', validateRequest(UpdateProfileSchema), async (req, res, next) => {
  try {
    const updated = await AuthService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', validateRequest(ChangePasswordSchema), async (req, res, next) => {
  try {
    if (req.body.confirmPassword && req.body.newPassword !== req.body.confirmPassword) {
      throw new AppError('New passwords do not match.', 400);
    }
    const result = await AuthService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { isDefault: 'desc' }
    });
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
});

router.post('/addresses', validateRequest(AddressSchema), async (req, res, next) => {
  try {
    const { name, phone, street, villageOrLocality, city, district, state, pincode, isDefault, addressType } = req.body;

    if (isDefault) {
      // Unset previous defaults
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user!.id,
        name,
        phone,
        street,
        villageOrLocality,
        city,
        district,
        state,
        pincode,
        isDefault,
        addressType,
      }
    });

    res.status(201).json({ success: true, message: 'Address saved', data: address });
  } catch (err) {
    next(err);
  }
});

const wishlistProductInclude = {
  images: { orderBy: { isPrimary: 'desc' as const } },
  variants: {
    include: { inventory: true },
    orderBy: { price: 'asc' as const },
  },
  category: true,
  vendor: {
    select: {
      id: true,
      businessName: true,
      storeSlug: true,
      city: true,
      state: true,
    },
  },
};

router.patch('/addresses/:id/default', async (req, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!existing) {
      throw new AppError('Address not found.', 404);
    }

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: req.params.id },
        data: { isDefault: true },
      }),
    ]);

    res.json({ success: true, message: 'Default delivery address updated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/addresses/:id', async (req, res, next) => {
  try {
    await prisma.address.deleteMany({
      where: { id: req.params.id, userId: req.user!.id }
    });
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/wishlist', forbidVendorBuying, async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: wishlistProductInclude,
        },
      },
    });
    res.json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
});

router.post('/wishlist/:productId', forbidVendorBuying, async (req, res, next) => {
  try {
    const productExists = await prisma.product.findUnique({
      where: { id: req.params.productId },
      select: { id: true },
    });

    if (!productExists) {
      throw new AppError('Product not found in database catalog.', 404);
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId: req.params.productId,
        }
      },
      create: {
        userId: req.user!.id,
        productId: req.params.productId,
      },
      update: {},
      include: {
        product: {
          include: wishlistProductInclude,
        },
      },
    });
    res.status(201).json({ success: true, message: 'Added to wishlist', data: item });
  } catch (err) {
    next(err);
  }
});

router.delete('/wishlist/:productId', forbidVendorBuying, async (req, res, next) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user!.id,
        productId: req.params.productId,
      }
    });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    next(err);
  }
});

export default router;

