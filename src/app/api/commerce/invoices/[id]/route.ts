import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { updateInvoiceStatus, updateInvoiceStatusSchema } from "@/lib/invoice-store";

// PATCH /api/commerce/invoices/[id] - Transition invoice lifecycle status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const body = await request.json();
    const payload = updateInvoiceStatusSchema.parse(body);

    let invoice;
    try {
      invoice = await updateInvoiceStatus(tenantId, id, payload.status);
    } catch (error) {
      throw new ApiError(409, error instanceof Error ? error.message : "Invalid invoice transition");
    }

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "invoice",
      entityId: invoice.id,
      entityName: invoice.invoiceNumber,
      changes: {
        status: invoice.status,
      },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}
