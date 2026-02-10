import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";

import { POST as markAllRead } from "@/app/api/notifications/mark-all-read/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

describe("POST /api/notifications/mark-all-read", () => {
  it("should mark all unread notifications as read", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

    const request = createMockRequest("/api/notifications/mark-all-read", {
      method: "POST",
    });
    const response = await markAllRead(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should filter by tenantId, userId, and isRead=false", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

    const request = createMockRequest("/api/notifications/mark-all-read", {
      method: "POST",
    });
    await markAllRead(request);

    const updateCall = mockPrisma.notification.updateMany.mock.calls[0][0];
    expect(updateCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      userId: "user-test-id",
      isRead: false,
    });
  });

  it("should set isRead to true and readAt to a Date", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

    const request = createMockRequest("/api/notifications/mark-all-read", {
      method: "POST",
    });
    await markAllRead(request);

    const updateCall = mockPrisma.notification.updateMany.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({
      isRead: true,
      readAt: expect.any(Date),
    });
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/notifications/mark-all-read", {
      method: "POST",
    });
    const response = await markAllRead(request);

    expect(response.status).toBe(401);
  });
});
