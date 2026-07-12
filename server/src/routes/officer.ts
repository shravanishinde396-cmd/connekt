import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getOfficerDrives,
  getOfficerDriveById,
  createOfficerDrive,
  updateOfficerDrive,
  deleteOfficerDrive,
  getDriveApplicants,
  updateApplicantStatus,
  getOfficerAnalytics,
  getSalaryStats,
  exportPlacedStudentsCSV,
} from '../controllers/officer.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createCompanySchema, updateCompanySchema } from '../validators/company.js';
import { createDriveSchema, updateDriveSchema } from '../validators/drive.js';

const router = Router();

// Secure all endpoints to placement officer and admin roles
router.use(authenticateJWT as any);
router.use(requireRole(['placement_officer', 'admin']) as any);

// Analytics & Reports
router.get('/analytics', getOfficerAnalytics as any);
router.get('/reports/salary-stats', getSalaryStats as any);
router.get('/reports/export-csv', exportPlacedStudentsCSV as any);

// Companies CRUD
router.get('/companies', getCompanies as any);
router.get('/companies/:companyId', getCompanyById as any);
router.post('/companies', validate(createCompanySchema), createCompany as any);
router.put('/companies/:companyId', validate(updateCompanySchema), updateCompany as any);
router.delete('/companies/:companyId', deleteCompany as any);

// Placement Drives CRUD
router.get('/drives', getOfficerDrives as any);
router.get('/drives/:driveId', getOfficerDriveById as any);
router.post('/drives', validate(createDriveSchema), createOfficerDrive as any);
router.put('/drives/:driveId', validate(updateDriveSchema), updateOfficerDrive as any);
router.delete('/drives/:driveId', deleteOfficerDrive as any);

// Applicant Pipeline Management
router.get('/drives/:driveId/applicants', getDriveApplicants as any);
router.put('/drives/:driveId/applicants/:applicantId/status', updateApplicantStatus as any);

export default router;
