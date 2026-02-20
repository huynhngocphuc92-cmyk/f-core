import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  contentSpaceSchema,
  createApprovalRequest,
  createApprovalRequestSchema,
  getApprovalPolicy,
  listApprovalRequests,
} from "@/lib/content-approval-store";

// GET /api/content/approvals/requests - List approval requests
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const spaceQuery = request.nextUrl.searchParams.get("space");
    const statusQuery = request.nextUrl.searchParams.get("status");

    const space = spaceQuery ? contentSpaceSchema.parse(spaceQuery) : undefined;
    const status = statusQuery === "pending" || statusQuery === "approved" || statusQuery === "rejected"
      ? statusQuery
      : undefined;

    return NextResponse.json({
      data: await listApprovalRequests(tenantId, {
        space,
        status,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/content/approvals/requests - Create or refresh approval request
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const payload = createApprovalRequestSchema.parse({
      ...body,
      requestedBy: user.id,
    });

    const policy = await getApprovalPolicy(tenantId, payload.space);
    if (!policy.enabled) {
      return NextResponse.json(
        {
          error: `Approval policy is disabled for ${payload.space}`,
        },
        { status: 409 }
      );
    }

    const approvalRequest = await createApprovalRequest(tenantId, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "content_approval_request",
      entityId: approvalRequest.id,
      entityName: approvalRequest.assetTitle,
      changes: {
        space: approvalRequest.space,
        assetId: approvalRequest.assetId,
      },
    });

    return NextResponse.json({ request: approvalRequest }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
