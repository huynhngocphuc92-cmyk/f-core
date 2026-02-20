import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { retrySyncJob, retrySyncJobSchema } from "@/lib/data-sync-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/data/sync/jobs/[id]/retry - Retry sync job with stored lineage payload
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await context.params;
    const body = await request.json();
    const payload = retrySyncJobSchema.parse(body);

    let retried;
    try {
      retried = await retrySyncJob(tenantId, id, payload);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new ApiError(404, error.message);
      }
      throw error;
    }

    await logAuditEvent({
      request,
      action: "created",
      entity: "data_sync_retry",
      entityId: retried.id,
      entityName: `${retried.integration}:${retried.objectType}`,
      changes: {
        retriedFromJobId: retried.retriedFromJobId,
        attempt: retried.attempt,
        status: retried.status,
        diagnostics: retried.diagnostics.length,
      },
    });

    return NextResponse.json({ job: retried }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
