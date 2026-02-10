import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createStageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  orderIndex: z.number().int().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  color: z.string().max(20).optional(),
  isClosed: z.boolean().optional(),
  isWon: z.boolean().optional(),
});

// GET /api/pipelines/[id]/stages - List all stages for a pipeline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    await checkOwnership(pipeline.tenantId, request);

    const stages = await prisma.pipelineStage.findMany({
      where: { pipelineId: id },
      include: {
        _count: { select: { deals: true } },
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ data: stages });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/pipelines/[id]/stages - Create a new stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = createStageSchema.parse(body);

    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    await checkOwnership(pipeline.tenantId, request);

    // Auto-calculate orderIndex if not provided
    let orderIndex = data.orderIndex;
    if (orderIndex === undefined) {
      const lastStage = await prisma.pipelineStage.findFirst({
        where: { pipelineId: id },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });
      orderIndex = (lastStage?.orderIndex ?? -1) + 1;
    }

    const stage = await prisma.pipelineStage.create({
      data: {
        pipelineId: id,
        name: data.name,
        orderIndex,
        probability: data.probability ?? 0,
        color: data.color,
        isClosed: data.isClosed ?? false,
        isWon: data.isWon ?? false,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
