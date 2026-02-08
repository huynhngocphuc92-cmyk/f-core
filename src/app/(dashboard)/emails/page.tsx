"use client";

import { useState, useEffect, useCallback } from "react";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { EmailCard } from "@/components/emails/EmailCard";
import { EmailComposeModal } from "@/components/emails/EmailComposeModal";
import { TrackingStatusBadge } from "@/components/emails/TrackingStatusBadge";
import {
  Plus,
  Search,
  Filter,
  Mail,
  Send,
  Eye,
  MousePointerClick,
  ArrowUpDown,
} from "lucide-react";

interface EmailData {
  id: string;
  subject: string | null;
  fromEmail: string;
  fromName: string | null;
  toRecipients: Array<{ email: string; name?: string }>;
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
}

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);

  const fetchEmails = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/emails?${params.toString()}`);
      const data = await res.json();
      setEmails(data.data || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleEmailClick = (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (email) {
      setSelectedEmail(selectedEmail?.id === id ? null : email);
    }
  };

  // Stats
  const totalSent = emails.filter((e) => e.status === "sent").length;
  const totalOpened = emails.filter((e) => e.openCount > 0).length;
  const totalClicked = emails.filter((e) => e.clickCount > 0).length;

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your email communications
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5",
            "bg-cyan-600 text-white text-sm font-medium rounded-lg",
            "hover:bg-cyan-700 transition-colors",
            "shadow-sm"
          )}
        >
          <Plus className="w-4 h-4" />
          Log Email
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Mail className="w-4 h-4" />
            <span className="text-xs font-medium">Total Emails</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {pagination?.total || 0}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Send className="w-4 h-4" />
            <span className="text-xs font-medium">Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-cyan-600 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-medium">Opened</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOpened}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <MousePointerClick className="w-4 h-4" />
            <span className="text-xs font-medium">Clicked</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalClicked}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className={cn(
              "w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
              "placeholder:text-gray-400"
            )}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            "px-3 py-2 text-sm border border-gray-200 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500",
            "text-gray-700 bg-white"
          )}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="bounced">Bounced</option>
        </select>

        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 text-sm",
            "border border-gray-200 rounded-lg",
            "hover:bg-gray-50 transition-colors text-gray-700"
          )}
        >
          <Filter className="w-4 h-4" />
          More Filters
        </button>

        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 text-sm",
            "border border-gray-200 rounded-lg",
            "hover:bg-gray-50 transition-colors text-gray-700"
          )}
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort
        </button>
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No emails yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Log your first email to start tracking
            </p>
            <button
              onClick={() => setShowCompose(true)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2",
                "bg-cyan-600 text-white text-sm font-medium rounded-lg",
                "hover:bg-cyan-700 transition-colors"
              )}
            >
              <Plus className="w-4 h-4" />
              Log Email
            </button>
          </div>
        ) : (
          emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              onClick={handleEmailClick}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total} emails
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmails(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={cn(
                "px-3 py-1.5 text-sm border border-gray-200 rounded-lg",
                "hover:bg-gray-50 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchEmails(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={cn(
                "px-3 py-1.5 text-sm border border-gray-200 rounded-lg",
                "hover:bg-gray-50 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Selected Email Detail */}
      {selectedEmail && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedEmail(null)}
          />
          <div className="relative ml-auto w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <TrackingStatusBadge
                  status={selectedEmail.status as "sent" | "draft" | "opened" | "clicked"}
                  openCount={selectedEmail.openCount}
                  clickCount={selectedEmail.clickCount}
                />
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedEmail.subject || "(No subject)"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                From: {selectedEmail.fromName || selectedEmail.fromEmail}
              </p>
              <p className="text-sm text-gray-500">
                To:{" "}
                {(selectedEmail.toRecipients as Array<{ email: string }>)
                  ?.map((r) => r.email)
                  .join(", ")}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {selectedEmail.sentAt
                  ? new Date(selectedEmail.sentAt).toLocaleString()
                  : new Date(selectedEmail.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Tracking Stats */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <Eye className="w-3.5 h-3.5 text-cyan-600" />
                {selectedEmail.openCount} opens
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
                {selectedEmail.clickCount} clicks
              </span>
            </div>

            {/* Email Body */}
            <div className="p-6">
              {selectedEmail.bodyHtml ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedEmail.bodyHtml),
                  }}
                />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedEmail.bodyText || "No content"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <EmailComposeModal
        isOpen={showCompose}
        onClose={() => {
          setShowCompose(false);
          fetchEmails();
        }}
      />
    </div>
  );
}
