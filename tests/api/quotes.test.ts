import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership, getCurrentUser } from "@/lib/auth-helpers";

import { GET as listQuotes, POST as createQuote } from "@/app/api/quotes/route";
import {
  GET as getQuote,
  PATCH as updateQuote,
  DELETE as deleteQuote,
} from "@/app/api/quotes/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

const sampleQuote = {
  id: "quote-1",
  tenantId: TENANT_ID,
  title: "Enterprise License",
  status: "draft",
  contactId: null,
  companyId: null,
  dealId: null,
  ownerId: "user-test-id",
  owner: { id: "user-test-id", name: "Test User" },
  contact: null,
  company: null,
  deal: null,
  lineItems: [
    { id: "li-1", name: "License", quantity: 1, unitPrice: 1000, discount: 0, total: 1000, orderIndex: 0 },
  ],
  _count: { lineItems: 1 },
  subtotal: 1000,
  total: 1000,
  currency: "USD",
  expiresAt: null,
  sentAt: null,
  approvedAt: null,
  paymentTerms: null,
  notes: null,
  terms: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/quotes - List quotes
// =============================================================================
describe("GET /api/quotes", () => {
  it("should return paginated quotes", async () => {
    mockPrisma.quote.findMany.mockResolvedValue([sampleQuote]);
    mockPrisma.quote.count.mockResolvedValue(1);

    const request = createMockRequest("/api/quotes");
    const response = await listQuotes(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Enterprise License");
  });

  it("should filter by status", async () => {
    mockPrisma.quote.findMany.mockResolvedValue([]);
    mockPrisma.quote.count.mockResolvedValue(0);

    const request = createMockRequest("/api/quotes", {
      searchParams: { status: "pending" },
    });
    await listQuotes(request);

    const findManyCall = mockPrisma.quote.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      status: "pending",
    });
  });

  it("should filter by search", async () => {
    mockPrisma.quote.findMany.mockResolvedValue([]);
    mockPrisma.quote.count.mockResolvedValue(0);

    const request = createMockRequest("/api/quotes", {
      searchParams: { search: "enterprise" },
    });
    await listQuotes(request);

    const findManyCall = mockPrisma.quote.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          title: { contains: "enterprise", mode: "insensitive" },
        }),
      ]),
    });
  });
});

