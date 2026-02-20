import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership, getCurrentUser } from "@/lib/auth-helpers";

import { GET as listWorkflows, POST as createWorkflow } from "@/app/api/workflows/route";
import {
  GET as getWorkflow,
  PATCH as updateWorkflow,
  DELETE as deleteWorkflow,
} from "@/app/api/workflows/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

const sampleWorkflow = {
  id: "workflow-1",
  tenantId: TENANT_ID,
  name: "Welcome Email",
  description: "Send welcome email on contact create",
  triggerType: "contact_created",
  triggerConfig: {},
  actions: [],
  status: "active",
  isActive: true,
  ownerId: "user-test-id",
  owner: { id: "user-test-id", name: "Test User" },
  executionCount: 0,
  lastExecutedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/workflows - List workflows
// =============================================================================
describe("GET /api/workflows", () => {
  it("should return paginated workflows", async () => {
    mockPrisma.workflow.findMany.mockResolvedValue([sampleWorkflow]);
    mockPrisma.workflow.count.mockResolvedValue(1);

    const request = createMockRequest("/api/workflows");
    const response = await listWorkflows(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Welcome Email");
  });

  it("should filter by status", async () => {
    mockPrisma.workflow.findMany.mockResolvedValue([]);
    mockPrisma.workflow.count.mockResolvedValue(0);

    const request = createMockRequest("/api/workflows", {
      searchParams: { status: "active" },
    });
    await listWorkflows(request);

    const findManyCall = mockPrisma.workflow.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      status: "active",
    });
  });

  it("should filter by search", async () => {
    mockPrisma.workflow.findMany.mockResolvedValue([]);
    mockPrisma.workflow.count.mockResolvedValue(0);

    const request = createMockRequest("/api/workflows", {
      searchParams: { search: "welcome" },
    });
    await listWorkflows(request);

    const findManyCall = mockPrisma.workflow.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          name: { contains: "welcome", mode: "insensitive" },
        }),
      ]),
    });
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/workflows");
    const response = await listWorkflows(request);

    expect(response.status).toBe(401);
  });
});

// =============================================================================
// POST /api/workflows - Create workflow
// =============================================================================
describe("POST /api/workflows", () => {
  it("should create a workflow", async () => {
    mockPrisma.workflow.create.mockResolvedValue(sampleWorkflow);

    const request = createMockRequest("/api/workflows", {
      method: "POST",
      body: { name: "Welcome Email", triggerType: "contact_created" },
    });
    const response = await createWorkflow(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Welcome Email");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "created",
          entity: "workflow",
          entityId: "workflow-1",
        }),
      })
    );
  });

  it("should set ownerId from authenticated user", async () => {
    mockPrisma.workflow.create.mockResolvedValue(sampleWorkflow);

    const request = createMockRequest("/api/workflows", {
      method: "POST",
      body: { name: "Test Workflow" },
    });
    await createWorkflow(request);

    const createCall = mockPrisma.workflow.create.mock.calls[0][0];
    expect(createCall?.data.ownerId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should default triggerType to manual", async () => {
    mockPrisma.workflow.create.mockResolvedValue(sampleWorkflow);

    const request = createMockRequest("/api/workflows", {
      method: "POST",
      body: { name: "Manual Workflow" },
    });
    await createWorkflow(request);

    const createCall = mockPrisma.workflow.create.mock.calls[0][0];
    expect(createCall?.data.triggerType).toBe("manual");
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/workflows", {
      method: "POST",
      body: { triggerType: "manual" },
    });
    const response = await createWorkflow(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid triggerType", async () => {
    const request = createMockRequest("/api/workflows", {
      method: "POST",
      body: { name: "Test", triggerType: "invalid_trigger" },
    });
    const response = await createWorkflow(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/workflows/[id] - Get single workflow
// =============================================================================
describe("GET /api/workflows/[id]", () => {
  it("should return workflow", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(sampleWorkflow);

    const request = createMockRequest("/api/workflows/workflow-1");
    const params = createMockParams({ id: "workflow-1" });
    const response = await getWorkflow(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Welcome Email");
  });

  it("should return 404 when workflow not found", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/workflows/nonexistent");
    const params = createMockParams({ id: "nonexistent" });
    const response = await getWorkflow(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(sampleWorkflow);

    const request = createMockRequest("/api/workflows/workflow-1");
    const params = createMockParams({ id: "workflow-1" });
    await getWorkflow(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/workflows/[id] - Update workflow
// =============================================================================
describe("PATCH /api/workflows/[id]", () => {
  it("should update workflow", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(sampleWorkflow);
    const updated = { ...sampleWorkflow, name: "Updated Workflow" };
    mockPrisma.workflow.update.mockResolvedValue(updated);

    const request = createMockRequest("/api/workflows/workflow-1", {
      method: "PATCH",
      body: { name: "Updated Workflow" },
    });
    const params = createMockParams({ id: "workflow-1" });
    const response = await updateWorkflow(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Workflow");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "workflow",
          entityId: "workflow-1",
        }),
      })
    );
  });

  it("should return 404 when workflow not found", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/workflows/nonexistent", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await updateWorkflow(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/workflows/[id] - Soft delete workflow
// =============================================================================
describe("DELETE /api/workflows/[id]", () => {
  it("should soft delete workflow and set isActive=false, status=draft", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(sampleWorkflow);
    mockPrisma.workflow.update.mockResolvedValue(sampleWorkflow);

    const request = createMockRequest("/api/workflows/workflow-1", { method: "DELETE" });
    const params = createMockParams({ id: "workflow-1" });
    const response = await deleteWorkflow(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.workflow.update.mock.calls[0][0];
    expect(updateCall?.data.deletedAt).toBeInstanceOf(Date);
    expect(updateCall?.data.isActive).toBe(false);
    expect(updateCall?.data.status).toBe("draft");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "deleted",
          entity: "workflow",
          entityId: "workflow-1",
        }),
      })
    );
  });

  it("should return 404 when workflow not found", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/workflows/nonexistent", { method: "DELETE" });
    const params = createMockParams({ id: "nonexistent" });
    const response = await deleteWorkflow(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership before deleting", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue(sampleWorkflow);
    mockPrisma.workflow.update.mockResolvedValue(sampleWorkflow);

    const request = createMockRequest("/api/workflows/workflow-1", { method: "DELETE" });
    const params = createMockParams({ id: "workflow-1" });
    await deleteWorkflow(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
