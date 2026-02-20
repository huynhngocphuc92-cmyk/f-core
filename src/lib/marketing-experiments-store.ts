import { z } from "zod";
import prisma from "@/lib/prisma";

export const experimentTypeSchema = z.enum(["landing_page", "email_campaign"]);
export const experimentStatusSchema = z.enum(["draft", "running", "paused", "completed"]);

export const experimentVariantSchema = z.object({
  key: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  trafficPct: z.number().min(1).max(99),
});

export const createExperimentSchema = z.object({
  name: z.string().min(1).max(200),
  type: experimentTypeSchema,
  targetId: z.string().min(1).max(120),
  goal: z.string().min(1).max(120),
  variants: z.array(experimentVariantSchema).min(2).max(6),
});

export const updateExperimentSchema = z.object({
  action: z.enum(["start", "pause", "complete"]),
});

export const experimentEventSchema = z.object({
  eventType: z.enum(["exposure", "conversion"]),
  variantKey: z.string().min(1).max(40),
  value: z.number().min(0).optional(),
});

export type ExperimentVariant = z.infer<typeof experimentVariantSchema> & {
  exposures: number;
  conversions: number;
  conversionRatePct: number;
};

export type MarketingExperiment = {
  id: string;
  tenantId: string;
  name: string;
  type: z.infer<typeof experimentTypeSchema>;
  targetId: string;
  goal: string;
  status: z.infer<typeof experimentStatusSchema>;
  winnerVariantKey: string | null;
  variants: ExperimentVariant[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
};

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeVariant(record: {
  key: string;
  name: string;
  trafficPct: number;
  exposures: number;
  conversions: number;
}): ExperimentVariant {
  return {
    key: record.key,
    name: record.name,
    trafficPct: record.trafficPct,
    exposures: record.exposures,
    conversions: record.conversions,
    conversionRatePct: record.exposures
      ? round2((record.conversions / record.exposures) * 100)
      : 0,
  };
}

function normalizeExperiment(
  record: {
    id: string;
    tenantId: string;
    name: string;
    type: string;
    targetId: string;
    goal: string;
    status: string;
    winnerVariantKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    startedAt: Date | null;
    endedAt: Date | null;
  },
  variantRecords: Array<{
    key: string;
    name: string;
    trafficPct: number;
    exposures: number;
    conversions: number;
  }>
): MarketingExperiment {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    type: experimentTypeSchema.parse(record.type),
    targetId: record.targetId,
    goal: record.goal,
    status: experimentStatusSchema.parse(record.status),
    winnerVariantKey: record.winnerVariantKey,
    variants: variantRecords.map(normalizeVariant),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    startedAt: toIso(record.startedAt),
    endedAt: toIso(record.endedAt),
  };
}

function selectWinner(experiment: MarketingExperiment) {
  const eligible = experiment.variants.filter((variant) => variant.exposures > 0);
  if (eligible.length === 0) return null;

  return eligible
    .slice()
    .sort((a, b) => {
      if (b.conversionRatePct !== a.conversionRatePct) {
        return b.conversionRatePct - a.conversionRatePct;
      }
      if (b.conversions !== a.conversions) {
        return b.conversions - a.conversions;
      }
      return a.key.localeCompare(b.key);
    })[0].key;
}

function validateTrafficSplit(variants: z.infer<typeof experimentVariantSchema>[]) {
  const sum = variants.reduce((acc, variant) => acc + variant.trafficPct, 0);
  if (sum !== 100) {
    throw new Error("Variant traffic split must total 100%");
  }

  const keys = new Set(variants.map((variant) => variant.key));
  if (keys.size !== variants.length) {
    throw new Error("Variant keys must be unique");
  }
}

async function getExperimentOrThrow(tenantId: string, experimentId: string) {
  const experiment = await prisma.marketingExperiment.findFirst({
    where: {
      tenantId,
      id: experimentId,
    },
  });

  if (!experiment) {
    throw new Error("Experiment not found");
  }

  const variants = await prisma.marketingExperimentVariant.findMany({
    where: { experimentId: experiment.id },
    orderBy: { key: "asc" },
  });

  return { experiment, variants };
}

async function getNormalizedExperimentOrThrow(tenantId: string, experimentId: string) {
  const { experiment, variants } = await getExperimentOrThrow(tenantId, experimentId);
  return normalizeExperiment(experiment, variants);
}

