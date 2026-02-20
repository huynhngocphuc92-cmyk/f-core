"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Gauge, Timer } from "lucide-react";

type Budget = {
  id: string;
  endpoint: string;
  maxP95LatencyMs: number;
  maxErrorRatePct: number;
  enabled: boolean;
};

type Evaluation = {
  id: string;
  createdAt: string;
  summary: {
    checkedEndpoints: number;
    breachedEndpoints: number;
    passRatePct: number;
  };
  alerts: Array<{
    id: string;
    endpoint: string;
    severity: "warning" | "critical";
    reason: "latency" | "error_rate";
    observed: { p95LatencyMs: number; errorRatePct: number; requestCount: number };
    budget: { maxP95LatencyMs: number; maxErrorRatePct: number };
  }>;
};

const sampleSnapshots = [
  { endpoint: "/api/ai/chat", requestCount: 220, p95LatencyMs: 2400, errorRatePct: 3.2 },
  { endpoint: "/api/contacts", requestCount: 980, p95LatencyMs: 380, errorRatePct: 0.4 },
  { endpoint: "/api/deals", requestCount: 760, p95LatencyMs: 610, errorRatePct: 1.2 },
  { endpoint: "/api/tickets", requestCount: 510, p95LatencyMs: 520, errorRatePct: 0.9 },
];

export default function QAPerformancePage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [latest, setLatest] = useState<Evaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/performance/budgets");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load performance budgets");

      setBudgets(body.data || []);
      setLatest(body.latestEvaluation || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load performance budgets");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function runEvaluation() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/performance/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshots: sampleSnapshots,
          persist: true,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to evaluate performance budgets");
      setLatest(body.evaluation || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to evaluate performance budgets");
    } finally {
      setSaving(false);
    }
  }

  async function saveBudgets() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        budgets: budgets.map((item) => ({
          endpoint: item.endpoint,
          maxP95LatencyMs: item.maxP95LatencyMs,
          maxErrorRatePct: item.maxErrorRatePct,
          enabled: item.enabled,
        })),
      };

      const response = await fetch("/api/qa/performance/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save budgets");
      setBudgets(body.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save budgets");
    } finally {
      setSaving(false);
    }
  }

  function updateBudgetValue(id: string, key: "maxP95LatencyMs" | "maxErrorRatePct", value: number) {
    setBudgets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: Number.isFinite(value) ? value : 0 } : item))
    );
  }

  function updateBudgetEnabled(id: string, enabled: boolean) {
    setBudgets((prev) => prev.map((item) => (item.id === id ? { ...item, enabled } : item)));
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Performance Budgets</h1>
        <p className="mt-1 text-gray-600">Track latency/error budgets and alert on P95 threshold breaches.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Budget Configuration</p>
        </div>

        {busy ? (
          <p className="text-sm text-gray-500">Loading budgets...</p>
        ) : (
          <div className="space-y-3">
            {budgets.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{item.endpoint}</p>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) => updateBudgetEnabled(item.id, event.target.checked)}
                    />
                    enabled
                  </label>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    type="number"
                    value={item.maxP95LatencyMs}
                    min={50}
                    max={10000}
                    onChange={(event) => updateBudgetValue(item.id, "maxP95LatencyMs", Number(event.target.value))}
                    className="h-9 rounded-lg border border-gray-200 px-3 text-sm"
                    placeholder="max p95 latency (ms)"
                  />
                  <input
                    type="number"
                    value={item.maxErrorRatePct}
                    min={0}
                    max={100}
                    step={0.1}
                    onChange={(event) => updateBudgetValue(item.id, "maxErrorRatePct", Number(event.target.value))}
                    className="h-9 rounded-lg border border-gray-200 px-3 text-sm"
                    placeholder="max error rate (%)"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={saveBudgets}
            disabled={saving || busy}
            className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Budgets"}
          </button>
          <button
            onClick={runEvaluation}
            disabled={saving || busy}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Run Evaluation
          </button>
        </div>
      </div>

      {latest && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Timer className="h-4 w-4 text-[#0891b2]" />
            <p className="text-sm font-semibold text-gray-900">Latest Evaluation</p>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <p className="text-sm text-gray-700">checked: {latest.summary.checkedEndpoints}</p>
            <p className="text-sm text-gray-700">breached: {latest.summary.breachedEndpoints}</p>
            <p className="text-sm text-gray-700">pass rate: {latest.summary.passRatePct}%</p>
          </div>

          <div className="space-y-2">
            {latest.alerts.length === 0 && (
              <p className="text-sm text-emerald-700">No budget alerts in latest run.</p>
            )}
            {latest.alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  <p className="text-sm font-medium text-amber-900">
                    {alert.endpoint} - {alert.reason} ({alert.severity})
                  </p>
                </div>
                <p className="text-xs text-amber-800">
                  observed p95={alert.observed.p95LatencyMs}ms (budget {alert.budget.maxP95LatencyMs}ms), errorRate=
                  {alert.observed.errorRatePct}% (budget {alert.budget.maxErrorRatePct}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
