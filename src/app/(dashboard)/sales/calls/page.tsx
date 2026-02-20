"use client";

import { useEffect, useState } from "react";
import { PhoneCall } from "lucide-react";

type CallRow = {
  id: string;
  subject: string | null;
  createdAt: string;
  callDuration: number | null;
  transcriptPreview: string | null;
  highlights: string[];
  riskSignals: string[];
  sentimentScore: number | null;
};

type CallsResponse = {
  data: CallRow[];
  summary: {
    totalCalls: number;
    highRiskCalls: number;
    avgSentiment: number;
  };
};

export default function SalesCallsPage() {
  const [data, setData] = useState<CallsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("Discovery call - ACME");
  const [recordingUrl, setRecordingUrl] = useState("https://example.com/recordings/acme-discovery");
  const [transcript, setTranscript] = useState(
    "Customer asked about budget constraints and security review timeline. Next step is legal approval and implementation planning with stakeholders."
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sales/calls?limit=50");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load sales calls");
        setData(body);
      } catch (err) {
        setData(null);
        setError(err instanceof Error ? err.message : "Unable to load sales calls");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function submitCall() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sales/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          recordingUrl,
          transcript,
          durationSeconds: 1800,
          sentimentScore: 0.15,
          actionItems: ["Share security package", "Set procurement review"],
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to record call");

      const metadata = (body.call?.metadata || {}) as Record<string, unknown>;

      setData((prev) => {
        if (!prev) return prev;
        const newRow: CallRow = {
          id: body.call.id,
          subject,
          createdAt: body.call.createdAt,
          callDuration: 1800,
          transcriptPreview:
            typeof metadata.transcript === "string"
              ? String(metadata.transcript).slice(0, 240)
              : null,
          highlights: Array.isArray(metadata.highlights)
            ? (metadata.highlights as string[])
            : [],
          riskSignals: Array.isArray(metadata.riskSignals)
            ? (metadata.riskSignals as string[])
            : [],
          sentimentScore:
            typeof metadata.sentimentScore === "number" ? metadata.sentimentScore : null,
        };

        return {
          data: [newRow, ...prev.data],
          summary: {
            totalCalls: prev.summary.totalCalls + 1,
            highRiskCalls:
              prev.summary.highRiskCalls + (newRow.riskSignals.length > 0 ? 1 : 0),
            avgSentiment: prev.summary.avgSentiment,
          },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record call");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Call Intelligence</h1>
        <p className="mt-1 text-gray-600">
          Capture call recordings/transcripts and highlight risk signals for coaching.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Record New Call</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Call subject"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          />
          <input
            value={recordingUrl}
            onChange={(event) => setRecordingUrl(event.target.value)}
            placeholder="Recording URL"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          />
        </div>
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={4}
          placeholder="Transcript"
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={submitCall}
          disabled={submitting}
          className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          Save Call Transcript
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading call intelligence...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <Metric label="Total Calls" value={String(data.summary.totalCalls)} />
            <Metric label="High-Risk Calls" value={String(data.summary.highRiskCalls)} />
            <Metric label="Avg Sentiment" value={String(data.summary.avgSentiment)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <PhoneCall className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Recent Calls</p>
            </div>

            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No call transcripts yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((row) => (
                  <div key={row.id} className="p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{row.subject || "Call"}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(row.createdAt).toLocaleString("en-US")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Duration: {row.callDuration || 0}s</p>
                    <p className="mt-2 text-sm text-gray-700">{row.transcriptPreview || "-"}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Highlights: {row.highlights.slice(0, 2).join(" | ") || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Risk signals: {row.riskSignals.join(" | ") || "None"}
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
