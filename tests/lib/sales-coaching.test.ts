import { describe, expect, it } from "vitest";
import { buildSalesCoachingInsights } from "@/lib/sales-coaching";

describe("sales coaching engine", () => {
  it("flags high-risk deals with weak signals", () => {
    const insights = buildSalesCoachingInsights({
      now: new Date("2026-02-14T00:00:00.000Z"),
      deals: [
        {
          id: "deal-1",
          name: "Enterprise Deal",
          amount: 120000,
          probability: 20,
          closeDate: new Date("2026-02-01T00:00:00.000Z"),
          stageName: "Negotiation",
          closedReason: null,
        },
      ],
      calls: [],
    });

    expect(insights[0]?.riskLevel).toBe("high");
    expect(insights[0]?.healthScore).toBeLessThan(50);
  });

  it("keeps healthy deal with good call sentiment in low risk", () => {
    const insights = buildSalesCoachingInsights({
      now: new Date("2026-02-14T00:00:00.000Z"),
      deals: [
        {
          id: "deal-2",
          name: "Expansion Deal",
          amount: 60000,
          probability: 75,
          closeDate: new Date("2026-03-10T00:00:00.000Z"),
          stageName: "Proposal",
          closedReason: null,
        },
      ],
      calls: [
        {
          dealId: "deal-2",
          createdAt: new Date("2026-02-10T00:00:00.000Z"),
          sentimentScore: 0.4,
          riskSignals: [],
        },
      ],
    });

    expect(insights[0]?.riskLevel).toBe("low");
    expect(insights[0]?.healthScore).toBeGreaterThanOrEqual(75);
  });

  it("orders high-risk deals first", () => {
    const insights = buildSalesCoachingInsights({
      deals: [
        {
          id: "deal-a",
          name: "A",
          amount: 10000,
          probability: 80,
          closeDate: null,
          stageName: null,
          closedReason: null,
        },
        {
          id: "deal-b",
          name: "B",
          amount: 10000,
          probability: 20,
          closeDate: null,
          stageName: null,
          closedReason: null,
        },
      ],
      calls: [],
    });

    expect(insights[0]?.dealId).toBe("deal-b");
  });
});
