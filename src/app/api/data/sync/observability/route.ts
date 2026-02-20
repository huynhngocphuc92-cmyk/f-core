import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { getSyncJobObservability, listSyncObservability, summarizeSyncObservability } from "@/lib/data-sync-store";

// GET /api/data/sync/observability?jobId=<id>&status=failed&mappingId=<id>
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const jobId = request.nextUrl.searchParams.get("jobId");
    const status = request.nextUrl.searchParams.get("status");
    const mappingId = request.nextUrl.searchParams.get("mappingId") || undefined;

    if (jobId) {
      try {
        const job = await getSyncJobObservability(tenantId, jobId);
        return NextResponse.json({ job });
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new ApiError(404, error.message);
        }
        throw error;
      }
    }

    const normalizedStatus =
      status === "completed" || status === "completed_with_conflicts" || status === "failed"
        ? status
        : undefined;

    return NextResponse.json({
      summary: await summarizeSyncObservability(tenantId),
      data: await listSyncObservability(tenantId, {
        status: normalizedStatus,
        mappingId,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
