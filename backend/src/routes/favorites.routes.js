import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { addFavorite, listFavoriteIds, listFavorites, removeFavorite } from '../controllers/favorites.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listFavorites);
router.get('/ids', listFavoriteIds);
router.post('/:productId', addFavorite);
router.delete('/:productId', removeFavorite);

export default router;
