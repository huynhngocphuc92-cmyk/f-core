import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { listPageTemplates } from "@/lib/content-page-builder";

// GET /api/content/pages/templates - List structured landing-page templates
export async function GET(request: NextRequest) {
  try {
    await getTenantId(request);
    return NextResponse.json({ data: listPageTemplates() });
  } catch (error) {
    return handleApiError(error);
  }
}
