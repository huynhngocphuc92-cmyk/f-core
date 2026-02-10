import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import {
  GET as getWebhook,
  PATCH as updateWebhook,
  DELETE as deleteWebhook,
} from "@/app/api/webhooks/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

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
  mockCheckOwnership.mockResolvedValue(undefined);
});

// =============================================================================
// GET /api/webhooks/[id]
// =============================================================================
describe("GET /api/webhooks/[id]", () => {
  it("should return a webhook", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(sampleWebhook);

    const request = createMockRequest("/api/webhooks/wh-1");
    const response = await getWebhook(request, createMockParams({ id: "wh-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("New Contact Hook");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/webhooks/missing");
    const response = await getWebhook(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(sampleWebhook);

    const request = createMockRequest("/api/webhooks/wh-1");
    await getWebhook(request, createMockParams({ id: "wh-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/webhooks/[id]
// =============================================================================
describe("PATCH /api/webhooks/[id]", () => {
  it("should update a webhook", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(sampleWebhook);
    mockPrisma.webhook.update.mockResolvedValue({
      ...sampleWebhook,
      name: "Updated Hook",
    });

    const request = createMockRequest("/api/webhooks/wh-1", {
      method: "PATCH",
      body: { name: "Updated Hook" },
    });
    const response = await updateWebhook(request, createMockParams({ id: "wh-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Hook");
  });

  it("should update isActive field", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(sampleWebhook);
    mockPrisma.webhook.update.mockResolvedValue({
      ...sampleWebhook,
      isActive: false,
    });

    const request = createMockRequest("/api/webhooks/wh-1", {
      method: "PATCH",
      body: { isActive: false },
    });
    await updateWebhook(request, createMockParams({ id: "wh-1" }));

    const updateCall = mockPrisma.webhook.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({ isActive: false });
  });

  it("should return 404 when not found", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/webhooks/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateWebhook(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid URL", async () => {
    const request = createMockRequest("/api/webhooks/wh-1", {
      method: "PATCH",
      body: { url: "not-a-url" },
    });
    const response = await updateWebhook(request, createMockParams({ id: "wh-1" }));

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// DELETE /api/webhooks/[id] - Hard delete
// =============================================================================
describe("DELETE /api/webhooks/[id]", () => {
  it("should hard delete a webhook", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(sampleWebhook);
    mockPrisma.webhook.delete.mockResolvedValue(sampleWebhook);

    const request = createMockRequest("/api/webhooks/wh-1", {
      method: "DELETE",
    });
    const response = await deleteWebhook(request, createMockParams({ id: "wh-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.webhook.delete).toHaveBeenCalledWith({
      where: { id: "wh-1" },
    });
  });

  it("should return 404 when not found", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/webhooks/missing", {
      method: "DELETE",
    });
    const response = await deleteWebhook(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership before deleting", async () => {
    mockPrisma.webhook.findFirst.mockResolvedValue(sampleWebhook);
    mockPrisma.webhook.delete.mockResolvedValue(sampleWebhook);

    const request = createMockRequest("/api/webhooks/wh-1", {
      method: "DELETE",
    });
    await deleteWebhook(request, createMockParams({ id: "wh-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
