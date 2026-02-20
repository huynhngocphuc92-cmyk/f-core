import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const paymentStatusSchema = z.enum([
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
]);

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1).max(64).optional(),
  subscriptionId: z.string().min(1).max(64).optional(),
  customerName: z.string().min(1).max(200),
  amount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  method: z.enum(["card", "bank_transfer", "manual"]).default("card"),
  stripePaymentIntentId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type Payment = {
  id: string;
  tenantId: string;
  invoiceId: string | null;
  subscriptionId: string | null;
  customerName: string;
  amount: number;
  currency: string;
  status: z.infer<typeof paymentStatusSchema>;
  method: string;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeCustomerId: string | null;
  refundedAmount: number | null;
  refundedAt: string | null;
  failureReason: string | null;
  metadata: Record<string, string>;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null) return null;
  return typeof value === "number" ? value : Number(value);
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function normalizePayment(record: {
  id: string;
  tenantId: string;
  invoiceId: string | null;
  subscriptionId: string | null;
  customerName: string;
  amount: Prisma.Decimal | number;
  currency: string;
  status: string;
  method: string;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeCustomerId: string | null;
  refundedAmount: Prisma.Decimal | number | null;
  refundedAt: Date | null;
  failureReason: string | null;
  metadata: unknown;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  return {
    id: record.id,
    tenantId: record.tenantId,
    invoiceId: record.invoiceId,
    subscriptionId: record.subscriptionId,
    customerName: record.customerName,
    amount: typeof record.amount === "number" ? record.amount : Number(record.amount),
    currency: record.currency,
    status: paymentStatusSchema.parse(record.status),
    method: record.method,
    stripePaymentIntentId: record.stripePaymentIntentId,
    stripeChargeId: record.stripeChargeId,
    stripeCustomerId: record.stripeCustomerId,
    refundedAmount: toNumber(record.refundedAmount),
    refundedAt: toIso(record.refundedAt),
    failureReason: record.failureReason,
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, string>)
        : {},
    paidAt: toIso(record.paidAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listPayments(tenantId: string): Promise<Payment[]> {
  const records = await prisma.commercePayment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return records.map(normalizePayment);
}

export async function getPaymentById(
  tenantId: string,
  paymentId: string
): Promise<Payment | null> {
  const record = await prisma.commercePayment.findFirst({
    where: { id: paymentId, tenantId },
  });
  return record ? normalizePayment(record) : null;
}

export async function getPaymentByStripeId(
  stripePaymentIntentId: string
): Promise<Payment | null> {
  const record = await prisma.commercePayment.findFirst({
    where: { stripePaymentIntentId },
  });
  return record ? normalizePayment(record) : null;
}

export async function createPayment(
  tenantId: string,
  input: z.infer<typeof createPaymentSchema>
): Promise<Payment> {
  const record = await prisma.commercePayment.create({
    data: {
      tenantId,
      invoiceId: input.invoiceId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      customerName: input.customerName,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency.toUpperCase(),
      status: "pending",
      method: input.method,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      stripeCustomerId: input.stripeCustomerId ?? null,
      metadata: input.metadata ?? {},
    },
  });
  return normalizePayment(record);
}

export async function updatePaymentStatus(
  paymentId: string,
  status: Payment["status"],
  extra?: {
    stripeChargeId?: string;
    failureReason?: string;
    paidAt?: Date;
    refundedAmount?: number;
    refundedAt?: Date;
  }
): Promise<Payment> {
  const data: Prisma.CommercePaymentUpdateInput = {
    status,
  };

  if (extra?.stripeChargeId) data.stripeChargeId = extra.stripeChargeId;
  if (extra?.failureReason) data.failureReason = extra.failureReason;
  if (extra?.paidAt) data.paidAt = extra.paidAt;
  if (extra?.refundedAmount !== undefined)
    data.refundedAmount = new Prisma.Decimal(extra.refundedAmount);
  if (extra?.refundedAt) data.refundedAt = extra.refundedAt;

  const record = await prisma.commercePayment.update({
    where: { id: paymentId },
    data,
  });
  return normalizePayment(record);
}

export function summarizePayments(payments: Payment[]) {
  const summary = {
    total: payments.length,
    pending: 0,
    processing: 0,
    succeeded: 0,
    failed: 0,
    refunded: 0,
    totalAmount: 0,
    collectedAmount: 0,
    refundedAmount: 0,
  };

  for (const payment of payments) {
    summary[payment.status] += 1;
    summary.totalAmount += payment.amount;
    if (payment.status === "succeeded") {
      summary.collectedAmount += payment.amount;
    }
    if (payment.refundedAmount) {
      summary.refundedAmount += payment.refundedAmount;
    }
  }

  return summary;
}

export async function recordStripeEvent(input: {
  tenantId?: string;
  stripeEventId: string;
  type: string;
  payload: unknown;
  processed?: boolean;
  error?: string;
}) {
  const existing = await prisma.commerceStripeEvent.findUnique({
    where: { stripeEventId: input.stripeEventId },
  });
  if (existing) return existing;

  return prisma.commerceStripeEvent.create({
    data: {
      tenantId: input.tenantId ?? null,
      stripeEventId: input.stripeEventId,
      type: input.type,
      payload: input.payload as Prisma.InputJsonValue,
      processed: input.processed ?? false,
      error: input.error ?? null,
    },
  });
}

export async function resetPaymentStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.commerceStripeEvent.deleteMany();
  await prisma.commercePayment.deleteMany();
}
