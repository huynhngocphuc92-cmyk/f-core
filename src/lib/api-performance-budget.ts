import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const apiPerformanceBudgetSchema = z.object({
  endpoint: z.string().min(1).max(200),
  maxP95LatencyMs: z.number().int().min(50).max(10000),
  maxErrorRatePct: z.number().min(0).max(100),
  enabled: z.boolean().default(true),
});

export const upsertApiPerformanceBudgetsSchema = z.object({
  budgets: z.array(apiPerformanceBudgetSchema).min(1).max(100),
});

export const apiPerformanceSnapshotSchema = z.object({
  endpoint: z.string().min(1).max(200),
  requestCount: z.number().int().min(0),
  p95LatencyMs: z.number().min(0),
  errorRatePct: z.number().min(0).max(100),
});

export const evaluateApiPerformanceSchema = z.object({
  snapshots: z.array(apiPerformanceSnapshotSchema).min(1).max(500),
  persist: z.boolean().default(true),
});

export type ApiPerformanceBudget = {
  id: string;
  tenantId: string;
  endpoint: string;
  maxP95LatencyMs: number;
  maxErrorRatePct: number;
  enabled: boolean;
  updatedAt: string;
};

export type ApiPerformanceAlert = {
  id: string;
  tenantId: string;
  endpoint: string;
  severity: "warning" | "critical";
  reason: "latency" | "error_rate";
  observed: {
    p95LatencyMs: number;
    errorRatePct: number;
    requestCount: number;
  };
  budget: {
    maxP95LatencyMs: number;
    maxErrorRatePct: number;
  };
  createdAt: string;
};

export type ApiPerformanceEvaluation = {
  id: string;
  tenantId: string;
  createdAt: string;
  summary: {
    checkedEndpoints: number;
    breachedEndpoints: number;
    passRatePct: number;
  };
  alerts: ApiPerformanceAlert[];
};

const apiPerformanceAlertSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  endpoint: z.string(),
  severity: z.enum(["warning", "critical"]),
  reason: z.enum(["latency", "error_rate"]),
  observed: z.object({
    p95LatencyMs: z.number(),
    errorRatePct: z.number(),
    requestCount: z.number(),
  }),
  budget: z.object({
    maxP95LatencyMs: z.number(),
    maxErrorRatePct: z.number(),
  }),
  createdAt: z.string(),
});

const DEFAULT_BUDGETS: Array<z.infer<typeof apiPerformanceBudgetSchema>> = [
  { endpoint: "/api/ai/chat", maxP95LatencyMs: 2200, maxErrorRatePct: 2.5, enabled: true },
  { endpoint: "/api/contacts", maxP95LatencyMs: 450, maxErrorRatePct: 1.0, enabled: true },
  { endpoint: "/api/deals", maxP95LatencyMs: 500, maxErrorRatePct: 1.0, enabled: true },
  { endpoint: "/api/tickets", maxP95LatencyMs: 550, maxErrorRatePct: 1.5, enabled: true },
];

