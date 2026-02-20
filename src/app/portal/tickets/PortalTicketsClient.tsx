"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PortalTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  sla?: {
    breached: boolean;
    atRisk: boolean;
  };
};

export default function PortalTicketsClient({ token }: { token: string }) {
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const queryToken = useMemo(() => encodeURIComponent(token), [token]);

  async function loadTickets() {
    if (!token) {
      setLoading(false);
      setError("Missing portal token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/service/portal/tickets?token=${queryToken}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load tickets");
      setTickets(body.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryToken]);

  async function createTicket() {
    if (!token || !subject.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(`/api/service/portal/tickets?token=${queryToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          description: message.trim() || undefined,
          source: "web",
          category: "support",
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create ticket");

      setSubject("");
      setMessage("");
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create ticket");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-bold text-slate-900">Customer Support Portal</h1>
          <p className="mt-1 text-sm text-slate-600">
            View your support tickets and submit new requests.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Create Ticket
          </h2>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe your issue"
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            onClick={createTicket}
            disabled={creating || !subject.trim()}
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
          >
            {creating ? "Submitting..." : "Submit ticket"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3">
            Your Tickets
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading tickets...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-slate-500">No tickets found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/portal/tickets/${ticket.id}?token=${queryToken}`}
                  className="block py-3"
                >
                  <p className="text-sm font-medium text-slate-900">{ticket.subject}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="capitalize">Status: {ticket.status.replace("_", " ")}</span>
                    <span className="capitalize">Priority: {ticket.priority}</span>
                    <span>
                      SLA: {ticket.sla?.breached ? "Breached" : ticket.sla?.atRisk ? "At risk" : "On track"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
