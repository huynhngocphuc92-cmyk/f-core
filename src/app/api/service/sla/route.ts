import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { getActiveTicketsWithSla } from "@/lib/sla-service";

// GET /api/service/sla - SLA overview and breach tracking
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { policy, tickets: withSla } = await getActiveTicketsWithSla(tenantId);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10))
    );
    const breached = withSla.filter((ticket) => ticket.sla.breached);
    const atRisk = withSla.filter((ticket) => ticket.sla.atRisk);
    const firstResponseBreaches = withSla.filter(
      (ticket) => ticket.sla.firstResponse.breached
    );
    const resolutionBreaches = withSla.filter(
      (ticket) => ticket.sla.resolution.breached
    );

    const priorities = ["urgent", "high", "medium", "low"] as const;
    const byPriority = priorities.map((priority) => {
      const bucket = withSla.filter((ticket) => ticket.priority === priority);
      return {
        priority,
        total: bucket.length,
        breached: bucket.filter((ticket) => ticket.sla.breached).length,
        atRisk: bucket.filter((ticket) => ticket.sla.atRisk).length,
      };
    });

    return NextResponse.json({
      policyVersion: "v1",
      policies: policy,
      summary: {
        openTickets: withSla.length,
        breachedTickets: breached.length,
        atRiskTickets: atRisk.length,
        firstResponseBreaches: firstResponseBreaches.length,
        resolutionBreaches: resolutionBreaches.length,
        breachRatePct:
          withSla.length > 0
            ? Number(((breached.length / withSla.length) * 100).toFixed(1))
            : 0,
      },
      byPriority,
      tickets: withSla
        .sort((a, b) => {
          const aSeverity = a.sla.breached ? 2 : a.sla.atRisk ? 1 : 0;
          const bSeverity = b.sla.breached ? 2 : b.sla.atRisk ? 1 : 0;
          if (bSeverity !== aSeverity) return bSeverity - aSeverity;
          return (
            new Date(a.sla.resolution.dueAt).getTime() -
            new Date(b.sla.resolution.dueAt).getTime()
          );
        })
        .slice(0, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
