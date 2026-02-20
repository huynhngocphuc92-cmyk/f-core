import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership, getCurrentUser } from "@/lib/auth-helpers";
import {
  resetServiceRoutingStoreForTests,
  setServiceRoutingPolicy,
} from "@/lib/service-routing-store";

import { GET as listTickets, POST as createTicket } from "@/app/api/tickets/route";
import {
  GET as getTicket,
  PATCH as updateTicket,
  DELETE as deleteTicket,
} from "@/app/api/tickets/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

const sampleTicket = {
  id: "ticket-1",
  tenantId: TENANT_ID,
  subject: "Login button broken",
  description: "Cannot click the login button on mobile",
  category: "bug",
  status: "open",
  priority: "high",
  source: "web",
  contactId: null,
  companyId: null,
  assigneeId: null,
  assignee: null,
  createdById: "user-test-id",
  createdBy: { id: "user-test-id", name: "Test User" },
  contact: null,
  company: null,
  dueDate: null,
  tags: [],
  resolvedAt: null,
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(async () => {
  vi.clearAllMocks();
  await resetServiceRoutingStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/tickets - List tickets
// =============================================================================
describe("GET /api/tickets", () => {
  it("should return paginated tickets", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([sampleTicket]);
    mockPrisma.ticket.count.mockResolvedValue(1);

    const request = createMockRequest("/api/tickets");
    const response = await listTickets(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].subject).toBe("Login button broken");
    expect(body.data[0].sla).toBeDefined();
  });

  it("should filter by status", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const request = createMockRequest("/api/tickets", {
      searchParams: { status: "open" },
    });
    await listTickets(request);

    const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      status: "open",
    });
  });

  it("should filter by priority", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const request = createMockRequest("/api/tickets", {
      searchParams: { priority: "urgent" },
    });
    await listTickets(request);

    const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      priority: "urgent",
    });
  });

  it("should pass search filter", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const request = createMockRequest("/api/tickets", {
      searchParams: { search: "login" },
    });
    await listTickets(request);

    const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          subject: { contains: "login", mode: "insensitive" },
        }),
      ]),
    });
  });
});

