import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  requireStripe,
  findOrCreateCustomer,
  findOrCreateProduct,
  findOrCreatePrice,
  createStripeSubscription,
  cancelStripeSubscription,
  amountToCents,
} from "@/lib/stripe";

const createStripeSubSchema = z.object({
  subscriptionId: z.string().min(1),
  customerEmail: z.string().email().optional(),
});

const cancelStripeSubSchema = z.object({
  subscriptionId: z.string().min(1),
  immediate: z.boolean().default(false),
});

// POST /api/commerce/stripe/subscriptions - Sync a local subscription to Stripe
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const { subscriptionId, customerEmail } = createStripeSubSchema.parse(body);

    const stripe = requireStripe();

    const sub = await prisma.commerceSubscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });
    if (!sub) {
      throw new ApiError(404, "Subscription not found");
    }
    if (sub.stripeSubscriptionId) {
      throw new ApiError(400, "Subscription already synced to Stripe");
    }

    const customer = await findOrCreateCustomer(stripe, {
      name: sub.customerName,
      email: customerEmail,
      metadata: { tenantId },
    });

    const product = await findOrCreateProduct(stripe, {
      name: sub.planName,
      metadata: { tenantId },
    });

    const cycleToInterval: Record<string, "month" | "year"> = {
      monthly: "month",
      quarterly: "month",
      yearly: "year",
    };
    const interval = cycleToInterval[sub.cycle] ?? "month";

    let unitAmount = amountToCents(Number(sub.amount));
    if (sub.cycle === "quarterly") {
      unitAmount = Math.round(unitAmount / 3);
    }

    const price = await findOrCreatePrice(stripe, {
      productId: product.id,
      unitAmount,
      currency: sub.currency.toLowerCase(),
      interval,
    });

    const stripeSub = await createStripeSubscription(stripe, {
      customerId: customer.id,
      priceId: price.id,
      metadata: {
        tenantId,
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
      },
    });

    await prisma.commerceSubscription.update({
      where: { id: sub.id },
      data: {
        stripeSubscriptionId: stripeSub.id,
        stripeCustomerId: customer.id,
        stripePriceId: price.id,
      },
    });

    await logAuditEvent({
      request,
      action: "stripe_subscription_created",
      entity: "subscription",
      entityId: sub.id,
      entityName: sub.subscriptionNumber,
      metadata: {
        stripeSubscriptionId: stripeSub.id,
        stripeCustomerId: customer.id,
      },
    });

    return NextResponse.json(
      {
        subscription: {
          id: sub.id,
          stripeSubscriptionId: stripeSub.id,
          stripeCustomerId: customer.id,
          stripePriceId: price.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/commerce/stripe/subscriptions - Cancel a Stripe subscription
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const { subscriptionId, immediate } = cancelStripeSubSchema.parse(body);

    const stripe = requireStripe();

    const sub = await prisma.commerceSubscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });
    if (!sub) {
      throw new ApiError(404, "Subscription not found");
    }
    if (!sub.stripeSubscriptionId) {
      throw new ApiError(400, "Subscription is not synced to Stripe");
    }

    await cancelStripeSubscription(stripe, sub.stripeSubscriptionId, immediate);

    if (immediate) {
      await prisma.commerceSubscription.update({
        where: { id: sub.id },
        data: {
          status: "canceled",
          canceledAt: new Date(),
          nextBillingAt: null,
        },
      });
    } else {
      await prisma.commerceSubscription.update({
        where: { id: sub.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
    }

    await logAuditEvent({
      request,
      action: immediate
        ? "stripe_subscription_canceled"
        : "stripe_subscription_cancel_scheduled",
      entity: "subscription",
      entityId: sub.id,
      entityName: sub.subscriptionNumber,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
