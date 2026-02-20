import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { getSlaPolicy } from "@/lib/sla-policy-store";
import { computeTicketDueDate, withTicketSla } from "@/lib/sla-helpers";
import { hasSurveyBeenSentForTicket } from "@/lib/service-survey";
import { issueCustomerPortalToken } from "@/lib/customer-portal-token";
import { z } from "zod";

const updateTicketSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  category: z.enum(["bug", "feature", "question", "support"]).optional(),
  status: z
    .enum(["open", "in_progress", "waiting", "resolved", "closed"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/tickets/[id] - Get a single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const ticket = await prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    await checkOwnership(ticket.tenantId, request);
    const slaPolicy = await getSlaPolicy(ticket.tenantId);
    return NextResponse.json(withTicketSla(ticket, new Date(), slaPolicy));
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/tickets/[id] - Update a ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    const existing = await prisma.ticket.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);
    const slaPolicy = await getSlaPolicy(existing.tenantId);

    // Handle status change timestamps
    const statusData: Record<string, Date | null> = {};
    if (data.status === "resolved" && existing.status !== "resolved") {
      statusData.resolvedAt = new Date();
    }
    if (data.status === "closed" && existing.status !== "closed") {
      statusData.closedAt = new Date();
    }
    if (
      data.status &&
      data.status !== "open" &&
      !existing.firstResponseAt
    ) {
      statusData.firstResponseAt = new Date();
    }

    const nextPriority = data.priority ?? existing.priority;
    const shouldAutoRecalculateDueDate =
      data.dueDate === undefined &&
      data.priority !== undefined &&
      existing.dueDate === null;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.contactId !== undefined && { contactId: data.contactId }),
        ...(data.companyId !== undefined && { companyId: data.companyId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(shouldAutoRecalculateDueDate && {
          dueDate: computeTicketDueDate(existing.createdAt, nextPriority, slaPolicy),
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...statusData,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: { select: { id: true, name: true } },
      },
    });

    await logAuditEvent({
      request,
      action: "updated",
      entity: "ticket",
      entityId: ticket.id,
      entityName: ticket.subject,
      changes: {
        updatedFields: Object.keys(data),
        status: ticket.status,
      },
    });

    if (data.status === "resolved" && existing.status !== "resolved" && ticket.contactId) {
      const [contact, recentSurveyActivities] = await Promise.all([
        prisma.contact.findFirst({
          where: { id: ticket.contactId, tenantId: ticket.tenantId, deletedAt: null },
          select: { id: true, email: true },
        }),
        prisma.activity.findMany({
          where: {
            tenantId: ticket.tenantId,
            contactId: ticket.contactId,
            type: "note",
          },
          select: { metadata: true },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
      ]);

      if (contact?.email && !hasSurveyBeenSentForTicket(recentSurveyActivities, ticket.id)) {
        const { token } = issueCustomerPortalToken({
          tenantId: ticket.tenantId,
          contactId: contact.id,
          email: contact.email,
          expiresInMinutes: 60 * 24 * 7,
        });
        const portalPath = `/portal/tickets/${ticket.id}?token=${encodeURIComponent(token)}`;

        await prisma.activity.create({
          data: {
            tenantId: ticket.tenantId,
            type: "note",
            contactId: contact.id,
            subject: "CSAT/NPS survey sent",
            body: "Survey invitation triggered after ticket resolution.",
            metadata: {
              source: "service_survey",
              status: "sent",
              workflow: "ticket_resolved",
              ticketId: ticket.id,
              portalPath,
            },
          },
        });
      }
    }

    return NextResponse.json(withTicketSla(ticket, new Date(), slaPolicy));
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tickets/[id] - Soft delete a ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.ticket.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAuditEvent({
      request,
      action: "deleted",
      entity: "ticket",
      entityId: existing.id,
      entityName: existing.subject,
      metadata: {
        status: existing.status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
