import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const pageSectionTypeSchema = z.enum(["hero", "benefits", "social_proof", "faq", "cta"]);

export const createReusableBlockSchema = z.object({
  name: z.string().min(1).max(120),
  sectionType: pageSectionTypeSchema,
  headline: z.string().min(1).max(220),
  body: z.string().min(1).max(2000),
  ctaLabel: z.string().max(80).optional(),
  ctaUrl: z.string().max(400).optional(),
});

export const composePageSchema = z.object({
  landingPageId: z.string().min(1),
  templateKey: z.string().min(1),
  blockIds: z.array(z.string().min(1)).min(1).max(20),
});

export type PageTemplate = {
  key: string;
  name: string;
  description: string;
  sections: Array<{
    type: z.infer<typeof pageSectionTypeSchema>;
    label: string;
    required: boolean;
  }>;
};

export type ReusableBlock = {
  id: string;
  tenantId: string;
  name: string;
  sectionType: z.infer<typeof pageSectionTypeSchema>;
  headline: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type StructuredSection = {
  id: string;
  type: z.infer<typeof pageSectionTypeSchema>;
  label: string;
  blockId: string;
  headline: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  order: number;
};

const templates: PageTemplate[] = [
  {
    key: "product_launch",
    name: "Product Launch",
    description: "For announcing product releases with value proof and CTA.",
    sections: [
      { type: "hero", label: "Hero", required: true },
      { type: "benefits", label: "Benefits", required: true },
      { type: "social_proof", label: "Social Proof", required: false },
      { type: "cta", label: "Call To Action", required: true },
    ],
  },
  {
    key: "webinar_signup",
    name: "Webinar Signup",
    description: "For event registration and conversion-focused campaigns.",
    sections: [
      { type: "hero", label: "Hero", required: true },
      { type: "benefits", label: "Agenda", required: true },
      { type: "faq", label: "FAQ", required: false },
      { type: "cta", label: "Register CTA", required: true },
    ],
  },
  {
    key: "ebook_download",
    name: "Ebook Download",
    description: "For lead magnet pages and gated content.",
    sections: [
      { type: "hero", label: "Hero", required: true },
      { type: "benefits", label: "What You Will Learn", required: true },
      { type: "social_proof", label: "Proof", required: false },
      { type: "cta", label: "Download CTA", required: true },
    ],
  },
];

export function listPageTemplates() {
  return templates;
}

export function getPageTemplate(templateKey: string) {
  return templates.find((item) => item.key === templateKey) || null;
}

function normalizeReusableBlock(row: {
  id: string;
  tenantId: string;
  name: string;
  sectionType: string;
  headline: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    sectionType: pageSectionTypeSchema.parse(row.sectionType),
    headline: row.headline,
    body: row.body,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } satisfies ReusableBlock;
}

export async function listReusableBlocks(
  tenantId: string,
  filters?: {
    sectionType?: z.infer<typeof pageSectionTypeSchema>;
  }
) {
  const rows = await prisma.contentReusableBlock.findMany({
    where: {
      tenantId,
      sectionType: filters?.sectionType,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      sectionType: true,
      headline: true,
      body: true,
      ctaLabel: true,
      ctaUrl: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((row) => normalizeReusableBlock(row));
}

export async function createReusableBlock(
  tenantId: string,
  userId: string,
  payload: z.infer<typeof createReusableBlockSchema>
) {
  const row = await prisma.contentReusableBlock.create({
    data: {
      tenantId,
      name: payload.name,
      sectionType: payload.sectionType,
      headline: payload.headline,
      body: payload.body,
      ctaLabel: payload.ctaLabel || null,
      ctaUrl: payload.ctaUrl || null,
      createdBy: userId,
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      sectionType: true,
      headline: true,
      body: true,
      ctaLabel: true,
      ctaUrl: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return normalizeReusableBlock(row);
}

export function buildStructuredSections(input: {
  template: PageTemplate;
  selectedBlocks: ReusableBlock[];
}) {
  const selectedByType = new Map<z.infer<typeof pageSectionTypeSchema>, ReusableBlock[]>();

  for (const block of input.selectedBlocks) {
    if (!selectedByType.has(block.sectionType)) {
      selectedByType.set(block.sectionType, []);
    }
    selectedByType.get(block.sectionType)!.push(block);
  }

  const sections: StructuredSection[] = [];

  for (let index = 0; index < input.template.sections.length; index += 1) {
    const sectionDef = input.template.sections[index];
    const candidates = selectedByType.get(sectionDef.type) || [];
    const selected = candidates[0] || null;

    if (sectionDef.required && !selected) {
      throw new Error(`Missing reusable block for required section type: ${sectionDef.type}`);
    }

    if (!selected) {
      continue;
    }

    sections.push({
      id: randomUUID(),
      type: sectionDef.type,
      label: sectionDef.label,
      blockId: selected.id,
      headline: selected.headline,
      body: selected.body,
      ctaLabel: selected.ctaLabel,
      ctaUrl: selected.ctaUrl,
      order: index,
    });
  }

  return sections;
}

export function renderStructuredSectionsHtml(sections: StructuredSection[]) {
  return sections
    .map((section) => {
      const cta =
        section.ctaLabel && section.ctaUrl
          ? `<p><a href="${section.ctaUrl}">${section.ctaLabel}</a></p>`
          : "";

      return `<section data-type="${section.type}"><h2>${section.headline}</h2><p>${section.body}</p>${cta}</section>`;
    })
    .join("\n");
}

export async function resetContentPageBuilderStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  await prisma.contentReusableBlock.deleteMany();
}
