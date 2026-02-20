import { z } from "zod";

export const attributionModelSchema = z.enum(["first_touch", "last_touch", "multi_touch"]);

export type AttributionTouchpoint = {
  entityKey: string;
  channel: string;
  occurredAt: string;
};

export type AttributionConversion = {
  id: string;
  entityKeys: string[];
  revenue: number;
  convertedAt: string;
};

export type AttributionResult = {
  model: z.infer<typeof attributionModelSchema>;
  totals: {
    conversions: number;
    attributedRevenue: number;
  };
  byChannel: Array<{
    channel: string;
    revenue: number;
    conversions: number;
    sharePct: number;
  }>;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function pickEligibleTouchpoints(
  touchpoints: AttributionTouchpoint[],
  conversion: AttributionConversion
) {
  const keys = new Set(conversion.entityKeys);
  return touchpoints
    .filter(
      (touchpoint) =>
        keys.has(touchpoint.entityKey) && touchpoint.occurredAt <= conversion.convertedAt
    )
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export function computeAttribution(
  model: z.infer<typeof attributionModelSchema>,
  touchpoints: AttributionTouchpoint[],
  conversions: AttributionConversion[]
): AttributionResult {
  const channelRevenue = new Map<string, number>();
  const channelConversions = new Map<string, number>();
  let attributedRevenue = 0;

  for (const conversion of conversions) {
    const eligible = pickEligibleTouchpoints(touchpoints, conversion);

    if (eligible.length === 0) {
      continue;
    }

    attributedRevenue += conversion.revenue;

    if (model === "first_touch") {
      const channel = eligible[0].channel;
      channelRevenue.set(channel, (channelRevenue.get(channel) || 0) + conversion.revenue);
      channelConversions.set(channel, (channelConversions.get(channel) || 0) + 1);
      continue;
    }

    if (model === "last_touch") {
      const channel = eligible[eligible.length - 1].channel;
      channelRevenue.set(channel, (channelRevenue.get(channel) || 0) + conversion.revenue);
      channelConversions.set(channel, (channelConversions.get(channel) || 0) + 1);
      continue;
    }

    const share = conversion.revenue / eligible.length;
    for (const touchpoint of eligible) {
      channelRevenue.set(touchpoint.channel, (channelRevenue.get(touchpoint.channel) || 0) + share);
      channelConversions.set(
        touchpoint.channel,
        (channelConversions.get(touchpoint.channel) || 0) + 1 / eligible.length
      );
    }
  }

  const byChannel = [...channelRevenue.entries()]
    .map(([channel, revenue]) => {
      const conversionsCount = channelConversions.get(channel) || 0;
      return {
        channel,
        revenue: round2(revenue),
        conversions: round2(conversionsCount),
        sharePct: attributedRevenue ? round2((revenue / attributedRevenue) * 100) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    model,
    totals: {
      conversions: conversions.length,
      attributedRevenue: round2(attributedRevenue),
    },
    byChannel,
  };
}

export function normalizeMarketingChannel(raw?: string | null) {
  const value = (raw || "").trim().toLowerCase();

  if (["google_ads", "paid_search", "search", "google"].includes(value)) {
    return "paid_search";
  }

  if (["meta_ads", "facebook", "instagram", "paid_social", "linkedin_ads", "linkedin"].includes(value)) {
    return "paid_social";
  }

  if (["email", "campaign_email", "newsletter"].includes(value)) {
    return "email";
  }

  if (["organic", "organic_search", "seo"].includes(value)) {
    return "organic_search";
  }

  if (["referral", "partner"].includes(value)) {
    return "referral";
  }

  if (["direct", "none"].includes(value)) {
    return "direct";
  }

  if (["social", "x", "twitter"].includes(value)) {
    return "social";
  }

  return "other";
}
