import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { resetFrontendPerformanceStoreForTests } from "@/lib/frontend-performance";
import {
  GET as getThresholds,
  PUT as putThresholds,
} from "@/app/api/qa/frontend-performance/thresholds/route";
import {
  GET as getEvaluations,
  POST as postEvaluate,
} from "@/app/api/qa/frontend-performance/evaluate/route";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-qa-frontend-performance";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetFrontendPerformanceStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("qa frontend performance APIs", () => {
  it("lists and updates thresholds", async () => {
    const listResponse = await getThresholds(createMockRequest("/api/qa/frontend-performance/thresholds"));
    const listBody = await getResponseBody(listResponse);
    expect(listResponse.status).toBe(200);
    expect(listBody.data.length).toBeGreaterThan(0);

    const route = listBody.data[0].route;
    const updateResponse = await putThresholds(
      createMockRequest("/api/qa/frontend-performance/thresholds", {
        method: "PUT",
        body: {
          thresholds: [
            {
              route,
              maxLcpMs: 2600,
              maxInpMs: 220,
              maxCls: 0.1,
              maxJsKb: 430,
              enabled: true,
            },
          ],
        },
      })
    );

    const updateBody = await getResponseBody(updateResponse);
    expect(updateResponse.status).toBe(200);
    expect(updateBody.data.find((item: any) => item.route === route).maxLcpMs).toBe(2600);
  });

  it("evaluates frontend snapshots and persists result", async () => {
    const response = await postEvaluate(
      createMockRequest("/api/qa/frontend-performance/evaluate", {
        method: "POST",
        body: {
          snapshots: [{ route: "/dashboard", lcpMs: 2800, inpMs: 260, cls: 0.12, jsKb: 470 }],
          persist: true,
        },
      })
    );
    const body = await getResponseBody(response);
    expect(response.status).toBe(201);
    expect(body.evaluation.summary.checkedRoutes).toBe(1);

    const listResponse = await getEvaluations(createMockRequest("/api/qa/frontend-performance/evaluate"));
    const listBody = await getResponseBody(listResponse);
    expect(listResponse.status).toBe(200);
    expect(listBody.data.length).toBeGreaterThan(0);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));
    const response = await getThresholds(createMockRequest("/api/qa/frontend-performance/thresholds"));
    expect(response.status).toBe(401);
  });
});
