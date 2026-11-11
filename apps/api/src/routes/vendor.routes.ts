import { Router } from 'express';
import { ProductCreateSchema, UserRole } from '@krishiconnect/shared';
import { VendorService } from '../services/vendor.service';
import { authenticate, requireRole, requireVerifiedVendor } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(requireRole([UserRole.VENDOR]));

router.get('/profile', async (req, res, next) => {
  try {
    const profile = await VendorService.getVendorProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const updated = await VendorService.updateVendorProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Vendor profile updated.', data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/documents', async (req, res, next) => {
  try {
    const { documentType, documentUrl, fileName, fileSize } = req.body;
    if (!documentType || !documentUrl || !fileName) {
      return res.status(400).json({ success: false, message: 'Missing document fields' });
    }
    const doc = await VendorService.uploadDocument(
      req.user!.vendorProfileId!,
      documentType,
      documentUrl,
      fileName,
      fileSize
    );
    res.status(201).json({ success: true, message: 'Document uploaded.', data: doc });
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await VendorService.getVendorProducts(req.user!.vendorProfileId!);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

router.post('/products', requireVerifiedVendor, validateRequest(ProductCreateSchema), async (req, res, next) => {
  try {
    const product = await VendorService.createProduct(req.user!.vendorProfileId!, req.body);
    res.status(201).json({
      success: true,
      message: 'Product submitted for administrative review.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/inventory/:variantId', requireVerifiedVendor, async (req, res, next) => {
  try {
    const { stockQuantity } = req.body;
    if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative stock quantity required' });
    }
    const updated = await VendorService.updateInventoryStock(
      req.user!.vendorProfileId!,
      req.params.variantId,
      stockQuantity
    );
    res.json({ success: true, message: 'Inventory updated.', data: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', async (req, res, next) => {
  try {
    const analytics = await VendorService.getVendorAnalytics(req.user!.vendorProfileId!);
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

export default router;

