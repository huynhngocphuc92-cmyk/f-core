import { randomUUID } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const workflowRuntimeTriggerSchema = z.object({
  workflowId: z.string().min(1),
  maxRetries: z.number().int().min(0).max(10).default(2),
  payload: z.record(z.string(), z.unknown()).default({}),
  versionId: z.string().min(1).optional(),
});

export const workflowDeadLetterRetrySchema = z.object({
  maxRetries: z.number().int().min(0).max(10).default(2),
  dryRun: z.boolean().default(false),
});

type WorkflowSnapshot = {
  triggerType: string;
  triggerConfig: Record<string, unknown> | null;
  actions: Array<{ type: string; config: Record<string, string> }>;
  status: string;
  isActive: boolean;
};

export type WorkflowVersion = {
  id: string;
  tenantId: string;
  workflowId: string;
  version: number;
  label: string;
  snapshot: WorkflowSnapshot;
  createdAt: string;
};

export type WorkflowRunAttempt = {
  id: string;
  attempt: number;
  status: "succeeded" | "failed";
  error: string | null;
  executedAt: string;
};

export type WorkflowRun = {
  id: string;
  tenantId: string;
  workflowId: string;
  status: "succeeded" | "dead_letter";
  maxRetries: number;
  versionId: string | null;
  payload: Record<string, unknown>;
  attempts: WorkflowRunAttempt[];
  retriesUsed: number;
  deadLetterId: string | null;
  startedAt: string;
  completedAt: string;
};

export type WorkflowDeadLetter = {
  id: string;
  tenantId: string;
  workflowId: string;
  runId: string;
  reason: string;
  payload: Record<string, unknown>;
  attempts: number;
  latestError: string;
  createdAt: string;
  resolvedAt: string | null;
};

const workflowActionSchema = z.object({
  type: z.string().min(1),
  config: z.record(z.string(), z.string()),
});

const workflowSnapshotSchema = z.object({
  triggerType: z.string().min(1),
  triggerConfig: z.record(z.string(), z.unknown()).nullable(),
  actions: z.array(workflowActionSchema),
  status: z.string().min(1),
  isActive: z.boolean(),
});

const workflowRunAttemptStorageSchema = z.object({
  id: z.string().min(1),
  attempt: z.number().int().min(1),
  status: z.enum(["succeeded", "failed"]),
  error: z.string().nullable(),
  executedAt: z.string().datetime(),
});

function nowIso() {
  return new Date().toISOString();
}

function normalizePayload(value: unknown) {
  const parsed = z.record(z.string(), z.unknown()).safeParse(value);
  return parsed.success ? parsed.data : {};
}

function normalizeWorkflowSnapshot(value: unknown): WorkflowSnapshot {
  const parsed = workflowSnapshotSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    triggerType: "manual",
    triggerConfig: null,
    actions: [],
    status: "draft",
    isActive: false,
  };
}

function normalizeWorkflowRunAttempts(value: unknown): WorkflowRunAttempt[] {
  const parsed = z.array(workflowRunAttemptStorageSchema).safeParse(value);
  if (!parsed.success) {
    return [];
  }

  return parsed.data.map((attempt) => ({
    id: attempt.id,
    attempt: attempt.attempt,
    status: attempt.status,
    error: attempt.error,
    executedAt: attempt.executedAt,
  }));
}

function normalizeWorkflowVersion(row: {
  id: string;
  tenantId: string;
  workflowId: string;
  version: number;
  label: string;
  snapshot: unknown;
  createdAt: Date;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workflowId: row.workflowId,
    version: row.version,
    label: row.label,
    snapshot: normalizeWorkflowSnapshot(row.snapshot),
    createdAt: row.createdAt.toISOString(),
  } satisfies WorkflowVersion;
}

function normalizeWorkflowRun(row: {
  id: string;
  tenantId: string;
  workflowId: string;
  status: string;
  maxRetries: number;
  versionId: string | null;
  payload: unknown;
  attempts: unknown;
  retriesUsed: number;
  deadLetterId: string | null;
  startedAt: Date;
  completedAt: Date;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workflowId: row.workflowId,
    status: row.status === "dead_letter" ? "dead_letter" : "succeeded",
    maxRetries: row.maxRetries,
    versionId: row.versionId,
    payload: normalizePayload(row.payload),
    attempts: normalizeWorkflowRunAttempts(row.attempts),
    retriesUsed: row.retriesUsed,
    deadLetterId: row.deadLetterId,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt.toISOString(),
  } satisfies WorkflowRun;
}

function normalizeWorkflowDeadLetter(row: {
  id: string;
  tenantId: string;
  workflowId: string;
  runId: string;
  reason: string;
  payload: unknown;
  attempts: number;
  latestError: string;
  createdAt: Date;
  resolvedAt: Date | null;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workflowId: row.workflowId,
    runId: row.runId,
    reason: row.reason,
    payload: normalizePayload(row.payload),
    attempts: row.attempts,
    latestError: row.latestError,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  } satisfies WorkflowDeadLetter;
}

