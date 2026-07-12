import { Router } from 'express';
import {
  getRecruiterCompany,
  updateRecruiterCompany,
  getRecruiterDrives,
  getRecruiterDriveApplicants,
  updateRecruiterApplicantStatus,
} from '../controllers/recruiter.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateCompanySchema } from '../validators/company.js';

const router = Router();

// Secure all endpoints to recruiter and admin roles
router.use(authenticateJWT as any);
router.use(requireRole(['recruiter', 'admin']) as any);

// Company profile
router.get('/company', getRecruiterCompany as any);
router.put('/company', validate(updateCompanySchema), updateRecruiterCompany as any);

// Hiring drives
router.get('/drives', getRecruiterDrives as any);
router.get('/drives/:driveId/applicants', getRecruiterDriveApplicants as any);
router.put('/drives/:driveId/applicants/:applicantId/status', updateRecruiterApplicantStatus as any);

export default router;
