import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";

import { GET as listNotifications, POST as createNotification } from "@/app/api/notifications/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

const sampleNotification = {
  id: "notif-1",
  tenantId: TENANT_ID,
  userId: "user-test-id",
  type: "deal_won",
  title: "Deal Won!",
  message: "Big Deal was closed-won",
  link: "/deals/deal-1",
  icon: "trophy",
  metadata: {},
  isRead: false,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/notifications - List notifications
// =============================================================================
describe("GET /api/notifications", () => {
  it("should return notifications for current user with unread count", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([sampleNotification]);
    mockPrisma.notification.count.mockResolvedValue(3);

    const request = createMockRequest("/api/notifications");
    const response = await listNotifications(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.unreadCount).toBe(3);
  });

  it("should filter by isRead", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);

    const request = createMockRequest("/api/notifications", {
      searchParams: { isRead: "false" },
    });
    await listNotifications(request);

    const findManyCall = mockPrisma.notification.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      userId: "user-test-id",
      isRead: false,
    });
  });

  it("should respect limit parameter", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);

    const request = createMockRequest("/api/notifications", {
      searchParams: { limit: "10" },
    });
    await listNotifications(request);

    const findManyCall = mockPrisma.notification.findMany.mock.calls[0][0];
    expect(findManyCall?.take).toBe(10);
  });

  it("should cap limit at 100", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);

    const request = createMockRequest("/api/notifications", {
      searchParams: { limit: "500" },
    });
    await listNotifications(request);

    const findManyCall = mockPrisma.notification.findMany.mock.calls[0][0];
    expect(findManyCall?.take).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// POST /api/notifications - Create notification
// =============================================================================
describe("POST /api/notifications", () => {
  it("should create a notification", async () => {
    mockPrisma.notification.create.mockResolvedValue(sampleNotification);

    const request = createMockRequest("/api/notifications", {
      method: "POST",
      body: { type: "deal_won", title: "Deal Won!" },
    });
    const response = await createNotification(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.title).toBe("Deal Won!");
  });

  it("should default userId to current user when not specified", async () => {
    mockPrisma.notification.create.mockResolvedValue(sampleNotification);

    const request = createMockRequest("/api/notifications", {
      method: "POST",
      body: { type: "info", title: "Test" },
    });
    await createNotification(request);

    const createCall = mockPrisma.notification.create.mock.calls[0][0];
    expect(createCall?.data.userId).toBe("user-test-id");
  });

  it("should allow specifying userId for another user", async () => {
    mockPrisma.notification.create.mockResolvedValue(sampleNotification);

    const request = createMockRequest("/api/notifications", {
      method: "POST",
      body: { type: "info", title: "Test", userId: "other-user" },
    });
    await createNotification(request);

    const createCall = mockPrisma.notification.create.mock.calls[0][0];
    expect(createCall?.data.userId).toBe("other-user");
  });

  it("should return 400 when type is missing", async () => {
    const request = createMockRequest("/api/notifications", {
      method: "POST",
      body: { title: "Test" },
    });
    const response = await createNotification(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when title is missing", async () => {
    const request = createMockRequest("/api/notifications", {
      method: "POST",
      body: { type: "info" },
    });
    const response = await createNotification(request);

    expect(response.status).toBe(400);
  });
});
