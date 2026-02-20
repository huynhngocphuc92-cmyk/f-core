import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { GET, POST } from "@/app/api/ai/agents/prospecting/route";

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

  mockPrisma.contact.findMany.mockResolvedValue([
    {
      id: "contact-1",
      firstName: "Taylor",
      lastName: "Lead",
      email: "taylor@example.com",
      lifecycleStage: "lead",
      updatedAt: new Date("2026-02-10T00:00:00.000Z"),
    },
  ] as never);

  mockPrisma.deal.findMany.mockResolvedValue([
    {
      id: "deal-1",
      name: "Enterprise Renewal",
      amount: 52000,
      probability: 40,
      closeDate: new Date("2026-03-30T00:00:00.000Z"),
      updatedAt: new Date("2026-02-12T00:00:00.000Z"),
      contacts: [{ contactId: "contact-1" }],
    },
  ] as never);

  mockPrisma.activity.findMany.mockResolvedValue([
    {
      contactId: "contact-1",
      dealId: "deal-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ] as never);
});

describe("ai prospecting agent API", () => {
  it("returns prospecting recommendations on GET", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/prospecting", {
        searchParams: {
          segment: "all",
          lookbackDays: "30",
          query: "who should we prioritize",
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.recommendations.length).toBeGreaterThan(0);
    expect(body.data.summary.contactsScanned).toBe(1);
  });

  it("supports POST request body", async () => {
    const response = await POST(
      createMockRequest("/api/ai/agents/prospecting", {
        method: "POST",
        body: {
          segment: "stalled_deals",
          lookbackDays: 30,
          maxRecommendations: 2,
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.recommendations.length).toBeLessThanOrEqual(2);
  });

  it("returns 400 for invalid segment", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/prospecting", {
        searchParams: { segment: "invalid" },
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when missing ai.use permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission ai.use")
    );

    const response = await GET(createMockRequest("/api/ai/agents/prospecting"));
    expect(response.status).toBe(403);
  });
});
