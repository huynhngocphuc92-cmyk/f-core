"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// TENANT & USER HELPERS (same pattern as crm.ts)
// ============================================

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
// GET NOTIFICATIONS
// ============================================

export async function getNotifications() {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  return prisma.notification.findMany({
    where: {
      tenantId,
      userId,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// ============================================
// GET UNREAD COUNT
// ============================================

export async function getUnreadCount(): Promise<number> {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  return prisma.notification.count({
    where: {
      tenantId,
      userId,
      isRead: false,
    },
  });
}

// ============================================
// MARK AS READ
// ============================================

export async function markAsRead(id: string) {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  // Verify notification belongs to this user and tenant
  const notification = await prisma.notification.findFirst({
    where: { id, tenantId, userId },
  });

  if (!notification) {
    return { error: "Notification not found" };
  }

  await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  revalidatePath("/notifications");
  return { success: true };
}

// ============================================
// MARK ALL AS READ
// ============================================

export async function markAllAsRead() {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  await prisma.notification.updateMany({
    where: {
      tenantId,
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  revalidatePath("/notifications");
  return { success: true };
}

// ============================================
// CREATE NOTIFICATION (internal use)
// ============================================

export async function createNotification(data: {
  userId?: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}) {
  const tenantId = await getTenantId();
  const userId = data.userId || (await getDefaultUserId());

  const notification = await prisma.notification.create({
    data: {
      tenantId,
      userId,
      type: data.type,
      title: data.title,
      message: data.message || null,
      link: data.link || null,
      icon: data.icon || null,
      metadata: (data.metadata || {}) as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/notifications");
  return notification;
}
