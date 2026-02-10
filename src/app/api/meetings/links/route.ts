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

const createLinkSchema = z.object({
  meetingTypeId: z.string().min(1),
  customMessage: z.string().max(2000).optional(),
});

// GET /api/meetings/links - List meeting links
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const additionalWhere = {
      isActive: true,
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [links, total] = await Promise.all([
      prisma.meetingLink.findMany({
        where,
        include: {
          meetingType: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.meetingLink.count({ where }),
    ]);

    return paginatedResponse(links, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/meetings/links - Create a meeting link
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createLinkSchema.parse(body);

    const meetingType = await prisma.meetingType.findFirst({
      where: { id: data.meetingTypeId, tenantId, deletedAt: null },
    });

    if (!meetingType) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    const slug = `${meetingType.slug}-${Date.now().toString(36)}`;

    const link = await prisma.meetingLink.create({
      data: {
        tenantId,
        slug,
        userId: user.id,
        meetingTypeId: data.meetingTypeId,
        customMessage: data.customMessage,
      },
      include: {
        meetingType: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
