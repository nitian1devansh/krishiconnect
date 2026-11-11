import { Router } from 'express';
import { AddToCartSchema, UpdateCartItemSchema } from '@krishiconnect/shared';
import { CartService } from '../services/cart.service';
import { authenticate, forbidVendorBuying } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(forbidVendorBuying);

router.get('/', async (req, res, next) => {
  try {
    const cart = await CartService.getOrCreateCart(req.user!.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
});

router.post('/items', validateRequest(AddToCartSchema), async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const cart = await CartService.addItem(req.user!.id, productId, variantId, quantity);
    res.json({ success: true, message: 'Item added to cart', data: cart });
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:id', validateRequest(UpdateCartItemSchema), async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await CartService.updateQuantity(req.user!.id, req.params.id, quantity);
    res.json({ success: true, message: 'Cart updated', data: cart });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:id', async (req, res, next) => {
  try {
    const cart = await CartService.removeItem(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Item removed from cart', data: cart });
  } catch (err) {
    next(err);
  }
});

router.delete('/clear', async (req, res, next) => {
  try {
    await CartService.clearCart(req.user!.id);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
});

export default router;

