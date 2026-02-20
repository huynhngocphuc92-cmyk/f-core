import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { GET, POST } from "@/app/api/ai/orchestration/route";
import { resetOrchestrationStoreForTests } from "@/lib/ai/orchestrator";

const mockGetUserData = vi.mocked(getUserData);
const mockCheckPermission = vi.mocked(checkPermission);

beforeEach(async () => {
  vi.clearAllMocks();
  await resetOrchestrationStoreForTests();
  mockGetUserData.mockResolvedValue({
    id: "user-1",
    email: "demo@example.com",
    name: "Demo User",
    tenantId: "tenant-test-id",
    role: "admin",
  } as never);
});

describe("ai orchestration API", () => {
  it("runs orchestration plan", async () => {
    const response = await POST(
      createMockRequest("/api/ai/orchestration", {
        method: "POST",
        body: {
          query: "show pipeline and contacts",
          conversationId: "conv-100",
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.plan.length).toBeGreaterThan(0);
  });

  it("returns memory by conversation", async () => {
    await POST(
      createMockRequest("/api/ai/orchestration", {
        method: "POST",
        body: {
          query: "pipeline summary",
          conversationId: "conv-memory-api",
        },
      })
    );

    const response = await GET(
      createMockRequest("/api/ai/orchestration", {
        searchParams: {
          conversationId: "conv-memory-api",
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.memory?.conversationId).toBe("conv-memory-api");
  });

  it("returns 400 when conversationId missing on GET", async () => {
    const response = await GET(createMockRequest("/api/ai/orchestration"));
    expect(response.status).toBe(400);
  });

  it("returns 403 when missing ai.use permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission ai.use")
    );

    const response = await POST(
      createMockRequest("/api/ai/orchestration", {
        method: "POST",
        body: {
          query: "pipeline",
        },
      })
    );

    expect(response.status).toBe(403);
  });
});
