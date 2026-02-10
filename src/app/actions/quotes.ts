"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

// ============================================
// GET QUOTES (LIST)
// ============================================

export async function getQuotes(filters?: {
  search?: string;
  status?: string;
}) {
  const tenantId = await getTenantId();

  const quotes = await prisma.quote.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(filters?.status && filters.status !== "all"
        ? { status: filters.status }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" as const } },
              { notes: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      company: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      lineItems: { orderBy: { orderIndex: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    title: q.title,
    status: q.status,
    expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
    subtotal: Number(q.subtotal),
    discount: Number(q.discount),
    tax: Number(q.tax),
    total: Number(q.total),
    currency: q.currency,
    sentAt: q.sentAt ? q.sentAt.toISOString() : null,
    approvedAt: q.approvedAt ? q.approvedAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    contact: q.contact
      ? {
          id: q.contact.id,
          name: [q.contact.firstName, q.contact.lastName].filter(Boolean).join(" ") || q.contact.email || "Unnamed",
        }
      : null,
    company: q.company ? { id: q.company.id, name: q.company.name } : null,
    deal: q.deal ? { id: q.deal.id, name: q.deal.name } : null,
    owner: q.owner ? { id: q.owner.id, name: q.owner.name || q.owner.email } : null,
  }));
}

// ============================================
// GET QUOTE STATS
// ============================================

export async function getQuoteStats() {
  const tenantId = await getTenantId();

  const [total, draft, pending, approved, quotes] = await Promise.all([
    prisma.quote.count({ where: { tenantId, deletedAt: null } }),
    prisma.quote.count({ where: { tenantId, deletedAt: null, status: "draft" } }),
    prisma.quote.count({ where: { tenantId, deletedAt: null, status: "pending" } }),
    prisma.quote.count({ where: { tenantId, deletedAt: null, status: "approved" } }),
    prisma.quote.findMany({
      where: { tenantId, deletedAt: null },
      select: { total: true },
    }),
  ]);

  const totalValue = quotes.reduce((sum, q) => sum + Number(q.total), 0);

  return { total, draft, pending, approved, totalValue };
}

// ============================================
// GET SINGLE QUOTE
// ============================================

export async function getQuote(id: string) {
  const tenantId = await getTenantId();

  const quote = await prisma.quote.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      company: { select: { id: true, name: true, domain: true } },
      deal: { select: { id: true, name: true, amount: true, currency: true } },
      owner: { select: { id: true, name: true, email: true } },
      lineItems: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!quote) return null;

  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    status: quote.status,
    expiresAt: quote.expiresAt ? quote.expiresAt.toISOString() : null,
    subtotal: Number(quote.subtotal),
    discount: Number(quote.discount),
    tax: Number(quote.tax),
    total: Number(quote.total),
    currency: quote.currency,
    notes: quote.notes,
    terms: quote.terms,
    paymentTerms: quote.paymentTerms,
    sentAt: quote.sentAt ? quote.sentAt.toISOString() : null,
    approvedAt: quote.approvedAt ? quote.approvedAt.toISOString() : null,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    contact: quote.contact
      ? {
          id: quote.contact.id,
          firstName: quote.contact.firstName,
          lastName: quote.contact.lastName,
          email: quote.contact.email,
          name: [quote.contact.firstName, quote.contact.lastName].filter(Boolean).join(" ") || quote.contact.email || "Unnamed",
        }
      : null,
    company: quote.company
      ? { id: quote.company.id, name: quote.company.name, domain: quote.company.domain }
      : null,
    deal: quote.deal
      ? {
          id: quote.deal.id,
          name: quote.deal.name,
          amount: quote.deal.amount ? Number(quote.deal.amount) : null,
          currency: quote.deal.currency,
        }
      : null,
    owner: quote.owner
      ? { id: quote.owner.id, name: quote.owner.name || quote.owner.email }
      : null,
    lineItems: quote.lineItems.map((li) => ({
      id: li.id,
      name: li.name,
      description: li.description,
      quantity: li.quantity,
      unitPrice: Number(li.unitPrice),
      discount: Number(li.discount),
      total: Number(li.total),
      orderIndex: li.orderIndex,
    })),
  };
}

// ============================================
// CREATE QUOTE
// ============================================

export interface QuoteLineItemInput {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateQuoteInput {
  title: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  expiresAt?: string;
  paymentTerms?: string;
  notes?: string;
  terms?: string;
  lineItems: QuoteLineItemInput[];
}

export async function createQuote(data: CreateQuoteInput) {
  const tenantId = await getTenantId();

  if (!data.title) {
    return { error: "Quote title is required" };
  }

  // Calculate totals from line items
  let subtotal = 0;
  const processedLineItems = data.lineItems.map((item, index) => {
    const itemTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
    subtotal += itemTotal;
    return {
      name: item.name,
      description: item.description || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: Math.round(itemTotal * 100) / 100,
      orderIndex: index,
    };
  });

  const total = subtotal;

  const quote = await prisma.quote.create({
    data: {
      tenantId,
      title: data.title,
      status: "draft",
      contactId: data.contactId || undefined,
      companyId: data.companyId || undefined,
      dealId: data.dealId || undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      paymentTerms: data.paymentTerms || undefined,
      notes: data.notes || undefined,
      terms: data.terms || undefined,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: 0,
      tax: 0,
      total: Math.round(total * 100) / 100,
      lineItems: {
        create: processedLineItems,
      },
    },
  });

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

// ============================================
// UPDATE QUOTE
// ============================================

export interface UpdateQuoteInput {
  title?: string;
  status?: string;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  expiresAt?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  terms?: string | null;
  lineItems?: QuoteLineItemInput[];
}

export async function updateQuote(id: string, data: UpdateQuoteInput) {
  const tenantId = await getTenantId();

  const existing = await prisma.quote.findFirst({
    where: { id, tenantId, deletedAt: null },
  });

  if (!existing) {
    return { error: "Quote not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "pending") updateData.sentAt = new Date();
    if (data.status === "approved") updateData.approvedAt = new Date();
  }
  if (data.contactId !== undefined) updateData.contactId = data.contactId || null;
  if (data.companyId !== undefined) updateData.companyId = data.companyId || null;
  if (data.dealId !== undefined) updateData.dealId = data.dealId || null;
  if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.terms !== undefined) updateData.terms = data.terms || null;

  // If line items are provided, recalculate totals
  if (data.lineItems) {
    let subtotal = 0;
    const processedLineItems = data.lineItems.map((item, index) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
      subtotal += itemTotal;
      return {
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: Math.round(itemTotal * 100) / 100,
        orderIndex: index,
      };
    });

    updateData.subtotal = Math.round(subtotal * 100) / 100;
    updateData.total = Math.round(subtotal * 100) / 100;

    // Delete existing line items and recreate
    await prisma.quoteLineItem.deleteMany({ where: { quoteId: id } });
    await prisma.quoteLineItem.createMany({
      data: processedLineItems.map((li) => ({ ...li, quoteId: id })),
    });
  }

  await prisma.quote.update({
    where: { id },
    data: updateData,
  });

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  return { success: true };
}

// ============================================
// DELETE QUOTE (soft delete)
// ============================================

export async function deleteQuote(id: string) {
  const tenantId = await getTenantId();
  await prisma.quote.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/quotes");
  redirect("/quotes");
}
