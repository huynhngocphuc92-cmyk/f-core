import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { buildRevenueReport } from "@/lib/commerce-revenue";

// GET /api/commerce/revenue - Revenue reconciliation report across invoices/subscriptions/payments
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const report = await buildRevenueReport(tenantId);
    return NextResponse.json(report);
  } catch (error) {
    return handleApiError(error);
  }
}
