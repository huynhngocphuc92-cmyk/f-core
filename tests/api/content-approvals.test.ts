import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { GET as listPoliciesApi, PUT as upsertPolicyApi } from "@/app/api/content/approvals/policies/route";
import { GET as listRequestsApi, POST as createRequestApi } from "@/app/api/content/approvals/requests/route";
import { POST as decideRequestApi } from "@/app/api/content/approvals/requests/[id]/decision/route";
import { POST as createBlogPostApi } from "@/app/api/content/blog/posts/route";
import { PATCH as updateBlogPostApi } from "@/app/api/content/blog/posts/[id]/route";
import { resetBlogStoreForTests } from "@/lib/content-blog-store";
import { resetContentApprovalStoreForTests } from "@/lib/content-approval-store";

const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetBlogStoreForTests();
  await resetContentApprovalStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-author-id",
    email: "author@example.com",
    name: "Author",
  } as any);
});

describe("content approvals API", () => {
  it("lists default approval policies", async () => {
    const response = await listPoliciesApi(createMockRequest("/api/content/approvals/policies"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });

  it("enforces approval gate before blog publish when policy is enabled", async () => {
    await upsertPolicyApi(
      createMockRequest("/api/content/approvals/policies", {
        method: "PUT",
        body: {
          space: "blog_post",
          enabled: true,
          requiredApprovals: 1,
        },
      })
    );

    const created = await createBlogPostApi(
      createMockRequest("/api/content/blog/posts", {
        method: "POST",
        body: {
          title: "Needs Approval",
          content: "Post body",
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

    const blockedPublish = await updateBlogPostApi(
      createMockRequest(`/api/content/blog/posts/${id}`, {
        method: "PATCH",
        body: { action: "publish_now" },
      }),
      createMockParams({ id })
    );
    expect(blockedPublish.status).toBe(409);

    mockGetCurrentUser.mockResolvedValue({
      id: "user-reviewer-id",
      email: "reviewer@example.com",
      name: "Reviewer",
    } as any);

    const review = await updateBlogPostApi(
      createMockRequest(`/api/content/blog/posts/${id}`, {
        method: "PATCH",
        body: { action: "approve" },
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

    expect(publish.status).toBe(200);
  });

  it("creates and decides request through approval APIs", async () => {
    await upsertPolicyApi(
      createMockRequest("/api/content/approvals/policies", {
        method: "PUT",
        body: {
          space: "blog_post",
          enabled: true,
          requiredApprovals: 1,
        },
      })
    );

    const createdRequest = await createRequestApi(
      createMockRequest("/api/content/approvals/requests", {
        method: "POST",
        body: {
          space: "blog_post",
          assetId: "asset-1",
          assetTitle: "Asset",
          assetUpdatedAt: new Date("2026-02-14T11:00:00.000Z").toISOString(),
        },
      })
    );
    const createdBody = await getResponseBody(createdRequest);
    expect(createdRequest.status).toBe(201);

    mockGetCurrentUser.mockResolvedValue({
      id: "user-reviewer-id",
      email: "reviewer@example.com",
      name: "Reviewer",
    } as any);

    const decided = await decideRequestApi(
      createMockRequest(`/api/content/approvals/requests/${createdBody.request.id}/decision`, {
        method: "POST",
        body: {
          decision: "approved",
        },
      }),
      createMockParams({ id: createdBody.request.id })
    );
    const decidedBody = await getResponseBody(decided);

    expect(decided.status).toBe(200);
    expect(decidedBody.request.status).toBe("approved");

    const listed = await listRequestsApi(createMockRequest("/api/content/approvals/requests"));
    const listBody = await getResponseBody(listed);
    expect(listed.status).toBe(200);
    expect(listBody.data).toHaveLength(1);
  });
});
