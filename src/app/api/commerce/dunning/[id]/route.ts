import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  cancelDunningCase,
  markDunningCasePaid,
  markDunningCaseRetryFailed,
  updateDunningCaseSchema,
} from "@/lib/dunning-store";

// PATCH /api/commerce/dunning/[id] - Execute dunning transition action
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const body = await request.json();
    const payload = updateDunningCaseSchema.parse(body);

    let dunningCase;

    try {
      if (payload.action === "mark_retry_failed") {
        dunningCase = await markDunningCaseRetryFailed(tenantId, id, payload.reason);
      } else if (payload.action === "mark_paid") {
        dunningCase = await markDunningCasePaid(tenantId, id, payload.reason);
      } else {
        dunningCase = await cancelDunningCase(tenantId, id, payload.reason);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dunning case transition failed";
      if (message === "Dunning case not found") {
        throw new ApiError(404, message);
      }
      throw new ApiError(409, message);
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "dunning_case",
      entityId: dunningCase.id,
      entityName: dunningCase.customerName,
      changes: {
        action: payload.action,
        status: dunningCase.status,
        attemptCount: dunningCase.attemptCount,
        nextRetryAt: dunningCase.nextRetryAt,
      },
    });

    return NextResponse.json({ dunningCase });
  } catch (error) {
    return handleApiError(error);
  }
}
