import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/deals/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const deal = await prisma.deal.findUnique({
      where: { id, tenantId, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        pipeline: { include: { stages: { orderBy: { orderIndex: "asc" } } } },
        contacts: { include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        companies: { include: { company: { select: { id: true, name: true, domain: true } } } },
        activities: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: deal });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal" },
      { status: 500 }
    );
  }
}

// PATCH /api/deals/[id] - Update deal (including stage change for drag-drop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.deal.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.closeDate !== undefined) updateData.closeDate = body.closeDate ? new Date(body.closeDate) : null;
    if (body.ownerId !== undefined) updateData.ownerId = body.ownerId;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dealType !== undefined) updateData.dealType = body.dealType;
    if (body.properties !== undefined) updateData.properties = body.properties;

    // Handle stage change (drag-and-drop)
    if (body.stageId !== undefined && body.stageId !== existing.stageId) {
      // Validate stage belongs to the deal's pipeline
      const targetStage = await prisma.pipelineStage.findFirst({
        where: { id: body.stageId, pipelineId: existing.pipelineId },
      });

      if (!targetStage) {
        return NextResponse.json(
          { error: "Stage not found in this pipeline" },
          { status: 400 }
        );
      }

      updateData.stageId = body.stageId;
      updateData.probability = targetStage.probability;

      // Handle closed stage transitions
      if (targetStage.isClosed) {
        updateData.closedAt = new Date();
        updateData.closedReason = targetStage.isWon ? "won" : "lost";
      } else if (existing.closedAt) {
        // Moving from closed to open stage - clear closed fields
        updateData.closedAt = null;
        updateData.closedReason = null;
      }
    }

    // Handle explicit closedReason (without stage change)
    if (body.closedReason !== undefined && !updateData.closedReason) {
      updateData.closedReason = body.closedReason;
      updateData.closedAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: { select: { id: true, name: true, color: true, probability: true, orderIndex: true, isClosed: true, isWon: true } },
        pipeline: { select: { id: true, name: true } },
        contacts: { include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        companies: { include: { company: { select: { id: true, name: true, domain: true } } } },
      },
    });

    return NextResponse.json({ data: deal });
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id] - Soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.deal.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    await prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
