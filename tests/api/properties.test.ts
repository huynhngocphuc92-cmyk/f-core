import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as listProperties, POST as createProperty } from "@/app/api/properties/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

const sampleProperty = {
  id: "prop-1",
  tenantId: TENANT_ID,
  objectType: "contact",
  name: "custom_field",
  label: "Custom Field",
  description: null,
  fieldType: "text",
  options: null,
  isRequired: false,
  isSystem: false,
  groupName: "Custom Properties",
  orderIndex: 0,
  defaultValue: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

// =============================================================================
// GET /api/properties - List property definitions
// =============================================================================
describe("GET /api/properties", () => {
  it("should return paginated properties", async () => {
    mockPrisma.propertyDefinition.findMany.mockResolvedValue([sampleProperty]);
    mockPrisma.propertyDefinition.count.mockResolvedValue(1);

    const request = createMockRequest("/api/properties");
    const response = await listProperties(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("custom_field");
  });

  it("should filter by objectType", async () => {
    mockPrisma.propertyDefinition.findMany.mockResolvedValue([]);
    mockPrisma.propertyDefinition.count.mockResolvedValue(0);

    const request = createMockRequest("/api/properties", {
      searchParams: { objectType: "contact" },
    });
    await listProperties(request);

    const findManyCall = mockPrisma.propertyDefinition.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      objectType: "contact",
    });
  });
});

// =============================================================================
// POST /api/properties - Create property definition
// =============================================================================
describe("POST /api/properties", () => {
  it("should create a property", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(null);
    mockPrisma.propertyDefinition.findFirst.mockResolvedValue(null);
    mockPrisma.propertyDefinition.create.mockResolvedValue(sampleProperty);

    const request = createMockRequest("/api/properties", {
      method: "POST",
      body: {
        name: "custom_field",
        label: "Custom Field",
        objectType: "contact",
        fieldType: "text",
      },
    });
    const response = await createProperty(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("custom_field");
  });

  it("should return 409 when property already exists", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(sampleProperty as any);

    const request = createMockRequest("/api/properties", {
      method: "POST",
      body: {
        name: "custom_field",
        label: "Custom Field",
        objectType: "contact",
        fieldType: "text",
      },
    });
    const response = await createProperty(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/already exists/i);
  });

  it("should auto-calculate orderIndex", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(null);
    mockPrisma.propertyDefinition.findFirst.mockResolvedValue({ orderIndex: 5 } as any);
    mockPrisma.propertyDefinition.create.mockResolvedValue(sampleProperty);

    const request = createMockRequest("/api/properties", {
      method: "POST",
      body: {
        name: "new_field",
        label: "New Field",
        objectType: "contact",
        fieldType: "text",
      },
    });
    await createProperty(request);

    const createCall = mockPrisma.propertyDefinition.create.mock.calls[0][0];
    expect(createCall?.data.orderIndex).toBe(6);
  });

  it("should return 400 when name is not snake_case", async () => {
    const request = createMockRequest("/api/properties", {
      method: "POST",
      body: {
        name: "InvalidName",
        label: "Field",
        objectType: "contact",
        fieldType: "text",
      },
    });
    const response = await createProperty(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid objectType", async () => {
    const request = createMockRequest("/api/properties", {
      method: "POST",
      body: {
        name: "field",
        label: "Field",
        objectType: "invalid",
        fieldType: "text",
      },
    });
    const response = await createProperty(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid fieldType", async () => {
    const request = createMockRequest("/api/properties", {
      method: "POST",
      body: {
        name: "field",
        label: "Field",
        objectType: "contact",
        fieldType: "invalid",
      },
    });
    const response = await createProperty(request);

    expect(response.status).toBe(400);
  });
});
