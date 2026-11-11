import { Router } from 'express';
import { CreateQuotationRequestSchema, SubmitVendorQuotationSchema, UserRole } from '@krishiconnect/shared';
import { QuotationService } from '../services/quotation.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post('/requests', validateRequest(CreateQuotationRequestSchema), async (req, res, next) => {
  try {
    const request = await QuotationService.createRequest(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Bulk quotation request broadcasted to suppliers.',
      data: request,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/requests/customer', async (req, res, next) => {
  try {
    const requests = await QuotationService.getCustomerRequests(req.user!.id);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

router.get('/requests/vendor', requireRole([UserRole.VENDOR]), async (req, res, next) => {
  try {
    const requests = await QuotationService.getVendorOpenRequests(req.user!.vendorProfileId!);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/requests/:id/quote',
  requireRole([UserRole.VENDOR]),
  validateRequest(SubmitVendorQuotationSchema),
  async (req, res, next) => {
    try {
      const quotation = await QuotationService.submitVendorQuote(
        req.user!.vendorProfileId!,
        req.params.id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Quotation submitted to customer.',
        data: quotation,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/quotes/:id/accept', async (req, res, next) => {
  try {
    const result = await QuotationService.acceptQuotation(req.user!.id, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

