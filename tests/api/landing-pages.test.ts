import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";

import { GET as listPages, POST as createPage } from "@/app/api/landing-pages/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

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
  owner: { id: "user-test-id", name: "Test User" },
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
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/landing-pages - List landing pages
// =============================================================================
describe("GET /api/landing-pages", () => {
  it("should return paginated landing pages", async () => {
    mockPrisma.landingPage.findMany.mockResolvedValue([samplePage]);
    mockPrisma.landingPage.count.mockResolvedValue(1);

    const request = createMockRequest("/api/landing-pages");
    const response = await listPages(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Product Launch");
  });

  it("should filter by status", async () => {
    mockPrisma.landingPage.findMany.mockResolvedValue([]);
    mockPrisma.landingPage.count.mockResolvedValue(0);

    const request = createMockRequest("/api/landing-pages", {
      searchParams: { status: "published" },
    });
    await listPages(request);

    const findManyCall = mockPrisma.landingPage.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      status: "published",
    });
  });

  it("should filter by search", async () => {
    mockPrisma.landingPage.findMany.mockResolvedValue([]);
    mockPrisma.landingPage.count.mockResolvedValue(0);

    const request = createMockRequest("/api/landing-pages", {
      searchParams: { search: "product" },
    });
    await listPages(request);

    const findManyCall = mockPrisma.landingPage.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          name: { contains: "product", mode: "insensitive" },
        }),
      ]),
    });
  });
});

// =============================================================================
// POST /api/landing-pages - Create landing page
// =============================================================================
describe("POST /api/landing-pages", () => {
  it("should create a landing page", async () => {
    mockPrisma.landingPage.create.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages", {
      method: "POST",
      body: { name: "Product Launch" },
    });
    const response = await createPage(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Product Launch");
  });

  it("should auto-generate slug from name", async () => {
    mockPrisma.landingPage.create.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages", {
      method: "POST",
      body: { name: "My Cool Page!" },
    });
    await createPage(request);

    const createCall = mockPrisma.landingPage.create.mock.calls[0][0];
    expect(createCall?.data.slug).toBe("my-cool-page");
  });

  it("should use provided slug if given", async () => {
    mockPrisma.landingPage.create.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages", {
      method: "POST",
      body: { name: "Page", slug: "custom-slug" },
    });
    await createPage(request);

    const createCall = mockPrisma.landingPage.create.mock.calls[0][0];
    expect(createCall?.data.slug).toBe("custom-slug");
  });

  it("should set status to draft and ownerId from auth", async () => {
    mockPrisma.landingPage.create.mockResolvedValue(samplePage);

    const request = createMockRequest("/api/landing-pages", {
      method: "POST",
      body: { name: "Page" },
    });
    await createPage(request);

    const createCall = mockPrisma.landingPage.create.mock.calls[0][0];
    expect(createCall?.data.status).toBe("draft");
    expect(createCall?.data.ownerId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/landing-pages", {
      method: "POST",
      body: { slug: "test" },
    });
    const response = await createPage(request);

    expect(response.status).toBe(400);
  });
});
