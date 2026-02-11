import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as listReports, POST as createReport } from "@/app/api/reports/route";
import {
  GET as getReport,
  PATCH as updateReport,
  DELETE as deleteReport,
} from "@/app/api/reports/[id]/route";

const mockPrisma = vi.mocked(prisma);

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
  description: "Monthly sales",
  category: "sales",
  definition: validDefinition,
  isFavorite: false,
  runCount: 0,
  lastRunAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/reports
// =============================================================================
describe("GET /api/reports", () => {
  it("should return all reports", async () => {
    mockPrisma.report.findMany.mockResolvedValue([sampleReport] as any);

    const request = createMockRequest("/api/reports");
    const response = await listReports(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("should filter by category", async () => {
    mockPrisma.report.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/reports", {
      searchParams: { category: "sales" },
    });
    await listReports(request);

    const where = mockPrisma.report.findMany.mock.calls[0][0]?.where as any;
    expect(where.category).toBe("sales");
  });

  it("should skip category filter for 'all'", async () => {
    mockPrisma.report.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/reports", {
      searchParams: { category: "all" },
    });
    await listReports(request);

    const where = mockPrisma.report.findMany.mock.calls[0][0]?.where as any;
    expect(where.category).toBeUndefined();
  });

  it("should filter favorites", async () => {
    mockPrisma.report.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/reports", {
      searchParams: { favorites: "true" },
    });
    await listReports(request);

    const where = mockPrisma.report.findMany.mock.calls[0][0]?.where as any;
    expect(where.isFavorite).toBe(true);
  });

  it("should support search", async () => {
    mockPrisma.report.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/reports", {
      searchParams: { search: "sales" },
    });
    await listReports(request);

    const where = mockPrisma.report.findMany.mock.calls[0][0]?.where as any;
    expect(where.OR).toBeDefined();
  });
});

// =============================================================================
// POST /api/reports
// =============================================================================
describe("POST /api/reports", () => {
  it("should create a report", async () => {
    mockPrisma.report.create.mockResolvedValue(sampleReport as any);

    const request = createMockRequest("/api/reports", {
      method: "POST",
      body: {
        name: "Sales Report",
        definition: validDefinition,
      },
    });
    const response = await createReport(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.data.name).toBe("Sales Report");
  });

  it("should return 400 for missing definition", async () => {
    const request = createMockRequest("/api/reports", {
      method: "POST",
      body: { name: "Report" },
    });
    const response = await createReport(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid definition", async () => {
    const request = createMockRequest("/api/reports", {
      method: "POST",
      body: {
        name: "Report",
        definition: { dataSource: "invalid" },
      },
    });
    const response = await createReport(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/reports/[id]
// =============================================================================
describe("GET /api/reports/[id]", () => {
  it("should return a report", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(sampleReport as any);

    const request = createMockRequest("/api/reports/report-1");
    const response = await getReport(request, createMockParams({ id: "report-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Sales Report");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/reports/missing");
    const response = await getReport(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/reports/[id]
// =============================================================================
describe("PATCH /api/reports/[id]", () => {
  it("should update a report", async () => {
    mockPrisma.report.findFirst.mockResolvedValue({ id: "report-1" } as any);
    mockPrisma.report.update.mockResolvedValue({ ...sampleReport, name: "Updated" } as any);

    const request = createMockRequest("/api/reports/report-1", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateReport(request, createMockParams({ id: "report-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Updated");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/reports/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateReport(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/reports/[id]
// =============================================================================
describe("DELETE /api/reports/[id]", () => {
  it("should soft delete a report", async () => {
    mockPrisma.report.findFirst.mockResolvedValue({ id: "report-1" } as any);
    mockPrisma.report.update.mockResolvedValue(sampleReport as any);

    const request = createMockRequest("/api/reports/report-1", { method: "DELETE" });
    const response = await deleteReport(request, createMockParams({ id: "report-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.report.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({ deletedAt: expect.any(Date) });
  });

  it("should return 404 when not found", async () => {
    mockPrisma.report.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/reports/missing", { method: "DELETE" });
    const response = await deleteReport(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
