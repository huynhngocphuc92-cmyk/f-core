import { z } from "zod";

// ============================================
// Report Definition Sub-schemas
// ============================================

const metricSchema = z.object({
  field: z.string().min(1),
  aggregate: z.enum(["count", "sum", "avg", "min", "max"]),
  label: z.string().optional(),
});

const dimensionSchema = z.object({
  field: z.string().min(1),
  type: z.enum(["temporal", "categorical"]),
  granularity: z.enum(["day", "week", "month", "quarter", "year"]).optional(),
  label: z.string().optional(),
});

const filterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in", "notIn", "isNull", "isNotNull"]),
  value: z.any(),
});

const chartSchema = z.object({
  chartType: z.enum(["bar", "line", "area", "pie", "number", "table"]),
  stacked: z.boolean().optional(),
  showLegend: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  colors: z.array(z.string()).optional(),
});

const dateRangeSchema = z.object({
  type: z.enum(["preset", "custom"]),
  preset: z.enum(["today", "yesterday", "last7", "last30", "last90", "thisMonth", "lastMonth", "thisQuarter", "thisYear"]).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  dateField: z.string().default("createdAt"),
});

const reportDefinitionSchema = z.object({
  dataSource: z.enum(["deals", "contacts", "companies", "activities"]),
  metrics: z.array(metricSchema).min(1),
  dimensions: z.array(dimensionSchema).default([]),
  filters: z.array(filterSchema).default([]),
  chart: chartSchema,
  dateRange: dateRangeSchema.optional(),
});

// ============================================
// Report Schemas
// ============================================

export const createReportSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(["sales", "marketing", "service", "custom"]).optional(),
  definition: reportDefinitionSchema,
  isFavorite: z.boolean().optional(),
});

export const updateReportSchema = createReportSchema.partial();

// ============================================
// Dashboard Schemas
// ============================================

export const createDashboardSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const updateDashboardSchema = createDashboardSchema.partial();

// ============================================
// Widget Schemas
// ============================================

export const addWidgetSchema = z.object({
  reportId: z.string().uuid(),
  title: z.string().min(1).max(255),
  x: z.number().int().min(0).default(0),
  y: z.number().int().min(0).default(0),
  w: z.number().int().min(1).max(12).default(6),
  h: z.number().int().min(1).max(12).default(4),
});

export const updateWidgetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  x: z.number().int().min(0).optional(),
  y: z.number().int().min(0).optional(),
  w: z.number().int().min(1).max(12).optional(),
  h: z.number().int().min(1).max(12).optional(),
});

// ============================================
// Type exports
// ============================================

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>;
export type AddWidgetInput = z.infer<typeof addWidgetSchema>;
export type ReportDefinition = z.infer<typeof reportDefinitionSchema>;
