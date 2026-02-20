import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { GET, POST } from "@/app/api/ai/evals/route";

const mockGetUserData = vi.mocked(getUserData);
const mockCheckPermission = vi.mocked(checkPermission);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserData.mockResolvedValue({
    id: "user-1",
    email: "demo@example.com",
    name: "Demo User",
    tenantId: "tenant-test-id",
    role: "admin",
  } as never);
});

describe("ai evals API", () => {
  it("runs default benchmarks on GET", async () => {
    const response = await GET(createMockRequest("/api/ai/evals"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.totalScenarios).toBe(3);
  });

  it("runs benchmarks with custom thresholds on POST", async () => {
    const response = await POST(
      createMockRequest("/api/ai/evals", {
        method: "POST",
        body: {
          thresholds: {
            minQuality: 60,
            maxLatencyMs: 500,
            maxCostUsd: 0.05,
          },
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.thresholds.minQuality).toBe(60);
  });

  it("returns 400 for invalid thresholds", async () => {
    const response = await POST(
      createMockRequest("/api/ai/evals", {
        method: "POST",
        body: {
          thresholds: {
            minQuality: 120,
          },
        },
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when missing reports.manage permission", async () => {
    mockCheckPermission.mockImplementation(async (permission) => {
      if (permission === "reports.manage") {
        throw new Error("Forbidden: Missing permission reports.manage");
      }
      return true;
    });

    const response = await GET(createMockRequest("/api/ai/evals"));
    expect(response.status).toBe(403);
  });
});
