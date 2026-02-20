import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-helpers";
import { getSsoConfigByEmail } from "@/lib/sso-config-store";

// GET /api/auth/sso/discovery?email=...
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email") || "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ data: null });
    }

    const config = await getSsoConfigByEmail(email);
    if (!config || !config.enabled) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        tenantSlug: config.tenantSlug,
        provider: config.provider,
        idpDisplayName: config.idpDisplayName,
        ssoOnly: config.ssoOnly,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
