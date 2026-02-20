import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const frontendRouteThresholdSchema = z.object({
  route: z.string().min(1).max(200),
  maxLcpMs: z.number().int().min(500).max(10000),
  maxInpMs: z.number().int().min(50).max(2000),
  maxCls: z.number().min(0).max(1),
  maxJsKb: z.number().int().min(50).max(5000),
  enabled: z.boolean().default(true),
});

export const upsertFrontendThresholdsSchema = z.object({
  thresholds: z.array(frontendRouteThresholdSchema).min(1).max(100),
});

export const frontendSnapshotSchema = z.object({
  route: z.string().min(1).max(200),
  lcpMs: z.number().min(0),
  inpMs: z.number().min(0),
  cls: z.number().min(0),
  jsKb: z.number().min(0),
});

export const evaluateFrontendPerformanceSchema = z.object({
  snapshots: z.array(frontendSnapshotSchema).min(1).max(200),
  persist: z.boolean().default(true),
});

export type FrontendRouteThreshold = {
  id: string;
  tenantId: string;
  route: string;
  maxLcpMs: number;
  maxInpMs: number;
  maxCls: number;
  maxJsKb: number;
  enabled: boolean;
  updatedAt: string;
};

export type FrontendPerformanceAlert = {
  id: string;
  tenantId: string;
  route: string;
  severity: "warning" | "critical";
  reason: "lcp" | "inp" | "cls" | "js";
  observed: {
    lcpMs: number;
    inpMs: number;
    cls: number;
    jsKb: number;
  };
  threshold: {
    maxLcpMs: number;
    maxInpMs: number;
    maxCls: number;
    maxJsKb: number;
  };
  createdAt: string;
};

export type FrontendPerformanceEvaluation = {
  id: string;
  tenantId: string;
  createdAt: string;
  summary: {
    checkedRoutes: number;
    breachedRoutes: number;
    passRatePct: number;
  };
  alerts: FrontendPerformanceAlert[];
};

const frontendAlertSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  route: z.string(),
  severity: z.enum(["warning", "critical"]),
  reason: z.enum(["lcp", "inp", "cls", "js"]),
  observed: z.object({
    lcpMs: z.number(),
    inpMs: z.number(),
    cls: z.number(),
    jsKb: z.number(),
  }),
  threshold: z.object({
    maxLcpMs: z.number(),
    maxInpMs: z.number(),
    maxCls: z.number(),
    maxJsKb: z.number(),
  }),
  createdAt: z.string(),
});

const DEFAULT_THRESHOLDS: Array<z.infer<typeof frontendRouteThresholdSchema>> = [
  { route: "/dashboard", maxLcpMs: 2500, maxInpMs: 200, maxCls: 0.1, maxJsKb: 420, enabled: true },
  { route: "/deals", maxLcpMs: 2600, maxInpMs: 220, maxCls: 0.1, maxJsKb: 450, enabled: true },
  { route: "/tickets", maxLcpMs: 2600, maxInpMs: 220, maxCls: 0.1, maxJsKb: 450, enabled: true },
  { route: "/ai-assistant", maxLcpMs: 2800, maxInpMs: 250, maxCls: 0.12, maxJsKb: 520, enabled: true },
];

