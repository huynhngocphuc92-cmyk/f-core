import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getSalesCoaching } from "@/app/api/sales/coaching/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("sales coaching API", () => {
  it("returns coaching insights and summary", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        name: "Enterprise ACME",
        amount: 80000,
        probability: 35,
        closeDate: new Date("2026-02-01T00:00:00.000Z"),
        closedReason: null,
        stage: { name: "Negotiation" },
      },
    ] as any);

    mockPrisma.activity.findMany.mockResolvedValue([
      {
        dealId: "deal-1",
        createdAt: new Date("2026-02-10T00:00:00.000Z"),
        metadata: {
          salesCallIntelligence: true,
          sentimentScore: -0.2,
          riskSignals: ["Budget concern mentioned"],
        },
      },
    ] as any);

    const response = await getSalesCoaching(createMockRequest("/api/sales/coaching"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.totalDeals).toBe(1);
    expect(body.data[0].riskLevel).toBeDefined();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getSalesCoaching(createMockRequest("/api/sales/coaching"));
    expect(response.status).toBe(401);
  });

  it("returns empty list when no deals", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([] as any);
    mockPrisma.activity.findMany.mockResolvedValue([] as any);

    const response = await getSalesCoaching(createMockRequest("/api/sales/coaching"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(0);
    expect(body.summary.totalDeals).toBe(0);
  });
});
