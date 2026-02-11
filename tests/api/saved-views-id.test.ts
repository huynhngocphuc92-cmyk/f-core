import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import {
  GET as getView,
  PATCH as updateView,
  DELETE as deleteView,
} from "@/app/api/saved-views/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const sampleView = {
  id: "sv-1",
  tenantId: "tenant-test-id",
  name: "My Contacts",
  module: "contacts",
  filters: [],
  columns: ["name", "email"],
  isDefault: false,
  isShared: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

// =============================================================================
// GET /api/saved-views/[id]
// =============================================================================
describe("GET /api/saved-views/[id]", () => {
  it("should return a saved view", async () => {
    mockPrisma.savedView.findFirst.mockResolvedValue(sampleView as any);

    const request = createMockRequest("/api/saved-views/sv-1");
    const response = await getView(request, createMockParams({ id: "sv-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("My Contacts");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.savedView.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/saved-views/missing");
    const response = await getView(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/saved-views/[id]
// =============================================================================
describe("PATCH /api/saved-views/[id]", () => {
  it("should update a saved view", async () => {
    mockPrisma.savedView.findFirst.mockResolvedValue(sampleView as any);
    mockPrisma.savedView.update.mockResolvedValue({
      ...sampleView,
      name: "Updated View",
    } as any);

    const request = createMockRequest("/api/saved-views/sv-1", {
      method: "PATCH",
      body: { name: "Updated View" },
    });
    const response = await updateView(request, createMockParams({ id: "sv-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated View");
  });

  it("should unset other defaults when setting isDefault", async () => {
    mockPrisma.savedView.findFirst.mockResolvedValue(sampleView as any);
    mockPrisma.savedView.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.savedView.update.mockResolvedValue({
      ...sampleView,
      isDefault: true,
    } as any);

    const request = createMockRequest("/api/saved-views/sv-1", {
      method: "PATCH",
      body: { isDefault: true },
    });
    const response = await updateView(request, createMockParams({ id: "sv-1" }));

    expect(response.status).toBe(200);
    expect(mockPrisma.savedView.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          module: "contacts",
          isDefault: true,
          id: { not: "sv-1" },
        }),
        data: { isDefault: false },
      })
    );
  });

  it("should return 404 when not found", async () => {
    mockPrisma.savedView.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/saved-views/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateView(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/saved-views/[id]
// =============================================================================
describe("DELETE /api/saved-views/[id]", () => {
  it("should hard delete a saved view", async () => {
    mockPrisma.savedView.findFirst.mockResolvedValue(sampleView as any);
    mockPrisma.savedView.delete.mockResolvedValue({} as any);

    const request = createMockRequest("/api/saved-views/sv-1", { method: "DELETE" });
    const response = await deleteView(request, createMockParams({ id: "sv-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.savedView.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "sv-1" } })
    );
  });

  it("should return 404 when not found", async () => {
    mockPrisma.savedView.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/saved-views/missing", { method: "DELETE" });
    const response = await deleteView(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
