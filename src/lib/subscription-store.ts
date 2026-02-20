import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const billingCycleSchema = z.enum(["monthly", "quarterly", "yearly"]);
export const subscriptionStatusSchema = z.enum(["active", "past_due", "canceled"]);

export const createSubscriptionSchema = z.object({
  customerName: z.string().min(1).max(200),
  planName: z.string().min(1).max(120),
  amount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  cycle: billingCycleSchema.default("monthly"),
  startDate: z.string().datetime().optional(),
});

export const updateSubscriptionSchema = z.object({
  action: z.enum(["renew", "cancel", "resume", "mark_past_due"]),
  effective: z.enum(["immediate", "period_end"]).optional(),
  reason: z.string().max(500).optional(),
});

export type Subscription = {
  id: string;
  tenantId: string;
  subscriptionNumber: string;
  customerName: string;
  planName: string;
  amount: number;
  currency: string;
  cycle: z.infer<typeof billingCycleSchema>;
  status: z.infer<typeof subscriptionStatusSchema>;
  cancelAtPeriodEnd: boolean;
  cancellationReason: string | null;
  canceledAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string | null;
  renewalCount: number;
  createdAt: string;
  updatedAt: string;
};

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : Number(value);
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function normalizeSubscription(record: {
  id: string;
  tenantId: string;
  subscriptionNumber: string;
  customerName: string;
  planName: string;
  amount: Prisma.Decimal | number;
  currency: string;
  cycle: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  cancellationReason: string | null;
  canceledAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingAt: Date | null;
  renewalCount: number;
  createdAt: Date;
  updatedAt: Date;
}): Subscription {
  return {
    id: record.id,
    tenantId: record.tenantId,
    subscriptionNumber: record.subscriptionNumber,
    customerName: record.customerName,
    planName: record.planName,
    amount: toNumber(record.amount),
    currency: record.currency,
    cycle: billingCycleSchema.parse(record.cycle),
    status: subscriptionStatusSchema.parse(record.status),
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    cancellationReason: record.cancellationReason,
    canceledAt: toIso(record.canceledAt),
    currentPeriodStart: record.currentPeriodStart.toISOString(),
    currentPeriodEnd: record.currentPeriodEnd.toISOString(),
    nextBillingAt: toIso(record.nextBillingAt),
    renewalCount: record.renewalCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function addCycle(date: Date, cycle: Subscription["cycle"]) {
  const cloned = new Date(date.getTime());
  const months = cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12;
  cloned.setUTCMonth(cloned.getUTCMonth() + months);
  return cloned;
}

function nextSubscriptionNumber(latestSubscriptionNumber?: string | null) {
  if (!latestSubscriptionNumber) {
    return "SUB-00001";
  }

  const match = /^SUB-(\d+)$/.exec(latestSubscriptionNumber);
  const current = match ? Number(match[1]) : 0;
  return `SUB-${String(current + 1).padStart(5, "0")}`;
}

async function getSubscriptionOrThrow(tenantId: string, id: string) {
  const subscription = await prisma.commerceSubscription.findFirst({
    where: { id, tenantId },
  });
  if (!subscription) {
    throw new Error("Subscription not found");
  }
  return subscription;
}

export async function listSubscriptions(tenantId: string): Promise<Subscription[]> {
  const records = await prisma.commerceSubscription.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return records.map(normalizeSubscription);
}

export async function createSubscription(
  tenantId: string,
  input: z.infer<typeof createSubscriptionSchema>
): Promise<Subscription> {
  const latest = await prisma.commerceSubscription.findFirst({
    where: { tenantId },
    select: { subscriptionNumber: true },
    orderBy: { createdAt: "desc" },
  });

  const startDate = input.startDate ? new Date(input.startDate) : new Date();
  const periodEnd = addCycle(startDate, input.cycle);

  const created = await prisma.commerceSubscription.create({
    data: {
      tenantId,
      subscriptionNumber: nextSubscriptionNumber(latest?.subscriptionNumber),
      customerName: input.customerName,
      planName: input.planName,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency.toUpperCase(),
      cycle: input.cycle,
      status: "active",
      cancelAtPeriodEnd: false,
      cancellationReason: null,
      canceledAt: null,
      currentPeriodStart: startDate,
      currentPeriodEnd: periodEnd,
      nextBillingAt: periodEnd,
      renewalCount: 0,
    },
  });

  return normalizeSubscription(created);
}

export async function renewSubscription(tenantId: string, id: string): Promise<Subscription> {
  const subscription = await getSubscriptionOrThrow(tenantId, id);

  if (subscription.status === "canceled") {
    throw new Error("Cannot renew a canceled subscription");
  }

  const nextStart = subscription.currentPeriodEnd;
  const cycle = billingCycleSchema.parse(subscription.cycle);
  const nextEnd = addCycle(nextStart, cycle);

  const updated = await prisma.commerceSubscription.update({
    where: { id: subscription.id },
    data: {
      status: "active",
      cancelAtPeriodEnd: false,
      cancellationReason: null,
      currentPeriodStart: nextStart,
      currentPeriodEnd: nextEnd,
      nextBillingAt: nextEnd,
      renewalCount: { increment: 1 },
    },
  });

  return normalizeSubscription(updated);
}

export async function cancelSubscription(
  tenantId: string,
  id: string,
  effective: "immediate" | "period_end",
  reason?: string
): Promise<Subscription> {
  const subscription = await getSubscriptionOrThrow(tenantId, id);
  if (subscription.status === "canceled") {
    throw new Error("Subscription already canceled");
  }

  if (effective === "immediate") {
    const updated = await prisma.commerceSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        cancelAtPeriodEnd: false,
        cancellationReason: reason || null,
        canceledAt: new Date(),
        nextBillingAt: null,
      },
    });
    return normalizeSubscription(updated);
  }

  const updated = await prisma.commerceSubscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: true,
      cancellationReason: reason || subscription.cancellationReason,
    },
  });

  return normalizeSubscription(updated);
}

