import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser, checkOwnership } from "@/lib/auth-helpers";

import { GET as listTemplates, POST as createTemplate } from "@/app/api/emails/templates/route";
import {
  GET as getTemplate,
  PATCH as updateTemplate,
  DELETE as deleteTemplate,
} from "@/app/api/emails/templates/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const sampleTemplate = {
  id: "tmpl-1",
  tenantId: TENANT_ID,
  name: "Welcome Email",
  subject: "Welcome aboard!",
  body: "<h1>Welcome</h1>",
  category: "onboarding",
  isShared: true,
  isActive: true,
  ownerId: "user-test-id",
  owner: { id: "user-test-id", name: "Test User" },
  usageCount: 0,
  deletedAt: null,
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
  mockCheckOwnership.mockResolvedValue(undefined);
});

// =============================================================================
// GET /api/emails/templates - List templates
// =============================================================================
describe("GET /api/emails/templates", () => {
  it("should return paginated templates", async () => {
    mockPrisma.emailTemplate.findMany.mockResolvedValue([sampleTemplate]);
    mockPrisma.emailTemplate.count.mockResolvedValue(1);

    const request = createMockRequest("/api/emails/templates");
    const response = await listTemplates(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Welcome Email");
  });

  it("should filter by category", async () => {
    mockPrisma.emailTemplate.findMany.mockResolvedValue([]);
    mockPrisma.emailTemplate.count.mockResolvedValue(0);

    const request = createMockRequest("/api/emails/templates", {
      searchParams: { category: "onboarding" },
    });
    await listTemplates(request);

    const findManyCall = mockPrisma.emailTemplate.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      category: "onboarding",
    });
  });

  it("should filter by search", async () => {
    mockPrisma.emailTemplate.findMany.mockResolvedValue([]);
    mockPrisma.emailTemplate.count.mockResolvedValue(0);

    const request = createMockRequest("/api/emails/templates", {
      searchParams: { search: "welcome" },
    });
    await listTemplates(request);

    const findManyCall = mockPrisma.emailTemplate.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          name: { contains: "welcome", mode: "insensitive" },
        }),
      ]),
    });
  });
});

// =============================================================================
// POST /api/emails/templates - Create template
// =============================================================================
describe("POST /api/emails/templates", () => {
  it("should create a template", async () => {
    mockPrisma.emailTemplate.create.mockResolvedValue(sampleTemplate);

    const request = createMockRequest("/api/emails/templates", {
      method: "POST",
      body: {
        name: "Welcome Email",
        subject: "Welcome aboard!",
        body: "<h1>Welcome</h1>",
      },
    });
    const response = await createTemplate(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Welcome Email");
  });

  it("should set ownerId and isShared defaults", async () => {
    mockPrisma.emailTemplate.create.mockResolvedValue(sampleTemplate);

    const request = createMockRequest("/api/emails/templates", {
      method: "POST",
      body: { name: "Tmpl", subject: "Sub", body: "Body" },
    });
    await createTemplate(request);

    const createCall = mockPrisma.emailTemplate.create.mock.calls[0][0];
    expect(createCall?.data.ownerId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
    expect(createCall?.data.isShared).toBe(true);
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/emails/templates", {
      method: "POST",
      body: { subject: "Sub", body: "Body" },
    });
    const response = await createTemplate(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 when subject is missing", async () => {
    const request = createMockRequest("/api/emails/templates", {
      method: "POST",
      body: { name: "Tmpl", body: "Body" },
    });
    const response = await createTemplate(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 when body is missing", async () => {
    const request = createMockRequest("/api/emails/templates", {
      method: "POST",
      body: { name: "Tmpl", subject: "Sub" },
    });
    const response = await createTemplate(request);
    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/emails/templates/[id] - Get single template
// =============================================================================
describe("GET /api/emails/templates/[id]", () => {
  it("should return a template", async () => {
    mockPrisma.emailTemplate.findFirst.mockResolvedValue(sampleTemplate);

    const request = createMockRequest("/api/emails/templates/tmpl-1");
    const response = await getTemplate(request, createMockParams({ id: "tmpl-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Welcome Email");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.emailTemplate.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/emails/templates/missing");
    const response = await getTemplate(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership", async () => {
    mockPrisma.emailTemplate.findFirst.mockResolvedValue(sampleTemplate);

    const request = createMockRequest("/api/emails/templates/tmpl-1");
    await getTemplate(request, createMockParams({ id: "tmpl-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/emails/templates/[id] - Update template
// =============================================================================
describe("PATCH /api/emails/templates/[id]", () => {
  it("should update a template", async () => {
    mockPrisma.emailTemplate.findFirst.mockResolvedValue(sampleTemplate);
    mockPrisma.emailTemplate.update.mockResolvedValue({
      ...sampleTemplate,
      name: "Updated",
    });

    const request = createMockRequest("/api/emails/templates/tmpl-1", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateTemplate(request, createMockParams({ id: "tmpl-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.emailTemplate.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/emails/templates/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateTemplate(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/emails/templates/[id] - Soft delete template
// =============================================================================
describe("DELETE /api/emails/templates/[id]", () => {
  it("should soft delete a template", async () => {
    mockPrisma.emailTemplate.findFirst.mockResolvedValue(sampleTemplate);
    mockPrisma.emailTemplate.update.mockResolvedValue(sampleTemplate);

    const request = createMockRequest("/api/emails/templates/tmpl-1", {
      method: "DELETE",
    });
    const response = await deleteTemplate(request, createMockParams({ id: "tmpl-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.emailTemplate.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.emailTemplate.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/emails/templates/missing", {
      method: "DELETE",
    });
    const response = await deleteTemplate(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
