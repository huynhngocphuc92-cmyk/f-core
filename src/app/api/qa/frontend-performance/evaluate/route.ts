import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  evaluateFrontendPerformance,
  evaluateFrontendPerformanceSchema,
  listFrontendEvaluations,
} from "@/lib/frontend-performance";

// GET /api/qa/frontend-performance/evaluate
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const data = await listFrontendEvaluations(tenantId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/qa/frontend-performance/evaluate
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = evaluateFrontendPerformanceSchema.parse(body);

    const evaluation = await evaluateFrontendPerformance(tenantId, payload);
    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
