"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3 } from "lucide-react";

type AnalyticsResponse = {
  windowDays: number;
  summary: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    resolutionRatePct: number;
    avgFirstResponseMinutes: number | null;
    avgResolutionHours: number | null;
  };
  byChannel: Array<{ channel: string; total: number }>;
  byPriority: Array<{ priority: string; total: number }>;
  byCategory: Array<{ category: string; total: number }>;
  topAssignees: Array<{ assigneeId: string; assigneeName: string; total: number }>;
  surveys: {
    sentCount: number;
    responseCount: number;
    responseRatePct: number;
    csatAverage: number | null;
    npsScore: number | null;
  };
};

const windowOptions = [7, 14, 30, 90];

export default function ServiceAnalyticsPage() {
  const [windowDays, setWindowDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAnalytics(days: number) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/service/analytics?days=${days}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load analytics");
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(windowDays);
  }, [windowDays]);

  const channelTotal = useMemo(
    () => (data?.byChannel || []).reduce((sum, item) => sum + item.total, 0),
    [data]
  );

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Analytics</h1>
          <p className="mt-1 text-gray-600">Operational KPI dashboard for Service Hub modules</p>
        </div>
        <select
          value={windowDays}
          onChange={(event) => setWindowDays(Number(event.target.value))}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
        >
          {windowOptions.map((option) => (
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
          Loading analytics...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Tickets" value={data.summary.totalTickets} />
            <Metric label="Open" value={data.summary.openTickets} />
            <Metric label="Resolved" value={data.summary.resolvedTickets} />
            <Metric label="Resolution Rate" value={`${data.summary.resolutionRatePct}%`} />
            <Metric
              label="Avg First Response"
              value={
                data.summary.avgFirstResponseMinutes !== null
                  ? `${data.summary.avgFirstResponseMinutes} min`
                  : "-"
              }
            />
            <Metric
              label="Avg Resolution"
              value={
                data.summary.avgResolutionHours !== null
                  ? `${data.summary.avgResolutionHours} h`
                  : "-"
              }
            />
            <Metric label="CSAT" value={data.surveys.csatAverage ?? "-"} />
            <Metric label="NPS" value={data.surveys.npsScore ?? "-"} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel title="By Channel">
              {(data.byChannel || []).length === 0 ? (
                <EmptyText />
              ) : (
                data.byChannel.map((row) => (
                  <BarRow
                    key={row.channel}
                    label={row.channel}
                    value={row.total}
                    max={channelTotal || 1}
                  />
                ))
              )}
            </Panel>

            <Panel title="By Priority">
              {(data.byPriority || []).length === 0 ? (
                <EmptyText />
              ) : (
                data.byPriority.map((row) => (
                  <SimpleRow key={row.priority} label={row.priority} value={row.total} />
                ))
              )}
            </Panel>

            <Panel title="Top Assignees">
              {(data.topAssignees || []).length === 0 ? (
                <EmptyText />
              ) : (
                data.topAssignees.map((row) => (
                  <SimpleRow key={row.assigneeId} label={row.assigneeName} value={row.total} />
                ))
              )}
            </Panel>

            <Panel title="Issue Categories">
              {(data.byCategory || []).length === 0 ? (
                <EmptyText />
              ) : (
                data.byCategory.map((row) => (
                  <SimpleRow key={row.category} label={row.category} value={row.total} />
                ))
              )}
            </Panel>

            <Panel title="Survey Funnel">
              <SimpleRow label="Sent" value={data.surveys.sentCount} />
              <SimpleRow label="Responses" value={data.surveys.responseCount} />
              <SimpleRow label="Response Rate" value={`${data.surveys.responseRatePct}%`} />
            </Panel>

            <Panel title="Coverage">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                Includes SLA, survey workflow, portal replies, channel mix, and assignee workload.
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
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
      <span className="capitalize text-gray-700">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(6, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-[#0891b2]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyText() {
  return <p className="text-sm text-gray-500">No data in selected time range.</p>;
}
