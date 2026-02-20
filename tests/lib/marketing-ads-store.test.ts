import { beforeEach, describe, expect, it } from "vitest";
import {
  getAdsState,
  resetMarketingAdsStoreForTests,
  summarizeAdsCampaigns,
  syncAdsCampaigns,
  updateAdsConnector,
} from "@/lib/marketing-ads-store";

const TENANT_ID = "tenant-test-id";

describe("marketing ads store", () => {
  beforeEach(async () => {
    await resetMarketingAdsStoreForTests();
  });

  it("returns disconnected connectors by default", async () => {
    const state = await getAdsState(TENANT_ID);
    expect(state.connectors.google_ads.connected).toBe(false);
    expect(state.connectors.meta_ads.status).toBe("disconnected");
  });

  it("updates connector config", async () => {
    const connector = await updateAdsConnector(TENANT_ID, {
      connectorId: "google_ads",
      connected: true,
      accountId: "ga-123",
      dailyBudget: 500,
      syncWindowDays: 14,
      authConfig: {
        apiKey: "ga-demo-key",
      },
    });

    expect(connector.connected).toBe(true);
    expect(connector.accountId).toBe("ga-123");
    expect(connector.dailyBudget).toBe(500);
  });

  it("requires auth and account when connecting connector", async () => {
    await expect(
      updateAdsConnector(TENANT_ID, {
        connectorId: "google_ads",
        connected: true,
      })
    ).rejects.toThrow(/accountId is required/i);
  });

  it("syncs campaigns for connected connectors only", async () => {
    await updateAdsConnector(TENANT_ID, {
      connectorId: "google_ads",
      connected: true,
      accountId: "ga-123",
      dailyBudget: 500,
      syncWindowDays: 14,
      authConfig: {
        apiKey: "ga-demo-key",
      },
    });

    const result = await syncAdsCampaigns(TENANT_ID, {});
    const state = await getAdsState(TENANT_ID);

    expect(result.syncedConnectors).toContain("google_ads");
    expect(state.campaigns.length).toBeGreaterThan(0);
  });

  it("summarizes campaign spend metrics", async () => {
    await updateAdsConnector(TENANT_ID, {
      connectorId: "meta_ads",
      connected: true,
      accountId: "meta-123",
      dailyBudget: 300,
      syncWindowDays: 30,
      authConfig: {
        accessToken: "meta-demo-token",
      },
    });
    await syncAdsCampaigns(TENANT_ID, { connectorId: "meta_ads" });

    const state = await getAdsState(TENANT_ID);
    const summary = summarizeAdsCampaigns(state.campaigns);

    expect(summary.totalCampaigns).toBe(2);
    expect(summary.totalSpend).toBeGreaterThan(0);
    expect(summary.totalLeads).toBeGreaterThan(0);
  });
});