export async function resumeSubscription(tenantId: string, id: string): Promise<Subscription> {
  const subscription = await getSubscriptionOrThrow(tenantId, id);
  if (subscription.status === "canceled") {
    throw new Error("Cannot resume a canceled subscription");
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error("Subscription is not scheduled for cancellation");
  }

  const updated = await prisma.commerceSubscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: false,
      cancellationReason: null,
    },
  });
  return normalizeSubscription(updated);
}

export async function markSubscriptionPastDue(
  tenantId: string,
  id: string
): Promise<Subscription> {
  const subscription = await getSubscriptionOrThrow(tenantId, id);
  if (subscription.status === "canceled") {
    throw new Error("Canceled subscription cannot become past_due");
  }

  const updated = await prisma.commerceSubscription.update({
    where: { id: subscription.id },
    data: {
      status: "past_due",
    },
  });

  return normalizeSubscription(updated);
}

export function summarizeSubscriptions(subscriptions: Subscription[]) {
  const summary = {
    total: subscriptions.length,
    active: 0,
    pastDue: 0,
    canceled: 0,
    mrr: 0,
    arr: 0,
  };

  for (const subscription of subscriptions) {
    if (subscription.status === "active") {
      summary.active += 1;
      if (subscription.cycle === "monthly") summary.mrr += subscription.amount;
      if (subscription.cycle === "quarterly") summary.mrr += subscription.amount / 3;
      if (subscription.cycle === "yearly") summary.mrr += subscription.amount / 12;
    }

    if (subscription.status === "past_due") {
      summary.pastDue += 1;
    }

    if (subscription.status === "canceled") {
      summary.canceled += 1;
    }
  }

  summary.arr = summary.mrr * 12;

  return summary;
}

export async function resetSubscriptionStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.commerceSubscription.deleteMany();
}
