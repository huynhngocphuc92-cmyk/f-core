import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as listDunningApi,
  POST as createDunningApi,
  PUT as updateDunningConfigApi,
} from "@/app/api/commerce/dunning/route";
import { PATCH as patchDunningApi } from "@/app/api/commerce/dunning/[id]/route";
import { resetDunningStoreForTests } from "@/lib/dunning-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  await resetDunningStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("commerce dunning API", () => {
  it("creates and lists dunning cases", async () => {
    const created = await createDunningApi(
      createMockRequest("/api/commerce/dunning", {
        method: "POST",
        body: {
          customerName: "ACME",
          amount: 500,
          currency: "USD",
        },
      })
    );

    expect(created.status).toBe(201);

    const list = await listDunningApi(createMockRequest("/api/commerce/dunning"));
    const body = await getResponseBody(list);

    expect(list.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.open).toBe(1);
  });

  it("updates dunning config", async () => {
    const response = await updateDunningConfigApi(
      createMockRequest("/api/commerce/dunning", {
        method: "PUT",
        body: {
          retryDelaysHours: [12, 24],
          maxRetries: 2,
          cancelAfterMaxRetries: false,
          notifyChannels: {
            email: true,
            sms: true,
            inApp: false,
          },
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.config.maxRetries).toBe(2);
    expect(body.config.notifyChannels.sms).toBe(true);
  });

  it("supports retry_failed and mark_paid transitions", async () => {
    const created = await createDunningApi(
      createMockRequest("/api/commerce/dunning", {
        method: "POST",
        body: {
          customerName: "ACME",
          amount: 500,
          currency: "USD",
        },
      })
    );

    const createdBody = await getResponseBody(created);
    const id = createdBody.dunningCase.id;

    const retryFailed = await patchDunningApi(
      createMockRequest(`/api/commerce/dunning/${id}`, {
        method: "PATCH",
        body: { action: "mark_retry_failed" },
      }),
      createMockParams({ id })
    );

    expect(retryFailed.status).toBe(200);

    const paid = await patchDunningApi(
      createMockRequest(`/api/commerce/dunning/${id}`, {
        method: "PATCH",
        body: { action: "mark_paid" },
      }),
      createMockParams({ id })
    );

    const paidBody = await getResponseBody(paid);
    expect(paid.status).toBe(200);
    expect(paidBody.dunningCase.status).toBe("recovered");
  });

  it("returns 404 for missing dunning case", async () => {
    const response = await patchDunningApi(
      createMockRequest("/api/commerce/dunning/missing-id", {
        method: "PATCH",
        body: { action: "mark_paid" },
      }),
      createMockParams({ id: "missing-id" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listDunningApi(createMockRequest("/api/commerce/dunning"));
    expect(response.status).toBe(401);
  });
});
