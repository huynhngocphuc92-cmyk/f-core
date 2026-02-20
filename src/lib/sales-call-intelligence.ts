import { z } from "zod";

export const createSalesCallSchema = z.object({
  subject: z.string().min(1).max(500),
  dealId: z.string().min(1).max(64).optional(),
  contactId: z.string().min(1).max(64).optional(),
  companyId: z.string().min(1).max(64).optional(),
  recordingUrl: z.string().url(),
  transcript: z.string().min(20).max(20000),
  durationSeconds: z.number().int().min(30).max(7200),
  sentimentScore: z.number().min(-1).max(1).optional(),
  actionItems: z.array(z.string().min(1).max(500)).max(20).optional(),
  occurredAt: z.string().datetime().optional(),
});

function cleanSentence(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function extractTranscriptHighlights(transcript: string, limit = 5): string[] {
  const chunks = transcript
    .split(/[.!?]+/)
    .map((item) => cleanSentence(item))
    .filter((item) => item.length >= 30);

  return chunks.slice(0, limit);
}

export function detectCallRiskSignals(transcript: string): string[] {
  const text = transcript.toLowerCase();
  const signals: string[] = [];

  const patterns = [
    { keyword: "budget", signal: "Budget concern mentioned" },
    { keyword: "competitor", signal: "Competitor comparison discussed" },
    { keyword: "legal", signal: "Legal/procurement risk surfaced" },
    { keyword: "security", signal: "Security review required" },
    { keyword: "delay", signal: "Timeline delay risk detected" },
  ];

  for (const rule of patterns) {
    if (text.includes(rule.keyword)) {
      signals.push(rule.signal);
    }
  }

  return signals;
}

export function summarizeSalesCalls(
  rows: Array<{
    metadata: unknown;
  }>
) {
  let totalCalls = 0;
  let highRiskCalls = 0;
  let sentimentCount = 0;
  let sentimentTotal = 0;

  for (const row of rows) {
    const metadata =
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};

    if (metadata.salesCallIntelligence !== true) continue;

    totalCalls += 1;

    if (Array.isArray(metadata.riskSignals) && metadata.riskSignals.length > 0) {
      highRiskCalls += 1;
    }

    if (typeof metadata.sentimentScore === "number") {
      sentimentTotal += metadata.sentimentScore;
      sentimentCount += 1;
    }
  }

  return {
    totalCalls,
    highRiskCalls,
    avgSentiment: sentimentCount > 0 ? Number((sentimentTotal / sentimentCount).toFixed(2)) : 0,
  };
}
