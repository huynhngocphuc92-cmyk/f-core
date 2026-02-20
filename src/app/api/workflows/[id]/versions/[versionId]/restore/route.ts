import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { createWorkflowVersion, getWorkflowVersion } from "@/lib/workflow-runtime-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { id, versionId } = await params;

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

    const version = await getWorkflowVersion(tenantId, id, versionId);

    const restored = await prisma.workflow.update({
      where: { id },
      data: {
        triggerType: version.snapshot.triggerType,
        triggerConfig: version.snapshot.triggerConfig as Prisma.InputJsonValue,
        actions: version.snapshot.actions as unknown as Prisma.InputJsonValue,
        status: version.snapshot.status,
        isActive: version.snapshot.isActive,
      },
    });

    const postRestoreVersion = await createWorkflowVersion(tenantId, {
      id: workflow.id,
      triggerType: restored.triggerType,
      triggerConfig: (restored.triggerConfig as Record<string, unknown> | null) || null,
      actions: Array.isArray(restored.actions)
        ? (restored.actions as Array<{ type: string; config: Record<string, string> }>)
        : [],
      status: restored.status,
      isActive: restored.isActive,
    }, `restore:${version.label}`);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "workflow_version_restore",
      entityId: restored.id,
      entityName: workflow.name,
      changes: {
        sourceVersionId: version.id,
        sourceVersion: version.version,
        createdVersionId: postRestoreVersion.id,
      },
    });

    return NextResponse.json({
      workflow: restored,
      restoredFrom: version,
      createdVersion: postRestoreVersion,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
