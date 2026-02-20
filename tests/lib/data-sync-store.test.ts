import { beforeEach, describe, expect, it } from "vitest";
import {
  listSyncJobs,
  listSyncMappings,
  resetDataSyncStoreForTests,
  runSyncJob,
  upsertSyncMapping,
} from "@/lib/data-sync-store";

const TENANT_ID = "tenant-test-id";

describe("data sync store", () => {
  beforeEach(async () => {
    await resetDataSyncStoreForTests();
  });

  it("upserts mapping by integration and object", async () => {
    const first = await upsertSyncMapping(TENANT_ID, {
      integration: "salesforce",
      objectType: "contact",
      direction: "bidirectional",
      conflictResolution: "manual_review",
      enabled: true,
      fieldMappings: [{ localField: "email", remoteField: "Email", transform: "none" }],
    });

    const second = await upsertSyncMapping(TENANT_ID, {
      integration: "salesforce",
      objectType: "contact",
      direction: "import",
      conflictResolution: "remote_wins",
      enabled: true,
      fieldMappings: [{ localField: "firstName", remoteField: "FirstName", transform: "none" }],
    });

    expect(await listSyncMappings(TENANT_ID)).toHaveLength(1);
    expect(first.id).toBe(second.id);
    expect(second.direction).toBe("import");
  });

  it("runs sync job and keeps conflicts in manual review", async () => {
    const mapping = await upsertSyncMapping(TENANT_ID, {
      integration: "hubspot",
      objectType: "deal",
      direction: "bidirectional",
      conflictResolution: "manual_review",
      enabled: true,
      fieldMappings: [{ localField: "amount", remoteField: "amount", transform: "none" }],
    });

    const job = await runSyncJob(TENANT_ID, {
      mappingId: mapping.id,
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
          localUpdatedAt: "2026-02-15T09:00:00.000Z",
          remoteUpdatedAt: "2026-02-15T09:00:00.000Z",
          localExists: true,
          remoteExists: true,
        },
      ],
    });

    expect(job.status).toBe("completed_with_conflicts");
    expect(job.conflicts).toBe(1);
    expect(job.processed).toBe(2);
    expect(await listSyncJobs(TENANT_ID)).toHaveLength(1);
  });

  it("respects direction and conflict policy", async () => {
    const mapping = await upsertSyncMapping(TENANT_ID, {
      integration: "netsuite",
      objectType: "company",
      direction: "export",
      conflictResolution: "local_wins",
      enabled: true,
      fieldMappings: [{ localField: "name", remoteField: "companyName", transform: "none" }],
    });

    const job = await runSyncJob(TENANT_ID, {
      mappingId: mapping.id,
      dryRun: false,
      records: [
        {
          externalId: "3",
          localUpdatedAt: "2026-02-15T11:00:00.000Z",
          remoteUpdatedAt: "2026-02-15T10:00:00.000Z",
          localExists: true,
          remoteExists: true,
        },
      ],
    });

    expect(job.exported).toBe(1);
    expect(job.imported).toBe(0);
    expect(job.conflicts).toBe(0);
  });
});
