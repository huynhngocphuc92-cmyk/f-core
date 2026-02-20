"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

type ObservabilityItem = {
  id: string;
  mappingId: string;
  integration: string;
  objectType: string;
  status: "completed" | "completed_with_conflicts" | "failed";
  attempt: number;
  retriedFromJobId: string | null;
  processed: number;
  imported: number;
  exported: number;
  skipped: number;
  conflicts: number;
  diagnostics: Array<{ code: string; severity: string; message: string }>;
  traceCount: number;
  lineageEvents: number;
  startedAt: string;
  completedAt: string;
};

type ObservabilitySummary = {
  totalJobs: number;
  completed: number;
  completedWithConflicts: number;
  failed: number;
  retries: number;
  totalProcessed: number;
  totalImported: number;
  totalExported: number;
  totalConflicts: number;
};

type JobDetails = {
  id: string;
  status: "completed" | "completed_with_conflicts" | "failed";
  traces: Array<{
    id: string;
    name: string;
    status: "ok" | "warning" | "error";
    durationMs: number;
  }>;
  diagnostics: Array<{
    code: string;
    severity: string;
    message: string;
  }>;
  conflictItems: Array<{
    externalId: string;
    reason: string;
  }>;
};

export default function DataLineagePage() {
  const [summary, setSummary] = useState<ObservabilitySummary | null>(null);
  const [items, setItems] = useState<ObservabilityItem[]>([]);
  const [details, setDetails] = useState<JobDetails | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [retryDryRun, setRetryDryRun] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    const response = await fetch("/api/data/sync/observability");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load observability");

    setSummary(body.summary);
    setItems(body.data || []);

    if (!selectedJobId && body.data?.length) {
      setSelectedJobId(body.data[0].id);
      await loadDetails(body.data[0].id);
    }
  }

  async function loadDetails(jobId: string) {
    const response = await fetch(`/api/data/sync/observability?jobId=${jobId}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load job details");
    setDetails(body.job);
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data lineage workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function selectJob(jobId: string) {
    setSelectedJobId(jobId);
    setError(null);
    try {
      await loadDetails(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load job details");
    }
  }

  async function retryJob() {
    if (!selectedJobId) {
      setError("Select a job to retry");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/data/sync/jobs/${selectedJobId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: retryDryRun,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to retry sync job");

      await loadAll();
      await selectJob(body.job.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retry sync job");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Lineage & Observability</h1>
        <p className="mt-1 text-gray-600">Inspect sync traces, diagnostics, conflict signals, and retry status.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading observability...
        </div>
      ) : (
        <>
          {summary && (
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
              <Metric label="Jobs" value={String(summary.totalJobs)} />
              <Metric label="Completed" value={String(summary.completed)} />
              <Metric label="With Conflicts" value={String(summary.completedWithConflicts)} />
              <Metric label="Failed" value={String(summary.failed)} />
              <Metric label="Retries" value={String(summary.retries)} />
              <Metric label="Processed" value={String(summary.totalProcessed)} />
            </div>
          )}

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Sync Job Timeline</p>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs to observe yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectJob(item.id)}
                    className={`w-full rounded-lg border p-3 text-left text-sm ${
                      selectedJobId === item.id ? "border-[#0891b2]" : "border-gray-100"
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      {item.integration}:{item.objectType} • {item.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      attempt {item.attempt} • processed {item.processed} • conflicts {item.conflicts} • diagnostics {item.diagnostics.length}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Retry Control</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={retryDryRun} onChange={(e) => setRetryDryRun(e.target.checked)} />
                Retry as dry-run
              </label>
              <button
                onClick={retryJob}
                disabled={saving || !selectedJobId}
                className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
              >
                Retry Selected Job
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Job Diagnostics & Trace</p>
            {!details ? (
              <p className="text-sm text-gray-500">Select a job to inspect details.</p>
            ) : (
              <>
                <p className="mb-2 text-xs text-gray-500">Status: {details.status}</p>
                <div className="mb-3 space-y-2">
                  {details.traces.map((trace) => (
                    <div key={trace.id} className="rounded border border-gray-100 p-2 text-xs text-gray-600">
                      {trace.name} • {trace.status} • {trace.durationMs}ms
                    </div>
                  ))}
                </div>

                {details.diagnostics.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {details.diagnostics.map((diagnostic, idx) => (
                      <div key={`${diagnostic.code}-${idx}`} className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        {diagnostic.code}: {diagnostic.message}
                      </div>
                    ))}
                  </div>
                )}

                {details.conflictItems.length > 0 && (
                  <div className="space-y-1 text-xs text-gray-600">
                    {details.conflictItems.map((item, idx) => (
                      <div key={`${item.externalId}-${idx}`}>Conflict {item.externalId}: {item.reason}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
