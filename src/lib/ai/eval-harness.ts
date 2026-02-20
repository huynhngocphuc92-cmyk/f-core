import { z } from "zod";
import { buildSalesAgentInsights } from "@/lib/ai/sales-agent";
import { buildServiceAgentInsights } from "@/lib/ai/service-agent";
import { buildKnowledgeAgentAnswer } from "@/lib/ai/knowledge-agent";

export const aiEvalThresholdSchema = z.object({
  minQuality: z.number().min(0).max(100).default(70),
  maxLatencyMs: z.number().min(1).max(5000).default(250),
  maxCostUsd: z.number().min(0).max(1).default(0.02),
});

export type AIEvalThresholds = z.infer<typeof aiEvalThresholdSchema>;

export type AIEvalScenarioResult = {
  id: string;
  agent: "sales" | "service" | "knowledge";
  qualityScore: number;
  latencyMs: number;
  estimatedCostUsd: number;
  passed: boolean;
  reasons: string[];
};

export type AIEvalSummary = {
  generatedAt: string;
  thresholds: AIEvalThresholds;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRatePct: number;
  averages: {
    qualityScore: number;
    latencyMs: number;
    estimatedCostUsd: number;
  };
  allPassed: boolean;
  scenarios: AIEvalScenarioResult[];
};

function estimateCostUsd(input: string, output: string) {
  const chars = input.length + output.length;
  const estimatedTokens = chars / 4;
  const cost = (estimatedTokens / 1000) * 0.003;
  return Number(cost.toFixed(6));
}

