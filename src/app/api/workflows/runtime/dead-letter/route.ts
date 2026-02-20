import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  listWorkflowDeadLetters,
  retryWorkflowDeadLetter,
  workflowDeadLetterRetrySchema,
} from "@/lib/workflow-runtime-store";

const retryDeadLetterSchema = z.object({
  deadLetterId: z.string().min(1),
  maxRetries: workflowDeadLetterRetrySchema.shape.maxRetries.optional(),
  dryRun: workflowDeadLetterRetrySchema.shape.dryRun.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const workflowId = request.nextUrl.searchParams.get("workflowId") || undefined;
    const unresolvedOnly = request.nextUrl.searchParams.get("unresolvedOnly") !== "false";

    return NextResponse.json({
      data: await listWorkflowDeadLetters(tenantId, {
        workflowId,
        unresolvedOnly,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const input = retryDeadLetterSchema.parse(body);

    let result;
    try {
      result = await retryWorkflowDeadLetter(tenantId, input.deadLetterId, {
        maxRetries: input.maxRetries ?? 2,
        dryRun: input.dryRun ?? false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to retry dead-letter item";
      throw new ApiError(message.includes("not found") ? 404 : 409, message);
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "workflow_runtime_dead_letter",
      entityId: input.deadLetterId,
      changes: {
        rerunStatus: result.rerun.status,
        retriesUsed: result.rerun.retriesUsed,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
