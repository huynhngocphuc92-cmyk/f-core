"use client";

import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { TrackingStatusBadge } from "./TrackingStatusBadge";
import {
  User,
  Building2,
  Handshake,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailCardProps {
  email: {
    id: string;
    subject: string | null;
    fromEmail: string;
    fromName: string | null;
    toRecipients: EmailRecipient[];
    status: string;
    direction: string;
    sentAt: string | null;
    createdAt: string;
    openCount: number;
    clickCount: number;
    bodyText: string | null;
    bodyHtml: string | null;
    contact?: { id: string; firstName: string | null; lastName: string | null } | null;
    company?: { id: string; name: string } | null;
    deal?: { id: string; name: string } | null;
    owner?: { id: string; name: string | null } | null;
  };
  onClick?: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getRecipientDisplay(recipients: EmailRecipient[]): string {
  if (!recipients || recipients.length === 0) return "No recipient";
  const first = recipients[0];
  const display = first.name || first.email;
  if (recipients.length === 1) return display;
  return `${display} +${recipients.length - 1}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function EmailCard({ email, onClick }: EmailCardProps) {
  const [expanded, setExpanded] = useState(false);

  const recipients = (email.toRecipients || []) as EmailRecipient[];
  const preview = email.bodyText || (email.bodyHtml ? stripHtml(email.bodyHtml) : "");

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-lg",
        "hover:border-gray-300 hover:shadow-sm transition-all duration-150",
        "cursor-pointer"
      )}
      onClick={() => onClick?.(email.id)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Subject */}
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {email.subject || "(No subject)"}
            </h3>
            {/* Recipients */}
            <p className="text-xs text-gray-500 mt-0.5">
              {email.direction === "outbound" ? "To: " : "From: "}
              {email.direction === "outbound"
                ? getRecipientDisplay(recipients)
                : email.fromName || email.fromEmail}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <TrackingStatusBadge
              status={email.status as "draft" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed"}
              openCount={email.openCount}
              clickCount={email.clickCount}
            />
            <span className="text-xs text-gray-400">
              {formatDate(email.sentAt || email.createdAt)}
            </span>
          </div>
        </div>

        {/* Preview text */}
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{preview}</p>

        {/* Associations & Expand */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            {email.contact && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                {email.contact.firstName} {email.contact.lastName}
              </span>
            )}
            {email.company && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Building2 className="w-3 h-3" />
                {email.company.name}
              </span>
            )}
            {email.deal && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Handshake className="w-3 h-3" />
                {email.deal.name}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && email.bodyHtml && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div
            className="text-sm text-gray-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.bodyHtml) }}
          />
        </div>
      )}
    </div>
  );
}
