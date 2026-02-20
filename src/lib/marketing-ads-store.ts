import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const adsConnectorIdSchema = z.enum(["google_ads", "meta_ads", "linkedin_ads"]);
export const adsConnectorStatusSchema = z.enum(["connected", "error", "disconnected"]);

export const adsConnectorAuthSchema = z
  .object({
    apiKey: z.string().max(500).optional().nullable(),
    accessToken: z.string().max(500).optional().nullable(),
    refreshToken: z.string().max(500).optional().nullable(),
    clientId: z.string().max(300).optional().nullable(),
    clientSecret: z.string().max(500).optional().nullable(),
  })
  .default({});

export const updateAdsConnectorSchema = z.object({
  connectorId: adsConnectorIdSchema,
  connected: z.boolean(),
  accountId: z.string().max(120).optional().nullable(),
  dailyBudget: z.number().min(0).optional(),
  syncWindowDays: z.number().int().min(1).max(90).optional(),
  note: z.string().max(500).optional(),
  authConfig: adsConnectorAuthSchema.optional(),
});

export const syncAdsCampaignsSchema = z.object({
  connectorId: adsConnectorIdSchema.optional(),
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  maxRetries: z.number().int().min(0).max(3).default(1),
});

export type AdsConnectorAuthConfig = z.infer<typeof adsConnectorAuthSchema>;

export type AdsConnector = {
  connectorId: z.infer<typeof adsConnectorIdSchema>;
  name: string;
  connected: boolean;
  accountId: string | null;
  status: z.infer<typeof adsConnectorStatusSchema>;
  dailyBudget: number;
  syncWindowDays: number;
  note: string | null;
  authConfigured: boolean;
  lastSyncedAt: string | null;
  lastSyncStatus: "succeeded" | "failed" | null;
  lastSyncError: string | null;
  lastSyncDurationMs: number | null;
  consecutiveSyncFailures: number;
  updatedAt: string;
};

export type AdsCampaignSnapshot = {
  id: string;
  tenantId: string;
  connectorId: z.infer<typeof adsConnectorIdSchema>;
  externalCampaignId: string;
  campaignName: string;
  status: "active" | "paused";
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  syncedAt: string;
};

type AdsState = {
  connectors: Record<z.infer<typeof adsConnectorIdSchema>, AdsConnector>;
  campaigns: AdsCampaignSnapshot[];
};

