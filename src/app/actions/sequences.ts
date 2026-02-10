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
// GET SEQUENCES (list with filters)
// ============================================

export async function getSequences(filters?: {
  search?: string;
  status?: string;
}) {
  const tenantId = await getTenantId();
  return prisma.sequence.findMany({
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

// ============================================
// GET SEQUENCE STATS
// ============================================

export async function getSequenceStats() {
  const tenantId = await getTenantId();

  const sequences = await prisma.sequence.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      status: true,
      enrolledCount: true,
      completedCount: true,
    },
  });

  const total = sequences.length;
  const active = sequences.filter((s) => s.status === "active").length;
  const totalEnrolled = sequences.reduce((sum, s) => sum + s.enrolledCount, 0);
  const totalCompleted = sequences.reduce((sum, s) => sum + s.completedCount, 0);

  return { total, active, totalEnrolled, totalCompleted };
}

// ============================================
// GET SINGLE SEQUENCE
// ============================================

export async function getSequence(id: string) {
  const tenantId = await getTenantId();
  return prisma.sequence.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      enrollments: {
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 50,
      },
    },
  });
}

// ============================================
// CREATE SEQUENCE
// ============================================

export async function createSequence(formData: FormData): Promise<void> {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || undefined;
  const stepsJson = formData.get("steps") as string;

  if (!name) {
    throw new Error("Name is required");
  }

  let steps: unknown[] = [];
  if (stepsJson) {
    try {
      steps = JSON.parse(stepsJson);
    } catch {
      steps = [];
    }
  }

  const sequence = await prisma.sequence.create({
    data: {
      tenantId,
      name,
      description,
      ownerId: userId,
      steps: steps as Prisma.InputJsonValue,
      status: "draft",
    },
  });

  redirect(`/sequences/${sequence.id}`);
}

// ============================================
// UPDATE SEQUENCE
// ============================================

export async function updateSequence(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    steps?: unknown[];
  }
) {
  const tenantId = await getTenantId();

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.steps !== undefined) updateData.steps = data.steps as Prisma.InputJsonValue;

  await prisma.sequence.updateMany({
    where: { id, tenantId },
    data: updateData,
  });

  revalidatePath(`/sequences/${id}`);
  revalidatePath("/sequences");
  return { success: true };
}

// ============================================
// DELETE SEQUENCE (soft delete)
// ============================================

export async function deleteSequence(id: string) {
  const tenantId = await getTenantId();
  await prisma.sequence.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date(), status: "draft" },
  });
  revalidatePath("/sequences");
}

// ============================================
// ENROLL CONTACT
// ============================================

export async function enrollContact(sequenceId: string, contactId: string) {
  const tenantId = await getTenantId();

  // Verify the sequence belongs to this tenant and is active
  const sequence = await prisma.sequence.findFirst({
    where: { id: sequenceId, tenantId, deletedAt: null },
  });

  if (!sequence) {
    return { error: "Sequence not found" };
  }

  // Verify the contact belongs to this tenant
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId, deletedAt: null },
  });

  if (!contact) {
    return { error: "Contact not found" };
  }

  // Check for existing enrollment
  const existing = await prisma.sequenceEnrollment.findUnique({
    where: { sequenceId_contactId: { sequenceId, contactId } },
  });

  if (existing) {
    return { error: "Contact is already enrolled in this sequence" };
  }

  const steps = Array.isArray(sequence.steps) ? sequence.steps : [];

  await prisma.sequenceEnrollment.create({
    data: {
      sequenceId,
      contactId,
      status: "active",
      currentStep: 0,
      startedAt: new Date(),
      nextStepAt: new Date(),
    },
  });

  // Increment enrolled count
  await prisma.sequence.updateMany({
    where: { id: sequenceId, tenantId },
    data: { enrolledCount: { increment: 1 } },
  });

  revalidatePath(`/sequences/${sequenceId}`);
  revalidatePath("/sequences");
  return { success: true };
}

// ============================================
// TOGGLE SEQUENCE STATUS
// ============================================

export async function toggleSequence(id: string, active: boolean) {
  const tenantId = await getTenantId();
  await prisma.sequence.updateMany({
    where: { id, tenantId },
    data: {
      status: active ? "active" : "paused",
    },
  });
  revalidatePath(`/sequences/${id}`);
  revalidatePath("/sequences");
}

// ============================================
// UPDATE SEQUENCE STEPS
// ============================================

export async function updateSequenceSteps(
  id: string,
  steps: unknown[]
) {
  const tenantId = await getTenantId();
  await prisma.sequence.updateMany({
    where: { id, tenantId },
    data: { steps: steps as Prisma.InputJsonValue },
  });
  revalidatePath(`/sequences/${id}`);
  return { success: true };
}
