import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import {
  GET as getLink,
  DELETE as deleteLink,
} from "@/app/api/meetings/links/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("GET /api/meetings/links/[id]", () => {
  it("should return a meeting link", async () => {
    mockPrisma.meetingLink.findUnique.mockResolvedValue({
      id: "ml-1",
      slug: "quick-call-abc",
      tenantId: "tenant-test-id",
    } as any);

    const request = createMockRequest("/api/meetings/links/ml-1");
    const response = await getLink(request, createMockParams({ id: "ml-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.slug).toBe("quick-call-abc");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.meetingLink.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/meetings/links/missing");
    const response = await getLink(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/meetings/links/[id]", () => {
  it("should deactivate a meeting link", async () => {
    mockPrisma.meetingLink.findUnique.mockResolvedValue({
      id: "ml-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.meetingLink.update.mockResolvedValue({} as any);

    const request = createMockRequest("/api/meetings/links/ml-1", { method: "DELETE" });
    const response = await deleteLink(request, createMockParams({ id: "ml-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateData = mockPrisma.meetingLink.update.mock.calls[0][0]?.data as any;
    expect(updateData.isActive).toBe(false);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.meetingLink.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/meetings/links/missing", { method: "DELETE" });
    const response = await deleteLink(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
