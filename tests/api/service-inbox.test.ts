import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as getServiceInbox, POST as createServiceInbox } from "@/app/api/service/inbox/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("GET /api/service/inbox", () => {
  it("should return unified inbox from tickets, chats, and omnichannel threads", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "ticket-1",
        subject: "Ticket Subject",
        status: "open",
        priority: "high",
        assignee: null,
        contact: null,
        updatedAt: new Date("2026-02-14T10:00:00.000Z"),
        createdAt: new Date("2026-02-14T09:00:00.000Z"),
      },
    ] as any);
    mockPrisma.ticket.count.mockResolvedValue(1);

    mockPrisma.chatConversation.findMany.mockResolvedValue([
      {
        id: "chat-1",
        visitorName: "Jane Visitor",
        visitorEmail: "jane@example.com",
        status: "open",
        assignee: null,
        contact: null,
        lastMessageAt: new Date("2026-02-14T11:00:00.000Z"),
        updatedAt: new Date("2026-02-14T11:00:00.000Z"),
        createdAt: new Date("2026-02-14T08:00:00.000Z"),
      },
    ] as any);
    mockPrisma.chatConversation.count.mockResolvedValue(1);

    mockPrisma.serviceOmnichannelThread.findMany.mockResolvedValue([
      {
        id: "thread-1",
        tenantId: TENANT_ID,
        channel: "email",
        externalThreadId: "ext-email-1",
        subject: "Need pricing details",
        status: "open",
        priority: "medium",
        assigneeId: null,
        contactName: "Sam Buyer",
        contactEmail: "sam@example.com",
        messagePreview: "Can you share enterprise pricing?",
        metadata: {},
        lastMessageAt: new Date("2026-02-14T12:00:00.000Z"),
        createdAt: new Date("2026-02-14T07:30:00.000Z"),
        updatedAt: new Date("2026-02-14T12:00:00.000Z"),
      },
    ] as any);
    mockPrisma.serviceOmnichannelThread.count.mockResolvedValue(1);

    const response = await getServiceInbox(createMockRequest("/api/service/inbox"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.data[0].type).toBe("email");
    expect(body.data[1].type).toBe("chat");
    expect(body.data[2].type).toBe("ticket");
    expect(body.pagination.total).toBe(3);
  });

  it("should support channel=ticket filter", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([] as any);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const response = await getServiceInbox(
      createMockRequest("/api/service/inbox", {
        searchParams: { channel: "ticket" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(mockPrisma.chatConversation.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.serviceOmnichannelThread.findMany).not.toHaveBeenCalled();
    expect(body.data).toEqual([]);
  });

  it("should support external channel filters", async () => {
    mockPrisma.serviceOmnichannelThread.findMany.mockResolvedValue([] as any);
    mockPrisma.serviceOmnichannelThread.count.mockResolvedValue(0);

    const response = await getServiceInbox(
      createMockRequest("/api/service/inbox", {
        searchParams: { channel: "email", status: "open" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(mockPrisma.ticket.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.chatConversation.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.serviceOmnichannelThread.findMany).toHaveBeenCalled();

    const threadWhere = mockPrisma.serviceOmnichannelThread.findMany.mock.calls[0][0]?.where as any;
    expect(threadWhere.channel).toBe("email");
    expect(threadWhere.status).toBe("open");
    expect(body.data).toEqual([]);
  });

  it("should pass status and search filters to tickets query", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([] as any);
    mockPrisma.ticket.count.mockResolvedValue(0);
    mockPrisma.chatConversation.findMany.mockResolvedValue([] as any);
    mockPrisma.chatConversation.count.mockResolvedValue(0);

    await getServiceInbox(
      createMockRequest("/api/service/inbox", {
        searchParams: { status: "open", search: "login" },
      })
    );

    const ticketWhere = mockPrisma.ticket.findMany.mock.calls[0][0]?.where as any;
    expect(ticketWhere.status).toBe("open");
    expect(ticketWhere.OR).toBeDefined();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getServiceInbox(createMockRequest("/api/service/inbox"));
    expect(response.status).toBe(401);
  });
});

describe("POST /api/service/inbox", () => {
  it("creates a new omnichannel thread", async () => {
    mockPrisma.serviceOmnichannelThread.create.mockResolvedValue({
      id: "thread-1",
      tenantId: TENANT_ID,
      channel: "sms",
      externalThreadId: "sms-123",
      subject: "Need callback",
      status: "open",
      priority: "high",
      assigneeId: null,
      contactName: "Pat",
      contactEmail: "pat@example.com",
      messagePreview: "Please call me back",
      metadata: { source: "twilio" },
      lastMessageAt: new Date("2026-02-14T13:00:00.000Z"),
      createdAt: new Date("2026-02-14T13:00:00.000Z"),
      updatedAt: new Date("2026-02-14T13:00:00.000Z"),
    } as any);

    const response = await createServiceInbox(
      createMockRequest("/api/service/inbox", {
        method: "POST",
        body: {
          channel: "sms",
          externalThreadId: "sms-123",
          subject: "Need callback",
          priority: "high",
          contactName: "Pat",
          contactEmail: "pat@example.com",
          messagePreview: "Please call me back",
          metadata: { source: "twilio" },
          occurredAt: "2026-02-14T13:00:00.000Z",
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(mockPrisma.serviceOmnichannelThread.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          channel: "sms",
          subject: "Need callback",
        }),
      })
    );
    expect(body.data.type).toBe("sms");
    expect(body.data.channel).toBe("sms");
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await createServiceInbox(
      createMockRequest("/api/service/inbox", {
        method: "POST",
        body: {
          channel: "email",
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });
});
