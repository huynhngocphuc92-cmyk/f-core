import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

const dunningStatusSchema = z.enum(["open", "recovered", "canceled"]);

export const updateDunningConfigSchema = z.object({
  retryDelaysHours: z.array(z.number().int().min(1).max(24 * 30)).min(1).max(8),
  maxRetries: z.number().int().min(1).max(8),
  cancelAfterMaxRetries: z.boolean().default(true),
  notifyChannels: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    inApp: z.boolean().default(true),
  }),
});

export const createDunningCaseSchema = z.object({
  subscriptionId: z.string().min(1).max(64).optional(),
  invoiceId: z.string().min(1).max(64).optional(),
  customerName: z.string().min(1).max(200),
  amount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  reason: z.string().min(1).max(500).optional(),
});

export const updateDunningCaseSchema = z.object({
  action: z.enum(["mark_retry_failed", "mark_paid", "cancel"]),
  reason: z.string().max(500).optional(),
});

type DunningConfig = {
  retryDelaysHours: number[];
  maxRetries: number;
  cancelAfterMaxRetries: boolean;
  notifyChannels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  updatedAt: string;
};

type DunningEvent = {
  at: string;
  type: "created" | "retry_failed" | "paid" | "canceled";
  reason: string | null;
};

export type DunningCase = {
  id: string;
  tenantId: string;
  subscriptionId: string | null;
  invoiceId: string | null;
  customerName: string;
  amount: number;
  currency: string;
  status: z.infer<typeof dunningStatusSchema>;
  attemptCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: DunningEvent[];
};

const DEFAULT_DUNNING_CONFIG: Omit<DunningConfig, "updatedAt"> = {
  retryDelaysHours: [24, 72, 120],
  maxRetries: 3,
  cancelAfterMaxRetries: true,
  notifyChannels: {
    email: true,
    sms: false,
    inApp: true,
  },
};

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : Number(value);
}

function parseConfigJsonValue<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return fallback;
  }
}

