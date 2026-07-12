import { z } from 'zod';

const dateSchema = z.preprocess((arg) => {
  if (arg === '' || arg === null || arg === undefined) return undefined;
  const d = new Date(arg as any);
  return isNaN(d.getTime()) ? undefined : d;
}, z.date());

export const updateStudentProfileSchema = z.object({
  department: z.string().min(2, 'Department name is too short').max(100).optional(),
  batch: z.string().min(4, 'Batch year is too short').max(10).optional(),
  CGPA: z.number().min(0, 'CGPA cannot be negative').max(10, 'CGPA cannot exceed 10').optional(),
  backlogs: z.number().min(0, 'Backlogs cannot be negative').optional(),
  skills: z.array(z.string()).optional(),
  certifications: z
    .array(
      z.object({
        name: z.string().min(1, 'Certification name is required'),
        organization: z.string().min(1, 'Organization is required'),
        issueDate: dateSchema,
        expirationDate: dateSchema.optional(),
        credentialId: z.string().optional(),
        credentialUrl: z.string().url('Invalid URL format').or(z.literal('')).optional(),
      })
    )
    .optional(),
  projects: z
    .array(
      z.object({
        title: z.string().min(1, 'Project title is required'),
        description: z.string().min(1, 'Project description is required'),
        technologiesUsed: z.array(z.string()),
        link: z.string().url('Invalid URL format').or(z.literal('')).optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string().min(1, 'Institution is required'),
        degree: z.string().min(1, 'Degree is required'),
        fieldOfStudy: z.string().min(1, 'Field of study is required'),
        startDate: dateSchema,
        endDate: dateSchema.optional(),
        percentageOrCGPA: z.number().min(0),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        company: z.string().min(1, 'Company name is required'),
        role: z.string().min(1, 'Role title is required'),
        description: z.string().min(1, 'Description is required'),
        startDate: dateSchema,
        endDate: dateSchema.optional(),
        isCurrent: z.boolean().default(false),
      })
    )
    .optional(),
});
