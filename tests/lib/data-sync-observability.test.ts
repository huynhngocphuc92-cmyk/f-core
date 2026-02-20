import { beforeEach, describe, expect, it } from "vitest";
import {
  listSyncObservability,
  resetDataSyncStoreForTests,
  retrySyncJob,
  runSyncJob,
  summarizeSyncObservability,
  upsertSyncMapping,
} from "@/lib/data-sync-store";

const TENANT_ID = "tenant-test-id";

describe("data sync observability", () => {
  beforeEach(async () => {
    await resetDataSyncStoreForTests();
  });

  it("stores traces, diagnostics, and lineage on job execution", async () => {
    const mapping = await upsertSyncMapping(TENANT_ID, {
      integration: "salesforce",
      objectType: "contact",
      direction: "bidirectional",
      conflictResolution: "manual_review",
      enabled: true,
      fieldMappings: [{ localField: "email", remoteField: "Email", transform: "none" }],
    });

    const job = await runSyncJob(TENANT_ID, {
      mappingId: mapping.id,
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
    });

    expect(job.traces.length).toBeGreaterThan(0);
    expect(job.lineage.length).toBeGreaterThan(0);
    expect(job.diagnostics.length).toBeGreaterThan(0);
  });

  it("retries job and links attempt lineage", async () => {
    const mapping = await upsertSyncMapping(TENANT_ID, {
      integration: "hubspot",
      objectType: "deal",
      direction: "import",
      conflictResolution: "remote_wins",
      enabled: true,
      fieldMappings: [{ localField: "amount", remoteField: "amount", transform: "none" }],
    });

    const first = await runSyncJob(TENANT_ID, {
      mappingId: mapping.id,
      dryRun: true,
      records: [{ externalId: "2", localExists: false, remoteExists: true }],
    });

    const retried = await retrySyncJob(TENANT_ID, first.id, { dryRun: true });

    expect(retried.attempt).toBe(2);
    expect(retried.retriedFromJobId).toBe(first.id);

    const summary = await summarizeSyncObservability(TENANT_ID);
    expect(summary.retries).toBe(1);
  });

  it("marks retry as failed when mapping becomes disabled", async () => {
    const mapping = await upsertSyncMapping(TENANT_ID, {
      integration: "netsuite",
      objectType: "company",
      direction: "export",
      conflictResolution: "local_wins",
      enabled: true,
      fieldMappings: [{ localField: "name", remoteField: "companyName", transform: "none" }],
    });

    const first = await runSyncJob(TENANT_ID, {
      mappingId: mapping.id,
      dryRun: false,
      records: [{ externalId: "3", localExists: true, remoteExists: false }],
    });

    await upsertSyncMapping(TENANT_ID, {
      integration: "netsuite",
      objectType: "company",
      direction: "export",
      conflictResolution: "local_wins",
      enabled: false,
      fieldMappings: [{ localField: "name", remoteField: "companyName", transform: "none" }],
    });

    const retried = await retrySyncJob(TENANT_ID, first.id, { dryRun: false });

    expect(retried.status).toBe("failed");
    expect(retried.diagnostics[0].code).toBe("mapping_disabled");

    const list = await listSyncObservability(TENANT_ID, { status: "failed" });
    expect(list).toHaveLength(1);
  });
});
