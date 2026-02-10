import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const lineItemSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).optional(),
});

const updateQuoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: z
    .enum(["draft", "pending", "approved", "rejected", "expired"])
    .optional(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  paymentTerms: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  terms: z.string().max(5000).nullable().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

// GET /api/quotes/[id] - Get a single quote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
        lineItems: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    await checkOwnership(quote.tenantId, request);

    return NextResponse.json(quote);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/quotes/[id] - Update a quote
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateQuoteSchema.parse(body);

    const existing = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    // Handle status change timestamps
    const statusData: Record<string, Date> = {};
    if (data.status === "pending" && existing.status === "draft") {
      statusData.sentAt = new Date();
    }
    if (data.status === "approved" && existing.status !== "approved") {
      statusData.approvedAt = new Date();
    }

    // Handle line items replacement
    if (data.lineItems) {
      await prisma.quoteLineItem.deleteMany({ where: { quoteId: id } });

      const lineItemsData = data.lineItems.map((item, index) => {
        const discountPct = item.discount ?? 0;
        const lineTotal =
          item.quantity * item.unitPrice * (1 - discountPct / 100);
        return {
          quoteId: id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          discount: new Prisma.Decimal(discountPct),
          total: new Prisma.Decimal(lineTotal),
          orderIndex: index,
        };
      });

      await prisma.quoteLineItem.createMany({ data: lineItemsData });

      const subtotal = lineItemsData.reduce(
        (sum, item) => sum + Number(item.total),
        0
      );

      await prisma.quote.update({
        where: { id },
        data: {
          subtotal: new Prisma.Decimal(subtotal),
          total: new Prisma.Decimal(subtotal),
        },
      });
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.contactId !== undefined && { contactId: data.contactId }),
        ...(data.companyId !== undefined && { companyId: data.companyId }),
        ...(data.dealId !== undefined && { dealId: data.dealId }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
        ...(data.paymentTerms !== undefined && {
          paymentTerms: data.paymentTerms,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.terms !== undefined && { terms: data.terms }),
        ...statusData,
      },
      include: {
        owner: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
        lineItems: { orderBy: { orderIndex: "asc" } },
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/quotes/[id] - Soft delete a quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.quote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
