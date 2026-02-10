import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import { GET as listPipelines, POST as createPipeline } from "@/app/api/pipelines/route";
import {
  GET as getPipeline,
  PATCH as updatePipeline,
  DELETE as deletePipeline,
} from "@/app/api/pipelines/[id]/route";
import {
  GET as listStages,
  POST as createStage,
} from "@/app/api/pipelines/[id]/stages/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const samplePipeline = {
  id: "pipeline-1",
  tenantId: TENANT_ID,
  name: "Sales Pipeline",
  description: "Main sales pipeline",
  isDefault: true,
  isActive: true,
  stages: [
    { id: "stage-1", name: "Qualification", orderIndex: 0, probability: 20, color: "#blue", isClosed: false, isWon: false },
    { id: "stage-2", name: "Closed Won", orderIndex: 1, probability: 100, color: "#green", isClosed: true, isWon: true },
  ],
  _count: { deals: 5 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleStage = {
  id: "stage-new",
  pipelineId: "pipeline-1",
  name: "New Stage",
  orderIndex: 2,
  probability: 50,
  color: "#orange",
  isClosed: false,
  isWon: false,
  _count: { deals: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
});

// =============================================================================
// GET /api/pipelines - List pipelines
// =============================================================================
describe("GET /api/pipelines", () => {
  it("should return paginated pipelines with stages", async () => {
    mockPrisma.pipeline.findMany.mockResolvedValue([samplePipeline]);
    mockPrisma.pipeline.count.mockResolvedValue(1);

    const request = createMockRequest("/api/pipelines");
    const response = await listPipelines(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Sales Pipeline");
    expect(body.data[0].stages).toHaveLength(2);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/pipelines");
    const response = await listPipelines(request);

    expect(response.status).toBe(401);
  });
});

// =============================================================================
// POST /api/pipelines - Create pipeline
// =============================================================================
describe("POST /api/pipelines", () => {
  it("should create a pipeline", async () => {
    mockPrisma.pipeline.create.mockResolvedValue(samplePipeline);

    const request = createMockRequest("/api/pipelines", {
      method: "POST",
      body: { name: "Sales Pipeline", description: "Main pipeline" },
    });
    const response = await createPipeline(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Sales Pipeline");
  });

  it("should unset other defaults when isDefault is true", async () => {
    mockPrisma.pipeline.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.pipeline.create.mockResolvedValue(samplePipeline);

    const request = createMockRequest("/api/pipelines", {
      method: "POST",
      body: { name: "New Default", isDefault: true },
    });
    await createPipeline(request);

    expect(mockPrisma.pipeline.updateMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, isDefault: true },
      data: { isDefault: false },
    });
  });

  it("should return 400 when name is missing (Zod validation)", async () => {
    const request = createMockRequest("/api/pipelines", {
      method: "POST",
      body: { description: "No name" },
    });
    const response = await createPipeline(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/pipelines/[id] - Get single pipeline
// =============================================================================
describe("GET /api/pipelines/[id]", () => {
  it("should return pipeline with stages", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(samplePipeline);

    const request = createMockRequest("/api/pipelines/pipeline-1");
    const params = createMockParams({ id: "pipeline-1" });
    const response = await getPipeline(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Sales Pipeline");
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/nonexistent");
    const params = createMockParams({ id: "nonexistent" });
    const response = await getPipeline(request, params);

    expect(response.status).toBe(404);
  });

  it("should check tenant ownership", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(samplePipeline);

    const request = createMockRequest("/api/pipelines/pipeline-1");
    const params = createMockParams({ id: "pipeline-1" });
    await getPipeline(request, params);

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});

// =============================================================================
// PATCH /api/pipelines/[id] - Update pipeline
// =============================================================================
describe("PATCH /api/pipelines/[id]", () => {
  it("should update pipeline", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(samplePipeline);
    const updated = { ...samplePipeline, name: "Updated Pipeline" };
    mockPrisma.pipeline.update.mockResolvedValue(updated);

    const request = createMockRequest("/api/pipelines/pipeline-1", {
      method: "PATCH",
      body: { name: "Updated Pipeline" },
    });
    const params = createMockParams({ id: "pipeline-1" });
    const response = await updatePipeline(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Pipeline");
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/nonexistent", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await updatePipeline(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/pipelines/[id] - Delete pipeline
// =============================================================================
describe("DELETE /api/pipelines/[id]", () => {
  it("should delete pipeline without deals", async () => {
    const deletable = {
      ...samplePipeline,
      isDefault: false,
      _count: { deals: 0 },
    };
    mockPrisma.pipeline.findUnique.mockResolvedValue(deletable);
    mockPrisma.pipeline.delete.mockResolvedValue(deletable);

    const request = createMockRequest("/api/pipelines/pipeline-1", { method: "DELETE" });
    const params = createMockParams({ id: "pipeline-1" });
    const response = await deletePipeline(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should return 400 when deleting default pipeline", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      ...samplePipeline,
      isDefault: true,
      _count: { deals: 0 },
    });

    const request = createMockRequest("/api/pipelines/pipeline-1", { method: "DELETE" });
    const params = createMockParams({ id: "pipeline-1" });
    const response = await deletePipeline(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/default/i);
  });

  it("should return 400 when pipeline has deals", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      ...samplePipeline,
      isDefault: false,
      _count: { deals: 3 },
    });

    const request = createMockRequest("/api/pipelines/pipeline-1", { method: "DELETE" });
    const params = createMockParams({ id: "pipeline-1" });
    const response = await deletePipeline(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/deals/i);
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/nonexistent", { method: "DELETE" });
    const params = createMockParams({ id: "nonexistent" });
    const response = await deletePipeline(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// GET /api/pipelines/[id]/stages - List stages
// =============================================================================
describe("GET /api/pipelines/[id]/stages", () => {
  it("should return stages for a pipeline", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(samplePipeline);
    mockPrisma.pipelineStage.findMany.mockResolvedValue(samplePipeline.stages);

    const request = createMockRequest("/api/pipelines/pipeline-1/stages");
    const params = createMockParams({ id: "pipeline-1" });
    const response = await listStages(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/nonexistent/stages");
    const params = createMockParams({ id: "nonexistent" });
    const response = await listStages(request, params);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// POST /api/pipelines/[id]/stages - Create stage
// =============================================================================
describe("POST /api/pipelines/[id]/stages", () => {
  it("should create a stage", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(samplePipeline);
    mockPrisma.pipelineStage.findFirst.mockResolvedValue({ orderIndex: 1 });
    mockPrisma.pipelineStage.create.mockResolvedValue(sampleStage);

    const request = createMockRequest("/api/pipelines/pipeline-1/stages", {
      method: "POST",
      body: { name: "New Stage", probability: 50 },
    });
    const params = createMockParams({ id: "pipeline-1" });
    const response = await createStage(request, params);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("New Stage");
  });

  it("should return 400 when name is missing", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(samplePipeline);

    const request = createMockRequest("/api/pipelines/pipeline-1/stages", {
      method: "POST",
      body: { probability: 50 },
    });
    const params = createMockParams({ id: "pipeline-1" });
    const response = await createStage(request, params);

    expect(response.status).toBe(400);
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/nonexistent/stages", {
      method: "POST",
      body: { name: "Stage" },
    });
    const params = createMockParams({ id: "nonexistent" });
    const response = await createStage(request, params);

    expect(response.status).toBe(404);
  });
});
