import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { POST as publishForm } from "@/app/api/forms/[id]/publish/route";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/forms/[id]/publish", () => {
  it("should publish a draft form with input fields", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({
      id: "form-1",
      status: "draft",
      fields: [
        { id: "f1", type: "email" },
        { id: "f2", type: "text" },
      ],
    } as any);
    mockPrisma.form.update.mockResolvedValue({ id: "form-1", status: "published" } as any);

    const request = createMockRequest("/api/forms/form-1/publish", { method: "POST" });
    const response = await publishForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(200);

    const updateCall = mockPrisma.form.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({
      status: "published",
      publishedAt: expect.any(Date),
    });
  });

  it("should return 400 when form is already published", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({
      id: "form-1",
      status: "published",
      fields: [{ id: "f1", type: "email" }],
    } as any);

    const request = createMockRequest("/api/forms/form-1/publish", { method: "POST" });
    const response = await publishForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 400 when form has no input fields (only layout)", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({
      id: "form-1",
      status: "draft",
      fields: [
        { id: "f1", type: "heading" },
        { id: "f2", type: "divider" },
        { id: "f3", type: "spacer" },
      ],
    } as any);

    const request = createMockRequest("/api/forms/form-1/publish", { method: "POST" });
    const response = await publishForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 400 when form has no fields at all", async () => {
    mockPrisma.form.findFirst.mockResolvedValue({
      id: "form-1",
      status: "draft",
      fields: [],
    } as any);

    const request = createMockRequest("/api/forms/form-1/publish", { method: "POST" });
    const response = await publishForm(request, createMockParams({ id: "form-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when form not found", async () => {
    mockPrisma.form.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/forms/missing/publish", { method: "POST" });
    const response = await publishForm(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