function normalizeDunningConfig(record: {
  retryDelaysHours: Prisma.JsonValue;
  maxRetries: number;
  cancelAfterMaxRetries: boolean;
  notifyChannels: Prisma.JsonValue;
  updatedAt: Date;
}): DunningConfig {
  return {
    retryDelaysHours: parseConfigJsonValue<number[]>(
      record.retryDelaysHours,
      DEFAULT_DUNNING_CONFIG.retryDelaysHours
    ),
    maxRetries: record.maxRetries,
    cancelAfterMaxRetries: record.cancelAfterMaxRetries,
    notifyChannels: parseConfigJsonValue<DunningConfig["notifyChannels"]>(
      record.notifyChannels,
      DEFAULT_DUNNING_CONFIG.notifyChannels
    ),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeDunningCase(record: {
  id: string;
  tenantId: string;
  subscriptionId: string | null;
  invoiceId: string | null;
  customerName: string;
  amount: Prisma.Decimal | number;
  currency: string;
  status: string;
  attemptCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  lastAttemptAt: Date | null;
  history: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): DunningCase {
  return {
    id: record.id,
    tenantId: record.tenantId,
    subscriptionId: record.subscriptionId,
    invoiceId: record.invoiceId,
    customerName: record.customerName,
    amount: toNumber(record.amount),
    currency: record.currency,
    status: dunningStatusSchema.parse(record.status),
    attemptCount: record.attemptCount,
    maxRetries: record.maxRetries,
    nextRetryAt: toIso(record.nextRetryAt),
    lastAttemptAt: toIso(record.lastAttemptAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    history: parseConfigJsonValue<DunningEvent[]>(record.history, []),
  };
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function nextDelayHours(config: DunningConfig, attemptCount: number) {
  const configured = config.retryDelaysHours[Math.max(0, attemptCount - 1)];
  if (configured) return configured;
  return config.retryDelaysHours[config.retryDelaysHours.length - 1] || 24;
}

async function getOrCreateDunningConfigRecord(tenantId: string) {
  const existing = await prisma.commerceDunningConfig.findUnique({
    where: { tenantId },
  });

  if (existing) {
    return existing;
  }

  return prisma.commerceDunningConfig.create({
    data: {
      tenantId,
      retryDelaysHours: DEFAULT_DUNNING_CONFIG.retryDelaysHours,
      maxRetries: DEFAULT_DUNNING_CONFIG.maxRetries,
      cancelAfterMaxRetries: DEFAULT_DUNNING_CONFIG.cancelAfterMaxRetries,
      notifyChannels: DEFAULT_DUNNING_CONFIG.notifyChannels,
    },
  });
}

async function getDunningCaseOrThrow(tenantId: string, id: string) {
  const dunningCase = await prisma.commerceDunningCase.findFirst({
    where: { tenantId, id },
  });
  if (!dunningCase) {
    throw new Error("Dunning case not found");
  }
  return dunningCase;
}

export async function getDunningConfig(tenantId: string): Promise<DunningConfig> {
  const config = await getOrCreateDunningConfigRecord(tenantId);
  return normalizeDunningConfig(config);
}

export async function updateDunningConfig(
  tenantId: string,
  input: z.infer<typeof updateDunningConfigSchema>
): Promise<DunningConfig> {
  const existing = await prisma.commerceDunningConfig.findUnique({
    where: { tenantId },
  });

  const config = existing
    ? await prisma.commerceDunningConfig.update({
        where: { id: existing.id },
        data: {
          retryDelaysHours: input.retryDelaysHours,
          maxRetries: input.maxRetries,
          cancelAfterMaxRetries: input.cancelAfterMaxRetries,
          notifyChannels: input.notifyChannels,
        },
      })
    : await prisma.commerceDunningConfig.create({
        data: {
          tenantId,
          retryDelaysHours: input.retryDelaysHours,
          maxRetries: input.maxRetries,
          cancelAfterMaxRetries: input.cancelAfterMaxRetries,
          notifyChannels: input.notifyChannels,
        },
      });

  return normalizeDunningConfig(config);
}

export async function listDunningCases(tenantId: string): Promise<DunningCase[]> {
  const rows = await prisma.commerceDunningCase.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(normalizeDunningCase);
}

export async function createDunningCase(
  tenantId: string,
  input: z.infer<typeof createDunningCaseSchema>
): Promise<DunningCase> {
  const config = await getDunningConfig(tenantId);
  const now = new Date();
  const initialDelay = nextDelayHours(config, 1);

  const record = await prisma.commerceDunningCase.create({
    data: {
      tenantId,
      subscriptionId: input.subscriptionId || null,
      invoiceId: input.invoiceId || null,
      customerName: input.customerName,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency.toUpperCase(),
      status: "open",
      attemptCount: 1,
      maxRetries: config.maxRetries,
      lastAttemptAt: now,
      nextRetryAt: addHours(now, initialDelay),
      history: [
        {
          at: now.toISOString(),
          type: "created",
          reason: input.reason || "Initial payment failed",
        },
      ] satisfies DunningEvent[],
    },
  });

  return normalizeDunningCase(record);
}

export async function markDunningCaseRetryFailed(
  tenantId: string,
  id: string,
  reason?: string
): Promise<DunningCase> {
  const config = await getDunningConfig(tenantId);
  const dunningCase = await getDunningCaseOrThrow(tenantId, id);

  if (dunningCase.status !== "open") {
    throw new Error("Only open dunning cases can be retried");
  }

  const now = new Date();
  const nextAttemptCount = dunningCase.attemptCount + 1;
  const history = parseConfigJsonValue<DunningEvent[]>(dunningCase.history, []);
  history.push({
    at: now.toISOString(),
    type: "retry_failed",
    reason: reason || null,
  });

  const reachedMaxRetries = nextAttemptCount >= config.maxRetries;
  const nextStatus = reachedMaxRetries && config.cancelAfterMaxRetries ? "canceled" : "open";
  const nextRetryAt = reachedMaxRetries ? null : addHours(now, nextDelayHours(config, nextAttemptCount));

  const updated = await prisma.commerceDunningCase.update({
    where: { id: dunningCase.id },
    data: {
      status: nextStatus,
      attemptCount: nextAttemptCount,
      lastAttemptAt: now,
      nextRetryAt,
      history,
    },
  });

  return normalizeDunningCase(updated);
}

export async function markDunningCasePaid(
  tenantId: string,
  id: string,
  reason?: string
): Promise<DunningCase> {
  const dunningCase = await getDunningCaseOrThrow(tenantId, id);
  if (dunningCase.status !== "open") {
    throw new Error("Only open dunning cases can be recovered");
  }

  const now = new Date();
  const history = parseConfigJsonValue<DunningEvent[]>(dunningCase.history, []);
  history.push({
    at: now.toISOString(),
    type: "paid",
    reason: reason || null,
  });

  const updated = await prisma.commerceDunningCase.update({
    where: { id: dunningCase.id },
    data: {
      status: "recovered",
      nextRetryAt: null,
      history,
    },
  });

  return normalizeDunningCase(updated);
}

export async function cancelDunningCase(
  tenantId: string,
  id: string,
  reason?: string
): Promise<DunningCase> {
  const dunningCase = await getDunningCaseOrThrow(tenantId, id);
  if (dunningCase.status === "canceled") {
    throw new Error("Dunning case already canceled");
  }

  const now = new Date();
  const history = parseConfigJsonValue<DunningEvent[]>(dunningCase.history, []);
  history.push({
    at: now.toISOString(),
    type: "canceled",
    reason: reason || null,
  });

  const updated = await prisma.commerceDunningCase.update({
    where: { id: dunningCase.id },
    data: {
      status: "canceled",
      nextRetryAt: null,
      history,
    },
  });

  return normalizeDunningCase(updated);
}

export function summarizeDunningCases(cases: DunningCase[]) {
  const summary = {
    total: cases.length,
    open: 0,
    recovered: 0,
    canceled: 0,
    atRiskAmount: 0,
  };

  for (const dunningCase of cases) {
    if (dunningCase.status === "open") {
      summary.open += 1;
      summary.atRiskAmount += dunningCase.amount;
    }

    if (dunningCase.status === "recovered") {
      summary.recovered += 1;
    }

    if (dunningCase.status === "canceled") {
      summary.canceled += 1;
    }
  }

  return summary;
}

export async function resetDunningStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.commerceDunningCase.deleteMany();
  await prisma.commerceDunningConfig.deleteMany();
}
