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

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  category: z.string().max(100).optional(),
  isShared: z.boolean().optional(),
});

// GET /api/emails/templates - List email templates
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const category = request.nextUrl.searchParams.get("category");

    const additionalWhere = {
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { subject: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        include: { owner: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    return paginatedResponse(templates, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/emails/templates - Create an email template
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    const template = await prisma.emailTemplate.create({
      data: {
        tenantId,
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category,
        isShared: data.isShared ?? true,
        ownerId: user.id,
      },
      include: { owner: { select: { id: true, name: true } } },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
