import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { POST as createBlogPostApi } from "@/app/api/content/blog/posts/route";
import { GET as getPerformanceApi } from "@/app/api/content/performance/route";
import { POST as trackEventApi } from "@/app/api/content/performance/events/route";
import { resetBlogStoreForTests } from "@/lib/content-blog-store";
import { resetContentPerformanceStoreForTests } from "@/lib/content-performance";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetBlogStoreForTests();
  await resetContentPerformanceStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
  mockPrisma.landingPage.findMany.mockResolvedValue([] as any);
  mockPrisma.landingPage.findFirst.mockResolvedValue(null as any);
});

describe("content performance API", () => {
  it("tracks event and returns aggregated report", async () => {
    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "Trackable Post",
          content: "Post body",
        },
      })
    );
    const createdBody = await getResponseBody(created);

    const tracked = await trackEventApi(
      createMockRequest("/api/content/performance/events", {
        method: "POST",
        body: {
          sourceType: "blog_post",
          sourceId: createdBody.post.id,
          channel: "email",
          eventType: "view",
        },
      })
    );

    expect(tracked.status).toBe(201);

    const reportResponse = await getPerformanceApi(
      createMockRequest("/api/content/performance", {
        searchParams: {
          days: "30",
          sourceType: "blog_post",
        },
      })
    );
    const reportBody = await getResponseBody(reportResponse);

    expect(reportResponse.status).toBe(200);
    expect(reportBody.summary.views).toBe(1);
    expect(reportBody.byAsset.length).toBeGreaterThan(0);
    expect(reportBody.byChannel[0].channel).toBe("email");
  });

  it("returns 404 when tracking unknown blog source", async () => {
    const response = await trackEventApi(
      createMockRequest("/api/content/performance/events", {
        method: "POST",
        body: {
          sourceType: "blog_post",
          sourceId: "missing-post",
          channel: "email",
          eventType: "view",
        },
      })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getPerformanceApi(createMockRequest("/api/content/performance"));
    expect(response.status).toBe(401);
  });
});
