import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { buildSalesCoachingInsights } from "@/lib/sales-coaching";

// GET /api/sales/coaching - Deal coaching insights from pipeline and call signals
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit") || "50"), 1),
      200
    );

    const [deals, activities] = await Promise.all([
      prisma.deal.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          amount: true,
          probability: true,
          closeDate: true,
          closedReason: true,
          stage: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      prisma.activity.findMany({
        where: {
          tenantId,
          type: "call",
        },
        select: {
          dealId: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

    const calls = activities
      .map((activity) => {
        const metadata =
          activity.metadata && typeof activity.metadata === "object" && !Array.isArray(activity.metadata)
            ? (activity.metadata as Record<string, unknown>)
            : {};

        if (metadata.salesCallIntelligence !== true) return null;

        return {
          dealId: activity.dealId,
          createdAt: activity.createdAt,
          sentimentScore:
            typeof metadata.sentimentScore === "number" ? metadata.sentimentScore : null,
          riskSignals: Array.isArray(metadata.riskSignals)
            ? (metadata.riskSignals as string[])
            : [],
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const insights = buildSalesCoachingInsights({
      deals: deals.map((deal) => ({
        id: deal.id,
        name: deal.name,
        amount: deal.amount ? Number(deal.amount) : 0,
        probability: deal.probability,
        closeDate: deal.closeDate,
        stageName: deal.stage?.name || null,
        closedReason: deal.closedReason,
      })),
      calls,
    }).slice(0, limit);

    const summary = {
      totalDeals: insights.length,
      highRisk: insights.filter((item) => item.riskLevel === "high").length,
      mediumRisk: insights.filter((item) => item.riskLevel === "medium").length,
      lowRisk: insights.filter((item) => item.riskLevel === "low").length,
    };

    return NextResponse.json({ data: insights, summary });
  } catch (error) {
    return handleApiError(error);
  }
}
