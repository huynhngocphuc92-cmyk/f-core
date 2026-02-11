import { describe, it, expect, vi, beforeEach } from "vitest";
import { getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as getStats } from "@/app/api/reports/stats/route";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/reports/stats", () => {
  it("should return aggregated stats", async () => {
    mockPrisma.contact.count.mockResolvedValue(100);
    mockPrisma.company.count.mockResolvedValue(25);
    mockPrisma.deal.count.mockResolvedValue(50);
    mockPrisma.deal.aggregate.mockResolvedValue({
      _sum: { amount: 500000 },
      _count: 50,
    } as any);
    mockPrisma.contact.groupBy.mockResolvedValue([
      { lifecycleStage: "lead", _count: 60 },
      { lifecycleStage: "customer", _count: 40 },
    ] as any);
    mockPrisma.deal.findMany.mockResolvedValue([
      { stage: { name: "Closed Won", color: "#22c55e" }, amount: 100000 },
      { stage: { name: "Closed Won", color: "#22c55e" }, amount: 200000 },
      { stage: { name: "Qualified", color: "#0891b2" }, amount: 50000 },
    ] as any);
    mockPrisma.activity.findMany.mockResolvedValue([
      { type: "call", createdAt: new Date() },
      { type: "email", createdAt: new Date() },
      { type: "call", createdAt: new Date() },
    ] as any);

    const response = await getStats();
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.totalContacts).toBe(100);
    expect(body.data.totalCompanies).toBe(25);
    expect(body.data.totalDeals).toBe(50);
    expect(body.data.totalRevenue).toBe(500000);
    expect(body.data.dealsWon).toBe(2);
    expect(body.data.dealsByStage).toHaveLength(2);
    expect(body.data.contactsByLifecycle).toHaveLength(2);
    expect(body.data.recentActivities).toHaveLength(2);
  });

  it("should handle zero data gracefully", async () => {
    mockPrisma.contact.count.mockResolvedValue(0);
    mockPrisma.company.count.mockResolvedValue(0);
    mockPrisma.deal.count.mockResolvedValue(0);
    mockPrisma.deal.aggregate.mockResolvedValue({
      _sum: { amount: null },
      _count: 0,
    } as any);
    mockPrisma.contact.groupBy.mockResolvedValue([] as any);
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.activity.findMany.mockResolvedValue([]);

    const response = await getStats();
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.totalContacts).toBe(0);
    expect(body.data.totalRevenue).toBe(0);
    expect(body.data.dealsWon).toBe(0);
    expect(body.data.dealsByStage).toHaveLength(0);
  });
});
