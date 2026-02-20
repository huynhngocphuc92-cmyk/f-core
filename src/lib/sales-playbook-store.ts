import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const salesPlaybookStepSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
});

export const salesPlaybookTemplateSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  stageKeywords: z.array(z.string().min(1).max(120)).min(1).max(20),
  steps: z.array(salesPlaybookStepSchema).min(1).max(20),
});

export type SalesPlaybookTemplate = z.infer<typeof salesPlaybookTemplateSchema>;

export const SALES_PLAYBOOK_TEMPLATES: SalesPlaybookTemplate[] = [
  {
    id: "discovery-qualification",
    name: "Discovery & Qualification",
    description: "Run qualification checklist before committing pipeline.",
    stageKeywords: ["appointment", "discovery", "qualify", "qualified", "demo"],
    steps: [
      {
        id: "research-account",
        title: "Research Account Context",
        description: "Review company profile, historical activities, and open blockers.",
      },
      {
        id: "map-stakeholders",
        title: "Map Stakeholders",
        description: "Identify champion, decision-maker, and procurement contacts.",
      },
      {
        id: "confirm-bant",
        title: "Confirm BANT Fit",
        description: "Validate budget, authority, need, and timeline before advancing.",
      },
    ],
  },
  {
    id: "proposal-negotiation",
    name: "Proposal & Negotiation",
    description: "Guide execution for pricing, security, and procurement alignment.",
    stageKeywords: ["proposal", "contract", "negotiation", "decision", "procurement"],
    steps: [
      {
        id: "proposal-review",
        title: "Review Proposal Scope",
        description: "Align package, terms, and implementation scope with buyer needs.",
      },
      {
        id: "risk-legal-security",
        title: "Resolve Legal/Security Risks",
        description: "Track legal, compliance, and IT security approvals.",
      },
      {
        id: "mutual-close-plan",
        title: "Confirm Mutual Close Plan",
        description: "Set close date, responsibilities, and executive checkpoints.",
      },
    ],
  },
  {
    id: "close-handoff",
    name: "Close & Handoff",
    description: "Ensure predictable close and post-sale transition quality.",
    stageKeywords: ["closed", "won", "handoff", "implementation"],
    steps: [
      {
        id: "contract-signoff",
        title: "Contract Sign-off",
        description: "Capture final signed terms and purchase confirmation.",
      },
      {
        id: "customer-handoff",
        title: "Customer Handoff",
        description: "Transfer requirements and context to onboarding/service team.",
      },
      {
        id: "next-90-day-plan",
        title: "Define 90-day Success Plan",
        description: "Agree on adoption milestones and value checkpoints.",
      },
    ],
  },
];

export const startSalesPlaybookInputSchema = z.object({
  dealId: z.string().min(1).max(64),
  templateId: z.string().min(1).max(64),
});

export const updateSalesPlaybookStepSchema = z.object({
  completed: z.boolean().default(true),
});

export type SalesPlaybookRunStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: Date | null;
};

export type SalesPlaybookRun = {
  id: string;
  tenantId: string;
  dealId: string;
  templateId: string;
  status: "active" | "completed";
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
  steps: SalesPlaybookRunStep[];
};

function normalizeStage(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTemplateById(templateId: string): SalesPlaybookTemplate {
  const template = SALES_PLAYBOOK_TEMPLATES.find((item) => item.id === templateId);
  if (!template) {
    throw new Error(`Unknown playbook template: ${templateId}`);
  }
  return template;
}

const salesPlaybookRunStepStorageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  completed: z.boolean(),
  completedAt: z.string().datetime().nullable(),
});

function serializeSalesPlaybookRunSteps(steps: SalesPlaybookRunStep[]) {
  return steps.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    completed: step.completed,
    completedAt: step.completedAt ? step.completedAt.toISOString() : null,
  }));
}

function defaultStepsForTemplate(templateId: string): SalesPlaybookRunStep[] {
  const template = getTemplateById(templateId);
  return template.steps.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    completed: false,
    completedAt: null,
  }));
}

function normalizeSalesPlaybookRunSteps(
  templateId: string,
  value: unknown
): SalesPlaybookRunStep[] {
  const parsed = z.array(salesPlaybookRunStepStorageSchema).safeParse(value);
  if (!parsed.success) {
    return defaultStepsForTemplate(templateId);
  }

  return parsed.data.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    completed: step.completed,
    completedAt: step.completedAt ? new Date(step.completedAt) : null,
  }));
}

