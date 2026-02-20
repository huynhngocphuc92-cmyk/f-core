import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as listSubscriptionsApi,
  POST as createSubscriptionApi,
} from "@/app/api/commerce/subscriptions/route";
import { PATCH as patchSubscriptionApi } from "@/app/api/commerce/subscriptions/[id]/route";
import { resetSubscriptionStoreForTests } from "@/lib/subscription-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  await resetSubscriptionStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("commerce subscriptions API", () => {
  it("creates and lists subscriptions", async () => {
    const created = await createSubscriptionApi(
      createMockRequest("/api/commerce/subscriptions", {
        method: "POST",
        body: {
          customerName: "ACME",
          planName: "Growth",
          amount: 299,
          currency: "USD",
          cycle: "monthly",
        },
      })
    );

    expect(created.status).toBe(201);

    const list = await listSubscriptionsApi(createMockRequest("/api/commerce/subscriptions"));
    const body = await getResponseBody(list);

    expect(list.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.total).toBe(1);
    expect(body.summary.active).toBe(1);
  });

  it("supports renew and cancel actions", async () => {
    const created = await createSubscriptionApi(
      createMockRequest("/api/commerce/subscriptions", {
        method: "POST",
        body: {
          customerName: "ACME",
          planName: "Growth",
          amount: 299,
          currency: "USD",
          cycle: "monthly",
        },
      })
    );

    const createdBody = await getResponseBody(created);
    const id = createdBody.subscription.id;

    const renewed = await patchSubscriptionApi(
      createMockRequest(`/api/commerce/subscriptions/${id}`, {
        method: "PATCH",
        body: { action: "renew" },
      }),
      createMockParams({ id })
    );

    expect(renewed.status).toBe(200);

    const canceled = await patchSubscriptionApi(
      createMockRequest(`/api/commerce/subscriptions/${id}`, {
        method: "PATCH",
        body: { action: "cancel", effective: "period_end" },
      }),
      createMockParams({ id })
    );

    const canceledBody = await getResponseBody(canceled);
    expect(canceled.status).toBe(200);
    expect(canceledBody.subscription.cancelAtPeriodEnd).toBe(true);
  });

  it("returns 404 for missing subscription", async () => {
    const response = await patchSubscriptionApi(
      createMockRequest("/api/commerce/subscriptions/missing-id", {
        method: "PATCH",
        body: { action: "renew" },
      }),
      createMockParams({ id: "missing-id" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 409 for invalid resume transition", async () => {
    const created = await createSubscriptionApi(
      createMockRequest("/api/commerce/subscriptions", {
        method: "POST",
        body: {
          customerName: "ACME",
          planName: "Growth",
          amount: 299,
          currency: "USD",
          cycle: "monthly",
        },
      })
    );

    const createdBody = await getResponseBody(created);

    const response = await patchSubscriptionApi(
      createMockRequest(`/api/commerce/subscriptions/${createdBody.subscription.id}`, {
        method: "PATCH",
        body: { action: "resume" },
      }),
      createMockParams({ id: createdBody.subscription.id })
    );

    expect(response.status).toBe(409);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listSubscriptionsApi(createMockRequest("/api/commerce/subscriptions"));
    expect(response.status).toBe(401);
  });
});
