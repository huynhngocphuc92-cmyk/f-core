import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "void"]);

export const createInvoiceSchema = z.object({
  quoteId: z.string().min(1).max(64).optional(),
  customerName: z.string().min(1).max(200),
  amount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(4000).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: invoiceStatusSchema,
});

export type Invoice = {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  quoteId: string | null;
  customerName: string;
  amount: number;
  currency: string;
  status: z.infer<typeof invoiceStatusSchema>;
  notes: string | null;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : Number(value);
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function normalizeInvoice(record: {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  quoteId: string | null;
  customerName: string;
  amount: Prisma.Decimal | number;
  currency: string;
  status: string;
  notes: string | null;
  issuedAt: Date | null;
  dueDate: Date | null;
  paidAt: Date | null;
  voidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Invoice {
  return {
    id: record.id,
    tenantId: record.tenantId,
    invoiceNumber: record.invoiceNumber,
    quoteId: record.quoteId,
    customerName: record.customerName,
    amount: toNumber(record.amount),
    currency: record.currency,
    status: invoiceStatusSchema.parse(record.status),
    notes: record.notes,
    issuedAt: toIso(record.issuedAt),
    dueDate: toIso(record.dueDate),
    paidAt: toIso(record.paidAt),
    voidedAt: toIso(record.voidedAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function nextInvoiceNumber(latestInvoiceNumber?: string | null) {
  if (!latestInvoiceNumber) {
    return "INV-00001";
  }

  const match = /^INV-(\d+)$/.exec(latestInvoiceNumber);
  const current = match ? Number(match[1]) : 0;
  return `INV-${String(current + 1).padStart(5, "0")}`;
}

function canTransition(from: Invoice["status"], to: Invoice["status"]) {
  if (from === to) return true;

  const rules: Record<Invoice["status"], Invoice["status"][]> = {
    draft: ["sent", "void"],
    sent: ["paid", "void"],
    paid: [],
    void: [],
  };

  return rules[from].includes(to);
}

export async function listInvoices(tenantId: string): Promise<Invoice[]> {
  const records = await prisma.commerceInvoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return records.map(normalizeInvoice);
}

export async function createInvoice(
  tenantId: string,
  input: z.infer<typeof createInvoiceSchema>
): Promise<Invoice> {
  const latest = await prisma.commerceInvoice.findFirst({
    where: { tenantId },
    select: { invoiceNumber: true },
    orderBy: { createdAt: "desc" },
  });

  const record = await prisma.commerceInvoice.create({
    data: {
      tenantId,
      quoteId: input.quoteId ?? null,
      invoiceNumber: nextInvoiceNumber(latest?.invoiceNumber),
      customerName: input.customerName,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency.toUpperCase(),
      status: "draft",
      notes: input.notes ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });

  return normalizeInvoice(record);
}

export async function updateInvoiceStatus(
  tenantId: string,
  invoiceId: string,
  nextStatus: Invoice["status"]
): Promise<Invoice | null> {
  const existing = await prisma.commerceInvoice.findFirst({
    where: { id: invoiceId, tenantId },
  });
  if (!existing) return null;

  const currentStatus = invoiceStatusSchema.parse(existing.status);
  if (!canTransition(currentStatus, nextStatus)) {
    throw new Error(`Invalid invoice transition: ${currentStatus} -> ${nextStatus}`);
  }

  const now = new Date();
  const data: Prisma.CommerceInvoiceUpdateInput = {
    status: nextStatus,
  };

  if (nextStatus === "sent" && !existing.issuedAt) {
    data.issuedAt = now;
  }

  if (nextStatus === "paid") {
    data.paidAt = now;
  }

  if (nextStatus === "void") {
    data.voidedAt = now;
  }

  const updated = await prisma.commerceInvoice.update({
    where: { id: existing.id },
    data,
  });

  return normalizeInvoice(updated);
}

export function summarizeInvoices(invoices: Invoice[]) {
  const summary = {
    total: invoices.length,
    draft: 0,
    sent: 0,
    paid: 0,
    void: 0,
    totalAmount: 0,
    paidAmount: 0,
  };

  for (const invoice of invoices) {
    summary[invoice.status] += 1;
    summary.totalAmount += invoice.amount;
    if (invoice.status === "paid") {
      summary.paidAmount += invoice.amount;
    }
  }

  return summary;
}

export async function resetInvoiceStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.commerceInvoice.deleteMany();
}
