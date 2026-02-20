export type SalesCoachingDeal = {
  id: string;
  name: string;
  amount: number;
  probability: number | null;
  closeDate: Date | null;
  stageName: string | null;
  closedReason: string | null;
};

export type SalesCoachingCall = {
  dealId: string | null;
  createdAt: Date;
  sentimentScore: number | null;
  riskSignals: string[];
};

export type SalesCoachingInsight = {
  dealId: string;
  dealName: string;
  amount: number;
  stageName: string | null;
  healthScore: number;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  recommendations: string[];
  callCount: number;
  avgSentiment: number | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function daysBetween(dateA: Date, dateB: Date) {
  const diffMs = dateA.getTime() - dateB.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function buildSalesCoachingInsights(args: {
  deals: SalesCoachingDeal[];
  calls: SalesCoachingCall[];
  now?: Date;
}): SalesCoachingInsight[] {
  const now = args.now ?? new Date();

  return args.deals
    .filter((deal) => deal.closedReason !== "won" && deal.closedReason !== "lost")
    .map((deal) => {
      let score = 100;
      const reasons: string[] = [];
      const recommendations: string[] = [];

      const dealCalls = args.calls.filter((call) => call.dealId === deal.id);
      const latestCall = dealCalls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null;
      const avgSentiment =
        dealCalls.length > 0
          ? dealCalls
              .filter((call) => typeof call.sentimentScore === "number")
              .reduce((sum, call, _, arr) => sum + Number(call.sentimentScore || 0) / arr.length, 0)
          : null;

      const probability = deal.probability ?? 50;
      if (probability < 40) {
        score -= 20;
        reasons.push("Low stage probability");
        recommendations.push("Run qualification checkpoint and update close plan.");
      }

      if (deal.closeDate && daysBetween(deal.closeDate, now) < 0) {
        score -= 20;
        reasons.push("Close date is overdue");
        recommendations.push("Re-align decision timeline with buyer stakeholders.");
      }

      if (!latestCall || daysBetween(now, latestCall.createdAt) > 14) {
        score -= 15;
        reasons.push("No recent call activity");
        recommendations.push("Schedule an executive follow-up call within 48 hours.");
      }

      const riskSignalCount = dealCalls.reduce((sum, call) => sum + call.riskSignals.length, 0);
      if (riskSignalCount > 0) {
        score -= Math.min(20, riskSignalCount * 5);
        reasons.push("Risk signals detected in call transcripts");
        recommendations.push("Address budget/security/procurement blockers with a mitigation plan.");
      }

      if (typeof avgSentiment === "number" && avgSentiment < 0) {
        score -= 15;
        reasons.push("Negative buyer sentiment trend");
        recommendations.push("Escalate with value recap and executive sponsor support.");
      }

      if (reasons.length === 0) {
        recommendations.push("Maintain momentum and confirm mutual close actions.");
      }

      const healthScore = clamp(Math.round(score), 0, 100);
      const riskLevel: SalesCoachingInsight["riskLevel"] =
        healthScore < 50 ? "high" : healthScore < 75 ? "medium" : "low";

      return {
        dealId: deal.id,
        dealName: deal.name,
        amount: deal.amount,
        stageName: deal.stageName,
        healthScore,
        riskLevel,
        reasons,
        recommendations,
        callCount: dealCalls.length,
        avgSentiment: typeof avgSentiment === "number" ? Number(avgSentiment.toFixed(2)) : null,
      };
    })
    .sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return b.amount - a.amount;
    });
}
