"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, GitBranch, PlayCircle, RefreshCw } from "lucide-react";

type WorkflowOption = {
  id: string;
  name: string;
};

type WorkflowRun = {
  id: string;
  workflowId: string;
  status: "succeeded" | "dead_letter";
  retriesUsed: number;
  attempts: Array<{ attempt: number; status: "succeeded" | "failed"; error: string | null }>;
  startedAt: string;
};

type WorkflowDeadLetter = {
  id: string;
  workflowId: string;
  latestError: string;
  attempts: number;
  resolvedAt: string | null;
  createdAt: string;
};

type WorkflowVersion = {
  id: string;
  version: number;
  label: string;
  createdAt: string;
};

export default function WorkflowRuntimePage() {
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [maxRetries, setMaxRetries] = useState(2);
  const [payloadText, setPayloadText] = useState('{"forceFail": false}');
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [deadLetters, setDeadLetters] = useState<WorkflowDeadLetter[]>([]);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [summary, setSummary] = useState<{
    totalRuns: number;
    succeeded: number;
    deadLettered: number;
    retriesUsed: number;
    unresolvedDeadLetters: number;
    successRatePct: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedWorkflowName = useMemo(
    () => workflows.find((item) => item.id === selectedWorkflowId)?.name || selectedWorkflowId,
    [workflows, selectedWorkflowId]
  );

  async function loadAll(workflowId?: string) {
    setError(null);
    const scopedId = workflowId || selectedWorkflowId;

    try {
      const [workflowsRes, runsRes, deadRes] = await Promise.all([
        fetch("/api/workflows?limit=100"),
        fetch("/api/workflows/runtime/runs"),
        fetch("/api/workflows/runtime/dead-letter?unresolvedOnly=true"),
      ]);

      const [workflowsBody, runsBody, deadBody] = await Promise.all([
        workflowsRes.json(),
        runsRes.json(),
        deadRes.json(),
      ]);

      if (!workflowsRes.ok) throw new Error(workflowsBody.error || "Unable to load workflows");
      if (!runsRes.ok) throw new Error(runsBody.error || "Unable to load runtime runs");
      if (!deadRes.ok) throw new Error(deadBody.error || "Unable to load dead-letter queue");

      const loadedWorkflows = (workflowsBody.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));

      setWorkflows(loadedWorkflows);
      setRuns(runsBody.data || []);
      setSummary(runsBody.summary || null);
      setDeadLetters(deadBody.data || []);

      const resolvedWorkflowId =
        scopedId || loadedWorkflows[0]?.id || "";

      if (resolvedWorkflowId) {
        setSelectedWorkflowId(resolvedWorkflowId);
        await loadVersions(resolvedWorkflowId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workflow runtime workspace");
    }
  }

  async function loadVersions(workflowId: string) {
    const response = await fetch(`/api/workflows/${workflowId}/versions`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load workflow versions");
    setVersions(body.data || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function runWorkflow() {
    if (!selectedWorkflowId) return;

    setBusy(true);
    setError(null);
    try {
      const payload = JSON.parse(payloadText || "{}");
      const response = await fetch("/api/workflows/runtime/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          maxRetries,
          payload,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run workflow runtime");

      await loadAll(selectedWorkflowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run workflow runtime");
    } finally {
      setBusy(false);
    }
  }

  async function createVersion() {
    if (!selectedWorkflowId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/workflows/${selectedWorkflowId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: `manual-${new Date().toISOString()}`,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create workflow version");

      await loadVersions(selectedWorkflowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create workflow version");
    } finally {
      setBusy(false);
    }
  }

  async function restoreVersion(versionId: string) {
    if (!selectedWorkflowId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/workflows/${selectedWorkflowId}/versions/${versionId}/restore`,
        { method: "POST" }
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to restore workflow version");

      await loadVersions(selectedWorkflowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to restore workflow version");
    } finally {
      setBusy(false);
    }
  }

  async function retryDeadLetter(deadLetterId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflows/runtime/dead-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadLetterId, maxRetries }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to retry dead-letter workflow");

      await loadAll(selectedWorkflowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retry dead-letter workflow");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Runtime</h1>
        <p className="mt-1 text-gray-600">
          Runtime retries, dead-letter queue, and workflow version rollback controls.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Runs</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary?.totalRuns || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Success Rate</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary?.successRatePct || 0}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Unresolved Dead Letters</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary?.unresolvedDeadLetters || 0}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Run Workflow Runtime</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={selectedWorkflowId}
            onChange={(event) => {
              const nextId = event.target.value;
              setSelectedWorkflowId(nextId);
              loadVersions(nextId).catch((err) => setError(err instanceof Error ? err.message : "Unable to load versions"));
            }}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="">Select workflow</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={0}
            max={10}
            value={maxRetries}
            onChange={(event) => setMaxRetries(Number(event.target.value) || 0)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="max retries"
          />

          <button
            onClick={runWorkflow}
            disabled={busy || !selectedWorkflowId}
            className="rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-medium text-white hover:bg-[#115e59] disabled:opacity-50"
          >
            {busy ? "Running..." : "Run"}
          </button>
        </div>

        <textarea
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
          className="mt-3 h-24 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs"
          placeholder='{"forceFail": true, "failUntilAttempt": 2}'
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Runtime Runs</p>
            <span className="text-xs text-gray-500">{runs.length} runs</span>
          </div>
          {runs.length === 0 ? (
            <p className="text-sm text-gray-500">No runtime runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runs.slice(0, 12).map((run) => (
                <div key={run.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium text-gray-900">
                    {run.workflowId} • {run.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    retries {run.retriesUsed} • attempts {run.attempts.length} • {new Date(run.startedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">Dead-Letter Queue</p>
            </div>
            <span className="text-xs text-gray-500">{deadLetters.length} items</span>
          </div>

          {deadLetters.length === 0 ? (
            <p className="text-sm text-gray-500">No unresolved dead-letter items.</p>
          ) : (
            <div className="space-y-2">
              {deadLetters.slice(0, 12).map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium text-gray-900">{item.workflowId}</p>
                  <p className="text-xs text-gray-500">{item.latestError}</p>
                  <button
                    onClick={() => retryDeadLetter(item.id)}
                    disabled={busy || !!item.resolvedAt}
                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[#0891b2]" />
            <p className="text-sm font-semibold text-gray-900">Workflow Versions ({selectedWorkflowName || "n/a"})</p>
          </div>
          <button
            onClick={createVersion}
            disabled={busy || !selectedWorkflowId}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Snapshot
          </button>
        </div>

        {versions.length === 0 ? (
          <p className="text-sm text-gray-500">No versions created yet for this workflow.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    v{version.version} • {version.label}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(version.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => restoreVersion(version.id)}
                  disabled={busy}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