function nowIso() {
  return new Date().toISOString();
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeBudget(record: {
  id: string;
  tenantId: string;
  endpoint: string;
  maxP95LatencyMs: number;
  maxErrorRatePct: number;
  enabled: boolean;
  updatedAt: Date;
}): ApiPerformanceBudget {
  return {
    id: record.id,
    tenantId: record.tenantId,
    endpoint: record.endpoint,
    maxP95LatencyMs: record.maxP95LatencyMs,
    maxErrorRatePct: record.maxErrorRatePct,
    enabled: record.enabled,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function parseAlerts(value: Prisma.JsonValue | null | undefined): ApiPerformanceAlert[] {
  const parsed = z.array(apiPerformanceAlertSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

function normalizeEvaluation(record: {
  id: string;
  tenantId: string;
  checkedEndpoints: number;
  breachedEndpoints: number;
  passRatePct: number;
  alerts: Prisma.JsonValue;
  createdAt: Date;
}): ApiPerformanceEvaluation {
  return {
    id: record.id,
    tenantId: record.tenantId,
    createdAt: record.createdAt.toISOString(),
    summary: {
      checkedEndpoints: record.checkedEndpoints,
      breachedEndpoints: record.breachedEndpoints,
      passRatePct: record.passRatePct,
    },
    alerts: parseAlerts(record.alerts),
  };
}

async function seedDefaultBudgets(tenantId: string) {
  const existingCount = await prisma.apiPerformanceBudget.count({
    where: { tenantId },
  });
  if (existingCount > 0) return;

  await prisma.apiPerformanceBudget.createMany({
    data: DEFAULT_BUDGETS.map((item) => ({
      tenantId,
      endpoint: item.endpoint,
      maxP95LatencyMs: item.maxP95LatencyMs,
      maxErrorRatePct: item.maxErrorRatePct,
      enabled: item.enabled,
    })),
  });
}

export async function listApiPerformanceBudgets(tenantId: string): Promise<ApiPerformanceBudget[]> {
  await seedDefaultBudgets(tenantId);
  const rows = await prisma.apiPerformanceBudget.findMany({
    where: { tenantId },
    orderBy: { endpoint: "asc" },
  });
  return rows.map(normalizeBudget);
}

export async function upsertApiPerformanceBudgets(
  tenantId: string,
  budgets: Array<z.infer<typeof apiPerformanceBudgetSchema>>
): Promise<ApiPerformanceBudget[]> {
  await seedDefaultBudgets(tenantId);

  for (const item of budgets) {
    const existing = await prisma.apiPerformanceBudget.findFirst({
      where: {
        tenantId,
        endpoint: item.endpoint,
      },
    });

    if (existing) {
      await prisma.apiPerformanceBudget.update({
        where: { id: existing.id },
        data: {
          maxP95LatencyMs: item.maxP95LatencyMs,
          maxErrorRatePct: item.maxErrorRatePct,
          enabled: item.enabled,
        },
      });
    } else {
      await prisma.apiPerformanceBudget.create({
        data: {
          tenantId,
          endpoint: item.endpoint,
          maxP95LatencyMs: item.maxP95LatencyMs,
          maxErrorRatePct: item.maxErrorRatePct,
          enabled: item.enabled,
        },
      });
    }
  }

  return listApiPerformanceBudgets(tenantId);
}

function buildAlert(args: {
  tenantId: string;
  budget: ApiPerformanceBudget;
  snapshot: z.infer<typeof apiPerformanceSnapshotSchema>;
  reason: "latency" | "error_rate";
}): ApiPerformanceAlert {
  const ratio =
    args.reason === "latency"
      ? args.snapshot.p95LatencyMs / args.budget.maxP95LatencyMs
      : args.snapshot.errorRatePct / Math.max(0.001, args.budget.maxErrorRatePct);

  return {
    id: randomUUID(),
    tenantId: args.tenantId,
    endpoint: args.snapshot.endpoint,
    severity: ratio >= 1.5 ? "critical" : "warning",
    reason: args.reason,
    observed: {
      p95LatencyMs: args.snapshot.p95LatencyMs,
      errorRatePct: args.snapshot.errorRatePct,
      requestCount: args.snapshot.requestCount,
    },
    budget: {
      maxP95LatencyMs: args.budget.maxP95LatencyMs,
      maxErrorRatePct: args.budget.maxErrorRatePct,
    },
    createdAt: nowIso(),
  };
}

export async function evaluateApiPerformance(
  tenantId: string,
  input: z.infer<typeof evaluateApiPerformanceSchema>
): Promise<ApiPerformanceEvaluation> {
  await seedDefaultBudgets(tenantId);
  const budgets = (await listApiPerformanceBudgets(tenantId)).filter((item) => item.enabled);
  const budgetByEndpoint = new Map(budgets.map((item) => [item.endpoint, item]));
  const alerts: ApiPerformanceAlert[] = [];

  for (const snapshot of input.snapshots) {
    const budget = budgetByEndpoint.get(snapshot.endpoint);
    if (!budget) continue;

    if (snapshot.p95LatencyMs > budget.maxP95LatencyMs) {
      alerts.push(buildAlert({ tenantId, budget, snapshot, reason: "latency" }));
    }
    if (snapshot.errorRatePct > budget.maxErrorRatePct) {
      alerts.push(buildAlert({ tenantId, budget, snapshot, reason: "error_rate" }));
    }
  }

  const checkedEndpoints = input.snapshots.filter((item) => budgetByEndpoint.has(item.endpoint)).length;
  const breachedEndpointSet = new Set(alerts.map((item) => item.endpoint));
  const breachedEndpoints = breachedEndpointSet.size;
  const passRatePct =
    checkedEndpoints === 0 ? 100 : Number((((checkedEndpoints - breachedEndpoints) / checkedEndpoints) * 100).toFixed(1));

  if (!input.persist) {
    return {
      id: randomUUID(),
      tenantId,
      createdAt: nowIso(),
      summary: {
        checkedEndpoints,
        breachedEndpoints,
        passRatePct,
      },
      alerts,
    };
  }

  const created = await prisma.apiPerformanceEvaluation.create({
    data: {
      tenantId,
      checkedEndpoints,
      breachedEndpoints,
      passRatePct,
      alerts: toInputJsonValue(alerts),
    },
  });

  const evaluations = await prisma.apiPerformanceEvaluation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  for (const stale of evaluations.slice(50)) {
    await prisma.apiPerformanceEvaluation.delete({
      where: { id: stale.id },
    });
  }

  return normalizeEvaluation(created);
}

export async function listApiPerformanceEvaluations(tenantId: string): Promise<ApiPerformanceEvaluation[]> {
  const rows = await prisma.apiPerformanceEvaluation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(normalizeEvaluation);
}

export async function resetApiPerformanceStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.apiPerformanceEvaluation.deleteMany();
  await prisma.apiPerformanceBudget.deleteMany();
}
