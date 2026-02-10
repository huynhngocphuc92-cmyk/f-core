import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
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
  isActive: z.boolean().optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
});

// GET /api/workflows/[id] - Get a single workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const workflow = await prisma.workflow.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    await checkOwnership(workflow.tenantId, request);

    return NextResponse.json(workflow);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/workflows/[id] - Update a workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateWorkflowSchema.parse(body);

    const existing = await prisma.workflow.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.triggerType !== undefined && {
          triggerType: data.triggerType,
        }),
        ...(data.triggerConfig !== undefined && {
          triggerConfig: data.triggerConfig as Prisma.InputJsonValue,
        }),
        ...(data.actions !== undefined && {
          actions: data.actions as unknown as Prisma.InputJsonValue,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/workflows/[id] - Soft delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.workflow.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.workflow.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: "draft" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
