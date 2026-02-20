import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createPayment,
  createPaymentSchema,
  listPayments,
  summarizePayments,
} from "@/lib/payment-store";
import {
  requireStripe,
  createPaymentIntent,
  findOrCreateCustomer,
  amountToCents,
} from "@/lib/stripe";

// GET /api/commerce/payments - List payments and summary
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const payments = await listPayments(tenantId);
    return NextResponse.json({
      data: payments,
      summary: summarizePayments(payments),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/commerce/payments - Create a payment (optionally via Stripe)
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createPaymentSchema.parse(body);

    let stripePaymentIntentId: string | undefined;
    let stripeCustomerId: string | undefined;
    let clientSecret: string | undefined;

    if (payload.method !== "manual") {
      const stripe = requireStripe();

      const customer = await findOrCreateCustomer(stripe, {
        name: payload.customerName,
        metadata: { tenantId },
      });
      stripeCustomerId = customer.id;

      const pi = await createPaymentIntent(stripe, {
        amount: amountToCents(payload.amount),
        currency: payload.currency,
        customerId: customer.id,
        metadata: {
          tenantId,
          ...(payload.invoiceId ? { invoiceId: payload.invoiceId } : {}),
          ...(payload.subscriptionId
            ? { subscriptionId: payload.subscriptionId }
            : {}),
        },
      });

      stripePaymentIntentId = pi.id;
      clientSecret = pi.client_secret ?? undefined;
    }

    const payment = await createPayment(tenantId, {
      ...payload,
      stripePaymentIntentId,
      stripeCustomerId,
    });

    await logAuditEvent({
      request,
      action: "created",
      entity: "payment",
      entityId: payment.id,
      entityName: payment.customerName,
      changes: {
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
      },
    });

    return NextResponse.json(
      {
        payment,
        ...(clientSecret ? { clientSecret } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
