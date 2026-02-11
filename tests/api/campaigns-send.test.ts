import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { POST as sendCampaign } from "@/app/api/campaigns/[id]/send/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("POST /api/campaigns/[id]/send", () => {
  it("should send a draft campaign", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue({
      id: "camp-1",
      status: "draft",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.contact.findMany.mockResolvedValue([
      { email: "a@test.com" },
      { email: "b@test.com" },
    ] as any);
    mockPrisma.emailCampaign.update.mockResolvedValue({} as any);

    const request = createMockRequest("/api/campaigns/camp-1/send", { method: "POST" });
    const response = await sendCampaign(request, createMockParams({ id: "camp-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.recipientCount).toBe(2);
  });

  it("should return 400 when campaign is not draft", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue({
      id: "camp-1",
      status: "sent",
      tenantId: "tenant-test-id",
    } as any);

    const request = createMockRequest("/api/campaigns/camp-1/send", { method: "POST" });
    const response = await sendCampaign(request, createMockParams({ id: "camp-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when campaign not found", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/campaigns/missing/send", { method: "POST" });
    const response = await sendCampaign(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/campaigns/camp-1/send", { method: "POST" });
    const response = await sendCampaign(request, createMockParams({ id: "camp-1" }));

    expect(response.status).toBe(401);
  });

  it("should update campaign with send metrics", async () => {
    mockPrisma.emailCampaign.findFirst.mockResolvedValue({
      id: "camp-1",
      status: "draft",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.contact.findMany.mockResolvedValue([
      { email: "a@test.com" },
    ] as any);
    mockPrisma.emailCampaign.update.mockResolvedValue({} as any);

    const request = createMockRequest("/api/campaigns/camp-1/send", { method: "POST" });
    await sendCampaign(request, createMockParams({ id: "camp-1" }));

    const updateData = mockPrisma.emailCampaign.update.mock.calls[0][0]?.data as any;
    expect(updateData.status).toBe("sent");
    expect(updateData.sentAt).toBeDefined();
    expect(updateData.recipientCount).toBe(1);
  });
});
