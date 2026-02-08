import { z } from 'zod';

export const triggerConfigSchema = z.object({
  type: z.enum(['property_change', 'record_created', 'form_submission', 'schedule', 'manual']),
  objectType: z.enum(['contact', 'company', 'deal']).optional(),
  property: z.string().optional(),
  operator: z.string().optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  reEnrollment: z.boolean().default(false),
  formId: z.string().optional(),
  cron: z.string().optional(),
  timezone: z.string().default('UTC'),
});

export const workflowStepSchema = z.object({
  id: z.string(),
  type: z.enum([
    'send_email', 'send_notification', 'create_task',
    'update_property', 'delay', 'if_then', 'webhook',
  ]),
  name: z.string().min(1).max(255),
  config: z.record(z.string(), z.unknown()),
  position: z.object({ x: z.number(), y: z.number() }),
  next: z.array(z.string()).optional(),
  nextTrue: z.array(z.string()).optional(),
  nextFalse: z.array(z.string()).optional(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  objectType: z.enum(['contact', 'company', 'deal']),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  triggerConfig: triggerConfigSchema.optional(),
  steps: z.array(workflowStepSchema).optional(),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(),
  settings: z.object({
    enrollmentType: z.enum(['once', 'multiple']).default('once'),
    suppressionLists: z.array(z.string()).default([]),
    goalCriteria: z.record(z.string(), z.unknown()).optional(),
    notifications: z.object({
      onError: z.boolean().default(true),
      onComplete: z.boolean().default(false),
    }).optional(),
  }).optional(),
});
