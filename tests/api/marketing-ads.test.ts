import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as getAdsConnectors,
  PUT as putAdsConnector,
} from "@/app/api/marketing/ads/connectors/route";
import {
  GET as getAdsCampaigns,
  POST as postAdsCampaignSync,
} from "@/app/api/marketing/ads/campaigns/route";
import { resetMarketingAdsStoreForTests } from "@/lib/marketing-ads-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  await resetMarketingAdsStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("marketing ads API", () => {
  it("returns connector state", async () => {
    const response = await getAdsConnectors(createMockRequest("/api/marketing/ads/connectors"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.connectors.google_ads).toBeTruthy();
  });

  it("updates connector and syncs campaigns", async () => {
    const updateResponse = await putAdsConnector(
      createMockRequest("/api/marketing/ads/connectors", {
        method: "PUT",
        body: {
          connectorId: "google_ads",
          connected: true,
          accountId: "ga-123",
          dailyBudget: 500,
          syncWindowDays: 14,
          authConfig: {
            apiKey: "ga-demo-key",
          },
        },
      })
    );

    expect(updateResponse.status).toBe(200);

    const syncResponse = await postAdsCampaignSync(
      createMockRequest("/api/marketing/ads/campaigns", {
        method: "POST",
        body: {
          connectorId: "google_ads",
        },
      })
    );

    const syncBody = await getResponseBody(syncResponse);
    expect(syncResponse.status).toBe(200);
    expect(syncBody.result.syncedConnectors).toContain("google_ads");

    const listResponse = await getAdsCampaigns(createMockRequest("/api/marketing/ads/campaigns"));
    const listBody = await getResponseBody(listResponse);

    expect(listResponse.status).toBe(200);
    expect(listBody.data.length).toBeGreaterThan(0);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getAdsConnectors(createMockRequest("/api/marketing/ads/connectors"));
    expect(response.status).toBe(401);
  });
});
