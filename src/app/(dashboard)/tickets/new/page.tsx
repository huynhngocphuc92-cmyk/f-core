"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface Company {
  id: string;
  name: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    source: "web",
    contactId: "",
    companyId: "",
  });

  useEffect(() => {
    fetch("/api/contacts?limit=100")
      .then((r) => r.json())
      .then((d) => setContacts(d.data || []))
      .catch(() => {});
    fetch("/api/companies?limit=100")
      .then((r) => r.json())
      .then((d) => setCompanies(d.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...form,
        contactId: form.contactId || undefined,
        companyId: form.companyId || undefined,
        category: form.category || undefined,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const ticket = await res.json();
        router.push(`/tickets/${ticket.id}`);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Failed to create ticket (${res.status})`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-6 pt-8 max-w-2xl">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Ticket</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief description of the issue"
              className={inputClass}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide details about the issue..."
              className={`${inputClass} resize-none`}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                <option value="">Select category</option>
                <option value="bug">Bug</option>
                <option value="feature_request">Feature Request</option>
                <option value="question">Question</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Source */}
            <div>
              <label className={labelClass}>Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className={inputClass}
              >
                <option value="web">Web</option>
                <option value="email">Email</option>
                <option value="chat">Chat</option>
                <option value="phone">Phone</option>
                <option value="api">API</option>
              </select>
            </div>
          </div>
        </div>

        {/* Associations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Associations</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact</label>
              <select
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                className={inputClass}
              >
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Company</label>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className={inputClass}
              >
                <option value="">None</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/tickets"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!form.title.trim() || submitting}
            className="px-6 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
