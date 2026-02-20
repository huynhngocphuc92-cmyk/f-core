"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";

type SourceType = "blog_post" | "landing_page";
type EventType = "view" | "lead" | "conversion";

type SourceOption = {
  id: string;
  title: string;
};

type PerformanceAsset = {
  sourceType: SourceType;
  sourceId: string;
  title: string;
  status: string;
  views: number;
  leads: number;
  conversions: number;
  leadRatePct: number;
  conversionRatePct: number;
  channels: Array<{
    channel: string;
    views: number;
    leads: number;
    conversions: number;
  }>;
};

type PerformanceResponse = {
  summary: {
    assets: number;
    activeAssets: number;
    views: number;
    leads: number;
    conversions: number;
    leadRatePct: number;
    conversionRatePct: number;
  };
  byAsset: PerformanceAsset[];
  byChannel: Array<{
    channel: string;
    views: number;
    leads: number;
    conversions: number;
    leadRatePct: number;
    conversionRatePct: number;
  }>;
};

const daysOptions = [7, 14, 30, 90];

export default function ContentPerformancePage() {
  const [days, setDays] = useState(30);
  const [sourceType, setSourceType] = useState<"all" | SourceType>("all");
  const [channel, setChannel] = useState("");

  const [eventSourceType, setEventSourceType] = useState<SourceType>("blog_post");
  const [eventSourceId, setEventSourceId] = useState("");
  const [eventType, setEventType] = useState<EventType>("view");
  const [eventChannel, setEventChannel] = useState("organic");

  const [blogSources, setBlogSources] = useState<SourceOption[]>([]);
  const [landingSources, setLandingSources] = useState<SourceOption[]>([]);
  const [report, setReport] = useState<PerformanceResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceOptions = useMemo(
    () => (eventSourceType === "blog_post" ? blogSources : landingSources),
    [eventSourceType, blogSources, landingSources]
  );

  async function loadSources() {
    const [blogResponse, landingResponse] = await Promise.all([
      fetch("/api/content/blog/posts"),
      fetch("/api/landing-pages?limit=50"),
    ]);

    const [blogBody, landingBody] = await Promise.all([blogResponse.json(), landingResponse.json()]);

    if (!blogResponse.ok) throw new Error(blogBody.error || "Unable to load blog sources");
    if (!landingResponse.ok) throw new Error(landingBody.error || "Unable to load landing sources");

    setBlogSources(
      (blogBody.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
      }))
    );

    setLandingSources(
      (landingBody.data || []).map((item: any) => ({
        id: item.id,
        title: item.name,
      }))
    );
  }

  async function loadReport(next?: { days?: number; sourceType?: "all" | SourceType; channel?: string }) {
    const query = new URLSearchParams();
    query.set("days", String(next?.days ?? days));

    const activeSourceType = next?.sourceType ?? sourceType;
    const activeChannel = next?.channel ?? channel;

    if (activeSourceType !== "all") {
      query.set("sourceType", activeSourceType);
    }
    if (activeChannel.trim()) {
      query.set("channel", activeChannel.trim());
    }

    const response = await fetch(`/api/content/performance?${query.toString()}`);
    const body = (await response.json()) as PerformanceResponse & { error?: string };
    if (!response.ok) throw new Error(body.error || "Unable to load performance report");
    setReport(body);
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await loadSources();
      await loadReport();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load content performance");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const firstId = sourceOptions[0]?.id || "";
    setEventSourceId((current) => {
      if (current && sourceOptions.some((item) => item.id === current)) {
        return current;
      }
      return firstId;
    });
  }, [sourceOptions]);

  async function submitEvent() {
    if (!eventSourceId) {
      setError("Please choose a source asset");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/content/performance/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: eventSourceType,
          sourceId: eventSourceId,
          eventType,
          channel: eventChannel,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to submit event");
      await loadReport();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit event");
    } finally {
      setSaving(false);
    }
  }

  async function applyDays(value: number) {
    setDays(value);
    await loadReport({ days: value });
  }

  async function applySourceType(value: "all" | SourceType) {
    setSourceType(value);
    await loadReport({ sourceType: value });
  }

  async function applyChannel(value: string) {
    setChannel(value);
    await loadReport({ channel: value });
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Performance</h1>
        <p className="mt-1 text-gray-600">Track views, leads, and conversions by content asset and channel.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading content performance...
        </div>
      ) : !report ? null : (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Filters</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {daysOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => applyDays(option)}
                  className={`rounded border px-3 py-1 text-xs ${
                    days === option ? "border-[#0891b2] text-[#0891b2]" : "border-gray-200 text-gray-600"
                  }`}
                >
                  {option}d
                </button>
              ))}

              <select
                value={sourceType}
                onChange={(event) => applySourceType(event.target.value as "all" | SourceType)}
                className="h-9 rounded border border-gray-200 px-2 text-xs"
              >
                <option value="all">All sources</option>
                <option value="blog_post">Blog posts</option>
                <option value="landing_page">Landing pages</option>
              </select>

              <input
                value={channel}
                onChange={(event) => applyChannel(event.target.value)}
                className="h-9 rounded border border-gray-200 px-2 text-xs"
                placeholder="Filter channel"
              />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            <Metric label="Assets" value={String(report.summary.assets)} />
            <Metric label="Active" value={String(report.summary.activeAssets)} />
            <Metric label="Views" value={String(report.summary.views)} />
            <Metric label="Leads" value={String(report.summary.leads)} />
            <Metric label="Conversions" value={String(report.summary.conversions)} />
            <Metric label="CVR" value={`${report.summary.conversionRatePct}%`} />
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Track Event (demo)</p>
            <div className="grid gap-3 md:grid-cols-4">
              <select
                value={eventSourceType}
                onChange={(event) => setEventSourceType(event.target.value as SourceType)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="blog_post">Blog Post</option>
                <option value="landing_page">Landing Page</option>
              </select>

              <select
                value={eventSourceId}
                onChange={(event) => setEventSourceId(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="">Select asset</option>
                {sourceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>

              <select
                value={eventType}
                onChange={(event) => setEventType(event.target.value as EventType)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="view">View</option>
                <option value="lead">Lead</option>
                <option value="conversion">Conversion</option>
              </select>

              <input
                value={eventChannel}
                onChange={(event) => setEventChannel(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="Channel (email, social...)"
              />
            </div>
            <button
              onClick={submitEvent}
              disabled={saving || !eventSourceId || !eventChannel.trim()}
              className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
            >
              Track Event
            </button>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Performance By Asset</p>
            {report.byAsset.length === 0 ? (
              <p className="text-sm text-gray-500">No assets available.</p>
            ) : (
              <div className="space-y-2">
                {report.byAsset.slice(0, 12).map((asset) => (
                  <div key={`${asset.sourceType}-${asset.sourceId}`} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">{asset.title}</p>
                    <p className="text-xs text-gray-500">
                      {asset.sourceType} • {asset.status} • views {asset.views} • leads {asset.leads} • conversions {asset.conversions}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Lead rate {asset.leadRatePct}% • Conversion rate {asset.conversionRatePct}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Performance By Channel</p>
            {report.byChannel.length === 0 ? (
              <p className="text-sm text-gray-500">No channel data yet.</p>
            ) : (
              <div className="space-y-2">
                {report.byChannel.map((item) => (
                  <div key={item.channel} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">{item.channel}</p>
                    <p className="text-xs text-gray-500">
                      views {item.views} • leads {item.leads} • conversions {item.conversions} • CVR {item.conversionRatePct}%
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
