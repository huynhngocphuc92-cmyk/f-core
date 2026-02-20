import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const releaseGateIdSchema = z.enum([
  "unit_tests",
  "build",
  "security_regression",
  "ai_evals",
  "e2e_critical",
]);
export type ReleaseGateId = z.infer<typeof releaseGateIdSchema>;

export const releaseGateSchema = z.object({
  id: releaseGateIdSchema,
  name: z.string().min(3),
  command: z.string().min(3),
  required: z.boolean().default(true),
  enabled: z.boolean().default(true),
});
export type ReleaseGate = z.infer<typeof releaseGateSchema>;

export const releaseChecklistObservationSchema = z.object({
  gateId: releaseGateIdSchema,
  status: z.enum(["pass", "fail", "skipped"]),
  durationMs: z.number().int().min(0),
  notes: z.string().max(500).optional(),
});

export const updateReleaseChecklistSchema = z.object({
  gates: z.array(
    z.object({
      id: releaseGateIdSchema,
      required: z.boolean().optional(),
      enabled: z.boolean().optional(),
    })
  ),
});

export const evaluateReleaseReadinessSchema = z.object({
  releaseTag: z.string().max(100).optional(),
  branch: z.string().max(100).optional(),
  actor: z.string().max(120).optional(),
  observations: z.array(releaseChecklistObservationSchema).min(1),
  persist: z.boolean().default(true),
});
export type EvaluateReleaseReadinessInput = z.infer<typeof evaluateReleaseReadinessSchema>;

export type ReleaseChecklistResult = {
  id: string;
  createdAt: string;
  releaseTag?: string;
  branch?: string;
  actor?: string;
  status: "ready" | "blocked";
  summary: {
    requiredGateCount: number;
    requiredPassCount: number;
    requiredFailCount: number;
    scorePct: number;
  };
  gates: Array<{
    id: ReleaseGateId;
    name: string;
    required: boolean;
    enabled: boolean;
    command: string;
    status: "pass" | "fail" | "skipped" | "missing";
    durationMs: number;
    notes?: string;
  }>;
  blockers: Array<{
    gateId: ReleaseGateId;
    reason: "failed" | "missing";
  }>;
};

const releaseResultGateSchema = z.object({
  id: releaseGateIdSchema,
  name: z.string(),
  required: z.boolean(),
  enabled: z.boolean(),
  command: z.string(),
  status: z.enum(["pass", "fail", "skipped", "missing"]),
  durationMs: z.number(),
  notes: z.string().optional(),
});

const releaseResultBlockerSchema = z.object({
  gateId: releaseGateIdSchema,
  reason: z.enum(["failed", "missing"]),
});

const DEFAULT_GATES: ReleaseGate[] = [
  {
    id: "unit_tests",
    name: "Unit/API tests",
    command: "npm test",
    required: true,
    enabled: true,
  },
  {
    id: "build",
    name: "Production build",
    command: "npm run build",
    required: true,
    enabled: true,
  },
  {
    id: "security_regression",
    name: "Security regression suite",
    command: "npm test -- tests/api-security.test.ts",
    required: true,
    enabled: true,
  },
  {
    id: "ai_evals",
    name: "AI eval benchmarks",
    command: "npm run test:ai-evals",
    required: true,
    enabled: true,
  },
  {
    id: "e2e_critical",
    name: "Critical E2E smoke",
    command: "npx playwright test e2e/critical-flows.spec.ts",
    required: false,
    enabled: true,
  },
];

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function cloneDefaultGates(): ReleaseGate[] {
  return DEFAULT_GATES.map((gate) => ({ ...gate }));
}

function normalizeGate(record: {
  gateId: string;
  name: string;
  command: string;
  required: boolean;
  enabled: boolean;
}): ReleaseGate {
  return {
    id: releaseGateIdSchema.parse(record.gateId),
    name: record.name,
    command: record.command,
    required: record.required,
    enabled: record.enabled,
  };
}

function normalizeResult(record: {
  id: string;
  releaseTag: string | null;
  branch: string | null;
  actor: string | null;
  status: string;
  requiredGateCount: number;
  requiredPassCount: number;
  requiredFailCount: number;
  scorePct: number;
  gates: Prisma.JsonValue;
  blockers: Prisma.JsonValue;
  createdAt: Date;
}): ReleaseChecklistResult {
  const gates = z.array(releaseResultGateSchema).safeParse(record.gates);
  const blockers = z.array(releaseResultBlockerSchema).safeParse(record.blockers);
  const status = record.status === "ready" ? "ready" : "blocked";

  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    releaseTag: record.releaseTag || undefined,
    branch: record.branch || undefined,
    actor: record.actor || undefined,
    status,
    summary: {
      requiredGateCount: record.requiredGateCount,
      requiredPassCount: record.requiredPassCount,
      requiredFailCount: record.requiredFailCount,
      scorePct: record.scorePct,
    },
    gates: gates.success ? gates.data : [],
    blockers: blockers.success ? blockers.data : [],
  };
}

