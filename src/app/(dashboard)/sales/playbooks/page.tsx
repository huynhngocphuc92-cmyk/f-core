"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";

type DealOption = {
  id: string;
  name: string;
  amount: number;
  closeDate: string | null;
  stageName: string | null;
};

type PlaybookTemplate = {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
};

type PlaybookRun = {
  id: string;
  dealId: string;
  templateId: string;
  status: "active" | "completed";
  completedSteps: number;
  totalSteps: number;
  progressPct: number;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }>;
};

type PlaybooksResponse = {
  deals: DealOption[];
  templates: PlaybookTemplate[];
  runs: PlaybookRun[];
  recommendation: {
    dealId: string;
    templateId: string | null;
    templateName: string | null;
  } | null;
};

export default function SalesPlaybooksPage() {
  const [selectedDealId, setSelectedDealId] = useState("");
  const [data, setData] = useState<PlaybooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlaybooks() {
      setLoading(true);
      setError(null);

      try {
        const query = selectedDealId ? `?dealId=${selectedDealId}` : "";
        const response = await fetch(`/api/sales/playbooks${query}`);
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error || "Unable to load sales playbooks");
        }

        setData(body);

        if (!selectedDealId && body.deals.length > 0) {
          setSelectedDealId(body.deals[0].id);
        }
      } catch (err) {
        setData(null);
        setError(err instanceof Error ? err.message : "Unable to load sales playbooks");
      } finally {
        setLoading(false);
      }
    }

    loadPlaybooks();
  }, [selectedDealId]);

  async function startPlaybook(templateId: string) {
    if (!selectedDealId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sales/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: selectedDealId,
          templateId,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to start playbook");
      }

      setData((prev) => {
        if (!prev) return prev;
        const filtered = prev.runs.filter((run) => run.id !== body.run.id);
        return {
          ...prev,
          runs: [body.run, ...filtered],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start playbook");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStep(run: PlaybookRun, stepId: string, completed: boolean) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sales/playbooks/${run.id}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to update step");
      }

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          runs: prev.runs.map((item) => (item.id === body.run.id ? body.run : item)),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update step");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedDeal = data?.deals.find((deal) => deal.id === selectedDealId) || null;

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Playbooks</h1>
          <p className="mt-1 text-gray-600">
            Launch contextual deal playbooks and track execution progress.
          </p>
        </div>

        <select
          value={selectedDealId}
          onChange={(event) => setSelectedDealId(event.target.value)}
          className="h-10 min-w-[280px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
        >
          {data?.deals.length ? null : <option value="">No deals available</option>}
          {data?.deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.name} ({formatMoney(deal.amount)})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading sales playbooks...
        </div>
      ) : !data ? null : (
        <>
          {selectedDeal && data.recommendation?.templateId && (
            <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-xs uppercase tracking-wide text-cyan-700">Recommended</p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{data.recommendation.templateName}</p>
                  <p className="text-sm text-gray-600">
                    Suggested for deal stage: {selectedDeal.stageName || "Unknown"}
                  </p>
                </div>
                <button
                  onClick={() => startPlaybook(data.recommendation?.templateId || "")}
                  disabled={submitting || !data.recommendation?.templateId}
                  className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0e7490] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Recommended
                </button>
              </div>
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {data.templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                <p className="mt-3 text-xs text-gray-500">{template.steps.length} steps</p>
                <button
                  onClick={() => startPlaybook(template.id)}
                  disabled={!selectedDealId || submitting}
                  className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Playbook
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <ClipboardCheck className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Active Playbook Runs</p>
            </div>

            {data.runs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No playbook runs for this deal yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.runs.map((run) => (
                  <div key={run.id} className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{run.templateId}</p>
                        <p className="text-xs text-gray-500">
                          Progress: {run.completedSteps}/{run.totalSteps} ({run.progressPct}%)
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          run.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {run.steps.map((step) => (
                        <label
                          key={step.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-100 p-2"
                        >
                          <input
                            type="checkbox"
                            checked={step.completed}
                            onChange={(event) =>
                              toggleStep(run, step.id, event.target.checked)
                            }
                            disabled={submitting}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{step.title}</p>
                            <p className="text-xs text-gray-600">{step.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
