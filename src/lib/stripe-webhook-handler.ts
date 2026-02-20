import Stripe from "stripe";
import prisma from "@/lib/prisma";
import {
  getPaymentByStripeId,
  updatePaymentStatus,
  recordStripeEvent,
} from "@/lib/payment-store";
import { centsToAmount } from "@/lib/stripe";

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  await recordStripeEvent({
    stripeEventId: event.id,
    type: event.type,
    payload: event.data.object as unknown,
  });

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  await prisma.commerceStripeEvent.updateMany({
    where: { stripeEventId: event.id },
    data: { processed: true },
  });
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const payment = await getPaymentByStripeId(pi.id);
  if (!payment) return;

  const chargeId =
    typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : pi.latest_charge?.id ?? null;

  await updatePaymentStatus(payment.id, "succeeded", {
    stripeChargeId: chargeId ?? undefined,
    paidAt: new Date(),
  });

  if (payment.invoiceId) {
    const invoice = await prisma.commerceInvoice.findFirst({
      where: { id: payment.invoiceId },
    });
    if (invoice && invoice.status !== "paid") {
      await prisma.commerceInvoice.update({
        where: { id: invoice.id },
        data: { status: "paid", paidAt: new Date() },
      });
    }
  }
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const payment = await getPaymentByStripeId(pi.id);
  if (!payment) return;

  const reason =
    pi.last_payment_error?.message ?? "Payment failed";

  await updatePaymentStatus(payment.id, "failed", {
    failureReason: reason,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!piId) return;

  const payment = await getPaymentByStripeId(piId);
  if (!payment) return;

  const refundedCents = charge.amount_refunded ?? 0;

  await updatePaymentStatus(payment.id, "refunded", {
    refundedAmount: centsToAmount(refundedCents),
    refundedAt: new Date(),
  });
}

async function handleInvoicePaid(stripeInvoice: Stripe.Invoice) {
  if (!stripeInvoice.id) return;

  const invoice = await prisma.commerceInvoice.findFirst({
    where: { stripeInvoiceId: stripeInvoice.id },
  });

  if (invoice && invoice.status !== "paid") {
    await prisma.commerceInvoice.update({
      where: { id: invoice.id },
      data: { status: "paid", paidAt: new Date() },
    });
  }
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  if (!stripeInvoice.id) return;

  const subscription = (stripeInvoice as unknown as Record<string, unknown>).subscription;
  const subId =
    typeof subscription === "string" ? subscription : String(subscription ?? "");

  if (!subId) return;

  const sub = await prisma.commerceSubscription.findFirst({
    where: { stripeSubscriptionId: subId },
  });

  if (sub && sub.status !== "past_due") {
    await prisma.commerceSubscription.update({
      where: { id: sub.id },
      data: { status: "past_due" },
    });
  }
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const sub = await prisma.commerceSubscription.findFirst({
    where: { stripeSubscriptionId: stripeSub.id },
  });
  if (!sub) return;

  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "active",
    incomplete_expired: "canceled",
    trialing: "active",
    paused: "active",
  };

  const mappedStatus = statusMap[stripeSub.status] ?? "active";

  // In Stripe API v2025+, period fields are on items, not subscription root
  const firstItem = stripeSub.items?.data?.[0];
  const periodData: Record<string, Date> = {};
  if (firstItem) {
    periodData.currentPeriodStart = new Date(firstItem.current_period_start * 1000);
    periodData.currentPeriodEnd = new Date(firstItem.current_period_end * 1000);
  }

  await prisma.commerceSubscription.update({
    where: { id: sub.id },
    data: {
      status: mappedStatus,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      ...periodData,
    },
  });
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const sub = await prisma.commerceSubscription.findFirst({
    where: { stripeSubscriptionId: stripeSub.id },
  });
  if (!sub) return;

  await prisma.commerceSubscription.update({
    where: { id: sub.id },
    data: {
      status: "canceled",
      canceledAt: new Date(),
      nextBillingAt: null,
    },
  });
}
