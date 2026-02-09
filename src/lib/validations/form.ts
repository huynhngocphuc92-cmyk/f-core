import { z } from "zod";

// ============================================
// Field type enum - matches Prisma FormField.type
// ============================================
export const fieldTypeEnum = z.enum([
  "text",
  "email",
  "phone",
  "number",
  "url",
  "textarea",
  "dropdown",
  "multi_select",
  "radio",
  "checkbox",
  "date",
  "file",
  "hidden",
  // Layout types (non-input)
  "heading",
  "paragraph",
  "divider",
  "spacer",
]);

export const LAYOUT_FIELD_TYPES = [
  "heading",
  "paragraph",
  "divider",
  "spacer",
] as const;

export const fieldWidthEnum = z.enum(["full", "half", "third"]);

export const formStatusEnum = z.enum(["draft", "published", "archived"]);

// ============================================
// Form Schemas
// ============================================

export const createFormSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  theme: z.record(z.string(), z.unknown()).optional(),
});

export const updateFormSchema = createFormSchema.partial().extend({
  status: formStatusEnum.optional(),
});

// ============================================
// Field Schemas
// ============================================

export const createFieldSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  label: z.string().min(1),
  type: fieldTypeEnum,
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.string().optional(),
  required: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  width: fieldWidthEnum.optional().default("full"),
  orderIndex: z.number().int().min(0).optional().default(0),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  validationRules: z.record(z.string(), z.unknown()).optional(),
  conditionalLogic: z.record(z.string(), z.unknown()).optional(),
});

export const updateFieldsSchema = z.object({
  fields: z.array(createFieldSchema),
});

// ============================================
// Submission Schema
// ============================================

export const submitFormSchema = z.record(z.string(), z.unknown());

// ============================================
// Type exports
// ============================================

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldsInput = z.infer<typeof updateFieldsSchema>;
