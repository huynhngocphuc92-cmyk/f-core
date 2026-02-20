import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { decideApprovalRequest, decisionApprovalRequestSchema } from "@/lib/content-approval-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/content/approvals/requests/[id]/decision - Approve or reject pending request
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const { id } = await context.params;
    const body = await request.json();
    const payload = decisionApprovalRequestSchema.parse(body);

    let approvalRequest;
    try {
      approvalRequest = await decideApprovalRequest(tenantId, id, user.id, payload);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new ApiError(404, error.message);
      }
      if (error instanceof Error) {
        throw new ApiError(409, error.message);
      }
      throw error;
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "content_approval_request",
      entityId: approvalRequest.id,
      entityName: approvalRequest.assetTitle,
      changes: {
        decision: approvalRequest.status,
        reviewerId: approvalRequest.reviewerId,
      },
    });

    return NextResponse.json({ request: approvalRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
