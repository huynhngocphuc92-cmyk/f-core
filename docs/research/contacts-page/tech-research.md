# Contacts Page - Technical Research & Audit Report

> **Date:** 2026-02-08
> **Author:** Tech Researcher (Claude Opus 4)
> **Scope:** Full audit of existing contacts code + gap analysis vs Companies reference implementation
> **Status:** COMPLETE

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Existing Code Audit](#2-existing-code-audit)
3. [Database State Analysis](#3-database-state-analysis)
4. [Gap Analysis: Contacts vs Companies](#4-gap-analysis-contacts-vs-companies)
5. [Security & Multi-tenancy Audit](#5-security--multi-tenancy-audit)
6. [Issues & Deficiencies Found](#6-issues--deficiencies-found)
7. [Recommended Enhancements](#7-recommended-enhancements)
8. [File Manifest](#8-file-manifest)
9. [API Endpoint Inventory](#9-api-endpoint-inventory)
10. [Prisma Schema Review](#10-prisma-schema-review)

---

## 1. Executive Summary

The contacts feature has a **basic but incomplete** implementation. It has a working list view (ContactsTable), two API routes (list + CRUD), and a page wrapper. However, compared to the Companies implementation (our gold-standard reference pattern), the contacts feature is missing several critical pieces:

**Key Findings:**
- **CRITICAL: No tenantId enforcement in contacts API** (security vulnerability)
- **MISSING: No create contact form** (Companies has a slide-in CompanyForm)
- **MISSING: No row-level actions dropdown menu** (Companies has View/Delete)
- **MISSING: No individual delete handler** (only bulk delete exists)
- **MISSING: Export only exports current page, ignores selection** (Companies exports selected)
- **MISSING: No company association column** (API fetches it but UI ignores it)
- **INCOMPLETE: Sorting is client-side only** (same as Companies, acceptable for MVP)
- **INCOMPLETE: No lead status filter** (only lifecycle stage filter exists)

**Verdict:** The contacts page needs ~8 files modified/created to reach parity with Companies. No database schema changes needed.

---

## 2. Existing Code Audit

### 2.1 ContactsTable.tsx (512 lines)

**File:** `src/components/contacts/ContactsTable.tsx`

**What exists:**
- Client component with `"use client"` directive
- State management: contacts list, loading, error, search, lifecycle stage filter, pagination, sorting, bulk selection
- `fetchContacts()` callback with pagination, search, lifecycle stage params
- Client-side sorting (matches Companies pattern)
- Bulk selection with select all / individual toggle
- Bulk delete (fires parallel DELETE requests)
- CSV export (basic, current page only)
- Lifecycle stage badge with color mapping (7 stages: subscriber, lead, mql, sql, opportunity, customer, evangelist)
- Pagination with prev/next navigation
- Search bar with debounce-less input (immediate re-fetch on change)
- Filter panel (toggle-able) with lifecycle stage dropdown
- Table columns: Checkbox, Name (with avatar initials + link), Email, Phone, Lifecycle Stage (badge), Owner, Actions (MoreHorizontal icon, non-functional)
- Empty state with "Create your first contact" link to `/contacts/new` (dead link - route does not exist)

**What is missing vs Companies:**
1. No `ContactForm` import or create-form slide-in panel
2. "Create contact" button links to `/contacts/new` which does NOT exist
3. Actions column (MoreHorizontal button) is non-functional - no dropdown menu
4. No individual `handleDelete` for single row deletion
5. Export does not respect selection (always exports all current-page contacts)
6. No `overflow-x-auto` wrapper on table (Companies has it for mobile)
7. No company association displayed (API includes it in response, UI ignores it)
8. No active filter count badge (Companies shows count of active filters)
9. Type definition does not include `companies` from API response
10. No `_count` fields for deals/companies (not needed but could show association count)

### 2.2 Contacts API - List & Create Route

**File:** `src/app/api/contacts/route.ts` (113 lines)

**GET /api/contacts:**
- Accepts: `page`, `limit`, `search`, `lifecycleStage` query params
- Filters: `deletedAt: null`, text search on firstName/lastName/email, lifecycle stage
- Includes: `owner` (id, name, email), `companies` (primary only, with company name)
- Orders by: `createdAt desc`
- Returns: `{ data, pagination: { page, limit, total, totalPages } }`
- **CRITICAL BUG: No `tenantId` filter in WHERE clause** - returns contacts across ALL tenants

**POST /api/contacts:**
- Accepts all contact fields in body
- Validation: requires either `email` or `firstName`
- tenantId: falls back to `body.tenantId || "demo-tenant"` -- uses a **different** demo tenant ID than Companies API
- Creates contact with full field mapping
- Returns created contact with owner included

### 2.3 Contacts API - Single Contact Route

**File:** `src/app/api/contacts/[id]/route.ts` (114 lines)

**GET /api/contacts/[id]:**
- Fetches single contact by id with `deletedAt: null`
- Includes: owner, companies (with full company), deals (with full deal), activities (last 20, desc)
- **BUG: No `tenantId` check** - any user can fetch any contact by ID

**PATCH /api/contacts/[id]:**
- Updates individual fields (partial update pattern)
- All fields are conditionally spread based on `undefined` check
- **BUG: No `tenantId` check** - any user can update any contact
- **BUG: No existence check before update** (Companies does `findUnique` first to return 404)

**DELETE /api/contacts/[id]:**
- Soft delete via `deletedAt: new Date()`
- **BUG: No `tenantId` check** - any user can delete any contact
- **BUG: No existence check** - will throw Prisma error if contact doesn't exist (vs Companies which returns 404)

### 2.4 Contacts Page Wrapper

**File:** `src/app/(dashboard)/contacts/page.tsx` (5 lines)

```tsx
import { ContactsTable } from "@/components/contacts/ContactsTable";
export default function ContactsPage() {
  return <ContactsTable />;
}
```

Minimal wrapper, consistent with pattern. No metadata export (could add page title).

---

## 3. Database State Analysis

### 3.1 Contact Records

| Metric | Value |
|--------|-------|
| Total contacts (all) | 15 |
| Active contacts (not deleted) | 15 |
| Deleted contacts | 0 |
| Tenants with contacts | 1 (`84d5dd22-9e29-425c-8ba0-1edfc255e236`) |

### 3.2 Lifecycle Stage Distribution

| Stage | Count |
|-------|-------|
| subscriber | 2 |
| lead | 3 |
| mql | 2 |
| sql | 2 |
| opportunity | 2 |
| customer | 2 |
| evangelist | 2 |

### 3.3 Lead Status Distribution

| Status | Count |
|--------|-------|
| NULL (not set) | 15 |

**Note:** All contacts have `leadStatus = null`. The seed data does not populate this field. This means the Lead Status filter (if added) would show empty results until data is seeded or users populate it.

### 3.4 Association Data

| Association | Count |
|-------------|-------|
| ContactCompany records | 0 |
| DealContact records | 0 |
| Activities linked to contacts | 10 |

**Finding:** Despite the API including company associations in the response, there are **zero ContactCompany records** in the database. The association table exists but has no seed data. Similarly, no DealContact records exist. There ARE 10 activities linked to contacts.

### 3.5 Supporting Data

| Entity | Count |
|--------|-------|
| Users in demo tenant | 1 |
| Owner assigned to all contacts | `c3c85b55-2609-430d-88c3-0990fc9789cf` (Admin User) |
| Contacts with jobTitle set | 0 |

**Finding:** All 15 contacts are assigned to the same owner. None have jobTitle populated. The seed data is minimal.

---

## 4. Gap Analysis: Contacts vs Companies

### Feature Parity Matrix

| Feature | Companies | Contacts | Gap |
|---------|-----------|----------|-----|
| **API: tenantId enforcement** | YES (hardcoded) | NO | CRITICAL |
| **API: Zod/input validation** | Basic (name required check) | Basic (email or firstName) | Both need improvement |
| **API: GET list with filters** | search, industry, type, size | search, lifecycleStage | Contacts needs lead status filter |
| **API: GET [id] with tenantId** | YES | NO | CRITICAL |
| **API: PATCH [id] existence check** | YES (returns 404) | NO (throws Prisma error) | HIGH |
| **API: DELETE [id] existence check** | YES (returns 404) | NO (throws Prisma error) | HIGH |
| **API: POST tenantId source** | Hardcoded `84d5dd22-...` | `body.tenantId \|\| "demo-tenant"` | INCONSISTENT |
| **UI: Create form (slide-in panel)** | CompanyForm.tsx (447 lines) | None | HIGH - Needs ContactForm.tsx |
| **UI: Row actions dropdown** | View details + Delete | Non-functional MoreHorizontal button | HIGH |
| **UI: Individual delete** | handleDelete per row | Not implemented | MEDIUM |
| **UI: Export selected items** | YES (respects selection) | NO (exports all) | MEDIUM |
| **UI: Active filter count** | YES (badge shows count) | NO | LOW |
| **UI: Table overflow-x-auto** | YES | NO | LOW |
| **UI: Empty state icon** | Building2 icon | No icon (plain text) | LOW |
| **UI: Date formatting** | `toLocaleDateString()` | Not shown in table | LOW |
| **UI: Company column** | N/A | API fetches but UI ignores | MEDIUM |
| **UI: Created date column** | YES | NO | LOW |
| **UI: Bulk export in action bar** | YES | NO | LOW |

### Key Architectural Differences

1. **Companies uses button onClick for create** -> opens CompanyForm slide-in
   **Contacts uses Link to /contacts/new** -> route does not exist (broken UX)

2. **Companies wraps table in `<div className="overflow-x-auto">`**
   **Contacts does not** -> horizontal scrolling broken on mobile

3. **Companies API consistently uses tenantId = `84d5dd22-9e29-425c-8ba0-1edfc255e236`**
   **Contacts API uses `body.tenantId || "demo-tenant"`** -> DIFFERENT tenant IDs, potential data isolation failure

---

## 5. Security & Multi-tenancy Audit

### CRITICAL ISSUES

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Missing tenantId in GET list | CRITICAL | `api/contacts/route.ts` L15-25 | WHERE clause has no `tenantId` filter. Returns contacts from ALL tenants. |
| Missing tenantId in GET [id] | CRITICAL | `api/contacts/[id]/route.ts` L12-13 | `findUnique` by id only, no tenant scope. |
| Missing tenantId in PATCH [id] | CRITICAL | `api/contacts/[id]/route.ts` L55 | Updates any contact by id regardless of tenant. |
| Missing tenantId in DELETE [id] | CRITICAL | `api/contacts/[id]/route.ts` L101 | Soft-deletes any contact by id regardless of tenant. |
| POST uses client-provided tenantId | HIGH | `api/contacts/route.ts` L76 | `body.tenantId || "demo-tenant"` allows client to inject any tenantId, creating contacts in other tenants. |
| No input validation (Zod) | MEDIUM | Both routes | Request body not validated against a schema. Arbitrary fields could be passed. |
| No PATCH existence check | MEDIUM | `api/contacts/[id]/route.ts` L55 | Prisma throws a generic error instead of returning 404. |
| No DELETE existence check | MEDIUM | `api/contacts/[id]/route.ts` L101 | Prisma throws a generic error instead of returning 404. |

### Companies Reference (How It Should Work)

```typescript
// Companies pattern (CORRECT):
const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236"; // hardcoded for now
const where = { tenantId, deletedAt: null, ... };

// Before PATCH/DELETE:
const existing = await prisma.company.findUnique({
  where: { id, tenantId, deletedAt: null },
});
if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

---

## 6. Issues & Deficiencies Found

### Priority Classification

#### P0 - Must Fix Before Release (Security)
1. **[SEC-001]** Add `tenantId` filter to all contacts API queries (GET list, GET [id], PATCH, DELETE)
2. **[SEC-002]** Remove client-controlled `tenantId` from POST body; hardcode like Companies
3. **[SEC-003]** Add existence + tenant ownership checks to PATCH and DELETE endpoints

#### P0 - Must Fix Before Release (Functionality)
4. **[FUNC-001]** Create `ContactForm.tsx` slide-in panel (matching CompanyForm pattern)
5. **[FUNC-002]** Replace `/contacts/new` Link with button that opens ContactForm
6. **[FUNC-003]** Implement row actions dropdown (View details, Delete) matching Companies

#### P1 - Should Fix (UX Parity)
7. **[UX-001]** Add `overflow-x-auto` wrapper to table for mobile responsiveness
8. **[UX-002]** Add export-selected-only behavior (match Companies)
9. **[UX-003]** Add active filter count badge
10. **[UX-004]** Add empty state icon (User icon from lucide)
11. **[UX-005]** Add individual row delete handler (`handleDelete`)
12. **[UX-006]** Add "Created" date column to table
13. **[UX-007]** Add primary company column (data already returned by API)
14. **[UX-008]** Add lead status filter to filter panel

#### P2 - Nice to Have (Future)
15. **[UX-009]** Add bulk export button in action bar
16. **[UX-010]** Add server-side sorting support to API
17. **[DATA-001]** Seed ContactCompany association records
18. **[DATA-002]** Seed jobTitle, department, leadStatus fields in contacts
19. **[DATA-003]** Seed DealContact association records
20. **[API-001]** Add Zod validation to all endpoints
21. **[API-002]** Add `leadStatus` filter parameter to GET list API

---

## 7. Recommended Enhancements

### 7.1 Files to Create

#### ContactForm.tsx (P0)
- Slide-in panel matching CompanyForm.tsx pattern
- Sections: Basic Info (firstName*, lastName, email*, phone, mobilePhone), CRM Fields (lifecycleStage, leadStatus), Professional Info (jobTitle, department), Contact Info (website, linkedinUrl), Address (address, city, state, country, postalCode)
- Company association selector (optional, P1)
- Estimated: ~350-400 lines

### 7.2 Files to Modify

#### contacts/route.ts (P0)
- Add `tenantId` to WHERE clause in GET
- Change POST to hardcode tenantId like Companies
- Add `leadStatus` filter param support
- Estimated changes: ~15 lines modified

#### contacts/[id]/route.ts (P0)
- Add `tenantId` to all queries (GET, PATCH, DELETE)
- Add existence check before PATCH and DELETE
- Estimated changes: ~30 lines modified

#### ContactsTable.tsx (P0/P1)
- Import and integrate ContactForm (slide-in panel)
- Replace Link for create button with onClick handler
- Add row actions dropdown (View, Delete)
- Add handleDelete per-row function
- Add overflow-x-auto wrapper
- Add company column, created date column
- Add active filter count badge
- Add lead status filter
- Fix export to respect selection
- Add empty state icon
- Estimated changes: ~100 lines modified/added

#### contacts/page.tsx (P2)
- Add page metadata (title, description)
- Minimal change, ~5 lines

---

## 8. File Manifest

| # | File Path | Purpose | Est. Lines | Priority | Action |
|---|-----------|---------|------------|----------|--------|
| 1 | `src/components/contacts/ContactForm.tsx` | Slide-in create contact form panel | ~380 | P0 | CREATE |
| 2 | `src/app/api/contacts/route.ts` | Fix tenantId enforcement + add leadStatus filter | ~130 | P0 | MODIFY |
| 3 | `src/app/api/contacts/[id]/route.ts` | Fix tenantId + add existence checks | ~140 | P0 | MODIFY |
| 4 | `src/components/contacts/ContactsTable.tsx` | Integrate form, actions dropdown, UI parity fixes | ~650 | P0 | MODIFY |
| 5 | `src/app/(dashboard)/contacts/page.tsx` | Add page metadata | ~10 | P2 | MODIFY |
| 6 | `prisma/seed.ts` | Add ContactCompany, DealContact, and richer contact data | +80 | P2 | MODIFY |

### Total Effort Estimate
- **P0 (Must Do):** 4 files, ~1300 lines total (1 create + 3 modify)
- **P1 (Should Do):** Included in P0 file modifications above
- **P2 (Nice to Have):** 2 files, ~90 lines total

---

## 9. API Endpoint Inventory

### Current State

| Method | Path | Status | tenantId | Validation | Notes |
|--------|------|--------|----------|------------|-------|
| GET | `/api/contacts` | Working | MISSING | None | Returns ALL tenant contacts |
| POST | `/api/contacts` | Working | Client-controlled | email or firstName required | Wrong tenant ID pattern |
| GET | `/api/contacts/[id]` | Working | MISSING | None | IDOR vulnerability |
| PATCH | `/api/contacts/[id]` | Working | MISSING | None | No 404 check, IDOR |
| DELETE | `/api/contacts/[id]` | Working | MISSING | None | No 404 check, IDOR |

### Target State (After Fixes)

| Method | Path | tenantId | Validation | Changes |
|--------|------|----------|------------|---------|
| GET | `/api/contacts` | Hardcoded | search, lifecycleStage, leadStatus | Add tenantId + leadStatus filter |
| POST | `/api/contacts` | Hardcoded | email or firstName | Remove body.tenantId, hardcode |
| GET | `/api/contacts/[id]` | Hardcoded | - | Add tenantId to findUnique |
| PATCH | `/api/contacts/[id]` | Hardcoded | - | Add existence check + tenantId |
| DELETE | `/api/contacts/[id]` | Hardcoded | - | Add existence check + tenantId |

---

## 10. Prisma Schema Review

### Contact Model Fields (Schema-complete)

The Contact model is well-defined with 23+ fields across categories:

| Category | Fields |
|----------|--------|
| Basic Info | email, firstName, lastName, phone, mobilePhone |
| CRM Fields | lifecycleStage (default: "subscriber"), leadStatus, ownerId |
| Professional | jobTitle, department |
| Online | website, linkedinUrl, twitterHandle |
| Address | address, city, state, country, postalCode |
| Flexible | properties (JSON) |
| Audit | createdAt, updatedAt, deletedAt, createdBy, updatedBy |

### Relations

| Relation | Type | Via | Status |
|----------|------|-----|--------|
| Contact -> Tenant | belongsTo | tenantId | Schema OK, API MISSING enforcement |
| Contact -> User (owner) | belongsTo | ownerId | Working |
| Contact -> Companies | many-to-many | ContactCompany | Schema OK, 0 records in DB |
| Contact -> Deals | many-to-many | DealContact | Schema OK, 0 records in DB |
| Contact -> Activities | hasMany | contactId | Working (10 records) |

### Indexes

```
@@index([tenantId])        -- Critical for multi-tenancy queries
@@index([email])           -- For email lookups
@@index([ownerId])         -- For owner filtering
@@index([lifecycleStage])  -- For lifecycle filtering
@@index([deletedAt])       -- For soft delete filtering
```

All indexes are appropriate. No schema changes needed.

### ContactCompany Junction Table

```prisma
model ContactCompany {
  contactId   String
  companyId   String
  isPrimary   Boolean   @default(false)
  role        String?   // employee, owner, decision_maker, etc
  createdAt   DateTime  @default(now())
  @@id([contactId, companyId])
}
```

Schema is ready. Needs seed data and UI for association management.

---

## Appendix A: Company Reference Code Patterns

### Pattern: Slide-in Form Integration (CompanyForm)

```tsx
// In CompaniesTable.tsx:
const [showCreateForm, setShowCreateForm] = useState(false);

// Button:
<button onClick={() => setShowCreateForm(true)}>Create company</button>

// At bottom of component:
<CompanyForm
  isOpen={showCreateForm}
  onClose={() => setShowCreateForm(false)}
  onSuccess={() => { setShowCreateForm(false); fetchCompanies(); }}
/>
```

### Pattern: Row Actions Dropdown (CompaniesTable)

```tsx
<div className="relative group">
  <button><MoreHorizontal /></button>
  <div className="absolute right-0 top-full ... opacity-0 invisible group-hover:opacity-100 group-hover:visible">
    <Link href={`/companies/${id}`}>View details</Link>
    <button onClick={() => handleDelete(id, name)}>Delete</button>
  </div>
</div>
```

### Pattern: TenantId in API (Companies)

```typescript
const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
const where = { tenantId, deletedAt: null, ... };
```

---

## Appendix B: Database Queries Executed

```sql
-- Total contacts
SELECT count(*) FROM "Contact";
-- Result: 15

-- Contacts by tenant
SELECT "tenantId", count(*) FROM "Contact" GROUP BY "tenantId";
-- Result: 84d5dd22-9e29-425c-8ba0-1edfc255e236 = 15

-- Association counts
SELECT count(*) FROM "ContactCompany";  -- 0
SELECT count(*) FROM "DealContact";     -- 0
SELECT count(*) FROM "Activity" WHERE "contactId" IS NOT NULL;  -- 10

-- Lifecycle distribution
SELECT "lifecycleStage", count(*) FROM "Contact" WHERE "deletedAt" IS NULL GROUP BY "lifecycleStage";
-- subscriber=2, lead=3, mql=2, sql=2, opportunity=2, customer=2, evangelist=2

-- Lead status
SELECT "leadStatus", count(*) FROM "Contact" WHERE "deletedAt" IS NULL GROUP BY "leadStatus";
-- NULL=15 (none populated)

-- Deleted contacts
SELECT count(*) FROM "Contact" WHERE "deletedAt" IS NOT NULL;  -- 0
```

---

*End of Technical Research Report*
