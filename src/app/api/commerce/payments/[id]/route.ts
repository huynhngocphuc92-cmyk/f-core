import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  getPaymentById,
  updatePaymentStatus,
} from "@/lib/payment-store";
import {
  getStripe,
  createRefund,
  amountToCents,
  centsToAmount,
} from "@/lib/stripe";

type RouteContext = { params: Promise<{ id: string }> };

const updatePaymentActionSchema = z.object({
  action: z.enum(["mark_paid", "refund"]),
  refundAmount: z.number().min(0).optional(),
  refundReason: z
    .enum(["duplicate", "fraudulent", "requested_by_customer"])
    .optional(),
});

// GET /api/commerce/payments/:id
export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await ctx.params;
    const payment = await getPaymentById(tenantId, id);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return NextResponse.json({ payment });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/commerce/payments/:id - mark_paid or refund
export async function PUT(request: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await ctx.params;
    const body = await request.json();
    const { action, refundAmount, refundReason } =
      updatePaymentActionSchema.parse(body);

    const payment = await getPaymentById(tenantId, id);
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (action === "mark_paid") {
      if (payment.status === "succeeded") {
        throw new ApiError(400, "Payment is already marked as paid");
      }

      const updated = await updatePaymentStatus(payment.id, "succeeded", {
        paidAt: new Date(),
      });

      await logAuditEvent({
        request,
        action: "payment_marked_paid",
        entity: "payment",
        entityId: payment.id,
        entityName: payment.customerName,
      });

      return NextResponse.json({ payment: updated });
    }

    if (action === "refund") {
      if (payment.status !== "succeeded") {
        throw new ApiError(400, "Only succeeded payments can be refunded");
      }

      if (payment.stripePaymentIntentId) {
        const stripe = getStripe();
        if (stripe) {
          await createRefund(stripe, {
            paymentIntentId: payment.stripePaymentIntentId,
            amount: refundAmount ? amountToCents(refundAmount) : undefined,
            reason: refundReason,
          });
        }
      }

      const refunded = refundAmount ?? payment.amount;
      const updated = await updatePaymentStatus(payment.id, "refunded", {
        refundedAmount: refunded,
        refundedAt: new Date(),
      });

      await logAuditEvent({
        request,
        action: "payment_refunded",
        entity: "payment",
        entityId: payment.id,
        entityName: payment.customerName,
        changes: { refundedAmount: refunded },
      });

      return NextResponse.json({ payment: updated });
    }

    throw new ApiError(400, "Unknown action");
  } catch (error) {
    return handleApiError(error);
  }
}
