"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Loader2,
  X,
  Inbox,
  Search,
  Trash2,
} from "lucide-react";
import ReportChart from "@/components/reports/ReportChart";
import type { ChartDataPoint } from "@/components/reports/types";

// =============================================================================
// TYPES
// =============================================================================

interface Report {
  id: string;
  name: string;
  description?: string;
  category: string;
  definition: {
    dataSource: string;
    chart: { chartType: string };
  };
  isFavorite: boolean;
  runCount: number;
}

interface DashboardWidget {
  id: string;
  reportId: string;
  report?: Report;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

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

// =============================================================================
// WIDGET CHART DATA CACHE
// =============================================================================

interface WidgetChartData {
  loading: boolean;
  data: ChartDataPoint[] | null;
  error: string | null;
}

// =============================================================================
// SIZE OPTIONS
// =============================================================================

const WIDTH_OPTIONS = [
  { value: 4, label: "Small (4 cols)" },
  { value: 6, label: "Medium (6 cols)" },
  { value: 8, label: "Large (8 cols)" },
  { value: 12, label: "Full Width (12 cols)" },
];

const HEIGHT_OPTIONS = [
  { value: 1, label: "Short (1 row)" },
  { value: 2, label: "Medium (2 rows)" },
  { value: 3, label: "Tall (3 rows)" },
];

const GRID_COLUMNS = 12;
const GRID_GAP = 24;
const GRID_ROW_HEIGHT = 200;

type WidgetInteraction = {
  type: "drag" | "resize";
  widgetId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  initialX: number;
  initialY: number;
  initialW: number;
  initialH: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function overlap1D(startA: number, spanA: number, startB: number, spanB: number): boolean {
  return startA < startB + spanB && startB < startA + spanA;
}

function widgetsOverlap(a: DashboardWidget, b: DashboardWidget): boolean {
  return overlap1D(a.x, a.w, b.x, b.w) && overlap1D(a.y, a.h, b.y, b.h);
}

function normalizeLayout(widgets: DashboardWidget[]): DashboardWidget[] {
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);
  const placed: DashboardWidget[] = [];

  for (const widget of sorted) {
    const normalized: DashboardWidget = {
      ...widget,
      x: clamp(widget.x, 0, GRID_COLUMNS - 1),
      y: Math.max(0, widget.y),
      w: clamp(widget.w, 1, GRID_COLUMNS),
      h: clamp(widget.h, 1, 12),
    };

    normalized.w = Math.min(normalized.w, GRID_COLUMNS - normalized.x);

    while (placed.some((other) => widgetsOverlap(normalized, other))) {
      normalized.y += 1;
    }

    placed.push(normalized);
  }

  return placed;
}

// =============================================================================
// DASHBOARD DETAIL PAGE
// =============================================================================

export default function DashboardDetailPage() {
  const params = useParams();
  const dashboardId = params.id as string;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add widget modal state
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetW, setWidgetW] = useState(6);
  const [widgetH, setWidgetH] = useState(2);
  const [addingWidget, setAddingWidget] = useState(false);

  // Removing widget state
  const [removingWidgetId, setRemovingWidgetId] = useState<string | null>(null);

  // Chart data per widget
  const [chartDataMap, setChartDataMap] = useState<
    Record<string, WidgetChartData>
  >({});
  const [activeWidgetInteraction, setActiveWidgetInteraction] =
    useState<WidgetInteraction | null>(null);
  const [savingLayout, setSavingLayout] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const widgetsRef = useRef<DashboardWidget[]>([]);
  const pointerTargetRef = useRef<HTMLElement | null>(null);

  // ---------------------------------------------------------------------------
  // FETCH DASHBOARD
  // ---------------------------------------------------------------------------

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/dashboards/${dashboardId}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const json = await res.json();
      const nextDashboard = json.data
        ? {
            ...json.data,
            widgets: normalizeLayout(json.data.widgets || []),
          }
        : null;
      setDashboard(nextDashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [dashboardId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    widgetsRef.current = dashboard?.widgets || [];
  }, [dashboard?.widgets]);

  // ---------------------------------------------------------------------------
  // RUN REPORTS FOR WIDGETS
  // ---------------------------------------------------------------------------

