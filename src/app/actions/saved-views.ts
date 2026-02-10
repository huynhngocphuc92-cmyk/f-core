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
// GET SAVED VIEWS
// ============================================

export async function getSavedViews(module: string) {
  try {
    const tenantId = await getTenantId();

    const views = await prisma.savedView.findMany({
      where: {
        tenantId,
        module,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    return { success: true, data: views };
  } catch (error) {
    console.error("Failed to get saved views:", error);
    return { success: false, error: "Failed to get saved views" };
  }
}

// ============================================
// CREATE SAVED VIEW
// ============================================

export async function createSavedView(data: {
  name: string;
  module: string;
  filters?: unknown;
  columns?: unknown;
  sortBy?: string;
  sortOrder?: string;
  isDefault?: boolean;
  isShared?: boolean;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getDefaultUserId();

    // If this view is being set as default, unset other defaults for this module
    if (data.isDefault) {
      await prisma.savedView.updateMany({
        where: {
          tenantId,
          module: data.module,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const view = await prisma.savedView.create({
      data: {
        tenantId,
        userId,
        name: data.name,
        module: data.module,
        filters: (data.filters as never) ?? [],
        columns: (data.columns as never) ?? [],
        sortBy: data.sortBy ?? null,
        sortOrder: data.sortOrder ?? "asc",
        isDefault: data.isDefault ?? false,
        isShared: data.isShared ?? false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath(`/${data.module}`);
    return { success: true, data: view };
  } catch (error) {
    console.error("Failed to create saved view:", error);
    return { success: false, error: "Failed to create saved view" };
  }
}

// ============================================
// UPDATE SAVED VIEW
// ============================================

export async function updateSavedView(
  id: string,
  data: {
    name?: string;
    filters?: unknown;
    columns?: unknown;
    sortBy?: string;
    sortOrder?: string;
    isDefault?: boolean;
    isShared?: boolean;
  }
) {
  try {
    const tenantId = await getTenantId();

    // Verify the view belongs to this tenant
    const existing = await prisma.savedView.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return { success: false, error: "Saved view not found" };
    }

    // If this view is being set as default, unset other defaults for this module
    if (data.isDefault) {
      await prisma.savedView.updateMany({
        where: {
          tenantId,
          module: existing.module,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.filters !== undefined) updateData.filters = data.filters as never;
    if (data.columns !== undefined) updateData.columns = data.columns as never;
    if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isShared !== undefined) updateData.isShared = data.isShared;

    const view = await prisma.savedView.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath(`/${existing.module}`);
    return { success: true, data: view };
  } catch (error) {
    console.error("Failed to update saved view:", error);
    return { success: false, error: "Failed to update saved view" };
  }
}

// ============================================
// DELETE SAVED VIEW
// ============================================

export async function deleteSavedView(id: string) {
  try {
    const tenantId = await getTenantId();

    // Verify the view belongs to this tenant
    const existing = await prisma.savedView.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return { success: false, error: "Saved view not found" };
    }

    await prisma.savedView.delete({
      where: { id },
    });

    revalidatePath(`/${existing.module}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete saved view:", error);
    return { success: false, error: "Failed to delete saved view" };
  }
}

// ============================================
// SET DEFAULT VIEW
// ============================================

export async function setDefaultView(id: string, module: string) {
  try {
    const tenantId = await getTenantId();

    // Verify the view belongs to this tenant
    const existing = await prisma.savedView.findFirst({
      where: { id, tenantId, module },
    });

    if (!existing) {
      return { success: false, error: "Saved view not found" };
    }

    // Unset all other defaults for this module within this tenant
    await prisma.savedView.updateMany({
      where: {
        tenantId,
        module,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this view as the default
    const view = await prisma.savedView.update({
      where: { id },
      data: { isDefault: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath(`/${module}`);
    return { success: true, data: view };
  } catch (error) {
    console.error("Failed to set default view:", error);
    return { success: false, error: "Failed to set default view" };
  }
}
