import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const orchestrationPolicySchema = z.object({
  allowWriteTools: z.boolean().default(false),
  maxSteps: z.number().int().min(1).max(6).default(4),
});

export const orchestrateRequestSchema = z.object({
  query: z.string().min(1).max(4000),
  conversationId: z.string().min(1).optional(),
  policy: orchestrationPolicySchema.optional(),
});

export type OrchestrationPlanStep = {
  id: string;
  objective: string;
  type: "analysis" | "tool_call";
  toolName?: string;
  toolArgs?: Record<string, unknown>;
};

export type OrchestrationExecution = {
  stepId: string;
  status: "skipped" | "completed" | "failed";
  toolName?: string;
  output?: unknown;
  error?: string;
};

export type OrchestrationMemory = {
  conversationId: string;
  intents: string[];
  facts: string[];
  updatedAt: string;
};

const blockedPatterns: Array<{ regex: RegExp; reason: string }> = [
  {
    regex: /\b(api\s*keys?|secrets?|passwords?|tokens?|private\s*keys?)\b/i,
    reason: "Request appears to ask for sensitive secrets.",
  },
  {
    regex: /\b(ssn|social\s*security|credit\s*card|cvv|bank\s*account)\b/i,
    reason: "Request appears to ask for restricted personal financial data.",
  },
  {
    regex: /\b(drop\s+table|delete\s+all|purge\s+data|mass\s+delete)\b/i,
    reason: "Request appears destructive and violates safe-operation policy.",
  },
];

function buildPlan(query: string, maxSteps: number): OrchestrationPlanStep[] {
  const plan: OrchestrationPlanStep[] = [
    {
      id: randomUUID(),
      objective: "Classify user intent and choose relevant CRM data sources",
      type: "analysis",
    },
  ];

  const queryLower = query.toLowerCase();

  if (/(contact|customer|lead|email|phone)/.test(queryLower)) {
    plan.push({
      id: randomUUID(),
      objective: "Find matching contacts relevant to the query",
      type: "tool_call",
      toolName: "search_contacts",
      toolArgs: {
        query: query.trim().slice(0, 120),
        limit: 5,
      },
    });
  }

  if (/(deal|pipeline|revenue|forecast)/.test(queryLower)) {
    plan.push({
      id: randomUUID(),
      objective: "Retrieve deal and pipeline context",
      type: "tool_call",
      toolName: "pipeline_summary",
      toolArgs: {},
    });
  }

  if (/(activity|timeline|note|task)/.test(queryLower)) {
    plan.push({
      id: randomUUID(),
      objective: "Collect recent timeline activities",
      type: "tool_call",
      toolName: "get_activities",
      toolArgs: {
        limit: 5,
      },
    });
  }

  if (plan.length === 1) {
    plan.push({
      id: randomUUID(),
      objective: "Collect high-level pipeline context for reasoning",
      type: "tool_call",
      toolName: "pipeline_summary",
      toolArgs: {},
    });
  }

  return plan.slice(0, maxSteps);
}

function evaluateGuardrails(query: string) {
  for (const rule of blockedPatterns) {
    if (rule.regex.test(query)) {
      return {
        blocked: true,
        reason: rule.reason,
      };
    }
  }

  return {
    blocked: false,
    reason: null,
  };
}

function summarizeToolOutput(output: unknown): string {
  if (output == null) return "No output";

  if (typeof output === "string") {
    return output.slice(0, 200);
  }

  if (typeof output === "object") {
    const record = output as Record<string, unknown>;
    if (typeof record.count === "number") {
      return `count=${record.count}`;
    }
    if (Array.isArray(record.contacts)) {
      return `contacts=${record.contacts.length}`;
    }
    if (Array.isArray(record.deals)) {
      return `deals=${record.deals.length}`;
    }
    if (Array.isArray(record.activities)) {
      return `activities=${record.activities.length}`;
    }
  }

  return JSON.stringify(output).slice(0, 200);
}

function normalizeStringList(value: unknown) {
  const parsed = z.array(z.string()).safeParse(value);
  return parsed.success ? parsed.data : [];
}

async function getMemoryRow(tenantId: string, conversationId: string) {
  return prisma.aiOrchestrationMemory.findFirst({
    where: {
      tenantId,
      conversationId,
    },
    select: {
      id: true,
      conversationId: true,
      intents: true,
      facts: true,
      updatedAt: true,
    },
  });
}

