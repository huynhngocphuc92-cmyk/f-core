"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// ============================================
// TENANT HELPER (same pattern as crm.ts)
// ============================================

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

// ============================================
// RESULT TYPE
// ============================================

export type BulkActionResult = {
  success: boolean;
  count: number;
  error?: string;
};

// ============================================
// BULK DELETE CONTACTS (soft delete)
// ============================================

export async function bulkDeleteContacts(
  ids: string[]
): Promise<BulkActionResult> {
  if (!ids.length) return { success: false, count: 0, error: "No IDs provided" };

  const tenantId = await getTenantId();

  const result = await prisma.contact.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/contacts");
  return { success: true, count: result.count };
}

// ============================================
// BULK UPDATE CONTACTS
// ============================================

export async function bulkUpdateContacts(
  ids: string[],
  data: { field: string; value: string }
): Promise<BulkActionResult> {
  if (!ids.length) return { success: false, count: 0, error: "No IDs provided" };

  const tenantId = await getTenantId();

  // Whitelist of updatable fields to prevent injection
  const allowedFields = [
    "lifecycleStage",
    "leadStatus",
    "ownerId",
    "city",
    "state",
    "country",
    "jobTitle",
    "department",
  ];

  if (!allowedFields.includes(data.field)) {
    return { success: false, count: 0, error: `Field "${data.field}" is not allowed for bulk update` };
  }

  const result = await prisma.contact.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      deletedAt: null,
    },
    data: { [data.field]: data.value || null },
  });

  revalidatePath("/contacts");
  return { success: true, count: result.count };
}

// ============================================
// BULK DELETE COMPANIES (soft delete)
// ============================================

export async function bulkDeleteCompanies(
  ids: string[]
): Promise<BulkActionResult> {
  if (!ids.length) return { success: false, count: 0, error: "No IDs provided" };

  const tenantId = await getTenantId();

  const result = await prisma.company.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/companies");
  return { success: true, count: result.count };
}

// ============================================
// BULK DELETE DEALS (soft delete)
// ============================================

export async function bulkDeleteDeals(
  ids: string[]
): Promise<BulkActionResult> {
  if (!ids.length) return { success: false, count: 0, error: "No IDs provided" };

  const tenantId = await getTenantId();

  const result = await prisma.deal.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/deals");
  return { success: true, count: result.count };
}

// ============================================
// BULK UPDATE DEALS
// ============================================

export async function bulkUpdateDeals(
  ids: string[],
  data: { field: string; value: string }
): Promise<BulkActionResult> {
  if (!ids.length) return { success: false, count: 0, error: "No IDs provided" };

  const tenantId = await getTenantId();

  const allowedFields = [
    "ownerId",
    "stageId",
    "pipelineId",
    "priority",
    "dealType",
    "currency",
  ];

  if (!allowedFields.includes(data.field)) {
    return { success: false, count: 0, error: `Field "${data.field}" is not allowed for bulk update` };
  }

  const result = await prisma.deal.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      deletedAt: null,
    },
    data: { [data.field]: data.value || null },
  });

  revalidatePath("/deals");
  return { success: true, count: result.count };
}

// ============================================
// BULK DELETE TICKETS (soft delete)
// ============================================

export async function bulkDeleteTickets(
  ids: string[]
): Promise<BulkActionResult> {
  if (!ids.length) return { success: false, count: 0, error: "No IDs provided" };

  const tenantId = await getTenantId();

  const result = await prisma.ticket.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/tickets");
  return { success: true, count: result.count };
}

// ============================================
// BULK UPDATE TICKETS
// ============================================

export async function bulkUpdateTickets(
  ids: string[],
  data: { field: string; value: string }
): Promise<BulkActionResult> {
  if (!ids.length) return { success: false, count: 0, error: "No IDs provided" };

  const tenantId = await getTenantId();

  const allowedFields = [
    "status",
    "priority",
    "assigneeId",
    "category",
    "source",
  ];

  if (!allowedFields.includes(data.field)) {
    return { success: false, count: 0, error: `Field "${data.field}" is not allowed for bulk update` };
  }

  const result = await prisma.ticket.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      deletedAt: null,
    },
    data: { [data.field]: data.value || null },
  });

  revalidatePath("/tickets");
  return { success: true, count: result.count };
}
