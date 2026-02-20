import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { createWorkflowVersion, listWorkflowVersions } from "@/lib/workflow-runtime-store";

const createVersionSchema = z.object({
  label: z.string().min(1).max(120).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!workflow) {
      throw new ApiError(404, "Workflow not found");
    }

    return NextResponse.json({
      data: await listWorkflowVersions(tenantId, id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const body = await request.json();
    const payload = createVersionSchema.parse(body);

    const workflow = await prisma.workflow.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        name: true,
        triggerType: true,
        triggerConfig: true,
        actions: true,
        status: true,
        isActive: true,
      },
    });

    if (!workflow) {
      throw new ApiError(404, "Workflow not found");
    }

    await checkOwnership(workflow.tenantId, request);

    const version = await createWorkflowVersion(
      tenantId,
      {
        id: workflow.id,
        triggerType: workflow.triggerType,
        triggerConfig: (workflow.triggerConfig as Record<string, unknown> | null) || null,
        actions: Array.isArray(workflow.actions)
          ? (workflow.actions as Array<{ type: string; config: Record<string, string> }>)
          : [],
        status: workflow.status,
        isActive: workflow.isActive,
      },
      payload.label
    );

    await logAuditEvent({
      request,
      action: "created",
      entity: "workflow_version",
      entityId: version.id,
      entityName: workflow.name,
      changes: {
        workflowId: workflow.id,
        version: version.version,
        label: version.label,
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
