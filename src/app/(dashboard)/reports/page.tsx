"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Plus,
  Search,
  Star,
  MoreHorizontal,
  Trash2,
  Play,
  Pencil,
  Loader2,
  Inbox,
  LayoutDashboard,
  X,
} from "lucide-react";
import ReportChart from "@/components/reports/ReportChart";
import type { Report } from "@/components/reports/types";

// =============================================================================
// TYPES
// =============================================================================

interface ReportStats {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalRevenue: number;
  dealsWon: number;
  dealsByStage: { name: string; count: number; amount: number; color: string }[];
  contactsByLifecycle: { name: string; count: number }[];
  recentActivities: { name: string; count: number }[];
}

type CategoryFilter = "all" | "sales" | "marketing" | "service" | "custom";

// =============================================================================
// HELPERS
// =============================================================================

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sales", label: "Sales" },
  { key: "marketing", label: "Marketing" },
  { key: "service", label: "Service" },
  { key: "custom", label: "Custom" },
];

const categoryBadgeColor = (category: string): string => {
  switch (category) {
    case "sales":
      return "bg-blue-50 text-blue-700";
    case "marketing":
      return "bg-purple-50 text-purple-700";
    case "service":
      return "bg-green-50 text-green-700";
    case "custom":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRevenue = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
};

// =============================================================================
// REPORTS PAGE
// =============================================================================

export default function ReportsPage() {
  // ---- Stats state ----
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ---- Reports list state ----
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // ---- Filters ----
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);

  // ---- UI state ----
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const res = await fetch("/api/reports/stats");
      if (!res.ok) throw new Error("Failed to fetch report stats");
      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      setReportsError(null);

      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (showFavorites) params.set("favorites", "true");

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const json = await res.json();
      setReports(json.data || []);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setReportsLoading(false);
    }
  }, [activeCategory, searchQuery, showFavorites]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete report");
      setReports((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : "Failed to delete report");
    } finally {
      setDeleting(false);
    }
  };

  // ===========================================================================
  // KPI CARDS
  // ===========================================================================

  const kpiCards = stats
    ? [
        {
          label: "Total Contacts",
          value: stats.totalContacts.toLocaleString(),
          icon: Users,
          color: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          label: "Companies",
          value: stats.totalCompanies.toLocaleString(),
          icon: Building2,
          color: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          label: "Total Deals",
          value: stats.totalDeals.toLocaleString(),
          icon: TrendingUp,
          color: "bg-cyan-50",
          iconColor: "text-[#0891b2]",
        },
        {
          label: "Revenue",
          value: formatRevenue(stats.totalRevenue),
          icon: DollarSign,
          color: "bg-green-50",
          iconColor: "text-green-600",
        },
      ]
    : [];

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="p-6 pt-8">
      {/* ================================================================= */}
      {/* PAGE HEADER                                                       */}
      {/* ================================================================= */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Track your CRM performance with real-time analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reports/dashboards"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboards
          </Link>
          <Link
            href="/reports/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* KPI STATS ROW                                                     */}
      {/* ================================================================= */}
      {statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm animate-pulse"
            >
              <div className="h-10 w-10 rounded-lg bg-gray-100 mb-4" />
              <div className="h-7 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      )}

      {statsError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{statsError}</span>
          <button onClick={() => setStatsError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}
                >
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* CHARTS ROW                                                        */}
      {/* ================================================================= */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Deals by Stage */}
          <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Deals by Stage
            </h2>
            <ReportChart
              chartType="bar"
              data={stats.dealsByStage.map((d) => ({
                name: d.name,
                count: d.count,
                amount: d.amount,
              }))}
              colors={
                stats.dealsByStage.length > 0
                  ? stats.dealsByStage.map((d) => d.color)
                  : undefined
              }
            />
          </div>

          {/* Contacts by Lifecycle */}
          <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Contacts by Lifecycle
            </h2>
            <ReportChart
              chartType="pie"
              data={stats.contactsByLifecycle.map((d) => ({
                name: d.name,
                count: d.count,
              }))}
            />
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CUSTOM REPORTS SECTION                                            */}
      {/* ================================================================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Custom Reports</h2>
        </div>

        {/* Search + Favorites + New Report */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFavorites((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              showFavorites
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Star
              className={`w-4 h-4 ${showFavorites ? "fill-amber-400 text-amber-400" : ""}`}
            />
            Favorites
          </button>

          <Link
            href="/reports/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeCategory === tab.key
                  ? "border-[#0891b2] text-[#0891b2]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {reportsError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{reportsError}</span>
            <button onClick={() => setReportsError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading */}
        {reportsLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
          </div>
        )}

        {/* Reports Grid */}
        {!reportsLoading && reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="group rounded-2xl bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all relative"
              >
                {/* Top Row: Chart Icon + Menu */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-[#0891b2]" />
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${categoryBadgeColor(report.category)}`}
                    >
                      {report.category}
                    </span>
                  </div>

                  {/* Favorite + More Menu */}
                  <div className="flex items-center gap-1">
                    {report.isFavorite && (
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    )}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActionMenuOpen(
                            actionMenuOpen === report.id ? null : report.id
                          );
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuOpen === report.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <Link
                              href={`/reports/${report.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                              onClick={() => setActionMenuOpen(null)}
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                // Run report -- navigates to view
                                window.location.href = `/reports/${report.id}`;
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                            >
                              <Play className="w-4 h-4" />
                              Run
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => {
                                setDeleteConfirm(report.id);
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
                  </div>
                </div>

                {/* Report Name & Description */}
                <Link href={`/reports/${report.id}`} className="block">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#0891b2] transition-colors line-clamp-1">
                    {report.name}
                  </h3>
                  {report.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </Link>

                {/* Footer Meta */}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {report.runCount} runs
                  </span>
                  {report.lastRunAt && (
                    <span>Last run {formatDate(report.lastRunAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!reportsLoading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-[#0891b2]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {searchQuery || activeCategory !== "all" || showFavorites
                ? "No reports found"
                : "No reports yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery || activeCategory !== "all" || showFavorites
                ? "Try adjusting your search or filter."
                : "Create your first custom report to start tracking metrics."}
            </p>
            {!searchQuery && activeCategory === "all" && !showFavorites && (
              <Link
                href="/reports/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Report
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* DASHBOARDS LINK                                                   */}
      {/* ================================================================= */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-[#0891b2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Dashboards</h3>
              <p className="text-xs text-gray-500">
                Combine reports into interactive dashboards.
              </p>
            </div>
          </div>
          <Link
            href="/reports/dashboards"
            className="text-sm font-medium text-[#0891b2] hover:text-[#0e7490] transition-colors"
          >
            Manage Dashboards →
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                         */}
      {/* ================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Report
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete this report? This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
