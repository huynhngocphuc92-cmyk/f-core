import { z } from "zod";

// ============================================
// Helpers
// ============================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================
// Enums
// ============================================

export const kbArticleStatusEnum = z.enum(["draft", "published", "archived"]);

// ============================================
// Category Schemas
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isVisible: z.boolean().optional(),
});

// ============================================
// Article Schemas
// ============================================

export const createArticleSchema = z.object({
  title: z.string().min(1).max(500),
  subtitle: z.string().max(500).optional().nullable(),
  excerpt: z.string().max(2000).optional().nullable(),
  contentJson: z.unknown().optional(),
  contentHtml: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: kbArticleStatusEnum.optional(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
});

export const updateArticleSchema = createArticleSchema.partial();

// ============================================
// Feedback Schema
// ============================================

export const feedbackSchema = z.object({
  isHelpful: z.boolean(),
  comment: z.string().max(2000).optional(),
  visitorId: z.string().max(255).optional(),
});

// ============================================
// Slug Generator (exported for route usage)
// ============================================

export { slugify };

// ============================================
// Type exports
// ============================================

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
