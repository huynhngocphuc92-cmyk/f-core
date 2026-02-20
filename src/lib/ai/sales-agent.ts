import { z } from "zod";
import { buildSalesForecast, type SalesForecastResult } from "@/lib/sales-forecast";
import { buildSalesCoachingInsights, type SalesCoachingInsight } from "@/lib/sales-coaching";

export const salesAgentRequestSchema = z.object({
  query: z.string().max(2000).optional(),
  maxRecommendations: z.number().int().min(1).max(10).default(5),
  period: z.enum(["month", "quarter"]).default("quarter"),
});

export type SalesAgentRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  action: string;
  rationale: string;
  confidence: number;
  evidence: string[];
  relatedDealIds: string[];
};

export type SalesAgentResponse = {
  generatedAt: string;
  query: string;
  confidence: number;
  summary: {
    weightedPipeline: number;
    trendGrowthPct: number;
    highRiskDeals: number;
    totalDealsInCoachingScope: number;
  };
  recommendations: SalesAgentRecommendation[];
  explainability: {
    forecast: {
      confidencePct: number;
      openDealAmount: number;
      weightedPipeline: number;
      trendGrowthPct: number;
    };
    coaching: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreConfidence(args: {
  forecast: SalesForecastResult;
  insights: SalesCoachingInsight[];
}) {
  const forecastConfidence = args.forecast.summary.confidencePct;
  const insightCoverage = args.insights.length >= 3 ? 1 : args.insights.length / 3;
  const riskPenalty = args.insights.length
    ? args.insights.filter((item) => item.riskLevel === "high").length / args.insights.length
    : 0;

  const score =
    forecastConfidence * 0.6 +
    insightCoverage * 30 -
    riskPenalty * 20;

  return Math.round(clamp(score, 35, 95));
}

function buildRecommendations(args: {
  forecast: SalesForecastResult;
  insights: SalesCoachingInsight[];
  maxRecommendations: number;
  period: "month" | "quarter";
}) {
  const recommendations: SalesAgentRecommendation[] = [];

  const highRisk = args.insights.filter((item) => item.riskLevel === "high");
  const mediumRisk = args.insights.filter((item) => item.riskLevel === "medium");

  if (highRisk.length > 0) {
    const top = highRisk.slice(0, 3);
    recommendations.push({
      id: `rec-high-risk-${top.map((item) => item.dealId).join("-")}`,
      priority: "high",
      title: "Stabilize at-risk deals",
      action:
        "Schedule executive rescue reviews for high-risk deals in the next 48 hours and assign owners for each blocker.",
      rationale: `${highRisk.length} deals are marked high risk based on sentiment/activity/probability signals.`,
      confidence: 84,
      evidence: top.flatMap((item) => [
        `${item.dealName}: health ${item.healthScore}`,
        ...item.reasons.slice(0, 2),
      ]),
      relatedDealIds: top.map((item) => item.dealId),
    });
  }

  const series = args.period === "month" ? args.forecast.monthly : args.forecast.quarterly;
  const nextPoint = series[0];
  if (nextPoint) {
    const gap = nextPoint.forecast - nextPoint.weightedForecast;
    recommendations.push({
      id: `rec-forecast-${nextPoint.key}`,
      priority: gap > 0 ? "medium" : "low",
      title: "Improve forecast reliability",
      action:
        "Run pipeline hygiene review on top opportunities and update close dates/probabilities to tighten forecast variance.",
      rationale: `Forecast vs weighted gap for ${nextPoint.key} is ${Math.round(gap)}.`,
      confidence: 76,
      evidence: [
        `weightedForecast=${nextPoint.weightedForecast}`,
        `trendBaseline=${nextPoint.trendBaseline}`,
        `confidenceBand=${nextPoint.confidenceLow}-${nextPoint.confidenceHigh}`,
      ],
      relatedDealIds: [],
    });
  }

  if (mediumRisk.length > 0) {
    const top = mediumRisk.slice(0, 3);
    recommendations.push({
      id: `rec-medium-risk-${top.map((item) => item.dealId).join("-")}`,
      priority: "medium",
      title: "Advance medium-risk deals",
      action:
        "Trigger deal coaching sequence: value recap email, next-step confirmation, and procurement risk check.",
      rationale: `${mediumRisk.length} deals are medium risk and can be improved with short-cycle coaching actions.`,
      confidence: 73,
      evidence: top.map((item) => `${item.dealName}: ${item.recommendations[0] || "No recommendation"}`),
      relatedDealIds: top.map((item) => item.dealId),
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec-default-momentum",
      priority: "low",
      title: "Maintain momentum",
      action: "Keep current execution cadence and monitor forecast drift weekly.",
      rationale: "No elevated risk signals detected in current coaching and forecast inputs.",
      confidence: 65,
      evidence: [
        `trendGrowthPct=${args.forecast.summary.trendGrowthPct}`,
        `confidencePct=${args.forecast.summary.confidencePct}`,
      ],
      relatedDealIds: [],
    });
  }

  return recommendations.slice(0, args.maxRecommendations);
}

export function buildSalesAgentInsights(args: {
  query?: string;
  maxRecommendations?: number;
  period?: "month" | "quarter";
  forecast: SalesForecastResult;
  coachingInsights: SalesCoachingInsight[];
}): SalesAgentResponse {
  const payload = salesAgentRequestSchema.parse({
    query: args.query,
    maxRecommendations: args.maxRecommendations,
    period: args.period,
  });

  const confidence = scoreConfidence({
    forecast: args.forecast,
    insights: args.coachingInsights,
  });

  const recommendations = buildRecommendations({
    forecast: args.forecast,
    insights: args.coachingInsights,
    maxRecommendations: payload.maxRecommendations,
    period: payload.period,
  });

  const highRisk = args.coachingInsights.filter((item) => item.riskLevel === "high").length;
  const mediumRisk = args.coachingInsights.filter((item) => item.riskLevel === "medium").length;
  const lowRisk = args.coachingInsights.filter((item) => item.riskLevel === "low").length;

  return {
    generatedAt: new Date().toISOString(),
    query: payload.query || "sales agent default analysis",
    confidence,
    summary: {
      weightedPipeline: args.forecast.summary.weightedPipeline,
      trendGrowthPct: args.forecast.summary.trendGrowthPct,
      highRiskDeals: highRisk,
      totalDealsInCoachingScope: args.coachingInsights.length,
    },
    recommendations,
    explainability: {
      forecast: {
        confidencePct: args.forecast.summary.confidencePct,
        openDealAmount: args.forecast.summary.openDealAmount,
        weightedPipeline: args.forecast.summary.weightedPipeline,
        trendGrowthPct: args.forecast.summary.trendGrowthPct,
      },
      coaching: {
        highRisk,
        mediumRisk,
        lowRisk,
      },
    },
  };
}

export function buildSalesAgentFromRawData(args: {
  query?: string;
  maxRecommendations?: number;
  period?: "month" | "quarter";
  deals: Parameters<typeof buildSalesForecast>[0]["deals"];
  calls: Parameters<typeof buildSalesCoachingInsights>[0]["calls"];
}) {
  const forecast = buildSalesForecast({ deals: args.deals });
  const coaching = buildSalesCoachingInsights({
    deals: args.deals.map((deal, index) => ({
      id: `deal-${index}`,
      name: `Deal ${index + 1}`,
      amount: Number(deal.amount || 0),
      probability: deal.probability,
      closeDate: deal.closeDate,
      stageName: null,
      closedReason: deal.closedReason,
    })),
    calls: args.calls,
  });

  return buildSalesAgentInsights({
    query: args.query,
    maxRecommendations: args.maxRecommendations,
    period: args.period,
    forecast,
    coachingInsights: coaching,
  });
}
