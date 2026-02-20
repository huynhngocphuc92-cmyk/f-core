import {
  buildSurveySummary,
  parseSurveyResponseEvent,
  parseSurveySentEvent,
  type SurveyResponseEvent,
  type SurveySentEvent,
} from "@/lib/service-survey";

type ServiceTicketRecord = {
  id: string;
  status: string;
  priority: string;
  source: string | null;
  category: string | null;
  createdAt: Date;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  assignee: { id: string; name: string | null } | null;
};

type SurveyActivityRecord = {
  contactId: string | null;
  body: string | null;
  metadata: unknown;
  createdAt: Date;
};

export type ServiceAnalyticsSummary = {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  resolutionRatePct: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionHours: number | null;
};

export type ServiceAnalyticsPayload = {
  summary: ServiceAnalyticsSummary;
  byChannel: Array<{ channel: string; total: number }>;
  byPriority: Array<{ priority: string; total: number }>;
  byCategory: Array<{ category: string; total: number }>;
  topAssignees: Array<{ assigneeId: string; assigneeName: string; total: number }>;
  surveys: ReturnType<typeof buildSurveySummary>;
  recentSurveyResponses: SurveyResponseEvent[];
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number((values.reduce((sum, current) => sum + current, 0) / values.length).toFixed(2));
}

function bucketCounts(values: string[]): Array<{ key: string; total: number }> {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total);
}

export function buildServiceAnalytics(input: {
  tickets: ServiceTicketRecord[];
  surveyActivities: SurveyActivityRecord[];
  responseLimit?: number;
}): ServiceAnalyticsPayload {
  const { tickets, surveyActivities } = input;
  const responseLimit = input.responseLimit ?? 20;

  const openStatuses = new Set(["open", "in_progress", "waiting"]);
  const resolvedStatuses = new Set(["resolved", "closed"]);
  const openTickets = tickets.filter((ticket) => openStatuses.has(ticket.status)).length;
  const resolvedTickets = tickets.filter((ticket) => resolvedStatuses.has(ticket.status)).length;

  const firstResponseMinutes = tickets
    .filter((ticket) => ticket.firstResponseAt)
    .map((ticket) => {
      const diffMs = (ticket.firstResponseAt as Date).getTime() - ticket.createdAt.getTime();
      return diffMs / (1000 * 60);
    })
    .filter((value) => value >= 0);

  const resolutionHours = tickets
    .filter((ticket) => ticket.resolvedAt)
    .map((ticket) => {
      const diffMs = (ticket.resolvedAt as Date).getTime() - ticket.createdAt.getTime();
      return diffMs / (1000 * 60 * 60);
    })
    .filter((value) => value >= 0);

  const channelBuckets = bucketCounts(
    tickets.map((ticket) => (ticket.source || "unknown").toLowerCase())
  ).map((item) => ({ channel: item.key, total: item.total }));

  const priorityBuckets = bucketCounts(
    tickets.map((ticket) => (ticket.priority || "unknown").toLowerCase())
  ).map((item) => ({ priority: item.key, total: item.total }));

  const categoryBuckets = bucketCounts(
    tickets.map((ticket) => (ticket.category || "uncategorized").toLowerCase())
  ).map((item) => ({ category: item.key, total: item.total }));

  const assigneeBuckets = bucketCounts(
    tickets
      .filter((ticket) => ticket.assignee?.id)
      .map((ticket) => `${ticket.assignee?.id}|${ticket.assignee?.name || "Unassigned"}`)
  )
    .map((item) => {
      const [assigneeId, assigneeName] = item.key.split("|");
      return {
        assigneeId,
        assigneeName,
        total: item.total,
      };
    })
    .slice(0, 10);

  const surveySentEvents = surveyActivities
    .map((activity) => parseSurveySentEvent(activity))
    .filter((item): item is SurveySentEvent => item !== null);
  const surveyResponseEvents = surveyActivities
    .map((activity) => parseSurveyResponseEvent(activity))
    .filter((item): item is SurveyResponseEvent => item !== null)
    .sort((a, b) => new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime());

  return {
    summary: {
      totalTickets: tickets.length,
      openTickets,
      resolvedTickets,
      resolutionRatePct:
        tickets.length > 0 ? Number(((resolvedTickets / tickets.length) * 100).toFixed(1)) : 0,
      avgFirstResponseMinutes: average(firstResponseMinutes),
      avgResolutionHours: average(resolutionHours),
    },
    byChannel: channelBuckets,
    byPriority: priorityBuckets,
    byCategory: categoryBuckets,
    topAssignees: assigneeBuckets,
    surveys: buildSurveySummary({
      sentEvents: surveySentEvents,
      responseEvents: surveyResponseEvents,
    }),
    recentSurveyResponses: surveyResponseEvents.slice(0, responseLimit),
  };
}
