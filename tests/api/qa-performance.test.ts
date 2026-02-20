import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { resetApiPerformanceStoreForTests } from "@/lib/api-performance-budget";
import {
  GET as getBudgets,
  PUT as putBudgets,
} from "@/app/api/qa/performance/budgets/route";
import {
  GET as getEvaluations,
  POST as postEvaluation,
} from "@/app/api/qa/performance/evaluate/route";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-qa-performance";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetApiPerformanceStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("qa performance APIs", () => {
  it("lists and updates budgets", async () => {
    const listResponse = await getBudgets(createMockRequest("/api/qa/performance/budgets"));
    const listBody = await getResponseBody(listResponse);
    expect(listResponse.status).toBe(200);
    expect(listBody.data.length).toBeGreaterThan(0);

    const endpoint = listBody.data[0].endpoint;
    const updateResponse = await putBudgets(
      createMockRequest("/api/qa/performance/budgets", {
        method: "PUT",
        body: {
          budgets: [
            {
              endpoint,
              maxP95LatencyMs: 700,
              maxErrorRatePct: 2.2,
              enabled: true,
            },
          ],
        },
      })
    );
    const updateBody = await getResponseBody(updateResponse);
    expect(updateResponse.status).toBe(200);
    expect(updateBody.data.find((item: any) => item.endpoint === endpoint).maxP95LatencyMs).toBe(700);
  });

  it("evaluates snapshots and persists result", async () => {
    const createResponse = await postEvaluation(
      createMockRequest("/api/qa/performance/evaluate", {
        method: "POST",
        body: {
          snapshots: [{ endpoint: "/api/ai/chat", requestCount: 90, p95LatencyMs: 2600, errorRatePct: 3 }],
          persist: true,
        },
      })
    );
    const createBody = await getResponseBody(createResponse);
    expect(createResponse.status).toBe(201);
    expect(createBody.evaluation.summary.checkedEndpoints).toBe(1);

    const listResponse = await getEvaluations(createMockRequest("/api/qa/performance/evaluate"));
    const listBody = await getResponseBody(listResponse);
    expect(listResponse.status).toBe(200);
    expect(listBody.data.length).toBeGreaterThan(0);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));
    const response = await getBudgets(createMockRequest("/api/qa/performance/budgets"));
    expect(response.status).toBe(401);
  });
});
