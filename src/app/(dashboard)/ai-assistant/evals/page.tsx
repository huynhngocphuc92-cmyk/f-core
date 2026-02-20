"use client";

import { useState } from "react";
import { Bot, Gauge, Timer } from "lucide-react";

type EvalResult = {
  generatedAt: string;
  thresholds: {
    minQuality: number;
    maxLatencyMs: number;
    maxCostUsd: number;
  };
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRatePct: number;
  averages: {
    qualityScore: number;
    latencyMs: number;
    estimatedCostUsd: number;
  };
  allPassed: boolean;
  scenarios: Array<{
    id: string;
    agent: "sales" | "service" | "knowledge";
    qualityScore: number;
    latencyMs: number;
    estimatedCostUsd: number;
    passed: boolean;
    reasons: string[];
  }>;
};

export default function AIEvalsPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvalResult | null>(null);

  async function runEvals() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/evals", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run AI evals");
      setResult(body.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run AI evals");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Eval Harness</h1>
        <p className="mt-1 text-gray-600">Quality, latency, and cost regression checks for core AI agent flows.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Run Benchmarks</p>
        </div>
        <button
          onClick={runEvals}
          disabled={busy}
          className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          {busy ? "Running..." : "Run AI Evals"}
        </button>
      </div>

      {result && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Pass Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.passRatePct}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Avg Quality</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.averages.qualityScore}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Avg Latency</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{result.averages.latencyMs}ms</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Avg Cost</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">${result.averages.estimatedCostUsd.toFixed(4)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Scenario Results</p>
            </div>
            <div className="space-y-3">
              {result.scenarios.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {item.agent} / {item.id}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.passed ? "pass" : "fail"}
                    </span>
                  </div>
                  <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-3">
                    <p>quality: {item.qualityScore}</p>
                    <p className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      latency: {item.latencyMs}ms
                    </p>
                    <p>cost: ${item.estimatedCostUsd.toFixed(6)}</p>
                  </div>
                  {item.reasons.length > 0 && (
                    <p className="mt-2 text-xs text-red-600">reasons: {item.reasons.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
