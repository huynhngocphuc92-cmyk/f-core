"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";

type AttributionModel = "first_touch" | "last_touch" | "multi_touch";

type AttributionResponse = {
  days: number;
  model: AttributionModel;
  totals: {
    conversions: number;
    attributedRevenue: number;
  };
  byChannel: Array<{
    channel: string;
    revenue: number;
    conversions: number;
    sharePct: number;
  }>;
};

export default function MarketingAttributionPage() {
  const [model, setModel] = useState<AttributionModel>("first_touch");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AttributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReport(nextModel = model, nextDays = days) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/marketing/attribution?model=${nextModel}&days=${nextDays}`
      );
      const body = (await response.json()) as AttributionResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load attribution report");
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load attribution report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  async function applyFilters(nextModel: AttributionModel, nextDays: number) {
    setModel(nextModel);
    setDays(nextDays);
    await loadReport(nextModel, nextDays);
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attribution Models</h1>
        <p className="mt-1 text-gray-600">
          Compare first-touch, last-touch, and multi-touch revenue attribution by channel.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={model}
            onChange={(event) => applyFilters(event.target.value as AttributionModel, days)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="first_touch">First Touch</option>
            <option value="last_touch">Last Touch</option>
            <option value="multi_touch">Multi Touch</option>
          </select>

          <select
            value={String(days)}
            onChange={(event) => applyFilters(model, Number(event.target.value))}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading attribution report...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            <Metric label="Model" value={data.model.replace("_", " ")} />
            <Metric label="Conversions" value={String(data.totals.conversions)} />
            <Metric label="Attributed Revenue" value={formatMoney(data.totals.attributedRevenue)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <Target className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Channel Attribution</p>
            </div>

            {data.byChannel.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No eligible conversions/touchpoints in this date range.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.byChannel.map((channel) => (
                  <div key={channel.channel} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{channel.channel}</p>
                        <p className="text-xs text-gray-500">Conversions: {channel.conversions}</p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>Revenue: {formatMoney(channel.revenue)}</p>
                        <p>Share: {channel.sharePct}%</p>
                      </div>
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