function normalizeSalesPlaybookRun(row: {
  id: string;
  tenantId: string;
  dealId: string;
  templateId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
  steps: unknown;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    dealId: row.dealId,
    templateId: row.templateId,
    status: row.status === "completed" ? "completed" : "active",
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt,
    steps: normalizeSalesPlaybookRunSteps(row.templateId, row.steps),
  } satisfies SalesPlaybookRun;
}

export function recommendSalesPlaybookTemplate(
  stageName: string | null | undefined
): SalesPlaybookTemplate | null {
  const normalized = normalizeStage(stageName);
  if (!normalized) {
    return SALES_PLAYBOOK_TEMPLATES[0] ?? null;
  }

  for (const template of SALES_PLAYBOOK_TEMPLATES) {
    if (template.stageKeywords.some((keyword) => normalized.includes(normalizeStage(keyword)))) {
      return template;
    }
  }

  return SALES_PLAYBOOK_TEMPLATES[0] ?? null;
}

export async function getSalesPlaybookRuns(
  tenantId: string,
  dealId?: string
): Promise<SalesPlaybookRun[]> {
  const rows = await prisma.salesPlaybookRun.findMany({
    where: {
      tenantId,
      dealId,
    },
    orderBy: {
      startedAt: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      dealId: true,
      templateId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      updatedAt: true,
      steps: true,
    },
  });

  return rows.map((row) => normalizeSalesPlaybookRun(row));
}

export async function startSalesPlaybookRun(input: {
  tenantId: string;
  dealId: string;
  templateId: string;
}): Promise<SalesPlaybookRun> {
  const template = getTemplateById(input.templateId);
  const existing = await prisma.salesPlaybookRun.findFirst({
    where: {
      tenantId: input.tenantId,
      dealId: input.dealId,
      templateId: input.templateId,
      status: "active",
    },
    orderBy: {
      startedAt: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      dealId: true,
      templateId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      updatedAt: true,
      steps: true,
    },
  });

  if (existing) {
    return normalizeSalesPlaybookRun(existing);
  }

  const now = new Date();
  const run = await prisma.salesPlaybookRun.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId,
      dealId: input.dealId,
      templateId: template.id,
      status: "active",
      startedAt: now,
      completedAt: null,
      steps: template.steps.map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        completed: false,
        completedAt: null,
      })),
    },
    select: {
      id: true,
      tenantId: true,
      dealId: true,
      templateId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      updatedAt: true,
      steps: true,
    },
  });

  return normalizeSalesPlaybookRun(run);
}

export async function updateSalesPlaybookStep(input: {
  tenantId: string;
  runId: string;
  stepId: string;
  completed: boolean;
}): Promise<SalesPlaybookRun | null> {
  const existing = await prisma.salesPlaybookRun.findFirst({
    where: {
      id: input.runId,
      tenantId: input.tenantId,
    },
    select: {
      id: true,
      tenantId: true,
      dealId: true,
      templateId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      updatedAt: true,
      steps: true,
    },
  });

  if (!existing) {
    return null;
  }

  const run = normalizeSalesPlaybookRun(existing);
  if (!run) {
    return null;
  }

  const step = run.steps.find((item) => item.id === input.stepId);
  if (!step) {
    return null;
  }

  const now = new Date();
  step.completed = input.completed;
  step.completedAt = input.completed ? now : null;
  run.updatedAt = now;

  const allCompleted = run.steps.every((item) => item.completed);
  run.status = allCompleted ? "completed" : "active";
  run.completedAt = allCompleted ? now : null;

  const updated = await prisma.salesPlaybookRun.update({
    where: {
      id: run.id,
    },
    data: {
      status: run.status,
      completedAt: run.completedAt,
      steps: serializeSalesPlaybookRunSteps(run.steps),
      updatedAt: now,
    },
    select: {
      id: true,
      tenantId: true,
      dealId: true,
      templateId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      updatedAt: true,
      steps: true,
    },
  });

  return normalizeSalesPlaybookRun(updated);
}

export function getSalesPlaybookRunProgress(run: SalesPlaybookRun) {
  const totalSteps = run.steps.length;
  const completedSteps = run.steps.filter((step) => step.completed).length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  return { totalSteps, completedSteps, progressPct };
}

export function formatSalesPlaybookRun(run: SalesPlaybookRun) {
  return {
    ...run,
    ...getSalesPlaybookRunProgress(run),
  };
}

export async function resetSalesPlaybookStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  await prisma.salesPlaybookRun.deleteMany();
}
