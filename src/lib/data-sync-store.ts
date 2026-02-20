import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const syncIntegrationSchema = z.enum(["salesforce", "hubspot", "netsuite", "snowflake"]);
export const syncObjectTypeSchema = z.enum(["contact", "company", "deal"]);
export const syncDirectionSchema = z.enum(["import", "export", "bidirectional"]);
export const conflictResolutionSchema = z.enum(["local_wins", "remote_wins", "manual_review"]);

export const fieldMappingSchema = z.object({
  localField: z.string().min(1).max(120),
  remoteField: z.string().min(1).max(120),
  transform: z.enum(["none", "lowercase", "uppercase", "trim"]).default("none"),
});

export const upsertSyncMappingSchema = z.object({
  integration: syncIntegrationSchema,
  objectType: syncObjectTypeSchema,
  direction: syncDirectionSchema,
  conflictResolution: conflictResolutionSchema,
  enabled: z.boolean().default(true),
  fieldMappings: z.array(fieldMappingSchema).min(1).max(100),
});

export const syncRecordInputSchema = z.object({
  externalId: z.string().min(1).max(120),
  localUpdatedAt: z.string().datetime().optional(),
  remoteUpdatedAt: z.string().datetime().optional(),
  localExists: z.boolean().default(true),
  remoteExists: z.boolean().default(true),
});

export const runSyncJobSchema = z.object({
  mappingId: z.string().min(1),
  dryRun: z.boolean().default(false),
  records: z.array(syncRecordInputSchema).min(1).max(1000),
});

export const retrySyncJobSchema = z.object({
  dryRun: z.boolean().default(true),
});

export type DataSyncMapping = {
  id: string;
  tenantId: string;
  integration: z.infer<typeof syncIntegrationSchema>;
  objectType: z.infer<typeof syncObjectTypeSchema>;
  direction: z.infer<typeof syncDirectionSchema>;
  conflictResolution: z.infer<typeof conflictResolutionSchema>;
  enabled: boolean;
  fieldMappings: Array<z.infer<typeof fieldMappingSchema>>;
  createdAt: string;
  updatedAt: string;
};

export type DataSyncConflict = {
  externalId: string;
  reason: string;
  resolution: z.infer<typeof conflictResolutionSchema>;
};

export type DataSyncDiagnostic = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
};

export type DataSyncTraceStep = {
  id: string;
  name: "prepare" | "validate" | "detect_conflicts" | "apply_changes" | "finalize";
  status: "ok" | "warning" | "error";
  startedAt: string;
  endedAt: string;
  durationMs: number;
  details?: Record<string, unknown>;
};

export type DataSyncLineageEvent = {
  id: string;
  jobId: string;
  entityType: z.infer<typeof syncObjectTypeSchema>;
  entityExternalId: string;
  action: "import" | "export" | "skip" | "conflict";
  direction: z.infer<typeof syncDirectionSchema>;
  timestamp: string;
};

