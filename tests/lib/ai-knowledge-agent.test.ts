import { describe, expect, it } from "vitest";
import { buildKnowledgeAgentAnswer } from "@/lib/ai/knowledge-agent";

describe("ai knowledge agent", () => {
  it("returns grounded citations for matching query", () => {
    const result = buildKnowledgeAgentAnswer({
      query: "ticket routing and sla",
      maxCitations: 3,
      articles: [
        {
          id: "kb-1",
          title: "Configure ticket routing rules",
          slug: "configure-ticket-routing-rules",
          excerpt: "Define business-hours assignment and fallback owners.",
          contentHtml: "Routing rules can prioritize urgent tickets and channel-specific queues.",
          tags: ["routing", "tickets"],
          category: { name: "Service Hub", slug: "service-hub" },
          viewCount: 120,
          helpfulCount: 20,
          publishedAt: new Date("2026-02-10T00:00:00.000Z"),
        },
      ],
    });

    expect(result.citations.length).toBe(1);
    expect(result.safety.hasSufficientContext).toBe(true);
    expect(result.confidence).toBeGreaterThan(40);
  });

  it("returns safe fallback when no context is found", () => {
    const result = buildKnowledgeAgentAnswer({
      query: "deep hardware architecture",
      articles: [],
    });

    expect(result.citations.length).toBe(0);
    expect(result.safety.grounded).toBe(false);
    expect(result.answer).toContain("could not find enough grounded");
  });
});
