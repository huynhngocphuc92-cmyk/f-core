import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { buildSalesForecast } from "@/lib/sales-forecast";

// GET /api/sales/forecast - Revenue forecasting (stage-weighted + trend + confidence)
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const period = request.nextUrl.searchParams.get("period");

    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        amount: true,
        probability: true,
        closeDate: true,
        closedReason: true,
        closedAt: true,
        stage: { select: { probability: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const payload = buildSalesForecast({
      deals: deals.map((deal) => ({
        amount: deal.amount ? Number(deal.amount) : null,
        probability: deal.probability ?? null,
        closeDate: deal.closeDate,
        closedReason: deal.closedReason,
        closedAt: deal.closedAt,
        stageProbability: deal.stage?.probability ?? null,
      })),
    });

    const series =
      period === "quarter"
        ? payload.quarterly
        : period === "month"
          ? payload.monthly
          : undefined;

    return NextResponse.json({
      ...payload,
      ...(series ? { period, series } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
