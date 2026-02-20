import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const aiAgentEnum = z.enum([
  "chat",
  "orchestration",
  "sales",
  "service",
  "knowledge",
  "prospecting",
]);

export const createPromptVersionSchema = z.object({
  agent: aiAgentEnum,
  label: z.string().trim().min(1).max(120).optional(),
  prompt: z.string().trim().min(10).max(12000),
  activate: z.boolean().default(true),
});

export const rollbackPromptVersionSchema = z.object({
  versionId: z.string().min(1),
});

export type AIAgent = z.infer<typeof aiAgentEnum>;

export type AIPromptVersion = {
  id: string;
  tenantId: string;
  agent: AIAgent;
  version: number;
  label: string;
  prompt: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
};

const defaultPromptSeeds: Record<AIAgent, string> = {
  chat:
    "Answer accurately using tenant-scoped CRM data. Prefer concise recommendations and explicit next actions.",
  orchestration:
    "Plan tool calls safely, avoid write actions unless policy allows, and summarize evidence from each executed step.",
  sales:
    "Provide actionable sales coaching with explainability, confidence, and evidence tied to deal and forecast signals.",
  service:
    "Prioritize ticket triage by urgency/SLA risk and produce customer-safe draft replies with clear follow-up steps.",
  knowledge:
    "Return grounded answers that cite matching knowledge-base sources and explicitly flag missing context when evidence is weak.",
  prospecting:
    "Prioritize outreach opportunities using inactivity/stall signals, recommend concrete next-touch actions, and include explainable evidence per recommendation.",
};

function normalizePromptVersion(row: {
  id: string;
  tenantId: string;
  agent: string;
  version: number;
  label: string;
  prompt: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string | null;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    agent: aiAgentEnum.parse(row.agent),
    version: row.version,
    label: row.label,
    prompt: row.prompt,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
  } satisfies AIPromptVersion;
}

async function ensureSeedVersion(tenantId: string, agent: AIAgent) {
  const existing = await prisma.aiPromptVersion.count({
    where: {
      tenantId,
      agent,
    },
  });

  if (existing > 0) return;

  await prisma.aiPromptVersion.create({
    data: {
      id: randomUUID(),
      tenantId,
      agent,
      version: 1,
      label: "baseline",
      prompt: defaultPromptSeeds[agent],
      isActive: true,
      createdBy: null,
    },
  });
}

export async function listPromptVersions(tenantId: string, agent: AIAgent) {
  await ensureSeedVersion(tenantId, agent);

  const rows = await prisma.aiPromptVersion.findMany({
    where: {
      tenantId,
      agent,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      agent: true,
      version: true,
      label: true,
      prompt: true,
      isActive: true,
      createdAt: true,
      createdBy: true,
    },
  });

  return rows.map((row) => normalizePromptVersion(row));
}

export async function listAllPromptVersions(tenantId: string) {
  const agents = aiAgentEnum.options as AIAgent[];
  for (const agent of agents) {
    await ensureSeedVersion(tenantId, agent);
  }

  return Promise.all(agents.map(async (agent) => ({
    agent,
    versions: await listPromptVersions(tenantId, agent),
  })));
}

export async function getActivePromptVersion(tenantId: string, agent: AIAgent) {
  const versions = await listPromptVersions(tenantId, agent);
  return versions.find((item) => item.isActive) || versions[0];
}

export async function createPromptVersion(
  tenantId: string,
  input: z.infer<typeof createPromptVersionSchema>,
  createdBy?: string | null
) {
  await ensureSeedVersion(tenantId, input.agent);
  const latest = await prisma.aiPromptVersion.findFirst({
    where: {
      tenantId,
      agent: input.agent,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      version: true,
    },
  });

  const nextVersion = (latest?.version || 0) + 1;

  if (input.activate) {
    await prisma.aiPromptVersion.updateMany({
      where: {
        tenantId,
        agent: input.agent,
      },
      data: {
        isActive: false,
      },
    });
  }

  const created = await prisma.aiPromptVersion.create({
    data: {
      id: randomUUID(),
      tenantId,
      agent: input.agent,
      version: nextVersion,
      label: input.label?.trim() || `v${nextVersion}`,
      prompt: input.prompt,
      isActive: input.activate,
      createdBy: createdBy || null,
    },
    select: {
      id: true,
      tenantId: true,
      agent: true,
      version: true,
      label: true,
      prompt: true,
      isActive: true,
      createdAt: true,
      createdBy: true,
    },
  });

  return normalizePromptVersion(created);
}

export async function rollbackPromptVersion(
  tenantId: string,
  input: {
    agent: AIAgent;
    versionId: string;
  }
) {
  await ensureSeedVersion(tenantId, input.agent);
  const target = await prisma.aiPromptVersion.findFirst({
    where: {
      tenantId,
      agent: input.agent,
      id: input.versionId,
    },
    select: {
      id: true,
    },
  });

  if (!target) {
    throw new Error("Prompt version not found");
  }

  await prisma.aiPromptVersion.updateMany({
    where: {
      tenantId,
      agent: input.agent,
    },
    data: {
      isActive: false,
    },
  });

  await prisma.aiPromptVersion.update({
    where: {
      id: input.versionId,
    },
    data: {
      isActive: true,
    },
  });

  return getActivePromptVersion(tenantId, input.agent);
}

export async function resetPromptGovernanceStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  await prisma.aiPromptVersion.deleteMany();
}
