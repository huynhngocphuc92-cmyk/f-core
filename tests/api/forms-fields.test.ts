import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { PUT as updateFields } from "@/app/api/forms/[id]/fields/route";

const mockPrisma = vi.mocked(prisma);

const sampleFormWithFields = {
  id: "form-1",
  tenantId: "demo-tenant",
  name: "Contact Form",
  fields: [
    { id: "f1", name: "email", label: "Email", type: "email", orderIndex: 0 },
    { id: "f2", name: "name", label: "Name", type: "text", orderIndex: 1 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PUT /api/forms/[id]/fields", () => {
  it("should batch update fields in a transaction", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1" } as any);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        formField: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        form: {
          findUnique: vi.fn().mockResolvedValue(sampleFormWithFields),
        },
      });
    });

    const request = createMockRequest("/api/forms/form-1", {
      method: "PUT",
      body: {
        fields: [
          { name: "email", label: "Email Address", type: "email" },
          { name: "message", label: "Message", type: "textarea" },
        ],
      },
    });
    const response = await updateFields(request, createMockParams({ id: "form-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.fields).toHaveLength(2);
  });

  it("should return 404 when form not found", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/missing", {
      method: "PUT",
      body: {
        fields: [{ name: "email", label: "Email", type: "email" }],
      },
    });
    const response = await updateFields(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid fields schema", async () => {
    const request = createMockRequest("/api/forms/form-1", {
      method: "PUT",
      body: { fields: [{ invalid: true }] },
    });
    const response = await updateFields(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should handle empty fields array", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: "form-1" } as any);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        formField: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          createMany: vi.fn(),
        },
        form: {
          findUnique: vi.fn().mockResolvedValue({ ...sampleFormWithFields, fields: [] }),
        },
      });
    });

    const request = createMockRequest("/api/forms/form-1", {
      method: "PUT",
      body: { fields: [] },
    });
    const response = await updateFields(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(200);
  });
});
