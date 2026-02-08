# Property System - Data Integrity Test Report

**Project:** F-CORE (HubSpot CRM Clone)
**Feature:** Property System (PropertyDefinition)
**Test Date:** 2026-02-08
**Tester:** QA Data Integrity Automation
**Status:** 7 PASS / 3 FAIL

---

## Summary

| # | Test Case | Status | Severity |
|---|-----------|--------|----------|
| 1 | Schema verification | PASS | Critical |
| 2 | Unique constraint | PASS | Critical |
| 3 | Index verification | PASS | High |
| 4 | Seed data | FAIL | Critical |
| 5 | System properties (contact) | FAIL (no data) | High |
| 6 | Property groups | FAIL (no data) | Medium |
| 7 | Select options (seed definition) | PASS | Medium |
| 8 | Tenant isolation | PASS | Critical |
| 9 | API response format | PASS | High |
| 10 | CRUD security | PASS (partial) | Critical |

---

## Test Case Details

### TC-01: Schema Verification
**Status:** PASS

The `PropertyDefinition` table exists in PostgreSQL with all 16 expected columns.

| Column | Data Type | Nullable | Default | Present |
|--------|-----------|----------|---------|---------|
| id | text | NO | - | YES |
| tenantId | text | NO | - | YES |
| objectType | text | NO | - | YES |
| name | text | NO | - | YES |
| label | text | NO | - | YES |
| description | text | YES | - | YES |
| fieldType | text | NO | - | YES |
| options | jsonb | YES | - | YES |
| isRequired | boolean | NO | false | YES |
| isReadonly | boolean | NO | false | YES |
| isSystem | boolean | NO | false | YES |
| groupName | text | YES | - | YES |
| orderIndex | integer | NO | 0 | YES |
| defaultValue | text | YES | - | YES |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP | YES |
| updatedAt | timestamp without time zone | NO | - | YES |

**Prisma schema source:** `/Users/chong/hubspot-demo/prisma/schema.prisma` (lines 383-409)

All 16 columns match the specification. Column types are correctly mapped from Prisma to PostgreSQL.

---

### TC-02: Unique Constraint
**Status:** PASS

The unique constraint `@@unique([tenantId, objectType, name])` is correctly enforced in the database.

**Evidence:**
```
Index: PropertyDefinition_tenantId_objectType_name_key
Definition: CREATE UNIQUE INDEX "PropertyDefinition_tenantId_objectType_name_key"
            ON public."PropertyDefinition" USING btree ("tenantId", "objectType", name)
```

This ensures no two properties can have the same name within the same tenant and object type. The API code at `/Users/chong/hubspot-demo/src/app/api/properties/route.ts` (line 105-115) also performs an application-level duplicate check using `findUnique` with `tenantId_objectType_name` before creating.

---

### TC-03: Index Verification
**Status:** PASS

The composite index `@@index([tenantId, objectType])` exists for query performance.

**Evidence:**
```
Index: PropertyDefinition_tenantId_objectType_idx
Definition: CREATE INDEX "PropertyDefinition_tenantId_objectType_idx"
            ON public."PropertyDefinition" USING btree ("tenantId", "objectType")
```

Complete index list on the table:
1. `PropertyDefinition_pkey` - PRIMARY KEY on `id`
2. `PropertyDefinition_tenantId_objectType_idx` - Composite index for filtering
3. `PropertyDefinition_tenantId_objectType_name_key` - Unique constraint index

---

### TC-04: Seed Data
**Status:** FAIL (Critical)

**Expected:** PropertyDefinition table should contain seed data for all 3 object types (contact, company, deal).
**Actual:** The `PropertyDefinition` table is **empty** (0 rows).

```sql
SELECT COUNT(*) as total FROM "PropertyDefinition";
-- Result: 0
```

**Root Cause:** The seed file at `/Users/chong/hubspot-demo/prisma/seed.ts` (lines 185-289) defines 33 property definitions across all 3 object types, but the seed has **not been executed** against the current database. The Tenant table has 1 row, indicating some seeding may have occurred, but the PropertyDefinition section (added later in the seed file at lines 274-289) was not executed.

**Expected distribution from seed file analysis:**
- contact: 17 properties
- company: 10 properties
- deal: 6 properties
- **Total: 33 properties**

**Resolution:** Run `npx prisma db seed` or `npx tsx prisma/seed.ts` to populate the PropertyDefinition table.

---

### TC-05: System Properties (Contact)
**Status:** FAIL (Dependent on TC-04)

**Expected system properties for contact objectType:**

