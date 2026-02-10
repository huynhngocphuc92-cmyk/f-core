import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { z } from "zod";

const createTicketSchema = z.object({
  subject: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  category: z.enum(["bug", "feature", "question", "support"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  source: z.enum(["email", "phone", "web", "chat"]).optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/tickets - List tickets
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");
    const priority = request.nextUrl.searchParams.get("priority");

    const additionalWhere = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return paginatedResponse(tickets, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tickets - Create a ticket
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createTicketSchema.parse(body);

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority || "medium",
        source: data.source,
        contactId: data.contactId,
        companyId: data.companyId,
        assigneeId: data.assigneeId,
        createdById: user.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        tags: data.tags,
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

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
