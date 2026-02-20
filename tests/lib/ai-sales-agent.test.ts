import { describe, expect, it } from "vitest";
import { buildSalesAgentInsights } from "@/lib/ai/sales-agent";

describe("ai sales agent", () => {
  it("builds actionable and explainable recommendations", () => {
    const result = buildSalesAgentInsights({
      query: "What should I do to protect this quarter pipeline?",
      period: "quarter",
      maxRecommendations: 3,
      forecast: {
        generatedAt: "2026-01-01T00:00:00.000Z",
        summary: {
          openDealAmount: 120000,
          weightedPipeline: 76000,
          trendGrowthPct: 8.5,
          confidencePct: 78,
        },
        monthly: [
          {
            key: "2026-01",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-02-01T00:00:00.000Z",
            pipelineAmount: 50000,
            weightedForecast: 30000,
            trendBaseline: 35000,
            forecast: 32000,
            confidenceLow: 24000,
            confidenceHigh: 40000,
          },
        ],
        quarterly: [
          {
            key: "2026-Q1",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-04-01T00:00:00.000Z",
            pipelineAmount: 120000,
            weightedForecast: 76000,
            trendBaseline: 68000,
            forecast: 73400,
            confidenceLow: 61000,
            confidenceHigh: 86000,
          },
        ],
      },
      coachingInsights: [
        {
          dealId: "d1",
          dealName: "Enterprise Renewal",
          amount: 40000,
          stageName: "Negotiation",
          healthScore: 45,
          riskLevel: "high",
          reasons: ["Low stage probability", "No recent call activity"],
          recommendations: ["Schedule executive follow-up call within 48 hours."],
          callCount: 1,
          avgSentiment: -0.2,
        },
      ],
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0].action.length).toBeGreaterThan(10);
    expect(result.recommendations[0].evidence.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