export type DataSyncJob = {
  id: string;
  tenantId: string;
  mappingId: string;
  integration: z.infer<typeof syncIntegrationSchema>;
  objectType: z.infer<typeof syncObjectTypeSchema>;
  direction: z.infer<typeof syncDirectionSchema>;
  status: "completed" | "completed_with_conflicts" | "failed";
  dryRun: boolean;
  attempt: number;
  retriedFromJobId: string | null;
  processed: number;
  imported: number;
  exported: number;
  skipped: number;
  conflicts: number;
  conflictItems: DataSyncConflict[];
  diagnostics: DataSyncDiagnostic[];
  traces: DataSyncTraceStep[];
  lineage: DataSyncLineageEvent[];
  sourceRecords: Array<z.infer<typeof syncRecordInputSchema>>;
  startedAt: string;
  completedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function parseJsonValue<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return fallback;
  }
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeSyncMapping(record: {
  id: string;
  tenantId: string;
  integration: string;
  objectType: string;
  direction: string;
  conflictResolution: string;
  enabled: boolean;
  fieldMappings: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): DataSyncMapping {
  return {
    id: record.id,
    tenantId: record.tenantId,
    integration: syncIntegrationSchema.parse(record.integration),
    objectType: syncObjectTypeSchema.parse(record.objectType),
    direction: syncDirectionSchema.parse(record.direction),
    conflictResolution: conflictResolutionSchema.parse(record.conflictResolution),
    enabled: record.enabled,
    fieldMappings: parseJsonValue<Array<z.infer<typeof fieldMappingSchema>>>(record.fieldMappings, []),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeSyncJob(record: {
  id: string;
  tenantId: string;
  mappingId: string;
  integration: string;
  objectType: string;
  direction: string;
  status: string;
  dryRun: boolean;
  attempt: number;
  retriedFromJobId: string | null;
  processed: number;
  imported: number;
  exported: number;
  skipped: number;
  conflicts: number;
  conflictItems: Prisma.JsonValue;
  diagnostics: Prisma.JsonValue;
  traces: Prisma.JsonValue;
  lineage: Prisma.JsonValue;
  sourceRecords: Prisma.JsonValue;
  startedAt: Date;
  completedAt: Date;
}): DataSyncJob {
  return {
    id: record.id,
    tenantId: record.tenantId,
    mappingId: record.mappingId,
    integration: syncIntegrationSchema.parse(record.integration),
    objectType: syncObjectTypeSchema.parse(record.objectType),
    direction: syncDirectionSchema.parse(record.direction),
    status:
      record.status === "failed"
        ? "failed"
        : record.status === "completed_with_conflicts"
          ? "completed_with_conflicts"
          : "completed",
    dryRun: record.dryRun,
    attempt: record.attempt,
    retriedFromJobId: record.retriedFromJobId,
    processed: record.processed,
    imported: record.imported,
    exported: record.exported,
    skipped: record.skipped,
    conflicts: record.conflicts,
    conflictItems: parseJsonValue<DataSyncConflict[]>(record.conflictItems, []),
    diagnostics: parseJsonValue<DataSyncDiagnostic[]>(record.diagnostics, []),
    traces: parseJsonValue<DataSyncTraceStep[]>(record.traces, []),
    lineage: parseJsonValue<DataSyncLineageEvent[]>(record.lineage, []),
    sourceRecords: parseJsonValue<Array<z.infer<typeof syncRecordInputSchema>>>(record.sourceRecords, []),
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt.toISOString(),
  };
}

async function getMappingOrThrow(tenantId: string, mappingId: string) {
  const mapping = await prisma.dataSyncMapping.findFirst({
    where: {
      tenantId,
      id: mappingId,
    },
  });

  if (!mapping) {
    throw new Error("Sync mapping not found");
  }

  return normalizeSyncMapping(mapping);
}

async function getJobOrThrow(tenantId: string, jobId: string) {
  const job = await prisma.dataSyncJob.findFirst({
    where: {
      tenantId,
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("Sync job not found");
  }

  return normalizeSyncJob(job);
}

function createTraceStep(
  name: DataSyncTraceStep["name"],
  status: DataSyncTraceStep["status"],
  startedAt: string,
  details?: Record<string, unknown>
): DataSyncTraceStep {
  const endedAt = nowIso();
  return {
    id: randomUUID(),
    name,
    status,
    startedAt,
    endedAt,
    durationMs: Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime()),
    details,
  };
}

async function createFailedSyncJob(
  tenantId: string,
  input: {
    mappingId: string;
    integration?: z.infer<typeof syncIntegrationSchema>;
    objectType?: z.infer<typeof syncObjectTypeSchema>;
    direction?: z.infer<typeof syncDirectionSchema>;
    dryRun: boolean;
    attempt: number;
    retriedFromJobId: string | null;
    records: Array<z.infer<typeof syncRecordInputSchema>>;
    errorCode: string;
    message: string;
  }
): Promise<DataSyncJob> {
  const startedAtIso = nowIso();
  const completedAtIso = nowIso();
  const prepareStartedAt = nowIso();
  const validateStartedAt = nowIso();

  const created = await prisma.dataSyncJob.create({
    data: {
      tenantId,
      mappingId: input.mappingId,
      integration: input.integration || "salesforce",
      objectType: input.objectType || "contact",
      direction: input.direction || "bidirectional",
      status: "failed",
      dryRun: input.dryRun,
      attempt: input.attempt,
      retriedFromJobId: input.retriedFromJobId,
      processed: input.records.length,
      imported: 0,
      exported: 0,
      skipped: input.records.length,
      conflicts: 0,
      conflictItems: toInputJsonValue([]),
      diagnostics: toInputJsonValue([
        {
          code: input.errorCode,
          severity: "error",
          message: input.message,
        },
      ] satisfies DataSyncDiagnostic[]),
      traces: toInputJsonValue([
        createTraceStep("prepare", "ok", prepareStartedAt, { records: input.records.length }),
        createTraceStep("validate", "error", validateStartedAt, { message: input.message }),
      ] satisfies DataSyncTraceStep[]),
      lineage: toInputJsonValue([]),
      sourceRecords: toInputJsonValue(input.records),
      startedAt: new Date(startedAtIso),
      completedAt: new Date(completedAtIso),
    },
  });

  return normalizeSyncJob(created);
}

export async function listSyncMappings(
  tenantId: string,
  filters?: {
    integration?: z.infer<typeof syncIntegrationSchema>;
    objectType?: z.infer<typeof syncObjectTypeSchema>;
  }
): Promise<DataSyncMapping[]> {
  const rows = await prisma.dataSyncMapping.findMany({
    where: {
      tenantId,
      integration: filters?.integration,
      objectType: filters?.objectType,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rows.map(normalizeSyncMapping);
}

export async function upsertSyncMapping(
  tenantId: string,
  payload: z.infer<typeof upsertSyncMappingSchema>
): Promise<DataSyncMapping> {
  const existing = await prisma.dataSyncMapping.findFirst({
    where: {
      tenantId,
      integration: payload.integration,
      objectType: payload.objectType,
    },
  });

  const mapping = existing
    ? await prisma.dataSyncMapping.update({
        where: { id: existing.id },
      data: {
          direction: payload.direction,
          conflictResolution: payload.conflictResolution,
          enabled: payload.enabled,
          fieldMappings: toInputJsonValue(payload.fieldMappings),
        },
      })
    : await prisma.dataSyncMapping.create({
        data: {
          tenantId,
          integration: payload.integration,
          objectType: payload.objectType,
          direction: payload.direction,
          conflictResolution: payload.conflictResolution,
          enabled: payload.enabled,
          fieldMappings: toInputJsonValue(payload.fieldMappings),
        },
      });

  return normalizeSyncMapping(mapping);
}

export async function listSyncJobs(tenantId: string, mappingId?: string): Promise<DataSyncJob[]> {
  const jobs = await prisma.dataSyncJob.findMany({
    where: {
      tenantId,
      mappingId: mappingId || undefined,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  return jobs.map(normalizeSyncJob);
}

export async function runSyncJob(
  tenantId: string,
  payload: z.infer<typeof runSyncJobSchema>,
  meta?: {
    attempt?: number;
    retriedFromJobId?: string | null;
  }
): Promise<DataSyncJob> {
  const mapping = await getMappingOrThrow(tenantId, payload.mappingId);

  if (!mapping.enabled) {
    return createFailedSyncJob(tenantId, {
      mappingId: payload.mappingId,
      integration: mapping.integration,
      objectType: mapping.objectType,
      direction: mapping.direction,
      dryRun: payload.dryRun,
      attempt: meta?.attempt || 1,
      retriedFromJobId: meta?.retriedFromJobId || null,
      records: payload.records,
      errorCode: "mapping_disabled",
      message: "Sync mapping is disabled",
    });
  }

  const startedAt = nowIso();
  const traces: DataSyncTraceStep[] = [];
  const diagnostics: DataSyncDiagnostic[] = [];
  const lineage: DataSyncLineageEvent[] = [];

  const prepareStartedAt = nowIso();
  traces.push(
    createTraceStep("prepare", "ok", prepareStartedAt, {
      mappingId: mapping.id,
      direction: mapping.direction,
      records: payload.records.length,
      dryRun: payload.dryRun,
    })
  );

  let imported = 0;
  let exported = 0;
  let skipped = 0;
  const conflictItems: DataSyncConflict[] = [];

  const validateStartedAt = nowIso();
  let invalidTimestampCount = 0;
  for (const record of payload.records) {
    if (record.localUpdatedAt && Number.isNaN(new Date(record.localUpdatedAt).getTime())) {
      invalidTimestampCount += 1;
    }
    if (record.remoteUpdatedAt && Number.isNaN(new Date(record.remoteUpdatedAt).getTime())) {
      invalidTimestampCount += 1;
    }
  }

  if (invalidTimestampCount > 0) {
    diagnostics.push({
      code: "invalid_timestamp",
      severity: "warning",
      message: `${invalidTimestampCount} timestamp values were invalid and ignored during comparison`,
    });
  }

  traces.push(
    createTraceStep("validate", invalidTimestampCount > 0 ? "warning" : "ok", validateStartedAt, {
      invalidTimestampCount,
    })
  );

  const detectStartedAt = nowIso();

  for (const record of payload.records) {
    const localTimeRaw = record.localUpdatedAt ? new Date(record.localUpdatedAt).getTime() : null;
    const remoteTimeRaw = record.remoteUpdatedAt ? new Date(record.remoteUpdatedAt).getTime() : null;
    const localTime = typeof localTimeRaw === "number" && Number.isFinite(localTimeRaw) ? localTimeRaw : null;
    const remoteTime = typeof remoteTimeRaw === "number" && Number.isFinite(remoteTimeRaw) ? remoteTimeRaw : null;

    const localExists = record.localExists;
    const remoteExists = record.remoteExists;

    if (!localExists && !remoteExists) {
      skipped += 1;
      lineage.push({
        id: randomUUID(),
        jobId: "",
        entityType: mapping.objectType,
        entityExternalId: record.externalId,
        action: "skip",
        direction: mapping.direction,
        timestamp: nowIso(),
      });
      continue;
    }

    const hasConflict =
      localExists &&
      remoteExists &&
      localTime !== null &&
      remoteTime !== null &&
      localTime !== remoteTime;

    if (hasConflict) {
      if (mapping.conflictResolution === "manual_review") {
        conflictItems.push({
          externalId: record.externalId,
          reason: "Local and remote versions diverged",
          resolution: "manual_review",
        });
        skipped += 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "conflict",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
        continue;
      }

      if (mapping.conflictResolution === "local_wins") {
        if (mapping.direction === "import") {
          skipped += 1;
          lineage.push({
            id: randomUUID(),
            jobId: "",
            entityType: mapping.objectType,
            entityExternalId: record.externalId,
            action: "skip",
            direction: mapping.direction,
            timestamp: nowIso(),
          });
        } else {
          exported += payload.dryRun ? 0 : 1;
          lineage.push({
            id: randomUUID(),
            jobId: "",
            entityType: mapping.objectType,
            entityExternalId: record.externalId,
            action: "export",
            direction: mapping.direction,
            timestamp: nowIso(),
          });
        }
        continue;
      }

      if (mapping.direction === "export") {
        skipped += 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "skip",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      } else {
        imported += payload.dryRun ? 0 : 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "import",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      }
      continue;
    }

    if (!localExists && remoteExists) {
      if (mapping.direction === "export") {
        skipped += 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "skip",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      } else {
        imported += payload.dryRun ? 0 : 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "import",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      }
      continue;
    }

    if (localExists && !remoteExists) {
      if (mapping.direction === "import") {
        skipped += 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "skip",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      } else {
        exported += payload.dryRun ? 0 : 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "export",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      }
      continue;
    }

    if (mapping.direction === "import") {
      imported += payload.dryRun ? 0 : 1;
      lineage.push({
        id: randomUUID(),
        jobId: "",
        entityType: mapping.objectType,
        entityExternalId: record.externalId,
        action: "import",
        direction: mapping.direction,
        timestamp: nowIso(),
      });
    } else if (mapping.direction === "export") {
      exported += payload.dryRun ? 0 : 1;
      lineage.push({
        id: randomUUID(),
        jobId: "",
        entityType: mapping.objectType,
        entityExternalId: record.externalId,
        action: "export",
        direction: mapping.direction,
        timestamp: nowIso(),
      });
    } else {
      if (localTime !== null && remoteTime !== null && remoteTime > localTime) {
        imported += payload.dryRun ? 0 : 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "import",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      } else {
        exported += payload.dryRun ? 0 : 1;
        lineage.push({
          id: randomUUID(),
          jobId: "",
          entityType: mapping.objectType,
          entityExternalId: record.externalId,
          action: "export",
          direction: mapping.direction,
          timestamp: nowIso(),
        });
      }
    }
  }

  traces.push(
    createTraceStep(
      "detect_conflicts",
      conflictItems.length > 0 ? "warning" : "ok",
      detectStartedAt,
      {
        conflicts: conflictItems.length,
      }
    )
  );

  if (conflictItems.length > 0) {
    diagnostics.push({
      code: "manual_conflicts",
      severity: "warning",
      message: `${conflictItems.length} records require manual conflict resolution`,
    });
  }

  const applyStartedAt = nowIso();
  traces.push(
    createTraceStep("apply_changes", "ok", applyStartedAt, {
      imported,
      exported,
      skipped,
      dryRun: payload.dryRun,
    })
  );

  const finalizeStartedAt = nowIso();
  traces.push(
    createTraceStep("finalize", "ok", finalizeStartedAt, {
      diagnostics: diagnostics.length,
    })
  );

  const jobId = randomUUID();
  const finalizedLineage = lineage.map((event) => ({ ...event, jobId }));

  const created = await prisma.dataSyncJob.create({
    data: {
      id: jobId,
      tenantId,
      mappingId: mapping.id,
      integration: mapping.integration,
      objectType: mapping.objectType,
      direction: mapping.direction,
      status: conflictItems.length > 0 ? "completed_with_conflicts" : "completed",
      dryRun: payload.dryRun,
      attempt: meta?.attempt || 1,
      retriedFromJobId: meta?.retriedFromJobId || null,
      processed: payload.records.length,
      imported,
      exported,
      skipped,
      conflicts: conflictItems.length,
      conflictItems: toInputJsonValue(conflictItems),
      diagnostics: toInputJsonValue(diagnostics),
      traces: toInputJsonValue(traces),
      lineage: toInputJsonValue(finalizedLineage),
      sourceRecords: toInputJsonValue(payload.records),
      startedAt: new Date(startedAt),
      completedAt: new Date(nowIso()),
    },
  });

  return normalizeSyncJob(created);
}

export async function retrySyncJob(
  tenantId: string,
  jobId: string,
  payload: z.infer<typeof retrySyncJobSchema>
): Promise<DataSyncJob> {
  const previousJob = await getJobOrThrow(tenantId, jobId);

  const mapping = await prisma.dataSyncMapping.findFirst({
    where: {
      tenantId,
      id: previousJob.mappingId,
    },
  });

  if (!mapping) {
    return createFailedSyncJob(tenantId, {
      mappingId: previousJob.mappingId,
      integration: previousJob.integration,
      objectType: previousJob.objectType,
      direction: previousJob.direction,
      dryRun: payload.dryRun,
      attempt: previousJob.attempt + 1,
      retriedFromJobId: previousJob.id,
      records: previousJob.sourceRecords,
      errorCode: "mapping_not_found",
      message: "Sync mapping not found for retry",
    });
  }

  const normalizedMapping = normalizeSyncMapping(mapping);
  if (!normalizedMapping.enabled) {
    return createFailedSyncJob(tenantId, {
      mappingId: previousJob.mappingId,
      integration: previousJob.integration,
      objectType: previousJob.objectType,
      direction: previousJob.direction,
      dryRun: payload.dryRun,
      attempt: previousJob.attempt + 1,
      retriedFromJobId: previousJob.id,
      records: previousJob.sourceRecords,
      errorCode: "mapping_disabled",
      message: "Sync mapping is disabled for retry",
    });
  }

  return runSyncJob(
    tenantId,
    {
      mappingId: normalizedMapping.id,
      dryRun: payload.dryRun,
      records: previousJob.sourceRecords,
    },
    {
      attempt: previousJob.attempt + 1,
      retriedFromJobId: previousJob.id,
    }
  );
}

export async function getSyncJobObservability(tenantId: string, jobId: string): Promise<DataSyncJob> {
  return getJobOrThrow(tenantId, jobId);
}

export async function listSyncObservability(
  tenantId: string,
  filters?: {
    status?: DataSyncJob["status"];
    mappingId?: string;
  }
) {
  const jobs = await listSyncJobs(tenantId, filters?.mappingId);

  return jobs
    .filter((job) => {
      if (filters?.status && job.status !== filters.status) return false;
      return true;
    })
    .map((job) => ({
      id: job.id,
      mappingId: job.mappingId,
      integration: job.integration,
      objectType: job.objectType,
      status: job.status,
      attempt: job.attempt,
      retriedFromJobId: job.retriedFromJobId,
      processed: job.processed,
      imported: job.imported,
      exported: job.exported,
      skipped: job.skipped,
      conflicts: job.conflicts,
      diagnostics: job.diagnostics,
      traceCount: job.traces.length,
      lineageEvents: job.lineage.length,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    }));
}

export async function summarizeSyncObservability(tenantId: string) {
  const jobs = await listSyncJobs(tenantId);

  const summary = {
    totalJobs: jobs.length,
    completed: 0,
    completedWithConflicts: 0,
    failed: 0,
    retries: 0,
    totalProcessed: 0,
    totalImported: 0,
    totalExported: 0,
    totalConflicts: 0,
  };

  for (const job of jobs) {
    if (job.status === "completed") summary.completed += 1;
    if (job.status === "completed_with_conflicts") summary.completedWithConflicts += 1;
    if (job.status === "failed") summary.failed += 1;
    if (job.retriedFromJobId) summary.retries += 1;
    summary.totalProcessed += job.processed;
    summary.totalImported += job.imported;
    summary.totalExported += job.exported;
    summary.totalConflicts += job.conflicts;
  }

  return summary;
}

export async function resetDataSyncStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.dataSyncJob.deleteMany();
  await prisma.dataSyncMapping.deleteMany();
}
