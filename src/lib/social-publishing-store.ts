import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const socialChannelSchema = z.enum(["facebook", "instagram", "linkedin", "x"]);
export const socialPostStatusSchema = z.enum(["draft", "scheduled", "published", "failed", "canceled"]);

export const createSocialPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  channels: z.array(socialChannelSchema).min(1),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
});

export const updateSocialPostSchema = z.object({
  action: z.enum(["schedule", "publish_now", "mark_failed", "cancel"]),
  scheduledAt: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

export type SocialPost = {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  channels: Array<z.infer<typeof socialChannelSchema>>;
  status: z.infer<typeof socialPostStatusSchema>;
  scheduledAt: string | null;
  publishedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function parseStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseChannelArray(value: Prisma.JsonValue | null | undefined): SocialPost["channels"] {
  return parseStringArray(value).map((item) => socialChannelSchema.parse(item));
}

function normalizeSocialPost(record: {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  channels: Prisma.JsonValue;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  tags: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): SocialPost {
  return {
    id: record.id,
    tenantId: record.tenantId,
    title: record.title,
    content: record.content,
    channels: parseChannelArray(record.channels),
    status: socialPostStatusSchema.parse(record.status),
    scheduledAt: toIso(record.scheduledAt),
    publishedAt: toIso(record.publishedAt),
    failedAt: toIso(record.failedAt),
    failureReason: record.failureReason,
    tags: parseStringArray(record.tags),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getPostOrThrow(tenantId: string, id: string) {
  const post = await prisma.marketingSocialPost.findFirst({
    where: {
      tenantId,
      id,
    },
  });

  if (!post) {
    throw new Error("Social post not found");
  }

  return post;
}

export async function listSocialPosts(tenantId: string): Promise<SocialPost[]> {
  const rows = await prisma.marketingSocialPost.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(normalizeSocialPost);
}

export async function createSocialPost(
  tenantId: string,
  input: z.infer<typeof createSocialPostSchema>
): Promise<SocialPost> {
  const status: SocialPost["status"] = input.scheduledAt ? "scheduled" : "draft";

  const post = await prisma.marketingSocialPost.create({
    data: {
      tenantId,
      title: input.title,
      content: input.content,
      channels: input.channels,
      status,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      publishedAt: null,
      failedAt: null,
      failureReason: null,
      tags: input.tags || [],
    },
  });

  return normalizeSocialPost(post);
}

export async function updateSocialPost(
  tenantId: string,
  id: string,
  input: z.infer<typeof updateSocialPostSchema>
): Promise<SocialPost> {
  const post = await getPostOrThrow(tenantId, id);
  const status = socialPostStatusSchema.parse(post.status);
  const now = new Date();

  if (input.action === "schedule") {
    if (!input.scheduledAt) {
      throw new Error("scheduledAt is required for schedule action");
    }
    if (status === "published") {
      throw new Error("Published post cannot be rescheduled");
    }

    const updated = await prisma.marketingSocialPost.update({
      where: { id: post.id },
      data: {
        status: "scheduled",
        scheduledAt: new Date(input.scheduledAt),
        failedAt: null,
        failureReason: null,
        updatedAt: now,
      },
    });

    return normalizeSocialPost(updated);
  }

  if (input.action === "publish_now") {
    if (status === "published") {
      throw new Error("Post already published");
    }

    const updated = await prisma.marketingSocialPost.update({
      where: { id: post.id },
      data: {
        status: "published",
        publishedAt: now,
        scheduledAt: null,
        failedAt: null,
        failureReason: null,
        updatedAt: now,
      },
    });

    return normalizeSocialPost(updated);
  }

  if (input.action === "mark_failed") {
    if (status === "published") {
      throw new Error("Published post cannot be marked as failed");
    }

    const updated = await prisma.marketingSocialPost.update({
      where: { id: post.id },
      data: {
        status: "failed",
        failedAt: now,
        failureReason: input.reason || "Failed to publish to one or more channels",
        updatedAt: now,
      },
    });

    return normalizeSocialPost(updated);
  }

  if (status === "published") {
    throw new Error("Published post cannot be canceled");
  }

  const updated = await prisma.marketingSocialPost.update({
    where: { id: post.id },
    data: {
      status: "canceled",
      scheduledAt: null,
      updatedAt: now,
    },
  });

  return normalizeSocialPost(updated);
}

export function summarizeSocialPosts(posts: SocialPost[]) {
  const summary = {
    total: posts.length,
    draft: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
    canceled: 0,
    channelMix: {
      facebook: 0,
      instagram: 0,
      linkedin: 0,
      x: 0,
    },
  };

  for (const post of posts) {
    summary[post.status] += 1;

    for (const channel of post.channels) {
      summary.channelMix[channel] += 1;
    }
  }

  return summary;
}

export async function resetSocialPublishingStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.marketingSocialPost.deleteMany();
}
