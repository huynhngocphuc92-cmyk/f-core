import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  attributionModelSchema,
  computeAttribution,
  normalizeMarketingChannel,
  type AttributionConversion,
  type AttributionTouchpoint,
} from "@/lib/marketing-attribution";

function parseDays(raw: string | null) {
  const parsed = Number(raw || 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(180, Math.max(7, parsed));
}

// GET /api/marketing/attribution?model=first_touch|last_touch|multi_touch&days=30
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const model = attributionModelSchema.parse(
      request.nextUrl.searchParams.get("model") || "first_touch"
    );
    const days = parseDays(request.nextUrl.searchParams.get("days"));

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

        const entityKeys = [
          `deal:${deal.id}`,
          ...deal.contacts.map((relation) => `contact:${relation.contactId}`),
          ...deal.companies.map((relation) => `company:${relation.companyId}`),
        ];

        return {
          id: deal.id,
          entityKeys,
          revenue: amount,
          convertedAt: (deal.closedAt || deal.updatedAt).toISOString(),
        };
      })
      .filter((conversion): conversion is AttributionConversion => Boolean(conversion));

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
      .filter((touchpoint): touchpoint is AttributionTouchpoint => Boolean(touchpoint));

    const report = computeAttribution(model, touchpoints, conversions);

    return NextResponse.json({
      days,
      since: since.toISOString(),
      ...report,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
