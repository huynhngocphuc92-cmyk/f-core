"use client";

import { useState, useCallback } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  Send,
  X,
  Paperclip,
  ChevronDown,
} from "lucide-react";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (data: EmailComposeData) => void;
  initialData?: Partial<EmailComposeData>;
  contacts?: Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null }>;
}

interface EmailComposeData {
  toRecipients: EmailRecipient[];
  ccRecipients?: EmailRecipient[];
  bccRecipients?: EmailRecipient[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  isDraft?: boolean;
}

export function EmailComposeModal({
  isOpen,
  onClose,
  onSend,
  initialData,
}: EmailComposeModalProps) {
  const [toInput, setToInput] = useState(
    initialData?.toRecipients?.map((r) => r.email).join(", ") || ""
  );
  const [ccInput, setCcInput] = useState("");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [bodyText, setBodyText] = useState(initialData?.bodyText || "");
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);

  const parseRecipients = (input: string): EmailRecipient[] => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((email) => ({ email }));
  };

  const handleSend = useCallback(
    async (isDraft = false) => {
      const to = parseRecipients(toInput);
      if (to.length === 0 && !isDraft) return;

      setSending(true);
      try {
        const data: EmailComposeData = {
          toRecipients: to,
          ccRecipients: showCc ? parseRecipients(ccInput) : undefined,
          subject,
          bodyHtml: `<p>${bodyText.replace(/\n/g, "</p><p>")}</p>`,
          bodyText,
          isDraft,
          contactId: initialData?.contactId,
          companyId: initialData?.companyId,
          dealId: initialData?.dealId,
        };

        if (onSend) {
          onSend(data);
        } else {
          await fetch("/api/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        }
        onClose();
      } catch (error) {
        console.error("Failed to send email:", error);
      } finally {
        setSending(false);
      }
    },
    [toInput, ccInput, subject, bodyText, showCc, initialData, onSend, onClose]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose Email" size="lg">
      <div className="space-y-4">
        {/* To field */}
        <div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-500 w-12">To</label>
            <input
              type="text"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              placeholder="recipient@example.com"
              className={cn(
                "flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
                "placeholder:text-gray-400"
              )}
            />
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cc
              </button>
            )}
          </div>
        </div>

        {/* Cc field (optional) */}
        {showCc && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-500 w-12">Cc</label>
            <input
              type="text"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              placeholder="cc@example.com"
              className={cn(
                "flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
                "placeholder:text-gray-400"
              )}
            />
            <button
              onClick={() => setShowCc(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-500 w-12">Subj</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className={cn(
              "flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
              "placeholder:text-gray-400"
            )}
          />
        </div>

        {/* Body */}
        <div>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Write your email..."
            rows={12}
            className={cn(
              "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
              "placeholder:text-gray-400"
            )}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 text-gray-400">
          <button
            className="p-1.5 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
            title="Templates"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="text-xs">Templates</span>
          </button>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={() => handleSend(true)}
          disabled={sending}
          className={cn(
            "px-4 py-2 text-sm font-medium text-gray-700",
            "bg-white border border-gray-300 rounded-lg",
            "hover:bg-gray-50 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSend(false)}
          disabled={sending || !toInput.trim()}
          className={cn(
            "px-4 py-2 text-sm font-medium text-white",
            "bg-cyan-600 rounded-lg",
            "hover:bg-cyan-700 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "inline-flex items-center gap-2"
          )}
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending..." : "Log Email"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
