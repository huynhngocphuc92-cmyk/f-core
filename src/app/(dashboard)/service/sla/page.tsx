"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Gauge, Save } from "lucide-react";
import type { SlaPolicy } from "@/lib/sla-policy-store";

type SlaSummary = {
  openTickets: number;
  breachedTickets: number;
  atRiskTickets: number;
  firstResponseBreaches: number;
  resolutionBreaches: number;
  breachRatePct: number;
};

type SlaTicket = {
  id: string;
  subject: string;
  priority: string;
  status: string;
  sla: {
    breached: boolean;
    atRisk: boolean;
    resolution: { dueAt: string };
  };
  assignee: { id: string; name: string | null } | null;
};

const priorities: Array<keyof SlaPolicy> = ["urgent", "high", "medium", "low"];

const fallbackPolicy: SlaPolicy = {
  low: { firstResponseMinutes: 240, resolutionHours: 72 },
  medium: { firstResponseMinutes: 120, resolutionHours: 24 },
  high: { firstResponseMinutes: 60, resolutionHours: 8 },
  urgent: { firstResponseMinutes: 15, resolutionHours: 4 },
};

export default function ServiceSlaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningAlerts, setRunningAlerts] = useState(false);
  const [summary, setSummary] = useState<SlaSummary | null>(null);
  const [tickets, setTickets] = useState<SlaTicket[]>([]);
  const [policy, setPolicy] = useState<SlaPolicy>(fallbackPolicy);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [slaRes, policyRes] = await Promise.all([
        fetch("/api/service/sla?limit=25"),
        fetch("/api/service/sla/policies"),
      ]);
      const slaData = await slaRes.json();
      const policyData = await policyRes.json();

      setSummary(slaData.summary || null);
      setTickets(slaData.tickets || []);
      setPolicy(policyData.policy || fallbackPolicy);
    } catch {
      setError("Unable to load SLA data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const hasBreaches = useMemo(
    () => (summary?.breachedTickets || 0) > 0,
    [summary]
  );

  async function savePolicy() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/service/sla/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      await loadData();
    } catch {
      setError("Unable to save SLA policy.");
    } finally {
      setSaving(false);
    }
  }

  async function runAlerts() {
    setRunningAlerts(true);
    setError(null);
    try {
      const response = await fetch("/api/service/sla/alerts/run", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Alert run failed");
      }
      await loadData();
    } catch {
      setError("Unable to run SLA alerts.");
    } finally {
      setRunningAlerts(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SLA Monitor</h1>
          <p className="text-gray-600 mt-1">
            Track breaches and adjust response/resolution targets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runAlerts}
            disabled={runningAlerts}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm disabled:opacity-70"
          >
            <AlertTriangle className="w-4 h-4" />
            {runningAlerts ? "Running..." : "Run Alerts"}
          </button>
          <button
            onClick={savePolicy}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Policy"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading SLA monitor...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <MetricCard label="Open" value={summary?.openTickets || 0} />
            <MetricCard
              label="Breached"
              value={summary?.breachedTickets || 0}
              tone="danger"
            />
            <MetricCard
              label="At Risk"
              value={summary?.atRiskTickets || 0}
              tone="warn"
            />
            <MetricCard
              label="First Response Breaches"
              value={summary?.firstResponseBreaches || 0}
            />
            <MetricCard
              label="Breach Rate"
              value={`${summary?.breachRatePct || 0}%`}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Policy Settings
              </h2>
              <div className="space-y-4">
                {priorities.map((priority) => (
                  <div key={priority} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900 capitalize mb-2">
                      {priority}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-gray-600">
                        First response (min)
                        <input
                          type="number"
                          min={1}
                          value={policy[priority].firstResponseMinutes}
                          onChange={(event) =>
                            setPolicy((prev) => ({
                              ...prev,
                              [priority]: {
                                ...prev[priority],
                                firstResponseMinutes: Number(event.target.value || 1),
                              },
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="text-xs text-gray-600">
                        Resolution (hours)
                        <input
                          type="number"
                          min={1}
                          value={policy[priority].resolutionHours}
                          onChange={(event) =>
                            setPolicy((prev) => ({
                              ...prev,
                              [priority]: {
                                ...prev[priority],
                                resolutionHours: Number(event.target.value || 1),
                              },
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                {hasBreaches ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : (
                  <Gauge className="w-4 h-4 text-green-600" />
                )}
                <p className="text-sm font-medium text-gray-900">Priority Queue</p>
              </div>

              {tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No active tickets in SLA queue.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            ticket.sla.breached
                              ? "bg-red-50 text-red-700"
                              : ticket.sla.atRisk
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                          }`}
                        >
                          {ticket.sla.breached
                            ? "Breached"
                            : ticket.sla.atRisk
                              ? "At risk"
                              : "On track"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-3">
                        <span className="capitalize">Priority: {ticket.priority}</span>
                        <span className="capitalize">Status: {ticket.status}</span>
                        <span>
                          Due:{" "}
                          {new Date(ticket.sla.resolution.dueAt).toLocaleString("en-US")}
                        </span>
                        <span>Assignee: {ticket.assignee?.name || "Unassigned"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "danger" | "warn";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-700 bg-red-50"
      : tone === "warn"
        ? "text-amber-700 bg-amber-50"
        : "text-gray-700 bg-gray-50";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <span className={`inline-flex px-2 py-0.5 rounded-full text-sm font-semibold ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}
