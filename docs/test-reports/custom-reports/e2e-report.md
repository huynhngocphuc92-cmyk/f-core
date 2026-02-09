# Custom Reports E2E Test Report

**Date:** 2026-02-09T13:57:37.965Z
**Environment:** Next.js Dev Server (localhost:3001)
**Tester:** Automated E2E Script
**Feature:** Custom Reports & Dashboards API

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 16 |
| Passed | 15 |
| Failed | 1 |
| Pass Rate | 94% |
| **Verdict** | **1 TEST(S) FAILED** |

## Test Results

| # | Test Case | Expected Result | Actual Result | Status |
|---|-----------|----------------|---------------|--------|
| 1 | GET /api/reports - List reports | 200 with data array | HTTP 200, data.length=0 | PASS |
| 2 | GET /api/reports/stats - CRM stats | 200 with stats (totalContacts, totalDeals, etc.) | HTTP 200, totalContacts=0, totalDeals=0 | PASS |
| 3 | POST /api/reports - Create report | 201 with report data containing id | HTTP 201, id=ba1be6ff-9dae-40a1-8d3c-fce071e3bdd2 | PASS |
| 4 | GET /api/reports/[id] - Get report | 200 with name='Test Report' | HTTP 200, name=Test Report | PASS |
| 5 | POST /api/reports/[id]/run - Run report | 200 with query results | HTTP 500, body={"error":"Failed to run report"} | FAIL |
| 6 | PATCH /api/reports/[id] - Update report | 200 with name='Updated Test Report' | HTTP 200, name=Updated Test Report | PASS |
| 7 | DELETE /api/reports/[id] - Soft delete | 200 success + subsequent GET returns 404 | HTTP 200 delete, then HTTP 404 on GET | PASS |
| 8 | GET /api/dashboards - List dashboards | 200 with data array | HTTP 200, count=0 | PASS |
| 9 | POST /api/dashboards - Create dashboard | 201 with dashboard data | HTTP 201, id=6ebe203a-235b-4274-adc4-5a2724d18b31 | PASS |
| 10 | GET /api/dashboards/[id] - Get dashboard with widgets | 200 with widgets array | HTTP 200, widgets.length=0 | PASS |
| 11 | POST /api/dashboards/[id]/widgets - Add widget | 201 with widget data | HTTP 201, id=1cb6e1cf-4c22-4802-8136-17734c4d7e68 | PASS |
| 12 | DELETE /api/dashboards/[id]/widgets - Remove widget | 200 with success:true | HTTP 200, success=true | PASS |
| 13 | DELETE /api/dashboards/[id] - Soft delete dashboard | 200 success + subsequent GET returns 404 | HTTP 200 delete, then HTTP 404 on GET | PASS |
| 14 | POST /api/reports - Missing name (validation) | 400 with validation error | HTTP 400, error=Validation failed | PASS |
| 15 | GET /api/reports/nonexistent-id - Not found | 404 with error message | HTTP 404, error=Report not found | PASS |
| 16 | POST /api/reports - Empty metrics (validation) | 400 validation error | HTTP 400, error=Validation failed | PASS |

## Test Descriptions

### Reports API (Tests a-g)

- **a) GET /api/reports** - Lists all reports with filtering (category, search, favorites)
- **b) GET /api/reports/stats** - Returns CRM overview statistics (contacts, companies, deals, revenue)
- **c) POST /api/reports** - Creates a new report with Zod-validated definition
- **d) GET /api/reports/[id]** - Retrieves a single report by ID
- **e) POST /api/reports/[id]/run** - Executes the report query and returns results
- **f) PATCH /api/reports/[id]** - Updates report name/definition
- **g) DELETE /api/reports/[id]** - Soft deletes report (sets deletedAt)

### Dashboards API (Tests h-m)

- **h) GET /api/dashboards** - Lists all dashboards with widgets
- **i) POST /api/dashboards** - Creates a new dashboard
- **j) GET /api/dashboards/[id]** - Gets dashboard with its widgets
- **k) POST /api/dashboards/[id]/widgets** - Adds a widget to a dashboard
- **l) DELETE /api/dashboards/[id]/widgets** - Removes a widget from a dashboard
- **m) DELETE /api/dashboards/[id]** - Soft deletes dashboard and its widgets

### Error Cases (Tests n-p)

- **n) POST /api/reports (missing name)** - Should return 400 validation error
- **o) GET /api/reports/nonexistent-id** - Should return 404 not found
- **p) POST /api/reports (empty metrics)** - Should return 400 validation error

## Failure Analysis

### Test #5: POST /api/reports/[id]/run - Run report (FAIL)

**Root Cause:** The test report definition used `"stage"` as a categorical dimension field for the `deals` data source. However, the query builder's field whitelist (`src/lib/reports/query-builder.ts`, line 8) does not include `"stage"` as a valid field for `deals`. In the Prisma schema, `Deal` has `stageId` (a foreign key to `DealStage`), not `stage` as a direct column. The `stage` is a Prisma relation, not a raw database column.

**Error Flow:**
1. Report was created successfully with `{"field":"stage","type":"categorical"}` in dimensions
2. When running, the query builder calls `validateField("deals", "stage")` which returns `false`
3. This throws `"Invalid field: stage for deals"`, resulting in HTTP 500

**Fix Options:**
1. Add `"stageId"` to the deals field whitelist and use `stageId` in report definitions instead of `stage`
2. Add JOIN support in the query builder to resolve relation fields like `stage.name`
3. Add `"stage"` to the whitelist if there is a direct `stage` column (there is not in current schema)

**Severity:** Medium - Affects report execution when using relation-based dimension fields. CRUD operations and validation work correctly.

## Notes

- All delete operations use soft delete (setting `deletedAt` timestamp)
- All endpoints enforce `tenantId = "demo-tenant"` for multi-tenancy
- Input validation is done via Zod schemas
- Report run executes dynamic SQL queries built from the report definition
- The query builder field whitelist should be expanded to include `stageId`, `pipelineId`, and `ownerId` for deals
- The Zod validation schema for report definitions does not validate field names against the whitelist at creation time, only at query execution time
