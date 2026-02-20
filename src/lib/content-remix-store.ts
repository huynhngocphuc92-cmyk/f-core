import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const remixSourceTypeSchema = z.enum(["blog_post", "landing_page"]);
export const remixTargetFormatSchema = z.enum([
  "email_newsletter",
  "social_post",
  "linkedin_post",
  "sales_snippet",
  "ad_copy",
]);
export const remixToneSchema = z.enum(["professional", "friendly", "concise", "bold"]);

export const createContentRemixSchema = z.object({
  sourceType: remixSourceTypeSchema,
  sourceId: z.string().min(1),
  targetFormat: remixTargetFormatSchema,
  tone: remixToneSchema.default("professional"),
  maxLength: z.number().int().min(120).max(5000).optional(),
});

export type ContentRemixVariant = {
  id: string;
  tenantId: string;
  sourceType: z.infer<typeof remixSourceTypeSchema>;
  sourceId: string;
  sourceTitle: string;
  targetFormat: z.infer<typeof remixTargetFormatSchema>;
  tone: z.infer<typeof remixToneSchema>;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type RemixSourceInput = {
  title: string;
  excerpt?: string | null;
  body: string;
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeVariant(record: {
  id: string;
  tenantId: string;
  sourceType: string;
  sourceId: string;
  sourceTitle: string;
  targetFormat: string;
  tone: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): ContentRemixVariant {
  return {
    id: record.id,
    tenantId: record.tenantId,
    sourceType: remixSourceTypeSchema.parse(record.sourceType),
    sourceId: record.sourceId,
    sourceTitle: record.sourceTitle,
    targetFormat: remixTargetFormatSchema.parse(record.targetFormat),
    tone: remixToneSchema.parse(record.tone),
    content: record.content,
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeText(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function takeWords(input: string, limit: number) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, limit)
    .join(" ");
}

function toneHint(tone: z.infer<typeof remixToneSchema>) {
  if (tone === "friendly") return "Keep the message warm and conversational.";
  if (tone === "concise") return "Keep it short and outcome-focused.";
  if (tone === "bold") return "Lead with a strong hook and clear CTA.";
  return "Keep a clear and professional brand voice.";
}

function buildRemixContent(
  source: RemixSourceInput,
  format: z.infer<typeof remixTargetFormatSchema>,
  tone: z.infer<typeof remixToneSchema>
) {
  const title = source.title.trim();
  const excerpt = normalizeText(source.excerpt || "");
  const body = normalizeText(source.body);
  const summary = takeWords(excerpt || body, 45);
  const supporting = takeWords(body, 80);
  const hint = toneHint(tone);

  if (format === "email_newsletter") {
    return [
      `Subject: ${title}`,
      `Preview: ${takeWords(summary, 16)}`,
      "",
      `Hi team,`,
      `${summary}.`,
      `${hint}`,
      `Key point: ${supporting}.`,
      "CTA: Read the full update and share feedback.",
    ].join("\n");
  }

  if (format === "linkedin_post") {
    return [
      `${title}`,
      "",
      `${summary}.`,
      `${hint}`,
      `What this means: ${takeWords(supporting, 55)}.`,
      "If this resonates with your team, let us know how you are approaching it.",
      "#growth #marketing #sales",
    ].join("\n");
  }

  if (format === "sales_snippet") {
    return [
      `Pitch: ${takeWords(title, 10)}`,
      `Value: ${takeWords(summary, 28)}.`,
      `Proof: ${takeWords(supporting, 28)}.`,
      "CTA: Open to a 15-minute walkthrough this week?",
    ].join("\n");
  }

  if (format === "ad_copy") {
    return [
      `Headline: ${takeWords(title, 8)}`,
      `Body: ${takeWords(summary, 24)}. ${hint}`,
      "CTA: Start now",
    ].join("\n");
  }

  return [
    `${takeWords(title, 12)}`,
    `${takeWords(summary, 30)}.`,
    `${hint}`,
    "#content #growth",
  ].join("\n\n");
}

function clampByLength(content: string, maxLength?: number) {
  if (!maxLength || content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export async function listContentRemixVariants(
  tenantId: string,
  filters?: {
    sourceType?: z.infer<typeof remixSourceTypeSchema>;
    sourceId?: string;
    targetFormat?: z.infer<typeof remixTargetFormatSchema>;
  }
): Promise<ContentRemixVariant[]> {
  const rows = await prisma.contentRemixVariant.findMany({
    where: {
      tenantId,
      sourceType: filters?.sourceType,
      sourceId: filters?.sourceId,
      targetFormat: filters?.targetFormat,
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(normalizeVariant);
}

export async function createContentRemixVariant(
  tenantId: string,
  userId: string,
  payload: z.infer<typeof createContentRemixSchema>,
  source: RemixSourceInput
): Promise<ContentRemixVariant> {
  const now = nowIso();
  const content = clampByLength(
    buildRemixContent(source, payload.targetFormat, payload.tone),
    payload.maxLength
  );

  const created = await prisma.contentRemixVariant.create({
    data: {
      id: randomUUID(),
      tenantId,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      sourceTitle: source.title,
      targetFormat: payload.targetFormat,
      tone: payload.tone,
      content,
      createdBy: userId,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    },
  });
  return normalizeVariant(created);
}

export async function resetContentRemixStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.contentRemixVariant.deleteMany();
}
