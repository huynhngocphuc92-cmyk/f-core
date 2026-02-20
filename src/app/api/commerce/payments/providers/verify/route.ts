import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { verifyPaymentProviderSchema, verifyPaymentProviders } from "@/lib/payment-provider-store";

// POST /api/commerce/payments/providers/verify - Verify connection health of payment providers
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json().catch(() => ({}));
    const payload = verifyPaymentProviderSchema.parse(body || {});

    const verification = await verifyPaymentProviders(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "payment_provider_verification",
      entityId: payload.provider || "all",
      entityName: "Payment Provider Verification",
      changes: {
        checked: verification.checked,
        succeeded: verification.succeeded,
        failed: verification.failed,
      },
    });

    return NextResponse.json(verification);
  } catch (error) {
    return handleApiError(error);
  }
}
