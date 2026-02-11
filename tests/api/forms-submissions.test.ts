import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import {
  GET as listSubmissions,
  POST as submitForm,
} from "@/app/api/forms/[id]/submissions/route";

const mockPrisma = vi.mocked(prisma);

const sampleSubmission = {
  id: "sub-1",
  formId: "form-1",
  tenantId: "demo-tenant",
  data: { email: "test@example.com", name: "Test" },
  metadata: {},
  contactId: null,
  isSpam: false,
  submittedAt: new Date(),
  contact: null,
};

const publishedForm = {
  id: "form-1",
  tenantId: "demo-tenant",
  status: "published",
  fields: [
    { id: "f1", name: "email", label: "Email", type: "email", required: true, hidden: false, validationRules: null, orderIndex: 0 },
    { id: "f2", name: "name", label: "Name", type: "text", required: false, hidden: false, validationRules: null, orderIndex: 1 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/forms/[id]/submissions
// =============================================================================
describe("GET /api/forms/[id]/submissions", () => {
  it("should return paginated submissions", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1" } as any);
    mockPrisma.formSubmission.findMany.mockResolvedValue([sampleSubmission] as any);
    mockPrisma.formSubmission.count.mockResolvedValue(1);

    const request = createMockRequest("/api/forms/form-1/submissions");
    const response = await listSubmissions(request, createMockParams({ id: "form-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should filter by isSpam", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1" } as any);
    mockPrisma.formSubmission.findMany.mockResolvedValue([]);
    mockPrisma.formSubmission.count.mockResolvedValue(0);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      searchParams: { isSpam: "true" },
    });
    await listSubmissions(request, createMockParams({ id: "form-1" }));

    const where = mockPrisma.formSubmission.findMany.mock.calls[0][0]?.where as any;
    expect(where.isSpam).toBe(true);
  });

  it("should return 404 when form not found", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/missing/submissions");
    const response = await listSubmissions(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// POST /api/forms/[id]/submissions
// =============================================================================
describe("POST /api/forms/[id]/submissions", () => {
  it("should submit a form and create submission", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(publishedForm as any);
    mockPrisma.contact.findFirst.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: "contact-new" } as any);
    mockPrisma.formSubmission.create.mockResolvedValue(sampleSubmission as any);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      method: "POST",
      body: { data: { email: "test@example.com", name: "Test" } },
    });
    const response = await submitForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(201);
  });

  it("should return 404 when form not published", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      method: "POST",
      body: { data: { email: "test@example.com" } },
    });
    const response = await submitForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 when required field missing", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(publishedForm as any);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      method: "POST",
      body: { data: { name: "Test" } },
    });
    const response = await submitForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should validate email format", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(publishedForm as any);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      method: "POST",
      body: { data: { email: "not-an-email", name: "Test" } },
    });
    const response = await submitForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should link existing contact by email", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(publishedForm as any);
    mockPrisma.contact.findFirst.mockResolvedValue({ id: "existing-contact" } as any);
    mockPrisma.formSubmission.create.mockResolvedValue(sampleSubmission as any);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      method: "POST",
      body: { data: { email: "existing@example.com" } },
    });
    await submitForm(request, createMockParams({ id: "form-1" }));

    const createCall = mockPrisma.formSubmission.create.mock.calls[0][0]?.data as any;
    expect(createCall.contactId).toBe("existing-contact");
  });

  it("should validate number fields", async () => {
    const formWithNumber = {
      ...publishedForm,
      fields: [
        { id: "f1", name: "age", label: "Age", type: "number", required: true, hidden: false, validationRules: null, orderIndex: 0 },
      ],
    };
    mockPrisma.form.findFirst.mockResolvedValue(formWithNumber as any);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      method: "POST",
      body: { data: { age: "not-a-number" } },
    });
    const response = await submitForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should validate URL fields", async () => {
    const formWithUrl = {
      ...publishedForm,
      fields: [
        { id: "f1", name: "website", label: "Website", type: "url", required: true, hidden: false, validationRules: null, orderIndex: 0 },
      ],
    };
    mockPrisma.form.findFirst.mockResolvedValue(formWithUrl as any);

    const request = createMockRequest("/api/forms/form-1/submissions", {
      method: "POST",
      body: { data: { website: "not-a-url" } },
    });
    const response = await submitForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });
});