| name | label | fieldType | groupName | isSystem | isRequired |
|------|-------|-----------|-----------|----------|------------|
| first_name | First Name | text | About | true | true |
| last_name | Last Name | text | About | true | true |
| email | Email | email | About | true | false |
| phone | Phone Number | phone | About | true | false |
| job_title | Job Title | text | About | true | false |
| lifecycle_stage | Lifecycle Stage | select | About | true | false |
| lead_status | Lead Status | select | About | true | false |

**Actual:** Cannot verify -- table is empty (0 rows). See TC-04.

**Seed file verification:** All 7 required system properties ARE correctly defined in `/Users/chong/hubspot-demo/prisma/seed.ts` (lines 187-207). The definitions include proper `isSystem: true` flags, correct `fieldType` values, and appropriate `groupName` assignments.

---

### TC-06: Property Groups
**Status:** FAIL (Dependent on TC-04)

**Expected groups from seed file analysis:**

| objectType | groupName |
|------------|-----------|
| contact | About |
| contact | Contact Information |
| contact | Address |
| company | About |
| company | Contact Information |
| deal | About |

**Actual:** Cannot verify in database -- table is empty. See TC-04.

**Seed file verification:** All 6 group assignments are correctly defined in the seed data:
- Contact properties span 3 groups: About (7 props), Contact Information (4 props), Address (5 props)
- Company properties span 2 groups: About (7 props), Contact Information (3 props)
- Deal properties span 1 group: About (6 props)

---

### TC-07: Select Options
**Status:** PASS (seed definition verified, not yet in database)

The following properties have JSON options arrays defined in the seed file:

**lifecycle_stage** (contact) -- 7 options:
```json
[
  {"value": "subscriber", "label": "Subscriber"},
  {"value": "lead", "label": "Lead"},
  {"value": "mql", "label": "Marketing Qualified Lead"},
  {"value": "sql", "label": "Sales Qualified Lead"},
  {"value": "opportunity", "label": "Opportunity"},
  {"value": "customer", "label": "Customer"},
  {"value": "evangelist", "label": "Evangelist"}
]
```

**lead_status** (contact) -- 5 options:
```json
[
  {"value": "new", "label": "New"},
  {"value": "open", "label": "Open"},
  {"value": "in_progress", "label": "In Progress"},
  {"value": "qualified", "label": "Qualified"},
  {"value": "unqualified", "label": "Unqualified"}
]
```

**industry** (company) -- 10 options:
```json
[
  {"value": "technology", "label": "Technology"},
  {"value": "software", "label": "Software"},
  {"value": "consulting", "label": "Consulting"},
  {"value": "marketing", "label": "Marketing"},
  {"value": "finance", "label": "Finance"},
  {"value": "healthcare", "label": "Healthcare"},
  {"value": "education", "label": "Education"},
  {"value": "retail", "label": "Retail"},
  {"value": "manufacturing", "label": "Manufacturing"},
  {"value": "other", "label": "Other"}
]
```

**size** (company) -- 7 options:
```json
[
  {"value": "1-10", "label": "1-10"},
  {"value": "11-50", "label": "11-50"},
  {"value": "51-200", "label": "51-200"},
  {"value": "201-500", "label": "201-500"},
  {"value": "501-1000", "label": "501-1000"},
  {"value": "1001-5000", "label": "1001-5000"},
  {"value": "5001+", "label": "5001+"}
]
```

All options follow the `{value, label}` structure. The `options` column is typed as `jsonb` in PostgreSQL, which correctly supports JSON array storage.

---

### TC-08: Tenant Isolation
**Status:** PASS

**Analysis of API code:**

All 5 API handler functions hardcode the `tenantId` constant:
```typescript
const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
```

**Locations verified:**
- `GET /api/properties` -- `/Users/chong/hubspot-demo/src/app/api/properties/route.ts` line 13
- `POST /api/properties` -- `/Users/chong/hubspot-demo/src/app/api/properties/route.ts` line 58
- `GET /api/properties/[id]` -- `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts` line 16
- `PATCH /api/properties/[id]` -- `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts` line 47
- `DELETE /api/properties/[id]` -- `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts` line 110

Every Prisma query includes `tenantId` in the `where` clause, ensuring tenant isolation. The `tenantId` is never sourced from the request body or URL parameters.

**Note:** The hardcoded tenantId is acceptable for the current single-tenant demo phase but must be replaced with session-based tenant resolution before multi-tenant deployment.

---

### TC-09: API Response Format
**Status:** PASS

**GET /api/properties** returns the expected `{ data, groups, meta }` structure.

Source: `/Users/chong/hubspot-demo/src/app/api/properties/route.ts` (lines 41-45)

```typescript
return NextResponse.json({
  data: properties,        // Array of PropertyDefinition objects
  groups,                  // Record<string, PropertyDefinition[]> grouped by groupName
  meta: { total: properties.length, objectType },  // Metadata with count and type
});
```

