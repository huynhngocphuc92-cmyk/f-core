"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  Loader2,
  Inbox,
  X,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Form {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number; fields: number };
}

type FilterTab = "all" | "draft" | "published" | "archived";

// =============================================================================
// FORMS LIST PAGE
// =============================================================================

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch forms
  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/forms");
      if (!res.ok) throw new Error("Failed to fetch forms");
      const data = await res.json();
      setForms(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Filter forms
  const filteredForms = forms.filter((form) => {
    const matchesTab = activeTab === "all" || form.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      form.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Delete form
  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      setForms((prev) => prev.filter((f) => f.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Duplicate form
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/forms/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate form");
      await fetchForms();
      setActionMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  // Tab counts
  const tabCounts = {
    all: forms.length,
    draft: forms.filter((f) => f.status === "draft").length,
    published: forms.filter((f) => f.status === "published").length,
    archived: forms.filter((f) => f.status === "archived").length,
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "published", label: "Published" },
    { key: "archived", label: "Archived" },
  ];

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Status badge color
  const statusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-50 text-green-700";
      case "draft":
        return "bg-yellow-50 text-yellow-700";
      case "archived":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1.5 text-sm font-medium text-cyan-700">
            {forms.length}
          </span>
        </div>
        <Link
          href="/forms/new"
          className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Form
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#0891b2] text-[#0891b2]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
        </div>
      )}

      {/* Forms Table */}
      {!loading && filteredForms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-16 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredForms.map((form) => (
                <tr
                  key={form.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/forms/${form.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-[#0891b2]" />
                      </div>
                      <span className="font-medium text-gray-900 hover:text-[#0891b2] transition-colors">
                        {form.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusColor(form.status)}`}
                    >
                      {form.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {form._count?.submissions ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {form.viewCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(form.createdAt)}
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() =>
                        setActionMenuOpen(
                          actionMenuOpen === form.id ? null : form.id,
                        )
                      }
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Action Menu Dropdown */}
                    {actionMenuOpen === form.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div className="absolute right-6 top-12 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                          <Link
                            href={`/forms/${form.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setActionMenuOpen(null)}
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDuplicate(form.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <Link
                            href={`/forms/${form.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setActionMenuOpen(null)}
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              setDeleteConfirm(form.id);
                              setActionMenuOpen(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredForms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-[#0891b2]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {searchQuery || activeTab !== "all"
              ? "No forms found"
              : "No forms yet"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchQuery || activeTab !== "all"
              ? "Try adjusting your search or filter."
              : "Create your first form to start collecting data."}
          </p>
          {!searchQuery && activeTab === "all" && (
            <Link
              href="/forms/new"
              className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Form
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Form
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete this form? This action cannot be
              undone. All submissions will also be deleted.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
