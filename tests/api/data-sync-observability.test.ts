import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { PUT as upsertMappingApi } from "@/app/api/data/sync/mappings/route";
import { POST as runJobApi } from "@/app/api/data/sync/jobs/route";
import { GET as observabilityApi } from "@/app/api/data/sync/observability/route";
import { POST as retryJobApi } from "@/app/api/data/sync/jobs/[id]/retry/route";
import { resetDataSyncStoreForTests } from "@/lib/data-sync-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDataSyncStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("data sync observability APIs", () => {
  it("returns observability summary and job details", async () => {
    const mappingResponse = await upsertMappingApi(
      createMockRequest("/api/data/sync/mappings", {
        method: "PUT",
        body: {
          integration: "salesforce",
          objectType: "contact",
          direction: "bidirectional",
          conflictResolution: "manual_review",
          enabled: true,
          fieldMappings: [{ localField: "email", remoteField: "Email", transform: "none" }],
        },
      })
    );
    const mappingBody = await getResponseBody(mappingResponse);

    const jobResponse = await runJobApi(
      createMockRequest("/api/data/sync/jobs", {
        method: "POST",
        body: {
          mappingId: mappingBody.mapping.id,
          dryRun: true,
          records: [
            {
              externalId: "1",
              localUpdatedAt: "2026-02-15T10:00:00.000Z",
              remoteUpdatedAt: "2026-02-15T10:05:00.000Z",
              localExists: true,
              remoteExists: true,
            },
          ],
        },
      })
    );
    const jobBody = await getResponseBody(jobResponse);

    const list = await observabilityApi(createMockRequest("/api/data/sync/observability"));
    const listBody = await getResponseBody(list);

    expect(list.status).toBe(200);
    expect(listBody.summary.totalJobs).toBe(1);
    expect(listBody.data[0].traceCount).toBeGreaterThan(0);

    const details = await observabilityApi(
      createMockRequest("/api/data/sync/observability", {
        searchParams: { jobId: jobBody.job.id },
      })
    );
    const detailsBody = await getResponseBody(details);

    expect(details.status).toBe(200);
    expect(detailsBody.job.id).toBe(jobBody.job.id);
    expect(detailsBody.job.traces.length).toBeGreaterThan(0);
  });

  it("retries job by id", async () => {
    const mappingResponse = await upsertMappingApi(
      createMockRequest("/api/data/sync/mappings", {
        method: "PUT",
        body: {
          integration: "hubspot",
          objectType: "deal",
          direction: "import",
          conflictResolution: "remote_wins",
          enabled: true,
          fieldMappings: [{ localField: "amount", remoteField: "amount", transform: "none" }],
        },
      })
    );
    const mappingBody = await getResponseBody(mappingResponse);

    const jobResponse = await runJobApi(
      createMockRequest("/api/data/sync/jobs", {
        method: "POST",
        body: {
          mappingId: mappingBody.mapping.id,
          dryRun: true,
          records: [{ externalId: "2", localExists: false, remoteExists: true }],
        },
      })
    );
    const jobBody = await getResponseBody(jobResponse);

    const retried = await retryJobApi(
      createMockRequest(`/api/data/sync/jobs/${jobBody.job.id}/retry`, {
        method: "POST",
        body: { dryRun: true },
      }),
      createMockParams({ id: jobBody.job.id })
    );
    const retriedBody = await getResponseBody(retried);

    expect(retried.status).toBe(201);
    expect(retriedBody.job.retriedFromJobId).toBe(jobBody.job.id);
    expect(retriedBody.job.attempt).toBe(2);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await observabilityApi(createMockRequest("/api/data/sync/observability"));
    expect(response.status).toBe(401);
  });
});
