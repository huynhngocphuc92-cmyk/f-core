import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { resetWorkflowRuntimeStoreForTests } from "@/lib/workflow-runtime-store";
import { GET as getRuns, POST as postRun } from "@/app/api/workflows/runtime/runs/route";
import { GET as getDeadLetters, POST as retryDeadLetter } from "@/app/api/workflows/runtime/dead-letter/route";
import { GET as getVersions, POST as createVersion } from "@/app/api/workflows/[id]/versions/route";
import { POST as restoreVersion } from "@/app/api/workflows/[id]/versions/[versionId]/restore/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);
const TENANT_ID = "tenant-workflow-runtime";

const sampleWorkflow = {
  id: "workflow-1",
  tenantId: TENANT_ID,
  name: "Runtime workflow",
  triggerType: "manual",
  triggerConfig: {},
  actions: [{ type: "send_email", config: { template: "welcome" } }],
  status: "active",
  isActive: true,
  deletedAt: null,
};

beforeEach(async () => {
  vi.clearAllMocks();
  await resetWorkflowRuntimeStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
  mockPrisma.workflow.findFirst.mockResolvedValue(sampleWorkflow as any);
  mockPrisma.workflow.update.mockResolvedValue(sampleWorkflow as any);
});

describe("workflow runtime APIs", () => {
  it("runs workflow and returns runtime summary", async () => {
    const runResponse = await postRun(
      createMockRequest("/api/workflows/runtime/runs", {
        method: "POST",
        body: {
          workflowId: "workflow-1",
          maxRetries: 2,
          payload: { failUntilAttempt: 1 },
        },
      })
    );

    const runBody = await getResponseBody(runResponse);
    expect(runResponse.status).toBe(201);
    expect(runBody.run.status).toBe("succeeded");

    const listResponse = await getRuns(createMockRequest("/api/workflows/runtime/runs"));
    const listBody = await getResponseBody(listResponse);
    expect(listResponse.status).toBe(200);
    expect(listBody.summary.totalRuns).toBe(1);
  });

  it("creates and restores workflow versions", async () => {
    const created = await createVersion(
      createMockRequest("/api/workflows/workflow-1/versions", {
        method: "POST",
        body: { label: "before-runtime-change" },
      }),
      createMockParams({ id: "workflow-1" })
    );

    const createdBody = await getResponseBody(created);
    expect(created.status).toBe(201);

    const list = await getVersions(
      createMockRequest("/api/workflows/workflow-1/versions"),
      createMockParams({ id: "workflow-1" })
    );
    const listBody = await getResponseBody(list);
    expect(list.status).toBe(200);
    expect(listBody.data.length).toBe(1);

    const restored = await restoreVersion(
      createMockRequest(`/api/workflows/workflow-1/versions/${createdBody.version.id}/restore`, {
        method: "POST",
      }),
      createMockParams({ id: "workflow-1", versionId: createdBody.version.id })
    );

    expect(restored.status).toBe(200);
    expect(mockPrisma.workflow.update).toHaveBeenCalled();
  });

  it("queues failed run to dead-letter and retries", async () => {
    const runResponse = await postRun(
      createMockRequest("/api/workflows/runtime/runs", {
        method: "POST",
        body: {
          workflowId: "workflow-1",
          maxRetries: 1,
          payload: { forceFail: true },
        },
      })
    );

    const runBody = await getResponseBody(runResponse);
    expect(runBody.run.status).toBe("dead_letter");

    const deadList = await getDeadLetters(
      createMockRequest("/api/workflows/runtime/dead-letter?unresolvedOnly=true")
    );
    const deadBody = await getResponseBody(deadList);
    expect(deadList.status).toBe(200);
    expect(deadBody.data).toHaveLength(1);

    const retried = await retryDeadLetter(
      createMockRequest("/api/workflows/runtime/dead-letter", {
        method: "POST",
        body: {
          deadLetterId: deadBody.data[0].id,
          dryRun: true,
        },
      })
    );
    const retriedBody = await getResponseBody(retried);
    expect(retried.status).toBe(200);
    expect(retriedBody.rerun.status).toBe("succeeded");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));
    const response = await getRuns(createMockRequest("/api/workflows/runtime/runs"));
    expect(response.status).toBe(401);
  });
});