async function ensureDefaultGates(tenantId: string) {
  const existingCount = await prisma.releaseChecklistGate.count({
    where: { tenantId },
  });
  if (existingCount > 0) return;

  await prisma.releaseChecklistGate.createMany({
    data: cloneDefaultGates().map((gate) => ({
      tenantId,
      gateId: gate.id,
      name: gate.name,
      command: gate.command,
      required: gate.required,
      enabled: gate.enabled,
    })),
  });
}

export async function listReleaseChecklistGates(tenantId: string): Promise<ReleaseGate[]> {
  await ensureDefaultGates(tenantId);
  const rows = await prisma.releaseChecklistGate.findMany({
    where: { tenantId },
  });
  const order = new Map(DEFAULT_GATES.map((gate, index) => [gate.id, index]));
  return rows
    .map(normalizeGate)
    .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

export async function upsertReleaseChecklistGates(
  tenantId: string,
  updates: z.infer<typeof updateReleaseChecklistSchema>["gates"]
): Promise<ReleaseGate[]> {
  await ensureDefaultGates(tenantId);

  for (const update of updates) {
    const existing = await prisma.releaseChecklistGate.findFirst({
      where: {
        tenantId,
        gateId: update.id,
      },
    });
    if (!existing) continue;

    await prisma.releaseChecklistGate.update({
      where: { id: existing.id },
      data: {
        ...(typeof update.required === "boolean" && { required: update.required }),
        ...(typeof update.enabled === "boolean" && { enabled: update.enabled }),
      },
    });
  }

  return listReleaseChecklistGates(tenantId);
}

export async function listReleaseReadinessResults(tenantId: string): Promise<ReleaseChecklistResult[]> {
  const rows = await prisma.releaseReadinessResult.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(normalizeResult);
}

export async function evaluateReleaseReadiness(
  tenantId: string,
  payload: EvaluateReleaseReadinessInput
): Promise<ReleaseChecklistResult> {
  const configuredGates = await listReleaseChecklistGates(tenantId);
  const byId = new Map(payload.observations.map((item) => [item.gateId, item]));
  const evaluatedGates = configuredGates.filter((gate) => gate.enabled);

  const gates: ReleaseChecklistResult["gates"] = evaluatedGates.map((gate) => {
    const observation = byId.get(gate.id);
    return {
      id: gate.id,
      name: gate.name,
      command: gate.command,
      required: gate.required,
      enabled: gate.enabled,
      status: observation?.status ?? "missing",
      durationMs: observation?.durationMs ?? 0,
      notes: observation?.notes,
    };
  });

  const requiredGates = gates.filter((gate) => gate.required);
  const blockers = requiredGates
    .filter((gate) => gate.status !== "pass")
    .map((gate) => ({
      gateId: gate.id,
      reason: gate.status === "missing" ? ("missing" as const) : ("failed" as const),
    }));

  const requiredPassCount = requiredGates.filter((gate) => gate.status === "pass").length;
  const requiredGateCount = requiredGates.length;
  const requiredFailCount = requiredGateCount - requiredPassCount;
  const scorePct = requiredGateCount === 0 ? 100 : Math.round((requiredPassCount / requiredGateCount) * 100);
  const status: "ready" | "blocked" = blockers.length === 0 ? "ready" : "blocked";

  if (!payload.persist) {
    return {
      id: `release-${Date.now()}`,
      createdAt: new Date().toISOString(),
      releaseTag: payload.releaseTag,
      branch: payload.branch,
      actor: payload.actor,
      status,
      summary: {
        requiredGateCount,
        requiredPassCount,
        requiredFailCount,
        scorePct,
      },
      gates,
      blockers,
    };
  }

  const created = await prisma.releaseReadinessResult.create({
    data: {
      tenantId,
      releaseTag: payload.releaseTag || null,
      branch: payload.branch || null,
      actor: payload.actor || null,
      status,
      requiredGateCount,
      requiredPassCount,
      requiredFailCount,
      scorePct,
      gates: toInputJsonValue(gates),
      blockers: toInputJsonValue(blockers),
    },
  });

  const results = await prisma.releaseReadinessResult.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  for (const stale of results.slice(30)) {
    await prisma.releaseReadinessResult.delete({
      where: { id: stale.id },
    });
  }

  return normalizeResult(created);
}

export async function resetReleaseReadinessStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.releaseReadinessResult.deleteMany();
  await prisma.releaseChecklistGate.deleteMany();
}
