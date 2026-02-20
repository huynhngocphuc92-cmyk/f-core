import { beforeEach, describe, expect, it } from "vitest";
import {
  buildContentPerformanceReport,
  createContentPerformanceEvent,
  listContentPerformanceEvents,
  resetContentPerformanceStoreForTests,
} from "@/lib/content-performance";

const TENANT_ID = "tenant-test-id";

describe("content performance", () => {
  beforeEach(async () => {
    await resetContentPerformanceStoreForTests();
  });

  it("records and filters events", async () => {
    await createContentPerformanceEvent(TENANT_ID, {
      sourceType: "blog_post",
      sourceId: "post-1",
      channel: "Email Campaign",
      eventType: "view",
    });

    await createContentPerformanceEvent(TENANT_ID, {
      sourceType: "blog_post",
      sourceId: "post-1",
      channel: "social",
      eventType: "lead",
    });

    const filtered = await listContentPerformanceEvents(TENANT_ID, {
      sourceType: "blog_post",
      channel: "email_campaign",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].channel).toBe("email_campaign");
  });

  it("builds report by asset and channel", async () => {
    await createContentPerformanceEvent(TENANT_ID, {
      sourceType: "blog_post",
      sourceId: "post-1",
      channel: "organic",
      eventType: "view",
    });
    await createContentPerformanceEvent(TENANT_ID, {
      sourceType: "blog_post",
      sourceId: "post-1",
      channel: "organic",
      eventType: "lead",
    });
    await createContentPerformanceEvent(TENANT_ID, {
      sourceType: "blog_post",
      sourceId: "post-1",
      channel: "paid_social",
      eventType: "conversion",
    });

    const report = buildContentPerformanceReport({
      assets: [
        {
          sourceType: "blog_post",
          sourceId: "post-1",
          title: "Asset A",
          status: "published",
          updatedAt: new Date("2026-02-14T10:00:00.000Z").toISOString(),
        },
      ],
      events: await listContentPerformanceEvents(TENANT_ID),
    });

    expect(report.summary.views).toBe(1);
    expect(report.summary.leads).toBe(1);
    expect(report.summary.conversions).toBe(1);
    expect(report.byAsset[0].channels).toHaveLength(2);
    expect(report.byChannel).toHaveLength(2);
  });
});
