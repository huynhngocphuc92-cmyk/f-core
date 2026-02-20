import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  cancelSubscription,
  markSubscriptionPastDue,
  renewSubscription,
  resumeSubscription,
  updateSubscriptionSchema,
} from "@/lib/subscription-store";

// PATCH /api/commerce/subscriptions/[id] - Update subscription lifecycle action
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const body = await request.json();
    const payload = updateSubscriptionSchema.parse(body);

    let subscription;

    try {
      switch (payload.action) {
        case "renew":
          subscription = await renewSubscription(tenantId, id);
          break;
        case "cancel":
          subscription = await cancelSubscription(
            tenantId,
            id,
            payload.effective || "period_end",
            payload.reason
          );
          break;
        case "resume":
          subscription = await resumeSubscription(tenantId, id);
          break;
        case "mark_past_due":
          subscription = await markSubscriptionPastDue(tenantId, id);
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Subscription transition failed";
      if (message === "Subscription not found") {
        throw new ApiError(404, message);
      }
      throw new ApiError(409, message);
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "subscription",
      entityId: subscription.id,
      entityName: subscription.subscriptionNumber,
      changes: {
        action: payload.action,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        renewalCount: subscription.renewalCount,
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    return handleApiError(error);
  }
}
