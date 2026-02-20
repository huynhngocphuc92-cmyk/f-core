import type { AdsCampaignSnapshot } from "@/lib/marketing-ads-store";
import type { SocialPost } from "@/lib/social-publishing-store";
import type { MarketingExperiment } from "@/lib/marketing-experiments-store";
import type { AttributionResult } from "@/lib/marketing-attribution";
import type { JourneyReport } from "@/lib/marketing-journey";

type BuildMarketingAnalyticsInput = {
  adsCampaigns: AdsCampaignSnapshot[];
  socialPosts: SocialPost[];
  experiments: MarketingExperiment[];
  attribution: AttributionResult;
  journey: JourneyReport;
  channelFilter?: string | null;
  experimentTypeFilter?: "landing_page" | "email_campaign" | null;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildMarketingAnalytics(input: BuildMarketingAnalyticsInput) {
  const channelFilter = (input.channelFilter || "").trim().toLowerCase();

  const filteredAttribution = channelFilter
    ? input.attribution.byChannel.filter((item) => item.channel === channelFilter)
    : input.attribution.byChannel;

  const filteredExperiments = input.experimentTypeFilter
    ? input.experiments.filter((item) => item.type === input.experimentTypeFilter)
    : input.experiments;

  const experimentLeaderboard = filteredExperiments
    .flatMap((experiment) =>
      experiment.variants.map((variant) => ({
        experimentId: experiment.id,
        experimentName: experiment.name,
        type: experiment.type,
        variantKey: variant.key,
        conversionRatePct: round2(variant.conversionRatePct),
        exposures: variant.exposures,
        conversions: variant.conversions,
      }))
    )
    .sort((a, b) => b.conversionRatePct - a.conversionRatePct || b.conversions - a.conversions)
    .slice(0, 8);

  const socialStatus = {
    draft: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
    canceled: 0,
  };

  for (const post of input.socialPosts) {
    socialStatus[post.status] += 1;
  }

  const totalAdsSpend = round2(input.adsCampaigns.reduce((sum, item) => sum + item.spend, 0));
  const totalAdsLeads = input.adsCampaigns.reduce((sum, item) => sum + item.leads, 0);
  const experimentExposures = filteredExperiments.reduce(
    (sum, exp) => sum + exp.variants.reduce((inner, variant) => inner + variant.exposures, 0),
    0
  );
  const experimentConversions = filteredExperiments.reduce(
    (sum, exp) => sum + exp.variants.reduce((inner, variant) => inner + variant.conversions, 0),
    0
  );

  return {
    summary: {
      adsSpend: totalAdsSpend,
      adsLeads: totalAdsLeads,
      socialPosts: input.socialPosts.length,
      experiments: filteredExperiments.length,
      experimentExposures,
      experimentConversions,
      experimentConversionRatePct: experimentExposures
        ? round2((experimentConversions / experimentExposures) * 100)
        : 0,
      attributedRevenue: input.attribution.totals.attributedRevenue,
      journeys: input.journey.totals.journeys,
      avgTimeToConvertHours: input.journey.totals.avgTimeToConvertHours,
    },
    attribution: {
      model: input.attribution.model,
      channels: filteredAttribution.slice(0, 8),
    },
    journey: {
      topPaths: input.journey.topPaths.slice(0, 5),
      recentJourneys: input.journey.journeys.slice(0, 8),
    },
    social: {
      status: socialStatus,
      recent: input.socialPosts.slice(0, 8),
    },
    experiments: {
      leaderboard: experimentLeaderboard,
      running: filteredExperiments.filter((item) => item.status === "running").length,
      completed: filteredExperiments.filter((item) => item.status === "completed").length,
    },
  };
}
