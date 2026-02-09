import { z } from "zod";

export const ticketPriorities = ["low", "medium", "high", "urgent"] as const;
export const ticketStatuses = ["open", "in_progress", "waiting", "resolved", "closed"] as const;
export const ticketCategories = ["bug", "feature_request", "question", "billing", "other"] as const;
export const ticketSources = ["web", "email", "chat", "phone", "api"] as const;

export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(10000).optional(),
  priority: z.enum(ticketPriorities).default("medium"),
  category: z.enum(ticketCategories).optional(),
  source: z.enum(ticketSources).default("web"),
  contactId: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
  assignedToUserId: z.string().min(1).optional(),
  pipelineId: z.string().min(1).optional(),
  stageId: z.string().min(1).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  priority: z.enum(ticketPriorities).optional(),
  status: z.enum(ticketStatuses).optional(),
  category: z.enum(ticketCategories).optional(),
  contactId: z.string().min(1).nullable().optional(),
  companyId: z.string().min(1).nullable().optional(),
  assignedToUserId: z.string().min(1).nullable().optional(),
  stageId: z.string().min(1).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const createTicketCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(10000),
  isInternal: z.boolean().default(false),
});

export const createTicketPipelineSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  stages: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]),
    color: z.string().optional(),
  })).min(1, "At least one stage is required"),
});

export const updateTicketPipelineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  stages: z.array(z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1),
    type: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]),
    color: z.string().optional(),
    displayOrder: z.number().int().min(0),
  })).optional(),
});

export const createSLAPolicySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  priority: z.enum(ticketPriorities),
  firstResponseTime: z.number().int().positive(),
  nextResponseTime: z.number().int().positive().optional(),
  resolutionTime: z.number().int().positive(),
  businessHoursOnly: z.boolean().default(true),
  businessHoursStart: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  businessHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
  businessDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  timezone: z.string().default("Asia/Ho_Chi_Minh"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;
export type CreateTicketPipelineInput = z.infer<typeof createTicketPipelineSchema>;
export type UpdateTicketPipelineInput = z.infer<typeof updateTicketPipelineSchema>;
export type CreateSLAPolicyInput = z.infer<typeof createSLAPolicySchema>;
