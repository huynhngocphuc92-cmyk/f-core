import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { POST as createAssociation, DELETE as deleteAssociation } from "@/app/api/associations/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

// =============================================================================
// POST /api/associations - Create association
// =============================================================================
describe("POST /api/associations", () => {
  it("should create a contact-company association", async () => {
    mockPrisma.contactCompany.create.mockResolvedValue({} as any);

    const request = createMockRequest("/api/associations", {
      method: "POST",
      body: { type: "contact-company", sourceId: "contact-1", targetId: "company-1" },
    });
    const response = await createAssociation(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(mockPrisma.contactCompany.create).toHaveBeenCalledWith({
      data: { contactId: "contact-1", companyId: "company-1" },
    });
  });

  it("should create a deal-contact association", async () => {
    mockPrisma.dealContact.create.mockResolvedValue({} as any);

    const request = createMockRequest("/api/associations", {
      method: "POST",
      body: { type: "deal-contact", sourceId: "deal-1", targetId: "contact-1" },
    });
    const response = await createAssociation(request);

    expect(response.status).toBe(201);
    expect(mockPrisma.dealContact.create).toHaveBeenCalledWith({
      data: { dealId: "deal-1", contactId: "contact-1" },
    });
  });

  it("should create a deal-company association", async () => {
    mockPrisma.dealCompany.create.mockResolvedValue({} as any);

    const request = createMockRequest("/api/associations", {
      method: "POST",
      body: { type: "deal-company", sourceId: "deal-1", targetId: "company-1" },
    });
    const response = await createAssociation(request);

    expect(response.status).toBe(201);
    expect(mockPrisma.dealCompany.create).toHaveBeenCalledWith({
      data: { dealId: "deal-1", companyId: "company-1" },
    });
  });

  it("should return 409 when association already exists", async () => {
    mockPrisma.contactCompany.create.mockRejectedValue(
      new Error("Unique constraint failed")
    );

    const request = createMockRequest("/api/associations", {
      method: "POST",
      body: { type: "contact-company", sourceId: "contact-1", targetId: "company-1" },
    });
    const response = await createAssociation(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/already exists/i);
  });

  it("should return 400 for invalid association type", async () => {
    const request = createMockRequest("/api/associations", {
      method: "POST",
      body: { type: "invalid-type", sourceId: "a", targetId: "b" },
    });
    const response = await createAssociation(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when sourceId is missing", async () => {
    const request = createMockRequest("/api/associations", {
      method: "POST",
      body: { type: "contact-company", targetId: "company-1" },
    });
    const response = await createAssociation(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// DELETE /api/associations - Remove association
// =============================================================================
describe("DELETE /api/associations", () => {
  it("should delete a contact-company association", async () => {
    mockPrisma.contactCompany.delete.mockResolvedValue({} as any);

    const request = createMockRequest("/api/associations", {
      method: "DELETE",
      body: { type: "contact-company", sourceId: "contact-1", targetId: "company-1" },
    });
    const response = await deleteAssociation(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.contactCompany.delete).toHaveBeenCalledWith({
      where: {
        contactId_companyId: {
          contactId: "contact-1",
          companyId: "company-1",
        },
      },
    });
  });

  it("should delete a deal-contact association", async () => {
    mockPrisma.dealContact.delete.mockResolvedValue({} as any);

    const request = createMockRequest("/api/associations", {
      method: "DELETE",
      body: { type: "deal-contact", sourceId: "deal-1", targetId: "contact-1" },
    });
    const response = await deleteAssociation(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.dealContact.delete).toHaveBeenCalledWith({
      where: {
        dealId_contactId: {
          dealId: "deal-1",
          contactId: "contact-1",
        },
      },
    });
  });

  it("should delete a deal-company association", async () => {
    mockPrisma.dealCompany.delete.mockResolvedValue({} as any);

    const request = createMockRequest("/api/associations", {
      method: "DELETE",
      body: { type: "deal-company", sourceId: "deal-1", targetId: "company-1" },
    });
    const response = await deleteAssociation(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.dealCompany.delete).toHaveBeenCalledWith({
      where: {
        dealId_companyId: {
          dealId: "deal-1",
          companyId: "company-1",
        },
      },
    });
  });

  it("should return 400 for invalid association type", async () => {
    const request = createMockRequest("/api/associations", {
      method: "DELETE",
      body: { type: "invalid-type", sourceId: "a", targetId: "b" },
    });
    const response = await deleteAssociation(request);

    expect(response.status).toBe(400);
  });
});
