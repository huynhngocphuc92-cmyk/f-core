import Stripe from "stripe";

function getStripeInstance(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === "sk_test_placeholder") return null;
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

let _stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (_stripe === undefined) {
    _stripe = getStripeInstance();
  }
  return _stripe;
}

export function requireStripe(): Stripe {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.");
  }
  return stripe;
}

// ── Customer ──

export async function findOrCreateCustomer(
  stripe: Stripe,
  opts: { email?: string; name: string; metadata?: Record<string, string> }
): Promise<Stripe.Customer> {
  if (opts.email) {
    const existing = await stripe.customers.list({ email: opts.email, limit: 1 });
    if (existing.data.length > 0) return existing.data[0];
  }

  return stripe.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: opts.metadata ?? {},
  });
}

// ── Checkout Session ──

export async function createCheckoutSession(
  stripe: Stripe,
  opts: {
    customerId: string;
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    mode?: "payment" | "subscription";
  }
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: opts.customerId,
    line_items: opts.lineItems,
    mode: opts.mode ?? "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: opts.metadata ?? {},
  });
}

// ── Payment Intent ──

export async function createPaymentIntent(
  stripe: Stripe,
  opts: {
    amount: number; // in cents
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: opts.amount,
    currency: opts.currency.toLowerCase(),
    customer: opts.customerId,
    metadata: opts.metadata ?? {},
  });
}

// ── Refund ──

export async function createRefund(
  stripe: Stripe,
  opts: {
    paymentIntentId: string;
    amount?: number; // partial refund in cents, omit for full
    reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  }
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: opts.paymentIntentId,
    amount: opts.amount,
    reason: opts.reason,
  });
}

// ── Products & Prices ──

export async function findOrCreateProduct(
  stripe: Stripe,
  opts: { name: string; metadata?: Record<string, string> }
): Promise<Stripe.Product> {
  const existing = await stripe.products.search({
    query: `name:"${opts.name}" AND active:"true"`,
    limit: 1,
  });
  if (existing.data.length > 0) return existing.data[0];

  return stripe.products.create({
    name: opts.name,
    metadata: opts.metadata ?? {},
  });
}

export async function findOrCreatePrice(
  stripe: Stripe,
  opts: {
    productId: string;
    unitAmount: number; // cents
    currency: string;
    interval?: "month" | "year";
  }
): Promise<Stripe.Price> {
  const params: Stripe.PriceListParams = {
    product: opts.productId,
    active: true,
    limit: 100,
  };
  const existing = await stripe.prices.list(params);

  const match = existing.data.find((p) => {
    if (p.unit_amount !== opts.unitAmount) return false;
    if (p.currency !== opts.currency.toLowerCase()) return false;
    if (opts.interval) {
      return p.recurring?.interval === opts.interval;
    }
    return !p.recurring;
  });

  if (match) return match;

  return stripe.prices.create({
    product: opts.productId,
    unit_amount: opts.unitAmount,
    currency: opts.currency.toLowerCase(),
    ...(opts.interval
      ? { recurring: { interval: opts.interval } }
      : {}),
  });
}

// ── Subscriptions ──

export async function createStripeSubscription(
  stripe: Stripe,
  opts: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: opts.customerId,
    items: [{ price: opts.priceId }],
    metadata: opts.metadata ?? {},
  });
}

export async function cancelStripeSubscription(
  stripe: Stripe,
  subscriptionId: string,
  immediate: boolean
): Promise<Stripe.Subscription> {
  if (immediate) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// ── Webhook Signature ──

export function constructWebhookEvent(
  stripe: Stripe,
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret);
}

// ── Helpers ──

export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToAmount(cents: number): number {
  return cents / 100;
}
