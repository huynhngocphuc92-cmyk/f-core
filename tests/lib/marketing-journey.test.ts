import { describe, expect, it } from "vitest";
import { buildJourneyReport, type JourneyConversion, type JourneyTouchpoint } from "@/lib/marketing-journey";

const conversions: JourneyConversion[] = [
  {
    id: "deal-1",
    entityKeys: ["deal:deal-1", "contact:contact-1"],
    revenue: 200,
    convertedAt: "2026-02-14T10:00:00.000Z",
  },
];

const touchpoints: JourneyTouchpoint[] = [
  {
    entityKey: "contact:contact-1",
    channel: "google_ads",
    occurredAt: "2026-02-14T08:00:00.000Z",
  },
  {
    entityKey: "deal:deal-1",
    channel: "email",
    occurredAt: "2026-02-14T09:00:00.000Z",
  },
];

describe("marketing journey", () => {
  it("builds path and timeline summary", () => {
    const report = buildJourneyReport(touchpoints, conversions, 20);

    expect(report.totals.journeys).toBe(1);
    expect(report.totals.conversions).toBe(1);
    expect(report.totals.avgTouchpoints).toBe(2);
    expect(report.totals.avgTimeToConvertHours).toBe(2);
    expect(report.totals.attributedRevenue).toBe(200);
    expect(report.topPaths[0]).toEqual({
      path: "paid_search -> email",
      count: 1,
    });
    expect(report.journeys[0].steps[1].lagHours).toBe(1);
  });

  it("skips conversions without eligible touchpoints", () => {
    const report = buildJourneyReport(
      [
        {
          entityKey: "contact:contact-1",
          channel: "google_ads",
          occurredAt: "2026-02-14T11:00:00.000Z",
        },
      ],
      conversions,
      20
    );

    expect(report.totals.journeys).toBe(0);
    expect(report.journeys).toEqual([]);
    expect(report.topPaths).toEqual([]);
  });

  it("enforces result limit bounds", () => {
    const manyConversions: JourneyConversion[] = Array.from({ length: 12 }).map((_, index) => ({
      id: `deal-${index + 1}`,
      entityKeys: [`deal:deal-${index + 1}`],
      revenue: 10,
      convertedAt: `2026-02-${String(10 + index).padStart(2, "0")}T10:00:00.000Z`,
    }));

    const manyTouchpoints: JourneyTouchpoint[] = manyConversions.map((item) => ({
      entityKey: `deal:${item.id}`,
      channel: "email",
      occurredAt: item.convertedAt,
    }));

    const report = buildJourneyReport(manyTouchpoints, manyConversions, 2);
    expect(report.journeys).toHaveLength(5);
  });
});
