import { Router } from 'express';
import { UserRole, VendorVerificationDecisionSchema, ProductReviewDecisionSchema, FarmerVerificationDecisionSchema, VendorStatus } from '@krishiconnect/shared';
import { AdminService } from '../services/admin.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(requireRole([UserRole.ADMIN]));

router.get('/metrics', async (req, res, next) => {
  try {
    const metrics = await AdminService.getPlatformMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

router.get('/farmers', async (req, res, next) => {
  try {
    const status = req.query.status as any;
    const farmers = await AdminService.getFarmers(status);
    res.json({ success: true, data: farmers });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/farmers/:farmerProfileId/review',
  validateRequest(FarmerVerificationDecisionSchema),
  async (req, res, next) => {
    try {
      const { status, remarks } = req.body;
      const updated = await AdminService.reviewFarmer(req.user!.id, req.params.farmerProfileId, status, remarks);
      res.json({
        success: true,
        message: `Farmer verification updated to ${status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/vendors', async (req, res, next) => {
  try {
    const status = req.query.status as any;
    const vendors = await AdminService.getVendors(status);
    res.json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/vendors/:vendorId/review',
  validateRequest(VendorVerificationDecisionSchema),
  async (req, res, next) => {
    try {
      const { status, remarks } = req.body;
      const updated = await AdminService.reviewVendor(req.user!.id, req.params.vendorId, status, remarks);
      res.json({
        success: true,
        message: `Vendor verification updated to ${status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/vendors/:vendorId/suspend', async (req, res, next) => {
  try {
    const remarks = req.body.remarks || 'Suspended by Administrator';
    const updated = await AdminService.reviewVendor(req.user!.id, req.params.vendorId, VendorStatus.SUSPENDED, remarks);
    res.json({
      success: true,
      message: 'Vendor has been suspended',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/vendors/:vendorId/reactivate', async (req, res, next) => {
  try {
    const remarks = req.body.remarks || 'Reactivated by Administrator';
    const updated = await AdminService.reviewVendor(req.user!.id, req.params.vendorId, VendorStatus.APPROVED, remarks);
    res.json({
      success: true,
      message: 'Vendor has been reactivated',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/products/review', async (req, res, next) => {
  try {
    const status = req.query.status as any;
    const products = await AdminService.getProductsForReview(status);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/products/:productId/review',
  validateRequest(ProductReviewDecisionSchema),
  async (req, res, next) => {
    try {
      const { status, remarks } = req.body;
      const updated = await AdminService.reviewProduct(req.user!.id, req.params.productId, status, remarks);
      res.json({
        success: true,
        message: `Product review status updated to ${status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await AdminService.getAuditLogs(page, limit);
    res.json({ success: true, data: result.logs, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

export default router;

