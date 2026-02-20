import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  formatSalesPlaybookRun,
  updateSalesPlaybookStep,
  updateSalesPlaybookStepSchema,
} from "@/lib/sales-playbook-store";

// PATCH /api/sales/playbooks/[runId]/steps/[stepId] - Mark/unmark a playbook step
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string; stepId: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { runId, stepId } = await params;
    const body = await request.json();
    const payload = updateSalesPlaybookStepSchema.parse(body || {});

    const run = await updateSalesPlaybookStep({
      tenantId,
      runId,
      stepId,
      completed: payload.completed,
    });

    if (!run) {
      throw new ApiError(404, "Playbook run or step not found");
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "sales_playbook_step",
      entityId: `${runId}:${stepId}`,
      entityName: run.templateId,
      changes: {
        completed: payload.completed,
        status: run.status,
      },
    });

    return NextResponse.json({ run: formatSalesPlaybookRun(run) });
  } catch (error) {
    return handleApiError(error);
  }
}
