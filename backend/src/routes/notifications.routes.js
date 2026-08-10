import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

export default router;