function nowIso() {
  return new Date().toISOString();
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeThreshold(record: {
  id: string;
  tenantId: string;
  route: string;
  maxLcpMs: number;
  maxInpMs: number;
  maxCls: number;
  maxJsKb: number;
  enabled: boolean;
  updatedAt: Date;
}): FrontendRouteThreshold {
  return {
    id: record.id,
    tenantId: record.tenantId,
    route: record.route,
    maxLcpMs: record.maxLcpMs,
    maxInpMs: record.maxInpMs,
    maxCls: record.maxCls,
    maxJsKb: record.maxJsKb,
    enabled: record.enabled,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function parseAlerts(value: Prisma.JsonValue | null | undefined): FrontendPerformanceAlert[] {
  const parsed = z.array(frontendAlertSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

function normalizeEvaluation(record: {
  id: string;
  tenantId: string;
  checkedRoutes: number;
  breachedRoutes: number;
  passRatePct: number;
  alerts: Prisma.JsonValue;
  createdAt: Date;
}): FrontendPerformanceEvaluation {
  return {
    id: record.id,
    tenantId: record.tenantId,
    createdAt: record.createdAt.toISOString(),
    summary: {
      checkedRoutes: record.checkedRoutes,
      breachedRoutes: record.breachedRoutes,
      passRatePct: record.passRatePct,
    },
    alerts: parseAlerts(record.alerts),
  };
}

async function seedDefaultThresholds(tenantId: string) {
  const existingCount = await prisma.frontendRouteThreshold.count({
    where: { tenantId },
  });
  if (existingCount > 0) return;

  await prisma.frontendRouteThreshold.createMany({
    data: DEFAULT_THRESHOLDS.map((item) => ({
      tenantId,
      route: item.route,
      maxLcpMs: item.maxLcpMs,
      maxInpMs: item.maxInpMs,
      maxCls: item.maxCls,
      maxJsKb: item.maxJsKb,
      enabled: item.enabled,
    })),
  });
}

export async function listFrontendThresholds(tenantId: string): Promise<FrontendRouteThreshold[]> {
  await seedDefaultThresholds(tenantId);
  const rows = await prisma.frontendRouteThreshold.findMany({
    where: { tenantId },
    orderBy: { route: "asc" },
  });
  return rows.map(normalizeThreshold);
}

export async function upsertFrontendThresholds(
  tenantId: string,
  thresholds: Array<z.infer<typeof frontendRouteThresholdSchema>>
): Promise<FrontendRouteThreshold[]> {
  await seedDefaultThresholds(tenantId);

  for (const threshold of thresholds) {
    const existing = await prisma.frontendRouteThreshold.findFirst({
      where: {
        tenantId,
        route: threshold.route,
      },
    });

    if (existing) {
      await prisma.frontendRouteThreshold.update({
        where: { id: existing.id },
        data: {
          maxLcpMs: threshold.maxLcpMs,
          maxInpMs: threshold.maxInpMs,
          maxCls: threshold.maxCls,
          maxJsKb: threshold.maxJsKb,
          enabled: threshold.enabled,
        },
      });
    } else {
      await prisma.frontendRouteThreshold.create({
        data: {
          tenantId,
          route: threshold.route,
          maxLcpMs: threshold.maxLcpMs,
          maxInpMs: threshold.maxInpMs,
          maxCls: threshold.maxCls,
          maxJsKb: threshold.maxJsKb,
          enabled: threshold.enabled,
        },
      });
    }
  }

  return listFrontendThresholds(tenantId);
}

function buildAlert(args: {
  tenantId: string;
  route: string;
  reason: "lcp" | "inp" | "cls" | "js";
  observed: z.infer<typeof frontendSnapshotSchema>;
  threshold: FrontendRouteThreshold;
}): FrontendPerformanceAlert {
  const ratio =
    args.reason === "lcp"
      ? args.observed.lcpMs / args.threshold.maxLcpMs
      : args.reason === "inp"
        ? args.observed.inpMs / args.threshold.maxInpMs
        : args.reason === "cls"
          ? args.observed.cls / Math.max(0.001, args.threshold.maxCls)
          : args.observed.jsKb / args.threshold.maxJsKb;

  const severity: "warning" | "critical" = ratio >= 1.4 ? "critical" : "warning";

  return {
    id: randomUUID(),
    tenantId: args.tenantId,
    route: args.route,
    severity,
    reason: args.reason,
    observed: {
      lcpMs: args.observed.lcpMs,
      inpMs: args.observed.inpMs,
      cls: args.observed.cls,
      jsKb: args.observed.jsKb,
    },
    threshold: {
      maxLcpMs: args.threshold.maxLcpMs,
      maxInpMs: args.threshold.maxInpMs,
      maxCls: args.threshold.maxCls,
      maxJsKb: args.threshold.maxJsKb,
    },
    createdAt: nowIso(),
  };
}

export async function evaluateFrontendPerformance(
  tenantId: string,
  input: z.infer<typeof evaluateFrontendPerformanceSchema>
): Promise<FrontendPerformanceEvaluation> {
  await seedDefaultThresholds(tenantId);
  const thresholdMap = new Map(
    (await listFrontendThresholds(tenantId))
      .filter((item) => item.enabled)
      .map((item) => [item.route, item])
  );

  const alerts: FrontendPerformanceAlert[] = [];

  for (const snapshot of input.snapshots) {
    const threshold = thresholdMap.get(snapshot.route);
    if (!threshold) continue;

    if (snapshot.lcpMs > threshold.maxLcpMs) {
      alerts.push(buildAlert({ tenantId, route: snapshot.route, reason: "lcp", observed: snapshot, threshold }));
    }
    if (snapshot.inpMs > threshold.maxInpMs) {
      alerts.push(buildAlert({ tenantId, route: snapshot.route, reason: "inp", observed: snapshot, threshold }));
    }
    if (snapshot.cls > threshold.maxCls) {
      alerts.push(buildAlert({ tenantId, route: snapshot.route, reason: "cls", observed: snapshot, threshold }));
    }
    if (snapshot.jsKb > threshold.maxJsKb) {
      alerts.push(buildAlert({ tenantId, route: snapshot.route, reason: "js", observed: snapshot, threshold }));
    }
  }

  const checkedRoutes = input.snapshots.filter((item) => thresholdMap.has(item.route)).length;
  const breachedRoutes = new Set(alerts.map((item) => item.route)).size;
  const passRatePct =
    checkedRoutes === 0 ? 100 : Number((((checkedRoutes - breachedRoutes) / checkedRoutes) * 100).toFixed(1));

  if (!input.persist) {
    return {
      id: randomUUID(),
      tenantId,
      createdAt: nowIso(),
      summary: {
        checkedRoutes,
        breachedRoutes,
        passRatePct,
      },
      alerts,
    };
  }

  const created = await prisma.frontendPerformanceEvaluation.create({
    data: {
      tenantId,
      checkedRoutes,
      breachedRoutes,
      passRatePct,
      alerts: toInputJsonValue(alerts),
    },
  });

  const evaluations = await prisma.frontendPerformanceEvaluation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  for (const stale of evaluations.slice(50)) {
    await prisma.frontendPerformanceEvaluation.delete({
      where: { id: stale.id },
    });
  }

  return normalizeEvaluation(created);
}

export async function listFrontendEvaluations(tenantId: string): Promise<FrontendPerformanceEvaluation[]> {
  const rows = await prisma.frontendPerformanceEvaluation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(normalizeEvaluation);
}

export async function resetFrontendPerformanceStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.frontendPerformanceEvaluation.deleteMany();
  await prisma.frontendRouteThreshold.deleteMany();
}
