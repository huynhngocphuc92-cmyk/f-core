import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  recordQuoteESignEvent,
  recordQuoteESignEventSchema,
} from "@/lib/quote-cpq-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("crm.write", request);
    const { id } = await params;
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = recordQuoteESignEventSchema.parse(body);

    const data = await recordQuoteESignEvent(tenantId, id, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "quote",
      entityId: id,
      metadata: {
        cpq: "esign_event",
        event: payload.event,
        eSignStatus: data.quote.eSignStatus,
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
