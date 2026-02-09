"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Hash,
  Table,
  TrendingUp,
  Database,
  Filter,
  Calendar,
  Check,
} from "lucide-react";
import ReportChart from "@/components/reports/ReportChart";
import type { ChartDataPoint } from "@/components/reports/types";

// =============================================================================
// DATA SOURCE FIELDS
// =============================================================================

const DATA_SOURCE_FIELDS: Record<
  string,
  { value: string; label: string; type: string }[]
> = {
  deals: [
    { value: "amount", label: "Deal Amount", type: "number" },
    { value: "stage", label: "Deal Stage", type: "string" },
    { value: "status", label: "Status", type: "string" },
    { value: "closedAt", label: "Close Date", type: "date" },
    { value: "createdAt", label: "Created Date", type: "date" },
    { value: "probability", label: "Probability", type: "number" },
  ],
  contacts: [
    { value: "lifecycleStage", label: "Lifecycle Stage", type: "string" },
    { value: "source", label: "Source", type: "string" },
    { value: "createdAt", label: "Created Date", type: "date" },
    { value: "email", label: "Email", type: "string" },
  ],
  companies: [
    { value: "industry", label: "Industry", type: "string" },
    { value: "size", label: "Company Size", type: "string" },
    { value: "annualRevenue", label: "Annual Revenue", type: "number" },
    { value: "createdAt", label: "Created Date", type: "date" },
  ],
  activities: [
    { value: "type", label: "Activity Type", type: "string" },
    { value: "status", label: "Status", type: "string" },
    { value: "createdAt", label: "Created Date", type: "date" },
    { value: "callDuration", label: "Duration", type: "number" },
  ],
};

const AGGREGATE_OPTIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
];

