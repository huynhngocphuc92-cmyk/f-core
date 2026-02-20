import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const sessionPolicySchema = z.object({
  maxSessionMinutes: z.number().int().min(15).max(1440),
  idleTimeoutMinutes: z.number().int().min(5).max(720),
  rememberMeAllowed: z.boolean(),
});

export const passwordPolicySchema = z.object({
  minLength: z.number().int().min(8).max(64),
  requireUppercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSpecialChar: z.boolean(),
});

export const ipAllowlistPolicySchema = z.object({
  enabled: z.boolean(),
  entries: z.array(z.string().min(3).max(64)).max(50),
});

export const updateTenantPolicySchema = z.object({
  tenantSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  session: sessionPolicySchema,
  password: passwordPolicySchema,
  ipAllowlist: ipAllowlistPolicySchema,
});

export type TenantPolicy = z.infer<typeof updateTenantPolicySchema> & {
  updatedAt: string;
};

const DEFAULT_POLICY: Omit<TenantPolicy, "updatedAt"> = {
  tenantSlug: "f-core",
  session: {
    maxSessionMinutes: 480,
    idleTimeoutMinutes: 60,
    rememberMeAllowed: true,
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: false,
  },
  ipAllowlist: {
    enabled: false,
    entries: [],
  },
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeEntry(entry: string) {
  return entry.trim();
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isSchemaDriftError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

function defaultPolicy(): Omit<TenantPolicy, "updatedAt"> {
  return {
    tenantSlug: DEFAULT_POLICY.tenantSlug,
    session: { ...DEFAULT_POLICY.session },
    password: { ...DEFAULT_POLICY.password },
    ipAllowlist: {
      enabled: DEFAULT_POLICY.ipAllowlist.enabled,
      entries: [...DEFAULT_POLICY.ipAllowlist.entries],
    },
  };
}

function normalizePolicy(record: {
  tenantId: string;
  tenantSlug: string;
  session: Prisma.JsonValue;
  password: Prisma.JsonValue;
  ipAllowlistEnabled: boolean;
  ipAllowlistEntries: string[];
  updatedAt: Date;
}): TenantPolicy {
  const sessionParsed = sessionPolicySchema.safeParse(record.session);
  const passwordParsed = passwordPolicySchema.safeParse(record.password);
  const fallback = defaultPolicy();

  return {
    tenantSlug: record.tenantSlug,
    session: sessionParsed.success ? sessionParsed.data : fallback.session,
    password: passwordParsed.success ? passwordParsed.data : fallback.password,
    ipAllowlist: {
      enabled: record.ipAllowlistEnabled,
      entries: record.ipAllowlistEntries.map(normalizeEntry).filter(Boolean),
    },
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getTenantPolicy(tenantId: string): Promise<TenantPolicy> {
  let current;
  try {
    current = await prisma.tenantPolicy.findFirst({
      where: { tenantId },
    });
  } catch (error) {
    if (isSchemaDriftError(error)) {
      return {
        ...defaultPolicy(),
        updatedAt: nowIso(),
      };
    }
    throw error;
  }

  if (!current) {
    return {
      ...defaultPolicy(),
      updatedAt: nowIso(),
    };
  }

  return normalizePolicy(current);
}

export async function updateTenantPolicy(
  tenantId: string,
  payload: z.infer<typeof updateTenantPolicySchema>
): Promise<TenantPolicy> {
  const entries = payload.ipAllowlist.entries.map(normalizeEntry).filter(Boolean);
  let next;

  try {
    const existing = await prisma.tenantPolicy.findFirst({
      where: { tenantId },
    });

    next = existing
      ? await prisma.tenantPolicy.update({
          where: { id: existing.id },
          data: {
            tenantSlug: payload.tenantSlug,
            session: toInputJsonValue(payload.session),
            password: toInputJsonValue(payload.password),
            ipAllowlistEnabled: payload.ipAllowlist.enabled,
            ipAllowlistEntries: entries,
          },
        })
      : await prisma.tenantPolicy.create({
          data: {
            tenantId,
            tenantSlug: payload.tenantSlug,
            session: toInputJsonValue(payload.session),
            password: toInputJsonValue(payload.password),
            ipAllowlistEnabled: payload.ipAllowlist.enabled,
            ipAllowlistEntries: entries,
          },
        });
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }
    return {
      tenantSlug: payload.tenantSlug,
      session: payload.session,
      password: payload.password,
      ipAllowlist: {
        enabled: payload.ipAllowlist.enabled,
        entries,
      },
      updatedAt: nowIso(),
    };
  }

  return normalizePolicy(next);
}

export async function getTenantPolicyBySlug(tenantSlug: string): Promise<TenantPolicy | null> {
  const normalizedSlug = tenantSlug.trim().toLowerCase();
  let fromStore;
  try {
    fromStore = await prisma.tenantPolicy.findFirst({
      where: {
        tenantSlug: normalizedSlug,
      },
    });
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }
    if (DEFAULT_POLICY.tenantSlug === normalizedSlug) {
      return {
        ...defaultPolicy(),
        updatedAt: nowIso(),
      };
    }
    return null;
  }
  if (fromStore) return normalizePolicy(fromStore);

  if (DEFAULT_POLICY.tenantSlug === normalizedSlug) {
    return {
      ...defaultPolicy(),
      updatedAt: nowIso(),
    };
  }

  return null;
}

function ipToUint32(ip: string): number | null {
  const octets = ip.split(".");
  if (octets.length !== 4) return null;
  const parsed = octets.map((item) => Number.parseInt(item, 10));
  if (parsed.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  return ((parsed[0] << 24) >>> 0) + ((parsed[1] << 16) >>> 0) + ((parsed[2] << 8) >>> 0) + (parsed[3] >>> 0);
}

function isIpInCidr(ip: string, cidr: string) {
  const [network, prefixRaw] = cidr.split("/");
  const prefix = Number.parseInt(prefixRaw || "", 10);
  if (!Number.isFinite(prefix) || prefix < 0 || prefix > 32) return false;

  const ipInt = ipToUint32(ip);
  const networkInt = ipToUint32(network);
  if (ipInt === null || networkInt === null) return false;

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (networkInt & mask);
}

export function isIpAllowedByPolicy(policy: TenantPolicy, ip: string | null | undefined) {
  if (!policy.ipAllowlist.enabled) return true;
  if (!ip) return false;
  const normalizedIp = ip.trim();
  if (!normalizedIp) return false;

  if (policy.ipAllowlist.entries.length === 0) return false;

  return policy.ipAllowlist.entries.some((entry) => {
    const normalized = entry.trim();
    if (!normalized) return false;
    if (normalized.includes("/")) return isIpInCidr(normalizedIp, normalized);
    return normalizedIp === normalized;
  });
}

export function validatePasswordAgainstPolicy(password: string, policy: TenantPolicy) {
  const checks = {
    minLength: password.length >= policy.password.minLength,
    uppercase: !policy.password.requireUppercase || /[A-Z]/.test(password),
    number: !policy.password.requireNumber || /\d/.test(password),
    special: !policy.password.requireSpecialChar || /[^A-Za-z0-9]/.test(password),
  };

  return {
    pass: checks.minLength && checks.uppercase && checks.number && checks.special,
    checks,
  };
}

export async function resetTenantPolicyStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.tenantPolicy.deleteMany();
}
