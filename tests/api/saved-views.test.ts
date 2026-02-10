import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";

import { GET as listViews, POST as createView } from "@/app/api/saved-views/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

const sampleView = {
  id: "view-1",
  tenantId: TENANT_ID,
  userId: "user-test-id",
  user: { id: "user-test-id", name: "Test User", email: "test@example.com" },
  name: "My Open Deals",
  module: "deals",
  filters: [],
  columns: [],
  sortBy: "createdAt",
  sortOrder: "desc",
  isDefault: false,
  isShared: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/saved-views - List saved views
// =============================================================================
describe("GET /api/saved-views", () => {
  it("should return paginated saved views", async () => {
    mockPrisma.savedView.findMany.mockResolvedValue([sampleView]);
    mockPrisma.savedView.count.mockResolvedValue(1);

    const request = createMockRequest("/api/saved-views");
    const response = await listViews(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("My Open Deals");
  });

  it("should filter by module", async () => {
    mockPrisma.savedView.findMany.mockResolvedValue([]);
    mockPrisma.savedView.count.mockResolvedValue(0);

    const request = createMockRequest("/api/saved-views", {
      searchParams: { module: "contacts" },
    });
    await listViews(request);

    const findManyCall = mockPrisma.savedView.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      module: "contacts",
    });
  });
});

// =============================================================================
// POST /api/saved-views - Create saved view
// =============================================================================
describe("POST /api/saved-views", () => {
  it("should create a saved view", async () => {
    mockPrisma.savedView.create.mockResolvedValue(sampleView);

    const request = createMockRequest("/api/saved-views", {
      method: "POST",
      body: { name: "My Open Deals", module: "deals" },
    });
    const response = await createView(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("My Open Deals");
  });

  it("should unset other defaults when isDefault is true", async () => {
    mockPrisma.savedView.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.savedView.create.mockResolvedValue(sampleView);

    const request = createMockRequest("/api/saved-views", {
      method: "POST",
      body: { name: "Default View", module: "deals", isDefault: true },
    });
    await createView(request);

    expect(mockPrisma.savedView.updateMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, module: "deals", isDefault: true },
      data: { isDefault: false },
    });
  });

  it("should set userId from authenticated user", async () => {
    mockPrisma.savedView.create.mockResolvedValue(sampleView);

    const request = createMockRequest("/api/saved-views", {
      method: "POST",
      body: { name: "View", module: "contacts" },
    });
    await createView(request);

    const createCall = mockPrisma.savedView.create.mock.calls[0][0];
    expect(createCall?.data.userId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/saved-views", {
      method: "POST",
      body: { module: "deals" },
    });
    const response = await createView(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when module is missing", async () => {
    const request = createMockRequest("/api/saved-views", {
      method: "POST",
      body: { name: "View" },
    });
    const response = await createView(request);

    expect(response.status).toBe(400);
  });
});
