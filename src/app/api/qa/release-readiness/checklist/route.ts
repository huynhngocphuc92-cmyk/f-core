import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  listReleaseChecklistGates,
  listReleaseReadinessResults,
  updateReleaseChecklistSchema,
  upsertReleaseChecklistGates,
} from "@/lib/release-readiness";

// GET /api/qa/release-readiness/checklist
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const gates = await listReleaseChecklistGates(tenantId);
    const latestResult = (await listReleaseReadinessResults(tenantId))[0] || null;

    return NextResponse.json({
      data: gates,
      latestResult,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/qa/release-readiness/checklist
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = updateReleaseChecklistSchema.parse(body);

    const data = await upsertReleaseChecklistGates(tenantId, payload.gates);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
