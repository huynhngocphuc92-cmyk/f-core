import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { z } from "zod";

const lineItemSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).optional(),
});

const createQuoteSchema = z.object({
  title: z.string().min(1).max(500),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  paymentTerms: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
  currency: z.string().max(3).optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

// GET /api/quotes - List quotes
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    const additionalWhere = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } },
          _count: { select: { lineItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return paginatedResponse(quotes, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/quotes - Create a quote with line items
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createQuoteSchema.parse(body);

    // Calculate totals
    const lineItemsData = data.lineItems.map((item, index) => {
      const discountPct = item.discount ?? 0;
      const lineTotal =
        item.quantity * item.unitPrice * (1 - discountPct / 100);
      return {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(item.unitPrice),
        discount: new Prisma.Decimal(discountPct),
        total: new Prisma.Decimal(lineTotal),
        orderIndex: index,
      };
    });

    const subtotal = lineItemsData.reduce(
      (sum, item) => sum + Number(item.total),
      0
    );

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        title: data.title,
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        terms: data.terms,
        currency: data.currency || "USD",
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        ownerId: user.id,
        lineItems: {
          create: lineItemsData,
        },
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

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
