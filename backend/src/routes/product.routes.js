import { Router } from 'express';
import { listProducts, getProduct, listCategories, listBrands } from '../controllers/product.controller.js';

const router = Router();

router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.get('/categories', listCategories);
router.get('/brands', listBrands);

export default router;
