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

const createMeetingTypeSchema = z.object({
  name: z.string().min(1).max(200),
  duration: z.number().int().min(5).max(480),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  bufferBefore: z.number().int().min(0).max(60).optional(),
  bufferAfter: z.number().int().min(0).max(60).optional(),
});

// GET /api/meetings/types - List meeting types
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const additionalWhere = {
      deletedAt: null,
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [types, total] = await Promise.all([
      prisma.meetingType.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { meetingLinks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.meetingType.count({ where }),
    ]);

    return paginatedResponse(types, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/meetings/types - Create a meeting type
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createMeetingTypeSchema.parse(body);

    // Generate slug from name
    let slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check uniqueness
    const existing = await prisma.meetingType.findFirst({
      where: { tenantId, slug, deletedAt: null },
    });

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const meetingType = await prisma.meetingType.create({
      data: {
        tenantId,
        name: data.name,
        slug,
        duration: data.duration,
        description: data.description,
        location: data.location,
        color: data.color || "#0891b2",
        bufferBefore: data.bufferBefore ?? 0,
        bufferAfter: data.bufferAfter ?? 5,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(meetingType, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
