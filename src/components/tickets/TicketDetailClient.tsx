"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export function TicketDetailClient({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isInternal }),
      });

      if (res.ok) {
        setContent("");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => setIsInternal(false)}
          className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
            !isInternal
              ? "bg-[#0891b2] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Reply
        </button>
        <button
          onClick={() => setIsInternal(true)}
          className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
            isInternal
              ? "bg-amber-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Internal Note
        </button>
      </div>
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isInternal ? "Add an internal note..." : "Write a reply..."}
          className={`flex-1 px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:border-[#0891b2] ${
            isInternal ? "bg-amber-50/50 border-amber-200" : "border-gray-200"
          }`}
          rows={2}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="self-end px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
