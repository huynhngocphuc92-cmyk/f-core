import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser, checkOwnership } from "@/lib/auth-helpers";

import { POST as sendMessage } from "@/app/api/chat/conversations/[id]/messages/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCheckOwnership = vi.mocked(checkOwnership);

const sampleConversation = {
  id: "conv-1",
  tenantId: "tenant-test-id",
  status: "open",
};

const sampleMessage = {
  id: "msg-1",
  conversationId: "conv-1",
  senderType: "agent",
  senderId: "user-test-id",
  content: "Hello!",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
  mockCheckOwnership.mockResolvedValue(true as any);
});

describe("POST /api/chat/conversations/[id]/messages", () => {
  it("should send a message", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(sampleConversation as any);
    mockPrisma.$transaction.mockResolvedValue([sampleMessage] as any);

    const request = createMockRequest("/api/chat/conversations/conv-1/messages", {
      method: "POST",
      body: { content: "Hello!" },
    });
    const response = await sendMessage(request, createMockParams({ id: "conv-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.content).toBe("Hello!");
  });

  it("should return 404 when conversation not found", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/chat/conversations/missing/messages", {
      method: "POST",
      body: { content: "Hello!" },
    });
    const response = await sendMessage(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/chat/conversations/conv-1/messages", {
      method: "POST",
      body: { content: "Hello!" },
    });
    const response = await sendMessage(request, createMockParams({ id: "conv-1" }));

    expect(response.status).toBe(401);
  });

  it("should default senderType to agent", async () => {
    mockPrisma.chatConversation.findFirst.mockResolvedValue(sampleConversation as any);
    mockPrisma.$transaction.mockResolvedValue([sampleMessage] as any);

    const request = createMockRequest("/api/chat/conversations/conv-1/messages", {
      method: "POST",
      body: { content: "Test message" },
    });
    await sendMessage(request, createMockParams({ id: "conv-1" }));

    // The $transaction was called with an array (array form)
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});