// =============================================================================
// POST /api/quotes - Create quote with line items
// =============================================================================
describe("POST /api/quotes", () => {
  it("should create a quote with line items", async () => {
    mockPrisma.quote.create.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes", {
      method: "POST",
      body: {
        title: "Enterprise License",
        lineItems: [{ name: "License", quantity: 1, unitPrice: 1000 }],
      },
    });
    const response = await createQuote(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.title).toBe("Enterprise License");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "created",
          entity: "quote",
          entityId: "quote-1",
        }),
      })
    );
  });

  it("should set ownerId from authenticated user", async () => {
    mockPrisma.quote.create.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes", {
      method: "POST",
      body: {
        title: "Quote",
        lineItems: [{ name: "Item", quantity: 1, unitPrice: 100 }],
      },
    });
    await createQuote(request);

    const createCall = mockPrisma.quote.create.mock.calls[0][0];
    expect(createCall?.data.ownerId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should default currency to USD", async () => {
    mockPrisma.quote.create.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes", {
      method: "POST",
      body: {
        title: "Quote",
        lineItems: [{ name: "Item", quantity: 1, unitPrice: 100 }],
      },
    });
    await createQuote(request);

    const createCall = mockPrisma.quote.create.mock.calls[0][0];
    expect(createCall?.data.currency).toBe("USD");
  });

  it("should return 400 when title is missing", async () => {
    const request = createMockRequest("/api/quotes", {
      method: "POST",
      body: {
        lineItems: [{ name: "Item", quantity: 1, unitPrice: 100 }],
      },
    });
    const response = await createQuote(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when lineItems is empty", async () => {
    const request = createMockRequest("/api/quotes", {
      method: "POST",
      body: { title: "Quote", lineItems: [] },
    });
    const response = await createQuote(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when lineItems is missing", async () => {
    const request = createMockRequest("/api/quotes", {
      method: "POST",
      body: { title: "Quote" },
    });
    const response = await createQuote(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/quotes/[id] - Get single quote
// =============================================================================
describe("GET /api/quotes/[id]", () => {
  it("should return quote with line items", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes/quote-1");
    const params = createMockParams({ id: "quote-1" });
    const response = await getQuote(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.title).toBe("Enterprise License");
  });

  it("should return 404 when quote not found", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/quotes/nonexistent");
    const params = createMockParams({ id: "nonexistent" });
    const response = await getQuote(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes/quote-1");
    const params = createMockParams({ id: "quote-1" });
    await getQuote(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/quotes/[id] - Update quote
// =============================================================================
describe("PATCH /api/quotes/[id]", () => {
  it("should update quote fields", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(sampleQuote);
    const updated = { ...sampleQuote, title: "Updated Quote" };
    mockPrisma.quote.update.mockResolvedValue(updated);

    const request = createMockRequest("/api/quotes/quote-1", {
      method: "PATCH",
      body: { title: "Updated Quote" },
    });
    const params = createMockParams({ id: "quote-1" });
    const response = await updateQuote(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.title).toBe("Updated Quote");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "quote",
          entityId: "quote-1",
        }),
      })
    );
  });

  it("should set sentAt when status changes from draft to pending", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue({ ...sampleQuote, status: "draft" });
    mockPrisma.quote.update.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes/quote-1", {
      method: "PATCH",
      body: { status: "pending" },
    });
    const params = createMockParams({ id: "quote-1" });
    await updateQuote(request, params);

    const updateCall = mockPrisma.quote.update.mock.calls[0][0];
    expect(updateCall?.data).toHaveProperty("sentAt");
  });

  it("should set approvedAt when status changes to approved", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue({ ...sampleQuote, status: "pending" });
    mockPrisma.quote.update.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes/quote-1", {
      method: "PATCH",
      body: { status: "approved" },
    });
    const params = createMockParams({ id: "quote-1" });
    await updateQuote(request, params);

    const updateCall = mockPrisma.quote.update.mock.calls[0][0];
    expect(updateCall?.data).toHaveProperty("approvedAt");
  });

  it("should replace line items when provided", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(sampleQuote);
    mockPrisma.quoteLineItem.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.quoteLineItem.createMany.mockResolvedValue({ count: 2 });
    mockPrisma.quote.update.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes/quote-1", {
      method: "PATCH",
      body: {
        lineItems: [
          { name: "New Item 1", quantity: 2, unitPrice: 500 },
          { name: "New Item 2", quantity: 1, unitPrice: 300 },
        ],
      },
    });
    const params = createMockParams({ id: "quote-1" });
    await updateQuote(request, params);

    expect(mockPrisma.quoteLineItem.deleteMany).toHaveBeenCalledWith({
      where: { quoteId: "quote-1" },
    });
    expect(mockPrisma.quoteLineItem.createMany).toHaveBeenCalled();
  });

  it("should return 404 when quote not found", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/quotes/nonexistent", {
      method: "PATCH",
      body: { title: "Updated" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await updateQuote(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/quotes/[id] - Soft delete quote
// =============================================================================
describe("DELETE /api/quotes/[id]", () => {
  it("should soft delete quote", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(sampleQuote);
    mockPrisma.quote.update.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes/quote-1", { method: "DELETE" });
    const params = createMockParams({ id: "quote-1" });
    const response = await deleteQuote(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.quote.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "deleted",
          entity: "quote",
          entityId: "quote-1",
        }),
      })
    );
  });

  it("should return 404 when quote not found", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/quotes/nonexistent", { method: "DELETE" });
    const params = createMockParams({ id: "nonexistent" });
    const response = await deleteQuote(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership before deleting", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(sampleQuote);
    mockPrisma.quote.update.mockResolvedValue(sampleQuote);

    const request = createMockRequest("/api/quotes/quote-1", { method: "DELETE" });
    const params = createMockParams({ id: "quote-1" });
    await deleteQuote(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
