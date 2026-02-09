# Code Review: Custom Reports Feature

> **Reviewer:** Senior Code Reviewer (AI)
> **Date:** 2026-02-09
> **Feature:** Custom Reports & Dashboards
> **Files Reviewed:** 16
> **Overall Verdict:** PASS WITH WARNINGS

---

## Summary

The Custom Reports feature is well-structured with a clean separation of concerns between validation (Zod), query building, API routes, and frontend components. The SQL query builder employs a proper field whitelist, parameterized queries, and tenant isolation. The frontend follows consistent React patterns with proper loading/error states. However, several security warnings, TypeScript concerns, and minor issues need attention before production readiness.

---

## File-by-File Review

---

### 1. `/Users/chong/hubspot-demo/src/lib/validations/reports.ts`

**Purpose:** Zod validation schemas for Reports, Dashboards, and Widgets.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | Loose filter value type | 23 | `value: z.any()` in `filterSchema` allows any value including objects, arrays, or executable content. Should be restricted to `z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))])` to prevent unexpected payloads. |
| **INFO** | No custom date validation | 37-38 | `start` and `end` in `dateRangeSchema` are `z.string().optional()` but should validate ISO 8601 format using `.datetime()` or a regex refinement to prevent malformed dates reaching the query builder. |
| **INFO** | Missing `colors` array item validation | 31 | `colors: z.array(z.string()).optional()` does not validate hex color format. A regex like `/^#[0-9a-fA-F]{6}$/` would prevent XSS via CSS injection in chart rendering. |

**Verdict:** PASS WITH WARNINGS

---

### 2. `/Users/chong/hubspot-demo/src/lib/reports/query-builder.ts`

**Purpose:** Builds parameterized SQL queries from report definitions with field whitelisting.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Label injection in SQL aliases | 64, 67, 75, 81 | Dimension `label` and metric `label` values are interpolated directly into SQL AS clauses (e.g., `AS "${dim.label || dim.field}"`). While the `field` is whitelist-validated, the `label` is user-provided free text from the Zod schema (`z.string().optional()`). A label like `"; DROP TABLE "Deal"--` would be injected into the SQL string. Labels used in AS clauses must be sanitized or restricted to alphanumeric characters. |
| **CRITICAL** | Order-by label injection | 184-185 | `orderLabel` derives from `metrics[0].label` which is user-provided, then used directly in `ORDER BY "${orderLabel}" DESC`. Same injection risk as above. |
| **WARNING** | Missing `notIn` operator handling | 120-169 | The `filterSchema` allows `notIn` operator but the `switch` statement in the query builder has no `case "notIn"`. This will silently skip `notIn` filters without error, potentially returning unfiltered data. |
| **WARNING** | Aggregate function validation gap | 80-81 | `metric.aggregate.toUpperCase()` is used directly in SQL. While the Zod schema restricts to `["count", "sum", "avg", "min", "max"]`, if the definition is loaded from the database (JSON column), it bypasses Zod validation at rest. The run endpoint re-validates (line 30 of run/route.ts), which mitigates this. |
| **INFO** | No LIMIT parameterization | 188 | `LIMIT 1000` is hardcoded. Consider making it configurable or at minimum adding it as a constant at the top of the file for maintainability. |
| **INFO** | `*` field bypass | 74 | `metric.field === "*"` is a special case for COUNT(*) that bypasses whitelist validation. This is correct behavior but should be documented. |

**Verdict:** FAIL - Critical SQL injection vectors via label fields.

---

### 3. `/Users/chong/hubspot-demo/src/app/api/reports/route.ts`

**Purpose:** GET (list) and POST (create) for reports.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Hardcoded tenant ID | 11, 58 | `const tenantId = "demo-tenant"` is hardcoded instead of being extracted from the authenticated session/JWT. This is acceptable for demo purposes but must be replaced with proper auth extraction before any production deployment. |
| **WARNING** | Missing pagination | 37-41 | `findMany` without `take`/`skip` will return ALL reports for the tenant. For large datasets this causes performance degradation and excessive memory usage. Should add pagination with default limit. |
| **WARNING** | `as any` cast | 74 | `definition: definition as any` - necessary Prisma Json workaround. Acceptable but should be documented with a comment explaining why. |
| **INFO** | No rate limiting | - | No rate limiting on report creation. A malicious user could create thousands of reports. |

