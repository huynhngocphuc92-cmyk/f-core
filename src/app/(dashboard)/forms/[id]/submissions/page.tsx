"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Submission {
  id: string;
  data: Record<string, string>;
  contact?: { id: string; firstName: string | null; lastName: string | null; email: string };
  isSpam: boolean;
  submittedAt: string;
}

interface Form {
  id: string;
  name: string;
}

// =============================================================================
// SUBMISSIONS PAGE
// =============================================================================

export default function SubmissionsPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 20;

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [formRes, subsRes] = await Promise.all([
          fetch(`/api/forms/${formId}`),
          fetch(
            `/api/forms/${formId}/submissions?page=${page}&limit=${perPage}`,
          ),
        ]);

        if (!formRes.ok) throw new Error("Failed to load form");
        const formData = await formRes.json();
        setForm(formData);

        if (subsRes.ok) {
          const subsData = await subsRes.json();
          if (Array.isArray(subsData)) {
            setSubmissions(subsData);
            setTotalPages(1);
          } else {
            setSubmissions(subsData.data || []);
            setTotalPages(subsData.pagination?.totalPages || 1);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [formId, page]);

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  return (
    <div className="p-6 pt-8 max-w-5xl">
      {/* Back link */}
      <Link
        href={`/forms/${formId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {form?.name || "Form"}
      </Link>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {form?.name} &mdash; {submissions.length} submission
          {submissions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No submissions yet
          </h3>
          <p className="text-gray-500 text-sm">
            Submissions will appear here once people fill out your form.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub.id;
                const dataKeys = Object.keys(sub.data || {});
                const previewKeys = dataKeys.slice(0, 2);

                return (
                  <React.Fragment key={sub.id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : sub.id)
                      }
                    >
                      <td className="px-4 py-4">
                        <button className="p-0.5 text-gray-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(sub.submittedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {sub.contact?.email || "Anonymous"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {previewKeys.length > 0
                          ? previewKeys
                              .map(
                                (k) =>
                                  `${k}: ${String(sub.data[k]).substring(0, 30)}`,
                              )
                              .join(" | ")
                          : "-"}
                        {dataKeys.length > 2 && (
                          <span className="text-gray-400">
                            {" "}
                            +{dataKeys.length - 2} more
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {sub.isSpam ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                            <ShieldAlert className="w-3 h-3" />
                            Spam
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-600">
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="max-w-2xl">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                              Submission Details
                            </h4>
                            {dataKeys.length === 0 ? (
                              <p className="text-sm text-gray-400">
                                No data recorded.
                              </p>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                {dataKeys.map((key) => (
                                  <div key={key}>
                                    <dt className="text-xs font-medium text-gray-500 uppercase">
                                      {key}
                                    </dt>
                                    <dd className="text-sm text-gray-900 mt-0.5">
                                      {String(sub.data[key]) || "-"}
                                    </dd>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-400">
                                Submission ID: {sub.id}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
