import { Router } from 'express';
import { InitiateCallSchema } from '@krishiconnect/shared';
import { CallService } from '../services/call.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post('/initiate', validateRequest(InitiateCallSchema), async (req, res, next) => {
  try {
    const { recipientId, subject } = req.body;
    const session = await CallService.initiateCall(req.user!.id, recipientId, subject);
    res.status(201).json({
      success: true,
      message: session.message,
      data: session,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/status', async (req, res, next) => {
  try {
    const { sessionSid, status, durationSec } = req.body;
    if (!sessionSid || !status) {
      return res.status(400).json({ success: false, message: 'sessionSid and status are required' });
    }
    const updated = await CallService.updateCallStatus(sessionSid, status, durationSec || 0);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const history = await CallService.getCallHistory(req.user!.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

export default router;

