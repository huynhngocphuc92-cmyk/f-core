import { describe, expect, it } from "vitest";
import {
  buildSurveySummary,
  hasSurveyBeenSentForTicket,
  parseSurveyResponseEvent,
  parseSurveySentEvent,
} from "@/lib/service-survey";

describe("service survey helpers", () => {
  it("parses sent and response events", () => {
    const sent = parseSurveySentEvent({
      contactId: "contact-1",
      createdAt: new Date("2026-02-14T10:00:00.000Z"),
      metadata: { source: "service_survey", status: "sent", ticketId: "ticket-1" },
    });

    const response = parseSurveyResponseEvent({
      contactId: "contact-1",
      createdAt: new Date("2026-02-14T12:00:00.000Z"),
      body: "Great support",
      metadata: {
        source: "service_survey",
        status: "responded",
        ticketId: "ticket-1",
        csatScore: 5,
        npsScore: 9,
      },
    });

    expect(sent?.ticketId).toBe("ticket-1");
    expect(response?.csatScore).toBe(5);
  });

  it("calculates csat and nps summary", () => {
    const summary = buildSurveySummary({
      sentEvents: [
        { ticketId: "t1", contactId: "c1", sentAt: "2026-02-14T10:00:00.000Z" },
        { ticketId: "t2", contactId: "c2", sentAt: "2026-02-14T10:00:00.000Z" },
      ],
      responseEvents: [
        {
          ticketId: "t1",
          contactId: "c1",
          csatScore: 5,
          npsScore: 10,
          feedback: null,
          respondedAt: "2026-02-14T11:00:00.000Z",
        },
      ],
    });

    expect(summary.responseRatePct).toBe(50);
    expect(summary.csatAverage).toBe(5);
    expect(summary.npsScore).toBe(100);
  });

  it("detects existing survey sent state for ticket", () => {
    const result = hasSurveyBeenSentForTicket(
      [{ metadata: { source: "service_survey", status: "sent", ticketId: "ticket-9" } }],
      "ticket-9"
    );

    expect(result).toBe(true);
  });
});
