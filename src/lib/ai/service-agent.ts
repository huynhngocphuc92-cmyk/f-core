import { z } from "zod";

export const serviceAgentRequestSchema = z.object({
  query: z.string().max(2000).optional(),
  maxRecommendations: z.number().int().min(1).max(10).default(5),
});

export type ServiceAgentTicketInput = {
  id: string;
  subject: string;
  description: string | null;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  source: string | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  firstResponseAt: Date | null;
  assignee: { id: string; name: string | null } | null;
  contact: { firstName: string | null; lastName: string | null } | null;
};

export type ServiceAgentRecommendation = {
  id: string;
  ticketId: string;
  priority: "high" | "medium" | "low";
  title: string;
  triage: "immediate" | "today" | "monitor";
  action: string;
  rationale: string;
  confidence: number;
  evidence: string[];
  suggestedReply: string;
};

export type ServiceAgentResponse = {
  generatedAt: string;
  query: string;
  confidence: number;
  summary: {
    openTickets: number;
    urgentTickets: number;
    overdueTickets: number;
    unassignedTickets: number;
  };
  recommendations: ServiceAgentRecommendation[];
  explainability: {
    riskSignalWeights: Record<string, number>;
    queueHealth: {
      immediate: number;
      today: number;
      monitor: number;
    };
  };
};

const riskSignalWeights: Record<string, number> = {
  urgentPriority: 35,
  highPriority: 22,
  waitingStatus: 14,
  overdueSla: 24,
  nearDueSla: 14,
  noFirstResponse: 10,
  staleAgeHours: 10,
  unassigned: 14,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hoursSince(date: Date, now: Date) {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

function hoursUntil(date: Date, now: Date) {
  return (date.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function createReplyTemplate(args: {
  ticket: ServiceAgentTicketInput;
  triage: "immediate" | "today" | "monitor";
}) {
  const name = args.ticket.contact
    ? [args.ticket.contact.firstName, args.ticket.contact.lastName].filter(Boolean).join(" ")
    : "there";
  const greeting = `Hi ${name || "there"},`;
  const acknowledgement =
    args.ticket.priority === "urgent" || args.triage === "immediate"
      ? "thanks for raising this, we are treating it as a high-priority issue."
      : "thanks for the detailed report.";

  const nextStep =
    args.triage === "immediate"
      ? "Our specialist is reviewing it now, and we will send the first concrete update within 2 hours."
      : args.triage === "today"
        ? "We have assigned this to the right owner and will share the next update today."
        : "It is in our active queue, and we will follow up with progress in the next business cycle.";

  return `${greeting}\n\n${acknowledgement} ${nextStep}\n\nBest,\nSupport Team`;
}

function buildTicketRecommendation(args: {
  ticket: ServiceAgentTicketInput;
  now: Date;
}): ServiceAgentRecommendation {
  const { ticket, now } = args;
  let score = 25;
  const evidence: string[] = [];

  if (ticket.priority === "urgent") {
    score += riskSignalWeights.urgentPriority;
    evidence.push("Priority is urgent");
  } else if (ticket.priority === "high") {
    score += riskSignalWeights.highPriority;
    evidence.push("Priority is high");
  }

  if (ticket.status === "waiting") {
    score += riskSignalWeights.waitingStatus;
    evidence.push("Ticket is waiting on follow-up");
  }

  if (ticket.dueDate) {
    const dueInHours = hoursUntil(ticket.dueDate, now);
    if (dueInHours < 0) {
      score += riskSignalWeights.overdueSla;
      evidence.push("SLA due date is overdue");
    } else if (dueInHours <= 4) {
      score += riskSignalWeights.nearDueSla;
      evidence.push("SLA due date is within 4 hours");
    }
  }

  if (!ticket.firstResponseAt) {
    score += riskSignalWeights.noFirstResponse;
    evidence.push("No first response recorded");
  }

  if (!ticket.assignee?.id) {
    score += riskSignalWeights.unassigned;
    evidence.push("No assignee");
  }

  const ageHours = hoursSince(ticket.createdAt, now);
  if (ageHours > 48) {
    score += riskSignalWeights.staleAgeHours;
    evidence.push(`Ticket age ${Math.round(ageHours)} hours`);
  }

  const normalized = clamp(Math.round(score), 25, 98);
  const triage: ServiceAgentRecommendation["triage"] =
    normalized >= 75 ? "immediate" : normalized >= 55 ? "today" : "monitor";
  const recommendationPriority: ServiceAgentRecommendation["priority"] =
    normalized >= 75 ? "high" : normalized >= 55 ? "medium" : "low";
  const confidence = clamp(Math.round(55 + normalized * 0.4), 52, 95);
  const assigneeName = ticket.assignee?.name || "service queue owner";

  return {
    id: `service-rec-${ticket.id}`,
    ticketId: ticket.id,
    priority: recommendationPriority,
    title: `Triage ticket: ${ticket.subject}`,
    triage,
    action:
      triage === "immediate"
        ? `Escalate to ${assigneeName} now, set next update SLA to 2 hours, and monitor until customer confirmation.`
        : triage === "today"
          ? `Assign to ${assigneeName}, send status update today, and confirm next troubleshooting step.`
          : `Keep in active queue, monitor for new customer signals, and revisit prioritization in next queue sweep.`,
    rationale: `Risk score ${normalized} based on priority, SLA timing, response latency, ownership, and ticket age.`,
    confidence,
    evidence,
    suggestedReply: createReplyTemplate({ ticket, triage }),
  };
}

function scoreOverallConfidence(recommendations: ServiceAgentRecommendation[]) {
  if (recommendations.length === 0) return 55;
  const average =
    recommendations.reduce((sum, item) => sum + item.confidence, 0) /
    recommendations.length;
  return Math.round(clamp(average, 55, 93));
}

export function buildServiceAgentInsights(args: {
  query?: string;
  maxRecommendations?: number;
  tickets: ServiceAgentTicketInput[];
  now?: Date;
}): ServiceAgentResponse {
  const payload = serviceAgentRequestSchema.parse({
    query: args.query,
    maxRecommendations: args.maxRecommendations,
  });
  const now = args.now || new Date();

  const openTickets = args.tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress" || ticket.status === "waiting"
  );

  const recommendations = openTickets
    .map((ticket) => buildTicketRecommendation({ ticket, now }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, payload.maxRecommendations);

  const queueHealth = {
    immediate: recommendations.filter((item) => item.triage === "immediate").length,
    today: recommendations.filter((item) => item.triage === "today").length,
    monitor: recommendations.filter((item) => item.triage === "monitor").length,
  };

  return {
    generatedAt: now.toISOString(),
    query: payload.query || "service agent default analysis",
    confidence: scoreOverallConfidence(recommendations),
    summary: {
      openTickets: openTickets.length,
      urgentTickets: openTickets.filter((ticket) => ticket.priority === "urgent").length,
      overdueTickets: openTickets.filter((ticket) => ticket.dueDate && ticket.dueDate.getTime() < now.getTime())
        .length,
      unassignedTickets: openTickets.filter((ticket) => !ticket.assignee?.id).length,
    },
    recommendations,
    explainability: {
      riskSignalWeights,
      queueHealth,
    },
  };
}
