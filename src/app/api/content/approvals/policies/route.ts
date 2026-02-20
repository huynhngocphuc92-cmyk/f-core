import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  approvalPolicySchema,
  listApprovalPolicies,
  upsertApprovalPolicy,
} from "@/lib/content-approval-store";

// GET /api/content/approvals/policies - List approval policies by content space
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    return NextResponse.json({ data: await listApprovalPolicies(tenantId) });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/content/approvals/policies - Upsert policy for a content space
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = approvalPolicySchema.parse(body);

    const policy = await upsertApprovalPolicy(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "content_approval_policy",
      entityId: policy.space,
      entityName: policy.space,
      changes: {
        enabled: policy.enabled,
        requiredApprovals: policy.requiredApprovals,
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    return handleApiError(error);
  }
}
