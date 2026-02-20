import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const qualityObjectTypeSchema = z.enum(["contact", "company"]);

export const upsertQualityRulesSchema = z.object({
  objectType: qualityObjectTypeSchema,
  requireEmail: z.boolean().default(false),
  requirePhone: z.boolean().default(false),
  requireDomain: z.boolean().default(false),
  minNameLength: z.number().int().min(1).max(120).default(2),
  autoMergeExactKey: z.boolean().default(false),
});

export const mergeDuplicateSchema = z.object({
  objectType: qualityObjectTypeSchema,
  primaryId: z.string().min(1),
  duplicateId: z.string().min(1),
  mergeMode: z.enum(["prefer_primary", "prefer_duplicate", "custom"]).default("prefer_primary"),
  custom: z.record(z.string(), z.unknown()).optional(),
  dryRun: z.boolean().default(false),
});

export type QualityRule = {
  tenantId: string;
  objectType: z.infer<typeof qualityObjectTypeSchema>;
  requireEmail: boolean;
  requirePhone: boolean;
  requireDomain: boolean;
  minNameLength: number;
  autoMergeExactKey: boolean;
  updatedAt: string;
};

export type DedupeCandidate = {
  objectType: z.infer<typeof qualityObjectTypeSchema>;
  key: string;
  reason: string;
  confidence: number;
  records: Array<{
    id: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
    domain?: string | null;
    updatedAt: string;
  }>;
};

