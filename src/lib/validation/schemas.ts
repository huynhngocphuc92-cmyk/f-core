import { z } from 'zod';

/**
 * Contact validation schema
 */
export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  companyId: z.string().uuid('Invalid company ID').optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Contact update schema (all fields optional)
 */
export const contactUpdateSchema = contactSchema.partial();

/**
 * Company validation schema
 */
export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  domain: z.string().max(200).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
});

/**
 * Company update schema (all fields optional)
 */
export const companyUpdateSchema = companySchema.partial();

/**
 * Deal validation schema
 */
export const dealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(200),
  value: z.number().nonnegative('Deal value must be non-negative').optional().nullable(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']),
  contactId: z.string().uuid('Invalid contact ID').optional().nullable(),
  companyId: z.string().uuid('Invalid company ID').optional().nullable(),
  expectedCloseDate: z.string().datetime('Invalid date format').optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Deal update schema (all fields optional except stage validation)
 */
export const dealUpdateSchema = dealSchema.partial();

/**
 * Activity validation schema
 */
export const activitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
  title: z.string().min(1, 'Activity title is required').max(200),
  description: z.string().optional().nullable(),
  contactId: z.string().uuid('Invalid contact ID').optional().nullable(),
  companyId: z.string().uuid('Invalid company ID').optional().nullable(),
  dealId: z.string().uuid('Invalid deal ID').optional().nullable(),
  dueDate: z.string().datetime('Invalid date format').optional().nullable(),
  completed: z.boolean().default(false),
});

/**
 * Activity update schema
 */
export const activityUpdateSchema = activitySchema.partial();

/**
 * Generic validation helper
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
