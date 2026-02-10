import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

// Import route handlers
import { GET as listContacts, POST as createContact } from "@/app/api/contacts/route";
import {
  GET as getContact,
  PATCH as updateContact,
  DELETE as deleteContact,
} from "@/app/api/contacts/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const sampleContact = {
  id: "contact-1",
  tenantId: TENANT_ID,
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  lifecycleStage: "subscriber",
  leadStatus: null,
  ownerId: null,
  owner: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
});

// =============================================================================
// GET /api/contacts - List contacts
// =============================================================================
describe("GET /api/contacts", () => {
  it("should return paginated contacts", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([sampleContact]);
    mockPrisma.contact.count.mockResolvedValue(1);

    const request = createMockRequest("/api/contacts");
    const response = await listContacts(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].email).toBe("john@example.com");
    expect(body.pagination).toBeDefined();
    expect(body.pagination.total).toBe(1);
  });

  it("should call getTenantId for authentication", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([]);
    mockPrisma.contact.count.mockResolvedValue(0);

    const request = createMockRequest("/api/contacts");
    await listContacts(request);

    expect(mockGetTenantId).toHaveBeenCalledWith(request);
  });

  it("should pass search filter to Prisma", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([]);
    mockPrisma.contact.count.mockResolvedValue(0);

    const request = createMockRequest("/api/contacts", {
      searchParams: { search: "john" },
    });
    await listContacts(request);

    const findManyCall = mockPrisma.contact.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      deletedAt: null,
      OR: expect.arrayContaining([
        expect.objectContaining({
          firstName: { contains: "john", mode: "insensitive" },
        }),
      ]),
    });
  });

  it("should pass lifecycleStage filter to Prisma", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([]);
    mockPrisma.contact.count.mockResolvedValue(0);

    const request = createMockRequest("/api/contacts", {
      searchParams: { lifecycleStage: "lead" },
    });
    await listContacts(request);

    const findManyCall = mockPrisma.contact.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      lifecycleStage: "lead",
    });
  });

  it("should respect pagination params", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([]);
    mockPrisma.contact.count.mockResolvedValue(50);

    const request = createMockRequest("/api/contacts", {
      searchParams: { page: "2", limit: "10" },
    });
    const response = await listContacts(request);
    const body = await getResponseBody(response);

    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(10);
    expect(body.pagination.total).toBe(50);
    expect(body.pagination.totalPages).toBe(5);
    expect(body.pagination.hasMore).toBe(true);

    const findManyCall = mockPrisma.contact.findMany.mock.calls[0][0];
    expect(findManyCall?.skip).toBe(10);
    expect(findManyCall?.take).toBe(10);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/contacts");
    const response = await listContacts(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });
});

// =============================================================================
// POST /api/contacts - Create contact
// =============================================================================
describe("POST /api/contacts", () => {
  it("should create a contact with valid data", async () => {
    const created = { ...sampleContact, id: "new-contact" };
    mockPrisma.contact.create.mockResolvedValue(created);

    const request = createMockRequest("/api/contacts", {
      method: "POST",
      body: {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
      },
    });
    const response = await createContact(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.email).toBe("john@example.com");
  });

  it("should use tenant ID from auth, not from request body", async () => {
    mockPrisma.contact.create.mockResolvedValue(sampleContact);

    const request = createMockRequest("/api/contacts", {
      method: "POST",
      body: {
        email: "test@example.com",
        firstName: "Test",
        tenantId: "malicious-tenant-id",
      },
    });
    await createContact(request);

    const createCall = mockPrisma.contact.create.mock.calls[0][0];
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should return 400 when no email or firstName provided", async () => {
    const request = createMockRequest("/api/contacts", {
      method: "POST",
      body: { lastName: "Doe" },
    });
    const response = await createContact(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/email.*first name/i);
  });

  it("should default lifecycleStage to subscriber", async () => {
    mockPrisma.contact.create.mockResolvedValue(sampleContact);

    const request = createMockRequest("/api/contacts", {
      method: "POST",
      body: { email: "test@example.com" },
    });
    await createContact(request);

    const createCall = mockPrisma.contact.create.mock.calls[0][0];
    expect(createCall?.data.lifecycleStage).toBe("subscriber");
  });
});

// =============================================================================
// GET /api/contacts/[id] - Get single contact
// =============================================================================
describe("GET /api/contacts/[id]", () => {
  it("should return contact with associations", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(sampleContact);

    const request = createMockRequest("/api/contacts/contact-1");
    const params = createMockParams({ id: "contact-1" });
    const response = await getContact(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe("contact-1");
  });

  it("should return 404 when contact not found", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/contacts/nonexistent");
    const params = createMockParams({ id: "nonexistent" });
    const response = await getContact(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it("should check tenant ownership", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(sampleContact);

    const request = createMockRequest("/api/contacts/contact-1");
    const params = createMockParams({ id: "contact-1" });
    await getContact(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });

  it("should return 403 when contact belongs to different tenant", async () => {
    const foreignContact = { ...sampleContact, tenantId: "other-tenant" };
    mockPrisma.contact.findUnique.mockResolvedValue(foreignContact);
    mockCheckOwnership.mockRejectedValue(
      new Error("Forbidden: You do not have access to this resource")
    );

    const request = createMockRequest("/api/contacts/contact-1");
    const params = createMockParams({ id: "contact-1" });
    const response = await getContact(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/forbidden/i);
  });
});

// =============================================================================
// PATCH /api/contacts/[id] - Update contact
// =============================================================================
describe("PATCH /api/contacts/[id]", () => {
  it("should update contact fields", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(sampleContact);
    const updated = { ...sampleContact, firstName: "Jane" };
    mockPrisma.contact.update.mockResolvedValue(updated);

    const request = createMockRequest("/api/contacts/contact-1", {
      method: "PATCH",
      body: { firstName: "Jane" },
    });
    const params = createMockParams({ id: "contact-1" });
    const response = await updateContact(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.firstName).toBe("Jane");
  });

  it("should return 404 when contact not found", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/contacts/nonexistent", {
      method: "PATCH",
      body: { firstName: "Jane" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await updateContact(request, params);

    expect(response.status).toBe(404);
  });

  it("should verify tenant ownership before updating", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(sampleContact);
    mockPrisma.contact.update.mockResolvedValue(sampleContact);

    const request = createMockRequest("/api/contacts/contact-1", {
      method: "PATCH",
      body: { firstName: "Updated" },
    });
    const params = createMockParams({ id: "contact-1" });
    await updateContact(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// DELETE /api/contacts/[id] - Soft delete contact
// =============================================================================
describe("DELETE /api/contacts/[id]", () => {
  it("should soft delete contact (set deletedAt)", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(sampleContact);
    mockPrisma.contact.update.mockResolvedValue(sampleContact);

    const request = createMockRequest("/api/contacts/contact-1", {
      method: "DELETE",
    });
    const params = createMockParams({ id: "contact-1" });
    const response = await deleteContact(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.contact.update.mock.calls[0][0];
    expect(updateCall?.data).toHaveProperty("deletedAt");
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
  });

  it("should return 404 when contact not found", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/contacts/nonexistent", {
      method: "DELETE",
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await deleteContact(request, params);

    expect(response.status).toBe(404);
  });

  it("should verify tenant ownership before deleting", async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(sampleContact);
    mockPrisma.contact.update.mockResolvedValue(sampleContact);

    const request = createMockRequest("/api/contacts/contact-1", {
      method: "DELETE",
    });
    const params = createMockParams({ id: "contact-1" });
    await deleteContact(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
