import { Router } from 'express';
import { SendMessageSchema } from '@krishiconnect/shared';
import { ChatService } from '../services/chat.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await ChatService.getUserConversations(req.user!.id);
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
});

router.post('/conversations', async (req, res, next) => {
  try {
    const { recipientId, productId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId is required' });
    }
    const conversation = await ChatService.getOrCreateConversation(req.user!.id, recipientId, productId);
    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
});

router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const messages = await ChatService.getMessages(req.params.id, req.user!.id, limit);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

router.post('/conversations/:id/messages', validateRequest(SendMessageSchema), async (req, res, next) => {
  try {
    const { content, attachmentUrl } = req.body;
    const message = await ChatService.sendMessage(req.params.id, req.user!.id, content, attachmentUrl);
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

export default router;