function round(value: number, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function evaluateSalesScenario() {
  const query = "What should the sales team prioritize this quarter to protect pipeline health?";
  const startedAt = Date.now();
  const response = buildSalesAgentInsights({
    query,
    period: "quarter",
    maxRecommendations: 4,
    forecast: {
      generatedAt: "2026-02-15T00:00:00.000Z",
      summary: {
        openDealAmount: 180000,
        weightedPipeline: 112000,
        trendGrowthPct: 9.4,
        confidencePct: 81,
      },
      monthly: [
        {
          key: "2026-02",
          startDate: "2026-02-01T00:00:00.000Z",
          endDate: "2026-03-01T00:00:00.000Z",
          pipelineAmount: 62000,
          weightedForecast: 39000,
          trendBaseline: 35000,
          forecast: 38000,
          confidenceLow: 32000,
          confidenceHigh: 44000,
        },
      ],
      quarterly: [
        {
          key: "2026-Q1",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-04-01T00:00:00.000Z",
          pipelineAmount: 180000,
          weightedForecast: 112000,
          trendBaseline: 104000,
          forecast: 110000,
          confidenceLow: 90000,
          confidenceHigh: 126000,
        },
      ],
    },
    coachingInsights: [
      {
        dealId: "deal-1",
        dealName: "Enterprise Renewal",
        amount: 60000,
        stageName: "Negotiation",
        healthScore: 44,
        riskLevel: "high",
        reasons: ["No recent customer call", "Low sentiment on last transcript"],
        recommendations: ["Escalate executive follow-up in 48 hours"],
        callCount: 1,
        avgSentiment: -0.3,
      },
      {
        dealId: "deal-2",
        dealName: "Expansion Add-on",
        amount: 42000,
        stageName: "Proposal",
        healthScore: 63,
        riskLevel: "medium",
        reasons: ["Decision timeline unclear"],
        recommendations: ["Confirm procurement timeline with buyer"],
        callCount: 2,
        avgSentiment: 0.1,
      },
    ],
  });
  const latencyMs = Math.max(1, Date.now() - startedAt);
  const output = JSON.stringify(response.recommendations);
  const estimatedCostUsd = estimateCostUsd(query, output);

  const actionability = response.recommendations.filter(
    (item) => item.action.length >= 25 && item.evidence.length > 0
  ).length;
  const qualityScore = round(
    Math.min(
      100,
      actionability * 20 + (response.recommendations.length > 0 ? 30 : 0) + response.confidence * 0.4
    )
  );

  return { qualityScore, latencyMs, estimatedCostUsd };
}

function evaluateServiceScenario() {
  const query = "Which support tickets should be triaged immediately and what should we reply?";
  const startedAt = Date.now();
  const response = buildServiceAgentInsights({
    query,
    maxRecommendations: 4,
    tickets: [
      {
        id: "ticket-1",
        subject: "Checkout outage in production",
        description: "Payments fail for all users",
        status: "open",
        priority: "urgent",
        source: "web",
        category: "bug",
        createdAt: new Date("2026-02-13T08:00:00.000Z"),
        updatedAt: new Date("2026-02-15T09:00:00.000Z"),
        dueDate: new Date("2026-02-15T09:30:00.000Z"),
        firstResponseAt: null,
        assignee: null,
        contact: { firstName: "Taylor", lastName: "Tran" },
      },
      {
        id: "ticket-2",
        subject: "Cannot reset password",
        description: "Password email not received",
        status: "waiting",
        priority: "high",
        source: "chat",
        category: "support",
        createdAt: new Date("2026-02-14T12:00:00.000Z"),
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
        dueDate: new Date("2026-02-15T15:00:00.000Z"),
        firstResponseAt: null,
        assignee: { id: "agent-2", name: "Agent Lee" },
        contact: { firstName: "Jordan", lastName: null },
      },
    ],
    now: new Date("2026-02-15T12:00:00.000Z"),
  });
  const latencyMs = Math.max(1, Date.now() - startedAt);
  const output = JSON.stringify(response.recommendations);
  const estimatedCostUsd = estimateCostUsd(query, output);

  const replyQuality = response.recommendations.filter(
    (item) => item.suggestedReply.length >= 45 && item.evidence.length > 0
  ).length;
  const qualityScore = round(
    Math.min(100, replyQuality * 22 + (response.summary.overdueTickets > 0 ? 20 : 0) + response.confidence * 0.45)
  );

  return { qualityScore, latencyMs, estimatedCostUsd };
}

function evaluateKnowledgeScenario() {
  const query = "How do we configure SLA policy alerts and routing rules?";
  const startedAt = Date.now();
  const response = buildKnowledgeAgentAnswer({
    query,
    maxCitations: 4,
    articles: [
      {
        id: "kb-1",
        title: "Configure SLA policy thresholds",
        slug: "configure-sla-policy-thresholds",
        excerpt: "Set first-response and resolution targets by priority and run SLA alert jobs.",
        contentHtml: "Use Service SLA settings to manage policy and trigger alert runs for at-risk and breached tickets.",
        tags: ["sla", "alerts", "service"],
        category: { name: "Service Hub", slug: "service-hub" },
        viewCount: 230,
        helpfulCount: 44,
        publishedAt: new Date("2026-02-10T00:00:00.000Z"),
      },
      {
        id: "kb-2",
        title: "Routing rules for support queues",
        slug: "routing-rules-support-queues",
        excerpt: "Create routing rules by priority, channel, and business hours.",
        contentHtml: "Routing rules allow assignment by team and off-hours fallback ownership.",
        tags: ["routing", "queue", "service"],
        category: { name: "Service Hub", slug: "service-hub" },
        viewCount: 190,
        helpfulCount: 31,
        publishedAt: new Date("2026-02-08T00:00:00.000Z"),
      },
    ],
  });
  const latencyMs = Math.max(1, Date.now() - startedAt);
  const output = JSON.stringify({
    answer: response.answer,
    citations: response.citations,
  });
  const estimatedCostUsd = estimateCostUsd(query, output);

  const groundingScore =
    (response.safety.grounded ? 35 : 0) +
    (response.safety.hasSufficientContext ? 25 : 0) +
    Math.min(30, response.citations.length * 10);
  const qualityScore = round(Math.min(100, groundingScore + response.confidence * 0.1));

  return { qualityScore, latencyMs, estimatedCostUsd };
}

function evaluateScenarioResult(args: {
  id: string;
  agent: "sales" | "service" | "knowledge";
  metrics: {
    qualityScore: number;
    latencyMs: number;
    estimatedCostUsd: number;
  };
  thresholds: AIEvalThresholds;
}): AIEvalScenarioResult {
  const reasons: string[] = [];
  if (args.metrics.qualityScore < args.thresholds.minQuality) reasons.push("quality_below_threshold");
  if (args.metrics.latencyMs > args.thresholds.maxLatencyMs) reasons.push("latency_above_threshold");
  if (args.metrics.estimatedCostUsd > args.thresholds.maxCostUsd) reasons.push("cost_above_threshold");

  return {
    id: args.id,
    agent: args.agent,
    qualityScore: args.metrics.qualityScore,
    latencyMs: args.metrics.latencyMs,
    estimatedCostUsd: args.metrics.estimatedCostUsd,
    passed: reasons.length === 0,
    reasons,
  };
}

export function runAIEvalHarness(input?: {
  thresholds?: Partial<AIEvalThresholds>;
}): AIEvalSummary {
  const thresholds = aiEvalThresholdSchema.parse(input?.thresholds || {});

  const scenarios: AIEvalScenarioResult[] = [
    evaluateScenarioResult({
      id: "sales-coaching-forecast",
      agent: "sales",
      metrics: evaluateSalesScenario(),
      thresholds,
    }),
    evaluateScenarioResult({
      id: "service-triage-reply",
      agent: "service",
      metrics: evaluateServiceScenario(),
      thresholds,
    }),
    evaluateScenarioResult({
      id: "knowledge-grounding",
      agent: "knowledge",
      metrics: evaluateKnowledgeScenario(),
      thresholds,
    }),
  ];

  const totalScenarios = scenarios.length;
  const passedScenarios = scenarios.filter((scenario) => scenario.passed).length;
  const failedScenarios = totalScenarios - passedScenarios;
  const passRatePct = round((passedScenarios / totalScenarios) * 100, 1);
  const averages = {
    qualityScore: round(scenarios.reduce((sum, item) => sum + item.qualityScore, 0) / totalScenarios),
    latencyMs: round(scenarios.reduce((sum, item) => sum + item.latencyMs, 0) / totalScenarios),
    estimatedCostUsd: Number(
      (scenarios.reduce((sum, item) => sum + item.estimatedCostUsd, 0) / totalScenarios).toFixed(6)
    ),
  };

  return {
    generatedAt: new Date().toISOString(),
    thresholds,
    totalScenarios,
    passedScenarios,
    failedScenarios,
    passRatePct,
    averages,
    allPassed: failedScenarios === 0,
    scenarios,
  };
}
