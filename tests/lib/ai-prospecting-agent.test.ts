import { describe, expect, it } from "vitest";
import { buildProspectingAgentInsights } from "@/lib/ai/prospecting-agent";

describe("ai prospecting agent", () => {
  it("builds prospecting recommendations from inactivity and stall signals", () => {
    const now = new Date("2026-02-16T12:00:00.000Z");

    const result = buildProspectingAgentInsights({
      query: "who should we prioritize",
      segment: "all",
      lookbackDays: 30,
      maxRecommendations: 4,
      now,
      contacts: [
        {
          id: "contact-1",
          name: "Taylor Lead",
          email: "taylor@example.com",
          lifecycleStage: "lead",
          lastActivityAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "contact-2",
          name: "Jordan Customer",
          email: "jordan@example.com",
          lifecycleStage: "customer",
          lastActivityAt: new Date("2025-12-20T00:00:00.000Z"),
        },
      ],
      deals: [
        {
          id: "deal-1",
          name: "Enterprise Renewal",
          amount: 60000,
          probability: 45,
          closeDate: new Date("2026-03-30T00:00:00.000Z"),
          lastActivityAt: new Date("2026-01-10T00:00:00.000Z"),
          contactIds: ["contact-1"],
        },
      ],
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.summary.untouchedNewLeads).toBeGreaterThan(0);
    expect(result.summary.stalledDeals).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
