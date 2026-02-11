import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as listForms, POST as createForm } from "@/app/api/forms/route";
import {
  GET as getForm,
  PATCH as updateForm,
  DELETE as deleteForm,
} from "@/app/api/forms/[id]/route";

const mockPrisma = vi.mocked(prisma);

const sampleForm = {
  id: "form-1",
  tenantId: "demo-tenant",
  name: "Contact Form",
  slug: "contact-form",
  description: "A contact form",
  status: "draft",
  settings: {},
  theme: {},
  viewCount: 0,
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  _count: { submissions: 5, fields: 3 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/forms
// =============================================================================
describe("GET /api/forms", () => {
  it("should return paginated forms", async () => {
    mockPrisma.form.findMany.mockResolvedValue([sampleForm] as any);
    mockPrisma.form.count.mockResolvedValue(1);

    const request = createMockRequest("/api/forms");
    const response = await listForms(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should filter by status", async () => {
    mockPrisma.form.findMany.mockResolvedValue([]);
    mockPrisma.form.count.mockResolvedValue(0);

    const request = createMockRequest("/api/forms", {
      searchParams: { status: "published" },
    });
    await listForms(request);

    const where = mockPrisma.form.findMany.mock.calls[0][0]?.where;
    expect(where).toMatchObject({ status: "published" });
  });

  it("should support search", async () => {
    mockPrisma.form.findMany.mockResolvedValue([]);
    mockPrisma.form.count.mockResolvedValue(0);

    const request = createMockRequest("/api/forms", {
      searchParams: { search: "contact" },
    });
    await listForms(request);

    const where = mockPrisma.form.findMany.mock.calls[0][0]?.where as any;
    expect(where.OR).toBeDefined();
  });

  it("should support pagination params", async () => {
    mockPrisma.form.findMany.mockResolvedValue([]);
    mockPrisma.form.count.mockResolvedValue(50);

    const request = createMockRequest("/api/forms", {
      searchParams: { page: "2", limit: "10" },
    });
    const response = await listForms(request);
    const body = await getResponseBody(response);

    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(10);
    expect(mockPrisma.form.findMany.mock.calls[0][0]?.skip).toBe(10);
  });
});

// =============================================================================
// POST /api/forms
// =============================================================================
describe("POST /api/forms", () => {
  it("should create a form", async () => {
    mockPrisma.form.findUnique.mockResolvedValue(null);
    mockPrisma.form.create.mockResolvedValue(sampleForm as any);

    const request = createMockRequest("/api/forms", {
      method: "POST",
      body: { name: "Contact Form" },
    });
    const response = await createForm(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Contact Form");
  });

  it("should generate unique slug when duplicate exists", async () => {
    mockPrisma.form.findUnique.mockResolvedValue({ id: "existing" } as any);
    mockPrisma.form.create.mockResolvedValue(sampleForm as any);

    const request = createMockRequest("/api/forms", {
      method: "POST",
      body: { name: "Contact Form" },
    });
    await createForm(request);

    const createData = mockPrisma.form.create.mock.calls[0][0]?.data as any;
    expect(createData.slug).toContain("contact-form-");
  });

  it("should return 400 for missing name", async () => {
    const request = createMockRequest("/api/forms", {
      method: "POST",
      body: {},
    });
    const response = await createForm(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/forms/[id]
// =============================================================================
describe("GET /api/forms/[id]", () => {
  it("should return a form with fields", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({
      ...sampleForm,
      fields: [{ id: "f1", name: "email" }],
    } as any);

    const request = createMockRequest("/api/forms/form-1");
    const response = await getForm(request, createMockParams({ id: "form-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Contact Form");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/missing");
    const response = await getForm(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/forms/[id]
// =============================================================================
describe("PATCH /api/forms/[id]", () => {
  it("should update a form", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1", status: "draft" } as any);
    mockPrisma.form.update.mockResolvedValue({ ...sampleForm, name: "Updated" } as any);

    const request = createMockRequest("/api/forms/form-1", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateForm(request, createMockParams({ id: "form-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated");
  });

  it("should return 400 when trying to publish via PATCH", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1", status: "draft" } as any);

    const request = createMockRequest("/api/forms/form-1", {
      method: "PATCH",
      body: { status: "published" },
    });
    const response = await updateForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should allow setting status to published if already published", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1", status: "published" } as any);
    mockPrisma.form.update.mockResolvedValue({ ...sampleForm, status: "published" } as any);

    const request = createMockRequest("/api/forms/form-1", {
      method: "PATCH",
      body: { status: "published" },
    });
    const response = await updateForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(200);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateForm(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/forms/[id]
// =============================================================================
describe("DELETE /api/forms/[id]", () => {
  it("should soft delete a form", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1" } as any);
    mockPrisma.form.update.mockResolvedValue(sampleForm as any);

    const request = createMockRequest("/api/forms/form-1", { method: "DELETE" });
    const response = await deleteForm(request, createMockParams({ id: "form-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.form.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({ deletedAt: expect.any(Date) });
  });

  it("should return 404 when not found", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/missing", { method: "DELETE" });
    const response = await deleteForm(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
