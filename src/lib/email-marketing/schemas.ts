import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().max(500).optional(),
  previewText: z.string().max(500).optional(),
  category: z.enum(['newsletter', 'promotional', 'transactional', 'welcome']).optional(),
  jsonContent: z.record(z.string(), z.unknown()).optional(),
  htmlContent: z.string().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().max(500).optional(),
  previewText: z.string().max(500).optional(),
  category: z.enum(['newsletter', 'promotional', 'transactional', 'welcome']).optional(),
  jsonContent: z.record(z.string(), z.unknown()).optional(),
  htmlContent: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  templateId: z.string().optional(),
  subject: z.string().min(1).max(500),
  previewText: z.string().max(500).optional(),
  fromName: z.string().min(1).max(255),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional(),
  listId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  templateId: z.string().optional(),
  subject: z.string().min(1).max(500).optional(),
  previewText: z.string().max(500).optional(),
  fromName: z.string().min(1).max(255).optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  listId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const createListSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export const addMembersSchema = z.object({
  contactIds: z.array(z.string()).min(1),
});
