import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createSavedViewSchema = z.object({
  name: z.string().min(1).max(200),
  module: z.string().min(1).max(50),
  filters: z.array(z.record(z.string(), z.unknown())).optional(),
  columns: z.array(z.string()).optional(),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
});

// GET /api/saved-views - List saved views for a module
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const module = request.nextUrl.searchParams.get("module");

    const additionalWhere = {
      ...(module ? { module } : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [views, total] = await Promise.all([
      prisma.savedView.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.savedView.count({ where }),
    ]);

    return paginatedResponse(views, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/saved-views - Create a saved view
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createSavedViewSchema.parse(body);

    // If setting as default, unset other defaults for this module
    if (data.isDefault) {
      await prisma.savedView.updateMany({
        where: {
          tenantId,
          module: data.module,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const view = await prisma.savedView.create({
      data: {
        tenantId,
        userId: user.id,
        name: data.name,
        module: data.module,
        filters: (data.filters || []) as Prisma.InputJsonValue,
        columns: (data.columns || []) as Prisma.InputJsonValue,
        sortBy: data.sortBy,
        sortOrder: data.sortOrder || "asc",
        isDefault: data.isDefault || false,
        isShared: data.isShared || false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(view, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
