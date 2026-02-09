"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Play,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  BarChart3,
  Calendar,
  Database,
  Filter as LucideFilter,
  Clock,
  Pencil,
} from "lucide-react";
import ReportChart from "@/components/reports/ReportChart";
import type { Report, ChartDataPoint } from "@/components/reports/types";

// =============================================================================
// CATEGORY BADGE STYLES
// =============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  sales: "bg-blue-50 text-blue-700",
  marketing: "bg-purple-50 text-purple-700",
  service: "bg-green-50 text-green-700",
  custom: "bg-gray-100 text-gray-700",
};

// =============================================================================
// REPORT DETAIL PAGE
// =============================================================================

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  // ---------------------------------------------------------------------------
  // Load report data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) throw new Error("Failed to load report");
        const json = await res.json();
        setReport(json.data ?? json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId]);

  // ---------------------------------------------------------------------------
  // Run report
  // ---------------------------------------------------------------------------
  const handleRunReport = useCallback(async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await fetch(`/api/reports/${reportId}/run`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to run report");
      const json = await res.json();
      setChartData(json.data ?? []);

      // Update local run metadata
      setReport((prev) =>
        prev
          ? {
              ...prev,
              runCount: prev.runCount + 1,
              lastRunAt: new Date().toISOString(),
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run report");
    } finally {
      setRunning(false);
    }
  }, [reportId]);

  // Auto-run report on page load once report data is available
  useEffect(() => {
    if (report && chartData.length === 0 && !running) {
      handleRunReport();
    }
    // Only trigger once when report first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id]);

  // ---------------------------------------------------------------------------
  // Toggle favorite
  // ---------------------------------------------------------------------------
  const handleToggleFavorite = async () => {
    if (!report) return;
    try {
      setTogglingFavorite(true);
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !report.isFavorite }),
      });
      if (!res.ok) throw new Error("Failed to update favorite status");
      setReport({ ...report, isFavorite: !report.isFavorite });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingFavorite(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete report
  // ---------------------------------------------------------------------------
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete report");
      router.push("/reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatOperator = (op: string): string => {
    const ops: Record<string, string> = {
      eq: "equals",
      neq: "not equals",
      gt: "greater than",
      gte: "greater or equal",
      lt: "less than",
      lte: "less or equal",
      contains: "contains",
      in: "in",
    };
    return ops[op] ?? op;
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">Report not found</p>
        <Link
          href="/reports"
          className="text-[#0891b2] hover:text-[#0ea5e9] text-sm font-medium"
        >
          Back to Reports
        </Link>
      </div>
    );
  }

  const categoryColor =
    CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS.custom;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 pt-8 max-w-5xl">
      {/* Back link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
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
            <BarChart3 className="w-6 h-6 text-[#0891b2]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {report.name}
              </h1>
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${categoryColor}`}
              >
                {report.category}
              </span>
              <button
                onClick={handleToggleFavorite}
                disabled={togglingFavorite}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                title={
                  report.isFavorite
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                <Star
                  className={`w-5 h-5 ${
                    report.isFavorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              </button>
            </div>
            {report.description && (
              <p className="text-gray-500 mt-1 text-sm">
                {report.description}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/reports/${reportId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleRunReport}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
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

      {/* Chart Card */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Report Results
          </h2>
          {running && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </div>
          )}
        </div>
        {chartData.length > 0 ? (
          <ReportChart
            chartType={report.definition.chart.chartType}
            data={chartData}
            stacked={report.definition.chart.stacked}
            showLegend={report.definition.chart.showLegend}
            showGrid={report.definition.chart.showGrid}
            colors={report.definition.chart.colors}
          />
        ) : !running ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <BarChart3 className="w-10 h-10 mb-3" />
            <p className="text-sm">
              No data yet. Click Run to generate the report.
            </p>
          </div>
        ) : null}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Data Source */}
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Database className="w-5 h-5 text-[#0891b2]" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Data Source
            </h3>
          </div>
          <p className="text-sm text-gray-700 capitalize">
            {report.definition.dataSource}
          </p>
        </div>

        {/* Date Range */}
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Date Range</h3>
          </div>
          {report.definition.dateRange ? (
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="text-gray-500">Type:</span>{" "}
                <span className="capitalize">
                  {report.definition.dateRange.type}
                </span>
              </p>
              {report.definition.dateRange.preset && (
                <p>
                  <span className="text-gray-500">Preset:</span>{" "}
                  <span className="capitalize">
                    {report.definition.dateRange.preset}
                  </span>
                </p>
              )}
              {report.definition.dateRange.start && (
                <p>
                  <span className="text-gray-500">Start:</span>{" "}
                  {report.definition.dateRange.start}
                </p>
              )}
              {report.definition.dateRange.end && (
                <p>
                  <span className="text-gray-500">End:</span>{" "}
                  {report.definition.dateRange.end}
                </p>
              )}
              <p>
                <span className="text-gray-500">Date Field:</span>{" "}
                <span className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded">
                  {report.definition.dateRange.dateField}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">All time</p>
          )}
        </div>
      </div>

      {/* Metrics & Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Metrics */}
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Metrics</h3>
          {report.definition.metrics.length > 0 ? (
            <div className="space-y-2">
              {report.definition.metrics.map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">
                    {metric.label || metric.field}
                  </span>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 uppercase">
                    {metric.aggregate}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No metrics defined</p>
          )}
        </div>

        {/* Dimensions */}
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Dimensions
          </h3>
          {report.definition.dimensions.length > 0 ? (
            <div className="space-y-2">
              {report.definition.dimensions.map((dimension, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">
                    {dimension.label || dimension.field}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {dimension.type}
                    </span>
                    {dimension.granularity && (
                      <span className="text-xs font-medium text-[#0891b2] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {dimension.granularity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No dimensions defined
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <LucideFilter className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        {report.definition.filters.length > 0 ? (
          <div className="space-y-2">
            {report.definition.filters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg text-sm"
              >
                <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                  {filter.field}
                </span>
                <span className="text-gray-500">
                  {formatOperator(filter.operator)}
                </span>
                <span className="text-gray-700 font-medium">
                  {String(filter.value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No filters applied</p>
        )}
      </div>

      {/* Run History */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Run History</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Runs
            </label>
            <p className="text-2xl font-bold text-gray-900">
              {report.runCount}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Last Run
            </label>
            <p className="text-sm text-gray-700">
              {report.lastRunAt ? formatDate(report.lastRunAt) : "Never"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Created
            </label>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {formatDate(report.createdAt)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Last Updated
            </label>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {formatDate(report.updatedAt)}
            </div>
          </div>
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
              Delete Report
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete &quot;{report.name}&quot;? This
              action cannot be undone.
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
