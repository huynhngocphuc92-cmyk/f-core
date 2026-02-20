"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

import { toIntlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

type ForecastPoint = {
  key: string;
  pipelineAmount: number;
  weightedForecast: number;
  trendBaseline: number;
  forecast: number;
  confidenceLow: number;
  confidenceHigh: number;
};

type ForecastResponse = {
  summary: {
    openDealAmount: number;
    weightedPipeline: number;
    trendGrowthPct: number;
    confidencePct: number;
  };
  monthly: ForecastPoint[];
  quarterly: ForecastPoint[];
};

export default function SalesForecastPage() {
  const { locale, t } = useI18n();
  const intlLocale = toIntlLocale(locale);
  const [period, setPeriod] = useState<"month" | "quarter">("month");
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/sales/forecast?period=${period}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(
            body.error || t("dashboard.salesForecast.errors.load", "Unable to load forecast")
          );
        }
        setData(body);
      } catch (err) {
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : t("dashboard.salesForecast.errors.load", "Unable to load forecast")
        );
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, [period, t]);

  const series = period === "month" ? data?.monthly || [] : data?.quarterly || [];

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.salesForecast.title", "Sales Forecast")}
          </h1>
          <p className="mt-1 text-gray-600">
            {t(
              "dashboard.salesForecast.subtitle",
              "Stage-weighted + trend forecast with confidence bands"
            )}
          </p>
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as "month" | "quarter")}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
        >
          <option value="month">
            {t("dashboard.salesForecast.period.month", "Monthly (6)")}
          </option>
          <option value="quarter">
            {t("dashboard.salesForecast.period.quarter", "Quarterly (4)")}
          </option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          {t("dashboard.salesForecast.loading", "Loading sales forecast...")}
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric
              label={t("dashboard.salesForecast.metrics.openPipeline", "Open Pipeline")}
              value={formatMoney(data.summary.openDealAmount, intlLocale)}
            />
            <Metric
              label={t(
                "dashboard.salesForecast.metrics.weightedPipeline",
                "Weighted Pipeline"
              )}
              value={formatMoney(data.summary.weightedPipeline, intlLocale)}
            />
            <Metric
              label={t("dashboard.salesForecast.metrics.trendGrowth", "Trend Growth")}
              value={`${data.summary.trendGrowthPct}%`}
            />
            <Metric
              label={t("dashboard.salesForecast.metrics.confidence", "Confidence")}
              value={`${data.summary.confidencePct}%`}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <TrendingUp className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">
                {t("dashboard.salesForecast.seriesTitle", "Forecast Series")}
              </p>
            </div>

            {series.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {t("dashboard.salesForecast.noData", "No forecast data.")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">
                        {t("dashboard.salesForecast.table.period", "Period")}
                      </th>
                      <th className="px-4 py-3">
                        {t("dashboard.salesForecast.table.pipeline", "Pipeline")}
                      </th>
                      <th className="px-4 py-3">
                        {t("dashboard.salesForecast.table.weighted", "Weighted")}
                      </th>
                      <th className="px-4 py-3">
                        {t(
                          "dashboard.salesForecast.table.trendBaseline",
                          "Trend Baseline"
                        )}
                      </th>
                      <th className="px-4 py-3">
                        {t("dashboard.salesForecast.table.forecast", "Forecast")}
                      </th>
                      <th className="px-4 py-3">
                        {t(
                          "dashboard.salesForecast.table.confidenceBand",
                          "Confidence Band"
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {series.map((point) => (
                      <tr key={point.key}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {point.key}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatMoney(point.pipelineAmount, intlLocale)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatMoney(point.weightedForecast, intlLocale)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatMoney(point.trendBaseline, intlLocale)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {formatMoney(point.forecast, intlLocale)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatMoney(point.confidenceLow, intlLocale)} -{" "}
                          {formatMoney(point.confidenceHigh, intlLocale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

function formatMoney(value: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
