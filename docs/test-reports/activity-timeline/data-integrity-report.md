# Activity Timeline - Data Integrity Test Report

**Project:** F-CORE (HubSpot CRM Clone)
**Feature:** Activity Timeline
**Test Type:** Data Layer QA - Schema, Seed Data, Security, API
**Date:** 2026-02-08
**Tester:** Claude Opus 4 (Automated QA)
**Database:** PostgreSQL (Supabase)

---

## Test Results Summary

| # | Test | Result |
|---|------|--------|
| 1 | Schema Verification | **PASS** |
| 2 | Seed Data Integrity | **PASS** |
| 3 | Tenant Isolation | **PASS** |
| 4 | Foreign Key Integrity | **PASS** |
| 5 | Index Verification | **PASS** |
| 6 | API Response Format | **PASS** |
| 7 | API Security | **PASS** |
| 8 | Task Completion Logic | **PASS** |

---

## Test 1: Schema Verification

**Query:** `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Activity'`

**Result: PASS**

All 26 expected columns are present with correct data types:

| Column | Data Type | Nullable | Status |
|--------|-----------|----------|--------|
| id | text | NO | OK |
| type | text | NO | OK |
| subject | text | YES | OK |
| body | text | YES | OK |
| tenantId | text | NO | OK |
| ownerId | text | YES | OK |
| contactId | text | YES | OK |
| companyId | text | YES | OK |
| dealId | text | YES | OK |
| callDuration | integer | YES | OK |
| callOutcome | text | YES | OK |
| callDirection | text | YES | OK |
| meetingStart | timestamp without time zone | YES | OK |
| meetingEnd | timestamp without time zone | YES | OK |
| meetingLocation | text | YES | OK |
| attendees | jsonb | YES | OK |
| emailTo | text | YES | OK |
| emailCc | text | YES | OK |
| emailBcc | text | YES | OK |
| emailStatus | text | YES | OK |
| dueDate | timestamp without time zone | YES | OK |
| priority | text | YES | OK |
| status | text | YES | OK |
| completedAt | timestamp without time zone | YES | OK |
| createdAt | timestamp without time zone | NO | OK |
| updatedAt | timestamp without time zone | NO | OK |

**Bonus column found:** `metadata` (jsonb, NOT NULL, default `'{}'::jsonb`) -- useful for extensibility.

**Note:** `id`, `tenantId`, `type`, `createdAt`, `updatedAt` are correctly marked NOT NULL. All optional/polymorphic fields are nullable as expected.

---

## Test 2: Seed Data Integrity

**Query:** `SELECT type, COUNT(*) FROM "Activity" GROUP BY type`

**Result: PASS**

| Activity Type | Count |
|---------------|-------|
| call | 2 |
| email | 2 |
| meeting | 2 |
| note | 2 |
| task | 2 |

All 5 activity types have seed data (10 total records). Distribution is even at 2 per type.

---

## Test 3: Tenant Isolation

**Query:** `SELECT DISTINCT "tenantId" FROM "Activity"`

**Result: PASS**

Returned exactly **1 tenant ID**: `84d5dd22-9e29-425c-8ba0-1edfc255e236`

All activity records belong to a single tenant. No cross-tenant data leakage detected.

---

## Test 4: Foreign Key Integrity

**Queries:**
- Contact orphans: `SELECT a.id FROM "Activity" a LEFT JOIN "Contact" c ON a."contactId" = c.id WHERE a."contactId" IS NOT NULL AND c.id IS NULL`
- Company orphans: `SELECT a.id FROM "Activity" a LEFT JOIN "Company" c ON a."companyId" = c.id WHERE a."companyId" IS NOT NULL AND c.id IS NULL`
- Deal orphans: `SELECT a.id FROM "Activity" a LEFT JOIN "Deal" d ON a."dealId" = d.id WHERE a."dealId" IS NOT NULL AND d.id IS NULL`

**Result: PASS**

| Association | Orphan Records |
|-------------|---------------|
| Contact | 0 |
| Company | 0 |
| Deal | 0 |

No orphan records found. All foreign key references are valid.

---

## Test 5: Index Verification

**Query:** `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Activity'`

**Result: PASS**

