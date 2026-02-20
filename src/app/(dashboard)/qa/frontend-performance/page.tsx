"use client";

import { useEffect, useState } from "react";
import { Gauge, Sparkles, TriangleAlert } from "lucide-react";

type Threshold = {
  id: string;
  route: string;
  maxLcpMs: number;
  maxInpMs: number;
  maxCls: number;
  maxJsKb: number;
  enabled: boolean;
};

type Evaluation = {
  id: string;
  createdAt: string;
  summary: {
    checkedRoutes: number;
    breachedRoutes: number;
    passRatePct: number;
  };
  alerts: Array<{
    id: string;
    route: string;
    reason: "lcp" | "inp" | "cls" | "js";
    severity: "warning" | "critical";
    observed: { lcpMs: number; inpMs: number; cls: number; jsKb: number };
    threshold: { maxLcpMs: number; maxInpMs: number; maxCls: number; maxJsKb: number };
  }>;
};

const sampleSnapshots = [
  { route: "/dashboard", lcpMs: 2450, inpMs: 180, cls: 0.08, jsKb: 390 },
  { route: "/deals", lcpMs: 2710, inpMs: 235, cls: 0.12, jsKb: 470 },
  { route: "/tickets", lcpMs: 2480, inpMs: 210, cls: 0.07, jsKb: 420 },
  { route: "/ai-assistant", lcpMs: 3050, inpMs: 285, cls: 0.13, jsKb: 540 },
];

export default function QAFrontendPerformancePage() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [latest, setLatest] = useState<Evaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/frontend-performance/thresholds");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load frontend thresholds");
      setThresholds(body.data || []);
      setLatest(body.latestEvaluation || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load frontend thresholds");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateThreshold(
    id: string,
    key: "maxLcpMs" | "maxInpMs" | "maxCls" | "maxJsKb",
    value: number
  ) {
    setThresholds((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateEnabled(id: string, enabled: boolean) {
    setThresholds((prev) => prev.map((item) => (item.id === id ? { ...item, enabled } : item)));
  }

  async function saveThresholds() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/frontend-performance/thresholds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thresholds: thresholds.map((item) => ({
            route: item.route,
            maxLcpMs: item.maxLcpMs,
            maxInpMs: item.maxInpMs,
            maxCls: item.maxCls,
            maxJsKb: item.maxJsKb,
            enabled: item.enabled,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save thresholds");
      setThresholds(body.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save thresholds");
    } finally {
      setSaving(false);
    }
  }

  async function runEvaluation() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/frontend-performance/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshots: sampleSnapshots,
          persist: true,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run frontend evaluation");
      setLatest(body.evaluation || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run frontend evaluation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Frontend Performance</h1>
        <p className="mt-1 text-gray-600">Route-level Lighthouse-aligned thresholds (LCP, INP, CLS, JS KB).</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Thresholds</p>
        </div>
        {busy ? (
          <p className="text-sm text-gray-500">Loading thresholds...</p>
        ) : (
          <div className="space-y-3">
            {thresholds.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{item.route}</p>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) => updateEnabled(item.id, event.target.checked)}
                    />
                    enabled
                  </label>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <input
                    type="number"
                    value={item.maxLcpMs}
                    min={500}
                    max={10000}
                    onChange={(event) => updateThreshold(item.id, "maxLcpMs", Number(event.target.value) || 0)}
                    className="h-9 rounded-lg border border-gray-200 px-3 text-sm"
                    placeholder="max LCP (ms)"
                  />
                  <input
                    type="number"
                    value={item.maxInpMs}
                    min={50}
                    max={2000}
                    onChange={(event) => updateThreshold(item.id, "maxInpMs", Number(event.target.value) || 0)}
                    className="h-9 rounded-lg border border-gray-200 px-3 text-sm"
                    placeholder="max INP (ms)"
                  />
                  <input
                    type="number"
                    value={item.maxCls}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(event) => updateThreshold(item.id, "maxCls", Number(event.target.value) || 0)}
                    className="h-9 rounded-lg border border-gray-200 px-3 text-sm"
                    placeholder="max CLS"
                  />
                  <input
                    type="number"
                    value={item.maxJsKb}
                    min={50}
                    max={5000}
                    onChange={(event) => updateThreshold(item.id, "maxJsKb", Number(event.target.value) || 0)}
                    className="h-9 rounded-lg border border-gray-200 px-3 text-sm"
                    placeholder="max JS (KB)"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={saveThresholds}
            disabled={saving || busy}
            className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Thresholds"}
          </button>
          <button
            onClick={runEvaluation}
            disabled={saving || busy}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Run Evaluation
          </button>
        </div>
      </div>

      {latest && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Latest Evaluation</p>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <p className="text-sm text-gray-700">checked: {latest.summary.checkedRoutes}</p>
            <p className="text-sm text-gray-700">breached: {latest.summary.breachedRoutes}</p>
            <p className="text-sm text-gray-700">pass rate: {latest.summary.passRatePct}%</p>
          </div>
          <div className="space-y-2">
            {latest.alerts.length === 0 && <p className="text-sm text-emerald-700">No alerts in latest run.</p>}
            {latest.alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-amber-700" />
                  <p className="text-sm font-medium text-amber-900">
                    {alert.route} - {alert.reason} ({alert.severity})
                  </p>
                </div>
                <p className="text-xs text-amber-800">
                  observed: LCP {alert.observed.lcpMs}ms, INP {alert.observed.inpMs}ms, CLS {alert.observed.cls}, JS{" "}
                  {alert.observed.jsKb}KB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
