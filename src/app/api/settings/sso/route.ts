import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { getSsoConfig, updateSsoConfig, updateSsoConfigSchema } from "@/lib/sso-config-store";
import { logAuditEvent } from "@/lib/audit-helpers";

// GET /api/settings/sso
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    await checkPermission("settings.read", request);

    const data = await getSsoConfig(tenantId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/settings/sso
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    await checkPermission("settings.manage", request);

    const body = await request.json();
    const payload = updateSsoConfigSchema.parse(body);

    const data = await updateSsoConfig(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "sso_policy",
      entityName: data.tenantSlug,
      changes: {
        enabled: data.enabled,
        ssoOnly: data.ssoOnly,
        provider: data.provider,
        domainCount: data.domains.length,
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