function simulateAttempt(
  payload: Record<string, unknown>,
  attempt: number,
  dryRun?: boolean
): { succeeded: boolean; error: string | null } {
  if (dryRun) {
    return { succeeded: true, error: null };
  }

  const failAlways = payload.forceFail === true;
  const failUntilAttempt =
    typeof payload.failUntilAttempt === "number" && Number.isFinite(payload.failUntilAttempt)
      ? payload.failUntilAttempt
      : null;

  if (failAlways) {
    return { succeeded: false, error: "Simulated forced failure" };
  }

  if (failUntilAttempt !== null && attempt <= failUntilAttempt) {
    return {
      succeeded: false,
      error: `Simulated failure on attempt ${attempt} (failUntilAttempt=${failUntilAttempt})`,
    };
  }

  return { succeeded: true, error: null };
}

export async function createWorkflowVersion(
  tenantId: string,
  workflow: {
    id: string;
    triggerType: string;
    triggerConfig: Record<string, unknown> | null;
    actions: Array<{ type: string; config: Record<string, string> }>;
    status: string;
    isActive: boolean;
  },
  label?: string
) {
  const latest = await prisma.workflowVersionSnapshot.findFirst({
    where: {
      tenantId,
      workflowId: workflow.id,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      version: true,
    },
  });

  const nextVersion = (latest?.version || 0) + 1;

  const row = await prisma.workflowVersionSnapshot.create({
    data: {
      id: randomUUID(),
      tenantId,
      workflowId: workflow.id,
      version: nextVersion,
      label: label?.trim() || `v${nextVersion}`,
      snapshot: {
        triggerType: workflow.triggerType,
        triggerConfig: workflow.triggerConfig,
        actions: workflow.actions,
        status: workflow.status,
        isActive: workflow.isActive,
      } as unknown as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      version: true,
      label: true,
      snapshot: true,
      createdAt: true,
    },
  });

  return normalizeWorkflowVersion(row);
}

export async function listWorkflowVersions(tenantId: string, workflowId: string) {
  const rows = await prisma.workflowVersionSnapshot.findMany({
    where: {
      tenantId,
      workflowId,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      version: true,
      label: true,
      snapshot: true,
      createdAt: true,
    },
  });

  return rows.map((row) => normalizeWorkflowVersion(row));
}

export async function getWorkflowVersion(tenantId: string, workflowId: string, versionId: string) {
  const row = await prisma.workflowVersionSnapshot.findFirst({
    where: {
      tenantId,
      workflowId,
      id: versionId,
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      version: true,
      label: true,
      snapshot: true,
      createdAt: true,
    },
  });

  if (!row) {
    throw new Error("Workflow version not found");
  }

  return normalizeWorkflowVersion(row);
}

