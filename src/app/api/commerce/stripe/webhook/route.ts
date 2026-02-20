import { NextRequest, NextResponse } from "next/server";
import { getStripe, constructWebhookEvent } from "@/lib/stripe";
import { handleStripeWebhookEvent } from "@/lib/stripe-webhook-handler";
import { recordStripeEvent } from "@/lib/payment-store";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === "whsec_placeholder") {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const body = await request.text();

  let event;
  try {
    event = constructWebhookEvent(stripe, body, signature, webhookSecret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error processing webhook";

    await recordStripeEvent({
      stripeEventId: event.id,
      type: event.type,
      payload: event.data.object as unknown,
      processed: false,
      error: errorMessage,
    }).catch(() => {});

    console.error(`Stripe webhook error [${event.type}]:`, errorMessage);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
