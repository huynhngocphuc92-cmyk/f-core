import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const slaTargetSchema = z.object({
  firstResponseMinutes: z.number().int().min(1).max(24 * 60),
  resolutionHours: z.number().int().min(1).max(24 * 30),
});

export const slaPolicySchema = z.object({
  low: slaTargetSchema,
  medium: slaTargetSchema,
  high: slaTargetSchema,
  urgent: slaTargetSchema,
});

export type SlaPolicy = z.infer<typeof slaPolicySchema>;

export const DEFAULT_SLA_POLICY: SlaPolicy = {
  low: { firstResponseMinutes: 240, resolutionHours: 72 },
  medium: { firstResponseMinutes: 120, resolutionHours: 24 },
  high: { firstResponseMinutes: 60, resolutionHours: 8 },
  urgent: { firstResponseMinutes: 15, resolutionHours: 4 },
};

function clonePolicy(policy: SlaPolicy): SlaPolicy {
  return {
    low: { ...policy.low },
    medium: { ...policy.medium },
    high: { ...policy.high },
    urgent: { ...policy.urgent },
  };
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isSchemaDriftError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

function normalizePolicy(value: Prisma.JsonValue | null | undefined): SlaPolicy {
  const parsed = slaPolicySchema.safeParse(value);
  if (parsed.success) return clonePolicy(parsed.data);
  return clonePolicy(DEFAULT_SLA_POLICY);
}

export async function getSlaPolicy(tenantId: string): Promise<SlaPolicy> {
  let row;
  try {
    row = await prisma.serviceSlaPolicyConfig.findFirst({
      where: { tenantId },
    });
  } catch (error) {
    if (isSchemaDriftError(error)) {
      return clonePolicy(DEFAULT_SLA_POLICY);
    }
    throw error;
  }

  if (!row) return clonePolicy(DEFAULT_SLA_POLICY);
  return normalizePolicy(row.policy);
}

export async function setSlaPolicy(tenantId: string, policy: SlaPolicy): Promise<SlaPolicy> {
  try {
    const existing = await prisma.serviceSlaPolicyConfig.findFirst({
      where: { tenantId },
    });

    if (existing) {
      await prisma.serviceSlaPolicyConfig.update({
        where: { id: existing.id },
        data: {
          policy: toInputJsonValue(policy),
        },
      });
    } else {
      await prisma.serviceSlaPolicyConfig.create({
        data: {
          tenantId,
          policy: toInputJsonValue(policy),
        },
      });
    }
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }
  }

  return clonePolicy(policy);
}

export async function resetSlaPolicyStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.serviceSlaPolicyConfig.deleteMany();
}
