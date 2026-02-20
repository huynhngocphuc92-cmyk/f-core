import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createInvoice,
  createInvoiceSchema,
  listInvoices,
  summarizeInvoices,
} from "@/lib/invoice-store";

// GET /api/commerce/invoices - List invoices and summary
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const invoices = await listInvoices(tenantId);
    return NextResponse.json({
      data: invoices,
      summary: summarizeInvoices(invoices),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/commerce/invoices - Create invoice in draft state
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createInvoiceSchema.parse(body);

    if (payload.quoteId) {
      const quote = await prisma.quote.findFirst({
        where: {
          id: payload.quoteId,
          tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!quote) {
        throw new ApiError(404, "Quote not found");
      }
    }

    const invoice = await createInvoice(tenantId, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "invoice",
      entityId: invoice.id,
      entityName: invoice.invoiceNumber,
      changes: {
        status: invoice.status,
        amount: invoice.amount,
        currency: invoice.currency,
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
