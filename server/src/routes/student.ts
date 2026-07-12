import { Router } from 'express';
import {
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
  getStudentDrives,
  applyToStudentDrive,
  analyzeResume,
} from '../controllers/student.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateStudentProfileSchema } from '../validators/student.js';
import { upload } from '../config/storage.js';

const router = Router();

// Apply auth and role-guard to all routes in this file
router.use(authenticateJWT as any);
router.use(requireRole(['student']) as any);

router.get('/profile', getStudentProfile as any);
router.put('/profile', validate(updateStudentProfileSchema), updateStudentProfile as any);
router.post('/resume', upload.single('resume'), uploadResume as any);
router.post('/profile/analyze-resume', analyzeResume as any);
router.get('/drives', getStudentDrives as any);
router.post('/drives/:driveId/apply', applyToStudentDrive as any);

export default router;
