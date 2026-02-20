import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  requireStripe,
  findOrCreateCustomer,
  createCheckoutSession,
  amountToCents,
} from "@/lib/stripe";
import { createPayment } from "@/lib/payment-store";

const checkoutSchema = z.object({
  invoiceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// POST /api/commerce/stripe/checkout - Create checkout session for an invoice
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const { invoiceId, successUrl, cancelUrl } = checkoutSchema.parse(body);

    const stripe = requireStripe();

    const invoice = await prisma.commerceInvoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }
    if (invoice.status === "paid") {
      throw new ApiError(400, "Invoice is already paid");
    }
    if (invoice.status === "void") {
      throw new ApiError(400, "Invoice is voided");
    }

    const customer = await findOrCreateCustomer(stripe, {
      name: invoice.customerName,
      metadata: { tenantId, invoiceId },
    });

    const amount = Number(invoice.amount);

    const session = await createCheckoutSession(stripe, {
      customerId: customer.id,
      lineItems: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: amountToCents(amount),
          },
          quantity: 1,
        },
      ],
      successUrl,
      cancelUrl,
      metadata: {
        tenantId,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
      },
      mode: "payment",
    });

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? undefined;

    await createPayment(tenantId, {
      invoiceId,
      customerName: invoice.customerName,
      amount,
      currency: invoice.currency,
      method: "card",
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: customer.id,
    });

    if (!invoice.stripeInvoiceId) {
      await prisma.commerceInvoice.update({
        where: { id: invoice.id },
        data: {
          stripePaymentIntentId: paymentIntentId,
        },
      });
    }

    if (invoice.status === "draft") {
      await prisma.commerceInvoice.update({
        where: { id: invoice.id },
        data: { status: "sent", issuedAt: new Date() },
      });
    }

    await logAuditEvent({
      request,
      action: "checkout_session_created",
      entity: "invoice",
      entityId: invoiceId,
      entityName: invoice.invoiceNumber,
      metadata: { sessionId: session.id },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        sessionUrl: session.url,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
