import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updatePipelineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/pipelines/[id] - Get a single pipeline with stages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);

    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { orderIndex: "asc" },
        },
        _count: { select: { deals: true } },
      },
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    await checkOwnership(pipeline.tenantId, request);

    return NextResponse.json(pipeline);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/pipelines/[id] - Update a pipeline
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const data = updatePipelineSchema.parse(body);

    const existing = await prisma.pipeline.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.pipeline.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.pipeline.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        stages: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json(pipeline);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/pipelines/[id] - Delete a pipeline
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.pipeline.findUnique({
      where: { id },
      select: { tenantId: true, isDefault: true, _count: { select: { deals: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    if (existing.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default pipeline" },
        { status: 400 }
      );
    }

    if (existing._count.deals > 0) {
      return NextResponse.json(
        { error: "Cannot delete pipeline with existing deals. Move or delete deals first." },
        { status: 400 }
      );
    }

    // Cascade deletes stages via Prisma schema
    await prisma.pipeline.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
