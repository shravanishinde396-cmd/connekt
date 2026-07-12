import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  website: z.string().url('Invalid website URL format'),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});

export const updateCompanySchema = createCompanySchema.partial();
