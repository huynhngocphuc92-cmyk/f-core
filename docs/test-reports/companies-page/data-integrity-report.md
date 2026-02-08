# Data Integrity Report: Companies Page

**Generated:** 2026-02-08
**Tester:** Claude Opus 4 (Automated Data Integrity Verification)
**Scope:** API routes, Prisma schema, and database state for the Companies feature

---

## Database State

| Metric | Value |
|--------|-------|
| Total companies | 4 |
| Soft-deleted | 0 |
| Active | 4 |
| Tenants | `84d5dd22-9e29-425c-8ba0-1edfc255e236` ("F-CORE Demo") |

### Sample Data

| ID | Name | Domain | Industry | Size | Owner |
|----|------|--------|----------|------|-------|
| company-techcorp.com | TechCorp Inc | techcorp.com | Technology | 51-200 | Admin User |
| company-startup.io | StartupIO | startup.io | Software | 11-50 | Admin User |
| company-enterprise.com | Enterprise Solutions | enterprise.com | Consulting | 201-500 | Admin User |
| company-agency.co | Creative Agency | agency.co | Marketing | 1-10 | Admin User |

---

## Integrity Checks

### Check 1: Tenant Isolation (API Layer)

- **Status**: FAIL
- **Severity**: CRITICAL
- **Files inspected**:
  - `src/app/api/companies/route.ts` (lines 16, 66)
  - `src/app/api/companies/[id]/route.ts` (lines 11, 74, 133)
- **Finding**: All API routes hardcode `const tenantId = "demo-tenant"`, but the actual data in the database uses `tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236"`. This means:
  1. The GET endpoint filters by `tenantId: "demo-tenant"`, so it will return **zero results** for the 4 existing companies (which belong to tenant `84d5dd22-9e29-425c-8ba0-1edfc255e236`).
  2. Any new company created via POST will be assigned `tenantId: "demo-tenant"`, creating a split between seed data and API-created data.
  3. In a production multi-tenant system, tenantId should be derived from the authenticated user's session, not hardcoded.
- **Verification query**:
  ```sql
  SELECT "tenantId", count(*) FROM "Company" GROUP BY "tenantId";
  -- Result: 84d5dd22-9e29-425c-8ba0-1edfc255e236 | 4
  ```
- **Recommendation**: Either update seed data to use `"demo-tenant"` as the tenantId, or update the API routes to resolve tenantId from the authenticated session/Tenant table.

---

### Check 2: Soft Delete Implementation

- **Status**: PASS
- **Files inspected**:
  - `src/app/api/companies/[id]/route.ts` (DELETE handler, lines 126-159)
  - `prisma/schema.prisma` (line 153: `deletedAt DateTime?`)
- **Finding**: The DELETE endpoint correctly performs a soft delete by setting `deletedAt: new Date()` via `prisma.company.update()`. No `prisma.company.delete()` call exists anywhere in the codebase.
- **Verification query**:
  ```sql
  SELECT count(*) FROM "Company" WHERE "deletedAt" IS NOT NULL;
  -- Result: 0 (no soft-deleted records, consistent with no deletions performed)
  ```

---

### Check 3: Soft Delete Filtering on GET Queries

- **Status**: PASS
- **Files inspected**:
  - `src/app/api/companies/route.ts` (line 20: `deletedAt: null`)
  - `src/app/api/companies/[id]/route.ts` (line 14: `deletedAt: null`, line 78: `deletedAt: null`)
- **Finding**: All three read paths (list, get-by-id, pre-update check) correctly include `deletedAt: null` in their where clause. Soft-deleted records will never appear in query results.

---

### Check 4: Orphan Records (ownerId references)

- **Status**: PASS
- **Verification query**:
  ```sql
  SELECT c.id, c.name, c."ownerId"
  FROM "Company" c
  LEFT JOIN "User" u ON c."ownerId" = u.id
  WHERE c."ownerId" IS NOT NULL AND u.id IS NULL;
  -- Result: [] (no orphan records)
  ```
- **Finding**: All 4 companies reference `ownerId = c3c85b55-2609-430d-88c3-0990fc9789cf` which maps to "Admin User" (admin@f-core.com). The foreign key constraint `Company_ownerId_fkey` is correctly configured with `ON DELETE SET NULL`, which prevents orphan records at the database level.

---

### Check 5: Required Fields Validation (POST)

- **Status**: PASS
- **File inspected**: `src/app/api/companies/route.ts` (lines 62-64)
- **Finding**: The POST handler validates that `body.name` exists, is a string, and is non-empty after trimming:
  ```typescript
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }
  ```
- **Database verification**:
  ```sql
  SELECT id, name FROM "Company" WHERE name IS NULL OR name = '';
  -- Result: [] (no null or empty names)
  ```
- **Note**: The validation is inline rather than using Zod/Joi as recommended by the project CLAUDE.md rules. This is a minor deviation from project standards but functionally correct.

---

### Check 6: Data Types (annualRevenue as Decimal)

- **Status**: PASS
- **Schema definition**: `annualRevenue Decimal? @db.Decimal(15, 2)` (prisma/schema.prisma line 129)
- **Database verification**:
  ```sql
  SELECT data_type FROM information_schema.columns
  WHERE table_name = 'Company' AND column_name = 'annualRevenue';
  -- Result: numeric (PostgreSQL's numeric type maps correctly to Prisma's Decimal)
  ```