export type AdsSyncConnectorResult = {
  connectorId: z.infer<typeof adsConnectorIdSchema>;
  status: "succeeded" | "failed";
  imported: number;
  retriesUsed: number;
  durationMs: number;
  error: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : Number(value);
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function normalizeAuthConfig(input: unknown): AdsConnectorAuthConfig {
  const parsed = adsConnectorAuthSchema.safeParse(input && typeof input === "object" ? input : {});
  return parsed.success ? parsed.data : {};
}

function hasAuthConfig(auth: AdsConnectorAuthConfig) {
  const hasApi = Boolean(auth.apiKey || auth.accessToken);
  const hasClient = Boolean(auth.clientId && auth.clientSecret);
  return hasApi || hasClient;
}

function createDefaultConnector(
  connectorId: z.infer<typeof adsConnectorIdSchema>,
  name: string
): AdsConnector {
  return {
    connectorId,
    name,
    connected: false,
    accountId: null,
    status: "disconnected",
    dailyBudget: 0,
    syncWindowDays: 30,
    note: null,
    authConfigured: false,
    lastSyncedAt: null,
    lastSyncStatus: null,
    lastSyncError: null,
    lastSyncDurationMs: null,
    consecutiveSyncFailures: 0,
    updatedAt: nowIso(),
  };
}

function defaultState(): AdsState {
  return {
    connectors: {
      google_ads: createDefaultConnector("google_ads", "Google Ads"),
      meta_ads: createDefaultConnector("meta_ads", "Meta Ads"),
      linkedin_ads: createDefaultConnector("linkedin_ads", "LinkedIn Ads"),
    },
    campaigns: [],
  };
}

function normalizeConnector(record: {
  connectorId: string;
  name: string;
  connected: boolean;
  accountId: string | null;
  status: string;
  dailyBudget: Prisma.Decimal | number;
  syncWindowDays: number;
  note: string | null;
  authConfig: unknown;
  lastSyncedAt: Date | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  lastSyncDurationMs: number | null;
  consecutiveSyncFailures: number;
  updatedAt: Date;
}): AdsConnector {
  const authConfig = normalizeAuthConfig(record.authConfig);

  return {
    connectorId: adsConnectorIdSchema.parse(record.connectorId),
    name: record.name,
    connected: record.connected,
    accountId: record.accountId,
    status: adsConnectorStatusSchema.parse(record.status),
    dailyBudget: toNumber(record.dailyBudget),
    syncWindowDays: record.syncWindowDays,
    note: record.note,
    authConfigured: hasAuthConfig(authConfig),
    lastSyncedAt: toIso(record.lastSyncedAt),
    lastSyncStatus: record.lastSyncStatus === "succeeded" ? "succeeded" : record.lastSyncStatus === "failed" ? "failed" : null,
    lastSyncError: record.lastSyncError,
    lastSyncDurationMs: record.lastSyncDurationMs,
    consecutiveSyncFailures: record.consecutiveSyncFailures,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeCampaign(record: {
  id: string;
  tenantId: string;
  connectorId: string;
  externalCampaignId: string;
  campaignName: string;
  status: string;
  spend: Prisma.Decimal | number;
  impressions: number;
  clicks: number;
  leads: number;
  syncedAt: Date;
}): AdsCampaignSnapshot {
  return {
    id: record.id,
    tenantId: record.tenantId,
    connectorId: adsConnectorIdSchema.parse(record.connectorId),
    externalCampaignId: record.externalCampaignId,
    campaignName: record.campaignName,
    status: record.status === "paused" ? "paused" : "active",
    spend: toNumber(record.spend),
    impressions: record.impressions,
    clicks: record.clicks,
    leads: record.leads,
    syncedAt: record.syncedAt.toISOString(),
  };
}

async function ensureDefaultConnectors(tenantId: string) {
  const existing = await prisma.marketingAdsConnector.findMany({
    where: { tenantId },
  });

  const existingIds = new Set(existing.map((item) => adsConnectorIdSchema.parse(item.connectorId)));

  const defaults: Array<{ connectorId: z.infer<typeof adsConnectorIdSchema>; name: string }> = [
    { connectorId: "google_ads", name: "Google Ads" },
    { connectorId: "meta_ads", name: "Meta Ads" },
    { connectorId: "linkedin_ads", name: "LinkedIn Ads" },
  ];

  const missing = defaults.filter((item) => !existingIds.has(item.connectorId));
  if (missing.length > 0) {
    await prisma.marketingAdsConnector.createMany({
      data: missing.map((item) => ({
        tenantId,
        connectorId: item.connectorId,
        name: item.name,
        connected: false,
        accountId: null,
        status: "disconnected",
        dailyBudget: new Prisma.Decimal(0),
        syncWindowDays: 30,
        note: null,
        authConfig: {},
      })),
    });
  }
}

export async function getAdsState(tenantId: string): Promise<AdsState> {
  await ensureDefaultConnectors(tenantId);

  const [connectorRows, campaignRows] = await Promise.all([
    prisma.marketingAdsConnector.findMany({
      where: { tenantId },
    }),
    prisma.marketingAdsCampaign.findMany({
      where: { tenantId },
      orderBy: { syncedAt: "desc" },
    }),
  ]);

  const state = defaultState();
  for (const row of connectorRows) {
    const connector = normalizeConnector(row);
    state.connectors[connector.connectorId] = connector;
  }

  state.campaigns = campaignRows.map(normalizeCampaign);
  return state;
}

export async function updateAdsConnector(
  tenantId: string,
  payload: z.infer<typeof updateAdsConnectorSchema>
): Promise<AdsConnector> {
  await ensureDefaultConnectors(tenantId);

  const connector = await prisma.marketingAdsConnector.findFirst({
    where: {
      tenantId,
      connectorId: payload.connectorId,
    },
  });

  if (!connector) {
    throw new Error("Ads connector not found");
  }

  const nextAuthConfig = normalizeAuthConfig(payload.authConfig ?? connector.authConfig);
  const nextAccountId = payload.accountId ?? connector.accountId;

  if (payload.connected) {
    if (!nextAccountId || nextAccountId.trim().length === 0) {
      throw new Error("accountId is required when connecting an ads connector");
    }

    if (!hasAuthConfig(nextAuthConfig)) {
      throw new Error("authConfig is required when connecting an ads connector");
    }
  }

  const updated = await prisma.marketingAdsConnector.update({
    where: { id: connector.id },
    data: {
      connected: payload.connected,
      accountId: payload.accountId !== undefined ? payload.accountId || null : undefined,
      dailyBudget: payload.dailyBudget ?? undefined,
      syncWindowDays: payload.syncWindowDays ?? undefined,
      note: payload.note ?? undefined,
      authConfig: payload.authConfig ? nextAuthConfig : undefined,
      status: payload.connected ? "connected" : "disconnected",
      lastSyncStatus: payload.connected ? connector.lastSyncStatus : null,
      lastSyncError: payload.connected ? connector.lastSyncError : null,
      consecutiveSyncFailures: payload.connected ? connector.consecutiveSyncFailures : 0,
    },
  });

  return normalizeConnector(updated);
}

function buildMockCampaigns(
  tenantId: string,
  connectorId: z.infer<typeof adsConnectorIdSchema>,
  syncedAt: Date
) {
  const connectorKey = connectorId.replace("_ads", "").toUpperCase();

  return [
    {
      tenantId,
      connectorId,
      externalCampaignId: `${connectorKey}-001`,
      campaignName: `${connectorKey} Demand Gen`,
      status: "active",
      spend: new Prisma.Decimal(
        connectorId === "google_ads" ? 1200 : connectorId === "meta_ads" ? 900 : 650
      ),
      impressions: connectorId === "google_ads" ? 18000 : connectorId === "meta_ads" ? 25000 : 9000,
      clicks: connectorId === "google_ads" ? 740 : connectorId === "meta_ads" ? 980 : 320,
      leads: connectorId === "google_ads" ? 62 : connectorId === "meta_ads" ? 71 : 28,
      syncedAt,
    },
    {
      tenantId,
      connectorId,
      externalCampaignId: `${connectorKey}-002`,
      campaignName: `${connectorKey} Retargeting`,
      status: "paused",
      spend: new Prisma.Decimal(
        connectorId === "google_ads" ? 420 : connectorId === "meta_ads" ? 530 : 210
      ),
      impressions: connectorId === "google_ads" ? 7000 : connectorId === "meta_ads" ? 12000 : 3500,
      clicks: connectorId === "google_ads" ? 210 : connectorId === "meta_ads" ? 350 : 120,
      leads: connectorId === "google_ads" ? 18 : connectorId === "meta_ads" ? 26 : 10,
      syncedAt,
    },
  ];
}

const remoteCampaignSchema = z.object({
  externalCampaignId: z.string().min(1).max(180),
  campaignName: z.string().min(1).max(220),
  status: z.enum(["active", "paused"]),
  spend: z.number().min(0),
  impressions: z.number().int().min(0),
  clicks: z.number().int().min(0),
  leads: z.number().int().min(0),
});

const remoteCampaignsResponseSchema = z.object({
  campaigns: z.array(remoteCampaignSchema),
});

async function fetchAdsCampaigns(
  tenantId: string,
  connector: {
    connectorId: z.infer<typeof adsConnectorIdSchema>;
    accountId: string;
    syncWindowDays: number;
    authConfig: AdsConnectorAuthConfig;
  },
  syncedAt: Date
) {
  const endpoint = process.env.ADS_CONNECTOR_HTTP_ENDPOINT;
  if (!endpoint || process.env.NODE_ENV === "test") {
    return buildMockCampaigns(tenantId, connector.connectorId, syncedAt).map((item) => ({
      externalCampaignId: item.externalCampaignId,
      campaignName: item.campaignName,
      status: item.status as "active" | "paused",
      spend: Number(item.spend),
      impressions: item.impressions,
      clicks: item.clicks,
      leads: item.leads,
    }));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (connector.authConfig.accessToken) {
    headers.Authorization = `Bearer ${connector.authConfig.accessToken}`;
  }
  if (connector.authConfig.apiKey) {
    headers["x-api-key"] = connector.authConfig.apiKey;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      connectorId: connector.connectorId,
      accountId: connector.accountId,
      syncWindowDays: connector.syncWindowDays,
      authConfig: connector.authConfig,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Connector sync failed (${response.status}): ${text || "no response body"}`);
  }

  const body = await response.json();
  const parsed = remoteCampaignsResponseSchema.parse(body);
  return parsed.campaigns;
}

export async function syncAdsCampaigns(
  tenantId: string,
  payload: z.infer<typeof syncAdsCampaignsSchema>
): Promise<{ syncedConnectors: string[]; imported: number; results: AdsSyncConnectorResult[] }> {
  const input = syncAdsCampaignsSchema.parse(payload);
  await ensureDefaultConnectors(tenantId);
  const syncedAt = new Date();

  const targetIds = input.connectorId
    ? [input.connectorId]
    : (["google_ads", "meta_ads", "linkedin_ads"] as const);

  const connectorRows = await prisma.marketingAdsConnector.findMany({
    where: {
      tenantId,
      connectorId: {
        in: targetIds as unknown as string[],
      },
    },
  });

  const connectors = connectorRows
    .map((item) => ({
      ...item,
      connectorId: adsConnectorIdSchema.parse(item.connectorId),
      authConfig: normalizeAuthConfig(item.authConfig),
    }))
    .filter((item) => item.connected || input.force);

  const syncedConnectors: string[] = [];
  const results: AdsSyncConnectorResult[] = [];
  let imported = 0;

  for (const connector of connectors) {
    const startedAt = Date.now();
    let lastError: string | null = null;
    let success: Array<z.infer<typeof remoteCampaignSchema>> | null = null;
    let retriesUsed = 0;

    for (let attempt = 0; attempt <= input.maxRetries; attempt += 1) {
      retriesUsed = attempt;
      try {
        if (!connector.accountId) {
          throw new Error("connector accountId is missing");
        }
        if (!hasAuthConfig(connector.authConfig)) {
          throw new Error("connector authConfig is missing");
        }

        success = await fetchAdsCampaigns(
          tenantId,
          {
            connectorId: connector.connectorId,
            accountId: connector.accountId,
            syncWindowDays: connector.syncWindowDays,
            authConfig: connector.authConfig,
          },
          syncedAt
        );
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown connector sync error";
      }
    }

    const durationMs = Date.now() - startedAt;

    if (!success) {
      if (!input.dryRun) {
        await prisma.marketingAdsConnector.update({
          where: { id: connector.id },
          data: {
            status: "error",
            lastSyncStatus: "failed",
            lastSyncError: lastError,
            lastSyncDurationMs: durationMs,
            consecutiveSyncFailures: {
              increment: 1,
            },
          },
        });
      }

      results.push({
        connectorId: connector.connectorId,
        status: "failed",
        imported: 0,
        retriesUsed,
        durationMs,
        error: lastError,
      });
      continue;
    }

    if (!input.dryRun) {
      const externalIds = success.map((item) => item.externalCampaignId);

      for (const campaign of success) {
        await prisma.marketingAdsCampaign.upsert({
          where: {
            tenantId_connectorId_externalCampaignId: {
              tenantId,
              connectorId: connector.connectorId,
              externalCampaignId: campaign.externalCampaignId,
            },
          },
          create: {
            tenantId,
            connectorId: connector.connectorId,
            externalCampaignId: campaign.externalCampaignId,
            campaignName: campaign.campaignName,
            status: campaign.status,
            spend: campaign.spend,
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            leads: campaign.leads,
            syncedAt,
          },
          update: {
            campaignName: campaign.campaignName,
            status: campaign.status,
            spend: campaign.spend,
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            leads: campaign.leads,
            syncedAt,
          },
        });
      }

      await prisma.marketingAdsCampaign.deleteMany({
        where: {
          tenantId,
          connectorId: connector.connectorId,
          externalCampaignId: {
            notIn: externalIds,
          },
        },
      });

      await prisma.marketingAdsConnector.update({
        where: { id: connector.id },
        data: {
          status: "connected",
          lastSyncedAt: syncedAt,
          lastSyncStatus: "succeeded",
          lastSyncError: null,
          lastSyncDurationMs: durationMs,
          consecutiveSyncFailures: 0,
        },
      });
    }

    syncedConnectors.push(connector.connectorId);
    imported += success.length;
    results.push({
      connectorId: connector.connectorId,
      status: "succeeded",
      imported: success.length,
      retriesUsed,
      durationMs,
      error: null,
    });
  }

  return { syncedConnectors, imported, results };
}

export function summarizeAdsCampaigns(campaigns: AdsCampaignSnapshot[]) {
  const summary = {
    totalCampaigns: campaigns.length,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
    ctrPct: 0,
    cpl: 0,
  };

  for (const campaign of campaigns) {
    if (campaign.status === "active") summary.activeCampaigns += 1;
    if (campaign.status === "paused") summary.pausedCampaigns += 1;

    summary.totalSpend += campaign.spend;
    summary.totalImpressions += campaign.impressions;
    summary.totalClicks += campaign.clicks;
    summary.totalLeads += campaign.leads;
  }

  summary.ctrPct = summary.totalImpressions
    ? Math.round((summary.totalClicks / summary.totalImpressions) * 10000) / 100
    : 0;

  summary.cpl = summary.totalLeads
    ? Math.round((summary.totalSpend / summary.totalLeads) * 100) / 100
    : 0;

  return summary;
}

export async function resetMarketingAdsStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.marketingAdsCampaign.deleteMany();
  await prisma.marketingAdsConnector.deleteMany();
}
