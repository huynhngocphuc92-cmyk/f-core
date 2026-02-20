import { describe, expect, it } from "vitest";
import { buildSalesForecast } from "@/lib/sales-forecast";

describe("sales forecast engine", () => {
  it("builds monthly and quarterly forecast with confidence bands", () => {
    const now = new Date("2026-02-14T00:00:00.000Z");
    const result = buildSalesForecast({
      now,
      deals: [
        {
          amount: 10000,
          probability: 70,
          closeDate: new Date("2026-03-05T00:00:00.000Z"),
          closedReason: null,
          closedAt: null,
          stageProbability: 60,
        },
        {
          amount: 22000,
          probability: 40,
          closeDate: new Date("2026-04-15T00:00:00.000Z"),
          closedReason: null,
          closedAt: null,
          stageProbability: 45,
        },
        {
          amount: 14000,
          probability: 100,
          closeDate: new Date("2025-12-10T00:00:00.000Z"),
          closedReason: "won",
          closedAt: new Date("2025-12-20T00:00:00.000Z"),
          stageProbability: 100,
        },
      ],
    });

    expect(result.monthly).toHaveLength(6);
    expect(result.quarterly).toHaveLength(4);
    expect(result.summary.openDealAmount).toBe(32000);
    expect(result.summary.weightedPipeline).toBe(15800);
    expect(result.monthly[0].confidenceLow).toBeLessThanOrEqual(result.monthly[0].forecast);
    expect(result.monthly[0].confidenceHigh).toBeGreaterThanOrEqual(result.monthly[0].forecast);
  });
});
