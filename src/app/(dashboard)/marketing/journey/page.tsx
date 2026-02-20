"use client";

import { useEffect, useState } from "react";
import { Map } from "lucide-react";

type JourneyResponse = {
  days: number;
  limit: number;
  totals: {
    journeys: number;
    conversions: number;
    avgTouchpoints: number;
    avgTimeToConvertHours: number;
    attributedRevenue: number;
  };
  topPaths: Array<{
    path: string;
    count: number;
  }>;
  journeys: Array<{
    conversionId: string;
    revenue: number;
    convertedAt: string;
    totalTouchpoints: number;
    timeToConvertHours: number;
    path: string;
    steps: Array<{
      channel: string;
      occurredAt: string;
      lagHours: number;
    }>;
  }>;
};

const dayOptions = [30, 60, 90];

export default function MarketingJourneyPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<JourneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReport(nextDays = days) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/marketing/journey?days=${nextDays}&limit=20`);
      const body = (await response.json()) as JourneyResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load customer journeys");
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load customer journeys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  async function applyWindow(nextDays: number) {
    setDays(nextDays);
    await loadReport(nextDays);
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Journey Timeline</h1>
          <p className="mt-1 text-gray-600">
            Track channel sequences from first touchpoint to conversion.
          </p>
        </div>
        <select
          value={days}
          onChange={(event) => applyWindow(Number(event.target.value))}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
        >
          {dayOptions.map((option) => (
            <option key={option} value={option}>
              Last {option} days
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
          Loading journey timeline...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <Metric label="Journeys" value={String(data.totals.journeys)} />
            <Metric label="Conversions" value={String(data.totals.conversions)} />
            <Metric label="Avg Touchpoints" value={String(data.totals.avgTouchpoints)} />
            <Metric label="Avg Time to Convert" value={`${data.totals.avgTimeToConvertHours}h`} />
            <Metric label="Attributed Revenue" value={formatMoney(data.totals.attributedRevenue)} />
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Top Journey Paths</p>
            {data.topPaths.length === 0 ? (
              <p className="text-sm text-gray-500">No journey paths in selected time range.</p>
            ) : (
              <div className="space-y-2">
                {data.topPaths.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">{item.path}</span>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <Map className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Conversion Journeys</p>
            </div>

            {data.journeys.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No eligible journeys for selected time range.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.journeys.map((journey) => (
                  <div key={journey.conversionId} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Deal {journey.conversionId}</p>
                        <p className="text-xs text-gray-500">
                          {journey.totalTouchpoints} touchpoints • {journey.timeToConvertHours}h to convert
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>{formatMoney(journey.revenue)}</p>
                        <p>{new Date(journey.convertedAt).toLocaleString("en-US")}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {journey.steps.map((step, index) => (
                        <div
                          key={`${journey.conversionId}-${step.occurredAt}-${index}`}
                          className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700"
                        >
                          {step.channel} (+{step.lagHours}h)
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

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
