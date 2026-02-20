import { beforeEach, describe, expect, it } from "vitest";
import {
  createSocialPost,
  listSocialPosts,
  resetSocialPublishingStoreForTests,
  summarizeSocialPosts,
  updateSocialPost,
} from "@/lib/social-publishing-store";

const TENANT_ID = "tenant-test-id";

describe("social publishing store", () => {
  beforeEach(async () => {
    await resetSocialPublishingStoreForTests();
  });

  it("creates draft post", async () => {
    const post = await createSocialPost(TENANT_ID, {
      title: "Launch update",
      content: "Feature is live",
      channels: ["linkedin"],
    });

    expect(post.status).toBe("draft");
    expect(await listSocialPosts(TENANT_ID)).toHaveLength(1);
  });

  it("creates scheduled post", async () => {
    const post = await createSocialPost(TENANT_ID, {
      title: "Promo",
      content: "Try now",
      channels: ["facebook", "instagram"],
      scheduledAt: new Date("2026-02-16T10:00:00.000Z").toISOString(),
    });

    expect(post.status).toBe("scheduled");
    expect(post.scheduledAt).toBeTruthy();
  });

  it("supports schedule -> publish flow", async () => {
    const post = await createSocialPost(TENANT_ID, {
      title: "Thread",
      content: "Today update",
      channels: ["x"],
    });

    const scheduled = await updateSocialPost(TENANT_ID, post.id, {
      action: "schedule",
      scheduledAt: new Date("2026-02-16T10:00:00.000Z").toISOString(),
    });
    expect(scheduled.status).toBe("scheduled");

    const published = await updateSocialPost(TENANT_ID, post.id, {
      action: "publish_now",
    });
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();
  });

  it("summarizes channel mix", async () => {
    await createSocialPost(TENANT_ID, {
      title: "A",
      content: "A",
      channels: ["linkedin", "x"],
    });
    await createSocialPost(TENANT_ID, {
      title: "B",
      content: "B",
      channels: ["facebook"],
    });

    const summary = summarizeSocialPosts(await listSocialPosts(TENANT_ID));
    expect(summary.total).toBe(2);
    expect(summary.channelMix.linkedin).toBe(1);
    expect(summary.channelMix.x).toBe(1);
    expect(summary.channelMix.facebook).toBe(1);
  });
});
