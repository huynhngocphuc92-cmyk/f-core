import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { z } from "zod";

const createPipelineSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/pipelines - List all pipelines
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const isActive = request.nextUrl.searchParams.get("isActive");

    const additionalWhere = {
      ...(isActive !== null && { isActive: isActive !== "false" }),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [pipelines, total] = await Promise.all([
      prisma.pipeline.findMany({
        where,
        include: {
          stages: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              name: true,
              orderIndex: true,
              probability: true,
              color: true,
              isClosed: true,
              isWon: true,
            },
          },
          _count: { select: { deals: true } },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        skip,
        take: limit,
      }),
      prisma.pipeline.count({ where }),
    ]);

    return paginatedResponse(pipelines, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/pipelines - Create a new pipeline
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const data = createPipelineSchema.parse(body);

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.pipeline.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault ?? false,
      },
      include: {
        stages: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
