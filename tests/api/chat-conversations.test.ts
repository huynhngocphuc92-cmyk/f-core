import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as listConversations } from "@/app/api/chat/conversations/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const sampleConversation = {
  id: "conv-1",
  tenantId: "tenant-test-id",
  status: "open",
  visitorName: "John",
  visitorEmail: "john@example.com",
  widget: { id: "w-1", name: "Support", color: "#000" },
  assignee: null,
  contact: null,
  lastMessageAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("GET /api/chat/conversations", () => {
  it("should return paginated conversations", async () => {
    mockPrisma.chatConversation.findMany.mockResolvedValue([sampleConversation] as any);
    mockPrisma.chatConversation.count.mockResolvedValue(1);

    const request = createMockRequest("/api/chat/conversations");
    const response = await listConversations(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should filter by status", async () => {
    mockPrisma.chatConversation.findMany.mockResolvedValue([]);
    mockPrisma.chatConversation.count.mockResolvedValue(0);

    const request = createMockRequest("/api/chat/conversations", {
      searchParams: { status: "open" },
    });
    await listConversations(request);

    const where = mockPrisma.chatConversation.findMany.mock.calls[0][0]?.where as any;
    expect(where.status).toBe("open");
  });

  it("should support search", async () => {
    mockPrisma.chatConversation.findMany.mockResolvedValue([]);
    mockPrisma.chatConversation.count.mockResolvedValue(0);

    const request = createMockRequest("/api/chat/conversations", {
      searchParams: { search: "john" },
    });
    await listConversations(request);

    const where = mockPrisma.chatConversation.findMany.mock.calls[0][0]?.where as any;
    expect(where.OR).toBeDefined();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/chat/conversations");
    const response = await listConversations(request);

    expect(response.status).toBe(401);
  });
});
