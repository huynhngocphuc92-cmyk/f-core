import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as listSocialPostsApi,
  POST as createSocialPostApi,
} from "@/app/api/marketing/social/posts/route";
import { PATCH as updateSocialPostApi } from "@/app/api/marketing/social/posts/[id]/route";
import { resetSocialPublishingStoreForTests } from "@/lib/social-publishing-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSocialPublishingStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("marketing social posts API", () => {
  it("creates and lists social posts", async () => {
    const created = await createSocialPostApi(
      createMockRequest("/api/marketing/social/posts", {
        method: "POST",
        body: {
          title: "Launch",
          content: "We shipped",
          channels: ["linkedin", "x"],
        },
      })
    );

    expect(created.status).toBe(201);

    const list = await listSocialPostsApi(createMockRequest("/api/marketing/social/posts"));
    const body = await getResponseBody(list);

    expect(list.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.total).toBe(1);
  });

  it("supports schedule and publish transitions", async () => {
    const created = await createSocialPostApi(
      createMockRequest("/api/marketing/social/posts", {
        method: "POST",
        body: {
          title: "Launch",
          content: "We shipped",
          channels: ["linkedin"],
        },
      })
    );

    const createdBody = await getResponseBody(created);
    const id = createdBody.post.id;

    const scheduled = await updateSocialPostApi(
      createMockRequest(`/api/marketing/social/posts/${id}`, {
        method: "PATCH",
        body: {
          action: "schedule",
          scheduledAt: new Date("2026-02-16T10:00:00.000Z").toISOString(),
        },
      }),
      createMockParams({ id })
    );

    expect(scheduled.status).toBe(200);

    const published = await updateSocialPostApi(
      createMockRequest(`/api/marketing/social/posts/${id}`, {
        method: "PATCH",
        body: { action: "publish_now" },
      }),
      createMockParams({ id })
    );

    const body = await getResponseBody(published);
    expect(published.status).toBe(200);
    expect(body.post.status).toBe("published");
  });

  it("returns 404 when post not found", async () => {
    const response = await updateSocialPostApi(
      createMockRequest("/api/marketing/social/posts/missing", {
        method: "PATCH",
        body: { action: "publish_now" },
      }),
      createMockParams({ id: "missing" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listSocialPostsApi(createMockRequest("/api/marketing/social/posts"));
    expect(response.status).toBe(401);
  });
});
