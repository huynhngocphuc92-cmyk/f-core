import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import {
  POST as addWidget,
  PATCH as updateWidgets,
  DELETE as removeWidget,
} from "@/app/api/dashboards/[id]/widgets/route";

const mockPrisma = vi.mocked(prisma);

const sampleWidget = {
  id: "widget-1",
  dashboardId: "dash-1",
  reportId: "report-1",
  title: "Revenue Chart",
  x: 0,
  y: 0,
  w: 6,
  h: 4,
  report: { id: "report-1", name: "Revenue" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// POST /api/dashboards/[id]/widgets
// =============================================================================
describe("POST /api/dashboards/[id]/widgets", () => {
  it("should add a widget to a dashboard", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);
    mockPrisma.report.findFirst.mockResolvedValue({ id: "report-1" } as any);
    mockPrisma.dashboardWidget.create.mockResolvedValue(sampleWidget as any);

    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "POST",
      body: {
        reportId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Revenue Chart",
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      },
    });
    const response = await addWidget(request, createMockParams({ id: "dash-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.data.title).toBe("Revenue Chart");
  });

  it("should return 404 when dashboard not found", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/dashboards/missing/widgets", {
      method: "POST",
      body: {
        reportId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Chart",
      },
    });
    const response = await addWidget(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 404 when report not found", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);
    mockPrisma.report.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "POST",
      body: {
        reportId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Chart",
      },
    });
    const response = await addWidget(request, createMockParams({ id: "dash-1" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid data", async () => {
    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "POST",
      body: { title: "No report" },
    });
    const response = await addWidget(request, createMockParams({ id: "dash-1" }));

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// PATCH /api/dashboards/[id]/widgets
// =============================================================================
describe("PATCH /api/dashboards/[id]/widgets", () => {
  it("should batch update widget positions", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);
    mockPrisma.$transaction.mockResolvedValue([{ count: 1 }] as any);

    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "PATCH",
      body: {
        widgets: [
          { id: "widget-1", x: 0, y: 0, w: 12, h: 6 },
        ],
      },
    });
    const response = await updateWidgets(request, createMockParams({ id: "dash-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should return 404 when dashboard not found", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/dashboards/missing/widgets", {
      method: "PATCH",
      body: { widgets: [] },
    });
    const response = await updateWidgets(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 when widgets is not an array", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);

    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "PATCH",
      body: { widgets: "not-an-array" },
    });
    const response = await updateWidgets(request, createMockParams({ id: "dash-1" }));

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// DELETE /api/dashboards/[id]/widgets
// =============================================================================
describe("DELETE /api/dashboards/[id]/widgets", () => {
  it("should remove a widget by widgetId query param", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);
    mockPrisma.dashboardWidget.deleteMany.mockResolvedValue({ count: 1 });

    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "DELETE",
      searchParams: { widgetId: "widget-1" },
    });
    const response = await removeWidget(request, createMockParams({ id: "dash-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should return 400 when widgetId is missing", async () => {
    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "DELETE",
    });
    const response = await removeWidget(request, createMockParams({ id: "dash-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when dashboard not found", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/dashboards/missing/widgets", {
      method: "DELETE",
      searchParams: { widgetId: "widget-1" },
    });
    const response = await removeWidget(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 404 when widget not found in dashboard", async () => {
    mockPrisma.dashboard.findFirst.mockResolvedValue({ id: "dash-1" } as any);
    mockPrisma.dashboardWidget.deleteMany.mockResolvedValue({ count: 0 });

    const request = createMockRequest("/api/dashboards/dash-1/widgets", {
      method: "DELETE",
      searchParams: { widgetId: "nonexistent" },
    });
    const response = await removeWidget(request, createMockParams({ id: "dash-1" }));

    expect(response.status).toBe(404);
  });
});
