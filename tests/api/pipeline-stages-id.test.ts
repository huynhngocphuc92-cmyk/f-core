import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import {
  GET as getStage,
  PATCH as updateStage,
  DELETE as deleteStage,
} from "@/app/api/pipelines/[id]/stages/[stageId]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

// =============================================================================
// GET /api/pipelines/[id]/stages/[stageId]
// =============================================================================
describe("GET /api/pipelines/[id]/stages/[stageId]", () => {
  it("should return a stage", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      id: "pipe-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.pipelineStage.findUnique.mockResolvedValue({
      id: "stage-1",
      name: "Qualification",
      pipelineId: "pipe-1",
      _count: { deals: 5 },
    } as any);

    const request = createMockRequest("/api/pipelines/pipe-1/stages/stage-1");
    const response = await getStage(
      request,
      createMockParams({ id: "pipe-1", stageId: "stage-1" })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Qualification");
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/missing/stages/stage-1");
    const response = await getStage(
      request,
      createMockParams({ id: "missing", stageId: "stage-1" })
    );

    expect(response.status).toBe(404);
  });

  it("should return 404 when stage not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      id: "pipe-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.pipelineStage.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/pipe-1/stages/missing");
    const response = await getStage(
      request,
      createMockParams({ id: "pipe-1", stageId: "missing" })
    );

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/pipelines/[id]/stages/[stageId]
// =============================================================================
describe("PATCH /api/pipelines/[id]/stages/[stageId]", () => {
  it("should update a stage", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      id: "pipe-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.pipelineStage.findUnique.mockResolvedValue({
      id: "stage-1",
      pipelineId: "pipe-1",
    } as any);
    mockPrisma.pipelineStage.update.mockResolvedValue({
      id: "stage-1",
      name: "Updated Stage",
      probability: 50,
    } as any);

    const request = createMockRequest("/api/pipelines/pipe-1/stages/stage-1", {
      method: "PATCH",
      body: { name: "Updated Stage", probability: 50 },
    });
    const response = await updateStage(
      request,
      createMockParams({ id: "pipe-1", stageId: "stage-1" })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated Stage");
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/missing/stages/stage-1", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateStage(
      request,
      createMockParams({ id: "missing", stageId: "stage-1" })
    );

    expect(response.status).toBe(404);
  });

  it("should return 404 when stage not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      id: "pipe-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.pipelineStage.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/pipe-1/stages/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateStage(
      request,
      createMockParams({ id: "pipe-1", stageId: "missing" })
    );

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/pipelines/[id]/stages/[stageId]
// =============================================================================
describe("DELETE /api/pipelines/[id]/stages/[stageId]", () => {
  it("should delete a stage with no deals", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      id: "pipe-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.pipelineStage.findUnique.mockResolvedValue({
      id: "stage-1",
      pipelineId: "pipe-1",
      _count: { deals: 0 },
    } as any);
    mockPrisma.pipelineStage.delete.mockResolvedValue({} as any);

    const request = createMockRequest("/api/pipelines/pipe-1/stages/stage-1", {
      method: "DELETE",
    });
    const response = await deleteStage(
      request,
      createMockParams({ id: "pipe-1", stageId: "stage-1" })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should return 400 when stage has deals", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      id: "pipe-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.pipelineStage.findUnique.mockResolvedValue({
      id: "stage-1",
      pipelineId: "pipe-1",
      _count: { deals: 3 },
    } as any);

    const request = createMockRequest("/api/pipelines/pipe-1/stages/stage-1", {
      method: "DELETE",
    });
    const response = await deleteStage(
      request,
      createMockParams({ id: "pipe-1", stageId: "stage-1" })
    );

    expect(response.status).toBe(400);
  });

  it("should return 404 when pipeline not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/missing/stages/stage-1", {
      method: "DELETE",
    });
    const response = await deleteStage(
      request,
      createMockParams({ id: "missing", stageId: "stage-1" })
    );

    expect(response.status).toBe(404);
  });

  it("should return 404 when stage not found", async () => {
    mockPrisma.pipeline.findUnique.mockResolvedValue({
      id: "pipe-1",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.pipelineStage.findUnique.mockResolvedValue(null);

    const request = createMockRequest("/api/pipelines/pipe-1/stages/missing", {
      method: "DELETE",
    });
    const response = await deleteStage(
      request,
      createMockParams({ id: "pipe-1", stageId: "missing" })
    );

    expect(response.status).toBe(404);
  });
});
