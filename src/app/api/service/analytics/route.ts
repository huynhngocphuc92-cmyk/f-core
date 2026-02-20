import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { buildServiceAnalytics } from "@/lib/service-analytics";

// GET /api/service/analytics - Service analytics dashboard v2 payload
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const days = Math.max(1, Math.min(365, Number(request.nextUrl.searchParams.get("days") || "30")));
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const surveyResponseLimit = Math.max(
      1,
      Math.min(100, Number(request.nextUrl.searchParams.get("surveyLimit") || "20"))
    );

    const [tickets, surveyActivities] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: from },
        },
        select: {
          id: true,
          status: true,
          priority: true,
          source: true,
          category: true,
          createdAt: true,
          firstResponseAt: true,
          resolvedAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3000,
      }),
      prisma.activity.findMany({
        where: {
          tenantId,
          type: "note",
          createdAt: { gte: from },
        },
        select: {
          contactId: true,
          body: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 4000,
      }),
    ]);

    const payload = buildServiceAnalytics({
      tickets,
      surveyActivities,
      responseLimit: surveyResponseLimit,
    });

    return NextResponse.json({
      windowDays: days,
      generatedAt: new Date().toISOString(),
      ...payload,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
