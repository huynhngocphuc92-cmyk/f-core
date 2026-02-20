import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { handleApiError, validatePagination } from "@/lib/api-helpers";
import { getPortalContextFromRequest } from "@/lib/service-portal-auth";
import { getSlaPolicy } from "@/lib/sla-policy-store";
import { computeTicketDueDate, withTicketSla } from "@/lib/sla-helpers";
import { resolveTicketAssignment } from "@/lib/service-routing-store";

const createPortalTicketSchema = z.object({
  subject: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  category: z.enum(["bug", "feature", "question", "support"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  source: z.enum(["email", "phone", "web", "chat"]).optional(),
});

// GET /api/service/portal/tickets - Contact-scoped ticket list
export async function GET(request: NextRequest) {
  try {
    const portal = await getPortalContextFromRequest(request);
    const { page, limit, skip } = validatePagination(request.nextUrl.searchParams);

    const status = request.nextUrl.searchParams.get("status");
    const search = request.nextUrl.searchParams.get("search");
    const slaPolicy = await getSlaPolicy(portal.tenantId);

    const where = {
      tenantId: portal.tenantId,
      contactId: portal.contactId,
      deletedAt: null,
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      data: tickets.map((ticket) => withTicketSla(ticket, new Date(), slaPolicy)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/service/portal/tickets - Contact creates ticket
export async function POST(request: NextRequest) {
  try {
    const portal = await getPortalContextFromRequest(request);
    const body = await request.json();
    const data = createPortalTicketSchema.parse(body);
    const slaPolicy = await getSlaPolicy(portal.tenantId);

    const routingUsers = await prisma.user.findMany({
      where: { tenantId: portal.tenantId, deletedAt: null },
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
      tenantId: portal.tenantId,
      priority: data.priority || "medium",
      source: data.source || "web",
      users: routingUsers,
    });

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: portal.tenantId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority || "medium",
        source: data.source || "web",
        contactId: portal.contactId,
        assigneeId: routing.assigneeId,
        dueDate: computeTicketDueDate(new Date(), data.priority || "medium", slaPolicy),
        tags: ["portal"],
      },
      include: {
        assignee: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(withTicketSla(ticket, new Date(), slaPolicy), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
