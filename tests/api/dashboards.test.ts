import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as listDashboards, POST as createDashboard } from "@/app/api/dashboards/route";
import {
  GET as getDashboard,
  PATCH as updateDashboard,
  DELETE as deleteDashboard,
} from "@/app/api/dashboards/[id]/route";

const mockPrisma = vi.mocked(prisma);

const sampleDashboard = {
  id: "dash-1",
  tenantId: "demo-tenant",
  name: "Sales Dashboard",
  description: "Overview of sales",
  isDefault: false,
  widgets: [],
  _count: { widgets: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/dashboards
// =============================================================================
describe("GET /api/dashboards", () => {
  it("should return all dashboards", async () => {
    mockPrisma.dashboard.findMany.mockResolvedValue([sampleDashboard] as any);

    const response = await listDashboards();
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Sales Dashboard");
  });
});

// =============================================================================
// POST /api/dashboards
// =============================================================================
describe("POST /api/dashboards", () => {
  it("should create a dashboard", async () => {
    mockPrisma.dashboard.create.mockResolvedValue(sampleDashboard as any);

    const request = createMockRequest("/api/dashboards", {
      method: "POST",
      body: { name: "Sales Dashboard" },
    });
    const response = await createDashboard(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.data.name).toBe("Sales Dashboard");
  });

  it("should return 400 for missing name", async () => {
    const request = createMockRequest("/api/dashboards", {
      method: "POST",
      body: {},
    });
    const response = await createDashboard(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/dashboards/[id]
// =============================================================================
describe("GET /api/dashboards/[id]", () => {
  it("should return a dashboard with widgets", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue(sampleDashboard as any);

    const request = createMockRequest("/api/dashboards/dash-1");
    const response = await getDashboard(request, createMockParams({ id: "dash-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Sales Dashboard");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/dashboards/missing");
    const response = await getDashboard(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/dashboards/[id]
// =============================================================================
describe("PATCH /api/dashboards/[id]", () => {
  it("should update a dashboard", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);
    mockPrisma.dashboard.update.mockResolvedValue({ ...sampleDashboard, name: "Updated" } as any);

    const request = createMockRequest("/api/dashboards/dash-1", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateDashboard(request, createMockParams({ id: "dash-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Updated");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/dashboards/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateDashboard(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/dashboards/[id]
// =============================================================================
describe("DELETE /api/dashboards/[id]", () => {
  it("should soft delete dashboard and remove widgets via transaction", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);
    mockPrisma.$transaction.mockResolvedValue([{ count: 3 }, sampleDashboard] as any);

    const request = createMockRequest("/api/dashboards/dash-1", { method: "DELETE" });
    const response = await deleteDashboard(request, createMockParams({ id: "dash-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should return 404 when not found", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/dashboards/missing", { method: "DELETE" });
    const response = await deleteDashboard(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
