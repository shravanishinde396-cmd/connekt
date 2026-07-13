import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

// Secure all endpoints
router.use(authenticateJWT as any);

router.get('/', getNotifications as any);
router.put('/read-all', markAllAsRead as any);
router.put('/:id/read', markAsRead as any);
router.delete('/:id', deleteNotification as any);

export default router;