// =============================================================================
// POST /api/tickets - Create ticket (with Zod validation)
// =============================================================================
describe("POST /api/tickets", () => {
  it("should create a ticket with valid data", async () => {
    mockPrisma.ticket.create.mockResolvedValue(sampleTicket);

    const request = createMockRequest("/api/tickets", {
      method: "POST",
      body: {
        subject: "Login button broken",
        category: "bug",
        priority: "high",
      },
    });
    const response = await createTicket(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.subject).toBe("Login button broken");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "created",
          entity: "ticket",
          entityId: "ticket-1",
        }),
      })
    );
  });

  it("should return 400 when subject is missing (Zod validation)", async () => {
    const request = createMockRequest("/api/tickets", {
      method: "POST",
      body: { category: "bug" },
    });
    const response = await createTicket(request);

    expect(response.status).toBe(400);
  });

  it("should set createdById from authenticated user", async () => {
    mockPrisma.ticket.create.mockResolvedValue(sampleTicket);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/tickets", {
      method: "POST",
      body: { subject: "Test ticket" },
    });
    await createTicket(request);

    const createCall = mockPrisma.ticket.create.mock.calls[0][0];
    expect(createCall?.data.createdById).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
    expect(createCall?.data.dueDate).toBeInstanceOf(Date);
  });

  it("should auto-assign based on routing rules when assignee is not provided", async () => {
    await setServiceRoutingPolicy(TENANT_ID, {
      teams: [{ id: "urgent-team", name: "Urgent Team", assigneeIds: ["agent-1"] }],
      businessHours: {
        timezone: "UTC",
        weekdays: [1, 2, 3, 4, 5],
        startHour: 0,
        endHour: 24,
      },
      priorityRules: {
        low: { teamId: "urgent-team" },
        medium: { teamId: "urgent-team" },
        high: { teamId: "urgent-team" },
        urgent: { teamId: "urgent-team" },
      },
      channelRules: {
        email: { teamId: null },
        phone: { teamId: null },
        web: { teamId: null },
        chat: { teamId: null },
      },
      offHoursTeamId: null,
      fallbackAssigneeId: null,
    });

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "agent-1",
        role: "member",
        availability: [],
      },
    ] as any);
    mockPrisma.ticket.create.mockResolvedValue({
      ...sampleTicket,
      assigneeId: "agent-1",
      assignee: { id: "agent-1", name: "Agent One" },
    } as any);

    const request = createMockRequest("/api/tickets", {
      method: "POST",
      body: { subject: "Urgent issue", priority: "urgent", source: "web" },
    });

    const response = await createTicket(request);
    expect(response.status).toBe(201);

    const createCall = mockPrisma.ticket.create.mock.calls[0][0];
    expect(createCall?.data.assigneeId).toBe("agent-1");
  });

  it("should return 400 for invalid category", async () => {
    const request = createMockRequest("/api/tickets", {
      method: "POST",
      body: { subject: "Test", category: "invalid_category" },
    });
    const response = await createTicket(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/tickets/[id] - Get single ticket
// =============================================================================
describe("GET /api/tickets/[id]", () => {
  it("should return ticket", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(sampleTicket);

    const request = createMockRequest("/api/tickets/ticket-1");
    const params = createMockParams({ id: "ticket-1" });
    const response = await getTicket(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe("ticket-1");
    expect(body.sla).toBeDefined();
  });

  it("should return 404 when ticket not found", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/tickets/nonexistent");
    const params = createMockParams({ id: "nonexistent" });
    const response = await getTicket(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(sampleTicket);

    const request = createMockRequest("/api/tickets/ticket-1");
    const params = createMockParams({ id: "ticket-1" });
    await getTicket(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/tickets/[id] - Update ticket
// =============================================================================
describe("PATCH /api/tickets/[id]", () => {
  it("should update ticket fields", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(sampleTicket);
    const updated = { ...sampleTicket, priority: "urgent" };
    mockPrisma.ticket.update.mockResolvedValue(updated);

    const request = createMockRequest("/api/tickets/ticket-1", {
      method: "PATCH",
      body: { priority: "urgent" },
    });
    const params = createMockParams({ id: "ticket-1" });
    const response = await updateTicket(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.priority).toBe("urgent");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "ticket",
          entityId: "ticket-1",
        }),
      })
    );
  });

  it("should set resolvedAt when status changes to resolved", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(sampleTicket);
    mockPrisma.ticket.update.mockResolvedValue(sampleTicket);

    const request = createMockRequest("/api/tickets/ticket-1", {
      method: "PATCH",
      body: { status: "resolved" },
    });
    const params = createMockParams({ id: "ticket-1" });
    await updateTicket(request, params);

    const updateCall = mockPrisma.ticket.update.mock.calls[0][0];
    expect(updateCall?.data).toHaveProperty("resolvedAt");
    expect(updateCall?.data).toHaveProperty("firstResponseAt");
  });

  it("should create survey invitation activity when resolving ticket with contact", async () => {
    const withContact = { ...sampleTicket, contactId: "contact-1", status: "open" };
    mockPrisma.ticket.findFirst.mockResolvedValue(withContact as any);
    mockPrisma.ticket.update.mockResolvedValue({ ...withContact, status: "resolved" } as any);
    mockPrisma.contact.findFirst.mockResolvedValue({
      id: "contact-1",
      email: "contact@example.com",
    } as any);
    mockPrisma.activity.findMany.mockResolvedValue([]);
    mockPrisma.activity.create.mockResolvedValue({ id: "activity-1" } as any);

    const request = createMockRequest("/api/tickets/ticket-1", {
      method: "PATCH",
      body: { status: "resolved" },
    });
    const params = createMockParams({ id: "ticket-1" });
    const response = await updateTicket(request, params);

    expect(response.status).toBe(200);
    expect(mockPrisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contactId: "contact-1",
          metadata: expect.objectContaining({
            source: "service_survey",
            status: "sent",
            ticketId: "ticket-1",
          }),
        }),
      })
    );
  });

  it("should set closedAt when status changes to closed", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(sampleTicket);
    mockPrisma.ticket.update.mockResolvedValue(sampleTicket);

    const request = createMockRequest("/api/tickets/ticket-1", {
      method: "PATCH",
      body: { status: "closed" },
    });
    const params = createMockParams({ id: "ticket-1" });
    await updateTicket(request, params);

    const updateCall = mockPrisma.ticket.update.mock.calls[0][0];
    expect(updateCall?.data).toHaveProperty("closedAt");
  });

  it("should return 404 when ticket not found", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/tickets/nonexistent", {
      method: "PATCH",
      body: { priority: "low" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await updateTicket(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/tickets/[id] - Soft delete ticket
// =============================================================================
describe("DELETE /api/tickets/[id]", () => {
  it("should soft delete ticket", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(sampleTicket);
    mockPrisma.ticket.update.mockResolvedValue(sampleTicket);

    const request = createMockRequest("/api/tickets/ticket-1", { method: "DELETE" });
    const params = createMockParams({ id: "ticket-1" });
    const response = await deleteTicket(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.ticket.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "deleted",
          entity: "ticket",
          entityId: "ticket-1",
        }),
      })
    );
  });

  it("should return 404 when ticket not found", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/tickets/nonexistent", { method: "DELETE" });
    const params = createMockParams({ id: "nonexistent" });
    const response = await deleteTicket(request, params);

    expect(response.status).toBe(404);
  });
});
