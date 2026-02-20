"use client";

import { useEffect, useState } from "react";
import { BarChart3, Send } from "lucide-react";

type SurveySummary = {
  sentCount: number;
  responseCount: number;
  responseRatePct: number;
  csatAverage: number | null;
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
};

type SurveyResponseRow = {
  ticketId: string;
  csatScore: number;
  npsScore: number | null;
  feedback: string | null;
  respondedAt: string;
  ticket: { id: string; subject: string; status: string; priority: string } | null;
};

export default function ServiceSurveysPage() {
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [responses, setResponses] = useState<SurveyResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/service/surveys?days=30&limit=30");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load survey metrics");
      setSummary(body.summary || null);
      setResponses(body.recentResponses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load survey metrics");
      setSummary(null);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }

  async function dispatchSurveys() {
    setDispatching(true);
    setError(null);
    try {
      const response = await fetch("/api/service/surveys?days=14", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to dispatch surveys");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to dispatch surveys");
    } finally {
      setDispatching(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CSAT & NPS</h1>
          <p className="text-gray-600 mt-1">Survey workflow and customer satisfaction metrics</p>
        </div>
        <button
          onClick={dispatchSurveys}
          disabled={dispatching}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0891b2] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-70"
        >
          <Send className="w-4 h-4" />
          {dispatching ? "Dispatching..." : "Dispatch Surveys"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading survey metrics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Metric label="Sent" value={summary?.sentCount ?? 0} />
            <Metric label="Responses" value={summary?.responseCount ?? 0} />
            <Metric label="Response Rate" value={`${summary?.responseRatePct ?? 0}%`} />
            <Metric label="CSAT Avg" value={summary?.csatAverage ?? "-"} />
            <Metric label="NPS" value={summary?.npsScore ?? "-"} />
            <Metric label="Promoters" value={summary?.promoters ?? 0} />
            <Metric label="Passives" value={summary?.passives ?? 0} />
            <Metric label="Detractors" value={summary?.detractors ?? 0} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <BarChart3 className="w-4 h-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Recent Survey Responses</p>
            </div>

            {responses.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No survey responses yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {responses.map((response) => (
                  <div key={`${response.ticketId}-${response.respondedAt}`} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">
                        {response.ticket?.subject || `Ticket ${response.ticketId}`}
                      </p>
                      <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                        CSAT {response.csatScore}/5
                        {response.npsScore !== null ? ` · NPS ${response.npsScore}/10` : ""}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(response.respondedAt).toLocaleString("en-US")}
                    </div>
                    {response.feedback ? (
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{response.feedback}</p>
                    ) : null}
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
