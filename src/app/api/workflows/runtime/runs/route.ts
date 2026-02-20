import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  listWorkflowRuns,
  runWorkflowWithRuntime,
  summarizeWorkflowRuntime,
  workflowRuntimeTriggerSchema,
} from "@/lib/workflow-runtime-store";

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const workflowId = request.nextUrl.searchParams.get("workflowId") || undefined;
    const status = request.nextUrl.searchParams.get("status") as "succeeded" | "dead_letter" | null;

    return NextResponse.json({
      data: await listWorkflowRuns(tenantId, {
        workflowId,
        status: status || undefined,
      }),
      summary: await summarizeWorkflowRuntime(tenantId),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = workflowRuntimeTriggerSchema.parse(body);

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: payload.workflowId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    if (!workflow) {
      throw new ApiError(404, "Workflow not found");
    }

    const run = await runWorkflowWithRuntime(tenantId, {
      workflowId: payload.workflowId,
      payload: payload.payload,
      maxRetries: payload.maxRetries,
      versionId: payload.versionId,
    });

    await logAuditEvent({
      request,
      action: "created",
      entity: "workflow_runtime_run",
      entityId: run.id,
      entityName: workflow.name,
      changes: {
        workflowId: payload.workflowId,
        status: run.status,
        retriesUsed: run.retriesUsed,
      },
    });

    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
