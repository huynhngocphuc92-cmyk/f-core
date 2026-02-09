import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/deals/[id] (with tenant check)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);

    const deal = await prisma.deal.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        pipeline: { include: { stages: { orderBy: { orderIndex: "asc" } } } },
        activities: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Check tenant ownership
    await checkOwnership(deal.tenantId, request);

    return NextResponse.json(deal);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/deals/[id] - Update deal (with tenant check)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);
    const body = await request.json();

    // Fetch deal first to verify ownership
    const existingDeal = await prisma.deal.findUnique({
      where: { id, deletedAt: null },
      select: { tenantId: true },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Check tenant ownership
    await checkOwnership(existingDeal.tenantId, request);

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.closeDate !== undefined) updateData.closeDate = body.closeDate ? new Date(body.closeDate) : null;
    if (body.stageId !== undefined) updateData.stageId = body.stageId;
    if (body.pipelineId !== undefined) updateData.pipelineId = body.pipelineId;
    if (body.probability !== undefined) updateData.probability = body.probability;
    if (body.ownerId !== undefined) updateData.ownerId = body.ownerId;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.closedReason !== undefined) {
      updateData.closedReason = body.closedReason;
      updateData.closedAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: { stage: true, pipeline: true },
    });

    return NextResponse.json(deal);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/deals/[id] - Soft delete (with tenant check)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);

    // Fetch deal first to verify ownership
    const existingDeal = await prisma.deal.findUnique({
      where: { id, deletedAt: null },
      select: { tenantId: true },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Check tenant ownership
    await checkOwnership(existingDeal.tenantId, request);

    await prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