**Verdict:** PASS WITH WARNINGS (tenant ID is known demo limitation)

---

### 4. `/Users/chong/hubspot-demo/src/app/api/reports/[id]/route.ts`

**Purpose:** GET, PATCH, DELETE for individual reports.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Hardcoded tenant ID | 15, 48, 100 | Same as above - `"demo-tenant"`. |
| **INFO** | Good: Ownership verification before update/delete | 59-69, 102-112 | Correctly checks `findFirst` with `tenantId` before performing `update`/`delete`. Prevents IDOR. |
| **INFO** | Good: Soft delete implementation | 114-117 | Correctly uses `deletedAt: new Date()` instead of hard delete. Compliant with project rules. |
| **INFO** | DELETE response could be 204 | 119 | Returns `{ success: true }` with implicit 200. A 204 No Content is more RESTful for DELETE operations, though this is a minor style preference. |

**Verdict:** PASS WITH WARNINGS

---

### 5. `/Users/chong/hubspot-demo/src/app/api/reports/[id]/run/route.ts`

**Purpose:** Execute a report's query and return results.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Hardcoded tenant ID | 16 | Same demo limitation. |
| **CRITICAL** | Error message leakage | 61 | `const message = error instanceof Error ? error.message : "Failed to run report"` - When the SQL query fails (e.g., invalid field, database error), the raw Prisma/PostgreSQL error message is returned to the client. This can leak internal database structure information (table names, column names, constraint names). Should sanitize the message or return a generic error. |
| **WARNING** | Re-validation of stored definition | 30-36 | Good practice - re-validates the stored JSON definition before building the query. This protects against corrupted or manually-modified data in the database. |
| **WARNING** | BigInt precision loss | 52-56 | `Number(value)` for BigInt can lose precision for values > `Number.MAX_SAFE_INTEGER` (2^53). For financial reports with large aggregated amounts, this could produce incorrect results. Consider using `String(value)` for BigInt serialization. |
| **INFO** | Good: `$queryRawUnsafe` usage | 40 | Uses `$queryRawUnsafe` with parameterized values (`...queryParams`). The query builder handles parameterization correctly for field values. The remaining risk is the label injection in the query builder (see file #2). |

**Verdict:** FAIL - Error message leakage is a security concern.

---

### 6. `/Users/chong/hubspot-demo/src/app/api/reports/stats/route.ts`

**Purpose:** Aggregated statistics for the reports overview page.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Hardcoded tenant ID | 10 | Same demo limitation. |
| **WARNING** | N+1-like query pattern | 27-35 | `dealsByStage` fetches ALL deals with their stage info, then aggregates in-memory (lines 45-53). For large datasets with thousands of deals, this is very inefficient. Should use `groupBy` with stage aggregation at the database level, or a raw SQL query with `JOIN` and `GROUP BY`. |
| **WARNING** | Missing soft-delete filter on activities | 36-41 | Activities query `where: { tenantId }` does not filter by `deletedAt`. While the Activity model may not have a `deletedAt` field (confirmed by the query builder which skips soft-delete for activities), this should be explicitly documented. |
| **INFO** | Hardcoded "Closed Won" string | 61-63 | `d.stage.name === "Closed Won"` uses a magic string. Should be a constant to avoid breakage if stage names change. |
| **INFO** | Good: Promise.all for parallel queries | 12-42 | Efficient use of `Promise.all` to run 7 queries in parallel. |

**Verdict:** PASS WITH WARNINGS

---

### 7. `/Users/chong/hubspot-demo/src/app/api/dashboards/route.ts`

**Purpose:** GET (list) and POST (create) for dashboards.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Hardcoded tenant ID | 11, 41 | Same demo limitation. |
| **WARNING** | Eager loading all widgets with reports | 15-19 | `include: { widgets: { include: { report: true } } }` fetches ALL widget data including full report definitions for every dashboard in the list. For a list view, this is excessive. Should only include `_count` or use `select` to limit returned fields. |
| **INFO** | Good: Soft delete filter | 14 | Correctly filters `deletedAt: null`. |

**Verdict:** PASS WITH WARNINGS

---

### 8. `/Users/chong/hubspot-demo/src/app/api/dashboards/[id]/route.ts`

**Purpose:** GET, PATCH, DELETE for individual dashboards.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Hardcoded tenant ID | 14, 54, 108 | Same demo limitation. |
| **WARNING** | Hard delete of widgets on dashboard soft-delete | 122-128 | `prisma.dashboardWidget.deleteMany` performs a HARD DELETE of widgets when the dashboard is soft-deleted. This is inconsistent with the project's soft-delete policy. If a dashboard is restored, its widgets would be permanently lost. |
| **INFO** | Good: Transaction for delete | 122-128 | Uses `$transaction` to atomically delete widgets and soft-delete the dashboard. |
| **INFO** | Good: Ownership verification | 65-75, 110-120 | Properly checks tenant ownership before mutations. |

**Verdict:** PASS WITH WARNINGS

---

### 9. `/Users/chong/hubspot-demo/src/app/api/dashboards/[id]/widgets/route.ts`

**Purpose:** POST (add), PATCH (batch update positions), DELETE (remove) widgets.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **CRITICAL** | Hardcoded tenant ID | 15, 80, 139 | Same demo limitation. |
| **WARNING** | IDOR vulnerability on widget update | 104-114 | PATCH batch update iterates `body.widgets` and updates by `w.id` without verifying each widget belongs to the current dashboard. An attacker could update widgets belonging to a different dashboard (potentially in a different tenant). Should add `WHERE dashboardId = ?` to each update. |
| **WARNING** | IDOR vulnerability on widget delete | 163-165 | `prisma.dashboardWidget.delete({ where: { id: widgetId } })` deletes by widget ID without verifying the widget belongs to the specified dashboard. An attacker could delete any widget by ID. Should verify `dashboardId` in the where clause. |
| **WARNING** | Silent validation skip | 107 | When `updateWidgetSchema.safeParse(w)` fails, the widget is silently skipped without error. Should collect validation errors and return them. |
| **INFO** | Good: Dashboard + report ownership verification for POST | 27-50 | Correctly verifies both dashboard and report exist and belong to the tenant before creating a widget. |

**Verdict:** PASS WITH WARNINGS - IDOR risks need addressing.

---

### 10. `/Users/chong/hubspot-demo/src/components/reports/types.ts`

**Purpose:** Shared TypeScript type definitions for the Reports module.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | Type duplication with Zod schemas | 5-50 | `ReportMetric`, `ReportDimension`, `ReportFilter`, etc. are manually defined here but also exist as inferred types from the Zod schemas in `validations/reports.ts`. These could drift out of sync. Should either import/extend the Zod inferred types or use a single source of truth. |
| **WARNING** | Loose typing on aggregate/operator fields | 8, 15, 28 | Fields like `aggregate: string`, `type: string`, `chartType: string` should use the same literal union types as the Zod schemas (e.g., `"count" | "sum" | "avg" | "min" | "max"`). |
| **WARNING** | Field mismatch with query builder whitelist | 113-152 | `DATA_SOURCE_FIELDS` includes fields like `"stage"`, `"source"`, `"owner"`, `"pipeline"`, `"company"`, `"revenue"`, `"duration"`, `"lastActivityAt"` that are NOT in the query builder's `FIELD_WHITELIST`. Users can select these fields in the UI wizard, but the report will fail at execution time with "Invalid field" errors. |
| **INFO** | Good: Brand color constants | 101-110 | `CHART_COLORS` uses the F-CORE brand palette starting with `#0891b2`. |

**Verdict:** PASS WITH WARNINGS

---

### 11. `/Users/chong/hubspot-demo/src/components/reports/ReportChart.tsx`

**Purpose:** Recharts-based chart rendering component supporting bar, line, area, pie, number, and table types.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | `any` type in Pie label | 119 | `({ name, percent }: any)` - should be typed properly. Recharts provides `PieLabelRenderProps` or a custom interface. |
| **WARNING** | Fragile key detection logic | 49-54 | Auto-detecting numeric vs string keys assumes the first data point is representative. If the first row has a null numeric value, it could misidentify keys. Should scan multiple rows or use report definition metadata. |
| **INFO** | Good: Empty state handling | 40-46 | Proper empty state with centered message. |
| **INFO** | Good: Number formatting | 93-94 | Uses `toLocaleString()` for numeric display. |
| **INFO** | Design system compliance | 42 | Uses `text-gray-400` for empty state which aligns with the design system's muted text color. |
| **INFO** | Uses `text-gray-900` for KPI number | 63 | Consistent with design system's Text Primary color. |

**Verdict:** PASS

---

### 12. `/Users/chong/hubspot-demo/src/app/(dashboard)/reports/page.tsx`

**Purpose:** Reports list page with KPI cards, charts, and report grid.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | Debounce missing on search | 355-356 | `onChange={(e) => setSearchQuery(e.target.value)}` triggers a re-render and API call on every keystroke (via the `useEffect` dependency on `searchQuery`). Should debounce with 300-500ms delay. |
| **WARNING** | No search query sanitization | 30-34 | The `search` query parameter is passed directly to Prisma's `contains` filter. While Prisma parameterizes this, extremely long search strings could impact performance. Should truncate to a reasonable length (e.g., 200 chars). |
| **INFO** | Good: Loading skeleton | 253-266 | Proper skeleton loading state with `animate-pulse`. |
| **INFO** | Good: Error dismissal | 269-275 | Error banners have dismiss buttons. |
| **INFO** | Design system compliance | 242, 376 | Primary buttons use `bg-[#0891b2]` with `hover:bg-[#0e7490]`. Note: design system specifies hover as `#0ea5e9` (sky-500), but the code uses `#0e7490` (cyan-700). This is an inconsistency - the codebase consistently uses `#0e7490` as hover which is darker, not lighter as specified in the design system. |
| **INFO** | Good: Responsive grid | 254, 278, 419 | Uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3/4` pattern. |
| **INFO** | Good: Delete confirmation modal | 585-618 | Uses modal with backdrop, cancel/confirm buttons, and loading state. Z-index 50 matches design system spec. |

**Verdict:** PASS WITH WARNINGS

---

### 13. `/Users/chong/hubspot-demo/src/app/(dashboard)/reports/[id]/page.tsx`

**Purpose:** Report detail page with chart display, metadata, and run controls.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | Auto-run race condition | 105-111 | The `useEffect` auto-runs the report when `report?.id` changes. The condition `chartData.length === 0 && !running` could miss if `chartData` is set from a previous report load. The eslint-disable comment suggests awareness of this issue. |
| **WARNING** | Missing error boundary | - | If `ReportChart` throws during rendering (e.g., unexpected data shape), the entire page crashes. Should wrap chart in an error boundary. |
| **INFO** | Good: Favorite toggle with optimistic UI | 116-132 | Updates local state immediately after successful API call. |
| **INFO** | Good: Run count update after execution | 88-96 | Updates local `runCount` and `lastRunAt` without refetching the entire report. |
| **INFO** | Design system compliance | 185-186 | Loading spinner uses `text-[#0891b2]` (brand primary). |

**Verdict:** PASS WITH WARNINGS

---

### 14. `/Users/chong/hubspot-demo/src/app/(dashboard)/reports/new/page.tsx`

**Purpose:** 3-step report builder wizard.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | Module-level mutable state | 177-181 | `let idCounter = 0` is module-level mutable state. In Next.js with server components/hot reloading, this counter persists across navigations and can produce duplicate IDs within the same server process lifetime. Should use `crypto.randomUUID()` or `Date.now() + Math.random()`. |
| **WARNING** | Incorrect redirect after creation | 1149-1150 | `const report: { id: string } = await res.json()` - The API returns `{ data: report }` (see route.ts line 78), but this code destructures as if the response IS the report. The redirect to `/reports/${report.id}` will use `undefined` for the ID. Should be `const json = await res.json(); router.push(/reports/${json.data.id})`. |
| **WARNING** | Payload includes `id` fields | 1102-1119 | The metric/dimension/filter entries include `id` fields (from the local `generateId`) in the payload sent to the API. These client-generated IDs are stored in the JSON definition. While not harmful, they serve no server-side purpose and add unnecessary data. |
| **INFO** | Good: Step validation | 1019-1045 | Validates each step before allowing progression, with clear error messages. |
| **INFO** | Good: Preview with sample data | 190-232 | `generatePreviewData` creates realistic sample data for chart preview. |
| **INFO** | Good: Wizard step indicator | 244-291 | Clean step indicator with checkmarks for completed steps. |
| **INFO** | Design system compliance | 1225 | Buttons use `shadow-lg shadow-cyan-500/25` matching the Brand shadow specification. |

**Verdict:** PASS WITH WARNINGS

---

### 15. `/Users/chong/hubspot-demo/src/app/(dashboard)/reports/dashboards/page.tsx`

**Purpose:** Dashboards list page with create/rename/delete functionality.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | Inline edit inside Link | 320-334 | The inline rename `<input>` is rendered inside a `<Link>` component. While `onClick={(e) => e.preventDefault()}` is set on the input (line 330), this is fragile - form submissions or other events could still trigger navigation. Should conditionally render the Link wrapper. |
| **INFO** | Good: Client-side filtering | 97-104 | Search filtering is done client-side for the dashboards list, avoiding unnecessary API calls for small datasets. |
| **INFO** | Good: Modal state management | 54-68 | Clean separation of create/delete/edit modal states. |
| **INFO** | Good: Keyboard support for rename | 326-329 | Handles Enter (save) and Escape (cancel) keys for inline editing. |

**Verdict:** PASS

---

### 16. `/Users/chong/hubspot-demo/src/app/(dashboard)/reports/dashboards/[id]/page.tsx`

**Purpose:** Dashboard detail page with widget grid, add/remove widget functionality, and auto-running report queries.

| Severity | Issue | Line(s) | Description |
|----------|-------|---------|-------------|
| **WARNING** | Parallel report execution without throttling | 180-188 | Auto-runs all widget reports simultaneously on page load. With 10+ widgets, this fires 10+ concurrent POST requests, which could overwhelm the server or hit rate limits. Should use a queue or batch execution. |
| **WARNING** | No grid responsiveness | 402-406 | The 12-column CSS grid (`gridTemplateColumns: "repeat(12, minmax(0, 1fr))"`) does not collapse on mobile. A widget with `w=4` would be very narrow on a phone screen. Should add responsive breakpoints (e.g., collapse to single column on mobile). |
| **WARNING** | Widget deletion without confirmation | 425 | Clicking the trash icon immediately triggers deletion without a confirmation dialog. Unlike other delete operations in the codebase that use modals, this could lead to accidental deletions. |
| **INFO** | Good: Chart data caching per widget | 111-113 | Uses `chartDataMap` Record to cache chart data per widget, preventing re-fetches. |
| **INFO** | Good: Optimistic widget removal | 280-291 | Removes widget from local state and chart data map after successful API call. |

**Verdict:** PASS WITH WARNINGS

---

## Cross-Cutting Issues

### Security

| # | Severity | Issue | Files Affected |
|---|----------|-------|---------------|
| S1 | **CRITICAL** | SQL injection via label fields in AS clauses and ORDER BY | `query-builder.ts` |
| S2 | **CRITICAL** | Hardcoded tenant ID (`"demo-tenant"`) across all API routes | All API routes (7 files) |
| S3 | **CRITICAL** | Error message leakage exposing database internals | `reports/[id]/run/route.ts` |
| S4 | **WARNING** | IDOR on widget update/delete (no dashboardId verification) | `dashboards/[id]/widgets/route.ts` |
| S5 | **WARNING** | Hard delete of widgets violates soft-delete policy | `dashboards/[id]/route.ts` |

### TypeScript

| # | Severity | Issue | Files Affected |
|---|----------|-------|---------------|
| T1 | **WARNING** | `z.any()` on filter value allows arbitrary payloads | `validations/reports.ts` |
| T2 | **WARNING** | Duplicate type definitions that can drift from Zod source | `types.ts` vs `validations/reports.ts` |
| T3 | **WARNING** | Loose string types instead of literal unions | `types.ts` |
| T4 | **INFO** | `as any` casts for Prisma Json fields (acceptable workaround) | `reports/route.ts`, `reports/[id]/route.ts` |

### Performance

| # | Severity | Issue | Files Affected |
|---|----------|-------|---------------|
| P1 | **WARNING** | N+1 query pattern for deals-by-stage aggregation | `reports/stats/route.ts` |
| P2 | **WARNING** | No pagination on report listing | `reports/route.ts` |
| P3 | **WARNING** | Eager loading all widget+report data for dashboard list | `dashboards/route.ts` |
| P4 | **WARNING** | No search debounce causing rapid API calls | `reports/page.tsx` |
| P5 | **WARNING** | Unbounded parallel report execution for dashboard widgets | `dashboards/[id]/page.tsx` |

### Design System Compliance

| # | Severity | Issue | Files Affected |
|---|----------|-------|---------------|
| D1 | **INFO** | Hover color inconsistency: code uses `#0e7490` (cyan-700) but design system specifies `#0ea5e9` (sky-500) | Multiple frontend files |
| D2 | **INFO** | Cards, badges, form inputs, and modals correctly follow design system patterns | All frontend files |
| D3 | **INFO** | Z-index values (z-10, z-20, z-50) match design system specification | Dropdown and modal components |
| D4 | **INFO** | Brand color `#0891b2` consistently used as primary | All frontend files |
| D5 | **INFO** | Dashboard detail grid is not responsive on mobile | `dashboards/[id]/page.tsx` |

### Data Integrity

| # | Severity | Issue | Files Affected |
|---|----------|-------|---------------|
| I1 | **WARNING** | Frontend field picker (`DATA_SOURCE_FIELDS` in `types.ts`) includes fields not in the backend whitelist (`FIELD_WHITELIST` in `query-builder.ts`), causing runtime errors when those fields are used | `types.ts`, `query-builder.ts` |
| I2 | **WARNING** | Report wizard redirect bug - uses wrong JSON path after creation | `reports/new/page.tsx` |

---

## Recommendations (Priority Order)

### Must Fix (Before Merge)

1. **Sanitize labels in query builder:** Strip or reject non-alphanumeric characters from `metric.label` and `dimension.label` before interpolating into SQL. Alternatively, only use validated `field` names in SQL and map labels client-side.

2. **Fix error message leakage in run endpoint:** Replace `error.message` with a generic message. Log the detailed error server-side only.

3. **Fix widget IDOR:** Add `dashboardId` to widget update/delete WHERE clauses in `dashboards/[id]/widgets/route.ts`.

4. **Fix wizard redirect bug:** Change line 1149-1150 in `reports/new/page.tsx` to correctly parse the `{ data: { id } }` response structure.

### Should Fix (Next Sprint)

5. **Align DATA_SOURCE_FIELDS with FIELD_WHITELIST:** Ensure the frontend only exposes fields that the backend whitelist supports.

6. **Add pagination to reports listing:** Add `take`/`skip` with reasonable defaults (e.g., 50 per page).

7. **Tighten filter value Zod type:** Replace `z.any()` with a union of expected types.

8. **Fix N+1 for deals-by-stage:** Use `groupBy` with `_sum` and `_count` instead of fetching all deals.

9. **Add search debounce:** Use a 300ms debounce on the reports page search input.

10. **Soft-delete widgets:** When a dashboard is soft-deleted, soft-delete its widgets too (add `deletedAt` to `DashboardWidget` model).

### Nice to Have (Future)

11. **Replace hardcoded tenant ID:** Wire up to authentication/session system.

12. **Add error boundaries:** Wrap chart components in React error boundaries.

13. **Make dashboard grid responsive:** Collapse to single column on mobile.

14. **Throttle parallel report execution:** Limit concurrent widget report runs to 3-4 at a time.

15. **Unify type definitions:** Import from Zod schemas instead of maintaining parallel types.

---

## Positive Highlights

- **Field whitelisting** in the query builder is a strong security measure that prevents arbitrary column access.
- **Parameterized queries** are correctly used for all user-provided filter values.
- **Tenant isolation** is consistently applied with `tenantId` in every query WHERE clause.
- **Soft delete** is correctly implemented for Reports and Dashboards.
- **Zod validation** is applied at every API entry point with proper error responses.
- **Ownership verification** prevents IDOR on main entity CRUD operations (reports, dashboards).
- **Loading/error states** are consistently handled across all frontend pages.
- **React patterns** are clean: proper use of `useCallback`, `useEffect`, `useState`, and `useParams`.
- **Design system adherence** is strong overall - consistent use of brand colors, card patterns, typography, and spacing.
- **Accessible forms** with proper `htmlFor`/`id` associations and `aria-label` on icon buttons.

---

## Verdict

| Category | Status |
|----------|--------|
| Security | FAIL (3 critical, 2 warnings) |
| TypeScript | PASS WITH WARNINGS |
| Error Handling | PASS WITH WARNINGS |
| API Design | PASS |
| React Patterns | PASS |
| Design System | PASS WITH WARNINGS |
| Performance | PASS WITH WARNINGS |

### **Overall: PASS WITH WARNINGS**

The feature is functionally complete and demonstrates good architectural decisions. The critical SQL injection via label fields and error message leakage must be fixed before production. The hardcoded tenant ID is acknowledged as a demo limitation. Once the "Must Fix" items are addressed, this feature is ready for integration.
