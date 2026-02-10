import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import { GET as listDeals, POST as createDeal } from "@/app/api/deals/route";
import {
  GET as getDeal,
  PATCH as updateDeal,
  DELETE as deleteDeal,
} from "@/app/api/deals/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const sampleDeal = {
  id: "deal-1",
  tenantId: TENANT_ID,
  name: "Big Deal",
  description: null,
  amount: 50000,
  currency: "USD",
  closeDate: null,
  pipelineId: "pipeline-1",
  stageId: "stage-1",
  probability: 50,
  ownerId: null,
  owner: null,
  dealType: null,
  priority: null,
  closedAt: null,
  closedReason: null,
  properties: {},
  stage: { id: "stage-1", name: "Qualification", color: "#blue", probability: 20 },
  pipeline: { id: "pipeline-1", name: "Sales Pipeline" },
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
});

// =============================================================================
// GET /api/deals - List deals
// =============================================================================
describe("GET /api/deals", () => {
  it("should return paginated deals", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([sampleDeal]);
    mockPrisma.deal.count.mockResolvedValue(1);

    const request = createMockRequest("/api/deals");
    const response = await listDeals(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Big Deal");
  });

  it("should filter by pipelineId", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.deal.count.mockResolvedValue(0);

    const request = createMockRequest("/api/deals", {
      searchParams: { pipelineId: "pipeline-1" },
    });
    await listDeals(request);

    const findManyCall = mockPrisma.deal.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      pipelineId: "pipeline-1",
    });
  });

  it("should filter by stageId", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.deal.count.mockResolvedValue(0);

    const request = createMockRequest("/api/deals", {
      searchParams: { stageId: "stage-1" },
    });
    await listDeals(request);

    const findManyCall = mockPrisma.deal.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      stageId: "stage-1",
    });
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/deals");
    const response = await listDeals(request);

    expect(response.status).toBe(401);
  });
});

// =============================================================================
// POST /api/deals - Create deal
// =============================================================================
describe("POST /api/deals", () => {
  it("should create a deal with valid data", async () => {
    mockPrisma.deal.create.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals", {
      method: "POST",
      body: { name: "Big Deal", pipelineId: "pipeline-1", stageId: "stage-1", amount: 50000 },
    });
    const response = await createDeal(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Big Deal");
  });

  it("should return 400 when required fields are missing", async () => {
    const request = createMockRequest("/api/deals", {
      method: "POST",
      body: { name: "Deal Without Pipeline" },
    });
    const response = await createDeal(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/pipelineId.*stageId/i);
  });

  it("should default currency to USD", async () => {
    mockPrisma.deal.create.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals", {
      method: "POST",
      body: { name: "Deal", pipelineId: "p-1", stageId: "s-1" },
    });
    await createDeal(request);

    const createCall = mockPrisma.deal.create.mock.calls[0][0];
    expect(createCall?.data.currency).toBe("USD");
  });

  it("should use tenant ID from auth", async () => {
    mockPrisma.deal.create.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals", {
      method: "POST",
      body: { name: "Deal", pipelineId: "p-1", stageId: "s-1", tenantId: "evil" },
    });
    await createDeal(request);

    const createCall = mockPrisma.deal.create.mock.calls[0][0];
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });
});

// =============================================================================
// GET /api/deals/[id] - Get single deal
// =============================================================================
describe("GET /api/deals/[id]", () => {
  it("should return deal with associations", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals/deal-1");
    const params = createMockParams({ id: "deal-1" });
    const response = await getDeal(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe("deal-1");
  });

  it("should return 404 when deal not found", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/deals/nonexistent");
    const params = createMockParams({ id: "nonexistent" });
    const response = await getDeal(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals/deal-1");
    const params = createMockParams({ id: "deal-1" });
    await getDeal(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/deals/[id] - Update deal
// =============================================================================
describe("PATCH /api/deals/[id]", () => {
  it("should update deal fields", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(sampleDeal);
    const updated = { ...sampleDeal, amount: 75000 };
    mockPrisma.deal.update.mockResolvedValue(updated);

    const request = createMockRequest("/api/deals/deal-1", {
      method: "PATCH",
      body: { amount: 75000 },
    });
    const params = createMockParams({ id: "deal-1" });
    const response = await updateDeal(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.amount).toBe(75000);
  });

  it("should set closedAt when closedReason is provided", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(sampleDeal);
    mockPrisma.deal.update.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals/deal-1", {
      method: "PATCH",
      body: { closedReason: "won" },
    });
    const params = createMockParams({ id: "deal-1" });
    await updateDeal(request, params);

    const updateCall = mockPrisma.deal.update.mock.calls[0][0];
    expect(updateCall?.data.closedReason).toBe("won");
    expect(updateCall?.data.closedAt).toBeInstanceOf(Date);
  });

  it("should return 404 when deal not found", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/deals/nonexistent", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await updateDeal(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/deals/[id] - Soft delete deal
// =============================================================================
describe("DELETE /api/deals/[id]", () => {
  it("should soft delete deal", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(sampleDeal);
    mockPrisma.deal.update.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals/deal-1", { method: "DELETE" });
    const params = createMockParams({ id: "deal-1" });
    const response = await deleteDeal(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.deal.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
  });

  it("should return 404 when deal not found", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/deals/nonexistent", { method: "DELETE" });
    const params = createMockParams({ id: "nonexistent" });
    const response = await deleteDeal(request, params);

    expect(response.status).toBe(404);
  });

  it("should verify tenant ownership before deleting", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue(sampleDeal);
    mockPrisma.deal.update.mockResolvedValue(sampleDeal);

    const request = createMockRequest("/api/deals/deal-1", { method: "DELETE" });
    const params = createMockParams({ id: "deal-1" });
    await deleteDeal(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
