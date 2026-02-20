import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  listFrontendEvaluations,
  listFrontendThresholds,
  upsertFrontendThresholds,
  upsertFrontendThresholdsSchema,
} from "@/lib/frontend-performance";

// GET /api/qa/frontend-performance/thresholds
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const data = await listFrontendThresholds(tenantId);
    const latestEvaluation = (await listFrontendEvaluations(tenantId))[0] || null;
    return NextResponse.json({ data, latestEvaluation });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/qa/frontend-performance/thresholds
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = upsertFrontendThresholdsSchema.parse(body);

    const data = await upsertFrontendThresholds(tenantId, payload.thresholds);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
