import { Router } from 'express';
import {
  getUsers,
  updateUserRole,
  getActivityLogs,
} from '../controllers/admin.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';

const router = Router();

// Apply JWT authentication and Admin role guard
router.use(authenticateJWT as any);
router.use(requireRole(['admin']) as any);

// Administration management
router.get('/users', getUsers as any);
router.put('/users/:userId/role', updateUserRole as any);

// Audit logging
router.get('/logs', getActivityLogs as any);

export default router;
