import { describe, expect, it } from "vitest";
import { buildMarketingAnalytics } from "@/lib/marketing-analytics";

describe("marketing analytics builder", () => {
  it("builds consolidated marketing metrics", () => {
    const payload = buildMarketingAnalytics({
      adsCampaigns: [
        {
          id: "camp-1",
          tenantId: "tenant-test-id",
          connectorId: "google_ads",
          externalCampaignId: "G-1",
          campaignName: "Demand Gen",
          status: "active",
          spend: 500,
          impressions: 10000,
          clicks: 400,
          leads: 30,
          syncedAt: new Date().toISOString(),
        },
      ],
      socialPosts: [
        {
          id: "post-1",
          tenantId: "tenant-test-id",
          title: "Launch",
          content: "New feature",
          channels: ["linkedin"],
          status: "published",
          scheduledAt: null,
          publishedAt: new Date().toISOString(),
          failedAt: null,
          failureReason: null,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      experiments: [
        {
          id: "exp-1",
          tenantId: "tenant-test-id",
          name: "Hero test",
          type: "landing_page",
          targetId: "lp-1",
          goal: "submission",
          status: "running",
          winnerVariantKey: null,
          variants: [
            {
              key: "A",
              name: "Control",
              trafficPct: 50,
              exposures: 10,
              conversions: 2,
              conversionRatePct: 20,
            },
            {
              key: "B",
              name: "Variant",
              trafficPct: 50,
              exposures: 10,
              conversions: 4,
              conversionRatePct: 40,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          endedAt: null,
        },
      ],
      attribution: {
        model: "multi_touch",
        totals: {
          conversions: 1,
          attributedRevenue: 800,
        },
        byChannel: [
          {
            channel: "paid_search",
            revenue: 500,
            conversions: 0.6,
            sharePct: 62.5,
          },
        ],
      },
      journey: {
        totals: {
          journeys: 1,
          conversions: 1,
          avgTouchpoints: 2,
          avgTimeToConvertHours: 12,
          attributedRevenue: 800,
        },
        topPaths: [{ path: "paid_search -> email", count: 1 }],
        journeys: [],
      },
    });

    expect(payload.summary.adsSpend).toBe(500);
    expect(payload.summary.adsLeads).toBe(30);
    expect(payload.summary.experimentConversionRatePct).toBe(30);
    expect(payload.attribution.channels[0].channel).toBe("paid_search");
    expect(payload.journey.topPaths[0].path).toBe("paid_search -> email");
    expect(payload.experiments.leaderboard[0].variantKey).toBe("B");
  });
});
