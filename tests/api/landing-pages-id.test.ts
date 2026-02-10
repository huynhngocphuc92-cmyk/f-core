import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import {
  GET as getPage,
  PATCH as updatePage,
  DELETE as deletePage,
} from "@/app/api/landing-pages/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const samplePage = {
  id: "page-1",
  tenantId: TENANT_ID,
  name: "Product Launch",
  slug: "product-launch",
  description: null,
  contentHtml: "<h1>Welcome</h1>",
  contentJson: {},
  templateId: null,
  metaTitle: null,
  metaDescription: null,
  formId: null,
  status: "draft",
  ownerId: "user-test-id",
  owner: { id: "user-test-id", name: "Test User", email: "test@example.com" },
  views: 0,
  submissions: 0,
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(undefined);
});

// =============================================================================
// GET /api/landing-pages/[id]
// =============================================================================
describe("GET /api/landing-pages/[id]", () => {
  it("should return a landing page", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages/page-1");
    const response = await getPage(request, createMockParams({ id: "page-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Product Launch");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/landing-pages/missing");
    const response = await getPage(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages/page-1");
    await getPage(request, createMockParams({ id: "page-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/landing-pages/[id]
// =============================================================================
describe("PATCH /api/landing-pages/[id]", () => {
  it("should update a landing page", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(samplePage);
    mockPrisma.landingPage.update.mockResolvedValue({
      ...samplePage,
      name: "Updated Page",
    });

    const request = createMockRequest("/api/landing-pages/page-1", {
      method: "PATCH",
      body: { name: "Updated Page" },
    });
    const response = await updatePage(request, createMockParams({ id: "page-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Page");
  });

  it("should set publishedAt when status changes to published", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(samplePage);
    mockPrisma.landingPage.update.mockResolvedValue({
      ...samplePage,
      status: "published",
    });

    const request = createMockRequest("/api/landing-pages/page-1", {
      method: "PATCH",
      body: { status: "published" },
    });
    await updatePage(request, createMockParams({ id: "page-1" }));

    const updateCall = mockPrisma.landingPage.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({
      status: "published",
      publishedAt: expect.any(Date),
    });
  });

  it("should not set publishedAt when already published", async () => {
    const publishedPage = { ...samplePage, status: "published" };
    mockPrisma.landingPage.findFirst.mockResolvedValue(publishedPage);
    mockPrisma.landingPage.update.mockResolvedValue(publishedPage);

    const request = createMockRequest("/api/landing-pages/page-1", {
      method: "PATCH",
      body: { status: "published" },
    });
    await updatePage(request, createMockParams({ id: "page-1" }));

    const updateCall = mockPrisma.landingPage.update.mock.calls[0][0];
    expect(updateCall?.data).not.toHaveProperty("publishedAt");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/landing-pages/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updatePage(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/landing-pages/[id]
// =============================================================================
describe("DELETE /api/landing-pages/[id]", () => {
  it("should soft delete a landing page", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(samplePage);
    mockPrisma.landingPage.update.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages/page-1", {
      method: "DELETE",
    });
    const response = await deletePage(request, createMockParams({ id: "page-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.landingPage.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/landing-pages/missing", {
      method: "DELETE",
    });
    const response = await deletePage(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership before deleting", async () => {
    mockPrisma.landingPage.findFirst.mockResolvedValue(samplePage);
    mockPrisma.landingPage.update.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages/page-1", {
      method: "DELETE",
    });
    await deletePage(request, createMockParams({ id: "page-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
