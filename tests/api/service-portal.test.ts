import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { issueCustomerPortalToken } from "@/lib/customer-portal-token";
import { POST as issueAccess } from "@/app/api/service/portal/access/route";
import {
  GET as listPortalTickets,
  POST as createPortalTicket,
} from "@/app/api/service/portal/tickets/route";
import { GET as getPortalTicket } from "@/app/api/service/portal/tickets/[id]/route";
import { POST as replyPortalTicket } from "@/app/api/service/portal/tickets/[id]/reply/route";
import { resetServiceRoutingStoreForTests } from "@/lib/service-routing-store";

const mockPrisma = vi.mocked(prisma);

const TENANT_ID = "tenant-test-id";
const CONTACT_ID = "contact-1";
const CONTACT_EMAIL = "contact@example.com";

function makeToken() {
  return issueCustomerPortalToken({
    tenantId: TENANT_ID,
    contactId: CONTACT_ID,
    email: CONTACT_EMAIL,
    expiresInMinutes: 120,
  }).token;
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetServiceRoutingStoreForTests();

  mockPrisma.contact.findFirst.mockResolvedValue({
    id: CONTACT_ID,
    tenantId: TENANT_ID,
    email: CONTACT_EMAIL,
    firstName: "Portal",
    lastName: "User",
  } as any);
});

describe("service portal API", () => {
  it("issues portal access token for contact", async () => {
    const response = await issueAccess(
      createMockRequest("/api/service/portal/access", {
        method: "POST",
        body: {
          tenantId: TENANT_ID,
          email: CONTACT_EMAIL,
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.token).toBeTypeOf("string");
    expect(body.portalPath).toContain("/portal/tickets?token=");
  });

  it("lists contact-scoped portal tickets", async () => {
    const token = makeToken();

    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "ticket-1",
        tenantId: TENANT_ID,
        contactId: CONTACT_ID,
        subject: "Portal issue",
        description: "Need help",
        category: "support",
        priority: "high",
        status: "open",
        source: "web",
        assigneeId: null,
        assignee: null,
        company: null,
        dueDate: null,
        createdAt: new Date("2026-02-14T10:00:00.000Z"),
        updatedAt: new Date("2026-02-14T11:00:00.000Z"),
        deletedAt: null,
      },
    ] as any);
    mockPrisma.ticket.count.mockResolvedValue(1);

    const response = await listPortalTickets(
      createMockRequest("/api/service/portal/tickets", {
        searchParams: { token },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].subject).toBe("Portal issue");
  });

  it("creates portal ticket with scoped contact", async () => {
    const token = makeToken();

    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.ticket.create.mockResolvedValue({
      id: "ticket-2",
      tenantId: TENANT_ID,
      contactId: CONTACT_ID,
      subject: "New portal ticket",
      description: "The app is down",
      category: "support",
      priority: "medium",
      status: "open",
      source: "web",
      assigneeId: null,
      assignee: null,
      company: null,
      dueDate: null,
      createdAt: new Date("2026-02-14T10:00:00.000Z"),
      updatedAt: new Date("2026-02-14T11:00:00.000Z"),
      deletedAt: null,
    } as any);

    const response = await createPortalTicket(
      createMockRequest("/api/service/portal/tickets", {
        method: "POST",
        searchParams: { token },
        body: {
          subject: "New portal ticket",
          description: "The app is down",
        },
      })
    );

    expect(response.status).toBe(201);
    const createCall = mockPrisma.ticket.create.mock.calls[0][0];
    expect(createCall?.data.contactId).toBe(CONTACT_ID);
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("gets portal ticket detail and replies", async () => {
    const token = makeToken();

    mockPrisma.ticket.findFirst.mockResolvedValue({
      id: "ticket-3",
      tenantId: TENANT_ID,
      contactId: CONTACT_ID,
      subject: "Detail ticket",
      description: "Issue details",
      category: "support",
      priority: "medium",
      status: "open",
      source: "web",
      assigneeId: null,
      assignee: null,
      company: null,
      dueDate: null,
      createdAt: new Date("2026-02-14T10:00:00.000Z"),
      updatedAt: new Date("2026-02-14T11:00:00.000Z"),
      deletedAt: null,
    } as any);

    mockPrisma.activity.findMany.mockResolvedValue([
      {
        id: "note-1",
        subject: "Customer portal reply",
        body: "Any update?",
        metadata: { portalTicketId: "ticket-3", source: "customer_portal" },
        createdAt: new Date("2026-02-14T12:00:00.000Z"),
      },
    ] as any);

    const response = await getPortalTicket(
      createMockRequest("/api/service/portal/tickets/ticket-3", {
        searchParams: { token },
      }),
      createMockParams({ id: "ticket-3" })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.ticket.id).toBe("ticket-3");
    expect(body.replies).toHaveLength(1);
  });

  it("adds customer reply to portal ticket", async () => {
    const token = makeToken();

    mockPrisma.ticket.findFirst.mockResolvedValue({
      id: "ticket-4",
      status: "open",
    } as any);

    mockPrisma.activity.create.mockResolvedValue({
      id: "note-2",
      body: "Please help",
      createdAt: new Date("2026-02-14T12:00:00.000Z"),
      metadata: { portalTicketId: "ticket-4" },
    } as any);

    const response = await replyPortalTicket(
      createMockRequest("/api/service/portal/tickets/ticket-4/reply", {
        method: "POST",
        searchParams: { token },
        body: { message: "Please help" },
      }),
      createMockParams({ id: "ticket-4" })
    );

    expect(response.status).toBe(201);
    const createCall = mockPrisma.activity.create.mock.calls[0][0];
    expect(createCall?.data.metadata.portalTicketId).toBe("ticket-4");
    expect(createCall?.data.contactId).toBe(CONTACT_ID);
  });

  it("returns 401 when portal token is missing", async () => {
    const response = await listPortalTickets(
      createMockRequest("/api/service/portal/tickets")
    );

    expect(response.status).toBe(401);
  });
});
