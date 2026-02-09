// =============================================================================
// REPORT TYPES - Shared type definitions for the Reports module
// =============================================================================

export interface ReportMetric {
  id: string;
  field: string;
  aggregate: string;
  label: string;
}

export interface ReportDimension {
  id: string;
  field: string;
  type: string;
  granularity?: string;
  label: string;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: unknown;
}

export interface ReportChart {
  chartType: string;
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
}

export interface ReportDateRange {
  type: string;
  preset?: string;
  start?: string;
  end?: string;
  dateField: string;
}

export interface ReportDefinition {
  dataSource: "deals" | "contacts" | "companies" | "activities";
  metrics: ReportMetric[];
  dimensions: ReportDimension[];
  filters: ReportFilter[];
  chart: ReportChart;
  dateRange?: ReportDateRange;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  category: "sales" | "marketing" | "service" | "custom";
  definition: ReportDefinition;
  isFavorite?: boolean;
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChartDataPoint {
  [key: string]: string | number | null;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  reportId: string;
  report?: Report;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ReportStats {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalRevenue: number;
  dealsWon: number;
  dealsByStage: ChartDataPoint[];
  contactsByLifecycle: ChartDataPoint[];
  recentActivities: ChartDataPoint[];
}

// Brand colors for charts
export const CHART_COLORS = [
  "#0891b2",
  "#0ea5e9",
  "#06b6d4",
  "#22d3ee",
  "#67e8f9",
  "#a5f3fc",
  "#164e63",
  "#155e75",
];

// Data source field definitions for the report builder
export const DATA_SOURCE_FIELDS: Record<
  string,
  { value: string; label: string; type: string }[]
> = {
  deals: [
    { value: "amount", label: "Deal Amount", type: "number" },
    { value: "stage", label: "Deal Stage", type: "string" },
    { value: "status", label: "Status", type: "string" },
    { value: "closedAt", label: "Close Date", type: "date" },
    { value: "createdAt", label: "Created Date", type: "date" },
    { value: "pipeline", label: "Pipeline", type: "string" },
    { value: "owner", label: "Owner", type: "string" },
    { value: "probability", label: "Probability", type: "number" },
  ],
  contacts: [
    { value: "lifecycleStage", label: "Lifecycle Stage", type: "string" },
    { value: "source", label: "Source", type: "string" },
    { value: "createdAt", label: "Created Date", type: "date" },
    { value: "lastActivityAt", label: "Last Activity", type: "date" },
    { value: "email", label: "Email", type: "string" },
    { value: "company", label: "Company", type: "string" },
    { value: "owner", label: "Owner", type: "string" },
  ],
  companies: [
    { value: "industry", label: "Industry", type: "string" },
    { value: "size", label: "Company Size", type: "string" },
    { value: "revenue", label: "Annual Revenue", type: "number" },
    { value: "createdAt", label: "Created Date", type: "date" },
    { value: "owner", label: "Owner", type: "string" },
    { value: "country", label: "Country", type: "string" },
  ],
  activities: [
    { value: "type", label: "Activity Type", type: "string" },
    { value: "status", label: "Status", type: "string" },
    { value: "createdAt", label: "Created Date", type: "date" },
    { value: "completedAt", label: "Completed Date", type: "date" },
    { value: "owner", label: "Owner", type: "string" },
    { value: "duration", label: "Duration", type: "number" },
  ],
};

export const AGGREGATE_FUNCTIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
];

export const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", description: "Compare values across categories" },
  { value: "line", label: "Line Chart", description: "Show trends over time" },
  { value: "area", label: "Area Chart", description: "Show volume trends over time" },
  { value: "pie", label: "Pie Chart", description: "Show proportions of a whole" },
  { value: "number", label: "KPI Number", description: "Display a single key metric" },
  { value: "table", label: "Data Table", description: "Show raw data in table format" },
];
