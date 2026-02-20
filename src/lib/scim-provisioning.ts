import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const scimNameSchema = z
  .object({
    givenName: z.string().min(1).max(120).optional(),
    familyName: z.string().min(1).max(120).optional(),
    formatted: z.string().min(1).max(240).optional(),
  })
  .default({});

export const scimEmailSchema = z.object({
  value: z.string().email(),
  primary: z.boolean().optional(),
});

export const scimRoleSchema = z.object({
  value: z.string().min(2).max(80),
});

export const scimCreateUserSchema = z.object({
  externalId: z.string().max(120).optional(),
  userName: z.string().email(),
  active: z.boolean().optional().default(true),
  displayName: z.string().max(240).optional(),
  name: scimNameSchema.optional(),
  emails: z.array(scimEmailSchema).min(1).optional(),
  roles: z.array(scimRoleSchema).optional(),
});

export const scimPatchOperationSchema = z.object({
  op: z.enum(["add", "replace", "remove"]).default("replace"),
  path: z.string().max(200).optional(),
  value: z.any().optional(),
});

export const scimPatchUserSchema = z.object({
  Operations: z.array(scimPatchOperationSchema).min(1),
});

type ScimUserRecord = {
  id: string;
  tenantId: string;
  externalId?: string;
  userName: string;
  active: boolean;
  displayName: string;
  givenName?: string;
  familyName?: string;
  emails: Array<{ value: string; primary: boolean }>;
  roles: Array<{ value: string }>;
  createdAt: string;
  updatedAt: string;
};

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeEmails(value: Prisma.JsonValue | null | undefined, fallback: string) {
  const rows = Array.isArray(value)
    ? value
        .map((item, index) => {
          if (!item || typeof item !== "object") return null;
          if (!("value" in item) || typeof item.value !== "string") return null;
          const email = item.value.trim().toLowerCase();
          if (!email) return null;
          const primary = "primary" in item ? Boolean(item.primary) : index === 0;
          return { value: email, primary };
        })
        .filter((item): item is { value: string; primary: boolean } => Boolean(item))
    : [];

  if (rows.length === 0) {
    return [{ value: fallback, primary: true }];
  }

  if (!rows.some((item) => item.primary)) {
    rows[0].primary = true;
  }

  return rows;
}

function normalizeRoles(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      if (!("value" in item) || typeof item.value !== "string") return null;
      const role = item.value.trim();
      if (!role) return null;
      return { value: role };
    })
    .filter((item): item is { value: string } => Boolean(item));
}

