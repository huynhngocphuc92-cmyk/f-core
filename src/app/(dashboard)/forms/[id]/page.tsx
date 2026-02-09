"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Eye,
  Globe,
  Copy,
  Trash2,
  Loader2,
  BarChart3,
  Users,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  X,
  FileText,
  GlobeLock,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Form {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number };
}

interface Submission {
  id: string;
  data: Record<string, string>;
  contact?: { id: string; firstName: string | null; lastName: string | null; email: string };
  isSpam: boolean;
  submittedAt: string;
}

// =============================================================================
// FORM DETAIL PAGE
// =============================================================================

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [formRes, subsRes] = await Promise.all([
          fetch(`/api/forms/${formId}`),
          fetch(`/api/forms/${formId}/submissions?limit=5`),
        ]);

        if (!formRes.ok) throw new Error("Failed to load form");
        const formData = await formRes.json();
        setForm(formData);

        if (subsRes.ok) {
          const subsData = await subsRes.json();
          setSubmissions(Array.isArray(subsData) ? subsData : subsData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [formId]);

  // Toggle publish/unpublish
  const handleTogglePublish = async () => {
    if (!form) return;
    try {
      setToggling(true);
      if (form.status === "published") {
        // Unpublish: use PATCH to set status to draft
        const res = await fetch(`/api/forms/${formId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "draft" }),
        });
        if (!res.ok) throw new Error("Failed to update status");
        setForm({ ...form, status: "draft" });
      } else {
        // Publish: use POST /publish endpoint
        const res = await fetch(`/api/forms/${formId}/publish`, {
          method: "POST",
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to publish form");
        }
        setForm({ ...form, status: "published" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setToggling(false);
    }
  };

  // Duplicate
  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate form");
      const newForm = await res.json();
      router.push(`/forms/${newForm.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/forms/${formId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      router.push("/forms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

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

  // Conversion rate
  const conversionRate =
    form && form.viewCount > 0
      ? (((form._count?.submissions ?? 0) / form.viewCount) * 100).toFixed(1)
      : "0.0";

  // Public URL
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${formId}`
      : `/f/${formId}`;

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">Form not found</p>
        <Link
          href="/forms"
          className="text-[#0891b2] hover:text-[#0ea5e9] text-sm font-medium"
        >
          Back to Forms
        </Link>
      </div>
    );
  }

  const statusColor =
    form.status === "published"
      ? "bg-green-50 text-green-700"
      : form.status === "draft"
        ? "bg-yellow-50 text-yellow-700"
        : "bg-gray-100 text-gray-600";

  return (
    <div className="p-6 pt-8 max-w-5xl">
      {/* Back link */}
      <Link
        href="/forms"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Forms
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
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#0891b2]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusColor}`}
              >
                {form.status}
              </span>
            </div>
            {form.description && (
              <p className="text-gray-500 mt-1 text-sm">{form.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Views
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{form.viewCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Submissions
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {form._count?.submissions ?? 0}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Conversion Rate
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/forms/${formId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Form
          </Link>
          <Link
            href={`/forms/${formId}/submissions`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            View Submissions
          </Link>
          <button
            onClick={handleTogglePublish}
            disabled={toggling}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : form.status === "published" ? (
              <GlobeLock className="w-4 h-4" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {form.status === "published" ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={handleDuplicate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm mb-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Submissions
          </h2>
          <Link
            href={`/forms/${formId}/submissions`}
            className="text-sm font-medium text-[#0891b2] hover:text-[#0ea5e9] transition-colors"
          >
            View all
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">No submissions yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.slice(0, 5).map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(sub.submittedAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {sub.contact?.email || "Anonymous"}
                  </td>
                  <td className="px-6 py-4">
                    {sub.isSpam ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                        Spam
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-600">
                        Valid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Embed Info */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Share & Embed
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Share this URL to let people fill out your form.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 font-mono truncate">
            {publicUrl}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          {form.status === "published" && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0891b2] bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </a>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Form
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete &quot;{form.name}&quot;? This
              action cannot be undone. All submissions will also be deleted.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
