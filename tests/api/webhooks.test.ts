import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser, checkPermission } from "@/lib/auth-helpers";

import { GET as listWebhooks, POST as createWebhook } from "@/app/api/webhooks/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCheckPermission = vi.mocked(checkPermission);

const TENANT_ID = "tenant-test-id";

const sampleWebhook = {
  id: "wh-1",
  tenantId: TENANT_ID,
  userId: "user-test-id",
  user: { id: "user-test-id", name: "Test User", email: "test@example.com" },
  name: "New Contact Hook",
  url: "https://example.com/webhook",
  events: ["contact.created"],
  secret: "abc123",
  isActive: true,
  lastTriggeredAt: null,
  failureCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckPermission.mockResolvedValue(true);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/webhooks - List webhooks
// =============================================================================
describe("GET /api/webhooks", () => {
  it("should return paginated webhooks", async () => {
    mockPrisma.webhook.findMany.mockResolvedValue([sampleWebhook]);
    mockPrisma.webhook.count.mockResolvedValue(1);

    const request = createMockRequest("/api/webhooks");
    const response = await listWebhooks(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("New Contact Hook");
  });

  it("should return 403 when missing settings.read permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission settings.read")
    );

    const response = await listWebhooks(createMockRequest("/api/webhooks"));
    expect(response.status).toBe(403);
  });
});

// =============================================================================
// POST /api/webhooks - Create webhook
// =============================================================================
describe("POST /api/webhooks", () => {
  it("should create a webhook", async () => {
    mockPrisma.webhook.create.mockResolvedValue(sampleWebhook);

    const request = createMockRequest("/api/webhooks", {
      method: "POST",
      body: {
        name: "New Contact Hook",
        url: "https://example.com/webhook",
        events: ["contact.created"],
      },
    });
    const response = await createWebhook(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("New Contact Hook");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "created",
          entity: "webhook",
          entityId: "wh-1",
        }),
      })
    );
  });

  it("should set userId from authenticated user", async () => {
    mockPrisma.webhook.create.mockResolvedValue(sampleWebhook);

    const request = createMockRequest("/api/webhooks", {
      method: "POST",
      body: {
        name: "Hook",
        url: "https://example.com/hook",
        events: ["deal.created"],
      },
    });
    await createWebhook(request);

    const createCall = mockPrisma.webhook.create.mock.calls[0][0];
    expect(createCall?.data.userId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
    expect(createCall?.data.isActive).toBe(true);
  });

  it("should generate secret if not provided", async () => {
    mockPrisma.webhook.create.mockResolvedValue(sampleWebhook);

    const request = createMockRequest("/api/webhooks", {
      method: "POST",
      body: {
        name: "Hook",
        url: "https://example.com/hook",
        events: ["contact.created"],
      },
    });
    await createWebhook(request);

    const createCall = mockPrisma.webhook.create.mock.calls[0][0];
    expect(createCall?.data.secret).toBeTruthy();
    expect(typeof createCall?.data.secret).toBe("string");
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/webhooks", {
      method: "POST",
      body: { url: "https://example.com", events: ["contact.created"] },
    });
    const response = await createWebhook(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when url is invalid", async () => {
    const request = createMockRequest("/api/webhooks", {
      method: "POST",
      body: { name: "Hook", url: "not-a-url", events: ["contact.created"] },
    });
    const response = await createWebhook(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when events is empty", async () => {
    const request = createMockRequest("/api/webhooks", {
      method: "POST",
      body: { name: "Hook", url: "https://example.com", events: [] },
    });
    const response = await createWebhook(request);

    expect(response.status).toBe(400);
  });

  it("should return 403 when missing settings.manage permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission settings.manage")
    );

    const request = createMockRequest("/api/webhooks", {
      method: "POST",
      body: {
        name: "Hook",
        url: "https://example.com/hook",
        events: ["contact.created"],
      },
    });
    const response = await createWebhook(request);
    expect(response.status).toBe(403);
  });
});
