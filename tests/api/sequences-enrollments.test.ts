import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { POST as enrollContact } from "@/app/api/sequences/[id]/enrollments/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("POST /api/sequences/[id]/enrollments", () => {
  it("should enroll a contact in an active sequence", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue({
      id: "seq-1",
      status: "active",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.sequenceEnrollment.findUnique.mockResolvedValue(null);
    mockPrisma.sequenceEnrollment.create.mockResolvedValue({
      id: "enr-1",
      sequenceId: "seq-1",
      contactId: "c-1",
      contact: { id: "c-1", firstName: "John", lastName: "Doe", email: "john@test.com" },
    } as any);
    mockPrisma.sequence.update.mockResolvedValue({} as any);

    const request = createMockRequest("/api/sequences/seq-1/enrollments", {
      method: "POST",
      body: { contactId: "c-1" },
    });
    const response = await enrollContact(request, createMockParams({ id: "seq-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.contactId).toBe("c-1");
    expect(mockPrisma.sequence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { enrolledCount: { increment: 1 } },
      })
    );
  });

  it("should return 404 when sequence not found", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/sequences/missing/enrollments", {
      method: "POST",
      body: { contactId: "c-1" },
    });
    const response = await enrollContact(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 when sequence is not active", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue({
      id: "seq-1",
      status: "paused",
      tenantId: "tenant-test-id",
    } as any);

    const request = createMockRequest("/api/sequences/seq-1/enrollments", {
      method: "POST",
      body: { contactId: "c-1" },
    });
    const response = await enrollContact(request, createMockParams({ id: "seq-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 409 when contact already enrolled", async () => {
    mockPrisma.sequence.findFirst.mockResolvedValue({
      id: "seq-1",
      status: "active",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.sequenceEnrollment.findUnique.mockResolvedValue({
      id: "enr-1",
    } as any);

    const request = createMockRequest("/api/sequences/seq-1/enrollments", {
      method: "POST",
      body: { contactId: "c-1" },
    });
    const response = await enrollContact(request, createMockParams({ id: "seq-1" }));

    expect(response.status).toBe(409);
  });

  it("should return 400 when contactId is missing", async () => {
    const request = createMockRequest("/api/sequences/seq-1/enrollments", {
      method: "POST",
      body: {},
    });
    const response = await enrollContact(request, createMockParams({ id: "seq-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/sequences/seq-1/enrollments", {
      method: "POST",
      body: { contactId: "c-1" },
    });
    const response = await enrollContact(request, createMockParams({ id: "seq-1" }));

    expect(response.status).toBe(401);
  });
});
