import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import {
  GET as listBlogPostsApi,
  POST as createBlogPostApi,
} from "@/app/api/content/blog/posts/route";
import { PATCH as updateBlogPostApi } from "@/app/api/content/blog/posts/[id]/route";
import { resetBlogStoreForTests } from "@/lib/content-blog-store";

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

describe("content blog posts API", () => {
  it("creates and lists blog posts", async () => {
    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "New article",
          content: "Long form content",
        },
      })
    );

    expect(created.status).toBe(201);

    const listed = await listBlogPostsApi(createMockRequest("/api/content/blog/posts"));
    const body = await getResponseBody(listed);

    expect(listed.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.total).toBe(1);
  });

  it("supports workflow transitions", async () => {
    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "Workflow article",
          content: "Body",
        },
      })
    );
    const createdBody = await getResponseBody(created);
    const id = createdBody.post.id;

    const review = await updateBlogPostApi(
      createMockRequest(`/api/content/blog/posts/${id}`, {
        method: "PATCH",
        body: { action: "submit_review" },
      }),
      createMockParams({ id })
    );
    expect(review.status).toBe(200);

    const publish = await updateBlogPostApi(
      createMockRequest(`/api/content/blog/posts/${id}`, {
        method: "PATCH",
        body: { action: "publish_now" },
      }),
      createMockParams({ id })
    );
    const publishBody = await getResponseBody(publish);

    expect(publish.status).toBe(200);
    expect(publishBody.post.status).toBe("published");
  });

  it("returns 409 when scheduling without date", async () => {
    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "Needs schedule date",
          content: "Body",
        },
      })
    );
    const createdBody = await getResponseBody(created);
    const id = createdBody.post.id;

    const response = await updateBlogPostApi(
      createMockRequest(`/api/content/blog/posts/${id}`, {
        method: "PATCH",
        body: { action: "schedule" },
      }),
      createMockParams({ id })
    );

    expect(response.status).toBe(409);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listBlogPostsApi(createMockRequest("/api/content/blog/posts"));
    expect(response.status).toBe(401);
  });
});
