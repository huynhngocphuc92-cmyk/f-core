import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getMarketingAnalytics } from "@/app/api/marketing/analytics/route";
import {
  resetMarketingAdsStoreForTests,
  syncAdsCampaigns,
  updateAdsConnector,
} from "@/lib/marketing-ads-store";
import {
  createSocialPost,
  resetSocialPublishingStoreForTests,
} from "@/lib/social-publishing-store";
import {
  createExperiment,
  recordExperimentEvent,
  resetMarketingExperimentsStoreForTests,
  updateExperimentStatus,
} from "@/lib/marketing-experiments-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSocialPublishingStoreForTests();
  await resetMarketingExperimentsStoreForTests();
});

beforeEach(async () => {
  await resetMarketingAdsStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("marketing analytics API", () => {
  it("returns consolidated analytics payload", async () => {
    await updateAdsConnector(TENANT_ID, {
      connectorId: "google_ads",
      connected: true,
      accountId: "ga-1",
      dailyBudget: 300,
      syncWindowDays: 30,
      authConfig: {
        apiKey: "ga-demo-key",
      },
    });
    await syncAdsCampaigns(TENANT_ID, {});

    await createSocialPost(TENANT_ID, {
      title: "Product launch",
      content: "We shipped!",
      channels: ["linkedin"],
    });

    const experiment = await createExperiment(TENANT_ID, {
      name: "Hero test",
      type: "landing_page",
      targetId: "lp-1",
      goal: "submission",
      variants: [
        { key: "A", name: "Control", trafficPct: 50 },
        { key: "B", name: "Variant", trafficPct: 50 },
      ],
    });
    await updateExperimentStatus(TENANT_ID, experiment.id, { action: "start" });
    await recordExperimentEvent(TENANT_ID, experiment.id, { eventType: "exposure", variantKey: "A" });
    await recordExperimentEvent(TENANT_ID, experiment.id, { eventType: "conversion", variantKey: "A" });

    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        amount: 300,
        closedAt: new Date("2026-02-14T10:00:00.000Z"),
        updatedAt: new Date("2026-02-14T10:00:00.000Z"),
        contacts: [{ contactId: "contact-1" }],
        companies: [],
      },
    ] as any);

    mockPrisma.activity.findMany.mockResolvedValue([
      {
        dealId: null,
        contactId: "contact-1",
        companyId: null,
        type: "email",
        metadata: { channel: "google_ads" },
        createdAt: new Date("2026-02-14T08:00:00.000Z"),
      },
      {
        dealId: "deal-1",
        contactId: null,
        companyId: null,
        type: "email",
        metadata: { channel: "email" },
        createdAt: new Date("2026-02-14T09:00:00.000Z"),
      },
    ] as any);

    const response = await getMarketingAnalytics(createMockRequest("/api/marketing/analytics"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.summary.adsSpend).toBeGreaterThan(0);
    expect(body.summary.socialPosts).toBe(1);
    expect(body.summary.experiments).toBe(1);
    expect(body.attribution.channels.length).toBeGreaterThan(0);
    expect(body.journey.topPaths.length).toBeGreaterThan(0);
  });

  it("supports channel filter", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([] as any);
    mockPrisma.activity.findMany.mockResolvedValue([] as any);

    const response = await getMarketingAnalytics(
      createMockRequest("/api/marketing/analytics", {
        searchParams: { channel: "paid_search", days: "5" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.windowDays).toBe(7);
    expect(body.filters.channel).toBe("paid_search");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getMarketingAnalytics(createMockRequest("/api/marketing/analytics"));
    expect(response.status).toBe(401);
  });
});
