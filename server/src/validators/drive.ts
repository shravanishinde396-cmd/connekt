import { z } from 'zod';

export const createDriveSchema = z.object({
  companyId: z.string().min(1, 'Company selection is required'),
  role: z.string().min(2, 'Job role description is required'),
  packageLPA: z.number().positive('Package CTC must be a positive number'),
  cgpaCutoff: z.number().min(0).max(10, 'CGPA cutoff must be between 0.0 and 10.0'),
  backlogCutoff: z.number().min(0, 'Maximum backlogs cutoff must be 0 or greater'),
  allowedDepartments: z.array(z.string()).nonempty('At least one department must be permitted'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format',
  }),
  status: z.enum(['Active', 'Closed']).optional(),
});

export const updateDriveSchema = createDriveSchema.partial();
