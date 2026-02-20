import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-helpers";
import { getTenantPolicyBySlug, isIpAllowedByPolicy } from "@/lib/tenant-policy-store";

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || null;
}

// GET /api/auth/policy/discovery?workspace=f-core
export async function GET(request: NextRequest) {
  try {
    const workspace = request.nextUrl.searchParams.get("workspace") || "";
    if (!workspace) {
      return NextResponse.json({ data: null });
    }

    const policy = await getTenantPolicyBySlug(workspace);
    if (!policy) {
      return NextResponse.json({ data: null });
    }

    const ip = getClientIp(request);
    const ipAllowed = isIpAllowedByPolicy(policy, ip);

    return NextResponse.json({
      data: {
        tenantSlug: policy.tenantSlug,
        session: policy.session,
        password: policy.password,
        ipAllowlistEnabled: policy.ipAllowlist.enabled,
        ipAllowed,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
