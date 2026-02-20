"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSlaPolicy } from "@/lib/sla-policy-store";
import { computeTicketDueDate, withTicketSla } from "@/lib/sla-helpers";
import { resolveTicketAssignment } from "@/lib/service-routing-store";

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
// TICKETS CRUD
// ============================================

export async function getTickets(filters?: {
  search?: string;
  status?: string;
  priority?: string;
}) {
  const tenantId = await getTenantId();
  const slaPolicy = await getSlaPolicy(tenantId);

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(filters?.status && filters.status !== "all"
        ? { status: filters.status }
        : {}),
      ...(filters?.priority && filters.priority !== "all"
        ? { priority: filters.priority }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { subject: { contains: filters.search, mode: "insensitive" as const } },
              { description: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return tickets.map((ticket) => withTicketSla(ticket, new Date(), slaPolicy));
}

export async function getTicket(id: string) {
  const tenantId = await getTenantId();
  const slaPolicy = await getSlaPolicy(tenantId);
  const ticket = await prisma.ticket.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      company: { select: { id: true, name: true } },
    },
  });

  return ticket ? withTicketSla(ticket, new Date(), slaPolicy) : null;
}

export async function createTicket(formData: FormData): Promise<void> {
  const tenantId = await getTenantId();
  const slaPolicy = await getSlaPolicy(tenantId);
  const userId = await getDefaultUserId();

  const subject = formData.get("subject") as string;
  const description = (formData.get("description") as string) || undefined;
  const category = (formData.get("category") as string) || undefined;
  const priority = (formData.get("priority") as string) || "medium";
  const source = (formData.get("source") as string) || "web";
  const contactId = (formData.get("contactId") as string) || undefined;
  const companyId = (formData.get("companyId") as string) || undefined;

  if (!subject) {
    throw new Error("Subject is required");
  }

  const routingUsers = await prisma.user.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      id: true,
      role: true,
      availability: {
        where: { isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
    take: 200,
  });
  const routing = await resolveTicketAssignment({
    tenantId,
    priority: priority as "low" | "medium" | "high" | "urgent",
    source: source as "email" | "phone" | "web" | "chat",
    users: routingUsers,
  });

  const ticket = await prisma.ticket.create({
    data: {
      tenantId,
      subject,
      description,
      category,
      priority,
      source,
      contactId: contactId || undefined,
      companyId: companyId || undefined,
      createdById: userId,
      assigneeId: routing.assigneeId || userId,
      dueDate: computeTicketDueDate(new Date(), priority, slaPolicy),
    },
  });

  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketStatus(id: string, status: string) {
  const tenantId = await getTenantId();

  const updateData: Record<string, unknown> = { status };

  if (status === "resolved") {
    updateData.resolvedAt = new Date();
  } else if (status === "closed") {
    updateData.closedAt = new Date();
  }

  await prisma.ticket.updateMany({
    where: { id, tenantId },
    data: updateData,
  });

  revalidatePath(`/tickets/${id}`);
  revalidatePath("/tickets");
}

export async function updateTicketPriority(id: string, priority: string) {
  const tenantId = await getTenantId();
  await prisma.ticket.updateMany({
    where: { id, tenantId },
    data: { priority },
  });
  revalidatePath(`/tickets/${id}`);
  revalidatePath("/tickets");
}

export async function deleteTicket(id: string) {
  const tenantId = await getTenantId();
  await prisma.ticket.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/tickets");
}

export async function getTicketStats() {
  const tenantId = await getTenantId();

  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.ticket.count({ where: { tenantId, deletedAt: null } }),
    prisma.ticket.count({ where: { tenantId, deletedAt: null, status: "open" } }),
    prisma.ticket.count({ where: { tenantId, deletedAt: null, status: "in_progress" } }),
    prisma.ticket.count({ where: { tenantId, deletedAt: null, status: "resolved" } }),
  ]);

  return { total, open, inProgress, resolved };
}
