import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { GET, POST } from "@/app/api/ai/agents/service/route";

const mockPrisma = vi.mocked(prisma);
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

  mockPrisma.ticket.findMany.mockResolvedValue([
    {
      id: "ticket-1",
      subject: "Cannot login to portal",
      description: "Login returns unknown error",
      status: "open",
      priority: "high",
      source: "chat",
      category: "support",
      createdAt: new Date("2026-02-14T08:00:00.000Z"),
      updatedAt: new Date("2026-02-15T09:00:00.000Z"),
      dueDate: new Date("2026-02-15T13:00:00.000Z"),
      firstResponseAt: null,
      assignee: { id: "user-2", name: "Agent One" },
      contact: { firstName: "Kim", lastName: "Tran" },
    },
  ] as never);
});

describe("ai service agent API", () => {
  it("returns triage recommendations on GET", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/service", {
        searchParams: {
          query: "triage queue",
          maxRecommendations: "3",
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.recommendations.length).toBeGreaterThan(0);
    expect(body.data.recommendations[0].suggestedReply.length).toBeGreaterThan(20);
  });

  it("supports POST request body", async () => {
    const response = await POST(
      createMockRequest("/api/ai/agents/service", {
        method: "POST",
        body: {
          query: "suggest replies",
          maxRecommendations: 2,
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.recommendations.length).toBeLessThanOrEqual(2);
  });

  it("returns 400 for invalid maxRecommendations", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/service", {
        searchParams: { maxRecommendations: "100" },
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when missing ai.use permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission ai.use")
    );

    const response = await GET(createMockRequest("/api/ai/agents/service"));
    expect(response.status).toBe(403);
  });
});
