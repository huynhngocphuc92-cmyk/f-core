import { beforeEach, describe, expect, it } from "vitest";
import {
  createContentRemixVariant,
  listContentRemixVariants,
  resetContentRemixStoreForTests,
} from "@/lib/content-remix-store";

const TENANT_ID = "tenant-test-id";

describe("content remix store", () => {
  beforeEach(async () => {
    await resetContentRemixStoreForTests();
  });

  it("generates variant content by target format", async () => {
    const variant = await createContentRemixVariant(
      TENANT_ID,
      "user-1",
      {
        sourceType: "blog_post",
        sourceId: "post-1",
        targetFormat: "email_newsletter",
        tone: "professional",
      },
      {
        title: "Quarterly Product Update",
        excerpt: "Highlights from this quarter release.",
        body: "We shipped automation improvements and CRM updates for faster workflows.",
      }
    );

    expect(variant.targetFormat).toBe("email_newsletter");
    expect(variant.content).toContain("Subject:");
  });

  it("respects maxLength clamp", async () => {
    const variant = await createContentRemixVariant(
      TENANT_ID,
      "user-1",
      {
        sourceType: "blog_post",
        sourceId: "post-2",
        targetFormat: "linkedin_post",
        tone: "bold",
        maxLength: 140,
      },
      {
        title: "Scale outbound pipeline",
        excerpt: "A guide to improve conversion",
        body: "This is a long source body text repeated many times to ensure maxLength trimming works correctly and remains predictable.",
      }
    );

    expect(variant.content.length).toBeLessThanOrEqual(140);
  });

  it("lists variants with source filters", async () => {
    await createContentRemixVariant(
      TENANT_ID,
      "user-1",
      {
        sourceType: "blog_post",
        sourceId: "post-1",
        targetFormat: "social_post",
        tone: "friendly",
      },
      {
        title: "A",
        body: "Body A",
      }
    );

    await createContentRemixVariant(
      TENANT_ID,
      "user-1",
      {
        sourceType: "landing_page",
        sourceId: "lp-1",
        targetFormat: "ad_copy",
        tone: "concise",
      },
      {
        title: "B",
        body: "Body B",
      }
    );

    const filtered = await listContentRemixVariants(TENANT_ID, {
      sourceType: "blog_post",
      sourceId: "post-1",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].sourceType).toBe("blog_post");
  });
});
