"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleX, ShieldCheck } from "lucide-react";

type Gate = {
  id: "unit_tests" | "build" | "security_regression" | "ai_evals" | "e2e_critical";
  name: string;
  command: string;
  required: boolean;
  enabled: boolean;
};

type Result = {
  id: string;
  createdAt: string;
  releaseTag?: string;
  branch?: string;
  actor?: string;
  status: "ready" | "blocked";
  summary: {
    requiredGateCount: number;
    requiredPassCount: number;
    requiredFailCount: number;
    scorePct: number;
  };
  gates: Array<{
    id: Gate["id"];
    name: string;
    command: string;
    required: boolean;
    enabled: boolean;
    status: "pass" | "fail" | "skipped" | "missing";
    durationMs: number;
    notes?: string;
  }>;
  blockers: Array<{
    gateId: Gate["id"];
    reason: "failed" | "missing";
  }>;
};

export default function QAReleaseReadinessPage() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [latest, setLatest] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/release-readiness/checklist");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load release checklist");
      setGates(body.data || []);
      setLatest(body.latestResult || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load release checklist");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateGate(id: Gate["id"], key: "required" | "enabled", value: boolean) {
    setGates((prev) => prev.map((gate) => (gate.id === id ? { ...gate, [key]: value } : gate)));
  }

  async function saveChecklist() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/release-readiness/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gates: gates.map((gate) => ({
            id: gate.id,
            required: gate.required,
            enabled: gate.enabled,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save release checklist");
      setGates(body.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save release checklist");
    } finally {
      setSaving(false);
    }
  }

  async function runEvaluation() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/release-readiness/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseTag: "v1.0.0-rc",
          branch: "main",
          actor: "qa-bot",
          persist: true,
          observations: gates
            .filter((gate) => gate.enabled)
            .map((gate, index) => ({
              gateId: gate.id,
              status: gate.id === "e2e_critical" && index % 2 === 0 ? "skipped" : "pass",
              durationMs: 800 + index * 170,
              notes: `Executed ${gate.command}`,
            })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to evaluate release readiness");
      setLatest(body.result || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to evaluate release readiness");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Release Readiness</h1>
        <p className="mt-1 text-gray-600">Automate quality and security gates before promotion to production.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Checklist Policy</p>
        </div>

        {busy ? (
          <p className="text-sm text-gray-500">Loading checklist...</p>
        ) : (
          <div className="space-y-3">
            {gates.map((gate) => (
              <div key={gate.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{gate.name}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      <code>{gate.command}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={gate.required}
                        disabled={!gate.enabled}
                        onChange={(event) => updateGate(gate.id, "required", event.target.checked)}
                      />
                      required
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={gate.enabled}
                        onChange={(event) => updateGate(gate.id, "enabled", event.target.checked)}
                      />
                      enabled
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={saveChecklist}
            disabled={busy || saving}
            className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Checklist"}
          </button>
          <button
            onClick={runEvaluation}
            disabled={busy || saving}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Run Readiness Check
          </button>
        </div>
      </div>

      {latest && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Latest Result</p>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <p>
              status:{" "}
              <span className={latest.status === "ready" ? "text-emerald-700" : "text-red-700"}>{latest.status}</span>
            </p>
            <p>required gates: {latest.summary.requiredGateCount}</p>
            <p>passed: {latest.summary.requiredPassCount}</p>
            <p>score: {latest.summary.scorePct}%</p>
          </div>
          <div className="space-y-2">
            {latest.gates.map((gate) => (
              <div key={gate.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{gate.name}</p>
                  <span className="inline-flex items-center gap-1 text-xs">
                    {gate.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <CircleX className="h-4 w-4 text-red-700" />
                    )}
                    {gate.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  duration: {gate.durationMs}ms • required: {gate.required ? "yes" : "no"} • <code>{gate.command}</code>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
