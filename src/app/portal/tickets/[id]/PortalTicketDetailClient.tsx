"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PortalReply = {
  id: string;
  body: string | null;
  createdAt: string;
};

type PortalTicketDetail = {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  sla?: {
    breached: boolean;
    atRisk: boolean;
  };
};

export default function PortalTicketDetailClient({ id, token }: { id: string; token: string }) {
  const queryToken = useMemo(() => encodeURIComponent(token), [token]);

  const [ticket, setTicket] = useState<PortalTicketDetail | null>(null);
  const [replies, setReplies] = useState<PortalReply[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTicket() {
    if (!token || !id) {
      setLoading(false);
      setError("Missing portal token or ticket id");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/service/portal/tickets/${id}?token=${queryToken}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load ticket");
      setTicket(body.ticket || null);
      setReplies(body.replies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ticket");
      setTicket(null);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, queryToken]);

  async function sendReply() {
    if (!token || !id || !message.trim()) return;

    setPosting(true);
    setError(null);

    try {
      const response = await fetch(`/api/service/portal/tickets/${id}/reply?token=${queryToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to send reply");
      setMessage("");
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reply");
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/portal/tickets?token=${queryToken}`}
          className="inline-flex text-sm text-cyan-700 hover:text-cyan-800"
        >
          Back to tickets
        </Link>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading ticket...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : !ticket ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Ticket not found.
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="capitalize">Status: {ticket.status.replace("_", " ")}</span>
                <span className="capitalize">Priority: {ticket.priority}</span>
                <span>
                  SLA: {ticket.sla?.breached ? "Breached" : ticket.sla?.atRisk ? "At risk" : "On track"}
                </span>
              </div>
              {ticket.description && (
                <p className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Conversation
              </h2>

              {replies.length === 0 ? (
                <p className="text-sm text-slate-500">No replies yet.</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <article key={reply.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{reply.body || ""}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(reply.createdAt).toLocaleString("en-US")}
                      </p>
                    </article>
                  ))}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Reply to support team"
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  onClick={sendReply}
                  disabled={posting || !message.trim()}
                  className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                >
                  {posting ? "Sending..." : "Send reply"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
