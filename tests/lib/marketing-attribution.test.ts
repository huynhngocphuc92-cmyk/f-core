import { describe, expect, it } from "vitest";
import {
  computeAttribution,
  normalizeMarketingChannel,
  type AttributionConversion,
  type AttributionTouchpoint,
} from "@/lib/marketing-attribution";

const conversion: AttributionConversion = {
  id: "deal-1",
  entityKeys: ["deal:deal-1", "contact:contact-1"],
  revenue: 120,
  convertedAt: "2026-02-14T10:00:00.000Z",
};

const touchpoints: AttributionTouchpoint[] = [
  {
    entityKey: "contact:contact-1",
    channel: "paid_search",
    occurredAt: "2026-02-14T08:00:00.000Z",
  },
  {
    entityKey: "deal:deal-1",
    channel: "email",
    occurredAt: "2026-02-14T09:30:00.000Z",
  },
];

describe("marketing attribution", () => {
  it("computes first-touch attribution", () => {
    const report = computeAttribution("first_touch", touchpoints, [conversion]);

    expect(report.totals.attributedRevenue).toBe(120);
    expect(report.byChannel).toEqual([
      {
        channel: "paid_search",
        revenue: 120,
        conversions: 1,
        sharePct: 100,
      },
    ]);
  });

  it("computes last-touch attribution", () => {
    const report = computeAttribution("last_touch", touchpoints, [conversion]);

    expect(report.totals.attributedRevenue).toBe(120);
    expect(report.byChannel).toEqual([
      {
        channel: "email",
        revenue: 120,
        conversions: 1,
        sharePct: 100,
      },
    ]);
  });

  it("computes multi-touch attribution", () => {
    const report = computeAttribution("multi_touch", touchpoints, [conversion]);

    expect(report.totals.attributedRevenue).toBe(120);
    expect(report.byChannel).toEqual([
      {
        channel: "paid_search",
        revenue: 60,
        conversions: 0.5,
        sharePct: 50,
      },
      {
        channel: "email",
        revenue: 60,
        conversions: 0.5,
        sharePct: 50,
      },
    ]);
  });

  it("ignores touchpoints after conversion time", () => {
    const report = computeAttribution(
      "first_touch",
      [
        {
          entityKey: "contact:contact-1",
          channel: "paid_search",
          occurredAt: "2026-02-14T11:00:00.000Z",
        },
      ],
      [conversion]
    );

    expect(report.totals.conversions).toBe(1);
    expect(report.totals.attributedRevenue).toBe(0);
    expect(report.byChannel).toEqual([]);
  });

  it("normalizes marketing channel aliases", () => {
    expect(normalizeMarketingChannel("google_ads")).toBe("paid_search");
    expect(normalizeMarketingChannel("facebook")).toBe("paid_social");
    expect(normalizeMarketingChannel("newsletter")).toBe("email");
    expect(normalizeMarketingChannel("seo")).toBe("organic_search");
    expect(normalizeMarketingChannel("partner")).toBe("referral");
    expect(normalizeMarketingChannel("none")).toBe("direct");
    expect(normalizeMarketingChannel("twitter")).toBe("social");
    expect(normalizeMarketingChannel("unknown_channel")).toBe("other");
  });
});