- **Finding**: The `annualRevenue` column is correctly typed as `numeric` (Decimal) in the database with precision 15 and scale 2. Currently all 4 records have `annualRevenue = NULL`, which is acceptable since the field is optional.

---

### Check 7: Nullable Fields Accept NULL

- **Status**: PASS
- **Verification query**:
  ```sql
  SELECT column_name, is_nullable FROM information_schema.columns
  WHERE table_name = 'Company' ORDER BY ordinal_position;
  ```
- **Finding**: All optional fields are correctly nullable in the database:

  | Column | Nullable | Expected |
  |--------|----------|----------|
  | id | NO | Correct (PK) |
  | tenantId | NO | Correct (required) |
  | name | NO | Correct (required) |
  | domain | YES | Correct (optional) |
  | description | YES | Correct (optional) |
  | logoUrl | YES | Correct (optional) |
  | industry | YES | Correct (optional) |
  | type | YES | Correct (optional) |
  | size | YES | Correct (optional) |
  | annualRevenue | YES | Correct (optional) |
  | phone | YES | Correct (optional) |
  | website | YES | Correct (optional) |
  | linkedinUrl | YES | Correct (optional) |
  | address | YES | Correct (optional) |
  | city | YES | Correct (optional) |
  | state | YES | Correct (optional) |
  | country | YES | Correct (optional) |
  | postalCode | YES | Correct (optional) |
  | ownerId | YES | Correct (optional FK) |
  | lifecycleStage | YES | Correct (optional) |
  | properties | NO | Correct (defaults to `{}`) |
  | createdAt | NO | Correct (auto) |
  | updatedAt | NO | Correct (auto) |
  | deletedAt | YES | Correct (soft delete) |
  | createdBy | YES | Correct (optional audit) |
  | updatedBy | YES | Correct (optional audit) |

---

### Check 8: Database Indexes on Foreign Keys

- **Status**: PASS
- **Verification query**:
  ```sql
  SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Company';
  ```
- **Finding**: All relevant columns are properly indexed:

  | Index Name | Column | Type |
  |------------|--------|------|
  | Company_pkey | id | UNIQUE (PK) |
  | Company_tenantId_idx | tenantId | BTREE |
  | Company_domain_idx | domain | BTREE |
  | Company_ownerId_idx | ownerId | BTREE (FK) |
  | Company_deletedAt_idx | deletedAt | BTREE |

- Foreign key constraints are properly defined:
  - `Company_tenantId_fkey`: References `Tenant(id)` with `ON DELETE RESTRICT`
  - `Company_ownerId_fkey`: References `User(id)` with `ON DELETE SET NULL`

---

### Check 9: PATCH Endpoint Tenant Isolation

- **Status**: PASS (with note)
- **File inspected**: `src/app/api/companies/[id]/route.ts` (lines 76-78)
- **Finding**: The PATCH endpoint correctly checks tenant isolation by verifying the existing record with `{ id, tenantId, deletedAt: null }` before performing the update. However, the subsequent `prisma.company.update()` on line 87 uses only `where: { id }` without re-checking tenantId. This is acceptable because the pre-check already validated ownership, but a defense-in-depth approach would include tenantId in the update where clause as well.

---

### Check 10: DELETE Endpoint Tenant Isolation

- **Status**: PASS
- **File inspected**: `src/app/api/companies/[id]/route.ts` (lines 135-137)
- **Finding**: The DELETE endpoint correctly verifies tenant isolation by checking `{ id, tenantId, deletedAt: null }` before performing the soft delete update. Only records belonging to the current tenant can be soft-deleted.

---

## Summary

| # | Check | Status |
|---|-------|--------|
| 1 | Tenant Isolation (API Layer) | **FAIL** |
| 2 | Soft Delete Implementation | PASS |
| 3 | Soft Delete Filtering on GET | PASS |
| 4 | Orphan Records (ownerId) | PASS |
| 5 | Required Fields Validation (POST) | PASS |
| 6 | Data Types (annualRevenue) | PASS |
| 7 | Nullable Fields Accept NULL | PASS |
| 8 | Database Indexes on Foreign Keys | PASS |
| 9 | PATCH Endpoint Tenant Isolation | PASS |
| 10 | DELETE Endpoint Tenant Isolation | PASS |

- **Checks Passed:** 9/10
- **Checks Failed:** 1/10
- **Verdict:** **FAIL**

### Critical Issue

The API routes hardcode `tenantId = "demo-tenant"` while the seed data uses tenantId `84d5dd22-9e29-425c-8ba0-1edfc255e236`. This mismatch means:
- The Companies list page will show **zero results** for existing seed data.
- New companies created via the API will be invisible to any code using the real tenant UUID.

**Recommended Fix (choose one):**
1. Update `prisma/seed.ts` to use `"demo-tenant"` as the tenant ID for all seed data.
2. Update all API routes to resolve the tenant ID from the Tenant table or authenticated session instead of hardcoding.
3. As a short-term fix, update the API routes to use the actual tenant UUID `84d5dd22-9e29-425c-8ba0-1edfc255e236`.

### Minor Observations
- Input validation uses inline checks instead of Zod/Joi (project standard per CLAUDE.md).
- The PATCH endpoint's update query does not include tenantId in the where clause (defense-in-depth gap, mitigated by the pre-check).
