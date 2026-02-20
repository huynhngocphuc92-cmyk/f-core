import { z } from "zod";
import prisma from "@/lib/prisma";

export const ssoProviderSchema = z.enum(["oidc", "saml"]);

export const updateSsoConfigSchema = z.object({
  tenantSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  enabled: z.boolean(),
  ssoOnly: z.boolean(),
  provider: ssoProviderSchema,
  idpDisplayName: z.string().min(2).max(120),
  connectionId: z.string().min(2).max(120),
  entryPointUrl: z.string().url(),
  domains: z.array(z.string().toLowerCase().min(3).max(120)).min(1),
});

export type SsoConfig = z.infer<typeof updateSsoConfigSchema> & {
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

const DEFAULT_CONFIG: Omit<SsoConfig, "updatedAt"> = {
  tenantSlug: "f-core",
  enabled: true,
  ssoOnly: false,
  provider: "oidc",
  idpDisplayName: "Okta Demo",
  connectionId: "oidc-f-core-demo",
  entryPointUrl: "https://idp.f-core-demo.example.com/oauth2/v1/authorize",
  domains: ["f-core.com"],
};

function normalizeDomains(domains: string[]) {
  return domains.map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function normalizeConfig(record: {
  tenantSlug: string;
  enabled: boolean;
  ssoOnly: boolean;
  provider: string;
  idpDisplayName: string;
  connectionId: string;
  entryPointUrl: string;
  domains: string[];
  updatedAt: Date;
}): SsoConfig {
  return {
    tenantSlug: record.tenantSlug,
    enabled: record.enabled,
    ssoOnly: record.ssoOnly,
    provider: ssoProviderSchema.parse(record.provider),
    idpDisplayName: record.idpDisplayName,
    connectionId: record.connectionId,
    entryPointUrl: record.entryPointUrl,
    domains: normalizeDomains(record.domains),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function defaultConfig(): SsoConfig {
  return {
    ...DEFAULT_CONFIG,
    updatedAt: nowIso(),
  };
}

export async function getSsoConfig(tenantId: string): Promise<SsoConfig> {
  const current = await prisma.ssoConfig.findFirst({
    where: { tenantId },
  });

  if (!current) return defaultConfig();
  return normalizeConfig(current);
}

export async function updateSsoConfig(
  tenantId: string,
  payload: z.infer<typeof updateSsoConfigSchema>
): Promise<SsoConfig> {
  const domains = normalizeDomains(payload.domains);
  const existing = await prisma.ssoConfig.findFirst({
    where: { tenantId },
  });

  const next = existing
    ? await prisma.ssoConfig.update({
        where: { id: existing.id },
        data: {
          tenantSlug: payload.tenantSlug,
          enabled: payload.enabled,
          ssoOnly: payload.ssoOnly,
          provider: payload.provider,
          idpDisplayName: payload.idpDisplayName,
          connectionId: payload.connectionId,
          entryPointUrl: payload.entryPointUrl,
          domains,
        },
      })
    : await prisma.ssoConfig.create({
        data: {
          tenantId,
          tenantSlug: payload.tenantSlug,
          enabled: payload.enabled,
          ssoOnly: payload.ssoOnly,
          provider: payload.provider,
          idpDisplayName: payload.idpDisplayName,
          connectionId: payload.connectionId,
          entryPointUrl: payload.entryPointUrl,
          domains,
        },
      });

  return normalizeConfig(next);
}

export async function getSsoConfigByTenantSlug(tenantSlug: string): Promise<SsoConfig | null> {
  const normalized = tenantSlug.trim().toLowerCase();
  const inStore = await prisma.ssoConfig.findFirst({
    where: {
      tenantSlug: normalized,
    },
  });
  if (inStore) return normalizeConfig(inStore);

  if (DEFAULT_CONFIG.tenantSlug.toLowerCase() === normalized) {
    return defaultConfig();
  }

  return null;
}

export async function getSsoConfigByEmail(email: string): Promise<SsoConfig | null> {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return null;

  const rows = await prisma.ssoConfig.findMany();
  const inStore = rows.find((item) => item.domains.some((candidate) => candidate.toLowerCase() === domain));
  if (inStore) return normalizeConfig(inStore);

  if (DEFAULT_CONFIG.domains.some((candidate) => candidate.toLowerCase() === domain)) {
    return defaultConfig();
  }

  return null;
}

export async function resetSsoConfigStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.ssoConfig.deleteMany();
}
