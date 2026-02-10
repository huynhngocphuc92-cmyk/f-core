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

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  triggerType: z
    .enum([
      "contact_created",
      "deal_stage_changed",
      "form_submitted",
      "manual",
    ])
    .optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        config: z.record(z.string(), z.string()),
      })
    )
    .optional(),
});

// GET /api/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    const additionalWhere = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
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

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workflow.count({ where }),
    ]);

    return paginatedResponse(workflows, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/workflows - Create a workflow
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createWorkflowSchema.parse(body);

    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType || "manual",
        triggerConfig: data.triggerConfig as Prisma.InputJsonValue,
        actions: (data.actions || []) as Prisma.InputJsonValue,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
