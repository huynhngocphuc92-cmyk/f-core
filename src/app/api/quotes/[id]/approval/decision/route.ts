import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  decideQuoteApproval,
  decideQuoteApprovalSchema,
} from "@/lib/quote-cpq-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("crm.write", request);
    const { id } = await params;
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const actorName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;
    const body = await request.json();
    const payload = decideQuoteApprovalSchema.parse(body);

    const data = await decideQuoteApproval(
      tenantId,
      id,
      payload,
      {
        id: user.id,
        name: actorName,
        email: user.email ?? null,
      }
    );

    await logAuditEvent({
      request,
      action: "updated",
      entity: "quote",
      entityId: id,
      metadata: {
        cpq: "approval_decision",
        decision: payload.decision,
        approvalStatus: data.quote.approvalStatus,
        approvalRequestId: data.request.id,
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
