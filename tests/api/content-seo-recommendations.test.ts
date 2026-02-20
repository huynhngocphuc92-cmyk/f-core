import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { GET as getSeoRecommendations } from "@/app/api/content/seo/recommendations/route";
import { POST as createBlogPostApi } from "@/app/api/content/blog/posts/route";
import { resetBlogStoreForTests } from "@/lib/content-blog-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetBlogStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

describe("content seo recommendations API", () => {
  it("returns SEO report for landing page source", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue({
      id: "lp-1",
      name: "Landing SEO Guide for Higher Conversion Growth",
      slug: "landing-seo-guide",
      contentHtml: "<h1>SEO Guide</h1><p>content</p><a href='/blog/seo'>link</a>" + "word ".repeat(300),
      metaTitle: "Landing SEO Guide for Better Conversion Performance",
      metaDescription:
        "Detailed checklist to improve landing page SEO relevance, structure, and metadata for stronger conversion performance over time.",
      description: null,
    } as any);

    const response = await getSeoRecommendations(
      createMockRequest("/api/content/seo/recommendations", {
        searchParams: {
          sourceType: "landing_page",
          sourceId: "lp-1",
          keyword: "seo",
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.source.type).toBe("landing_page");
    expect(body.score).toBeGreaterThan(0);
  });

  it("returns SEO report for blog post source", async () => {
    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "Blog SEO playbook for demand generation and conversion teams",
          content: "<h1>Playbook</h1>" + "seo ".repeat(280),
          excerpt:
            "SEO playbook covering practical on-page improvements, keyword usage, and internal link strategy for growth teams.",
        },
      })
    );
    const createdBody = await getResponseBody(created);

    const response = await getSeoRecommendations(
      createMockRequest("/api/content/seo/recommendations", {
        searchParams: {
          sourceType: "blog_post",
          sourceId: createdBody.post.id,
          keyword: "seo",
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.source.type).toBe("blog_post");
    expect(body.metrics.wordCount).toBeGreaterThan(200);
  });

  it("returns 400 when source params are missing", async () => {
    const response = await getSeoRecommendations(
      createMockRequest("/api/content/seo/recommendations")
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));
    const response = await getSeoRecommendations(
      createMockRequest("/api/content/seo/recommendations", {
        searchParams: {
          sourceType: "blog_post",
          sourceId: "x",
        },
      })
    );
    expect(response.status).toBe(401);
  });
});
