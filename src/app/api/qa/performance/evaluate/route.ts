import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  evaluateApiPerformance,
  evaluateApiPerformanceSchema,
  listApiPerformanceEvaluations,
} from "@/lib/api-performance-budget";

// GET /api/qa/performance/evaluate
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const evaluations = await listApiPerformanceEvaluations(tenantId);
    return NextResponse.json({ data: evaluations });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/qa/performance/evaluate
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = evaluateApiPerformanceSchema.parse(body);

    const evaluation = await evaluateApiPerformance(tenantId, payload);
    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