export async function runWorkflowWithRuntime(
  tenantId: string,
  input: {
    workflowId: string;
    payload: Record<string, unknown>;
    maxRetries: number;
    versionId?: string;
    dryRun?: boolean;
  }
) {
  const startedAt = nowIso();
  const attempts: WorkflowRunAttempt[] = [];

  const maxAttempts = input.maxRetries + 1;

  for (let index = 1; index <= maxAttempts; index += 1) {
    const attemptResult = simulateAttempt(input.payload, index, input.dryRun);

    attempts.push({
      id: randomUUID(),
      attempt: index,
      status: attemptResult.succeeded ? "succeeded" : "failed",
      error: attemptResult.error,
      executedAt: nowIso(),
    });

    if (attemptResult.succeeded) {
      const row = await prisma.workflowRuntimeRun.create({
        data: {
          id: randomUUID(),
          tenantId,
          workflowId: input.workflowId,
          status: "succeeded",
          maxRetries: input.maxRetries,
          versionId: input.versionId || null,
          payload: input.payload as Prisma.InputJsonValue,
          attempts: attempts as unknown as Prisma.InputJsonValue,
          retriesUsed: Math.max(0, attempts.length - 1),
          deadLetterId: null,
          startedAt: new Date(startedAt),
          completedAt: new Date(),
        },
        select: {
          id: true,
          tenantId: true,
          workflowId: true,
          status: true,
          maxRetries: true,
          versionId: true,
          payload: true,
          attempts: true,
          retriesUsed: true,
          deadLetterId: true,
          startedAt: true,
          completedAt: true,
        },
      });

      return normalizeWorkflowRun(row);
    }
  }

  const latestAttempt = attempts[attempts.length - 1];
  const runId = randomUUID();
  const deadLetterRow = await prisma.workflowRuntimeDeadLetter.create({
    data: {
      id: randomUUID(),
      tenantId,
      workflowId: input.workflowId,
      runId,
      reason: "Max retries exhausted",
      payload: input.payload as Prisma.InputJsonValue,
      attempts: attempts.length,
      latestError: latestAttempt.error || "Unknown workflow runtime error",
      resolvedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      runId: true,
      reason: true,
      payload: true,
      attempts: true,
      latestError: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  const runRow = await prisma.workflowRuntimeRun.create({
    data: {
      id: runId,
      tenantId,
      workflowId: input.workflowId,
      status: "dead_letter",
      maxRetries: input.maxRetries,
      versionId: input.versionId || null,
      payload: input.payload as Prisma.InputJsonValue,
      attempts: attempts as unknown as Prisma.InputJsonValue,
      retriesUsed: input.maxRetries,
      deadLetterId: deadLetterRow.id,
      startedAt: new Date(startedAt),
      completedAt: new Date(),
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      status: true,
      maxRetries: true,
      versionId: true,
      payload: true,
      attempts: true,
      retriesUsed: true,
      deadLetterId: true,
      startedAt: true,
      completedAt: true,
    },
  });

  return normalizeWorkflowRun(runRow);
}

export async function retryWorkflowDeadLetter(
  tenantId: string,
  deadLetterId: string,
  input: z.infer<typeof workflowDeadLetterRetrySchema>
) {
  const deadLetterRow = await prisma.workflowRuntimeDeadLetter.findFirst({
    where: {
      tenantId,
      id: deadLetterId,
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      runId: true,
      reason: true,
      payload: true,
      attempts: true,
      latestError: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  if (!deadLetterRow) {
    throw new Error("Workflow dead-letter item not found");
  }

  if (deadLetterRow.resolvedAt) {
    throw new Error("Workflow dead-letter item already resolved");
  }

  const deadLetter = normalizeWorkflowDeadLetter(deadLetterRow);

  const rerun = await runWorkflowWithRuntime(tenantId, {
    workflowId: deadLetter.workflowId,
    payload: deadLetter.payload,
    maxRetries: input.maxRetries,
    dryRun: input.dryRun,
  });

  if (rerun.status !== "succeeded") {
    return {
      rerun,
      deadLetter,
    };
  }

  const updatedRow = await prisma.workflowRuntimeDeadLetter.update({
    where: {
      id: deadLetter.id,
    },
    data: {
      resolvedAt: new Date(),
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      runId: true,
      reason: true,
      payload: true,
      attempts: true,
      latestError: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  return {
    rerun,
    deadLetter: normalizeWorkflowDeadLetter(updatedRow),
  };
}

export async function listWorkflowRuns(
  tenantId: string,
  filters?: {
    workflowId?: string;
    status?: "succeeded" | "dead_letter";
  }
) {
  const rows = await prisma.workflowRuntimeRun.findMany({
    where: {
      tenantId,
      workflowId: filters?.workflowId,
      status: filters?.status,
    },
    orderBy: {
      startedAt: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      status: true,
      maxRetries: true,
      versionId: true,
      payload: true,
      attempts: true,
      retriesUsed: true,
      deadLetterId: true,
      startedAt: true,
      completedAt: true,
    },
  });

  return rows.map((row) => normalizeWorkflowRun(row));
}

export async function listWorkflowDeadLetters(
  tenantId: string,
  filters?: {
    workflowId?: string;
    unresolvedOnly?: boolean;
  }
) {
  const rows = await prisma.workflowRuntimeDeadLetter.findMany({
    where: {
      tenantId,
      workflowId: filters?.workflowId,
      resolvedAt: filters?.unresolvedOnly ? null : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      workflowId: true,
      runId: true,
      reason: true,
      payload: true,
      attempts: true,
      latestError: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  return rows.map((row) => normalizeWorkflowDeadLetter(row));
}

export async function summarizeWorkflowRuntime(tenantId: string) {
  const runs = await listWorkflowRuns(tenantId);
  const deadLetters = await listWorkflowDeadLetters(tenantId);

  const totalRuns = runs.length;
  const succeeded = runs.filter((item) => item.status === "succeeded").length;
  const deadLettered = runs.filter((item) => item.status === "dead_letter").length;
  const retriesUsed = runs.reduce((sum, item) => sum + item.retriesUsed, 0);
  const unresolvedDeadLetters = deadLetters.filter((item) => !item.resolvedAt).length;

  return {
    totalRuns,
    succeeded,
    deadLettered,
    retriesUsed,
    unresolvedDeadLetters,
    successRatePct: totalRuns === 0 ? 0 : Number(((succeeded / totalRuns) * 100).toFixed(1)),
  };
}

export async function resetWorkflowRuntimeStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  await prisma.workflowVersionSnapshot.deleteMany();
  await prisma.workflowRuntimeRun.deleteMany();
  await prisma.workflowRuntimeDeadLetter.deleteMany();
}
