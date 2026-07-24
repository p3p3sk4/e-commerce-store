import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  createCategory,
  createBrand,
  createProduct,
  updateProduct,
  deactivateProduct,
  addVariant,
  updateVariant,
  deactivateVariant,
  addImage,
  deleteImage,
} from '../controllers/admin/products.admin.controller.js';

const router = Router();

// Todas las rutas de este archivo requieren estar autenticado Y tener rol admin
router.use(authenticate, requireAdmin);

router.post('/categories', createCategory);
router.post('/brands', createBrand);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deactivateProduct); // soft delete (is_active = false)

router.post('/products/:id/variants', addVariant);
router.put('/variants/:variantId', updateVariant);
router.delete('/variants/:variantId', deactivateVariant); // soft delete

router.post('/products/:id/images', addImage);
router.delete('/images/:imageId', deleteImage);

export default router;