const OPERATORS = [
  { value: "eq", label: "Equals" },
  { value: "neq", label: "Not Equals" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less or Equal" },
  { value: "contains", label: "Contains" },
  { value: "isNull", label: "Is Empty" },
  { value: "isNotNull", label: "Is Not Empty" },
];

const DATE_PRESETS = [
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "last90", label: "Last 90 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "thisYear", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const CHART_TYPES = [
  {
    value: "bar",
    label: "Bar Chart",
    description: "Compare values across categories",
    icon: BarChart3,
  },
  {
    value: "line",
    label: "Line Chart",
    description: "Show trends over time",
    icon: LineChartIcon,
  },
  {
    value: "area",
    label: "Area Chart",
    description: "Show volume trends over time",
    icon: TrendingUp,
  },
  {
    value: "pie",
    label: "Pie Chart",
    description: "Show proportions of a whole",
    icon: PieChartIcon,
  },
  {
    value: "number",
    label: "KPI Number",
    description: "Display a single key metric",
    icon: Hash,
  },
  {
    value: "table",
    label: "Data Table",
    description: "Show raw data in table format",
    icon: Table,
  },
];

// =============================================================================
// TYPES
// =============================================================================

interface MetricEntry {
  id: string;
  field: string;
  aggregate: string;
}

interface DimensionEntry {
  id: string;
  field: string;
  type: "temporal" | "categorical";
  granularity: string;
}

interface FilterEntry {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface WizardState {
  // Step 1
  name: string;
  description: string;
  category: string;
  dataSource: string;
  metrics: MetricEntry[];
  // Step 2
  dimensions: DimensionEntry[];
  filters: FilterEntry[];
  datePreset: string;
  dateField: string;
  // Step 3
  chartType: string;
  stacked: boolean;
  showLegend: boolean;
  showGrid: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `entry_${Date.now()}_${idCounter}`;
}

function getFieldLabel(dataSource: string, fieldValue: string): string {
  const fields = DATA_SOURCE_FIELDS[dataSource];
  if (!fields) return fieldValue;
  const found = fields.find((f) => f.value === fieldValue);
  return found ? found.label : fieldValue;
}

function generatePreviewData(state: WizardState): ChartDataPoint[] {
  const { chartType, metrics, dimensions, dataSource } = state;

  if (metrics.length === 0) return [];

  // For KPI number, return a single data point
  if (chartType === "number") {
    const metricLabel = metrics[0]
      ? `${metrics[0].aggregate} of ${getFieldLabel(dataSource, metrics[0].field)}`
      : "Value";
    return [{ name: metricLabel, [metricLabel]: 1250 }];
  }

  // For table, return sample rows
  if (chartType === "table") {
    const sampleNames = ["Q1", "Q2", "Q3", "Q4"];
    return sampleNames.map((name) => {
      const point: ChartDataPoint = { name };
      metrics.forEach((m) => {
        const label = `${m.aggregate} of ${getFieldLabel(dataSource, m.field)}`;
        point[label] = Math.floor(Math.random() * 10000);
      });
      return point;
    });
  }

  // For charts, generate sample data points
  const dimensionLabels =
    dimensions.length > 0
      ? dimensions[0].type === "temporal"
        ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        : ["Group A", "Group B", "Group C", "Group D", "Group E"]
      : ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5"];

  return dimensionLabels.map((name) => {
    const point: ChartDataPoint = { name };
    metrics.forEach((m) => {
      const label = `${m.aggregate} of ${getFieldLabel(dataSource, m.field)}`;
      point[label] = Math.floor(Math.random() * 10000) + 500;
    });
    return point;
  });
}

// =============================================================================
// STEP INDICATOR
// =============================================================================

const STEPS = [
  { number: 1, label: "Data Source & Metrics" },
  { number: 2, label: "Dimensions & Filters" },
  { number: 3, label: "Chart & Preview" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step.number < currentStep
                  ? "bg-[#0891b2] text-white"
                  : step.number === currentStep
                    ? "bg-[#0891b2] text-white ring-4 ring-cyan-100"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step.number < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                step.number === currentStep
                  ? "text-[#0891b2]"
                  : step.number < currentStep
                    ? "text-gray-600"
                    : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connecting line */}
          {index < STEPS.length - 1 && (
            <div
              className={`w-20 h-0.5 mx-3 mt-[-18px] ${
                step.number < currentStep ? "bg-[#0891b2]" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// STEP 1: DATA SOURCE & METRICS
// =============================================================================

function Step1DataSource({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const fields = DATA_SOURCE_FIELDS[state.dataSource] ?? [];

  const addMetric = () => {
    const defaultField = fields[0]?.value ?? "";
    onChange({
      metrics: [
        ...state.metrics,
        { id: generateId(), field: defaultField, aggregate: "count" },
      ],
    });
  };

  const updateMetric = (
    id: string,
    patch: Partial<MetricEntry>,
  ) => {
    onChange({
      metrics: state.metrics.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    });
  };

  const removeMetric = (id: string) => {
    onChange({ metrics: state.metrics.filter((m) => m.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Report Name */}
      <div>
        <label
          htmlFor="reportName"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Report Name <span className="text-red-500">*</span>
        </label>
        <input
          id="reportName"
          type="text"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Monthly Revenue Report"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none transition-colors"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="reportDescription"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Description{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="reportDescription"
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what this report tracks..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none transition-colors resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="reportCategory"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Category
        </label>
        <select
          id="reportCategory"
          value={state.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none transition-colors bg-white"
        >
          <option value="sales">Sales</option>
          <option value="marketing">Marketing</option>
          <option value="service">Service</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Data Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Data Source
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["deals", "contacts", "companies", "activities"] as const).map(
            (source) => (
              <label
                key={source}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  state.dataSource === source
                    ? "border-[#0891b2] bg-cyan-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="dataSource"
                  value={source}
                  checked={state.dataSource === source}
                  onChange={() =>
                    onChange({
                      dataSource: source,
                      metrics: [],
                      dimensions: [],
                      filters: [],
                      dateField: "createdAt",
                    })
                  }
                  className="sr-only"
                />
                <Database
                  className={`w-5 h-5 ${
                    state.dataSource === source
                      ? "text-[#0891b2]"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium capitalize ${
                    state.dataSource === source
                      ? "text-[#0891b2]"
                      : "text-gray-600"
                  }`}
                >
                  {source}
                </span>
                {state.dataSource === source && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-[#0891b2]" />
                  </div>
                )}
              </label>
            ),
          )}
        </div>
      </div>

      {/* Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Metrics
          </label>
          <button
            type="button"
            onClick={addMetric}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0891b2] hover:text-[#0e7490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Metric
          </button>
        </div>

        {state.metrics.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              No metrics added yet. Click &quot;Add Metric&quot; to start.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {state.metrics.map((metric) => (
            <div
              key={metric.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <select
                value={metric.field}
                onChange={(e) =>
                  updateMetric(metric.id, { field: e.target.value })
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
              >
                <option value="" disabled>
                  Select field...
                </option>
                {fields.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={metric.aggregate}
                onChange={(e) =>
                  updateMetric(metric.id, { aggregate: e.target.value })
                }
                className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
              >
                {AGGREGATE_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeMetric(metric.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove metric"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2: DIMENSIONS & FILTERS
// =============================================================================

function Step2Dimensions({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const fields = DATA_SOURCE_FIELDS[state.dataSource] ?? [];
  const dateFields = fields.filter((f) => f.type === "date");

  // --- Dimensions ---
  const addDimension = () => {
    const defaultField = fields[0]?.value ?? "";
    const fieldDef = fields.find((f) => f.value === defaultField);
    const dimType: "temporal" | "categorical" =
      fieldDef?.type === "date" ? "temporal" : "categorical";
    onChange({
      dimensions: [
        ...state.dimensions,
        {
          id: generateId(),
          field: defaultField,
          type: dimType,
          granularity: "month",
        },
      ],
    });
  };

  const updateDimension = (
    id: string,
    patch: Partial<DimensionEntry>,
  ) => {
    onChange({
      dimensions: state.dimensions.map((d) =>
        d.id === id ? { ...d, ...patch } : d,
      ),
    });
  };

  const removeDimension = (id: string) => {
    onChange({ dimensions: state.dimensions.filter((d) => d.id !== id) });
  };

  // --- Filters ---
  const addFilter = () => {
    const defaultField = fields[0]?.value ?? "";
    onChange({
      filters: [
        ...state.filters,
        { id: generateId(), field: defaultField, operator: "eq", value: "" },
      ],
    });
  };

  const updateFilter = (
    id: string,
    patch: Partial<FilterEntry>,
  ) => {
    onChange({
      filters: state.filters.map((f) =>
        f.id === id ? { ...f, ...patch } : f,
      ),
    });
  };

  const removeFilter = (id: string) => {
    onChange({ filters: state.filters.filter((f) => f.id !== id) });
  };

  return (
    <div className="space-y-8">
      {/* Dimensions Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Group By (Dimensions)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Choose how to group your report data
            </p>
          </div>
          <button
            type="button"
            onClick={addDimension}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0891b2] hover:text-[#0e7490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Dimension
          </button>
        </div>

        {state.dimensions.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <Database className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No dimensions added</p>
          </div>
        )}

        <div className="space-y-3">
          {state.dimensions.map((dim) => {
            const fieldDef = fields.find((f) => f.value === dim.field);
            return (
              <div
                key={dim.id}
                className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <select
                  value={dim.field}
                  onChange={(e) => {
                    const newFieldDef = fields.find(
                      (f) => f.value === e.target.value,
                    );
                    const newType: "temporal" | "categorical" =
                      newFieldDef?.type === "date" ? "temporal" : "categorical";
                    updateDimension(dim.id, {
                      field: e.target.value,
                      type: newType,
                    });
                  }}
                  className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
                >
                  {fields.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={dim.type}
                  onChange={(e) =>
                    updateDimension(dim.id, {
                      type: e.target.value as "temporal" | "categorical",
                    })
                  }
                  className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
                >
                  <option value="categorical">Categorical</option>
                  <option value="temporal">Temporal</option>
                </select>

                {dim.type === "temporal" && (
                  <select
                    value={dim.granularity}
                    onChange={(e) =>
                      updateDimension(dim.id, {
                        granularity: e.target.value,
                      })
                    }
                    className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="quarter">Quarter</option>
                    <option value="year">Year</option>
                  </select>
                )}

                {/* Show field type badge */}
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-500">
                  {fieldDef?.type ?? "unknown"}
                </span>

                <button
                  type="button"
                  onClick={() => removeDimension(dim.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove dimension"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Narrow down your data with conditions
            </p>
          </div>
          <button
            type="button"
            onClick={addFilter}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0891b2] hover:text-[#0e7490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Filter
          </button>
        </div>

        {state.filters.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <Filter className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No filters applied</p>
          </div>
        )}

        <div className="space-y-3">
          {state.filters.map((filter) => {
            const needsValue =
              filter.operator !== "isNull" && filter.operator !== "isNotNull";
            return (
              <div
                key={filter.id}
                className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <select
                  value={filter.field}
                  onChange={(e) =>
                    updateFilter(filter.id, { field: e.target.value })
                  }
                  className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
                >
                  {fields.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(filter.id, { operator: e.target.value })
                  }
                  className="w-40 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {needsValue && (
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) =>
                      updateFilter(filter.id, { value: e.target.value })
                    }
                    placeholder="Value..."
                    className="flex-1 min-w-[120px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove filter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">Date Range</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="datePreset"
              className="block text-xs font-medium text-gray-500 mb-1.5"
            >
              Preset
            </label>
            <select
              id="datePreset"
              value={state.datePreset}
              onChange={(e) => onChange({ datePreset: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dateField"
              className="block text-xs font-medium text-gray-500 mb-1.5"
            >
              Date Field
            </label>
            <select
              id="dateField"
              value={state.dateField}
              onChange={(e) => onChange({ dateField: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none bg-white"
            >
              {dateFields.length > 0 ? (
                dateFields.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))
              ) : (
                <option value="createdAt">Created Date</option>
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 3: CHART & PREVIEW
// =============================================================================

function Step3Chart({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const previewData = generatePreviewData(state);

  return (
    <div className="space-y-8">
      {/* Chart Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Chart Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CHART_TYPES.map((chart) => {
            const Icon = chart.icon;
            return (
              <button
                key={chart.value}
                type="button"
                onClick={() => onChange({ chartType: chart.value })}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                  state.chartType === chart.value
                    ? "border-[#0891b2] bg-cyan-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    state.chartType === chart.value
                      ? "text-[#0891b2]"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    state.chartType === chart.value
                      ? "text-[#0891b2]"
                      : "text-gray-700"
                  }`}
                >
                  {chart.label}
                </span>
                <span className="text-xs text-gray-400 text-center">
                  {chart.description}
                </span>
                {state.chartType === chart.value && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-[#0891b2]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Chart Options
        </label>
        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.stacked}
              onChange={(e) => onChange({ stacked: e.target.checked })}
              className="w-4 h-4 text-[#0891b2] border-gray-300 rounded focus:ring-[#0891b2]"
            />
            <span className="text-sm text-gray-600">Stacked</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showLegend}
              onChange={(e) => onChange({ showLegend: e.target.checked })}
              className="w-4 h-4 text-[#0891b2] border-gray-300 rounded focus:ring-[#0891b2]"
            />
            <span className="text-sm text-gray-600">Show Legend</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showGrid}
              onChange={(e) => onChange({ showGrid: e.target.checked })}
              className="w-4 h-4 text-[#0891b2] border-gray-300 rounded focus:ring-[#0891b2]"
            />
            <span className="text-sm text-gray-600">Show Grid</span>
          </label>
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preview
        </label>
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm min-h-[320px]">
          {state.metrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BarChart3 className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm">
                Add at least one metric in Step 1 to see a preview
              </p>
            </div>
          ) : (
            <ReportChart
              chartType={state.chartType}
              data={previewData}
              stacked={state.stacked}
              showLegend={state.showLegend}
              showGrid={state.showGrid}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function NewReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    name: "",
    description: "",
    category: "sales",
    dataSource: "deals",
    metrics: [],
    dimensions: [],
    filters: [],
    datePreset: "last30",
    dateField: "createdAt",
    chartType: "bar",
    stacked: false,
    showLegend: true,
    showGrid: true,
  });

  const handleChange = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateStep1 = (): string | null => {
    if (!state.name.trim()) {
      return "Report name is required.";
    }
    if (state.metrics.length === 0) {
      return "Add at least one metric.";
    }
    for (const m of state.metrics) {
      if (!m.field) {
        return "All metrics must have a field selected.";
      }
    }
    return null;
  };

  const validateStep2 = (): string | null => {
    for (const f of state.filters) {
      if (
        f.operator !== "isNull" &&
        f.operator !== "isNotNull" &&
        !f.value.trim()
      ) {
        return "All filter conditions must have a value (except Is Empty / Is Not Empty).";
      }
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    setError(null);

    // Final validations
    const err1 = validateStep1();
    if (err1) {
      setError(err1);
      setStep(1);
      return;
    }
    const err2 = validateStep2();
    if (err2) {
      setError(err2);
      setStep(2);
      return;
    }

    const payload = {
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      category: state.category,
      definition: {
        dataSource: state.dataSource,
        metrics: state.metrics.map((m) => ({
          id: m.id,
          field: m.field,
          aggregate: m.aggregate,
          label: `${m.aggregate} of ${getFieldLabel(state.dataSource, m.field)}`,
        })),
        dimensions: state.dimensions.map((d) => ({
          id: d.id,
          field: d.field,
          type: d.type,
          granularity: d.type === "temporal" ? d.granularity : undefined,
          label: getFieldLabel(state.dataSource, d.field),
        })),
        filters: state.filters.map((f) => ({
          id: f.id,
          field: f.field,
          operator: f.operator,
          value: f.operator === "isNull" || f.operator === "isNotNull" ? null : f.value,
        })),
        chart: {
          chartType: state.chartType,
          stacked: state.stacked,
          showLegend: state.showLegend,
          showGrid: state.showGrid,
        },
        dateRange: {
          type: state.datePreset === "custom" ? "custom" : "preset",
          preset:
            state.datePreset !== "custom" ? state.datePreset : undefined,
          dateField: state.dateField,
        },
      },
    };

    try {
      setLoading(true);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create report");
      }

      const json: { data: { id: string } } = await res.json();
      router.push(`/reports/${json.data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-6 pt-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Report
        </h1>
        <p className="text-gray-600 mt-1">
          Build a custom report in three simple steps.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step Content Card */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
        {step === 1 && (
          <Step1DataSource state={state} onChange={handleChange} />
        )}
        {step === 2 && (
          <Step2Dimensions state={state} onChange={handleChange} />
        )}
        {step === 3 && <Step3Chart state={state} onChange={handleChange} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>
        <div>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors shadow-lg shadow-cyan-500/25"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
