import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import {
  GET as getCampaign,
  PATCH as updateCampaign,
  DELETE as deleteCampaign,
} from "@/app/api/campaigns/[id]/route";

import { POST as sendCampaign } from "@/app/api/campaigns/[id]/send/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const sampleCampaign = {
  id: "camp-1",
  tenantId: TENANT_ID,
  name: "Black Friday Sale",
  subject: "50% Off Everything!",
  body: "<h1>Big Sale</h1>",
  previewText: "Don't miss out",
  templateId: null,
  status: "draft",
  ownerId: "user-test-id",
  owner: { id: "user-test-id", name: "Test User", email: "test@example.com" },
  scheduledAt: null,
  sentAt: null,
  recipientCount: 0,
  sentCount: 0,
  deliveredCount: 0,
  openedCount: 0,
  clickedCount: 0,
  bouncedCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(undefined);
});

// =============================================================================
// GET /api/campaigns/[id]
// =============================================================================
describe("GET /api/campaigns/[id]", () => {
  it("should return a campaign", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sampleCampaign);

    const request = createMockRequest("/api/campaigns/camp-1");
    const response = await getCampaign(request, createMockParams({ id: "camp-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Black Friday Sale");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/campaigns/missing");
    const response = await getCampaign(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sampleCampaign);

    const request = createMockRequest("/api/campaigns/camp-1");
    await getCampaign(request, createMockParams({ id: "camp-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/campaigns/[id]
// =============================================================================
describe("PATCH /api/campaigns/[id]", () => {
  it("should update a draft campaign", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sampleCampaign);
    mockPrisma.emailCampaign.update.mockResolvedValue({
      ...sampleCampaign,
      name: "Updated Campaign",
    });

    const request = createMockRequest("/api/campaigns/camp-1", {
      method: "PATCH",
      body: { name: "Updated Campaign" },
    });
    const response = await updateCampaign(request, createMockParams({ id: "camp-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Campaign");
  });

  it("should return 400 when campaign is not draft", async () => {
    const sentCampaign = { ...sampleCampaign, status: "sent" };
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sentCampaign);

    const request = createMockRequest("/api/campaigns/camp-1", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateCampaign(request, createMockParams({ id: "camp-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/campaigns/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateCampaign(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/campaigns/[id]
// =============================================================================
describe("DELETE /api/campaigns/[id]", () => {
  it("should soft delete a campaign", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sampleCampaign);
    mockPrisma.emailCampaign.update.mockResolvedValue(sampleCampaign);

    const request = createMockRequest("/api/campaigns/camp-1", {
      method: "DELETE",
    });
    const response = await deleteCampaign(request, createMockParams({ id: "camp-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.emailCampaign.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/campaigns/missing", {
      method: "DELETE",
    });
    const response = await deleteCampaign(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// POST /api/campaigns/[id]/send
// =============================================================================
describe("POST /api/campaigns/[id]/send", () => {
  it("should send a draft campaign", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sampleCampaign);
    mockPrisma.contact.findMany.mockResolvedValue([
      { email: "a@test.com" },
      { email: "b@test.com" },
    ] as any);
    mockPrisma.emailCampaign.update.mockResolvedValue(sampleCampaign);

    const request = createMockRequest("/api/campaigns/camp-1", { method: "POST" });
    const response = await sendCampaign(request, createMockParams({ id: "camp-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.recipientCount).toBe(2);
  });

  it("should update campaign status to sent", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sampleCampaign);
    mockPrisma.contact.findMany.mockResolvedValue([{ email: "a@test.com" }] as any);
    mockPrisma.emailCampaign.update.mockResolvedValue(sampleCampaign);

    const request = createMockRequest("/api/campaigns/camp-1", { method: "POST" });
    await sendCampaign(request, createMockParams({ id: "camp-1" }));

    const updateCall = mockPrisma.emailCampaign.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({
      status: "sent",
      sentAt: expect.any(Date),
      recipientCount: 1,
    });
  });

  it("should return 400 when campaign is not draft", async () => {
    const sentCampaign = { ...sampleCampaign, status: "sent" };
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(sentCampaign);

    const request = createMockRequest("/api/campaigns/camp-1", { method: "POST" });
    const response = await sendCampaign(request, createMockParams({ id: "camp-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when campaign not found", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/campaigns/missing", { method: "POST" });
    const response = await sendCampaign(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