  const runReportForWidget = useCallback(
    async (widget: DashboardWidget) => {
      if (!widget.report) return;

      setChartDataMap((prev) => ({
        ...prev,
        [widget.id]: { loading: true, data: null, error: null },
      }));

      try {
        const res = await fetch(`/api/reports/${widget.report.id}/run`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to run report");
        const json = await res.json();
        setChartDataMap((prev) => ({
          ...prev,
          [widget.id]: {
            loading: false,
            data: json.data || [],
            error: null,
          },
        }));
      } catch (err) {
        setChartDataMap((prev) => ({
          ...prev,
          [widget.id]: {
            loading: false,
            data: null,
            error: err instanceof Error ? err.message : "Failed to load",
          },
        }));
      }
    },
    []
  );

  // Auto-run reports when dashboard loads
  useEffect(() => {
    if (!dashboard?.widgets) return;
    dashboard.widgets.forEach((widget) => {
      if (widget.report && !chartDataMap[widget.id]) {
        runReportForWidget(widget);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard?.widgets]);

  // ---------------------------------------------------------------------------
  // FETCH REPORTS FOR ADD WIDGET MODAL
  // ---------------------------------------------------------------------------

  const fetchReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const json = await res.json();
      setReports(json.data || []);
    } catch {
      // silent fail - user can retry by reopening modal
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const openAddWidgetModal = () => {
    setShowAddWidget(true);
    setSelectedReportId(null);
    setWidgetTitle("");
    setWidgetW(6);
    setWidgetH(2);
    setReportSearch("");
    fetchReports();
  };

  const filteredReports = reports.filter((r) => {
    if (!reportSearch) return true;
    const q = reportSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  // ---------------------------------------------------------------------------
  // ADD WIDGET
  // ---------------------------------------------------------------------------

  const handleAddWidget = async () => {
    if (!selectedReportId || !widgetTitle.trim()) return;

    try {
      setAddingWidget(true);

      // Calculate next y position based on existing widgets
      const maxY =
        dashboard?.widgets.reduce(
          (max, w) => Math.max(max, w.y + w.h),
          0
        ) ?? 0;

      const res = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReportId,
          title: widgetTitle.trim(),
          x: 0,
          y: maxY,
          w: widgetW,
          h: widgetH,
        }),
      });

      if (!res.ok) throw new Error("Failed to add widget");

      setShowAddWidget(false);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add widget");
    } finally {
      setAddingWidget(false);
    }
  };

  // ---------------------------------------------------------------------------
  // REMOVE WIDGET
  // ---------------------------------------------------------------------------

  const handleRemoveWidget = async (widgetId: string) => {
    try {
      setRemovingWidgetId(widgetId);
      const res = await fetch(
        `/api/dashboards/${dashboardId}/widgets?widgetId=${widgetId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove widget");
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          widgets: prev.widgets.filter((w) => w.id !== widgetId),
        };
      });
      setChartDataMap((prev) => {
        const next = { ...prev };
        delete next[widgetId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove widget");
    } finally {
      setRemovingWidgetId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // GRID STYLE HELPER
  // ---------------------------------------------------------------------------

  const persistWidgetLayout = useCallback(
    async (widgets: DashboardWidget[]) => {
      try {
        setSavingLayout(true);
        const res = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widgets: widgets.map((widget) => ({
              id: widget.id,
              x: widget.x,
              y: widget.y,
              w: widget.w,
              h: widget.h,
            })),
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to persist widget layout");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to persist widget layout"
        );
        await fetchDashboard();
      } finally {
        setSavingLayout(false);
      }
    },
    [dashboardId, fetchDashboard]
  );

  const beginWidgetInteraction = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      widget: DashboardWidget,
      type: WidgetInteraction["type"]
    ) => {
      event.preventDefault();
      event.stopPropagation();
      pointerTargetRef.current = event.currentTarget;
      event.currentTarget.setPointerCapture(event.pointerId);

      setActiveWidgetInteraction({
        type,
        widgetId: widget.id,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        initialX: widget.x,
        initialY: widget.y,
        initialW: widget.w,
        initialH: widget.h,
      });
    },
    []
  );

  useEffect(() => {
    if (!activeWidgetInteraction) return;

    const handlePointerMove = (event: PointerEvent) => {
      const gridElement = gridRef.current;
      if (!gridElement) return;

      const deltaX = event.clientX - activeWidgetInteraction.startClientX;
      const deltaY = event.clientY - activeWidgetInteraction.startClientY;
      const columnWidth =
        (gridElement.clientWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
      const stepWidth = columnWidth + GRID_GAP;
      const stepHeight = GRID_ROW_HEIGHT + GRID_GAP;
      const deltaColumns = Math.round(deltaX / stepWidth);
      const deltaRows = Math.round(deltaY / stepHeight);

      setDashboard((previous) => {
        if (!previous) return previous;

        const updatedWidgets = previous.widgets.map((widget) => {
          if (widget.id !== activeWidgetInteraction.widgetId) return widget;

          if (activeWidgetInteraction.type === "drag") {
            const nextX = clamp(
              activeWidgetInteraction.initialX + deltaColumns,
              0,
              GRID_COLUMNS - widget.w
            );
            const nextY = Math.max(0, activeWidgetInteraction.initialY + deltaRows);
            return { ...widget, x: nextX, y: nextY };
          }

          const nextW = clamp(
            activeWidgetInteraction.initialW + deltaColumns,
            1,
            GRID_COLUMNS - activeWidgetInteraction.initialX
          );
          const nextH = clamp(activeWidgetInteraction.initialH + deltaRows, 1, 12);
          return { ...widget, w: nextW, h: nextH };
        });

        return { ...previous, widgets: normalizeLayout(updatedWidgets) };
      });
    };

    const finishInteraction = () => {
      const target = pointerTargetRef.current;
      if (target) {
        try {
          target.releasePointerCapture(activeWidgetInteraction.pointerId);
        } catch {
          // Ignore release errors.
        }
      }
      pointerTargetRef.current = null;
      setActiveWidgetInteraction(null);
      void persistWidgetLayout(widgetsRef.current);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activeWidgetInteraction.pointerId) return;
      finishInteraction();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [activeWidgetInteraction, persistWidgetLayout]);

  const getWidgetGridStyle = (
    widget: DashboardWidget
  ): React.CSSProperties => {
    return {
      gridColumn: `${widget.x + 1} / span ${widget.w}`,
      gridRow: `${widget.y + 1} / span ${widget.h}`,
    };
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="p-6 pt-8">
        <Link
          href="/reports/dashboards"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboards
        </Link>
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 pt-8">
        <Link
          href="/reports/dashboards"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboards
        </Link>
        <div className="p-6 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-sm">
          Dashboard not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-8">
      {/* Back Link */}
      <Link
        href="/reports/dashboards"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboards
      </Link>

      {/* Page Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {dashboard.name}
          </h1>
          {dashboard.description && (
            <p className="text-sm text-gray-500 mt-1">
              {dashboard.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {savingLayout && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving layout...
            </span>
          )}
          <button
            onClick={openAddWidgetModal}
            className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#0e7490] shadow-lg shadow-cyan-500/25"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Widget
          </button>
        </div>
      </div>
      <p className="mb-6 text-xs text-gray-500">
        Drag widgets by the grip icon and resize from the bottom-right corner.
      </p>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Widgets Grid */}
      {dashboard.widgets.length > 0 ? (
        <div
          ref={gridRef}
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
            gridAutoRows: `${GRID_ROW_HEIGHT}px`,
          }}
        >
          {dashboard.widgets.map((widget) => {
            const chartState = chartDataMap[widget.id];
            const chartType =
              widget.report?.definition?.chart?.chartType || "bar";

            return (
              <div
                key={widget.id}
                className={`relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow ${
                  activeWidgetInteraction?.widgetId === widget.id
                    ? "shadow-md ring-2 ring-cyan-100"
                    : ""
                }`}
                style={getWidgetGridStyle(widget)}
              >
                {/* Widget Header */}
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onPointerDown={(event) =>
                        beginWidgetInteraction(event, widget, "drag")
                      }
                      className="cursor-grab rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
                      title="Drag widget"
                      aria-label="Drag widget"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {widget.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRemoveWidget(widget.id)}
                      disabled={removingWidgetId === widget.id}
                      className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Remove widget"
                    >
                      {removingWidgetId === widget.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Widget Chart Content */}
                <div className="flex-1">
                  {!chartState || chartState.loading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0891b2]" />
                    </div>
                  ) : chartState.error ? (
                    <div className="flex items-center justify-center h-48 text-sm text-red-500">
                      {chartState.error}
                    </div>
                  ) : (
                    <ReportChart
                      chartType={chartType}
                      data={chartState.data || []}
                    />
                  )}
                </div>

                {/* Widget Footer */}
                {widget.report && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Report: {widget.report.name}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onPointerDown={(event) =>
                    beginWidgetInteraction(event, widget, "resize")
                  }
                  className="absolute bottom-2 right-2 h-4 w-4 cursor-se-resize rounded border border-gray-300 bg-white text-transparent opacity-80 transition-opacity hover:opacity-100"
                  title="Resize widget"
                  aria-label="Resize widget"
                >
                  resize
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-[#0891b2]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No widgets yet
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Add widgets from your reports to build this dashboard.
          </p>
          <button
            onClick={openAddWidgetModal}
            className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0e7490] transition-colors shadow-lg shadow-cyan-500/25"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Widget
          </button>
        </div>
      )}

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!addingWidget) setShowAddWidget(false);
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Widget
              </h3>
              <button
                onClick={() => setShowAddWidget(false)}
                disabled={addingWidget}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Select Report */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Report <span className="text-red-500">*</span>
                </label>

                {/* Report Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                  />
                </div>

                {/* Report List */}
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {reportsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0891b2]" />
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400">
                      No reports found
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => {
                          setSelectedReportId(report.id);
                          if (!widgetTitle.trim()) {
                            setWidgetTitle(report.name);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${
                          selectedReportId === report.id
                            ? "bg-cyan-50 text-[#0891b2]"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{report.name}</div>
                        {report.description && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {report.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {report.category} &middot;{" "}
                          {report.definition?.chart?.chartType || "chart"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Widget Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Widget Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Revenue"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
                />
              </div>

              {/* Size selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Width
                  </label>
                  <select
                    value={widgetW}
                    onChange={(e) => setWidgetW(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors bg-white text-sm"
                  >
                    {WIDTH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Height
                  </label>
                  <select
                    value={widgetH}
                    onChange={(e) => setWidgetH(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors bg-white text-sm"
                  >
                    {HEIGHT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddWidget(false)}
                disabled={addingWidget}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWidget}
                disabled={
                  addingWidget || !selectedReportId || !widgetTitle.trim()
                }
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors disabled:opacity-50"
              >
                {addingWidget && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Widget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
