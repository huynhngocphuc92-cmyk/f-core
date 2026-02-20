"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

type ExperimentStatus = "draft" | "running" | "paused" | "completed";
type ExperimentType = "landing_page" | "email_campaign";

type Experiment = {
  id: string;
  name: string;
  type: ExperimentType;
  targetId: string;
  goal: string;
  status: ExperimentStatus;
  winnerVariantKey: string | null;
  variants: Array<{
    key: string;
    name: string;
    trafficPct: number;
    exposures: number;
    conversions: number;
    conversionRatePct: number;
  }>;
};

type ExperimentsResponse = {
  data: Experiment[];
  summary: {
    total: number;
    running: number;
    completed: number;
    totalExposures: number;
    totalConversions: number;
    overallConversionRatePct: number;
  };
};

export default function MarketingExperimentsPage() {
  const [data, setData] = useState<ExperimentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("Homepage CTA Experiment");
  const [type, setType] = useState<ExperimentType>("landing_page");
  const [targetId, setTargetId] = useState("landing-page-home");
  const [goal, setGoal] = useState("form_submission");
  const [variantA, setVariantA] = useState("Control");
  const [variantB, setVariantB] = useState("Variant");

  async function loadExperiments() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/marketing/experiments");
      const body = (await response.json()) as ExperimentsResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load experiments");
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load experiments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExperiments();
  }, []);

  async function createExperiment() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/marketing/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          targetId,
          goal,
          variants: [
            { key: "A", name: variantA, trafficPct: 50 },
            { key: "B", name: variantB, trafficPct: 50 },
          ],
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create experiment");
      await loadExperiments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create experiment");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, action: "start" | "pause" | "complete") {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/marketing/experiments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update experiment");
      await loadExperiments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update experiment");
    } finally {
      setSaving(false);
    }
  }

  async function recordEvent(id: string, variantKey: string, eventType: "exposure" | "conversion") {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/marketing/experiments/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          variantKey,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to record event");
      await loadExperiments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1>
        <p className="mt-1 text-gray-600">
          Compare landing page and email variants to identify winning creatives.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Create Experiment</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="Experiment name"
          />
          <input
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="Target ID"
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ExperimentType)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="landing_page">Landing Page</option>
            <option value="email_campaign">Email Campaign</option>
          </select>
          <input
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="Goal metric"
          />
          <input
            value={variantA}
            onChange={(event) => setVariantA(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="Variant A label"
          />
          <input
            value={variantB}
            onChange={(event) => setVariantB(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="Variant B label"
          />
        </div>
        <button
          onClick={createExperiment}
          disabled={saving}
          className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          Create A/B Test
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading experiments...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            <Metric label="Total" value={String(data.summary.total)} />
            <Metric label="Running" value={String(data.summary.running)} />
            <Metric label="Completed" value={String(data.summary.completed)} />
            <Metric label="Exposures" value={String(data.summary.totalExposures)} />
            <Metric label="Conversions" value={String(data.summary.totalConversions)} />
            <Metric label="CVR" value={`${data.summary.overallConversionRatePct}%`} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <FlaskConical className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Experiments</p>
            </div>

            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No experiments created yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((experiment) => (
                  <div key={experiment.id} className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{experiment.name}</p>
                        <p className="text-xs text-gray-500">
                          {experiment.type} • {experiment.targetId} • goal: {experiment.goal}
                        </p>
                        <p className="text-xs text-gray-500">
                          status: {experiment.status}
                          {experiment.winnerVariantKey ? ` • winner: ${experiment.winnerVariantKey}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {experiment.status !== "running" && experiment.status !== "completed" && (
                          <button
                            onClick={() => changeStatus(experiment.id, "start")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Start
                          </button>
                        )}
                        {experiment.status === "running" && (
                          <button
                            onClick={() => changeStatus(experiment.id, "pause")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Pause
                          </button>
                        )}
                        {experiment.status !== "completed" && (
                          <button
                            onClick={() => changeStatus(experiment.id, "complete")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {experiment.variants.map((variant) => (
                        <div key={variant.key} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <p className="text-sm font-medium text-gray-900">
                            {variant.key}: {variant.name} ({variant.trafficPct}%)
                          </p>
                          <p className="text-xs text-gray-600">
                            Exposures: {variant.exposures} • Conversions: {variant.conversions} • CVR:{" "}
                            {variant.conversionRatePct}%
                          </p>
                          {experiment.status === "running" && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => recordEvent(experiment.id, variant.key, "exposure")}
                                disabled={saving}
                                className="rounded border border-gray-200 px-2 py-1 text-xs"
                              >
                                + Exposure
                              </button>
                              <button
                                onClick={() => recordEvent(experiment.id, variant.key, "conversion")}
                                disabled={saving}
                                className="rounded border border-gray-200 px-2 py-1 text-xs"
                              >
                                + Conversion
                              </button>
                            </div>
                          )}
                        </div>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
