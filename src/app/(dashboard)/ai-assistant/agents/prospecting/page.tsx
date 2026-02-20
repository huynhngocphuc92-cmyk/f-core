"use client";

import { useState } from "react";
import { Bot, Target, Users, Handshake } from "lucide-react";

type ProspectingAgentResult = {
  generatedAt: string;
  query: string;
  confidence: number;
  summary: {
    contactsScanned: number;
    dealsScanned: number;
    untouchedNewLeads: number;
    stalledDeals: number;
    inactiveContacts: number;
  };
  recommendations: Array<{
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    action: string;
    rationale: string;
    confidence: number;
    evidence: string[];
    relatedContactIds: string[];
    relatedDealIds: string[];
  }>;
};

export default function AIProspectingAgentPage() {
  const [query, setQuery] = useState("Which prospects should reps prioritize this week?");
  const [segment, setSegment] = useState<
    "all" | "new_leads" | "stalled_deals" | "inactive_contacts"
  >("all");
  const [lookbackDays, setLookbackDays] = useState(30);
  const [maxRecommendations, setMaxRecommendations] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProspectingAgentResult | null>(null);

  async function runAgent() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/agents/prospecting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          segment,
          lookbackDays,
          maxRecommendations,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run prospecting agent");

      setResult(body.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run prospecting agent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Prospecting Agent</h1>
        <p className="mt-1 text-gray-600">
          Prioritize outreach opportunities from lead inactivity, stalled deals, and engagement signals.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Run Prospecting Agent</p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={segment}
            onChange={(event) =>
              setSegment(
                event.target.value as
                  | "all"
                  | "new_leads"
                  | "stalled_deals"
                  | "inactive_contacts"
              )
            }
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="all">All Segments</option>
            <option value="new_leads">New Leads</option>
            <option value="stalled_deals">Stalled Deals</option>
            <option value="inactive_contacts">Inactive Contacts</option>
          </select>

          <input
            type="number"
            min={7}
            max={180}
            value={lookbackDays}
            onChange={(event) => setLookbackDays(Number(event.target.value) || 30)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="lookback days"
          />

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
          placeholder="Ask prospecting agent..."
        />
      </div>

      {result ? (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Agent Confidence</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.confidence}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Untouched Leads</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.untouchedNewLeads}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Stalled Deals</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.stalledDeals}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Inactive Contacts</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.summary.inactiveContacts}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Prioritized Actions</p>
            </div>

            <div className="space-y-3">
              {result.recommendations.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-gray-700">{item.action}</p>
                  <p className="mt-1 text-xs text-gray-500">Why: {item.rationale}</p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      contacts: {item.relatedContactIds.length}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Handshake className="h-3.5 w-3.5" />
                      deals: {item.relatedDealIds.length}
                    </span>
                  </div>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                    {item.evidence.map((evidence, index) => (
                      <li key={`${item.id}-ev-${index}`}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
