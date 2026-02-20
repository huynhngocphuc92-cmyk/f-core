import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as listMappingsApi, PUT as upsertMappingApi } from "@/app/api/data/sync/mappings/route";
import { GET as listJobsApi, POST as runJobApi } from "@/app/api/data/sync/jobs/route";
import { resetDataSyncStoreForTests } from "@/lib/data-sync-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDataSyncStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("data sync APIs", () => {
  it("upserts mapping and runs conflict-safe sync job", async () => {
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

    expect(mappingResponse.status).toBe(200);

    const jobResponse = await runJobApi(
      createMockRequest("/api/data/sync/jobs", {
        method: "POST",
        body: {
          mappingId: mappingBody.mapping.id,
          dryRun: false,
          records: [
            {
              externalId: "1",
              localUpdatedAt: "2026-02-15T10:00:00.000Z",
              remoteUpdatedAt: "2026-02-15T10:05:00.000Z",
              localExists: true,
              remoteExists: true,
            },
            {
              externalId: "2",
              localUpdatedAt: "2026-02-15T10:00:00.000Z",
              remoteUpdatedAt: "2026-02-15T10:00:00.000Z",
              localExists: true,
              remoteExists: true,
            },
          ],
        },
      })
    );
    const jobBody = await getResponseBody(jobResponse);

    expect(jobResponse.status).toBe(201);
    expect(jobBody.job.conflicts).toBe(1);

    const listMappingResponse = await listMappingsApi(createMockRequest("/api/data/sync/mappings"));
    const listMappingBody = await getResponseBody(listMappingResponse);
    expect(listMappingResponse.status).toBe(200);
    expect(listMappingBody.data).toHaveLength(1);

    const listJobsResponse = await listJobsApi(createMockRequest("/api/data/sync/jobs"));
    const listJobsBody = await getResponseBody(listJobsResponse);
    expect(listJobsResponse.status).toBe(200);
    expect(listJobsBody.data).toHaveLength(1);
  });

  it("returns 409 when mapping is not found", async () => {
    const response = await runJobApi(
      createMockRequest("/api/data/sync/jobs", {
        method: "POST",
        body: {
          mappingId: "missing",
          dryRun: true,
          records: [
            {
              externalId: "x",
              localExists: true,
              remoteExists: true,
            },
          ],
        },
      })
    );

    expect(response.status).toBe(409);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));
    const response = await listMappingsApi(createMockRequest("/api/data/sync/mappings"));
    expect(response.status).toBe(401);
  });
});
