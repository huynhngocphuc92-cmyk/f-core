import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { getTenantPolicy, updateTenantPolicy, updateTenantPolicySchema } from "@/lib/tenant-policy-store";
import { logAuditEvent } from "@/lib/audit-helpers";

// GET /api/settings/policies
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    await checkPermission("settings.read", request);
    const data = await getTenantPolicy(tenantId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/settings/policies
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    await checkPermission("settings.manage", request);
    const body = await request.json();
    const payload = updateTenantPolicySchema.parse(body);
    const data = await updateTenantPolicy(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "tenant_policy",
      entityName: tenantId,
      changes: {
        session: data.session,
        password: data.password,
        ipAllowlistCount: data.ipAllowlist.entries.length,
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
