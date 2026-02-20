import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/api-helpers";
import { runSlaAlertRunner } from "@/lib/sla-alert-runner";

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expected =
    process.env.SLA_ALERTS_CRON_SECRET || process.env.CRON_SECRET || "";
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  const bearer =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
  const cronKey = request.headers.get("x-cron-key");

  return bearer === expected || cronKey === expected;
}

// POST /api/cron/sla-alerts - run SLA alert runner on schedule
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
    const tenantId = request.nextUrl.searchParams.get("tenantId");

    const tenantIds = tenantId
      ? [tenantId]
      : (
          await prisma.tenant.findMany({
            select: { id: true },
            take: 200,
          })
        ).map((tenant) => tenant.id);

    const results = [];
    for (const id of tenantIds) {
      const result = await runSlaAlertRunner({ tenantId: id, dryRun });
      results.push(result);
    }

    const summary = results.reduce(
      (acc, item) => {
        acc.tenants += 1;
        acc.targetTickets += item.targetTicketCount;
        acc.notificationsCreated += item.notificationsCreated;
        acc.notificationsSuppressed += item.notificationsSuppressed;
        acc.notificationsWouldCreate += item.notificationsWouldCreate;
        return acc;
      },
      {
        tenants: 0,
        targetTickets: 0,
        notificationsCreated: 0,
        notificationsSuppressed: 0,
        notificationsWouldCreate: 0,
      }
    );

    return NextResponse.json({
      success: true,
      dryRun,
      summary,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
