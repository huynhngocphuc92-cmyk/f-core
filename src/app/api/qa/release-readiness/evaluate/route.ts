import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  evaluateReleaseReadiness,
  evaluateReleaseReadinessSchema,
  listReleaseReadinessResults,
} from "@/lib/release-readiness";

// GET /api/qa/release-readiness/evaluate
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const data = await listReleaseReadinessResults(tenantId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/qa/release-readiness/evaluate
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = evaluateReleaseReadinessSchema.parse(body);
    const result = await evaluateReleaseReadiness(tenantId, payload);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
