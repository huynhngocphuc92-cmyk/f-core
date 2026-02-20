type JsonObject = Record<string, unknown>;

export type SurveySentEvent = {
  ticketId: string;
  contactId: string | null;
  sentAt: string;
};

export type SurveyResponseEvent = {
  ticketId: string;
  contactId: string | null;
  csatScore: number;
  npsScore: number | null;
  feedback: string | null;
  respondedAt: string;
};

export type SurveySummary = {
  sentCount: number;
  responseCount: number;
  responseRatePct: number;
  csatAverage: number | null;
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
};

function asJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as JsonObject;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function clampScore(value: number, min: number, max: number): number | null {
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

export function parseSurveySentEvent(activity: {
  contactId: string | null;
  createdAt: Date;
  metadata: unknown;
}): SurveySentEvent | null {
  const metadata = asJsonObject(activity.metadata);
  if (metadata.source !== "service_survey" || metadata.status !== "sent") return null;

  const ticketId = typeof metadata.ticketId === "string" ? metadata.ticketId : null;
  if (!ticketId) return null;

  return {
    ticketId,
    contactId: activity.contactId,
    sentAt: activity.createdAt.toISOString(),
  };
}

export function parseSurveyResponseEvent(activity: {
  contactId: string | null;
  createdAt: Date;
  body: string | null;
  metadata: unknown;
}): SurveyResponseEvent | null {
  const metadata = asJsonObject(activity.metadata);
  if (metadata.source !== "service_survey" || metadata.status !== "responded") return null;

  const ticketId = typeof metadata.ticketId === "string" ? metadata.ticketId : null;
  const csatRaw = toNumber(metadata.csatScore);
  const npsRaw = toNumber(metadata.npsScore);
  const csatScore = csatRaw === null ? null : clampScore(csatRaw, 1, 5);
  const npsScore = npsRaw === null ? null : clampScore(npsRaw, 0, 10);

  if (!ticketId || csatScore === null) return null;

  return {
    ticketId,
    contactId: activity.contactId,
    csatScore,
    npsScore,
    feedback: typeof metadata.feedback === "string" ? metadata.feedback : activity.body,
    respondedAt: activity.createdAt.toISOString(),
  };
}

export function hasSurveyBeenSentForTicket(
  activities: Array<{ metadata: unknown }>,
  ticketId: string
): boolean {
  return activities.some((activity) => {
    const metadata = asJsonObject(activity.metadata);
    return (
      metadata.source === "service_survey" &&
      metadata.status === "sent" &&
      metadata.ticketId === ticketId
    );
  });
}

export function hasSurveyResponseForTicket(
  activities: Array<{ metadata: unknown }>,
  ticketId: string
): boolean {
  return activities.some((activity) => {
    const metadata = asJsonObject(activity.metadata);
    return (
      metadata.source === "service_survey" &&
      metadata.status === "responded" &&
      metadata.ticketId === ticketId
    );
  });
}

export function buildSurveySummary(input: {
  sentEvents: SurveySentEvent[];
  responseEvents: SurveyResponseEvent[];
}): SurveySummary {
  const sentCount = input.sentEvents.length;
  const responseCount = input.responseEvents.length;
  const csatTotal = input.responseEvents.reduce((sum, item) => sum + item.csatScore, 0);
  const csatAverage = responseCount > 0 ? Number((csatTotal / responseCount).toFixed(2)) : null;

  const npsResponses = input.responseEvents.filter((item) => item.npsScore !== null);
  const promoters = npsResponses.filter((item) => (item.npsScore ?? 0) >= 9).length;
  const detractors = npsResponses.filter((item) => (item.npsScore ?? 0) <= 6).length;
  const passives = npsResponses.length - promoters - detractors;
  const npsScore =
    npsResponses.length > 0
      ? Math.round(((promoters / npsResponses.length) * 100 - (detractors / npsResponses.length) * 100) * 10) /
        10
      : null;

  return {
    sentCount,
    responseCount,
    responseRatePct: sentCount > 0 ? Number(((responseCount / sentCount) * 100).toFixed(1)) : 0,
    csatAverage,
    npsScore,
    promoters,
    passives,
    detractors,
  };
}