function normalizeMemory(row: {
  conversationId: string;
  intents: unknown;
  facts: unknown;
  updatedAt: Date;
}) {
  return {
    conversationId: row.conversationId,
    intents: normalizeStringList(row.intents),
    facts: normalizeStringList(row.facts),
    updatedAt: row.updatedAt.toISOString(),
  } satisfies OrchestrationMemory;
}

async function updateMemory(
  tenantId: string,
  conversationId: string,
  query: string,
  executions: OrchestrationExecution[]
) {
  const previousRow = await getMemoryRow(tenantId, conversationId);
  const previous = previousRow
    ? normalizeMemory(previousRow)
    : {
        conversationId,
        intents: [],
        facts: [],
        updatedAt: new Date().toISOString(),
      };

  const intents = [...previous.intents, query.slice(0, 140)].slice(-8);
  const facts = [
    ...previous.facts,
    ...executions
      .filter((item) => item.status === "completed" && item.toolName)
      .map((item) => `${item.toolName}:${summarizeToolOutput(item.output)}`),
  ].slice(-12);

  const row = await prisma.aiOrchestrationMemory.upsert({
    where: {
      tenantId_conversationId: {
        tenantId,
        conversationId,
      },
    },
    create: {
      tenantId,
      conversationId,
      intents,
      facts,
    },
    update: {
      intents,
      facts,
    },
    select: {
      conversationId: true,
      intents: true,
      facts: true,
      updatedAt: true,
    },
  });

  return normalizeMemory(row);
}

function isWriteTool(toolName: string) {
  return toolName === "create_note" || toolName === "create_task";
}

export async function runOrchestration(
  input: z.infer<typeof orchestrateRequestSchema>,
  tools: Record<string, unknown>,
  options?: {
    tenantId?: string;
  }
) {
  const payload = orchestrateRequestSchema.parse(input);
  const policy = orchestrationPolicySchema.parse(payload.policy || {});

  const guardrail = evaluateGuardrails(payload.query);

  if (guardrail.blocked) {
    return {
      blocked: true,
      guardrailReason: guardrail.reason,
      plan: [],
      executions: [],
      memory: payload.conversationId && options?.tenantId
        ? await updateMemory(options.tenantId, payload.conversationId, payload.query, [])
        : null,
      orchestrationSummary: "Request blocked by policy guardrails.",
    };
  }

  const plan = buildPlan(payload.query, policy.maxSteps);
  const executions: OrchestrationExecution[] = [];

  for (const step of plan) {
    if (step.type !== "tool_call" || !step.toolName) {
      executions.push({
        stepId: step.id,
        status: "completed",
      });
      continue;
    }

    if (!policy.allowWriteTools && isWriteTool(step.toolName)) {
      executions.push({
        stepId: step.id,
        status: "skipped",
        toolName: step.toolName,
        error: "Write tool skipped by policy",
      });
      continue;
    }

    const tool = tools[step.toolName] as { execute?: (args: any) => Promise<unknown> } | undefined;
    if (!tool || typeof tool.execute !== "function") {
      executions.push({
        stepId: step.id,
        status: "failed",
        toolName: step.toolName,
        error: "Tool unavailable",
      });
      continue;
    }

    try {
      const output = await tool.execute(step.toolArgs || {});
      executions.push({
        stepId: step.id,
        status: "completed",
        toolName: step.toolName,
        output,
      });
    } catch (error) {
      executions.push({
        stepId: step.id,
        status: "failed",
        toolName: step.toolName,
        error: error instanceof Error ? error.message : "Tool execution failed",
      });
    }
  }

  const summaryLines = executions
    .map((item) => {
      if (!item.toolName) return "analysis completed";
      if (item.status === "completed") {
        return `${item.toolName}: ${summarizeToolOutput(item.output)}`;
      }
      return `${item.toolName}: ${item.status}${item.error ? ` (${item.error})` : ""}`;
    })
    .slice(0, 8);

  const memory = payload.conversationId && options?.tenantId
    ? await updateMemory(options.tenantId, payload.conversationId, payload.query, executions)
    : null;

  return {
    blocked: false,
    guardrailReason: null,
    plan,
    executions,
    memory,
    orchestrationSummary: summaryLines.join("\n"),
  };
}

export async function getOrchestrationMemory(tenantId: string, conversationId: string) {
  const row = await getMemoryRow(tenantId, conversationId);
  return row ? normalizeMemory(row) : null;
}

export async function resetOrchestrationStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  await prisma.aiOrchestrationMemory.deleteMany();
}
