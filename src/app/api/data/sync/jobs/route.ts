import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { listSyncJobs, runSyncJob, runSyncJobSchema } from "@/lib/data-sync-store";

// GET /api/data/sync/jobs - List sync jobs
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const mappingId = request.nextUrl.searchParams.get("mappingId") || undefined;

    return NextResponse.json({
      data: await listSyncJobs(tenantId, mappingId),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/data/sync/jobs - Run sync job
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = runSyncJobSchema.parse(body);

    let job;
    try {
      job = await runSyncJob(tenantId, payload);
    } catch (error) {
      if (error instanceof Error && (error.message.includes("not found") || error.message.includes("disabled"))) {
        throw new ApiError(409, error.message);
      }
      throw error;
    }

    await logAuditEvent({
      request,
      action: "created",
      entity: "data_sync_job",
      entityId: job.id,
      entityName: `${job.integration}:${job.objectType}`,
      changes: {
        mappingId: job.mappingId,
        processed: job.processed,
        imported: job.imported,
        exported: job.exported,
        conflicts: job.conflicts,
        dryRun: job.dryRun,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
