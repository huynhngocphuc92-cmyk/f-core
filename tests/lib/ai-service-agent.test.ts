import { describe, expect, it } from "vitest";
import { buildServiceAgentInsights } from "@/lib/ai/service-agent";

describe("ai service agent", () => {
  it("returns triage recommendations with suggested replies", () => {
    const now = new Date("2026-02-15T12:00:00.000Z");
    const result = buildServiceAgentInsights({
      query: "What should support team handle first?",
      maxRecommendations: 2,
      now,
      tickets: [
        {
          id: "t-1",
          subject: "Production checkout broken",
          description: "Payment fails for all users",
          status: "open",
          priority: "urgent",
          source: "web",
          category: "bug",
          createdAt: new Date("2026-02-13T08:00:00.000Z"),
          updatedAt: new Date("2026-02-15T11:00:00.000Z"),
          dueDate: new Date("2026-02-15T10:00:00.000Z"),
          firstResponseAt: null,
          assignee: null,
          contact: { firstName: "Alex", lastName: "Nguyen" },
        },
      ],
    });

    expect(result.recommendations.length).toBe(1);
    expect(result.recommendations[0].triage).toBe("immediate");
    expect(result.recommendations[0].suggestedReply).toContain("Hi Alex Nguyen");
    expect(result.confidence).toBeGreaterThan(0);
  });
});
