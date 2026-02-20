"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";

import { toIntlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

type AnalyticsResponse = {
  windowDays: number;
  summary: {
    adsSpend: number;
    adsLeads: number;
    socialPosts: number;
    experiments: number;
    experimentExposures: number;
    experimentConversions: number;
    experimentConversionRatePct: number;
    attributedRevenue: number;
    journeys: number;
    avgTimeToConvertHours: number;
  };
  attribution: {
    model: string;
    channels: Array<{
      channel: string;
      revenue: number;
      conversions: number;
      sharePct: number;
    }>;
  };
  journey: {
    topPaths: Array<{ path: string; count: number }>;
  };
  experiments: {
    leaderboard: Array<{
      experimentName: string;
      type: string;
      variantKey: string;
      conversionRatePct: number;
      exposures: number;
      conversions: number;
    }>;
    running: number;
    completed: number;
  };
};

const dayOptions = [30, 60, 90] as const;
const channelValues = [
  "all",
  "paid_search",
  "paid_social",
  "email",
  "organic_search",
  "referral",
] as const;

type ChannelValue = (typeof channelValues)[number];

export default function MarketingAnalyticsPage() {
  const { locale, t } = useI18n();
  const intlLocale = toIntlLocale(locale);
  const [days, setDays] = useState<number>(30);
  const [channel, setChannel] = useState<ChannelValue>("all");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelLabelMap = useMemo<Record<ChannelValue, string>>(
    () => ({
      all: t("dashboard.marketingAnalytics.filters.allChannels", "All Channels"),
      paid_search: t("dashboard.marketingAnalytics.channels.paid_search", "Paid Search"),
      paid_social: t("dashboard.marketingAnalytics.channels.paid_social", "Paid Social"),
      email: t("dashboard.marketingAnalytics.channels.email", "Email"),
      organic_search: t(
        "dashboard.marketingAnalytics.channels.organic_search",
        "Organic Search"
      ),
      referral: t("dashboard.marketingAnalytics.channels.referral", "Referral"),
    }),
    [t]
  );

  const loadAnalytics = useCallback(
    async (nextDays = days, nextChannel = channel) => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        query.set("days", String(nextDays));
        if (nextChannel !== "all") query.set("channel", nextChannel);

        const response = await fetch(`/api/marketing/analytics?${query.toString()}`);
        const body = (await response.json()) as AnalyticsResponse & { error?: string };
        if (!response.ok) {
          throw new Error(
            body.error ||
              t(
                "dashboard.marketingAnalytics.errors.load",
                "Unable to load marketing analytics"
              )
          );
        }
        setData(body);
      } catch (err) {
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : t(
                "dashboard.marketingAnalytics.errors.load",
                "Unable to load marketing analytics"
              )
        );
      } finally {
        setLoading(false);
      }
    },
    [channel, days, t]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  async function applyFilters(nextDays: number, nextChannel: ChannelValue) {
    setDays(nextDays);
    setChannel(nextChannel);
    await loadAnalytics(nextDays, nextChannel);
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.marketingAnalytics.title", "Marketing Analytics Workspace")}
          </h1>
          <p className="mt-1 text-gray-600">
            {t(
              "dashboard.marketingAnalytics.subtitle",
              "Consolidated KPI view across ads, social, attribution, journey, and experiments."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(event) =>
              applyFilters(Number(event.target.value), channel)
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            {dayOptions.map((option) => (
              <option key={option} value={option}>
                {t("dashboard.marketingAnalytics.filters.lastDays", "Last {days} days", {
                  days: option,
                })}
              </option>
            ))}
          </select>
          <select
            value={channel}
            onChange={(event) =>
              applyFilters(days, event.target.value as ChannelValue)
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            {channelValues.map((option) => (
              <option key={option} value={option}>
                {channelLabelMap[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          {t("dashboard.marketingAnalytics.loading", "Loading marketing analytics...")}
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <Metric
              label={t("dashboard.marketingAnalytics.metrics.adsSpend", "Ads Spend")}
              value={formatMoney(data.summary.adsSpend, intlLocale)}
            />
            <Metric
              label={t("dashboard.marketingAnalytics.metrics.adsLeads", "Ads Leads")}
              value={String(data.summary.adsLeads)}
            />
            <Metric
              label={t("dashboard.marketingAnalytics.metrics.socialPosts", "Social Posts")}
              value={String(data.summary.socialPosts)}
            />
            <Metric
              label={t("dashboard.marketingAnalytics.metrics.experiments", "Experiments")}
              value={String(data.summary.experiments)}
            />
            <Metric
              label={t(
                "dashboard.marketingAnalytics.metrics.attributedRevenue",
                "Attributed Revenue"
              )}
              value={formatMoney(data.summary.attributedRevenue, intlLocale)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel
              title={t(
                "dashboard.marketingAnalytics.panels.attributionChannels",
                "Attribution Channels"
              )}
            >
              {data.attribution.channels.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t(
                    "dashboard.marketingAnalytics.panels.noAttributionData",
                    "No attribution data."
                  )}
                </p>
              ) : (
                data.attribution.channels.map((item) => (
                  <SimpleRow
                    key={item.channel}
                    label={channelLabelMap[item.channel as ChannelValue] || item.channel}
                    value={`${formatMoney(item.revenue, intlLocale)} (${item.sharePct}%)`}
                  />
                ))
              )}
            </Panel>

            <Panel
              title={t(
                "dashboard.marketingAnalytics.panels.topJourneyPaths",
                "Top Journey Paths"
              )}
            >
              {data.journey.topPaths.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t(
                    "dashboard.marketingAnalytics.panels.noJourneyPaths",
                    "No journey paths."
                  )}
                </p>
              ) : (
                data.journey.topPaths.map((item) => (
                  <SimpleRow key={item.path} label={item.path} value={item.count} />
                ))
              )}
            </Panel>

            <Panel
              title={t(
                "dashboard.marketingAnalytics.panels.experimentLeaderboard",
                "Experiment Leaderboard"
              )}
            >
              {data.experiments.leaderboard.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t(
                    "dashboard.marketingAnalytics.panels.noExperimentData",
                    "No experiment data."
                  )}
                </p>
              ) : (
                data.experiments.leaderboard.map((item) => (
                  <SimpleRow
                    key={`${item.experimentName}-${item.variantKey}`}
                    label={`${item.experimentName} (${item.variantKey})`}
                    value={`${item.conversionRatePct}%`}
                  />
                ))
              )}
            </Panel>

            <Panel
              title={t(
                "dashboard.marketingAnalytics.panels.experimentFunnel",
                "Experiment Funnel"
              )}
            >
              <SimpleRow
                label={t("dashboard.marketingAnalytics.rows.exposures", "Exposures")}
                value={data.summary.experimentExposures}
              />
              <SimpleRow
                label={t("dashboard.marketingAnalytics.rows.conversions", "Conversions")}
                value={data.summary.experimentConversions}
              />
              <SimpleRow
                label={t("dashboard.marketingAnalytics.rows.cvr", "CVR")}
                value={`${data.summary.experimentConversionRatePct}%`}
              />
              <SimpleRow
                label={t("dashboard.marketingAnalytics.rows.running", "Running")}
                value={data.experiments.running}
              />
              <SimpleRow
                label={t("dashboard.marketingAnalytics.rows.completed", "Completed")}
                value={data.experiments.completed}
              />
            </Panel>

            <Panel
              title={t(
                "dashboard.marketingAnalytics.panels.journeyEfficiency",
                "Journey Efficiency"
              )}
            >
              <SimpleRow
                label={t("dashboard.marketingAnalytics.rows.journeys", "Journeys")}
                value={data.summary.journeys}
              />
              <SimpleRow
                label={t(
                  "dashboard.marketingAnalytics.rows.avgTimeToConvert",
                  "Avg Time to Convert"
                )}
                value={`${data.summary.avgTimeToConvertHours}h`}
              />
            </Panel>

            <Panel title={t("dashboard.marketingAnalytics.panels.coverage", "Coverage")}>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                {t(
                  "dashboard.marketingAnalytics.coverageText",
                  "Includes spend, funnel conversion, touch attribution, journey pathing, and experiment performance."
                )}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <BarChart3 className="h-4 w-4 text-[#0891b2]" />
        <p className="text-sm font-medium text-gray-900">{title}</p>
      </div>
      <div className="space-y-2 p-4">{children}</div>
    </section>
  );
}

function SimpleRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
      <span className="text-gray-700">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
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

function formatMoney(amount: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
