import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import {
  GET as getProperty,
  PATCH as updateProperty,
  DELETE as deleteProperty,
} from "@/app/api/properties/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const sampleProperty = {
  id: "prop-1",
  tenantId: TENANT_ID,
  name: "custom_field",
  label: "Custom Field",
  objectType: "contact",
  fieldType: "text",
  description: "A custom field",
  options: null,
  isRequired: false,
  isSystem: false,
  groupName: "custom",
  defaultValue: null,
  orderIndex: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(undefined);
});

// =============================================================================
// GET /api/properties/[id]
// =============================================================================
describe("GET /api/properties/[id]", () => {
  it("should return a property definition", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(sampleProperty);

    const request = createMockRequest("/api/properties/prop-1");
    const response = await getProperty(request, createMockParams({ id: "prop-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("custom_field");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/properties/missing");
    const response = await getProperty(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(sampleProperty);

    const request = createMockRequest("/api/properties/prop-1");
    await getProperty(request, createMockParams({ id: "prop-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/properties/[id]
// =============================================================================
describe("PATCH /api/properties/[id]", () => {
  it("should update a property", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(sampleProperty);
    mockPrisma.propertyDefinition.update.mockResolvedValue({
      ...sampleProperty,
      label: "Updated Label",
    });

    const request = createMockRequest("/api/properties/prop-1", {
      method: "PATCH",
      body: { label: "Updated Label" },
    });
    const response = await updateProperty(request, createMockParams({ id: "prop-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.label).toBe("Updated Label");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/properties/missing", {
      method: "PATCH",
      body: { label: "Updated" },
    });
    const response = await updateProperty(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership before update", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(sampleProperty);
    mockPrisma.propertyDefinition.update.mockResolvedValue(sampleProperty);

    const request = createMockRequest("/api/properties/prop-1", {
      method: "PATCH",
      body: { label: "Updated" },
    });
    await updateProperty(request, createMockParams({ id: "prop-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// DELETE /api/properties/[id]
// =============================================================================
describe("DELETE /api/properties/[id]", () => {
  it("should hard delete a non-system property", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(sampleProperty);
    mockPrisma.propertyDefinition.delete.mockResolvedValue(sampleProperty);

    const request = createMockRequest("/api/properties/prop-1", {
      method: "DELETE",
    });
    const response = await deleteProperty(request, createMockParams({ id: "prop-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.propertyDefinition.delete).toHaveBeenCalledWith({
      where: { id: "prop-1" },
    });
  });

  it("should return 400 when trying to delete system property", async () => {
    const systemProp = { ...sampleProperty, isSystem: true };
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(systemProp);

    const request = createMockRequest("/api/properties/prop-1", {
      method: "DELETE",
    });
    const response = await deleteProperty(request, createMockParams({ id: "prop-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/properties/missing", {
      method: "DELETE",
    });
    const response = await deleteProperty(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership before deleting", async () => {
    mockPrisma.propertyDefinition.findUnique.mockResolvedValue(sampleProperty);
    mockPrisma.propertyDefinition.delete.mockResolvedValue(sampleProperty);

    const request = createMockRequest("/api/properties/prop-1", {
      method: "DELETE",
    });
    await deleteProperty(request, createMockParams({ id: "prop-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
