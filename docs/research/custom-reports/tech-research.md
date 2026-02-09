# Custom Reports Feature - Technical Architecture Research

> **Project:** F-CORE (HubSpot CRM Clone)
> **Date:** 2026-02-09
> **Status:** Research Complete
> **Priority:** P2 (Reporting Hub - Analytics & Dashboards)
> **Stack:** Next.js 16, TypeScript Strict, Tailwind CSS v4, Prisma 7.x, PostgreSQL (Supabase)
> **Brand Color:** #0891b2 (Ocean Blue / `cyan-600`)

---

## Table of Contents

1. [Chart Libraries Comparison](#1-chart-libraries-comparison)
2. [Data Aggregation Patterns](#2-data-aggregation-patterns)
3. [Report Builder Architecture](#3-report-builder-architecture)
4. [Dashboard State Management](#4-dashboard-state-management)
5. [Performance Considerations](#5-performance-considerations)
6. [Prisma Schema Design](#6-prisma-schema-design)
7. [Final Recommendations](#7-final-recommendations)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Chart Libraries Comparison

### 1.1 Candidates Evaluated

| Library | GitHub Stars | NPM Weekly DL | Bundle (gzip) | Rendering | TypeScript | React 19 |
|---------|-------------|---------------|---------------|-----------|------------|----------|
| **Recharts** | 26.6k | 3.6M+ | ~85 KB | SVG | Full | Yes |
| **Tremor** | 16.5k (raw) / 3.2k (copy) | ~200k | 60-100 KB (incl. Recharts) | SVG | Full | Yes |
| **Chart.js + react-chartjs-2** | 65k / 6.8k | 2.4M / 1.6M | ~45 KB | Canvas | Community types | Yes |
| **Nivo** | 14k | 665k | ~120-200 KB (per pkg) | SVG, Canvas, HTML | Full | Partial* |
| **Victory** | 11.2k | 272k | ~90 KB | SVG | Full | Yes |

*Nivo has reported peer dependency conflicts with React 19 requiring `--legacy-peer-deps`.

### 1.2 Deep-Dive: Recharts

**Architecture:** Built on D3 sub-modules, wraps D3 primitives in React components.

**Chart Types:** Line, Area, Bar, Composed, Scatter, Pie, Radar, Radial Bar, Treemap, Funnel, Sankey.

**Strengths:**
- Most popular React chart library (3.6M+ weekly downloads)
- Declarative, composable JSX API -- aligns with React mental model
- Strong TypeScript support with generic component types
- SVG-based rendering -- good for accessibility and CSS styling
- `ResponsiveContainer` wrapper for responsive charts
- Smooth animation built-in via react-smooth
- Active development -- v3.7.0 as of early 2026

**Weaknesses:**
- SVG-only -- no Canvas fallback for large datasets (>10K points)
- Bundle includes Redux Toolkit internally (~85 KB gzip total)
- Limited chart type variety compared to ECharts/Nivo

**Code Example (F-CORE branded):**

```tsx
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', deals: 40, revenue: 24000 },
  { month: 'Feb', deals: 30, revenue: 13980 },
  { month: 'Mar', deals: 20, revenue: 9800 },
  { month: 'Apr', deals: 27, revenue: 39080 },
  { month: 'May', deals: 18, revenue: 48000 },
  { month: 'Jun', deals: 23, revenue: 38000 },
];

export function DealRevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0891b2"
          fill="#0891b2"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### 1.3 Deep-Dive: Tremor

**Architecture:** Copy-and-paste React component library built on top of Recharts and Radix UI, styled with Tailwind CSS.

**Chart Types:** Area, Bar (horizontal/vertical/stacked), Line, Donut/Pie, Combo, Spark, Progress Circle, Category Bar, Tracker, Bar List.

**Strengths:**
- **Tailwind-native** -- perfect alignment with our stack (Tailwind CSS v4)
- 35+ pre-built dashboard components (not just charts -- KPI cards, tables, filters)
- Copy-paste model -- full source code ownership, no version lock-in
- Built on Recharts underneath -- same rendering quality
- Beautiful defaults -- production-ready UI out of the box
- Accessible via Radix UI primitives
- Loading states, error boundaries, empty states handled

**Weaknesses:**
- Dashboard-focused scope -- not a general-purpose UI library
- Smaller community than standalone Recharts
- You maintain the copied code -- no centralized bug fixes
- Built on Recharts, so inherits its SVG-only limitation

**Code Example (F-CORE branded):**

```tsx
import { BarChart } from '@/components/charts/BarChart'; // Tremor copy-paste

const chartData = [
  { date: 'Jan 2026', 'New Deals': 12, 'Won Deals': 8, 'Lost Deals': 2 },
  { date: 'Feb 2026', 'New Deals': 18, 'Won Deals': 14, 'Lost Deals': 3 },
  { date: 'Mar 2026', 'New Deals': 22, 'Won Deals': 16, 'Lost Deals': 4 },
];

export function DealPipelineChart() {
  return (
    <BarChart
      data={chartData}
      index="date"
      categories={['New Deals', 'Won Deals', 'Lost Deals']}
      colors={['cyan', 'teal', 'red']}
      yAxisWidth={48}
      className="h-72"
    />
  );
}
```

### 1.4 Deep-Dive: Chart.js / react-chartjs-2

**Architecture:** Chart.js is a standalone Canvas-based library; react-chartjs-2 is a thin React wrapper.

**Chart Types:** Line, Bar, Pie, Doughnut, Radar, Polar Area, Bubble, Scatter.

**Strengths:**
- Smallest bundle (~45 KB gzip)
- Canvas rendering -- handles large datasets better than SVG
- Mature ecosystem with extensive plugin system (zoom, annotation, streaming)
- Good for mobile performance due to Canvas

**Weaknesses:**
- Not React-idiomatic -- imperative Chart.js API leaks through
- TypeScript types are community-maintained, less reliable
- Limited composability -- cannot mix chart types as easily
- Canvas makes CSS styling and accessibility harder
- Plugin ecosystem quality varies

### 1.5 Deep-Dive: Nivo

**Architecture:** D3-based with react-spring animations, supports SVG, Canvas, and HTML rendering.

**Chart Types:** Bar, Line, Area, Pie, Radar, Heatmap, Treemap, Sunburst, Chord, Network, Sankey, Waffle, Calendar, Geo/Choropleth, Stream, Marimekko, Swarmplot, and more (30+).

**Strengths:**
- Widest chart type variety of any React library
- SSR-ready -- important for Next.js
- Supports Canvas rendering for performance-critical charts
- Beautiful animations via react-spring
- Interactive playground for configuration
- Strong theming system

**Weaknesses:**
- **React 19 compatibility issues** -- peer dependency conflicts
- Larger bundle size (each @nivo/ package is 20-40 KB)
- Steeper learning curve
- Complex configuration objects
- Less active maintenance cadence

### 1.6 Deep-Dive: Victory

**Architecture:** Modular D3-based components by Formidable Labs with consistent API.

**Chart Types:** Line, Area, Bar, Pie, Scatter, Histogram, Candlestick, Error Bar, Voronoi, Box Plot, Funnel.

**Strengths:**
- Strongest accessibility support (ARIA labels built-in)
- Consistent, composable API
- Good for polished, report-style visualizations
- CSS-in-JS theming for quick style swaps
- Cross-platform (Victory Native for React Native)

**Weaknesses:**
- Slower release cadence (last major update over a year ago)
- Smaller community than Recharts
- Bundle size comparable to Recharts without its adoption benefits
- Less suited for real-time/streaming data

### 1.7 Comparison Matrix

| Criteria | Weight | Recharts | Tremor | Chart.js | Nivo | Victory |
|----------|--------|----------|--------|----------|------|---------|
| Tailwind integration | 15% | 3/5 | **5/5** | 2/5 | 2/5 | 2/5 |
| TypeScript support | 15% | 4/5 | **5/5** | 3/5 | 4/5 | 4/5 |
| Bundle size | 10% | 3/5 | 3/5 | **5/5** | 2/5 | 3/5 |
| Chart variety | 15% | 3/5 | 3/5 | 3/5 | **5/5** | 4/5 |
| Dashboard readiness | 15% | 3/5 | **5/5** | 2/5 | 3/5 | 3/5 |
| React 19 compat | 10% | **5/5** | **5/5** | 4/5 | 2/5 | 4/5 |
| Accessibility | 10% | 3/5 | 4/5 | 2/5 | 3/5 | **5/5** |
| Community/maintenance | 10% | **5/5** | 4/5 | 5/5 | 3/5 | 3/5 |
| **Weighted Score** | 100% | **3.45** | **4.30** | **3.10** | **3.10** | **3.40** |

### 1.8 Recommendation: Tremor (Primary) + Recharts (Underlying)

**Primary choice: Tremor** (copy-paste component approach from tremor.so)

**Justification:**
1. **Tailwind-native** -- matches our Tailwind CSS v4 stack perfectly
2. **Dashboard-first design** -- pre-built KPI cards, filter bars, tables, not just charts
3. **Built on Recharts** -- we get Recharts' mature charting engine with Tremor's polished UI
4. **Copy-paste ownership** -- no npm dependency lock-in; components live in our repo
5. **Accessible** -- Radix UI primitives ensure WCAG compliance
6. **Brand theming** -- Tailwind CSS custom colors (`cyan-600` = `#0891b2`) apply naturally

**Fallback:** For chart types Tremor does not cover (Sankey, Treemap, Funnel), import specific Recharts components directly, since Tremor is built on Recharts and they share the same rendering pipeline.

**Installation approach:**
```bash
# Tremor's copy-paste CLI (no npm package needed for v2 "raw" approach)
# Copy components from tremor.so into:
#   src/components/charts/
#   src/lib/chartUtils.ts

# Recharts is a peer dependency of Tremor chart components
npm install recharts
```

---

## 2. Data Aggregation Patterns

### 2.1 PostgreSQL Aggregation Queries

#### 2.1.1 GROUP BY with Aggregate Functions

Standard aggregation for CRM reporting:

```sql
-- Deals by stage with revenue metrics
SELECT
  ps.name AS stage_name,
  COUNT(d.id) AS deal_count,
  SUM(d.amount) AS total_value,
  AVG(d.amount) AS avg_deal_size,
  MIN(d.amount) AS min_deal,
  MAX(d.amount) AS max_deal
FROM "Deal" d
JOIN "PipelineStage" ps ON d."stageId" = ps.id
WHERE d."tenantId" = $1
  AND d."deletedAt" IS NULL
GROUP BY ps.name, ps."orderIndex"
ORDER BY ps."orderIndex";
```

#### 2.1.2 Window Functions for Advanced Analytics

```sql
-- Deal velocity: running total and moving average
WITH daily_deals AS (
  SELECT
    DATE_TRUNC('day', d."createdAt") AS day,
    COUNT(*) AS new_deals,
    SUM(d.amount) AS daily_revenue
  FROM "Deal" d
  WHERE d."tenantId" = $1
    AND d."deletedAt" IS NULL
    AND d."createdAt" >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE_TRUNC('day', d."createdAt")
)
SELECT
  day,
  new_deals,
  daily_revenue,
  SUM(daily_revenue) OVER (ORDER BY day) AS cumulative_revenue,
  AVG(daily_revenue) OVER (
    ORDER BY day
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS rolling_7day_avg,
  LAG(daily_revenue, 1) OVER (ORDER BY day) AS prev_day_revenue,
  ROUND(
    (daily_revenue - LAG(daily_revenue, 1) OVER (ORDER BY day)) * 100.0
    / NULLIF(LAG(daily_revenue, 1) OVER (ORDER BY day), 0),
    2
  ) AS day_over_day_pct
FROM daily_deals
ORDER BY day;
```

#### 2.1.3 CTEs for Multi-Step Reporting

```sql
-- Contact funnel analysis: lifecycle stage conversion
WITH stage_counts AS (
  SELECT
    "lifecycleStage" AS stage,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days') AS last_30d
  FROM "Contact"
  WHERE "tenantId" = $1
    AND "deletedAt" IS NULL
  GROUP BY "lifecycleStage"
),
stage_order AS (
  SELECT stage, total, last_30d,
    CASE stage
      WHEN 'subscriber' THEN 1
      WHEN 'lead' THEN 2
      WHEN 'mql' THEN 3
      WHEN 'sql' THEN 4
      WHEN 'opportunity' THEN 5
      WHEN 'customer' THEN 6
      WHEN 'evangelist' THEN 7
    END AS stage_index
  FROM stage_counts
)
SELECT
  stage,
  total,
  last_30d,
  ROUND(total * 100.0 / NULLIF(FIRST_VALUE(total) OVER (ORDER BY stage_index), 0), 1)
    AS conversion_rate_pct
FROM stage_order
ORDER BY stage_index;
```

### 2.2 Time-Series Bucketing

#### 2.2.1 Dynamic Bucket Widths

```sql
-- Parameterized time bucketing: daily / weekly / monthly
-- $1 = tenant_id, $2 = bucket ('day' | 'week' | 'month'), $3 = start_date, $4 = end_date

WITH time_series AS (
  SELECT generate_series(
    DATE_TRUNC($2::text, $3::timestamptz),
    DATE_TRUNC($2::text, $4::timestamptz),
    ('1 ' || $2)::interval
  ) AS bucket
),
deal_agg AS (
  SELECT
    DATE_TRUNC($2::text, d."createdAt") AS bucket,
    COUNT(*) AS deal_count,
    COALESCE(SUM(d.amount), 0) AS revenue
  FROM "Deal" d
  WHERE d."tenantId" = $1
    AND d."deletedAt" IS NULL
    AND d."createdAt" BETWEEN $3 AND $4
  GROUP BY DATE_TRUNC($2::text, d."createdAt")
)
SELECT
  ts.bucket,
  COALESCE(da.deal_count, 0) AS deal_count,
  COALESCE(da.revenue, 0) AS revenue
FROM time_series ts
LEFT JOIN deal_agg da ON ts.bucket = da.bucket
ORDER BY ts.bucket;
```

This pattern ensures that time periods with zero activity still appear in charts (no gaps in x-axis).

#### 2.2.2 date_bin() for Sub-Day Granularity

```sql
-- 4-hour activity bucketing for engagement heatmaps
SELECT
  date_bin('4 hours', a."createdAt", '2026-01-01'::timestamptz) AS bucket,
  a.type,
  COUNT(*) AS activity_count
FROM "Activity" a
WHERE a."tenantId" = $1
  AND a."createdAt" >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY 1, 2;
```

### 2.3 Prisma groupBy and aggregate APIs

#### 2.3.1 Prisma groupBy

```typescript
// Deals grouped by pipeline stage
const dealsByStage = await prisma.deal.groupBy({
  by: ['stageId'],
  where: {
    tenantId,
    deletedAt: null,
  },
  _count: { id: true },
  _sum: { amount: true },
  _avg: { amount: true },
  _max: { amount: true },
  _min: { amount: true },
  orderBy: { _count: { id: 'desc' } },
});
```

#### 2.3.2 Prisma aggregate

```typescript
// Overall deal statistics
const dealStats = await prisma.deal.aggregate({
  where: {
    tenantId,
    deletedAt: null,
    createdAt: { gte: startDate, lte: endDate },
  },
  _count: { id: true },
  _sum: { amount: true },
  _avg: { amount: true },
  _max: { amount: true },
  _min: { amount: true },
});
```

#### 2.3.3 Prisma Limitations for Reporting

Prisma's `groupBy` does NOT support:
- `DATE_TRUNC` or `date_bin` bucketing -- must use raw SQL
- Window functions (`OVER`, `PARTITION BY`)
- `FILTER (WHERE ...)` clauses on aggregates
- CTEs
- `generate_series` for gap-filling

**Strategy:** Use Prisma for simple aggregations. Use `prisma.$queryRaw` for complex reporting queries with full PostgreSQL power.

```typescript
// Complex report: use $queryRaw with tagged template
const monthlyRevenue = await prisma.$queryRaw<{
  month: Date;
  deal_count: number;
  revenue: number;
  cumulative: number;
}[]>`
  WITH monthly AS (
    SELECT
      DATE_TRUNC('month', "createdAt") AS month,
      COUNT(*)::int AS deal_count,
      COALESCE(SUM(amount), 0)::float AS revenue
    FROM "Deal"
    WHERE "tenantId" = ${tenantId}
      AND "deletedAt" IS NULL
      AND "createdAt" >= ${startDate}
    GROUP BY 1
  )
  SELECT
    month,
    deal_count,
    revenue,
    SUM(revenue) OVER (ORDER BY month)::float AS cumulative
  FROM monthly
  ORDER BY month
`;
```

### 2.4 Server-Side vs Client-Side Aggregation

| Factor | Server-Side (DB/API) | Client-Side (Browser) |
|--------|---------------------|-----------------------|
| **Data volume** | Handles millions of rows | Limited to ~10K rows |
| **Latency** | One round-trip, DB does work | Multiple round-trips or large payload |
| **Flexibility** | Fixed query, must rebuild for changes | User can re-slice without API call |
| **Security** | Tenant isolation enforced | Risk of data leakage |
| **Caching** | DB/API cache is shared | Per-user browser cache |

**Recommendation:** Hybrid approach.
1. Server-side aggregation for all default reports (security + performance)
2. Client-side re-aggregation only for pivot/drill-down on already-fetched aggregated data
3. Never send raw row-level data to the client for aggregation

### 2.5 Materialized Views for Performance

#### 2.5.1 When to Use

Use materialized views for:
- Dashboard KPI cards that query across many tables
- Reports that are expensive (>500ms) and read frequently
- Data that changes infrequently relative to read frequency (e.g., daily summaries)

Do NOT use for:
- Real-time data (use direct queries)
- User-specific or tenant-specific filtered views (use parameterized queries)

#### 2.5.2 Implementation

```sql
-- Materialized view: Daily deal summary per tenant
CREATE MATERIALIZED VIEW mv_daily_deal_summary AS
SELECT
  d."tenantId",
  DATE_TRUNC('day', d."createdAt") AS day,
  ps.name AS stage_name,
  COUNT(*) AS deal_count,
  COALESCE(SUM(d.amount), 0) AS total_revenue,
  COALESCE(AVG(d.amount), 0) AS avg_deal_size
FROM "Deal" d
JOIN "PipelineStage" ps ON d."stageId" = ps.id
WHERE d."deletedAt" IS NULL
GROUP BY d."tenantId", DATE_TRUNC('day', d."createdAt"), ps.name
WITH NO DATA;

-- Index for fast tenant-filtered queries
CREATE UNIQUE INDEX idx_mv_daily_deal_summary
  ON mv_daily_deal_summary ("tenantId", day, stage_name);

-- Populate (run in maintenance window or via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_deal_summary;
```

#### 2.5.3 Refresh Strategy

```typescript
// Refresh via Prisma raw SQL -- triggered by cron job or after bulk imports
async function refreshDealSummary() {
  await prisma.$executeRaw`
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_deal_summary
  `;

  // Log refresh for observability
  await prisma.$executeRaw`
    INSERT INTO mv_refresh_log (mv_name, last_refresh_at)
    VALUES ('mv_daily_deal_summary', NOW())
    ON CONFLICT (mv_name)
    DO UPDATE SET last_refresh_at = NOW()
  `;
}
```

#### 2.5.4 Prisma Integration

Prisma supports `view` blocks (read-only). For materialized views, use `$queryRaw`:

```typescript
const summary = await prisma.$queryRaw<{
  day: Date;
  stage_name: string;
  deal_count: number;
  total_revenue: number;
}[]>`
  SELECT day, stage_name, deal_count, total_revenue
  FROM mv_daily_deal_summary
  WHERE "tenantId" = ${tenantId}
    AND day >= ${startDate}
  ORDER BY day, stage_name
`;
```

---

## 3. Report Builder Architecture

### 3.1 Report Definition Schema

Reports are stored as JSON configurations that define data source, metrics, dimensions, filters, and visualization. This decouples the report definition from the execution engine.

#### 3.1.1 TypeScript Types

```typescript
// src/types/reports.ts

/** Supported CRM data sources */
type ReportDataSource =
  | 'contacts'
  | 'companies'
  | 'deals'
  | 'activities'
  | 'form_submissions';

/** Aggregation operations */
type AggregateFunction =
  | 'count'
  | 'count_distinct'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max';

/** Time granularity for date dimensions */
type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/** Filter operators */
type FilterOperator =
  | 'eq'       // equals
  | 'neq'      // not equals
  | 'gt'       // greater than
  | 'gte'      // greater than or equal
  | 'lt'       // less than
  | 'lte'      // less than or equal
  | 'in'       // in array
  | 'not_in'   // not in array
  | 'contains' // string contains
  | 'starts_with'
  | 'ends_with'
  | 'is_null'
  | 'is_not_null'
  | 'between'; // range

/** Chart visualization types */
type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'funnel'
  | 'kpi'        // single metric card
  | 'table'      // data table
  | 'combo';     // mixed bar + line

/** A single metric (Y-axis) */
interface ReportMetric {
  id: string;
  field: string;           // e.g., "amount", "id"
  aggregate: AggregateFunction;
  label?: string;          // display name
  format?: 'number' | 'currency' | 'percentage';
  decimals?: number;
  color?: string;          // hex or Tailwind color key
}

/** A dimension (X-axis or GROUP BY) */
interface ReportDimension {
  id: string;
  field: string;           // e.g., "lifecycleStage", "createdAt"
  type: 'categorical' | 'temporal' | 'numeric_bucket';
  granularity?: TimeGranularity;     // only for temporal
  bucketSize?: number;               // only for numeric_bucket
  label?: string;
  sortOrder?: 'asc' | 'desc';
}

/** A single filter condition */
interface ReportFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | number[];
  /** For 'between' operator */
  valueTo?: string | number;
}

/** Calculated field / formula */
interface CalculatedField {
  id: string;
  name: string;
  formula: string;         // e.g., "won_deals / total_deals * 100"
  /** References to metrics used in formula */
  metricRefs: string[];
  format?: 'number' | 'currency' | 'percentage';
}

/** Chart-specific visualization options */
interface ChartOptions {
  chartType: ChartType;
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  colorScheme?: string[];
  /** KPI-specific */
  comparisonPeriod?: 'previous_period' | 'previous_year';
  trendLine?: boolean;
}

/** Complete report definition -- stored as JSON in database */
interface ReportDefinition {
  version: '1.0';
  dataSource: ReportDataSource;

  /** Joins to related entities */
  joins?: {
    entity: ReportDataSource;
    type: 'inner' | 'left';
    on: { source: string; target: string };
  }[];

  metrics: ReportMetric[];
  dimensions: ReportDimension[];
  filters: ReportFilter[];
  calculatedFields?: CalculatedField[];

  /** Default sort */
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };

  /** Row limit */
  limit?: number;

  /** Visualization */
  chart: ChartOptions;

  /** Date range (relative or absolute) */
  dateRange: {
    type: 'relative' | 'absolute';
    /** For relative: "last_7_days", "last_30_days", "this_month", "this_quarter", "this_year" */
    preset?: string;
    /** For absolute */
    start?: string; // ISO date
    end?: string;   // ISO date
    /** Which date field to use */
    dateField: string; // e.g., "createdAt", "closeDate"
  };
}
```

#### 3.1.2 Example Report Definition (JSON)

```json
{
  "version": "1.0",
  "dataSource": "deals",
  "joins": [
    {
      "entity": "contacts",
      "type": "left",
      "on": { "source": "id", "target": "dealId" }
    }
  ],
  "metrics": [
    {
      "id": "m1",
      "field": "id",
      "aggregate": "count",
      "label": "Total Deals",
      "format": "number"
    },
    {
      "id": "m2",
      "field": "amount",
      "aggregate": "sum",
      "label": "Total Revenue",
      "format": "currency",
      "color": "#0891b2"
    },
    {
      "id": "m3",
      "field": "amount",
      "aggregate": "avg",
      "label": "Avg Deal Size",
      "format": "currency"
    }
  ],
  "dimensions": [
    {
      "id": "d1",
      "field": "createdAt",
      "type": "temporal",
      "granularity": "month",
      "label": "Month"
    }
  ],
  "filters": [
    {
      "id": "f1",
      "field": "deletedAt",
      "operator": "is_null",
      "value": true
    },
    {
      "id": "f2",
      "field": "dealType",
      "operator": "eq",
      "value": "newbusiness"
    }
  ],
  "chart": {
    "chartType": "bar",
    "stacked": false,
    "showLegend": true,
    "showGrid": true,
    "showTooltip": true,
    "orientation": "vertical"
  },
  "dateRange": {
    "type": "relative",
    "preset": "this_year",
    "dateField": "createdAt"
  }
}
```

### 3.2 Dynamic Query Builder

The query builder converts a `ReportDefinition` JSON into a parameterized PostgreSQL query. This is the most security-critical component.

#### 3.2.1 Architecture

```
ReportDefinition (JSON)
       |
       v
  [Zod Validation] -- reject invalid definitions
       |
       v
  [Field Whitelist Check] -- only allowed columns
       |
       v
  [Query Builder] -- construct parameterized SQL
       |
       v
  [Parameterized SQL + values[]]
       |
       v
  [prisma.$queryRawUnsafe(sql, ...params)]
       |
       v
  [Result Transformer] -- format for chart consumption
```

#### 3.2.2 Safe SQL Generation

**Security rules:**
1. **Whitelist all column names** -- never interpolate user-provided field names directly
2. **Parameterize all values** -- use `$1`, `$2`, etc. for all filter values
3. **Tenant isolation** -- always inject `WHERE "tenantId" = $1` as the first condition
4. **No raw SQL from users** -- calculated fields use a safe expression parser, not eval

```typescript
// src/lib/reports/query-builder.ts

import { z } from 'zod';

/** Whitelist of allowed fields per data source */
const FIELD_WHITELIST: Record<string, Set<string>> = {
  deals: new Set([
    'id', 'name', 'amount', 'currency', 'closeDate', 'createdAt',
    'updatedAt', 'pipelineId', 'stageId', 'ownerId', 'dealType',
    'priority', 'probability', 'closedAt', 'closedReason',
  ]),
  contacts: new Set([
    'id', 'email', 'firstName', 'lastName', 'phone', 'lifecycleStage',
    'leadStatus', 'ownerId', 'jobTitle', 'city', 'state', 'country',
    'createdAt', 'updatedAt',
  ]),
  companies: new Set([
    'id', 'name', 'domain', 'industry', 'type', 'size',
    'annualRevenue', 'ownerId', 'lifecycleStage', 'city', 'state',
    'country', 'createdAt', 'updatedAt',
  ]),
  activities: new Set([
    'id', 'type', 'subject', 'contactId', 'companyId', 'dealId',
    'ownerId', 'dueDate', 'status', 'callDuration', 'callOutcome',
    'callDirection', 'emailStatus', 'createdAt',
  ]),
  form_submissions: new Set([
    'id', 'formId', 'contactId', 'isSpam', 'submittedAt',
  ]),
};

/** Map data source names to Prisma table names */
const TABLE_MAP: Record<string, string> = {
  deals: '"Deal"',
  contacts: '"Contact"',
  companies: '"Company"',
  activities: '"Activity"',
  form_submissions: '"FormSubmission"',
};

/** Aggregate function SQL mapping */
const AGG_MAP: Record<string, string> = {
  count: 'COUNT',
  count_distinct: 'COUNT(DISTINCT',
  sum: 'SUM',
  avg: 'AVG',
  min: 'MIN',
  max: 'MAX',
};

function validateField(
  dataSource: string,
  field: string
): string {
  const whitelist = FIELD_WHITELIST[dataSource];
  if (!whitelist || !whitelist.has(field)) {
    throw new Error(`Field "${field}" is not allowed for data source "${dataSource}"`);
  }
  // Return double-quoted column name (safe against SQL injection)
  return `"${field}"`;
}

interface BuildQueryResult {
  sql: string;
  params: unknown[];
}

export function buildReportQuery(
  definition: ReportDefinition,
  tenantId: string
): BuildQueryResult {
  const params: unknown[] = [tenantId]; // $1 is always tenantId
  let paramIndex = 2;

  const table = TABLE_MAP[definition.dataSource];
  if (!table) throw new Error(`Unknown data source: ${definition.dataSource}`);

  // SELECT clause
  const selectParts: string[] = [];

  // Dimensions
  for (const dim of definition.dimensions) {
    const col = validateField(definition.dataSource, dim.field);
    if (dim.type === 'temporal' && dim.granularity) {
      selectParts.push(
        `DATE_TRUNC('${dim.granularity}', ${col}) AS "${dim.id}"`
      );
    } else {
      selectParts.push(`${col} AS "${dim.id}"`);
    }
  }

  // Metrics
  for (const metric of definition.metrics) {
    const col = validateField(definition.dataSource, metric.field);
    const agg = AGG_MAP[metric.aggregate];
    if (!agg) throw new Error(`Unknown aggregate: ${metric.aggregate}`);

    if (metric.aggregate === 'count_distinct') {
      selectParts.push(`${agg} ${col}) AS "${metric.id}"`);
    } else {
      selectParts.push(`${agg}(${col}) AS "${metric.id}"`);
    }
  }

  // WHERE clause
  const whereParts: string[] = [
    `${table}."tenantId" = $1`,
    `${table}."deletedAt" IS NULL`, // soft delete
  ];

  // Date range
  if (definition.dateRange) {
    const dateCol = validateField(definition.dataSource, definition.dateRange.dateField);
    const { start, end } = resolveDateRange(definition.dateRange);

    if (start) {
      whereParts.push(`${dateCol} >= $${paramIndex}`);
      params.push(start);
      paramIndex++;
    }
    if (end) {
      whereParts.push(`${dateCol} <= $${paramIndex}`);
      params.push(end);
      paramIndex++;
    }
  }

  // User-defined filters
  for (const filter of definition.filters) {
    if (filter.field === 'deletedAt') continue; // already handled
    const col = validateField(definition.dataSource, filter.field);
    const { clause, newParams } = buildFilterClause(
      col, filter, paramIndex
    );
    whereParts.push(clause);
    params.push(...newParams);
    paramIndex += newParams.length;
  }

  // GROUP BY clause
  const groupByParts = definition.dimensions.map((dim) => {
    const col = validateField(definition.dataSource, dim.field);
    if (dim.type === 'temporal' && dim.granularity) {
      return `DATE_TRUNC('${dim.granularity}', ${col})`;
    }
    return col;
  });

  // ORDER BY clause
  let orderByClause = '';
  if (definition.orderBy) {
    const col = validateField(definition.dataSource, definition.orderBy.field);
    orderByClause = `ORDER BY ${col} ${definition.orderBy.direction === 'desc' ? 'DESC' : 'ASC'}`;
  } else if (definition.dimensions.length > 0) {
    // Default: order by first dimension
    orderByClause = `ORDER BY "${definition.dimensions[0].id}" ASC`;
  }

  // LIMIT clause
  const limitClause = definition.limit ? `LIMIT ${Math.min(definition.limit, 10000)}` : 'LIMIT 10000';

  // Assemble
  const sql = [
    `SELECT ${selectParts.join(', ')}`,
    `FROM ${table}`,
    `WHERE ${whereParts.join(' AND ')}`,
    groupByParts.length > 0 ? `GROUP BY ${groupByParts.join(', ')}` : '',
    orderByClause,
    limitClause,
  ].filter(Boolean).join('\n');

  return { sql, params };
}

function buildFilterClause(
  col: string,
  filter: ReportFilter,
  startIdx: number
): { clause: string; newParams: unknown[] } {
  const params: unknown[] = [];
  let clause = '';

  switch (filter.operator) {
    case 'eq':
      clause = `${col} = $${startIdx}`;
      params.push(filter.value);
      break;
    case 'neq':
      clause = `${col} != $${startIdx}`;
      params.push(filter.value);
      break;
    case 'gt':
      clause = `${col} > $${startIdx}`;
      params.push(filter.value);
      break;
    case 'gte':
      clause = `${col} >= $${startIdx}`;
      params.push(filter.value);
      break;
    case 'lt':
      clause = `${col} < $${startIdx}`;
      params.push(filter.value);
      break;
    case 'lte':
      clause = `${col} <= $${startIdx}`;
      params.push(filter.value);
      break;
    case 'in':
      if (!Array.isArray(filter.value)) throw new Error('IN filter requires array value');
      const placeholders = filter.value.map((_, i) => `$${startIdx + i}`);
      clause = `${col} IN (${placeholders.join(', ')})`;
      params.push(...filter.value);
      break;
    case 'not_in':
      if (!Array.isArray(filter.value)) throw new Error('NOT IN filter requires array value');
      const notPlaceholders = filter.value.map((_, i) => `$${startIdx + i}`);
      clause = `${col} NOT IN (${notPlaceholders.join(', ')})`;
      params.push(...filter.value);
      break;
    case 'contains':
      clause = `${col} ILIKE $${startIdx}`;
      params.push(`%${filter.value}%`);
      break;
    case 'starts_with':
      clause = `${col} ILIKE $${startIdx}`;
      params.push(`${filter.value}%`);
      break;
    case 'ends_with':
      clause = `${col} ILIKE $${startIdx}`;
      params.push(`%${filter.value}`);
      break;
    case 'is_null':
      clause = `${col} IS NULL`;
      break;
    case 'is_not_null':
      clause = `${col} IS NOT NULL`;
      break;
    case 'between':
      clause = `${col} BETWEEN $${startIdx} AND $${startIdx + 1}`;
      params.push(filter.value, filter.valueTo);
      break;
    default:
      throw new Error(`Unknown filter operator: ${filter.operator}`);
  }

  return { clause, newParams: params };
}

function resolveDateRange(
  dateRange: ReportDefinition['dateRange']
): { start: Date | null; end: Date | null } {
  if (dateRange.type === 'absolute') {
    return {
      start: dateRange.start ? new Date(dateRange.start) : null,
      end: dateRange.end ? new Date(dateRange.end) : null,
    };
  }

  const now = new Date();
  switch (dateRange.preset) {
    case 'last_7_days':
      return { start: new Date(now.getTime() - 7 * 86400000), end: now };
    case 'last_30_days':
      return { start: new Date(now.getTime() - 30 * 86400000), end: now };
    case 'last_90_days':
      return { start: new Date(now.getTime() - 90 * 86400000), end: now };
    case 'this_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
    case 'this_quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        start: new Date(now.getFullYear(), qMonth, 1),
        end: now,
      };
    }
    case 'this_year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: now,
      };
    default:
      return { start: null, end: null };
  }
}
```

### 3.3 Calculated Fields / Formulas

Calculated fields allow users to define derived metrics (e.g., "win rate = won / total * 100"). These must be evaluated safely without `eval()`.

**Safe approach:** Use a whitelist-based expression tokenizer.

```typescript
// src/lib/reports/formula-engine.ts

/** Allowed tokens in calculated field formulas */
const ALLOWED_OPERATORS = new Set(['+', '-', '*', '/', '(', ')']);
const NUMBER_REGEX = /^\d+(\.\d+)?$/;

interface FormulaContext {
  /** Map of metric ID to computed value */
  metrics: Record<string, number>;
}

/**
 * Evaluate a safe formula expression.
 * Only supports: metric references, numbers, and basic arithmetic.
 * Examples: "m1 / m2 * 100", "(m1 - m2) / m1"
 */
export function evaluateFormula(
  formula: string,
  context: FormulaContext
): number {
  // Tokenize
  const tokens = formula.match(/[a-zA-Z_]\w*|\d+\.?\d*|[+\-*/()]/g);
  if (!tokens) throw new Error('Invalid formula');

  // Validate and substitute
  const expression = tokens.map((token) => {
    if (ALLOWED_OPERATORS.has(token)) return token;
    if (NUMBER_REGEX.test(token)) return token;
    if (token in context.metrics) {
      const val = context.metrics[token];
      return val === 0 ? '0' : String(val);
    }
    throw new Error(`Unknown token in formula: "${token}"`);
  }).join(' ');

  // Use Function constructor with no external scope access
  // This is safer than eval() but still runs in a sandbox
  const fn = new Function(`"use strict"; return (${expression});`);
  const result = fn();

  if (typeof result !== 'number' || !isFinite(result)) {
    return 0; // Division by zero or NaN -> return 0
  }

  return result;
}
```

---

## 4. Dashboard State Management

### 4.1 Widget Grid Layout: react-grid-layout

**Library:** `react-grid-layout` (5.3k stars, actively maintained)

**Why this library:**
- Purpose-built for React dashboard grids
- Drag-and-drop + resize out of the box
- Responsive breakpoint support
- Serializable layout state (JSON-friendly)
- TypeScript support
- Used by Grafana, Jupyter, and many production dashboards

**Installation:**

```bash
npm install react-grid-layout
npm install --save-dev @types/react-grid-layout
```

### 4.2 Dashboard Layout Serialization

#### 4.2.1 Layout Schema

```typescript
// src/types/dashboard.ts

import type { Layout } from 'react-grid-layout';

/** Breakpoint-specific layouts */
interface ResponsiveLayouts {
  lg: Layout[];  // >= 1200px
  md: Layout[];  // >= 996px
  sm: Layout[];  // >= 768px
  xs: Layout[];  // >= 480px
}

/** A single dashboard widget configuration */
interface DashboardWidget {
  id: string;
  /** The report that powers this widget */
  reportId: string;
  /** Widget-level overrides (title, refresh interval) */
  title?: string;
  description?: string;
  /** Auto-refresh interval in seconds (0 = no auto-refresh) */
  refreshInterval?: number;
  /** Widget-specific chart options that override the report's defaults */
  chartOverrides?: Partial<ChartOptions>;
}

/** Complete dashboard configuration -- stored as JSON in database */
interface DashboardDefinition {
  version: '1.0';
  /** Layout positions per breakpoint */
  layouts: ResponsiveLayouts;
  /** Widget configurations keyed by widget ID */
  widgets: Record<string, DashboardWidget>;
  /** Dashboard-level settings */
  settings: {
    /** Global date range applied to all widgets (unless overridden) */
    dateRange?: ReportDefinition['dateRange'];
    /** Global auto-refresh in seconds */
    refreshInterval?: number;
    /** Theme */
    theme?: 'light' | 'dark';
  };
}
```

#### 4.2.2 Dashboard Component

```tsx
// src/components/dashboard/DashboardGrid.tsx

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { DashboardDefinition, DashboardWidget } from '@/types/dashboard';
import { WidgetCard } from './WidgetCard';

const ResponsiveGridLayout = WidthProvider(Responsive);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4 };

interface DashboardGridProps {
  dashboard: DashboardDefinition;
  onLayoutChange: (layouts: DashboardDefinition['layouts']) => void;
  onWidgetRemove: (widgetId: string) => void;
  isEditing: boolean;
}

export function DashboardGrid({
  dashboard,
  onLayoutChange,
  onWidgetRemove,
  isEditing,
}: DashboardGridProps) {
  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
      onLayoutChange(allLayouts as DashboardDefinition['layouts']);
    },
    [onLayoutChange]
  );

  const widgetEntries = useMemo(
    () => Object.entries(dashboard.widgets),
    [dashboard.widgets]
  );

  return (
    <ResponsiveGridLayout
      layouts={dashboard.layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={80}
      isDraggable={isEditing}
      isResizable={isEditing}
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
      compactType="vertical"
      margin={[16, 16]}
    >
      {widgetEntries.map(([id, widget]) => (
        <div key={id}>
          <WidgetCard
            widget={widget}
            isEditing={isEditing}
            onRemove={() => onWidgetRemove(id)}
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
```

### 4.3 Real-Time Data Refresh

**Strategy:** TanStack Query (React Query) for data fetching with configurable stale times.

```typescript
// src/hooks/useReportData.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReportDefinition } from '@/types/reports';

interface UseReportDataOptions {
  reportId: string;
  definition: ReportDefinition;
  /** Refresh interval in milliseconds (0 = no auto-refresh) */
  refetchInterval?: number;
  enabled?: boolean;
}

export function useReportData({
  reportId,
  definition,
  refetchInterval = 0,
  enabled = true,
}: UseReportDataOptions) {
  return useQuery({
    queryKey: ['report', reportId, definition],
    queryFn: async () => {
      const res = await fetch('/api/reports/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, definition }),
      });
      if (!res.ok) throw new Error('Failed to execute report');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 30 * 60 * 1000,       // 30 minutes
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    refetchOnWindowFocus: false,
    enabled,
  });
}
```

### 4.4 Optimistic Dashboard Updates

```typescript
// src/hooks/useDashboardMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DashboardDefinition } from '@/types/dashboard';

export function useSaveDashboard(dashboardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dashboard: DashboardDefinition) => {
      const res = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard),
      });
      if (!res.ok) throw new Error('Failed to save dashboard');
      return res.json();
    },
    // Optimistic update
    onMutate: async (newDashboard) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', dashboardId] });
      const previous = queryClient.getQueryData<DashboardDefinition>(
        ['dashboard', dashboardId]
      );
      queryClient.setQueryData(['dashboard', dashboardId], newDashboard);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['dashboard', dashboardId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
    },
  });
}
```

---

## 5. Performance Considerations

### 5.1 Query Caching Strategy

**Three-layer caching architecture:**

```
Layer 1: Browser Cache (TanStack Query)
  - staleTime: 5 min for dashboard widgets
  - staleTime: 30 min for report definitions
  - gcTime: 30 min
  - Auto-deduplication of concurrent requests

Layer 2: Next.js Server Cache (Route Handler)
  - Cache-Control: s-maxage=60, stale-while-revalidate=300
  - Cache key: tenantId + reportId + filterHash
  - Invalidation: on data mutations via revalidateTag

Layer 3: Database Cache (Materialized Views)
  - Pre-computed aggregates for expensive reports
  - Refreshed on schedule (every 15 min) or on-demand
  - Used for dashboard KPI cards and summary widgets
```

**API route caching example:**

```typescript
// src/app/api/reports/execute/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { buildReportQuery } from '@/lib/reports/query-builder';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  const { reportId, definition } = await request.json();
  const tenantId = await getTenantId(request); // from auth

  // Build and execute query
  const { sql, params } = buildReportQuery(definition, tenantId);
  const data = await prisma.$queryRawUnsafe(sql, ...params);

  // Cache key based on query parameters
  const cacheKey = createHash('sha256')
    .update(JSON.stringify({ tenantId, reportId, definition }))
    .digest('hex');

  return NextResponse.json(
    { data, cacheKey },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        'X-Cache-Key': cacheKey,
      },
    }
  );
}
```

### 5.2 Pagination for Large Datasets

```typescript
// Cursor-based pagination for table-type report widgets
interface PaginatedReportRequest {
  definition: ReportDefinition;
  cursor?: string;    // Last row ID or composite key
  pageSize: number;   // Default 50, max 200
}

// In query builder, append:
// WHERE ... AND "id" > $cursor
// ORDER BY "id" ASC
// LIMIT $pageSize + 1  (to detect hasMore)
```

### 5.3 Lazy-Loading Widgets

```tsx
// src/components/dashboard/LazyWidget.tsx

'use client';

import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';

interface LazyWidgetProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWidget({ children, fallback }: LazyWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    threshold: 0.1,
    rootMargin: '200px', // Start loading 200px before visible
    triggerOnce: true,
  });

  return (
    <div ref={ref} className="min-h-[200px]">
      {isInView ? children : (fallback ?? <WidgetSkeleton />)}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
      <div className="h-4 w-1/3 rounded bg-gray-200 mb-4" />
      <div className="h-48 rounded bg-gray-100" />
    </div>
  );
}
```

### 5.4 Web Workers for Data Processing

For client-side data transformations (pivoting, sorting, formatting) on large datasets:

```typescript
// src/workers/report-data.worker.ts

interface WorkerMessage {
  type: 'transform';
  data: Record<string, unknown>[];
  operations: {
    sort?: { field: string; direction: 'asc' | 'desc' };
    pivot?: { rows: string[]; columns: string[]; values: string[] };
    format?: Record<string, 'currency' | 'percentage' | 'number'>;
  };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data, operations } = event.data;

  if (type === 'transform') {
    let result = [...data];

    // Sort
    if (operations.sort) {
      const { field, direction } = operations.sort;
      result.sort((a, b) => {
        const aVal = a[field] as number;
        const bVal = b[field] as number;
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    // Additional transformations...

    self.postMessage({ type: 'result', data: result });
  }
};
```

```typescript
// src/hooks/useWorkerTransform.ts

import { useEffect, useRef, useState } from 'react';

export function useWorkerTransform<T>(
  data: T[] | undefined,
  operations: Record<string, unknown>
) {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/report-data.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      setResult(event.data.data);
      setIsProcessing(false);
    };

    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    if (data && workerRef.current) {
      setIsProcessing(true);
      workerRef.current.postMessage({
        type: 'transform',
        data,
        operations,
      });
    }
  }, [data, operations]);

  return { result, isProcessing };
}
```

### 5.5 Database Indexing for Reporting

#### 5.5.1 Recommended Indexes

The existing schema already includes good indexes for OLTP queries. For reporting, add these composite and partial indexes:

```sql
-- Composite indexes for common report GROUP BY patterns

-- Deals: pipeline + stage + date (most common deal report)
CREATE INDEX idx_deal_reporting
  ON "Deal" ("tenantId", "pipelineId", "stageId", "createdAt")
  WHERE "deletedAt" IS NULL;

-- Deals: owner + date (sales rep performance report)
CREATE INDEX idx_deal_owner_reporting
  ON "Deal" ("tenantId", "ownerId", "createdAt")
  WHERE "deletedAt" IS NULL;

-- Deals: close date for forecast reports
CREATE INDEX idx_deal_forecast
  ON "Deal" ("tenantId", "closeDate", "amount")
  WHERE "deletedAt" IS NULL AND "closedReason" IS NULL;

-- Contacts: lifecycle stage funnel
CREATE INDEX idx_contact_funnel
  ON "Contact" ("tenantId", "lifecycleStage", "createdAt")
  WHERE "deletedAt" IS NULL;

-- Activities: type + date (activity reports)
CREATE INDEX idx_activity_reporting
  ON "Activity" ("tenantId", "type", "createdAt");

-- Activities: owner + type (rep activity reports)
CREATE INDEX idx_activity_owner_reporting
  ON "Activity" ("tenantId", "ownerId", "type", "createdAt");
```

#### 5.5.2 EXPLAIN ANALYZE for Validation

Always validate report queries with EXPLAIN ANALYZE before deploying:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  DATE_TRUNC('month', "createdAt") AS month,
  COUNT(*) AS deal_count,
  SUM(amount) AS revenue
FROM "Deal"
WHERE "tenantId" = 'tenant-uuid-here'
  AND "deletedAt" IS NULL
  AND "createdAt" >= '2026-01-01'
GROUP BY 1
ORDER BY 1;

-- Target: < 100ms for most report queries
-- Red flag: Sequential Scan on large tables -> add index
-- Red flag: Nested Loop with high row estimates -> review joins
```

---

## 6. Prisma Schema Design

### 6.1 Report Model

```prisma
// ============================================
// REPORTING HUB MODELS
// ============================================

model Report {
  id            String    @id @default(uuid())
  tenantId      String

  // Basic Info
  name          String
  description   String?   @db.Text
  slug          String?   // URL-friendly identifier

  // Report Configuration (JSON -- see ReportDefinition type)
  definition    Json      // ReportDefinition JSON
  version       Int       @default(1) // Schema version for migrations

  // Categorization
  category      String?   // sales, marketing, service, custom
  tags          String[]  @default([])

  // Access Control
  visibility    String    @default("private") // private, team, public
  ownerId       String
  sharedWith    Json      @default("[]") // Array of user IDs or team IDs

  // Metadata
  isFavorite    Boolean   @default(false)
  isSystem      Boolean   @default(false) // System reports cannot be deleted
  lastRunAt     DateTime?
  runCount      Int       @default(0)

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  createdBy     String?
  updatedBy     String?

  // Relations
  owner         User      @relation("ReportOwner", fields: [ownerId], references: [id])
  dashboardWidgets DashboardWidget[]
  schedules     ReportSchedule[]

  @@index([tenantId])
  @@index([tenantId, category])
  @@index([ownerId])
  @@index([tenantId, visibility])
  @@index([deletedAt])
  @@unique([tenantId, slug])
}

model Dashboard {
  id            String    @id @default(uuid())
  tenantId      String

  // Basic Info
  name          String
  description   String?   @db.Text
  slug          String?

  // Layout Configuration (JSON -- see DashboardDefinition type)
  definition    Json      // DashboardDefinition JSON
  version       Int       @default(1)

  // Access Control
  visibility    String    @default("private") // private, team, public
  ownerId       String
  sharedWith    Json      @default("[]")

  // Settings
  isDefault     Boolean   @default(false) // Default dashboard for new users
  isFavorite    Boolean   @default(false)
  isSystem      Boolean   @default(false)

  // Global settings
  refreshInterval Int     @default(0) // Auto-refresh in seconds (0 = off)
  dateRangePreset String? // Global date range preset

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  createdBy     String?
  updatedBy     String?

  // Relations
  owner         User      @relation("DashboardOwner", fields: [ownerId], references: [id])
  widgets       DashboardWidget[]

  @@index([tenantId])
  @@index([ownerId])
  @@index([tenantId, isDefault])
  @@index([tenantId, visibility])
  @@index([deletedAt])
  @@unique([tenantId, slug])
}

model DashboardWidget {
  id            String    @id @default(uuid())

  // Parent dashboard
  dashboardId   String

  // Source report
  reportId      String

  // Widget-level overrides
  title         String?
  description   String?

  // Layout position (react-grid-layout format)
  // Stored here as well as in Dashboard.definition for fast widget queries
  layoutConfig  Json      @default("{}") // { x, y, w, h, minW, minH }

  // Widget settings
  refreshInterval Int     @default(0)
  chartOverrides  Json    @default("{}") // Partial ChartOptions

  // Display order (fallback if grid layout unavailable)
  orderIndex    Int       @default(0)

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  dashboard     Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  report        Report    @relation(fields: [reportId], references: [id])

  @@index([dashboardId])
  @@index([reportId])
}

model ReportSchedule {
  id            String    @id @default(uuid())
  tenantId      String

  // Source report
  reportId      String

  // Schedule configuration
  frequency     String    // daily, weekly, monthly
  dayOfWeek     Int?      // 0=Sun, 1=Mon, ..., 6=Sat (for weekly)
  dayOfMonth    Int?      // 1-28 (for monthly)
  hour          Int       @default(8) // Hour in UTC (0-23)
  minute        Int       @default(0) // Minute (0-59)
  timezone      String    @default("UTC")

  // Delivery
  format        String    @default("pdf") // pdf, csv, xlsx
  recipients    Json      // Array of email addresses
  subject       String?   // Custom email subject
  message       String?   @db.Text // Custom email body

  // Status
  isActive      Boolean   @default(true)
  lastSentAt    DateTime?
  lastError     String?   @db.Text
  sendCount     Int       @default(0)

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  report        Report    @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([reportId])
  @@index([isActive, frequency])
}
```

### 6.2 Required User Model Extensions

Add these relations to the existing `User` model:

```prisma
model User {
  // ... existing fields ...

  // New relations for Reporting Hub
  reports       Report[]    @relation("ReportOwner")
  dashboards    Dashboard[] @relation("DashboardOwner")
}
```

### 6.3 Required Tenant Model Extensions

Add these relations to the existing `Tenant` model:

```prisma
model Tenant {
  // ... existing fields ...

  // Note: tenantId is stored on Report, Dashboard, ReportSchedule
  // but relations go through User (owner).
  // No direct Tenant -> Report relation needed unless
  // querying all reports across all users in a tenant.
}
```

### 6.4 Materialized View Refresh Log

```prisma
// This is managed via raw SQL, not Prisma model
// CREATE TABLE mv_refresh_log (
//   mv_name TEXT PRIMARY KEY,
//   last_refresh_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   refresh_duration_ms INTEGER,
//   status TEXT DEFAULT 'success' -- success, error
// );
```

### 6.5 Entity Relationship Diagram

```
                    +-----------+
                    |   Tenant  |
                    +-----+-----+
                          |
                    +-----+-----+
                    |   User    |
                    +-----+-----+
                     /    |    \
                    /     |     \
          +--------+ +---+----+ +----------+
          | Report | |Dashboard| |  ...     |
          +---+----+ +---+----+ +----------+
              |           |
              |     +-----+-------+
              +-----|DashboardWidget|
              |     +-------------+
              |
        +-----+--------+
        |ReportSchedule|
        +--------------+
```

---

## 7. Final Recommendations

### 7.1 Technology Stack Summary

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| **Chart Library** | Tremor (copy-paste) + Recharts | Tailwind-native, dashboard-first, beautiful defaults |
| **Grid Layout** | react-grid-layout | Industry standard for dashboard widget grids |
| **Data Fetching** | TanStack Query v5 | Caching, deduplication, refetch intervals |
| **State Management** | React Context + TanStack Query | No Redux needed; query cache IS the state |
| **Date Handling** | date-fns | Tree-shakeable, immutable, TypeScript |
| **Query Builder** | Custom (see section 3.2) | Whitelist-based, parameterized, tenant-isolated |
| **Materialized Views** | PostgreSQL native | Pre-computed aggregates for KPI cards |
| **Formula Engine** | Custom tokenizer (see section 3.3) | Safe, no eval(), whitelist-based |

### 7.2 New Dependencies to Install

```bash
# Chart rendering (Tremor uses Recharts under the hood)
npm install recharts

# Dashboard grid layout
npm install react-grid-layout
npm install --save-dev @types/react-grid-layout

# Data fetching and caching
npm install @tanstack/react-query

# Date manipulation (for report date ranges)
npm install date-fns

# CSV/Excel export for scheduled reports (future)
# npm install papaparse xlsx
```

### 7.3 File Structure

```
src/
  app/
    (dashboard)/
      reports/
        page.tsx                    # Report list page
        [id]/
          page.tsx                  # Report detail/view page
          edit/
            page.tsx                # Report builder page
        new/
          page.tsx                  # New report builder
      dashboards/
        page.tsx                    # Dashboard list
        [id]/
          page.tsx                  # Dashboard view
          edit/
            page.tsx                # Dashboard editor
    api/
      reports/
        route.ts                   # GET (list), POST (create)
        [id]/
          route.ts                 # GET, PUT, DELETE
        execute/
          route.ts                 # POST (execute report query)
      dashboards/
        route.ts                   # GET (list), POST (create)
        [id]/
          route.ts                 # GET, PUT, DELETE
          widgets/
            route.ts               # POST (add widget)
            [widgetId]/
              route.ts             # PUT, DELETE
      report-schedules/
        route.ts                   # CRUD for schedules
  components/
    charts/                        # Tremor copy-paste chart components
      AreaChart.tsx
      BarChart.tsx
      LineChart.tsx
      DonutChart.tsx
      ComboChart.tsx
      SparkChart.tsx
      KPICard.tsx
      chartUtils.ts
    reports/
      ReportBuilder.tsx            # Main report builder form
      ReportPreview.tsx            # Live chart preview
      ReportFilterBar.tsx          # Filter configuration UI
      MetricSelector.tsx           # Metric picker
      DimensionSelector.tsx        # Dimension picker
      ChartTypePicker.tsx          # Chart type selection
      DateRangePicker.tsx          # Date range selector
      ReportCard.tsx               # Report list card
    dashboard/
      DashboardGrid.tsx            # react-grid-layout wrapper
      WidgetCard.tsx               # Individual widget container
      LazyWidget.tsx               # Intersection observer wrapper
      AddWidgetDialog.tsx          # Widget picker dialog
      DashboardToolbar.tsx         # Edit/save/share controls
  lib/
    reports/
      query-builder.ts            # Report definition -> SQL
      formula-engine.ts           # Calculated field evaluator
      date-utils.ts               # Date range presets
      export.ts                   # CSV/PDF export
    charts/
      chartUtils.ts               # Color utilities from Tremor
      theme.ts                    # F-CORE chart theme
  hooks/
    useReportData.ts              # TanStack Query hook for report data
    useDashboardMutation.ts       # Optimistic dashboard save
    useWorkerTransform.ts         # Web Worker data processing
    useInView.ts                  # Intersection observer hook
  types/
    reports.ts                    # ReportDefinition types
    dashboard.ts                  # DashboardDefinition types
  workers/
    report-data.worker.ts         # Web Worker for data transforms
```

### 7.4 Security Checklist

- [ ] All report queries include `WHERE "tenantId" = $1` (tenant isolation)
- [ ] Column names validated against whitelist (no arbitrary SQL injection)
- [ ] All filter values parameterized (`$1`, `$2`, etc.)
- [ ] Report definitions validated with Zod schema before execution
- [ ] Calculated field formulas use safe tokenizer, not eval()
- [ ] Row limit enforced (max 10,000 rows per query)
- [ ] Dashboard visibility respects team/role access control
- [ ] API routes check ownership before allowing edit/delete
- [ ] `deletedAt IS NULL` always appended for soft-delete entities
- [ ] EXPLAIN ANALYZE run on new report patterns during development

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- Prisma schema migration (Report, Dashboard, DashboardWidget, ReportSchedule)
- Install dependencies (recharts, react-grid-layout, @tanstack/react-query)
- Copy Tremor chart components into `src/components/charts/`
- Implement chart theme with F-CORE brand colors
- Build query builder engine with field whitelist and parameterization

### Phase 2: Report Builder UI (Week 3-4)
- Report builder page with metric/dimension/filter selectors
- Live chart preview with Tremor components
- Report CRUD API routes
- Date range picker with presets
- Report list page with search and filters

### Phase 3: Dashboard Builder (Week 5-6)
- Dashboard grid with react-grid-layout
- Widget add/remove/resize/drag
- Dashboard CRUD API routes
- Lazy-loading widgets with intersection observer
- TanStack Query integration with refetch intervals

### Phase 4: Performance and Polish (Week 7-8)
- Materialized views for KPI dashboards
- Reporting-specific database indexes
- Web Worker data transforms for table widgets
- Export to CSV/PDF
- Report scheduling (cron-based email delivery)

---

## References

1. [Recharts Documentation](https://recharts.org/)
2. [Tremor Components](https://tremor.so/)
3. [react-grid-layout GitHub](https://github.com/react-grid-layout/react-grid-layout)
4. [TanStack Query Documentation](https://tanstack.com/query/latest)
5. [Prisma Aggregation & Grouping](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing)
6. [Prisma Views Support](https://www.prisma.io/docs/orm/prisma-schema/data-model/views)
7. [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
8. [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
9. [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching)
10. [Grafana Dashboard JSON Schema v2](https://grafana.com/docs/grafana/latest/as-code/observability-as-code/schema-v2/)
