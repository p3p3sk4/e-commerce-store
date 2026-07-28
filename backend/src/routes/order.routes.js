import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { checkout, listMyOrders, getMyOrder, uploadProof } from '../controllers/order.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', checkout);
router.get('/', listMyOrders);
router.get('/:id', getMyOrder);
router.post('/:id/proof', upload.single('proof'), uploadProof);

export default router;
