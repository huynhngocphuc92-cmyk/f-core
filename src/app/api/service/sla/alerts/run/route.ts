import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { runSlaAlertRunner } from "@/lib/sla-alert-runner";

// POST /api/service/sla/alerts/run - trigger SLA breach/at-risk alerts
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
    const result = await runSlaAlertRunner({ tenantId, dryRun });

    await logAuditEvent({
      request,
      action: "executed",
      entity: "sla_alert_runner",
      entityId: tenantId,
      entityName: "service_sla_alerts",
      metadata: {
        ...result,
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
