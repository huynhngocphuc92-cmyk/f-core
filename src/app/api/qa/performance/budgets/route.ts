import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  listApiPerformanceBudgets,
  listApiPerformanceEvaluations,
  upsertApiPerformanceBudgets,
  upsertApiPerformanceBudgetsSchema,
} from "@/lib/api-performance-budget";

// GET /api/qa/performance/budgets
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const budgets = await listApiPerformanceBudgets(tenantId);
    const latestEvaluation = (await listApiPerformanceEvaluations(tenantId))[0] || null;

    return NextResponse.json({
      data: budgets,
      latestEvaluation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/qa/performance/budgets
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = upsertApiPerformanceBudgetsSchema.parse(body);

    const data = await upsertApiPerformanceBudgets(tenantId, payload.budgets);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