export async function listExperiments(tenantId: string): Promise<MarketingExperiment[]> {
  const rows = await prisma.marketingExperiment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    rows.map(async (row) => {
      const variants = await prisma.marketingExperimentVariant.findMany({
        where: { experimentId: row.id },
        orderBy: { key: "asc" },
      });
      return normalizeExperiment(row, variants);
    })
  );
}

export async function createExperiment(
  tenantId: string,
  payload: z.infer<typeof createExperimentSchema>
): Promise<MarketingExperiment> {
  validateTrafficSplit(payload.variants);

  const experiment = await prisma.marketingExperiment.create({
    data: {
      tenantId,
      name: payload.name,
      type: payload.type,
      targetId: payload.targetId,
      goal: payload.goal,
      status: "draft",
      winnerVariantKey: null,
      startedAt: null,
      endedAt: null,
    },
  });

  await prisma.marketingExperimentVariant.createMany({
    data: payload.variants.map((variant) => ({
      experimentId: experiment.id,
      key: variant.key,
      name: variant.name,
      trafficPct: variant.trafficPct,
      exposures: 0,
      conversions: 0,
    })),
  });

  return getNormalizedExperimentOrThrow(tenantId, experiment.id);
}

export async function updateExperimentStatus(
  tenantId: string,
  experimentId: string,
  payload: z.infer<typeof updateExperimentSchema>
): Promise<MarketingExperiment> {
  const { experiment, variants } = await getExperimentOrThrow(tenantId, experimentId);
  const now = new Date();

  if (payload.action === "start") {
    const updated = await prisma.marketingExperiment.update({
      where: { id: experiment.id },
      data: {
        status: "running",
        startedAt: experiment.startedAt || now,
        endedAt: null,
        updatedAt: now,
      },
    });

    return normalizeExperiment(updated, variants);
  }

  if (payload.action === "pause") {
    if (experiment.status === "completed") {
      throw new Error("Completed experiment cannot be paused");
    }

    const updated = await prisma.marketingExperiment.update({
      where: { id: experiment.id },
      data: {
        status: "paused",
        updatedAt: now,
      },
    });

    return normalizeExperiment(updated, variants);
  }

  const hydrated = normalizeExperiment(experiment, variants);
  const winnerVariantKey = selectWinner(hydrated);

  const updated = await prisma.marketingExperiment.update({
    where: { id: experiment.id },
    data: {
      status: "completed",
      endedAt: now,
      winnerVariantKey,
      updatedAt: now,
    },
  });

  return normalizeExperiment(updated, variants);
}

export async function recordExperimentEvent(
  tenantId: string,
  experimentId: string,
  payload: z.infer<typeof experimentEventSchema>
): Promise<MarketingExperiment> {
  const { experiment } = await getExperimentOrThrow(tenantId, experimentId);
  if (experiment.status !== "running") {
    throw new Error("Experiment must be running to record events");
  }

  const variant = await prisma.marketingExperimentVariant.findFirst({
    where: {
      experimentId: experiment.id,
      key: payload.variantKey,
    },
  });

  if (!variant) {
    throw new Error("Variant not found");
  }

  await prisma.marketingExperimentVariant.update({
    where: { id: variant.id },
    data:
      payload.eventType === "exposure"
        ? { exposures: { increment: 1 } }
        : { conversions: { increment: 1 } },
  });

  await prisma.marketingExperiment.update({
    where: { id: experiment.id },
    data: {
      updatedAt: new Date(),
    },
  });

  return getNormalizedExperimentOrThrow(tenantId, experiment.id);
}

export function summarizeExperiments(experiments: MarketingExperiment[]) {
  const summary = {
    total: experiments.length,
    draft: 0,
    running: 0,
    paused: 0,
    completed: 0,
    totalExposures: 0,
    totalConversions: 0,
    overallConversionRatePct: 0,
  };

  for (const experiment of experiments) {
    summary[experiment.status] += 1;
    for (const variant of experiment.variants) {
      summary.totalExposures += variant.exposures;
      summary.totalConversions += variant.conversions;
    }
  }

  summary.overallConversionRatePct = summary.totalExposures
    ? round2((summary.totalConversions / summary.totalExposures) * 100)
    : 0;

  return summary;
}

export async function resetMarketingExperimentsStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.marketingExperimentVariant.deleteMany();
  await prisma.marketingExperiment.deleteMany();
}
