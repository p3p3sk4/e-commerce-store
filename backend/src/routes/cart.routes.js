import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller.js';

const router = Router();

router.use(authenticate); // la canasta siempre es del usuario autenticado

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:variantId', updateCartItem);
router.delete('/:variantId', removeCartItem);
router.delete('/', clearCart);

export default router;
