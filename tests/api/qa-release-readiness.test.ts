import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { resetReleaseReadinessStoreForTests } from "@/lib/release-readiness";
import {
  GET as getChecklist,
  PUT as putChecklist,
} from "@/app/api/qa/release-readiness/checklist/route";
import {
  GET as getResults,
  POST as postEvaluate,
} from "@/app/api/qa/release-readiness/evaluate/route";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-qa-release-readiness";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetReleaseReadinessStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("qa release readiness APIs", () => {
  it("lists and updates checklist gates", async () => {
    const listResponse = await getChecklist(createMockRequest("/api/qa/release-readiness/checklist"));
    const listBody = await getResponseBody(listResponse);
    expect(listResponse.status).toBe(200);
    expect(listBody.data.length).toBeGreaterThan(0);

    const updateResponse = await putChecklist(
      createMockRequest("/api/qa/release-readiness/checklist", {
        method: "PUT",
        body: {
          gates: [{ id: "e2e_critical", required: true, enabled: true }],
        },
      })
    );
    const updateBody = await getResponseBody(updateResponse);
    expect(updateResponse.status).toBe(200);
    expect(updateBody.data.find((item: any) => item.id === "e2e_critical").required).toBe(true);
  });

  it("evaluates readiness and persists result history", async () => {
    const evaluateResponse = await postEvaluate(
      createMockRequest("/api/qa/release-readiness/evaluate", {
        method: "POST",
        body: {
          releaseTag: "v2.0.0-rc",
          branch: "main",
          actor: "qa-bot",
          persist: true,
          observations: [
            { gateId: "unit_tests", status: "pass", durationMs: 1200 },
            { gateId: "build", status: "pass", durationMs: 1600 },
            { gateId: "security_regression", status: "pass", durationMs: 900 },
            { gateId: "ai_evals", status: "pass", durationMs: 700 },
          ],
        },
      })
    );
    const evaluateBody = await getResponseBody(evaluateResponse);
    expect(evaluateResponse.status).toBe(201);
    expect(evaluateBody.result.status).toBe("ready");

    const listResultsResponse = await getResults(createMockRequest("/api/qa/release-readiness/evaluate"));
    const listResultsBody = await getResponseBody(listResultsResponse);
    expect(listResultsResponse.status).toBe(200);
    expect(listResultsBody.data.length).toBeGreaterThan(0);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));
    const response = await getChecklist(createMockRequest("/api/qa/release-readiness/checklist"));
    expect(response.status).toBe(401);
  });
});
