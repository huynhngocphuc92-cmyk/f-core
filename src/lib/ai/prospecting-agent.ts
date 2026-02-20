import { z } from "zod";

export const prospectingAgentRequestSchema = z.object({
  query: z.string().max(2000).optional(),
  maxRecommendations: z.number().int().min(1).max(10).default(5),
  segment: z
    .enum(["all", "new_leads", "stalled_deals", "inactive_contacts"])
    .default("all"),
  lookbackDays: z.number().int().min(7).max(180).default(30),
});

export type ProspectingAgentRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  action: string;
  rationale: string;
  confidence: number;
  evidence: string[];
  relatedContactIds: string[];
  relatedDealIds: string[];
};

export type ProspectingAgentResponse = {
  generatedAt: string;
  query: string;
  confidence: number;
  summary: {
    contactsScanned: number;
    dealsScanned: number;
    untouchedNewLeads: number;
    stalledDeals: number;
    inactiveContacts: number;
  };
  recommendations: ProspectingAgentRecommendation[];
};

type ProspectingContact = {
  id: string;
  name: string;
  email: string | null;
  lifecycleStage: string | null;
  lastActivityAt: Date | null;
};

type ProspectingDeal = {
  id: string;
  name: string;
  amount: number;
  probability: number | null;
  closeDate: Date | null;
  lastActivityAt: Date | null;
  contactIds: string[];
};

function daysSince(date: Date | null, now: Date) {
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function buildProspectingAgentInsights(args: {
  query?: string;
  maxRecommendations?: number;
  segment?: "all" | "new_leads" | "stalled_deals" | "inactive_contacts";
  lookbackDays?: number;
  contacts: ProspectingContact[];
  deals: ProspectingDeal[];
  now?: Date;
}): ProspectingAgentResponse {
  const payload = prospectingAgentRequestSchema.parse({
    query: args.query,
    maxRecommendations: args.maxRecommendations,
    segment: args.segment,
    lookbackDays: args.lookbackDays,
  });

  const now = args.now || new Date();

  const untouchedNewLeads = args.contacts.filter((contact) => {
    const lifecycle = (contact.lifecycleStage || "").toLowerCase();
    if (!["lead", "subscriber", "mql"].includes(lifecycle)) return false;
    return daysSince(contact.lastActivityAt, now) >= payload.lookbackDays;
  });

  const stalledDeals = args.deals.filter((deal) => {
    if ((deal.probability || 0) < 30) return false;
    const closeInFuture = !deal.closeDate || deal.closeDate.getTime() >= now.getTime();
    if (!closeInFuture) return false;
    return daysSince(deal.lastActivityAt, now) >= Math.min(21, payload.lookbackDays);
  });

  const inactiveContacts = args.contacts.filter((contact) => {
    const lifecycle = (contact.lifecycleStage || "").toLowerCase();
    if (!["customer", "opportunity", "sql"].includes(lifecycle)) return false;
    return daysSince(contact.lastActivityAt, now) >= payload.lookbackDays;
  });

  const recommendations: ProspectingAgentRecommendation[] = [];

  const includeNewLeads = payload.segment === "all" || payload.segment === "new_leads";
  if (includeNewLeads && untouchedNewLeads.length > 0) {
    const top = untouchedNewLeads.slice(0, 5);
    recommendations.push({
      id: "prospecting-new-leads",
      priority: "high",
      title: "Activate untouched new leads",
      action:
        "Launch a 3-step outreach sequence (email + call + social touch) within 48 hours and assign owners.",
      rationale: `${untouchedNewLeads.length} leads have no meaningful touch in the selected lookback window.`,
      confidence: clamp(70 + untouchedNewLeads.length * 2, 72, 92),
      evidence: top.map((item) => `${item.name} (${item.email || "no-email"})`),
      relatedContactIds: top.map((item) => item.id),
      relatedDealIds: [],
    });
  }

  const includeStalledDeals = payload.segment === "all" || payload.segment === "stalled_deals";
  if (includeStalledDeals && stalledDeals.length > 0) {
    const top = stalledDeals.slice(0, 5);
    recommendations.push({
      id: "prospecting-stalled-deals",
      priority: "high",
      title: "Recover stalled pipeline opportunities",
      action:
        "Run next-step alignment calls for stalled deals and refresh close-plan milestones with buyer champions.",
      rationale: `${stalledDeals.length} deals show healthy probability but stale engagement signals.`,
      confidence: clamp(68 + stalledDeals.length * 2, 70, 90),
      evidence: top.map((deal) => `${deal.name}: $${Math.round(deal.amount).toLocaleString()}`),
      relatedContactIds: top.flatMap((deal) => deal.contactIds).slice(0, 8),
      relatedDealIds: top.map((deal) => deal.id),
    });
  }

  const includeInactiveContacts =
    payload.segment === "all" || payload.segment === "inactive_contacts";
  if (includeInactiveContacts && inactiveContacts.length > 0) {
    const top = inactiveContacts.slice(0, 5);
    recommendations.push({
      id: "prospecting-inactive-contacts",
      priority: "medium",
      title: "Re-engage inactive high-value contacts",
      action:
        "Send value-recap content and schedule check-ins for inactive SQL/opportunity/customer contacts.",
      rationale: `${inactiveContacts.length} high-value contacts have gone quiet beyond the lookback threshold.`,
      confidence: clamp(62 + inactiveContacts.length * 2, 65, 86),
      evidence: top.map((item) => `${item.name} (${item.lifecycleStage || "unknown"})`),
      relatedContactIds: top.map((item) => item.id),
      relatedDealIds: [],
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "prospecting-maintain-cadence",
      priority: "low",
      title: "Maintain current prospecting cadence",
      action: "Keep current follow-up rhythm and monitor for engagement drop-offs weekly.",
      rationale: "No elevated inactivity or stall signals detected for the selected segment.",
      confidence: 66,
      evidence: [
        `contacts_scanned=${args.contacts.length}`,
        `deals_scanned=${args.deals.length}`,
      ],
      relatedContactIds: [],
      relatedDealIds: [],
    });
  }

  const trimmed = recommendations.slice(0, payload.maxRecommendations);
  const confidence = Math.round(trimmed.reduce((sum, item) => sum + item.confidence, 0) / trimmed.length);

  return {
    generatedAt: now.toISOString(),
    query: payload.query || "prospecting agent default analysis",
    confidence,
    summary: {
      contactsScanned: args.contacts.length,
      dealsScanned: args.deals.length,
      untouchedNewLeads: untouchedNewLeads.length,
      stalledDeals: stalledDeals.length,
      inactiveContacts: inactiveContacts.length,
    },
    recommendations: trimmed,
  };
}
