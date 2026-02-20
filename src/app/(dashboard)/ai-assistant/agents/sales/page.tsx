"use client";

import { useState } from "react";
import { Bot, Gauge, Lightbulb } from "lucide-react";

type SalesAgentResult = {
  generatedAt: string;
  query: string;
  confidence: number;
  summary: {
    weightedPipeline: number;
    trendGrowthPct: number;
    highRiskDeals: number;
    totalDealsInCoachingScope: number;
  };
  recommendations: Array<{
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    action: string;
    rationale: string;
    confidence: number;
    evidence: string[];
    relatedDealIds: string[];
  }>;
  explainability: {
    forecast: {
      confidencePct: number;
      openDealAmount: number;
      weightedPipeline: number;
      trendGrowthPct: number;
    };
    coaching: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
  };
};

export default function AISalesAgentPage() {
  const [query, setQuery] = useState("What should the sales team focus on this quarter?");
  const [period, setPeriod] = useState<"month" | "quarter">("quarter");
  const [maxRecommendations, setMaxRecommendations] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SalesAgentResult | null>(null);

  async function runAgent() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/agents/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          period,
          maxRecommendations,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run sales agent");

      setResult(body.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run sales agent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Sales Agent</h1>
        <p className="mt-1 text-gray-600">
          Deal coaching and forecast insights with actionable, explainable recommendations.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Run Sales Agent</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as "month" | "quarter")}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="quarter">Quarter</option>
            <option value="month">Month</option>
          </select>

          <input
            type="number"
            min={1}
            max={10}
            value={maxRecommendations}
            onChange={(event) => setMaxRecommendations(Number(event.target.value) || 1)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="max recommendations"
          />

          <button
            onClick={runAgent}
            disabled={busy || !query.trim()}
            className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            {busy ? "Analyzing..." : "Run"}
          </button>
        </div>

        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-3 h-24 w-full rounded-lg border border-gray-200 p-3 text-sm"
          placeholder="Ask sales agent..."
        />
      </div>

      {result && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Agent Confidence</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.confidence}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Weighted Pipeline</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round(result.summary.weightedPipeline)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Trend Growth</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.trendGrowthPct}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">High Risk Deals</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.highRiskDeals}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Recommended Actions</p>
            </div>

            <div className="space-y-3">
              {result.recommendations.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-gray-700">{item.action}</p>
                  <p className="mt-1 text-xs text-gray-500">Why: {item.rationale}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                    {item.evidence.map((evidence, index) => (
                      <li key={`${item.id}-ev-${index}`}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Explainability Snapshot</p>
            </div>
            <pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
              {JSON.stringify(result.explainability, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
