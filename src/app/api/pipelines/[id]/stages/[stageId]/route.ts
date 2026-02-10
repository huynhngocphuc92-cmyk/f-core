import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  orderIndex: z.number().int().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  color: z.string().max(20).optional(),
  isClosed: z.boolean().optional(),
  isWon: z.boolean().optional(),
});

// Helper: verify pipeline ownership
async function verifyPipelineAccess(pipelineId: string, request: NextRequest) {
  const pipeline = await prisma.pipeline.findUnique({
    where: { id: pipelineId },
    select: { tenantId: true },
  });

  if (!pipeline) {
    return null;
  }

  await checkOwnership(pipeline.tenantId, request);
  return pipeline;
}

// GET /api/pipelines/[id]/stages/[stageId] - Get a single stage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    await getTenantId(request);

    const pipeline = await verifyPipelineAccess(id, request);
    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    const stage = await prisma.pipelineStage.findUnique({
      where: { id: stageId, pipelineId: id },
      include: {
        _count: { select: { deals: true } },
      },
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Stage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(stage);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/pipelines/[id]/stages/[stageId] - Update a stage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateStageSchema.parse(body);

    const pipeline = await verifyPipelineAccess(id, request);
    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.pipelineStage.findUnique({
      where: { id: stageId, pipelineId: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Stage not found" },
        { status: 404 }
      );
    }

    const stage = await prisma.pipelineStage.update({
      where: { id: stageId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isClosed !== undefined && { isClosed: data.isClosed }),
        ...(data.isWon !== undefined && { isWon: data.isWon }),
      },
    });

    return NextResponse.json(stage);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/pipelines/[id]/stages/[stageId] - Delete a stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    await getTenantId(request);

    const pipeline = await verifyPipelineAccess(id, request);
    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.pipelineStage.findUnique({
      where: { id: stageId, pipelineId: id },
      select: { _count: { select: { deals: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Stage not found" },
        { status: 404 }
      );
    }

    if (existing._count.deals > 0) {
      return NextResponse.json(
        { error: "Cannot delete stage with existing deals. Move deals to another stage first." },
        { status: 400 }
      );
    }

    await prisma.pipelineStage.delete({ where: { id: stageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
