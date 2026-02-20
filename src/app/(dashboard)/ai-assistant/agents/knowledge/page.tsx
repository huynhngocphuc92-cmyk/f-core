"use client";

import { useState } from "react";
import { Bot, ShieldCheck } from "lucide-react";

type KnowledgeAgentResult = {
  generatedAt: string;
  query: string;
  confidence: number;
  answer: string;
  citations: Array<{
    articleId: string;
    title: string;
    slug: string;
    relevance: number;
    snippet: string;
  }>;
  safety: {
    grounded: boolean;
    hasSufficientContext: boolean;
    missingTopics: string[];
  };
};

export default function AIKnowledgeAgentPage() {
  const [query, setQuery] = useState("How do we set up ticket routing and SLA policies?");
  const [maxCitations, setMaxCitations] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KnowledgeAgentResult | null>(null);

  async function runAgent() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/agents/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxCitations }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run knowledge agent");
      setResult(body.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run knowledge agent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Agent</h1>
        <p className="mt-1 text-gray-600">Grounded KB search and safe answers with citation evidence.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Run Knowledge Agent</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="number"
            min={1}
            max={8}
            value={maxCitations}
            onChange={(event) => setMaxCitations(Number(event.target.value) || 1)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="max citations"
          />
          <button
            onClick={runAgent}
            disabled={busy || query.trim().length < 3}
            className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            {busy ? "Searching..." : "Run"}
          </button>
        </div>

        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-3 h-24 w-full rounded-lg border border-gray-200 p-3 text-sm"
          placeholder="Ask knowledge agent..."
        />
      </div>

      {result && (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Answer</p>
            <p className="mt-2 text-sm text-gray-800">{result.answer}</p>
            <p className="mt-2 text-xs text-gray-500">Confidence: {result.confidence}%</p>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Citations</p>
            <div className="space-y-3">
              {result.citations.length === 0 && (
                <p className="text-sm text-gray-500">No citations found for this query.</p>
              )}
              {result.citations.map((item) => (
                <div key={item.articleId} className="rounded-lg border border-gray-100 p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      relevance {item.relevance}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">/knowledge-base/{item.slug}</p>
                  <p className="mt-2 text-sm text-gray-700">{item.snippet}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Grounding Safety</p>
            </div>
            <pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
              {JSON.stringify(result.safety, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