export type MergeAudit = {
  id: string;
  tenantId: string;
  objectType: z.infer<typeof qualityObjectTypeSchema>;
  primaryId: string;
  duplicateId: string;
  mergedBy: string;
  dryRun: boolean;
  fieldsMerged: string[];
  createdAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function normalize(input: string | null | undefined) {
  return (input || "").trim().toLowerCase();
}

function normalizePhone(input: string | null | undefined) {
  return (input || "").replace(/\D+/g, "");
}

function defaultRule(tenantId: string, objectType: z.infer<typeof qualityObjectTypeSchema>): QualityRule {
  return {
    tenantId,
    objectType,
    requireEmail: objectType === "contact",
    requirePhone: false,
    requireDomain: objectType === "company",
    minNameLength: 2,
    autoMergeExactKey: false,
    updatedAt: nowIso(),
  };
}

function normalizeRule(record: {
  tenantId: string;
  objectType: string;
  requireEmail: boolean;
  requirePhone: boolean;
  requireDomain: boolean;
  minNameLength: number;
  autoMergeExactKey: boolean;
  updatedAt: Date;
}): QualityRule {
  return {
    tenantId: record.tenantId,
    objectType: qualityObjectTypeSchema.parse(record.objectType),
    requireEmail: record.requireEmail,
    requirePhone: record.requirePhone,
    requireDomain: record.requireDomain,
    minNameLength: record.minNameLength,
    autoMergeExactKey: record.autoMergeExactKey,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeMergeAudit(record: {
  id: string;
  tenantId: string;
  objectType: string;
  primaryId: string;
  duplicateId: string;
  mergedBy: string;
  dryRun: boolean;
  fieldsMerged: unknown;
  createdAt: Date;
}): MergeAudit {
  return {
    id: record.id,
    tenantId: record.tenantId,
    objectType: qualityObjectTypeSchema.parse(record.objectType),
    primaryId: record.primaryId,
    duplicateId: record.duplicateId,
    mergedBy: record.mergedBy,
    dryRun: record.dryRun,
    fieldsMerged: Array.isArray(record.fieldsMerged)
      ? record.fieldsMerged.filter((item): item is string => typeof item === "string")
      : [],
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listQualityRules(tenantId: string): Promise<QualityRule[]> {
  const rows = await prisma.dataQualityRule.findMany({
    where: { tenantId },
  });

  const byType = new Map(rows.map((row) => [qualityObjectTypeSchema.parse(row.objectType), normalizeRule(row)]));
  return qualityObjectTypeSchema.options.map((objectType) => byType.get(objectType) || defaultRule(tenantId, objectType));
}

export async function getQualityRule(
  tenantId: string,
  objectType: z.infer<typeof qualityObjectTypeSchema>
): Promise<QualityRule> {
  const row = await prisma.dataQualityRule.findFirst({
    where: {
      tenantId,
      objectType,
    },
  });

  return row ? normalizeRule(row) : defaultRule(tenantId, objectType);
}

export async function upsertQualityRule(
  tenantId: string,
  payload: z.infer<typeof upsertQualityRulesSchema>
): Promise<QualityRule> {
  const existing = await prisma.dataQualityRule.findFirst({
    where: {
      tenantId,
      objectType: payload.objectType,
    },
  });

  const rule = existing
    ? await prisma.dataQualityRule.update({
        where: { id: existing.id },
        data: {
          requireEmail: payload.requireEmail,
          requirePhone: payload.requirePhone,
          requireDomain: payload.requireDomain,
          minNameLength: payload.minNameLength,
          autoMergeExactKey: payload.autoMergeExactKey,
        },
      })
    : await prisma.dataQualityRule.create({
        data: {
          tenantId,
          objectType: payload.objectType,
          requireEmail: payload.requireEmail,
          requirePhone: payload.requirePhone,
          requireDomain: payload.requireDomain,
          minNameLength: payload.minNameLength,
          autoMergeExactKey: payload.autoMergeExactKey,
        },
      });

  return normalizeRule(rule);
}

type ContactLike = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  updatedAt: Date | string;
};

type CompanyLike = {
  id: string;
  name?: string | null;
  domain?: string | null;
  phone?: string | null;
  updatedAt: Date | string;
};

export function detectContactDuplicates(input: ContactLike[]) {
  const byEmail = new Map<string, ContactLike[]>();
  const byPhone = new Map<string, ContactLike[]>();

  for (const contact of input) {
    const email = normalize(contact.email);
    const phone = normalizePhone(contact.phone);

    if (email) {
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push(contact);
    }

    if (phone.length >= 8) {
      if (!byPhone.has(phone)) byPhone.set(phone, []);
      byPhone.get(phone)!.push(contact);
    }
  }

  const candidates: DedupeCandidate[] = [];

  for (const [email, contacts] of byEmail.entries()) {
    if (contacts.length < 2) continue;
    candidates.push({
      objectType: "contact",
      key: email,
      reason: "Exact email match",
      confidence: 0.98,
      records: contacts.map((contact) => ({
        id: contact.id,
        displayName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || email,
        email: contact.email || null,
        phone: contact.phone || null,
        updatedAt: new Date(contact.updatedAt).toISOString(),
      })),
    });
  }

  for (const [phone, contacts] of byPhone.entries()) {
    if (contacts.length < 2) continue;
    const already = candidates.some((candidate) => candidate.records.some((record) => record.id === contacts[0].id));
    if (already) continue;

    candidates.push({
      objectType: "contact",
      key: phone,
      reason: "Exact phone match",
      confidence: 0.9,
      records: contacts.map((contact) => ({
        id: contact.id,
        displayName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || phone,
        email: contact.email || null,
        phone: contact.phone || null,
        updatedAt: new Date(contact.updatedAt).toISOString(),
      })),
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

export function detectCompanyDuplicates(input: CompanyLike[]) {
  const byDomain = new Map<string, CompanyLike[]>();
  const byName = new Map<string, CompanyLike[]>();

  for (const company of input) {
    const domain = normalize(company.domain);
    const name = normalize(company.name);

    if (domain) {
      if (!byDomain.has(domain)) byDomain.set(domain, []);
      byDomain.get(domain)!.push(company);
    }

    if (name.length >= 3) {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(company);
    }
  }

  const candidates: DedupeCandidate[] = [];

  for (const [domain, companies] of byDomain.entries()) {
    if (companies.length < 2) continue;
    candidates.push({
      objectType: "company",
      key: domain,
      reason: "Exact domain match",
      confidence: 0.97,
      records: companies.map((company) => ({
        id: company.id,
        displayName: company.name || domain,
        domain: company.domain || null,
        phone: company.phone || null,
        updatedAt: new Date(company.updatedAt).toISOString(),
      })),
    });
  }

  for (const [name, companies] of byName.entries()) {
    if (companies.length < 2) continue;
    const already = candidates.some((candidate) => candidate.records.some((record) => record.id === companies[0].id));
    if (already) continue;

    candidates.push({
      objectType: "company",
      key: name,
      reason: "Exact company name match",
      confidence: 0.82,
      records: companies.map((company) => ({
        id: company.id,
        displayName: company.name || name,
        domain: company.domain || null,
        phone: company.phone || null,
        updatedAt: new Date(company.updatedAt).toISOString(),
      })),
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

export async function createMergeAudit(
  tenantId: string,
  payload: {
    objectType: z.infer<typeof qualityObjectTypeSchema>;
    primaryId: string;
    duplicateId: string;
    mergedBy: string;
    dryRun: boolean;
    fieldsMerged: string[];
  }
): Promise<MergeAudit> {
  const created = await prisma.dataQualityMergeAudit.create({
    data: {
      id: randomUUID(),
      tenantId,
      objectType: payload.objectType,
      primaryId: payload.primaryId,
      duplicateId: payload.duplicateId,
      mergedBy: payload.mergedBy,
      dryRun: payload.dryRun,
      fieldsMerged: payload.fieldsMerged,
    },
  });

  return normalizeMergeAudit(created);
}

export async function listMergeAudit(tenantId: string): Promise<MergeAudit[]> {
  const rows = await prisma.dataQualityMergeAudit.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(normalizeMergeAudit);
}

export async function resetDataQualityStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.dataQualityMergeAudit.deleteMany();
  await prisma.dataQualityRule.deleteMany();
}
