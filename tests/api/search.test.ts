import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as globalSearch } from "@/app/api/search/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("GET /api/search", () => {
  it("should return empty results when query is too short", async () => {
    const request = createMockRequest("/api/search", {
      searchParams: { q: "a" },
    });
    const response = await globalSearch(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.contacts).toEqual([]);
    expect(body.companies).toEqual([]);
    expect(body.deals).toEqual([]);
    expect(body.tickets).toEqual([]);
  });

  it("should return empty results when query is missing", async () => {
    const request = createMockRequest("/api/search");
    const response = await globalSearch(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.contacts).toEqual([]);
  });

  it("should search across all entity types", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([
      { id: "c-1", firstName: "John", lastName: "Doe", email: "john@test.com" },
    ] as any);
    mockPrisma.company.findMany.mockResolvedValue([
      { id: "co-1", name: "Acme", domain: "acme.com" },
    ] as any);
    mockPrisma.deal.findMany.mockResolvedValue([
      { id: "d-1", name: "Test Deal", amount: 5000, currency: "USD" },
    ] as any);
    mockPrisma.ticket.findMany.mockResolvedValue([
      { id: "t-1", subject: "Test Ticket", ticketNumber: 1001, status: "open", priority: "high" },
    ] as any);

    const request = createMockRequest("/api/search", {
      searchParams: { q: "test" },
    });
    const response = await globalSearch(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.contacts).toHaveLength(1);
    expect(body.contacts[0].type).toBe("contact");
    expect(body.companies).toHaveLength(1);
    expect(body.companies[0].type).toBe("company");
    expect(body.deals).toHaveLength(1);
    expect(body.deals[0].type).toBe("deal");
    expect(body.tickets).toHaveLength(1);
    expect(body.tickets[0].type).toBe("ticket");
  });

  it("should format contact names correctly", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([
      { id: "c-1", firstName: "Jane", lastName: "Smith", email: "jane@test.com" },
    ] as any);
    mockPrisma.company.findMany.mockResolvedValue([]);
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/search", {
      searchParams: { q: "jane" },
    });
    const response = await globalSearch(request);
    const body = await getResponseBody(response);

    expect(body.contacts[0].name).toBe("Jane Smith");
    expect(body.contacts[0].link).toBe("/contacts/c-1");
  });

  it("should use tenant ID for all queries", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([]);
    mockPrisma.company.findMany.mockResolvedValue([]);
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/search", {
      searchParams: { q: "test" },
    });
    await globalSearch(request);

    const contactCall = mockPrisma.contact.findMany.mock.calls[0][0];
    expect(contactCall?.where).toMatchObject({ tenantId: TENANT_ID });

    const companyCall = mockPrisma.company.findMany.mock.calls[0][0];
    expect(companyCall?.where).toMatchObject({ tenantId: TENANT_ID });

    const dealCall = mockPrisma.deal.findMany.mock.calls[0][0];
    expect(dealCall?.where).toMatchObject({ tenantId: TENANT_ID });

    const ticketCall = mockPrisma.ticket.findMany.mock.calls[0][0];
    expect(ticketCall?.where).toMatchObject({ tenantId: TENANT_ID });
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/search", {
      searchParams: { q: "test" },
    });
    const response = await globalSearch(request);

    expect(response.status).toBe(401);
  });
});
