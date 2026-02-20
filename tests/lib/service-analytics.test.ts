import { describe, expect, it } from "vitest";
import { buildServiceAnalytics } from "@/lib/service-analytics";

describe("service analytics builder", () => {
  it("builds summary, buckets, and survey metrics", () => {
    const payload = buildServiceAnalytics({
      tickets: [
        {
          id: "t1",
          status: "resolved",
          priority: "high",
          source: "email",
          category: "support",
          createdAt: new Date("2026-02-14T08:00:00.000Z"),
          firstResponseAt: new Date("2026-02-14T08:30:00.000Z"),
          resolvedAt: new Date("2026-02-14T10:00:00.000Z"),
          assignee: { id: "u1", name: "Agent 1" },
        },
        {
          id: "t2",
          status: "open",
          priority: "medium",
          source: "chat",
          category: "bug",
          createdAt: new Date("2026-02-14T09:00:00.000Z"),
          firstResponseAt: null,
          resolvedAt: null,
          assignee: { id: "u1", name: "Agent 1" },
        },
      ],
      surveyActivities: [
        {
          contactId: "c1",
          body: null,
          metadata: { source: "service_survey", status: "sent", ticketId: "t1" },
          createdAt: new Date("2026-02-14T11:00:00.000Z"),
        },
        {
          contactId: "c1",
          body: "great",
          metadata: {
            source: "service_survey",
            status: "responded",
            ticketId: "t1",
            csatScore: 5,
            npsScore: 10,
          },
          createdAt: new Date("2026-02-14T11:30:00.000Z"),
        },
      ],
    });

    expect(payload.summary.totalTickets).toBe(2);
    expect(payload.summary.resolutionRatePct).toBe(50);
    expect(payload.summary.avgFirstResponseMinutes).toBe(30);
    expect(payload.summary.avgResolutionHours).toBe(2);
    expect(payload.byChannel[0].channel).toBe("email");
    expect(payload.topAssignees[0].total).toBe(2);
    expect(payload.surveys.csatAverage).toBe(5);
    expect(payload.surveys.npsScore).toBe(100);
  });
});
