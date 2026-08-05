import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadProductImage } from '../middleware/uploadProductImage.js';
import {
  createCategory,
  createBrand,
  updateCategory,
  updateBrand,
  listProductImages,
  createProduct,
  updateProduct,
  deactivateProduct,
  addVariant,
  updateVariant,
  deactivateVariant,
  addImage,
  uploadProductImageFile,
  deleteImage,
} from '../controllers/admin/products.admin.controller.js';
import {
  listOrdersAdmin,
  getOrderAdmin,
  completeOrder,
  cancelOrder,
} from '../controllers/admin/orders.admin.controller.js';
import { listCustomers, exportCustomers } from '../controllers/admin/customers.admin.controller.js';

const router = Router();

// Todas las rutas de este archivo requieren estar autenticado Y tener rol admin
router.use(authenticate, requireAdmin);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deactivateProduct); // soft delete (is_active = false)

router.post('/products/:id/variants', addVariant);
router.put('/variants/:variantId', updateVariant);
router.delete('/variants/:variantId', deactivateVariant); // soft delete

router.post('/products/:id/images', addImage);
router.post('/products/:id/images/upload', uploadProductImage.single('image'), uploadProductImageFile);
router.get('/products/:id/images', listProductImages);
router.delete('/images/:imageId', deleteImage);

router.get('/orders', listOrdersAdmin);
router.get('/orders/:id', getOrderAdmin);
router.put('/orders/:id/complete', completeOrder);
router.put('/orders/:id/cancel', cancelOrder);

router.get('/customers', listCustomers);
router.get('/customers/export', exportCustomers);

export default router;
