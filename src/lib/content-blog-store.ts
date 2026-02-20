import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const blogPostStatusSchema = z.enum([
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
]);

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(220),
  slug: z.string().min(1).max(220).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).max(50000),
  scheduledAt: z.string().datetime().optional(),
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(220).optional(),
  slug: z.string().min(1).max(220).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).max(50000).optional(),
  action: z
    .enum(["save_draft", "submit_review", "approve", "schedule", "publish_now", "archive"])
    .optional(),
  scheduledAt: z.string().datetime().optional(),
});

export type BlogPost = {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: z.infer<typeof blogPostStatusSchema>;
  authorId: string;
  reviewerId: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}

function normalizePost(record: {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  authorId: string;
  reviewerId: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BlogPost {
  return {
    id: record.id,
    tenantId: record.tenantId,
    title: record.title,
    slug: record.slug,
    excerpt: record.excerpt,
    content: record.content,
    status: blogPostStatusSchema.parse(record.status),
    authorId: record.authorId,
    reviewerId: record.reviewerId,
    scheduledAt: record.scheduledAt?.toISOString() || null,
    publishedAt: record.publishedAt?.toISOString() || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getPostOrThrow(tenantId: string, postId: string) {
  const post = await prisma.contentBlogPost.findFirst({
    where: {
      tenantId,
      id: postId,
    },
  });

  if (!post) {
    throw new Error("Blog post not found");
  }

  return post;
}

export async function listBlogPosts(tenantId: string): Promise<BlogPost[]> {
  const rows = await prisma.contentBlogPost.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(normalizePost);
}

export async function getBlogPost(tenantId: string, postId: string): Promise<BlogPost | null> {
  const post = await prisma.contentBlogPost.findFirst({
    where: {
      tenantId,
      id: postId,
    },
  });
  return post ? normalizePost(post) : null;
}

export async function createBlogPost(
  tenantId: string,
  authorId: string,
  payload: z.infer<typeof createBlogPostSchema>
): Promise<BlogPost> {
  const created = await prisma.contentBlogPost.create({
    data: {
      id: randomUUID(),
      tenantId,
      title: payload.title,
      slug: normalizeSlug(payload.slug || payload.title),
      excerpt: payload.excerpt || null,
      content: payload.content,
      status: payload.scheduledAt ? "scheduled" : "draft",
      authorId,
      reviewerId: null,
      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
      publishedAt: null,
    },
  });

  return normalizePost(created);
}

export async function updateBlogPost(
  tenantId: string,
  postId: string,
  userId: string,
  payload: z.infer<typeof updateBlogPostSchema>
): Promise<BlogPost> {
  const post = await getPostOrThrow(tenantId, postId);
  const now = nowIso();
  const next: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string;
    status?: z.infer<typeof blogPostStatusSchema>;
    reviewerId?: string | null;
    scheduledAt?: Date | null;
    publishedAt?: Date | null;
    updatedAt?: Date;
  } = {};

  if (payload.title !== undefined) next.title = payload.title;
  if (payload.slug !== undefined) next.slug = normalizeSlug(payload.slug);
  if (payload.excerpt !== undefined) next.excerpt = payload.excerpt;
  if (payload.content !== undefined) next.content = payload.content;

  if (payload.action === "save_draft") {
    next.status = "draft";
    next.scheduledAt = null;
  }

  if (payload.action === "submit_review") {
    next.status = "in_review";
  }

  if (payload.action === "approve") {
    if (post.status !== "in_review") {
      throw new Error("Only posts in review can be approved");
    }
    next.status = "draft";
    next.reviewerId = userId;
  }

  if (payload.action === "schedule") {
    if (!payload.scheduledAt) {
      throw new Error("scheduledAt is required for schedule action");
    }
    next.status = "scheduled";
    next.scheduledAt = new Date(payload.scheduledAt);
    next.publishedAt = null;
  }

  if (payload.action === "publish_now") {
    next.status = "published";
    next.scheduledAt = null;
    next.publishedAt = new Date(now);
  }

  if (payload.action === "archive") {
    next.status = "archived";
  }

  next.updatedAt = new Date(now);

  const updated = await prisma.contentBlogPost.update({
    where: { id: post.id },
    data: next,
  });

  return normalizePost(updated);
}

export function summarizeBlogPosts(posts: BlogPost[]) {
  const summary = {
    total: posts.length,
    draft: 0,
    in_review: 0,
    scheduled: 0,
    published: 0,
    archived: 0,
  };

  for (const post of posts) {
    summary[post.status] += 1;
  }

  return summary;
}

export async function resetBlogStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.contentBlogPost.deleteMany();
}
