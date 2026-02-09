"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  Loader2,
  LayoutDashboard,
  X,
  Inbox,
  Search,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
  _count?: { widgets: number };
}

interface DashboardWidget {
  id: string;
  reportId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// =============================================================================
// DASHBOARDS LIST PAGE
// =============================================================================

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // FETCH DASHBOARDS
  // ---------------------------------------------------------------------------

  const fetchDashboards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboards");
      if (!res.ok) throw new Error("Failed to fetch dashboards");
      const json = await res.json();
      setDashboards(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  // ---------------------------------------------------------------------------
  // FILTER
  // ---------------------------------------------------------------------------

  const filteredDashboards = dashboards.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  // ---------------------------------------------------------------------------
  // CREATE DASHBOARD
  // ---------------------------------------------------------------------------

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create dashboard");
      const json = await res.json();
      setDashboards((prev) => [json.data, ...prev]);
      setShowCreateModal(false);
      setCreateName("");
      setCreateDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE DASHBOARD
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/dashboards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete dashboard");
      setDashboards((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // INLINE RENAME
  // ---------------------------------------------------------------------------

  const startEditing = (dashboard: Dashboard) => {
    setEditingId(dashboard.id);
    setEditName(dashboard.name);
    setActionMenuOpen(null);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/dashboards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename dashboard");
      setDashboards((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: editName.trim() } : d))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setEditingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const widgetCount = (dashboard: Dashboard): number => {
    return dashboard._count?.widgets ?? dashboard.widgets?.length ?? 0;
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="p-6 pt-8">
      {/* Back Link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1.5 text-sm font-medium text-cyan-700">
            {dashboards.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0e7490] transition-colors shadow-lg shadow-cyan-500/25"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Dashboard
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search dashboards..."
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

      {/* Dashboard Cards Grid */}
      {!loading && filteredDashboards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group"
            >
              {/* 3-dot Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() =>
                    setActionMenuOpen(
                      actionMenuOpen === dashboard.id ? null : dashboard.id
                    )
                  }
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {actionMenuOpen === dashboard.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActionMenuOpen(null)}
                    />
                    <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <button
                        onClick={() => startEditing(dashboard)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                      >
                        <Pencil className="w-4 h-4" />
                        Rename
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setDeleteConfirm(dashboard.id);
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
              </div>

              {/* Card Content */}
              <Link href={`/reports/dashboards/${dashboard.id}`} className="block">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-5 h-5 text-[#0891b2]" />
                </div>

                {/* Name (inline edit or display) */}
                {editingId === dashboard.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(dashboard.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(dashboard.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.preventDefault()}
                    autoFocus
                    className="text-lg font-semibold text-gray-900 w-full border-b-2 border-[#0891b2] outline-none bg-transparent mb-1"
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {dashboard.name}
                  </h3>
                )}

                {dashboard.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {dashboard.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {widgetCount(dashboard)}{" "}
                    {widgetCount(dashboard) === 1 ? "widget" : "widgets"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(dashboard.createdAt)}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDashboards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-[#0891b2]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {searchQuery ? "No dashboards found" : "No dashboards yet"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchQuery
              ? "Try adjusting your search query."
              : "Create your first dashboard to visualize your reports."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0e7490] transition-colors shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Dashboard
            </button>
          )}
        </div>
      )}

      {/* Create Dashboard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!creating) {
                setShowCreateModal(false);
                setCreateName("");
                setCreateDescription("");
              }
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                New Dashboard
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateName("");
                  setCreateDescription("");
                }}
                disabled={creating}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Overview"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && createName.trim()) handleCreate();
                  }}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="What is this dashboard for?"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateName("");
                  setCreateDescription("");
                }}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createName.trim()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors disabled:opacity-50"
              >
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!deleting) setDeleteConfirm(null);
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Dashboard
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete this dashboard? All widgets within
              it will also be removed. This action cannot be undone.
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
