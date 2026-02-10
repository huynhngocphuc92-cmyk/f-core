"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  return user.id;
}

// ============================================
// WEBHOOKS
// ============================================

export async function getWebhooks() {
  const tenantId = await getTenantId();

  return prisma.webhook.findMany({
    where: { tenantId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWebhook(formData: FormData) {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const eventsRaw = formData.get("events") as string;

  if (!name || !url) {
    throw new Error("Name and URL are required");
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Parse events from comma-separated string or JSON array
  let events: string[] = [];
  if (eventsRaw) {
    try {
      events = JSON.parse(eventsRaw);
    } catch {
      events = eventsRaw.split(",").map((e) => e.trim()).filter(Boolean);
    }
  }

  await prisma.webhook.create({
    data: {
      tenantId,
      userId,
      name,
      url,
      events,
      isActive: true,
    },
  });

  revalidatePath("/settings/webhooks");
}

export async function toggleWebhook(id: string, isActive: boolean) {
  const tenantId = await getTenantId();

  await prisma.webhook.updateMany({
    where: { id, tenantId },
    data: { isActive },
  });

  revalidatePath("/settings/webhooks");
}

export async function deleteWebhook(id: string) {
  const tenantId = await getTenantId();

  await prisma.webhook.deleteMany({
    where: { id, tenantId },
  });

  revalidatePath("/settings/webhooks");
}

// ============================================
// AUDIT LOGS
// ============================================

export async function getAuditLogs(filters?: {
  search?: string;
  entity?: string;
  action?: string;
}) {
  const tenantId = await getTenantId();

  return prisma.auditLog.findMany({
    where: {
      tenantId,
      ...(filters?.entity && filters.entity !== "all"
        ? { entity: filters.entity }
        : {}),
      ...(filters?.action && filters.action !== "all"
        ? { action: filters.action }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { entityName: { contains: filters.search, mode: "insensitive" as const } },
              { action: { contains: filters.search, mode: "insensitive" as const } },
              { entity: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getAuditLogStats() {
  const tenantId = await getTenantId();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [total, today, thisWeek] = await Promise.all([
    prisma.auditLog.count({ where: { tenantId } }),
    prisma.auditLog.count({
      where: { tenantId, createdAt: { gte: startOfToday } },
    }),
    prisma.auditLog.count({
      where: { tenantId, createdAt: { gte: startOfWeek } },
    }),
  ]);

  return { total, today, thisWeek };
}
