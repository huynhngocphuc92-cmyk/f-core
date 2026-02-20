import { z } from "zod";
import prisma from "@/lib/prisma";

export const contentPerformanceSourceTypeSchema = z.enum(["blog_post", "landing_page"]);
export const contentPerformanceEventTypeSchema = z.enum(["view", "lead", "conversion"]);

export const createContentPerformanceEventSchema = z.object({
  sourceType: contentPerformanceSourceTypeSchema,
  sourceId: z.string().min(1),
  channel: z.string().min(1).max(60),
  eventType: contentPerformanceEventTypeSchema,
  occurredAt: z.string().datetime().optional(),
});

export type ContentPerformanceEvent = {
  id: string;
  tenantId: string;
  sourceType: z.infer<typeof contentPerformanceSourceTypeSchema>;
  sourceId: string;
  channel: string;
  eventType: z.infer<typeof contentPerformanceEventTypeSchema>;
  occurredAt: string;
  createdAt: string;
};

export type ContentAssetSummary = {
  sourceType: z.infer<typeof contentPerformanceSourceTypeSchema>;
  sourceId: string;
  title: string;
  status: string;
  updatedAt: string;
};

function normalizeChannel(channel: string) {
  return channel
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeContentPerformanceEvent(row: {
  id: string;
  tenantId: string;
  sourceType: string;
  sourceId: string;
  channel: string;
  eventType: string;
  occurredAt: Date;
  createdAt: Date;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    sourceType: contentPerformanceSourceTypeSchema.parse(row.sourceType),
    sourceId: row.sourceId,
    channel: row.channel,
    eventType: contentPerformanceEventTypeSchema.parse(row.eventType),
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  } satisfies ContentPerformanceEvent;
}

export async function createContentPerformanceEvent(
  tenantId: string,
  payload: z.infer<typeof createContentPerformanceEventSchema>
) {
  const row = await prisma.contentPerformanceEvent.create({
    data: {
      tenantId,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      channel: normalizeChannel(payload.channel),
      eventType: payload.eventType,
      occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
    },
    select: {
      id: true,
      tenantId: true,
      sourceType: true,
      sourceId: true,
      channel: true,
      eventType: true,
      occurredAt: true,
      createdAt: true,
    },
  });

  return normalizeContentPerformanceEvent(row);
}

export async function listContentPerformanceEvents(
  tenantId: string,
  filters?: {
    sourceType?: z.infer<typeof contentPerformanceSourceTypeSchema>;
    sourceId?: string;
    channel?: string;
    since?: string;
  }
) {
  const normalizedChannel = filters?.channel ? normalizeChannel(filters.channel) : null;
  const sinceDate = filters?.since ? new Date(filters.since) : null;
  const validSince = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

  const rows = await prisma.contentPerformanceEvent.findMany({
    where: {
      tenantId,
      sourceType: filters?.sourceType,
      sourceId: filters?.sourceId,
      channel: normalizedChannel || undefined,
      occurredAt: validSince
        ? {
            gte: validSince,
          }
        : undefined,
    },
    orderBy: {
      occurredAt: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      sourceType: true,
      sourceId: true,
      channel: true,
      eventType: true,
      occurredAt: true,
      createdAt: true,
    },
  });

  return rows.map((row) => normalizeContentPerformanceEvent(row));
}

export function buildContentPerformanceReport(input: {
  assets: ContentAssetSummary[];
  events: ContentPerformanceEvent[];
}) {
  const byAssetMap = new Map<string, {
    sourceType: ContentAssetSummary["sourceType"];
    sourceId: string;
    title: string;
    status: string;
    views: number;
    leads: number;
    conversions: number;
    conversionRatePct: number;
    leadRatePct: number;
    lastEventAt: string | null;
    channels: Record<string, { views: number; leads: number; conversions: number }>;
  }>();

  for (const asset of input.assets) {
    const key = `${asset.sourceType}:${asset.sourceId}`;
    byAssetMap.set(key, {
      sourceType: asset.sourceType,
      sourceId: asset.sourceId,
      title: asset.title,
      status: asset.status,
      views: 0,
      leads: 0,
      conversions: 0,
      conversionRatePct: 0,
      leadRatePct: 0,
      lastEventAt: null,
      channels: {},
    });
  }

  const byChannelMap = new Map<string, { views: number; leads: number; conversions: number }>();

  for (const event of input.events) {
    const assetKey = `${event.sourceType}:${event.sourceId}`;
    const bucket = byAssetMap.get(assetKey);
    if (!bucket) {
      continue;
    }

    if (!bucket.channels[event.channel]) {
      bucket.channels[event.channel] = { views: 0, leads: 0, conversions: 0 };
    }
    if (!byChannelMap.has(event.channel)) {
      byChannelMap.set(event.channel, { views: 0, leads: 0, conversions: 0 });
    }

    if (event.eventType === "view") {
      bucket.views += 1;
      bucket.channels[event.channel].views += 1;
      byChannelMap.get(event.channel)!.views += 1;
    } else if (event.eventType === "lead") {
      bucket.leads += 1;
      bucket.channels[event.channel].leads += 1;
      byChannelMap.get(event.channel)!.leads += 1;
    } else {
      bucket.conversions += 1;
      bucket.channels[event.channel].conversions += 1;
      byChannelMap.get(event.channel)!.conversions += 1;
    }

    if (!bucket.lastEventAt || bucket.lastEventAt < event.occurredAt) {
      bucket.lastEventAt = event.occurredAt;
    }
  }

  const byAsset = Array.from(byAssetMap.values())
    .map((bucket) => {
      bucket.leadRatePct = bucket.views ? round2((bucket.leads / bucket.views) * 100) : 0;
      bucket.conversionRatePct = bucket.views ? round2((bucket.conversions / bucket.views) * 100) : 0;

      return {
        ...bucket,
        channels: Object.entries(bucket.channels)
          .map(([channel, stats]) => ({ channel, ...stats }))
          .sort((a, b) => b.views - a.views || b.leads - a.leads),
      };
    })
    .sort((a, b) => b.views - a.views || b.leads - a.leads || a.title.localeCompare(b.title));

  const byChannel = Array.from(byChannelMap.entries())
    .map(([channel, stats]) => {
      const leadRatePct = stats.views ? round2((stats.leads / stats.views) * 100) : 0;
      const conversionRatePct = stats.views ? round2((stats.conversions / stats.views) * 100) : 0;
      return {
        channel,
        ...stats,
        leadRatePct,
        conversionRatePct,
      };
    })
    .sort((a, b) => b.views - a.views || b.leads - a.leads);

  const totals = byAsset.reduce(
    (acc, item) => {
      acc.views += item.views;
      acc.leads += item.leads;
      acc.conversions += item.conversions;
      return acc;
    },
    { views: 0, leads: 0, conversions: 0 }
  );

  return {
    summary: {
      assets: input.assets.length,
      activeAssets: byAsset.filter((asset) => asset.views > 0 || asset.leads > 0 || asset.conversions > 0)
        .length,
      views: totals.views,
      leads: totals.leads,
      conversions: totals.conversions,
      leadRatePct: totals.views ? round2((totals.leads / totals.views) * 100) : 0,
      conversionRatePct: totals.views ? round2((totals.conversions / totals.views) * 100) : 0,
    },
    byAsset,
    byChannel,
  };
}

export async function resetContentPerformanceStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  await prisma.contentPerformanceEvent.deleteMany();
}