**Validation details:**
- `data`: Flat array of all matching PropertyDefinition records
- `groups`: Object keyed by `groupName` with properties grouped; properties without a group are placed under "Other"
- `meta`: Contains `total` count and the queried `objectType`
- Error responses return `{ error: string }` with appropriate HTTP status codes (400, 500)
- The `objectType` query parameter is required and validated against `["contact", "company", "deal"]`

---

### TC-10: CRUD Security
**Status:** PASS (with observations)

#### POST Security (Create)
**File:** `/Users/chong/hubspot-demo/src/app/api/properties/route.ts` (lines 56-150)

| Check | Result |
|-------|--------|
| tenantId hardcoded (not from body) | PASS - line 58: `const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236"` |
| isSystem forced to false | PASS - line 135: `isSystem: false` |
| objectType validated | PASS - lines 62-67 |
| name validated | PASS - lines 68-73 |
| label validated | PASS - lines 74-79 |
| fieldType validated | PASS - lines 80-85 |
| Options required for select/multiselect | PASS - lines 88-95 |
| Name normalized to snake_case | PASS - lines 98-102 |
| Duplicate check before create | PASS - lines 105-115 |

#### DELETE Security
**File:** `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts` (lines 103-141)

| Check | Result |
|-------|--------|
| tenantId enforced in query | PASS - line 113: `where: { id, tenantId }` |
| isSystem check before delete | PASS - lines 124-129 |
| Returns 403 for system properties | PASS - `"System properties cannot be deleted"` |
| Returns 404 for not found | PASS - lines 116-121 |

#### PATCH Security
**File:** `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts` (lines 39-101)

| Check | Result |
|-------|--------|
| System properties restrict editable fields | PASS - lines 70-78 |
| Non-system properties allow more field updates | PASS |
| Options only updated for select/multiselect | PASS - lines 81-86 |

#### Observations / Warnings

1. **Hard Delete:** The DELETE endpoint performs a **hard delete** (`prisma.propertyDefinition.delete`) rather than a soft delete. The `PropertyDefinition` table does **not** have a `deletedAt` column. Per project rules in `CLAUDE.md` ("Use Soft Delete for all CRM entities"), this is a **policy deviation**. However, PropertyDefinition may be intentionally exempt as a configuration/metadata table rather than a CRM entity.

2. **No Zod/Joi Validation:** Input validation is done via manual `if` checks rather than Zod/Joi schemas as recommended in project rules. This works correctly but is less maintainable.

3. **No Authentication Middleware:** API endpoints do not verify the caller's identity or permissions. The tenantId is hardcoded, which prevents cross-tenant access but does not enforce user-level authorization.

---

## Critical Issues Requiring Action

### ISSUE-1: Seed Data Not Populated (Severity: CRITICAL)
**Impact:** The PropertyDefinition table is empty. Any frontend feature depending on property definitions will fail or show no fields.
**Action:** Execute the database seed:
```bash
cd /Users/chong/hubspot-demo && npx tsx prisma/seed.ts
```

### ISSUE-2: Hard Delete Instead of Soft Delete (Severity: MEDIUM)
**Impact:** Deleted property definitions cannot be recovered. Audit trail is lost.
**Action:** Consider adding a `deletedAt` column to `PropertyDefinition` and updating the DELETE handler to set `deletedAt = now()` instead of removing the row. Add a `WHERE deletedAt IS NULL` filter to all queries.

### ISSUE-3: No Input Validation Library (Severity: LOW)
**Impact:** Manual validation is error-prone and harder to maintain as the API grows.
**Action:** Migrate to Zod schema validation for request body parsing.

---

## Files Analyzed

| File | Purpose |
|------|---------|
| `/Users/chong/hubspot-demo/prisma/schema.prisma` | Prisma schema defining PropertyDefinition model (lines 383-409) |
| `/Users/chong/hubspot-demo/prisma/seed.ts` | Database seed file with 33 property definitions (lines 185-289) |
| `/Users/chong/hubspot-demo/src/app/api/properties/route.ts` | GET (list) and POST (create) API handlers |
| `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts` | GET (single), PATCH (update), DELETE API handlers |

---

## Conclusion

The Property System schema and API code are **well-structured and correctly implemented**. The unique constraint, composite index, and tenant isolation are all properly enforced at both the database and application levels. CRUD security is solid with proper isSystem guards and hardcoded tenantId.

The **critical blocker** is that the seed data has not been executed, leaving the PropertyDefinition table empty. Once seeded, test cases TC-04 through TC-06 should be re-run to confirm data integrity in the live database.

**Overall Verdict:** PASS with conditions (pending seed execution and re-verification)
