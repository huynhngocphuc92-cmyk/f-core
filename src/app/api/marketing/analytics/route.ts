import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { getAdsState } from "@/lib/marketing-ads-store";
import { listSocialPosts } from "@/lib/social-publishing-store";
import { listExperiments } from "@/lib/marketing-experiments-store";
import {
  computeAttribution,
  normalizeMarketingChannel,
  type AttributionConversion,
  type AttributionTouchpoint,
} from "@/lib/marketing-attribution";
import { buildJourneyReport } from "@/lib/marketing-journey";
import { buildMarketingAnalytics } from "@/lib/marketing-analytics";

function parseDays(raw: string | null) {
  const parsed = Number(raw || 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(180, Math.max(7, parsed));
}

// GET /api/marketing/analytics?days=30&channel=paid_search&experimentType=landing_page|email_campaign
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const days = parseDays(request.nextUrl.searchParams.get("days"));
    const channel = request.nextUrl.searchParams.get("channel");
    const experimentTypeRaw = request.nextUrl.searchParams.get("experimentType");
    const experimentType =
      experimentTypeRaw === "landing_page" || experimentTypeRaw === "email_campaign"
        ? experimentTypeRaw
        : null;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [deals, activities] = await Promise.all([
      prisma.deal.findMany({
        where: {
          tenantId,
          deletedAt: null,
          AND: [
            { OR: [{ closedReason: "won" }, { stage: { isWon: true } }] },
            { OR: [{ closedAt: { gte: since } }, { updatedAt: { gte: since } }] },
          ],
        },
        select: {
          id: true,
          amount: true,
          closedAt: true,
          updatedAt: true,
          contacts: {
            select: {
              contactId: true,
            },
          },
          companies: {
            select: {
              companyId: true,
            },
          },
        },
      }),
      prisma.activity.findMany({
        where: {
          tenantId,
          createdAt: { gte: since },
        },
        select: {
          contactId: true,
          companyId: true,
          dealId: true,
          type: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    const conversions: AttributionConversion[] = deals
      .map((deal) => {
        const amount = Number(deal.amount || 0);
        if (amount <= 0) return null;

        return {
          id: deal.id,
          entityKeys: [
            `deal:${deal.id}`,
            ...deal.contacts.map((relation) => `contact:${relation.contactId}`),
            ...deal.companies.map((relation) => `company:${relation.companyId}`),
          ],
          revenue: amount,
          convertedAt: (deal.closedAt || deal.updatedAt).toISOString(),
        };
      })
      .filter((item): item is AttributionConversion => Boolean(item));

    const touchpoints: AttributionTouchpoint[] = activities
      .map((activity) => {
        const entityKey = activity.dealId
          ? `deal:${activity.dealId}`
          : activity.contactId
            ? `contact:${activity.contactId}`
            : activity.companyId
              ? `company:${activity.companyId}`
              : null;

        if (!entityKey) return null;

        const metadata =
          activity.metadata && typeof activity.metadata === "object"
            ? (activity.metadata as Record<string, unknown>)
            : {};

        const rawChannel =
          (typeof metadata.channel === "string" && metadata.channel) ||
          (typeof metadata.source === "string" && metadata.source) ||
          activity.type;

        return {
          entityKey,
          channel: normalizeMarketingChannel(rawChannel),
          occurredAt: activity.createdAt.toISOString(),
        };
      })
      .filter((item): item is AttributionTouchpoint => Boolean(item));

    const [adsState, allSocialPosts, allExperiments] = await Promise.all([
      getAdsState(tenantId),
      listSocialPosts(tenantId),
      listExperiments(tenantId),
    ]);

    const adsCampaigns = adsState.campaigns.filter(
      (item) => new Date(item.syncedAt).getTime() >= since.getTime()
    );
    const socialPosts = allSocialPosts.filter(
      (item) => new Date(item.createdAt).getTime() >= since.getTime()
    );
    const experiments = allExperiments.filter(
      (item) => new Date(item.createdAt).getTime() >= since.getTime()
    );

    const attribution = computeAttribution("multi_touch", touchpoints, conversions);
    const journey = buildJourneyReport(touchpoints, conversions, 20);
    const analytics = buildMarketingAnalytics({
      adsCampaigns,
      socialPosts,
      experiments,
      attribution,
      journey,
      channelFilter: channel,
      experimentTypeFilter: experimentType,
    });

    return NextResponse.json({
      windowDays: days,
      generatedAt: new Date().toISOString(),
      filters: {
        channel: channel || null,
        experimentType,
      },
      ...analytics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