| Index Name | Column(s) | Expected | Status |
|------------|-----------|----------|--------|
| Activity_pkey | id (UNIQUE, btree) | Yes | OK |
| Activity_tenantId_idx | tenantId (btree) | Yes | OK |
| Activity_type_idx | type (btree) | Yes | OK |
| Activity_contactId_idx | contactId (btree) | Yes | OK |
| Activity_companyId_idx | companyId (btree) | Yes | OK |
| Activity_dealId_idx | dealId (btree) | Yes | OK |
| Activity_ownerId_idx | ownerId (btree) | Bonus | OK |
| Activity_createdAt_idx | createdAt DESC (btree) | Yes | OK |
| Activity_dueDate_idx | dueDate (btree) | Bonus | OK |

All 6 expected indexes are present. 2 bonus indexes (`ownerId`, `dueDate`) enhance query performance for owner lookups and task due-date filtering. The `createdAt` index is wisely ordered **DESC** for optimal timeline rendering.

---

## Test 6: API Response Format

**File:** `/Users/chong/hubspot-demo/src/app/api/activities/route.ts`

**Result: PASS**

### GET /api/activities
- Response wraps data in `{ data, meta: { nextCursor, hasMore } }` (lines 48-51) -- **CORRECT**
- Implements cursor-based pagination with configurable limit (max 100) -- **CORRECT**
- Supports filtering by `contactId`, `companyId`, `dealId`, `type` -- **CORRECT**

### POST /api/activities
- `tenantId` is hardcoded from server (line 82), NOT taken from request body -- **CORRECT**
- Validates `type` against whitelist `["email", "call", "meeting", "note", "task"]` (lines 73-78) -- **CORRECT**
- Validates associated entities (contact, company, deal) exist and belong to tenant before creation (lines 85-113) -- **CORRECT**
- Returns `{ data: activity }` with status 201 on success (line 148) -- **CORRECT**

---

## Test 7: API Security

**File:** `/Users/chong/hubspot-demo/src/app/api/activities/[id]/route.ts`

**Result: PASS**

### Tenant Isolation Check
| Method | tenantId in WHERE clause | Status |
|--------|--------------------------|--------|
| GET | `findUnique({ where: { id, tenantId } })` (line 21) | OK |
| PATCH | `findUnique({ where: { id, tenantId } })` (line 52-54) | OK |
| DELETE | `findUnique({ where: { id, tenantId } })` (line 124-126) | OK |

### Hard Delete Confirmation
- DELETE uses `prisma.activity.delete({ where: { id } })` (line 135) -- hard delete, as intended
- Confirmed: The `Activity` table has **no `deletedAt` column** -- hard delete is the correct design decision

### Advisory Note (Non-blocking)
The PATCH update (line 100) and DELETE (line 135) use `where: { id }` without `tenantId` after the existence check. While functionally safe (the prior check gates access), a defense-in-depth approach would include `tenantId` in the mutation `where` clause too. This is a **minor observation**, not a failure.

---

## Test 8: Task Completion Logic

**File:** `/Users/chong/hubspot-demo/src/app/api/activities/[id]/route.ts` (lines 71-78)

**Result: PASS**

```typescript
if (body.status !== undefined) {
  updateData.status = body.status;
  if (body.status === "completed" && !existing.completedAt) {
    updateData.completedAt = new Date();
  } else if (body.status !== "completed") {
    updateData.completedAt = null;
  }
}
```

| Scenario | Expected Behavior | Actual Behavior | Status |
|----------|-------------------|-----------------|--------|
| Status set to "completed" (first time) | Set `completedAt` to current timestamp | `completedAt = new Date()` when `!existing.completedAt` | OK |
| Status set to "completed" (already completed) | Preserve existing `completedAt` | Skips setting `completedAt` due to `!existing.completedAt` guard | OK |
| Status changed away from "completed" | Clear `completedAt` to null | `completedAt = null` when `body.status !== "completed"` | OK |
| Status not in update payload | No change to `completedAt` | Entire block skipped | OK |

The logic correctly handles all four scenarios including the edge case of re-completing an already completed task (preserves original completion timestamp).

---

## VERDICT: ALL TESTS PASS (8/8)

The Activity Timeline data layer is fully intact. Schema, seed data, tenant isolation, referential integrity, indexing, API response format, security guards, and business logic all meet specifications.

### Advisory Items (Non-blocking)
1. **Defense-in-depth:** Consider adding `tenantId` to the `where` clause of PATCH update and DELETE mutation calls (not just the existence check) to prevent theoretical TOCTOU race conditions.
2. **Zod validation:** POST/PATCH handlers use manual validation. Consider migrating to Zod schemas for type-safe input validation as the project scales.
3. **Auth TODO:** `tenantId` is currently hardcoded (`84d5dd22-9e29-425c-8ba0-1edfc255e236`). This is expected for Sprint 1 but must be resolved before production.
