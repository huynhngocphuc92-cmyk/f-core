import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { validatePagination, buildWhereClause, paginatedResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/deals - List all deals (with tenant isolation)
export async function GET(request: NextRequest) {
  try {
    // Authentication & tenant isolation
    const tenantId = await getTenantId(request);
    
    // Pagination
    const { page, limit, skip } = validatePagination(request.nextUrl.searchParams);
    
    // Filters
    const pipelineId = request.nextUrl.searchParams.get("pipelineId");
    const stageId = request.nextUrl.searchParams.get("stageId");

    const additionalWhere = {
      deletedAt: null,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          stage: { select: { id: true, name: true, color: true, probability: true } },
          pipeline: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return paginatedResponse(deals, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/deals - Create a new deal (with tenant isolation)
export async function POST(request: NextRequest) {
  try {
    // Authentication & tenant isolation
    const tenantId = await getTenantId(request);
    
    const body = await request.json();

    if (!body.name || !body.pipelineId || !body.stageId) {
      return NextResponse.json(
        { error: "Name, pipelineId, and stageId are required" },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        tenantId,  // Use authenticated user's tenant, NOT from request body!
        name: body.name,
        description: body.description,
        amount: body.amount,
        currency: body.currency || "USD",
        closeDate: body.closeDate ? new Date(body.closeDate) : null,
        pipelineId: body.pipelineId,
        stageId: body.stageId,
        probability: body.probability,
        ownerId: body.ownerId,
        dealType: body.dealType,
        priority: body.priority,
        properties: body.properties || {},
      },
      include: {
        stage: true,
        pipeline: true,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
