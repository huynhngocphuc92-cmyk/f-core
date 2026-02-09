import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/tenant";
import { updateTicketSchema } from "@/lib/validations/ticket";

// GET /api/tickets/[id] - Get a single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDemoTenantId();
    const { id } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, domain: true } },
        stage: { select: { id: true, name: true, type: true, color: true, displayOrder: true } },
        pipeline: {
          select: {
            id: true,
            name: true,
            stages: {
              where: { deletedAt: null },
              orderBy: { displayOrder: "asc" },
              select: { id: true, name: true, type: true, color: true, displayOrder: true },
            },
          },
        },
        sla: true,
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            performedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] - Update a ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDemoTenantId();
    const { id } = await params;
    const body = await request.json();

    const parsed = updateTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.ticket.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const data = parsed.data;

    // Validate contactId belongs to tenant
    if (data.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: data.contactId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 400 });
      }
    }

    // Validate companyId belongs to tenant
    if (data.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: data.companyId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 400 });
      }
    }

    const activityEntries: Array<{
      ticketId: string;
      tenantId: string;
      type: string;
      field: string;
      oldValue: string | null;
      newValue: string | null;
      description: string;
    }> = [];

    // Track field changes for activity log
    const trackableFields = ["priority", "status", "assignedToUserId", "stageId", "category"] as const;
    for (const field of trackableFields) {
      if (data[field] !== undefined && data[field] !== existing[field]) {
        const typeMap: Record<string, string> = {
          priority: "priority_change",
          status: "status_change",
          assignedToUserId: "assignment_change",
          stageId: "stage_change",
          category: "category_change",
        };
        activityEntries.push({
          ticketId: id,
          tenantId,
          type: typeMap[field],
          field,
          oldValue: existing[field] as string | null,
          newValue: data[field] as string | null,
          description: `${field} changed`,
        });
      }
    }

    // If stageId changed, sync the status from the stage type
    let statusFromStage: string | undefined;
    if (data.stageId && data.stageId !== existing.stageId) {
      const newStage = await prisma.ticketPipelineStage.findFirst({
        where: { id: data.stageId, pipelineId: existing.pipelineId, deletedAt: null },
        select: { type: true },
      });
      if (!newStage) {
        return NextResponse.json({ error: "Stage not found in this pipeline" }, { status: 400 });
      }
      statusFromStage = newStage.type;
    }

    // Determine timestamps based on status changes
    const newStatus = statusFromStage || data.status;
    const timestamps: Record<string, Date> = {};
    if (newStatus === "resolved" && !existing.resolvedAt) {
      timestamps.resolvedAt = new Date();
    }
    if (newStatus === "closed" && !existing.closedAt) {
      timestamps.closedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        ...(statusFromStage && { status: statusFromStage }),
        ...timestamps,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, type: true, color: true } },
        pipeline: { select: { id: true, name: true } },
        sla: { select: { id: true, name: true } },
      },
    });

    // Create activity entries
    if (activityEntries.length > 0) {
      await prisma.ticketActivity.createMany({ data: activityEntries });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Soft delete a ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDemoTenantId();
    const { id } = await params;

    const existing = await prisma.ticket.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    );
  }
}
