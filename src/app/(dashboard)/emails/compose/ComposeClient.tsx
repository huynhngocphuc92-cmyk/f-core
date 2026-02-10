"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { sendEmail } from "@/app/actions/emails";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
};

export default function ComposeClient({
  templates,
  prefillTo,
  prefillContactId,
}: {
  templates: Template[];
  prefillTo?: string;
  prefillContactId?: string;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await sendEmail(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/emails");
      }
    });
  }

  return (
    <div className="p-6 pt-8 max-w-3xl">
      <Link
        href="/emails"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Emails
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Compose Email</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {prefillContactId && (
          <input type="hidden" name="contactId" value={prefillContactId} />
        )}

        {/* Template Selector */}
        {templates.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100">
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Template
            </label>
            <select
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white"
              defaultValue=""
            >
              <option value="">None (blank email)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.category ? `(${t.category})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* To */}
        <div className="px-6 py-3 border-b border-gray-100">
          <label className="text-xs text-gray-500 uppercase tracking-wide">To</label>
          <input
            name="to"
            type="email"
            required
            defaultValue={prefillTo || ""}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
            placeholder="recipient@example.com"
          />
        </div>

        {/* CC / BCC */}
        <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
          <div className="px-6 py-3 border-r border-gray-100">
            <label className="text-xs text-gray-500 uppercase tracking-wide">CC</label>
            <input
              name="cc"
              type="text"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              placeholder="Optional"
            />
          </div>
          <div className="px-6 py-3">
            <label className="text-xs text-gray-500 uppercase tracking-wide">BCC</label>
            <input
              name="bcc"
              type="text"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Subject */}
        <div className="px-6 py-3 border-b border-gray-100">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Subject</label>
          <input
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
            placeholder="Email subject"
          />
        </div>

        {/* Body */}
        <div className="px-6 py-3">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Body</label>
          <textarea
            name="body"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
            placeholder="Write your email..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Link
            href="/emails"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isPending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
