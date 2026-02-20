import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createSubscription,
  createSubscriptionSchema,
  listSubscriptions,
  summarizeSubscriptions,
} from "@/lib/subscription-store";

// GET /api/commerce/subscriptions - List subscriptions and recurring revenue summary
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const subscriptions = await listSubscriptions(tenantId);

    return NextResponse.json({
      data: subscriptions,
      summary: summarizeSubscriptions(subscriptions),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/commerce/subscriptions - Create recurring subscription
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createSubscriptionSchema.parse(body);

    const subscription = await createSubscription(tenantId, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "subscription",
      entityId: subscription.id,
      entityName: subscription.subscriptionNumber,
      changes: {
        planName: subscription.planName,
        cycle: subscription.cycle,
        amount: subscription.amount,
        status: subscription.status,
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
