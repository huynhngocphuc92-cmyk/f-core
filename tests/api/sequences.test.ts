import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership, getCurrentUser } from "@/lib/auth-helpers";

import { GET as listSequences, POST as createSequence } from "@/app/api/sequences/route";
import {
  GET as getSequence,
  PATCH as updateSequence,
  DELETE as deleteSequence,
} from "@/app/api/sequences/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

const sampleSequence = {
  id: "seq-1",
  tenantId: TENANT_ID,
  name: "Onboarding Sequence",
  description: "New user onboarding emails",
  status: "active",
  steps: [],
  ownerId: "user-test-id",
  owner: { id: "user-test-id", name: "Test User" },
  enrollments: [],
  _count: { enrollments: 5 },
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
// GET /api/sequences - List sequences
// =============================================================================
describe("GET /api/sequences", () => {
  it("should return paginated sequences", async () => {
    mockPrisma.sequence.findMany.mockResolvedValue([sampleSequence]);
    mockPrisma.sequence.count.mockResolvedValue(1);

    const request = createMockRequest("/api/sequences");
    const response = await listSequences(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Onboarding Sequence");
  });

  it("should filter by status", async () => {
    mockPrisma.sequence.findMany.mockResolvedValue([]);
    mockPrisma.sequence.count.mockResolvedValue(0);

    const request = createMockRequest("/api/sequences", {
      searchParams: { status: "active" },
    });
    await listSequences(request);

    const findManyCall = mockPrisma.sequence.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      status: "active",
    });
  });

  it("should filter by search", async () => {
    mockPrisma.sequence.findMany.mockResolvedValue([]);
    mockPrisma.sequence.count.mockResolvedValue(0);

    const request = createMockRequest("/api/sequences", {
      searchParams: { search: "onboarding" },
    });
    await listSequences(request);

    const findManyCall = mockPrisma.sequence.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          name: { contains: "onboarding", mode: "insensitive" },
        }),
      ]),
    });
  });
});

// =============================================================================
// POST /api/sequences - Create sequence
// =============================================================================
describe("POST /api/sequences", () => {
  it("should create a sequence", async () => {
    mockPrisma.sequence.create.mockResolvedValue(sampleSequence);

    const request = createMockRequest("/api/sequences", {
      method: "POST",
      body: { name: "Onboarding Sequence" },
    });
    const response = await createSequence(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Onboarding Sequence");
  });

  it("should set ownerId from authenticated user", async () => {
    mockPrisma.sequence.create.mockResolvedValue(sampleSequence);

    const request = createMockRequest("/api/sequences", {
      method: "POST",
      body: { name: "Test Sequence" },
    });
    await createSequence(request);

    const createCall = mockPrisma.sequence.create.mock.calls[0][0];
    expect(createCall?.data.ownerId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/sequences", {
      method: "POST",
      body: { description: "No name" },
    });
    const response = await createSequence(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/sequences/[id] - Get single sequence
// =============================================================================
describe("GET /api/sequences/[id]", () => {
  it("should return sequence with enrollments", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(sampleSequence);

    const request = createMockRequest("/api/sequences/seq-1");
    const params = createMockParams({ id: "seq-1" });
    const response = await getSequence(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Onboarding Sequence");
  });

  it("should return 404 when sequence not found", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/sequences/nonexistent");
    const params = createMockParams({ id: "nonexistent" });
    const response = await getSequence(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(sampleSequence);

    const request = createMockRequest("/api/sequences/seq-1");
    const params = createMockParams({ id: "seq-1" });
    await getSequence(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/sequences/[id] - Update sequence
// =============================================================================
describe("PATCH /api/sequences/[id]", () => {
  it("should update sequence", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(sampleSequence);
    const updated = { ...sampleSequence, name: "Updated Sequence" };
    mockPrisma.sequence.update.mockResolvedValue(updated);

    const request = createMockRequest("/api/sequences/seq-1", {
      method: "PATCH",
      body: { name: "Updated Sequence" },
    });
    const params = createMockParams({ id: "seq-1" });
    const response = await updateSequence(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Sequence");
  });

  it("should return 404 when sequence not found", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/sequences/nonexistent", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await updateSequence(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/sequences/[id] - Soft delete sequence
// =============================================================================
describe("DELETE /api/sequences/[id]", () => {
  it("should soft delete sequence and set status=draft", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(sampleSequence);
    mockPrisma.sequence.update.mockResolvedValue(sampleSequence);

    const request = createMockRequest("/api/sequences/seq-1", { method: "DELETE" });
    const params = createMockParams({ id: "seq-1" });
    const response = await deleteSequence(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.sequence.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
    expect(updateCall?.data.status).toBe("draft");
  });

  it("should return 404 when sequence not found", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/sequences/nonexistent", { method: "DELETE" });
    const params = createMockParams({ id: "nonexistent" });
    const response = await deleteSequence(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership before deleting", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(sampleSequence);
    mockPrisma.sequence.update.mockResolvedValue(sampleSequence);

    const request = createMockRequest("/api/sequences/seq-1", { method: "DELETE" });
    const params = createMockParams({ id: "seq-1" });
    await deleteSequence(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
