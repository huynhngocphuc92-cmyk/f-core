import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { GET, POST } from "@/app/api/ai/agents/sales/route";

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

  mockPrisma.deal.findMany.mockResolvedValue([
    {
      id: "deal-1",
      name: "Renewal",
      amount: 50000,
      probability: 35,
      closeDate: new Date("2026-03-20T00:00:00.000Z"),
      closedReason: null,
      closedAt: null,
      stage: { name: "Negotiation", probability: 40 },
    },
  ] as never);

  mockPrisma.activity.findMany.mockResolvedValue([
    {
      dealId: "deal-1",
      createdAt: new Date("2026-02-10T00:00:00.000Z"),
      metadata: {
        salesCallIntelligence: true,
        sentimentScore: -0.3,
        riskSignals: ["budget"],
      },
    },
  ] as never);
});

describe("ai sales agent API", () => {
  it("returns actionable insights on GET", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/sales", {
        searchParams: {
          query: "help me reduce risk",
          period: "quarter",
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.recommendations.length).toBeGreaterThan(0);
    expect(body.data.summary.highRiskDeals).toBeGreaterThanOrEqual(0);
  });

  it("supports POST request body", async () => {
    const response = await POST(
      createMockRequest("/api/ai/agents/sales", {
        method: "POST",
        body: {
          query: "what should reps prioritize",
          maxRecommendations: 3,
          period: "month",
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.recommendations.length).toBeLessThanOrEqual(3);
  });

  it("returns 400 for invalid period", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/sales", {
        searchParams: { period: "week" },
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when missing ai.use permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission ai.use")
    );

    const response = await GET(createMockRequest("/api/ai/agents/sales"));
    expect(response.status).toBe(403);
  });
});
