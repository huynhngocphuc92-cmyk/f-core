import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { PATCH as markRead } from "@/app/api/notifications/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("PATCH /api/notifications/[id]", () => {
  it("should mark a notification as read", async () => {
    mockPrisma.notification.findFirst.mockResolvedValue({
      id: "notif-1",
      userId: "user-test-id",
      isRead: false,
    } as any);
    mockPrisma.notification.update.mockResolvedValue({
      id: "notif-1",
      isRead: true,
      readAt: new Date(),
    } as any);

    const request = createMockRequest("/api/notifications/notif-1", { method: "PATCH" });
    const response = await markRead(request, createMockParams({ id: "notif-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.isRead).toBe(true);

    const updateData = mockPrisma.notification.update.mock.calls[0][0]?.data as any;
    expect(updateData.isRead).toBe(true);
    expect(updateData.readAt).toBeDefined();
  });

  it("should return 404 when notification not found", async () => {
    mockPrisma.notification.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/notifications/missing", { method: "PATCH" });
    const response = await markRead(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/notifications/notif-1", { method: "PATCH" });
    const response = await markRead(request, createMockParams({ id: "notif-1" }));

    expect(response.status).toBe(401);
  });
});
