"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

type QuoteOption = {
  id: string;
  title: string;
};

type EventItem = {
  id: string;
  createdAt: string;
  eventType: "view" | "download" | "signed" | null;
  quoteId: string | null;
  quoteTitle: string | null;
  recipientEmail: string | null;
  source: string | null;
};

type EventsResponse = {
  data: EventItem[];
  summary: {
    total: number;
    view: number;
    download: number;
    signed: number;
  };
};

export default function SalesDocumentsPage() {
  const [quotes, setQuotes] = useState<QuoteOption[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [events, setEvents] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const response = await fetch("/api/quotes?limit=100");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load quotes");

        const list = (body.data || []).map((item: any) => ({
          id: item.id as string,
          title: item.title as string,
        }));
        setQuotes(list);
        if (list.length > 0) {
          setSelectedQuoteId((prev) => prev || list[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load quotes");
      }
    }

    loadQuotes();
  }, []);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError(null);
      try {
        const query = selectedQuoteId ? `?quoteId=${selectedQuoteId}&limit=50` : "?limit=50";
        const response = await fetch(`/api/sales/documents/events${query}`);
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load document events");
        setEvents(body);
      } catch (err) {
        setEvents(null);
        setError(err instanceof Error ? err.message : "Unable to load document events");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [selectedQuoteId]);

  async function recordEvent(eventType: "view" | "download" | "signed") {
    if (!selectedQuoteId) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/sales/documents/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: selectedQuoteId,
          eventType,
          source: "manual",
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to record event");

      setEvents((prev) => {
        if (!prev) return prev;
        const event = body.event;
        const data = [
          {
            id: event.id,
            createdAt: event.createdAt,
            eventType,
            quoteId: selectedQuoteId,
            quoteTitle: quotes.find((q) => q.id === selectedQuoteId)?.title || null,
            recipientEmail: null,
            source: "manual",
          },
          ...prev.data,
        ];

        return {
          data,
          summary: {
            total: prev.summary.total + 1,
            view: prev.summary.view + (eventType === "view" ? 1 : 0),
            download: prev.summary.download + (eventType === "download" ? 1 : 0),
            signed: prev.summary.signed + (eventType === "signed" ? 1 : 0),
          },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Tracking</h1>
          <p className="mt-1 text-gray-600">
            Track quote engagement events (view, download, signed) and push to timeline.
          </p>
        </div>

        <select
          value={selectedQuoteId}
          onChange={(event) => setSelectedQuoteId(event.target.value)}
          className="h-10 min-w-[320px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
        >
          {quotes.length ? null : <option value="">No quotes available</option>}
          {quotes.map((quote) => (
            <option key={quote.id} value={quote.id}>
              {quote.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => recordEvent("view")}
          disabled={!selectedQuoteId || submitting}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Record View
        </button>
        <button
          onClick={() => recordEvent("download")}
          disabled={!selectedQuoteId || submitting}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Record Download
        </button>
        <button
          onClick={() => recordEvent("signed")}
          disabled={!selectedQuoteId || submitting}
          className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          Record Signed
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading document events...
        </div>
      ) : !events ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Total Events" value={String(events.summary.total)} />
            <Metric label="Views" value={String(events.summary.view)} />
            <Metric label="Downloads" value={String(events.summary.download)} />
            <Metric label="Signed" value={String(events.summary.signed)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <FileText className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Recent Engagement Events</p>
            </div>

            {events.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No events yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Quote</th>
                      <th className="px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.data.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(row.createdAt).toLocaleString("en-US")}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.eventType || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{row.quoteTitle || row.quoteId || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{row.source || "-"}</td>
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
