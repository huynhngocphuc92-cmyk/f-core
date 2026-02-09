import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/tenant";
import { createTicketPipelineSchema } from "@/lib/validations/ticket";

// GET /api/tickets/pipelines - List ticket pipelines
export async function GET() {
  try {
    const tenantId = await getDemoTenantId();

    const pipelines = await prisma.ticketPipeline.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { displayOrder: "asc" },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: pipelines });
  } catch (error) {
    console.error("Error fetching pipelines:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipelines" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/pipelines - Create a new ticket pipeline
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getDemoTenantId();
    const body = await request.json();

    const parsed = createTicketPipelineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { stages, ...pipelineData } = parsed.data;

    // Check if there are existing pipelines
    const existingCount = await prisma.ticketPipeline.count({
      where: { tenantId, deletedAt: null },
    });

    const pipeline = await prisma.ticketPipeline.create({
      data: {
        tenantId,
        name: pipelineData.name,
        description: pipelineData.description,
        isDefault: existingCount === 0,
        stages: {
          create: stages.map((stage, index) => ({
            name: stage.name,
            type: stage.type,
            color: stage.color,
            displayOrder: index,
          })),
        },
      },
      include: {
        stages: { orderBy: { displayOrder: "asc" } },
      },
    });

    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    console.error("Error creating pipeline:", error);
    return NextResponse.json(
      { error: "Failed to create pipeline" },
      { status: 500 }
    );
  }
}
