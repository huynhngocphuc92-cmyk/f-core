import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import {
  GET as getConversation,
  PATCH as updateConversation,
} from "@/app/api/chat/conversations/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const sampleConversation = {
  id: "conv-1",
  tenantId: "tenant-test-id",
  status: "open",
  visitorName: "John",
  widget: null,
  assignee: null,
  contact: null,
  messages: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
  mockCheckOwnership.mockResolvedValue(true as any);
});

// =============================================================================
// GET /api/chat/conversations/[id]
// =============================================================================
describe("GET /api/chat/conversations/[id]", () => {
  it("should return a conversation with messages", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(sampleConversation as any);

    const request = createMockRequest("/api/chat/conversations/conv-1");
    const response = await getConversation(request, createMockParams({ id: "conv-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe("conv-1");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/chat/conversations/missing");
    const response = await getConversation(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/chat/conversations/[id]
// =============================================================================
describe("PATCH /api/chat/conversations/[id]", () => {
  it("should update conversation status", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(sampleConversation as any);
    mockPrisma.chatConversation.update.mockResolvedValue({
      ...sampleConversation,
      status: "resolved",
    } as any);

    const request = createMockRequest("/api/chat/conversations/conv-1", {
      method: "PATCH",
      body: { status: "resolved" },
    });
    const response = await updateConversation(request, createMockParams({ id: "conv-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.status).toBe("resolved");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/chat/conversations/missing", {
      method: "PATCH",
      body: { status: "closed" },
    });
    const response = await updateConversation(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should update assigneeId", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(sampleConversation as any);
    mockPrisma.chatConversation.update.mockResolvedValue({
      ...sampleConversation,
      assigneeId: "user-1",
    } as any);

    const request = createMockRequest("/api/chat/conversations/conv-1", {
      method: "PATCH",
      body: { assigneeId: "user-1" },
    });
    const response = await updateConversation(request, createMockParams({ id: "conv-1" }));

    expect(response.status).toBe(200);
  });
});
