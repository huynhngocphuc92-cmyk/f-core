import { describe, expect, it } from "vitest";
import {
  detectCallRiskSignals,
  extractTranscriptHighlights,
  summarizeSalesCalls,
} from "@/lib/sales-call-intelligence";

describe("sales call intelligence helpers", () => {
  it("extracts transcript highlights", () => {
    const highlights = extractTranscriptHighlights(
      "We reviewed onboarding timeline and security requirements. Budget approval depends on Q2 planning. Next step is procurement alignment."
    );
    expect(highlights.length).toBeGreaterThan(0);
  });

  it("detects risk signals", () => {
    const risks = detectCallRiskSignals(
      "Customer raised budget concerns and asked about security review and legal process."
    );
    expect(risks.length).toBeGreaterThan(0);
  });

  it("summarizes call metrics", () => {
    const summary = summarizeSalesCalls([
      { metadata: { salesCallIntelligence: true, sentimentScore: 0.2, riskSignals: ["A"] } },
      { metadata: { salesCallIntelligence: true, sentimentScore: -0.1, riskSignals: [] } },
    ]);

    expect(summary.totalCalls).toBe(2);
    expect(summary.highRiskCalls).toBe(1);
    expect(summary.avgSentiment).toBe(0.05);
  });
});
