"use client";

import { useState } from "react";
import { Bot, Gauge, MessageSquareText } from "lucide-react";

type ServiceAgentResult = {
  generatedAt: string;
  query: string;
  confidence: number;
  summary: {
    openTickets: number;
    urgentTickets: number;
    overdueTickets: number;
    unassignedTickets: number;
  };
  recommendations: Array<{
    id: string;
    ticketId: string;
    priority: "high" | "medium" | "low";
    title: string;
    triage: "immediate" | "today" | "monitor";
    action: string;
    rationale: string;
    confidence: number;
    evidence: string[];
    suggestedReply: string;
  }>;
  explainability: {
    riskSignalWeights: Record<string, number>;
    queueHealth: {
      immediate: number;
      today: number;
      monitor: number;
    };
  };
};

export default function AIServiceAgentPage() {
  const [query, setQuery] = useState("Which tickets should we triage first today?");
  const [maxRecommendations, setMaxRecommendations] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ServiceAgentResult | null>(null);

  async function runAgent() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/agents/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          maxRecommendations,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run service agent");
      setResult(body.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run service agent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Service Agent</h1>
        <p className="mt-1 text-gray-600">
          Ticket triage and suggested replies with confidence and risk-based explainability.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Run Service Agent</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
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
          placeholder="Ask service agent..."
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
              <p className="text-xs uppercase tracking-wide text-gray-500">Open Tickets</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.openTickets}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Urgent Tickets</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.urgentTickets}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Overdue Tickets</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.overdueTickets}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Triage + Suggested Replies</p>
            </div>

            <div className="space-y-4">
              {result.recommendations.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
                        {item.priority}
                      </span>
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs uppercase text-cyan-700">
                        {item.triage}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{item.action}</p>
                  <p className="mt-1 text-xs text-gray-500">Why: {item.rationale}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                    {item.evidence.map((evidence, index) => (
                      <li key={`${item.id}-ev-${index}`}>{evidence}</li>
                    ))}
                  </ul>
                  <pre className="mt-3 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                    {item.suggestedReply}
                  </pre>
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
