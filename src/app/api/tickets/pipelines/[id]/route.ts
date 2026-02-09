import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/tenant";
import { updateTicketPipelineSchema } from "@/lib/validations/ticket";

// GET /api/tickets/pipelines/[id] - Get a single pipeline with stages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDemoTenantId();
    const { id } = await params;

    const pipeline = await prisma.ticketPipeline.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { displayOrder: "asc" },
          include: { _count: { select: { tickets: true } } },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!pipeline) {
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
    }

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline" },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/pipelines/[id] - Update a pipeline and its stages
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDemoTenantId();
    const { id } = await params;
    const body = await request.json();

    const parsed = updateTicketPipelineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.ticketPipeline.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
    }

    const { stages, ...pipelineData } = parsed.data;

    // Update pipeline fields
    const pipeline = await prisma.ticketPipeline.update({
      where: { id },
      data: {
        ...(pipelineData.name && { name: pipelineData.name }),
        ...(pipelineData.description !== undefined && { description: pipelineData.description }),
      },
    });

    // Update stages if provided
    if (stages) {
      await prisma.$transaction(async (tx) => {
        for (const stage of stages) {
          if (stage.id) {
            // Verify stage belongs to this pipeline
            const existingStage = await tx.ticketPipelineStage.findFirst({
              where: { id: stage.id, pipelineId: id },
              select: { id: true },
            });
            if (!existingStage) continue;
            await tx.ticketPipelineStage.update({
              where: { id: stage.id },
              data: {
                name: stage.name,
                type: stage.type,
                color: stage.color,
                displayOrder: stage.displayOrder,
              },
            });
          } else {
            await tx.ticketPipelineStage.create({
              data: {
                pipelineId: id,
                name: stage.name,
                type: stage.type,
                color: stage.color,
                displayOrder: stage.displayOrder,
              },
            });
          }
        }
      });
    }

    // Return updated pipeline with stages
    const updated = await prisma.ticketPipeline.findUnique({
      where: { id },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating pipeline:", error);
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 }
    );
  }
}
