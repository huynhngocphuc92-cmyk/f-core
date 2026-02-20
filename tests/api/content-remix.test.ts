import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { POST as createBlogPostApi } from "@/app/api/content/blog/posts/route";
import { PATCH as updateBlogPostApi } from "@/app/api/content/blog/posts/[id]/route";
import { GET as listRemixApi, POST as createRemixApi } from "@/app/api/content/remix/route";
import {
  createApprovalRequest,
  decideApprovalRequest,
  resetContentApprovalStoreForTests,
} from "@/lib/content-approval-store";
import { resetBlogStoreForTests } from "@/lib/content-blog-store";
import { resetContentRemixStoreForTests } from "@/lib/content-remix-store";

const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetBlogStoreForTests();
  await resetContentApprovalStoreForTests();
  await resetContentRemixStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-author-id",
    email: "author@example.com",
    name: "Author",
  } as any);
});

describe("content remix API", () => {
  it("generates remix variant from approved blog source", async () => {
    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "Approved Source",
          excerpt: "Source summary",
          content: "Source body content for remix generation.",
        },
      })
    );
    const createdBody = await getResponseBody(created);
    const id = createdBody.post.id;

    const submit = await updateBlogPostApi(
      createMockRequest(`/api/content/blog/posts/${id}`, {
        method: "PATCH",
        body: { action: "submit_review" },
      }),
      createMockParams({ id })
    );
    expect(submit.status).toBe(200);

    const approvalRequest = await createApprovalRequest(TENANT_ID, {
      space: "blog_post",
      assetId: id,
      assetTitle: "Approved Source",
      assetUpdatedAt: new Date("2026-02-14T20:00:00.000Z").toISOString(),
      requestedBy: "user-author-id",
    });

    await decideApprovalRequest(TENANT_ID, approvalRequest.id, "user-reviewer-id", {
      decision: "approved",
    });

    const remix = await createRemixApi(
      createMockRequest("/api/content/remix", {
        method: "POST",
        body: {
          sourceType: "blog_post",
          sourceId: id,
          targetFormat: "social_post",
          tone: "friendly",
          maxLength: 280,
        },
      })
    );
    const remixBody = await getResponseBody(remix);

    expect(remix.status).toBe(201);
    expect(remixBody.variant.sourceId).toBe(id);
    expect(remixBody.variant.content.length).toBeLessThanOrEqual(280);

    const listed = await listRemixApi(
      createMockRequest("/api/content/remix", {
        searchParams: {
          sourceType: "blog_post",
          sourceId: id,
        },
      })
    );
    const listedBody = await getResponseBody(listed);

    expect(listed.status).toBe(200);
    expect(listedBody.data).toHaveLength(1);
  });

  it("returns 409 when source content is not approved", async () => {
    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "Unapproved Source",
          content: "Body",
        },
      })
    );
    const createdBody = await getResponseBody(created);

    const response = await createRemixApi(
      createMockRequest("/api/content/remix", {
        method: "POST",
        body: {
          sourceType: "blog_post",
          sourceId: createdBody.post.id,
          targetFormat: "ad_copy",
          tone: "professional",
        },
      })
    );

    expect(response.status).toBe(409);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listRemixApi(createMockRequest("/api/content/remix"));
    expect(response.status).toBe(401);
  });
});
