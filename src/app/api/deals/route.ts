import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/deals - List all deals
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const pipelineId = searchParams.get("pipelineId");
    const stageId = searchParams.get("stageId");

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
    };

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

    return NextResponse.json({
      data: deals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json({ error: "Failed to fetch deals", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.pipelineId || !body.stageId) {
      return NextResponse.json(
        { error: "Name, pipelineId, and stageId are required" },
        { status: 400 }
      );
    }

    const tenantId = body.tenantId || "demo-tenant";

    const deal = await prisma.deal.create({
      data: {
        tenantId,
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
    console.error("Error creating deal:", error);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
