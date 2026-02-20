import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { buildSalesForecast } from "@/lib/sales-forecast";
import { buildSalesCoachingInsights } from "@/lib/sales-coaching";
import { buildSalesAgentInsights, salesAgentRequestSchema } from "@/lib/ai/sales-agent";

async function computeSalesAgentResponse(
  tenantId: string,
  input: {
    query?: string;
    maxRecommendations?: number;
    period?: "month" | "quarter";
  }
) {
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
        closedAt: true,
        stage: { select: { name: true, probability: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5000,
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

  const forecast = buildSalesForecast({
    deals: deals.map((deal) => ({
      amount: deal.amount ? Number(deal.amount) : null,
      probability: deal.probability ?? null,
      closeDate: deal.closeDate,
      closedReason: deal.closedReason,
      closedAt: deal.closedAt,
      stageProbability: deal.stage?.probability ?? null,
    })),
  });

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

  const coaching = buildSalesCoachingInsights({
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
  });

  return buildSalesAgentInsights({
    query: input.query,
    maxRecommendations: input.maxRecommendations,
    period: input.period,
    forecast,
    coachingInsights: coaching,
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const payload = salesAgentRequestSchema.parse({
      query: request.nextUrl.searchParams.get("query") || undefined,
      maxRecommendations: request.nextUrl.searchParams.get("maxRecommendations")
        ? Number(request.nextUrl.searchParams.get("maxRecommendations"))
        : undefined,
      period: (request.nextUrl.searchParams.get("period") as "month" | "quarter" | null) || undefined,
    });

    const data = await computeSalesAgentResponse(user.tenantId, payload);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const body = await request.json();
    const payload = salesAgentRequestSchema.parse(body);

    const data = await computeSalesAgentResponse(user.tenantId, payload);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
