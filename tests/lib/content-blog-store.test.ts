import { beforeEach, describe, expect, it } from "vitest";
import {
  createBlogPost,
  resetBlogStoreForTests,
  summarizeBlogPosts,
  updateBlogPost,
} from "@/lib/content-blog-store";

const TENANT_ID = "tenant-test-id";
const AUTHOR_ID = "user-author-id";

describe("content blog store", () => {
  beforeEach(async () => {
    await resetBlogStoreForTests();
  });

  it("creates draft post by default", async () => {
    const post = await createBlogPost(TENANT_ID, AUTHOR_ID, {
      title: "Hello Blog",
      content: "Body",
    });

    expect(post.status).toBe("draft");
    expect(post.slug).toBe("hello-blog");
  });

  it("supports review and publish workflow", async () => {
    const post = await createBlogPost(TENANT_ID, AUTHOR_ID, {
      title: "Workflow Post",
      content: "Body",
    });

    await updateBlogPost(TENANT_ID, post.id, AUTHOR_ID, { action: "submit_review" });
    const approved = await updateBlogPost(TENANT_ID, post.id, "user-reviewer-id", { action: "approve" });
    expect(approved.status).toBe("draft");
    expect(approved.reviewerId).toBe("user-reviewer-id");

    const published = await updateBlogPost(TENANT_ID, post.id, AUTHOR_ID, { action: "publish_now" });
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();
  });

  it("supports scheduling and archive", async () => {
    const post = await createBlogPost(TENANT_ID, AUTHOR_ID, {
      title: "Schedule Post",
      content: "Body",
    });

    const scheduledAt = new Date("2026-02-16T10:00:00.000Z").toISOString();
    const scheduled = await updateBlogPost(TENANT_ID, post.id, AUTHOR_ID, {
      action: "schedule",
      scheduledAt,
    });
    expect(scheduled.status).toBe("scheduled");
    expect(scheduled.scheduledAt).toBe(scheduledAt);

    const archived = await updateBlogPost(TENANT_ID, post.id, AUTHOR_ID, { action: "archive" });
    expect(archived.status).toBe("archived");
  });

  it("summarizes by status", async () => {
    await createBlogPost(TENANT_ID, AUTHOR_ID, { title: "A", content: "1" });
    const scheduled = await createBlogPost(TENANT_ID, AUTHOR_ID, {
      title: "B",
      content: "2",
      scheduledAt: new Date("2026-02-16T10:00:00.000Z").toISOString(),
    });
    const published = await updateBlogPost(TENANT_ID, scheduled.id, AUTHOR_ID, { action: "publish_now" });

    const summary = summarizeBlogPosts([
      await createBlogPost(TENANT_ID, AUTHOR_ID, { title: "C", content: "3" }),
      published,
    ]);

    expect(summary.total).toBe(2);
    expect(summary.published).toBe(1);
  });
});