function normalizeScimUser(record: {
  id: string;
  tenantId: string;
  externalId: string | null;
  userName: string;
  active: boolean;
  displayName: string;
  givenName: string | null;
  familyName: string | null;
  emails: Prisma.JsonValue;
  roles: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): ScimUserRecord {
  const userName = record.userName.trim().toLowerCase();
  return {
    id: record.id,
    tenantId: record.tenantId,
    externalId: record.externalId || undefined,
    userName,
    active: record.active,
    displayName: record.displayName.trim() || userName,
    givenName: record.givenName || undefined,
    familyName: record.familyName || undefined,
    emails: normalizeEmails(record.emails, userName),
    roles: normalizeRoles(record.roles),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toScimResource(user: ScimUserRecord) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: user.id,
    externalId: user.externalId,
    userName: user.userName,
    active: user.active,
    displayName: user.displayName,
    name: {
      givenName: user.givenName,
      familyName: user.familyName,
      formatted: [user.givenName, user.familyName].filter(Boolean).join(" ").trim() || undefined,
    },
    emails: user.emails,
    roles: user.roles,
    meta: {
      resourceType: "User",
      created: user.createdAt,
      lastModified: user.updatedAt,
    },
  };
}

export async function listScimUsers(
  tenantId: string,
  options?: { startIndex?: number; count?: number; emailFilter?: string }
) {
  const rows = await prisma.scimUser.findMany({
    where: {
      tenantId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const users = rows.map(normalizeScimUser);
  const emailFilter = options?.emailFilter?.trim().toLowerCase();
  const filtered = emailFilter ? users.filter((user) => user.userName.toLowerCase() === emailFilter) : users;

  const startIndex = Math.max(1, options?.startIndex ?? 1);
  const count = Math.max(1, options?.count ?? 100);
  const start = startIndex - 1;
  const page = filtered.slice(start, start + count);

  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: filtered.length,
    startIndex,
    itemsPerPage: page.length,
    Resources: page.map(toScimResource),
  };
}

export async function getScimUserById(tenantId: string, userId: string) {
  const found = await prisma.scimUser.findFirst({
    where: {
      tenantId,
      id: userId,
    },
  });

  return found ? toScimResource(normalizeScimUser(found)) : null;
}

export async function createScimUser(tenantId: string, payload: z.infer<typeof scimCreateUserSchema>) {
  const emailFromEmails = payload.emails?.find((item) => item.primary)?.value || payload.emails?.[0]?.value;
  const normalizedUserName = (payload.userName || emailFromEmails || "").trim().toLowerCase();
  const existing = await prisma.scimUser.findFirst({
    where: {
      tenantId,
      userName: normalizedUserName,
    },
  });
  if (existing) {
    return toScimResource(normalizeScimUser(existing));
  }

  const name = payload.name || {};
  const givenName = name.givenName?.trim();
  const familyName = name.familyName?.trim();
  const displayName =
    payload.displayName?.trim() || [givenName, familyName].filter(Boolean).join(" ").trim() || normalizedUserName;
  const emails = (payload.emails || [{ value: normalizedUserName }]).map((email, index) => ({
    value: email.value.toLowerCase(),
    primary: email.primary ?? index === 0,
  }));
  if (!emails.some((email) => email.primary) && emails.length > 0) {
    emails[0].primary = true;
  }

  const roles = (payload.roles || [{ value: "member" }]).map((role) => ({ value: role.value }));
  const created = await prisma.scimUser.create({
    data: {
      id: randomUUID(),
      tenantId,
      externalId: payload.externalId?.trim() || null,
      userName: normalizedUserName,
      active: payload.active ?? true,
      displayName,
      givenName: givenName || null,
      familyName: familyName || null,
      emails: toInputJsonValue(emails),
      roles: toInputJsonValue(roles),
    },
  });

  return toScimResource(normalizeScimUser(created));
}

function applyPatchOp(user: ScimUserRecord, op: z.infer<typeof scimPatchOperationSchema>) {
  const path = (op.path || "").toLowerCase().trim();
  const value = op.value;

  if (!path || path === "active") {
    if (typeof value === "boolean") user.active = value;
    if (value && typeof value === "object" && "active" in value && typeof value.active === "boolean") {
      user.active = value.active;
    }
  }

  if (path === "displayname" && typeof value === "string") {
    user.displayName = value.trim();
  }

  if (path === "username" && typeof value === "string") {
    user.userName = value.trim().toLowerCase();
  }

  if (path === "name.givenname" && typeof value === "string") {
    user.givenName = value.trim();
  }

  if (path === "name.familyname" && typeof value === "string") {
    user.familyName = value.trim();
  }

  if (path === "roles" && Array.isArray(value)) {
    user.roles = value
      .map((role) => (role && typeof role === "object" && "value" in role ? { value: String(role.value) } : null))
      .filter((role): role is { value: string } => Boolean(role));
  }
}

export async function patchScimUser(
  tenantId: string,
  userId: string,
  payload: z.infer<typeof scimPatchUserSchema>
) {
  const existing = await prisma.scimUser.findFirst({
    where: {
      tenantId,
      id: userId,
    },
  });
  if (!existing) return null;

  const user = normalizeScimUser(existing);

  for (const operation of payload.Operations) {
    applyPatchOp(user, operation);
  }

  const updated = await prisma.scimUser.update({
    where: {
      id: existing.id,
    },
    data: {
      userName: user.userName,
      active: user.active,
      displayName: user.displayName,
      givenName: user.givenName || null,
      familyName: user.familyName || null,
      emails: toInputJsonValue(user.emails),
      roles: toInputJsonValue(user.roles),
    },
  });

  return toScimResource(normalizeScimUser(updated));
}

export async function deactivateScimUser(tenantId: string, userId: string) {
  const existing = await prisma.scimUser.findFirst({
    where: {
      tenantId,
      id: userId,
    },
  });
  if (!existing) return null;

  const updated = await prisma.scimUser.update({
    where: {
      id: existing.id,
    },
    data: {
      active: false,
    },
  });

  return toScimResource(normalizeScimUser(updated));
}

export async function resetScimProvisioningStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.scimUser.deleteMany();
}
