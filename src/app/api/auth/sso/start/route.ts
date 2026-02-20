import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { getSsoConfigByTenantSlug } from "@/lib/sso-config-store";

function normalizePath(pathname: string) {
  if (!pathname) return "/dashboard";
  if (!pathname.startsWith("/")) return "/dashboard";
  if (pathname.startsWith("//")) return "/dashboard";
  return pathname;
}

// GET /api/auth/sso/start?tenantSlug=f-core&next=/dashboard
export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.nextUrl.searchParams.get("tenantSlug")?.trim().toLowerCase() || "";
    if (!tenantSlug) {
      throw new ApiError(400, "Missing tenantSlug");
    }

    const config = await getSsoConfigByTenantSlug(tenantSlug);
    if (!config) {
      throw new ApiError(404, "SSO configuration not found");
    }
    if (!config.enabled) {
      throw new ApiError(409, "SSO is disabled for this workspace");
    }

    const nextPath = normalizePath(request.nextUrl.searchParams.get("next") || "/dashboard");
    const callbackUrl = new URL(`/auth/callback?code=demo-sso-${config.provider}&next=${encodeURIComponent(nextPath)}`, request.url);

    return NextResponse.redirect(callbackUrl);
  } catch (error) {
    return handleApiError(error);
  }
}
