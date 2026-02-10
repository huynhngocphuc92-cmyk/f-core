import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as listCompanies, POST as createCompany } from "@/app/api/companies/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

const sampleCompany = {
  id: "company-1",
  tenantId: TENANT_ID,
  name: "Acme Corp",
  domain: "acme.com",
  industry: "Technology",
  type: null,
  size: null,
  description: null,
  annualRevenue: null,
  phone: null,
  website: null,
  address: null,
  city: null,
  state: null,
  country: null,
  postalCode: null,
  ownerId: null,
  owner: null,
  properties: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  _count: { contacts: 3, deals: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

// =============================================================================
// GET /api/companies - List companies
// =============================================================================
describe("GET /api/companies", () => {
  it("should return paginated companies", async () => {
    mockPrisma.company.findMany.mockResolvedValue([sampleCompany]);
    mockPrisma.company.count.mockResolvedValue(1);

    const request = createMockRequest("/api/companies");
    const response = await listCompanies(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Acme Corp");
    expect(body.pagination.total).toBe(1);
  });

  it("should pass search filter to Prisma", async () => {
    mockPrisma.company.findMany.mockResolvedValue([]);
    mockPrisma.company.count.mockResolvedValue(0);

    const request = createMockRequest("/api/companies", {
      searchParams: { search: "acme" },
    });
    await listCompanies(request);

    const findManyCall = mockPrisma.company.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      deletedAt: null,
      OR: expect.arrayContaining([
        expect.objectContaining({
          name: { contains: "acme", mode: "insensitive" },
        }),
        expect.objectContaining({
          domain: { contains: "acme", mode: "insensitive" },
        }),
      ]),
    });
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/companies");
    const response = await listCompanies(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });
});

// =============================================================================
// POST /api/companies - Create company
// =============================================================================
describe("POST /api/companies", () => {
  it("should create a company with valid data", async () => {
    const created = { ...sampleCompany, id: "new-company" };
    mockPrisma.company.create.mockResolvedValue(created);

    const request = createMockRequest("/api/companies", {
      method: "POST",
      body: { name: "New Corp", domain: "newcorp.com", industry: "Finance" },
    });
    const response = await createCompany(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Acme Corp");
  });

  it("should use tenant ID from auth, not from request body", async () => {
    mockPrisma.company.create.mockResolvedValue(sampleCompany);

    const request = createMockRequest("/api/companies", {
      method: "POST",
      body: { name: "Test Corp", tenantId: "malicious-tenant" },
    });
    await createCompany(request);

    const createCall = mockPrisma.company.create.mock.calls[0][0];
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/companies", {
      method: "POST",
      body: { domain: "example.com" },
    });
    const response = await createCompany(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/name.*required/i);
  });
});
