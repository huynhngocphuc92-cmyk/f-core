import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/tenant";
import { createTicketSchema } from "@/lib/validations/ticket";
import { getNextTicketNumber } from "@/lib/ticket-number";

// GET /api/tickets - List all tickets
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getDemoTenantId();
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50") || 50));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToUserId = searchParams.get("assignedToUserId");
    const pipelineId = searchParams.get("pipelineId");
    const stageId = searchParams.get("stageId");
    const category = searchParams.get("category");
    const allowedSortFields = ["createdAt", "updatedAt", "priority", "status", "ticketNumber", "title"];
    const sortBy = allowedSortFields.includes(searchParams.get("sortBy") || "") ? searchParams.get("sortBy")! : "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" as const : "desc" as const;

    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          ...(!isNaN(parseInt(search)) ? [{ ticketNumber: parseInt(search) }] : []),
        ],
      }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assignedToUserId && { assignedToUserId }),
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
      ...(category && { category }),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true, type: true, color: true } },
          pipeline: { select: { id: true, name: true } },
          sla: { select: { id: true, name: true, firstResponseTime: true, resolutionTime: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getDemoTenantId();
    const body = await request.json();

    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
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

    // Get default pipeline and first stage if not provided
    let pipelineId = data.pipelineId;
    let stageId = data.stageId;

    if (!pipelineId) {
      const defaultPipeline = await prisma.ticketPipeline.findFirst({
        where: { tenantId, isDefault: true, deletedAt: null },
        include: { stages: { orderBy: { displayOrder: "asc" }, take: 1, where: { deletedAt: null } } },
      });
      if (!defaultPipeline) {
        return NextResponse.json({ error: "No default ticket pipeline found" }, { status: 400 });
      }
      pipelineId = defaultPipeline.id;
      if (!stageId && defaultPipeline.stages[0]) {
        stageId = defaultPipeline.stages[0].id;
      }
    }

    if (!stageId) {
      return NextResponse.json({ error: "No stage available" }, { status: 400 });
    }

    // Get the stage to determine initial status
    const stage = await prisma.ticketPipelineStage.findUnique({
      where: { id: stageId },
      select: { type: true },
    });

    // Get next ticket number
    const ticketNumber = await getNextTicketNumber(tenantId);

    // Auto-assign SLA based on priority
    let slaId: string | undefined;
    const slaPolicy = await prisma.ticketSLAPolicy.findUnique({
      where: { tenantId_priority: { tenantId, priority: data.priority } },
      select: { id: true, resolutionTime: true },
    });
    if (slaPolicy) {
      slaId = slaPolicy.id;
    }

    // Get first user as creator for demo
    const demoUser = await prisma.user.findFirst({
      where: { tenantId },
      select: { id: true },
    });

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: stage?.type || "open",
        category: data.category,
        source: data.source,
        contactId: data.contactId,
        companyId: data.companyId,
        assignedToUserId: data.assignedToUserId,
        createdById: demoUser?.id,
        pipelineId,
        stageId,
        slaId,
        tags: data.tags,
        dueDate: slaPolicy ? new Date(Date.now() + slaPolicy.resolutionTime * 60 * 1000) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, type: true, color: true } },
        pipeline: { select: { id: true, name: true } },
        sla: { select: { id: true, name: true } },
      },
    });

    // Create initial activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        tenantId,
        type: "created",
        description: "Ticket created",
        performedById: demoUser?.id,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
