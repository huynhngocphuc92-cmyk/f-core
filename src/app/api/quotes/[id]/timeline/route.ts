import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { listQuoteTimeline } from "@/lib/quote-cpq-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("crm.read", request);
    const { id } = await params;
    const tenantId = await getTenantId(request);
    const limit = Math.max(
      1,
      Math.min(200, Number(request.nextUrl.searchParams.get("limit") || "100"))
    );

    const data = await listQuoteTimeline(tenantId, id, limit);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
