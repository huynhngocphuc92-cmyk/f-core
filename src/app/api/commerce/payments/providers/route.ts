import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  getPaymentProviderStateForApi,
  updatePaymentProvider,
  updatePaymentProviderSchema,
} from "@/lib/payment-provider-store";

// GET /api/commerce/payments/providers - Payment provider configuration
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const state = await getPaymentProviderStateForApi(tenantId);
    return NextResponse.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/commerce/payments/providers - Update provider mode/credentials with rotation
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = updatePaymentProviderSchema.parse(body);

    const state = await updatePaymentProvider(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "payment_provider_config",
      entityId: payload.provider,
      entityName: payload.provider,
      changes: {
        mode: payload.mode,
        enabled: payload.enabled,
        version: state.providers[payload.provider].version,
      },
    });

    return NextResponse.json(await getPaymentProviderStateForApi(tenantId));
  } catch (error) {
    return handleApiError(error);
  }
}
