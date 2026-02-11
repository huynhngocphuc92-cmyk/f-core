import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { POST as duplicateForm } from "@/app/api/forms/[id]/duplicate/route";

const mockPrisma = vi.mocked(prisma);

const originalForm = {
  id: "form-1",
  tenantId: "demo-tenant",
  name: "Contact Form",
  slug: "contact-form",
  description: "A form",
  status: "published",
  settings: { redirectUrl: "/thanks" },
  theme: { color: "blue" },
  fields: [
    {
      id: "f1", name: "email", label: "Email", type: "email",
      placeholder: null, helpText: null, defaultValue: null,
      required: true, hidden: false, width: "full", orderIndex: 0,
      options: null, validationRules: null, conditionalLogic: null,
    },
  ],
};

const duplicatedForm = {
  id: "form-2",
  tenantId: "demo-tenant",
  name: "Copy of Contact Form",
  slug: "contact-form-copy-123",
  status: "draft",
  fields: [{ id: "f2", name: "email", label: "Email", type: "email" }],
  _count: { submissions: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/forms/[id]/duplicate", () => {
  it("should duplicate a form with fields in a transaction", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(originalForm as any);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        form: {
          create: vi.fn().mockResolvedValue({ id: "form-2" }),
          findUnique: vi.fn().mockResolvedValue(duplicatedForm),
        },
        formField: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });
    });

    const request = createMockRequest("/api/forms/form-1/duplicate", { method: "POST" });
    const response = await duplicateForm(request, createMockParams({ id: "form-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Copy of Contact Form");
  });

  it("should set duplicated form status to draft", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(originalForm as any);
    let createdData: any;
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        form: {
          create: vi.fn().mockImplementation((args: any) => {
            createdData = args.data;
            return { id: "form-2" };
          }),
          findUnique: vi.fn().mockResolvedValue(duplicatedForm),
        },
        formField: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });
    });

    const request = createMockRequest("/api/forms/form-1/duplicate", { method: "POST" });
    await duplicateForm(request, createMockParams({ id: "form-1" }));

    expect(createdData.status).toBe("draft");
    expect(createdData.name).toBe("Copy of Contact Form");
  });

  it("should return 404 when form not found", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/missing/duplicate", { method: "POST" });
    const response = await duplicateForm(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
