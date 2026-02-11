import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import {
  GET as getType,
  PATCH as updateType,
  DELETE as deleteType,
} from "@/app/api/meetings/types/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("GET /api/meetings/types/[id]", () => {
  it("should return a meeting type", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue({
      id: "mt-1",
      name: "Quick Call",
      tenantId: "tenant-test-id",
    } as any);

    const request = createMockRequest("/api/meetings/types/mt-1");
    const response = await getType(request, createMockParams({ id: "mt-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Quick Call");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/meetings/types/missing");
    const response = await getType(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/meetings/types/[id]", () => {
  it("should update a meeting type", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue({
      id: "mt-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.meetingType.update.mockResolvedValue({
      id: "mt-1",
      name: "Updated Call",
      duration: 30,
    } as any);

    const request = createMockRequest("/api/meetings/types/mt-1", {
      method: "PATCH",
      body: { name: "Updated Call", duration: 30 },
    });
    const response = await updateType(request, createMockParams({ id: "mt-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Call");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/meetings/types/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateType(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/meetings/types/[id]", () => {
  it("should soft delete a meeting type", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue({
      id: "mt-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.meetingType.update.mockResolvedValue({} as any);

    const request = createMockRequest("/api/meetings/types/mt-1", { method: "DELETE" });
    const response = await deleteType(request, createMockParams({ id: "mt-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateData = mockPrisma.meetingType.update.mock.calls[0][0]?.data as any;
    expect(updateData.deletedAt).toBeDefined();
  });

  it("should return 404 when not found", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/meetings/types/missing", { method: "DELETE" });
    const response = await deleteType(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
