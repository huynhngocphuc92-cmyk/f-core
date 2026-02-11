import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

vi.mock("@/lib/reports/query-builder", () => ({
  buildReportQuery: vi.fn().mockReturnValue({
    sql: "SELECT COUNT(*) as count FROM deals WHERE tenant_id = $1",
    params: ["demo-tenant"],
  }),
}));

import { POST as runReport } from "@/app/api/reports/[id]/run/route";
import { buildReportQuery } from "@/lib/reports/query-builder";

const mockPrisma = vi.mocked(prisma);
const mockBuildReportQuery = vi.mocked(buildReportQuery);

const validDefinition = {
  dataSource: "deals",
  metrics: [{ field: "amount", aggregate: "sum" }],
  dimensions: [],
  filters: [],
  chart: { chartType: "bar" },
};

const sampleReport = {
  id: "report-1",
  tenantId: "demo-tenant",
  name: "Sales Report",
  definition: validDefinition,
  runCount: 0,
  lastRunAt: null,
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockBuildReportQuery.mockReturnValue({
    sql: "SELECT COUNT(*) as count FROM deals WHERE tenant_id = $1",
    params: ["demo-tenant"],
  });
});

describe("POST /api/reports/[id]/run", () => {
  it("should run a report and return results", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(sampleReport as any);
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 42 }] as any);
    mockPrisma.report.update.mockResolvedValue(sampleReport as any);

    const request = createMockRequest("/api/reports/report-1/run", { method: "POST" });
    const response = await runReport(request, createMockParams({ id: "report-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toEqual([{ count: 42 }]);
  });

  it("should increment runCount and update lastRunAt", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(sampleReport as any);
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
    mockPrisma.report.update.mockResolvedValue(sampleReport as any);

    const request = createMockRequest("/api/reports/report-1/run", { method: "POST" });
    await runReport(request, createMockParams({ id: "report-1" }));

    const updateCall = mockPrisma.report.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({
      runCount: { increment: 1 },
      lastRunAt: expect.any(Date),
    });
  });

  it("should return 404 when report not found", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/reports/missing/run", { method: "POST" });
    const response = await runReport(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid report definition", async () => {
    mockPrisma.report.findFirst.mockResolvedValue({
      ...sampleReport,
      definition: { invalid: true },
    } as any);

    const request = createMockRequest("/api/reports/report-1/run", { method: "POST" });
    const response = await runReport(request, createMockParams({ id: "report-1" }));

    expect(response.status).toBe(400);
  });

  it("should serialize BigInt values in results", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(sampleReport as any);
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: BigInt(1000) }] as any);
    mockPrisma.report.update.mockResolvedValue(sampleReport as any);

    const request = createMockRequest("/api/reports/report-1/run", { method: "POST" });
    const response = await runReport(request, createMockParams({ id: "report-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data[0].total).toBe(1000);
  });
});
