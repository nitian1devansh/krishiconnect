import { Router } from 'express';
import { VerifyPaymentSchema } from '@krishiconnect/shared';
import { PaymentService } from '../services/payment.service';
import { authenticate, forbidVendorBuying } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(forbidVendorBuying);

router.post('/create-order', async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const paymentData = await PaymentService.createPaymentOrder(orderId, req.user!.id);
    res.json({
      success: true,
      message: 'Payment order initiated.',
      data: paymentData,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/verify', validateRequest(VerifyPaymentSchema), async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result = await PaymentService.verifyPayment(
      orderId,
      razorpayOrderId || `sandbox_order_${Date.now()}`,
      razorpayPaymentId || `sandbox_pay_${Date.now()}`,
      razorpaySignature || `sandbox_sig_${Date.now()}`
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

