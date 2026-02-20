"use client";

import { useEffect, useState } from "react";
import { BrainCircuit } from "lucide-react";

type CoachingInsight = {
  dealId: string;
  dealName: string;
  amount: number;
  stageName: string | null;
  healthScore: number;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  recommendations: string[];
  callCount: number;
  avgSentiment: number | null;
};

type CoachingResponse = {
  data: CoachingInsight[];
  summary: {
    totalDeals: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
};

export default function SalesCoachingPage() {
  const [data, setData] = useState<CoachingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/sales/coaching?limit=50");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load coaching insights");
        setData(body);
      } catch (err) {
        setData(null);
        setError(err instanceof Error ? err.message : "Unable to load coaching insights");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Coaching</h1>
        <p className="mt-1 text-gray-600">
          Deal risk scoring and coaching suggestions from call + pipeline signals.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading coaching insights...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Tracked Deals" value={String(data.summary.totalDeals)} />
            <Metric label="High Risk" value={String(data.summary.highRisk)} />
            <Metric label="Medium Risk" value={String(data.summary.mediumRisk)} />
            <Metric label="Low Risk" value={String(data.summary.lowRisk)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <BrainCircuit className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Deal Coaching Queue</p>
            </div>

            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No active deals.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((item) => (
                  <div key={item.dealId} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.dealName}</p>
                        <p className="text-xs text-gray-500">
                          {item.stageName || "No stage"} • {formatMoney(item.amount)} • Calls: {item.callCount}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Score {item.healthScore}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            item.riskLevel === "high"
                              ? "bg-red-100 text-red-700"
                              : item.riskLevel === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.riskLevel}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Reasons: {item.reasons.join(" | ") || "No major risks"}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Recommendation: {item.recommendations[0] || "Maintain progress"}
                    </p>
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
