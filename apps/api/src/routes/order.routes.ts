import { Router } from 'express';
import { CheckoutRequestSchema, UpdateOrderStatusSchema, UserRole, VendorStatus } from '@krishiconnect/shared';
import { OrderService } from '../services/order.service';
import { authenticate, forbidVendorBuying, requireRole, requireVerifiedVendor } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post('/', forbidVendorBuying, validateRequest(CheckoutRequestSchema), async (req, res, next) => {
  try {
    const order = await OrderService.createOrderFromCart({
      userId: req.user!.id,
      addressId: req.body.addressId,
      paymentMethod: req.body.paymentMethod,
      couponCode: req.body.couponCode,
      customerNotes: req.body.customerNotes,
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/customer', forbidVendorBuying, async (req, res, next) => {
  try {
    const orders = await OrderService.getCustomerOrders(req.user!.id);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

router.get('/vendor', requireRole([UserRole.VENDOR]), requireVerifiedVendor, async (req, res, next) => {
  try {
    if (!req.user!.vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor profile not found' });
    }
    const orders = await OrderService.getVendorOrders(req.user!.vendorProfileId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const isVendorOrAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.VENDOR;
    const order = await OrderService.getOrderDetails(req.params.id, isVendorOrAdmin ? undefined : req.user!.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/vendor/:vendorOrderId/status',
  requireRole([UserRole.VENDOR, UserRole.ADMIN]),
  validateRequest(UpdateOrderStatusSchema),
  async (req, res, next) => {
    try {
      if (req.user!.role === UserRole.VENDOR && req.user!.vendorStatus !== VendorStatus.APPROVED) {
        return res.status(403).json({
          success: false,
          message: 'Shop owner verification required to manage orders.',
        });
      }
      const updated = await OrderService.updateVendorOrderStatus(
        req.user!.vendorProfileId!,
        req.params.vendorOrderId,
        req.body.status,
        req.body.trackingNumber,
        req.body.carrierName
      );
      res.json({
        success: true,
        message: `Order status updated to ${req.body.status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

