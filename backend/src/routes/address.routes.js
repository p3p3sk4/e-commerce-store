import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listAddresses, createAddress } from '../controllers/address.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listAddresses);
router.post('/', createAddress);

export default router;
