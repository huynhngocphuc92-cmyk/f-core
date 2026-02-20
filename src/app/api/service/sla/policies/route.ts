import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  getSlaPolicy,
  setSlaPolicy,
  slaPolicySchema,
} from "@/lib/sla-policy-store";
import { logAuditEvent } from "@/lib/audit-helpers";

// GET /api/service/sla/policies - Tenant SLA policy
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const policy = await getSlaPolicy(tenantId);
    return NextResponse.json({ policy });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/service/sla/policies - Update tenant SLA policy
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const policy = slaPolicySchema.parse(body?.policy ?? body);

    await setSlaPolicy(tenantId, policy);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "sla_policy",
      entityId: tenantId,
      entityName: "tenant_sla_policy",
      changes: policy,
    });

    return NextResponse.json({ policy });
  } catch (error) {
    return handleApiError(error);
  }
}
