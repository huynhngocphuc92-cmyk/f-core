"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
// WORKFLOW CRUD
// ============================================

export async function getWorkflows(filters?: {
  search?: string;
  status?: string;
}) {
  const tenantId = await getTenantId();
  return prisma.workflow.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(filters?.status && filters.status !== "all"
        ? { status: filters.status }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" as const } },
              { description: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getWorkflow(id: string) {
  const tenantId = await getTenantId();
  return prisma.workflow.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createWorkflow(formData: FormData): Promise<void> {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || undefined;
  const triggerType = (formData.get("triggerType") as string) || "manual";

  if (!name) {
    throw new Error("Name is required");
  }

  const workflow = await prisma.workflow.create({
    data: {
      tenantId,
      name,
      description,
      triggerType,
      ownerId: userId,
    },
  });

  redirect(`/workflows/${workflow.id}`);
}

export async function updateWorkflowActions(
  id: string,
  actions: { type: string; config: Record<string, string> }[]
) {
  const tenantId = await getTenantId();
  await prisma.workflow.updateMany({
    where: { id, tenantId },
    data: { actions: actions as unknown as Prisma.InputJsonValue },
  });
  revalidatePath(`/workflows/${id}`);
  return { success: true };
}

export async function toggleWorkflow(id: string, active: boolean) {
  const tenantId = await getTenantId();
  await prisma.workflow.updateMany({
    where: { id, tenantId },
    data: {
      isActive: active,
      status: active ? "active" : "paused",
    },
  });
  revalidatePath(`/workflows/${id}`);
  revalidatePath("/workflows");
}

export async function simulateWorkflow(id: string) {
  const tenantId = await getTenantId();

  const workflow = await prisma.workflow.findFirst({
    where: { id, tenantId, deletedAt: null },
  });

  if (!workflow) return { error: "Workflow not found" };

  // Simulate enrollment based on trigger type
  let enrolled = 0;
  if (workflow.triggerType === "contact_created") {
    enrolled = await prisma.contact.count({
      where: { tenantId, deletedAt: null },
    });
  } else if (workflow.triggerType === "deal_stage_changed") {
    enrolled = await prisma.deal.count({
      where: { tenantId, deletedAt: null },
    });
  } else if (workflow.triggerType === "form_submitted") {
    enrolled = await prisma.formSubmission.count({
      where: { form: { tenantId } },
    });
  } else {
    enrolled = Math.floor(Math.random() * 50) + 5;
  }

  const completed = Math.floor(enrolled * 0.85);

  await prisma.workflow.updateMany({
    where: { id, tenantId },
    data: {
      enrolledCount: { increment: enrolled },
      completedCount: { increment: completed },
      lastTriggeredAt: new Date(),
    },
  });

  revalidatePath(`/workflows/${id}`);
  revalidatePath("/workflows");
  return { success: true, enrolled };
}

export async function deleteWorkflow(id: string) {
  const tenantId = await getTenantId();
  await prisma.workflow.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date(), isActive: false, status: "draft" },
  });
  revalidatePath("/workflows");
}

export async function getWorkflowStats() {
  const tenantId = await getTenantId();

  const workflows = await prisma.workflow.findMany({
    where: { tenantId, deletedAt: null },
    select: { status: true, enrolledCount: true, completedCount: true },
  });

  const total = workflows.length;
  const active = workflows.filter((w) => w.status === "active").length;
  const totalEnrolled = workflows.reduce((s, w) => s + w.enrolledCount, 0);
  const totalCompleted = workflows.reduce((s, w) => s + w.completedCount, 0);

  return { total, active, totalEnrolled, totalCompleted };
}
