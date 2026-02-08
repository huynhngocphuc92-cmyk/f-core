# Companies Page - Research Summary & Implementation Blueprint

> **Date**: 2026-02-07
> **Role**: Research Director (Synthesis)
> **Sources**: competitive-analysis.md, ux-patterns.md, tech-research.md
> **Audience**: Execution team -- this document is the single source of truth for implementation.

---

## 1. Key Findings

### From Competitive Analysis (competitive-analysis.md)

- **HubSpot's Company index page** uses a unified data table pattern (list view, board view, report view) with quick filters, advanced filters, saved views, and column customization -- this is our primary template.
- **Company creation** uses a right-side slide-out panel (not modal, not full page) with domain-based deduplication and auto-enrichment triggers.
- **Company detail page** follows a 3-column layout: Left (properties/about), Center (activity timeline with tabs), Right (associations: contacts, deals, tickets).
- **Salesforce's Account hierarchy** is significantly more powerful (unlimited levels, rollup summaries) but HubSpot's single-level parent-child is sufficient for our P0/P1 scope.
- **Pipedrive's activity-first design** (emphasizing next activity date and overdue alerts) and colored labels are high-value, low-effort features worth considering for P1.

### From UX Patterns (ux-patterns.md)

- **6 complete user flows** are specified: List View, Create Company, Company Detail (RecordPage), Edit Company, Delete Company, and Company-Contact Association.
- **Slide-in panel** (512px width, right-side, with overlay) is the standard for Create Company -- matches existing ContactsTable create pattern.
- **3-column RecordPage** for detail: Left sidebar (300px fixed), Center (flex-1), Right sidebar (300px fixed) -- each column scrolls independently.
- **Inline editing with auto-save** (PATCH on blur/Enter) for the About card on the detail page -- optimistic UI with rollback on error.
- **Responsive breakpoints** defined: Desktop (>=1280px, 3-col), Tablet (768-1279px, 2-col + toggle), Mobile (<768px, stacked cards).

### From Tech Research (tech-research.md)

- **Prisma Company model is COMPLETE** (schema.prisma lines 115-168) with all fields, relations, and indexes already defined.
- **API routes partially exist**: GET (paginated + search) and POST are in `src/app/api/companies/route.ts` (87 lines), but GET/PATCH/DELETE for individual companies (`[id]/route.ts`) are MISSING.
- **No UI components exist** -- zero files in `src/components/companies/` or `src/app/(dashboard)/companies/`.
- **ContactsTable.tsx (513 lines)** is the direct pattern to replicate -- same state management, fetch pattern, sort logic, bulk actions, and pagination.
- **Multi-tenancy gap**: Existing GET `/api/companies` does NOT enforce `tenantId` in queries -- must be fixed during implementation.

---

## 2. Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | UI pattern | Follow `ContactsTable.tsx` pattern exactly | 513-line proven component; same state management, fetch, sort, pagination, bulk actions. Reduces risk and ensures consistency. |
| 2 | Scope | 7 new files to create, 2 existing files to modify | Minimal footprint for maximum feature coverage. See File Manifest below. |
| 3 | P0 features | List + Create + Detail + CRUD API | Core CRUD is the minimum viable feature set for Companies to be usable. |
| 4 | Create form UX | Slide-in panel (right side, 512px) | Matches HubSpot pattern and existing ContactsTable create flow. Keeps list visible behind overlay. |
| 5 | Detail page layout | 3-column RecordPage (300px / flex-1 / 300px) | Matches HubSpot company detail, allows independent scrolling per column, shows properties + timeline + associations simultaneously. |
| 6 | Delete strategy | Soft delete only (`deleted_at` timestamp) | Per CLAUDE.md rules -- never hard delete CRM entities. All queries filter `WHERE deleted_at IS NULL`. |
| 7 | Validation | Zod schemas for both client and server | Single source of truth for validation rules. Schema defined in tech-research.md Section 8. |
| 8 | Sorting | Client-side initially (matches ContactsTable) | Server-side sorting can be added later. Client-side is simpler and sufficient for <1000 records per page. |
| 9 | Association model | Use existing `ContactCompany` and `DealCompany` junction tables | Already defined in Prisma schema with `isPrimary` and `role` fields. No schema changes needed. |
| 10 | Multi-tenancy | Add `tenantId` filter to ALL queries from day one | Critical security requirement per CLAUDE.md. Existing API is missing this check. |

---

## 3. P0 Scope (Build NOW)

### API Layer
- [x] `GET /api/companies` -- already exists (enhance with industry/type/size filters)
- [x] `POST /api/companies` -- already exists (add Zod validation)
- [ ] `GET /api/companies/[id]` -- fetch single company with owner, contacts, deals, activities
- [ ] `PATCH /api/companies/[id]` -- partial update (any field)
- [ ] `DELETE /api/companies/[id]` -- soft delete (set `deleted_at`)

### UI Components
- [ ] `CompaniesTable.tsx` -- full data table with search, filters, sort, pagination, bulk actions, CSV export
- [ ] `CompanyForm.tsx` -- slide-in create/edit form with Zod validation and domain dedup warning
- [ ] `companies/page.tsx` -- list page wrapper (imports CompaniesTable)

### UI Features (within above components)
- [ ] Search bar (searches name, domain, phone; debounced 300ms)
- [ ] Filter panel (Industry dropdown, Company Type dropdown)
- [ ] Sortable columns (Name, Industry, City, Created Date)
- [ ] Pagination (50 per page, prev/next navigation)
- [ ] Bulk selection with select-all
- [ ] Bulk delete (soft delete with confirmation modal)
- [ ] CSV export (selected or all visible)
- [ ] Empty state (no records + no results after filter)
- [ ] Loading state (skeleton rows)
- [ ] Error state (with retry button)
- [ ] Row click navigates to `/companies/{id}`
- [ ] Three-dot menu per row (View details, Edit, Delete)

---

## 4. P1 Scope (Defer)

| Feature | Reason to Defer |
|---------|----------------|
| **Company Detail Page** (`CompanyDetail.tsx`, `[id]/page.tsx`) | Requires 3-column layout, activity timeline, association cards -- significant complexity |
| **Board/Kanban View** | Requires drag-and-drop, lifecycle stage grouping -- separate sprint |
| **Inline editing** (auto-save on detail page) | Depends on detail page existing first |
| **Contact auto-association** (by email domain) | Server-side logic in contacts API; cross-feature dependency |
| **Association labels/roles** | UI for managing roles on ContactCompany join |
| **Saved views** (custom filtered views with tabs) | Requires view persistence model; complex filter serialization |
| **Company logo auto-fetch** | External API dependency (Clearbit/favicon service) |
| **Import from CSV** | File upload, column mapping, dedup logic |
| **Parent/Child hierarchy** | Requires `parentCompanyId` self-referencing relation |
| **Data enrichment** | External API integration (Clearbit/similar) |
| **CompanyCard.tsx** | Used in Contact/Deal detail pages for showing associated companies |
| **Full property editor modal** | "View all properties" expanded editor |

---

## 5. File Manifest

### Files to CREATE (7 files)

| # | File Path | Purpose | Est. Lines | Priority |
|---|-----------|---------|-----------|----------|
| 1 | `src/app/api/companies/[id]/route.ts` | Individual company GET, PATCH, DELETE endpoints | ~120 | P0 |
| 2 | `src/app/(dashboard)/companies/page.tsx` | Companies list page wrapper (imports CompaniesTable) | ~5 | P0 |
| 3 | `src/components/companies/CompaniesTable.tsx` | Main table component (search, filter, sort, pagination, bulk actions) | ~500 | P0 |
| 4 | `src/components/companies/CompanyForm.tsx` | Slide-in create/edit form with validation | ~250 | P0 |
| 5 | `src/app/(dashboard)/companies/[id]/page.tsx` | Company detail page wrapper (imports CompanyDetail) | ~5 | P1 |
| 6 | `src/components/companies/CompanyDetail.tsx` | 3-column detail view with properties, timeline, associations | ~300 | P1 |
| 7 | `src/components/companies/CompanyCard.tsx` | Compact card for association display in other pages | ~80 | P2 |

### Files to MODIFY (2 files)

| # | File Path | Change | Priority |
|---|-----------|--------|----------|
| 1 | `src/app/api/companies/route.ts` | Add `industry`, `type`, `size` filter params to GET; add `sort` + `sortOrder` params; add Zod validation to POST; enforce `tenantId` | P0 |
| 2 | `prisma/seed.ts` | Add 10-15 diverse companies with varied industries, types, sizes, revenues for testing | P2 |

---

## 6. Implementation Order

### Step 1: API -- Individual Company Route (P0, no dependencies)

**Create** `src/app/api/companies/[id]/route.ts`
- Copy pattern from `src/app/api/contacts/[id]/route.ts`
- Implement GET (with include: owner, contacts, deals, activities)
- Implement PATCH (partial update with Zod validation)
- Implement DELETE (soft delete: set `deletedAt = new Date()`)
- Enforce `tenantId` on all queries

### Step 2: API -- Enhance Existing List Route (P0, no dependencies)

**Modify** `src/app/api/companies/route.ts`
- Add `industry`, `type`, `size` query parameter filters to the Prisma `where` clause
- Add `sort` and `sortOrder` query parameters with server-side ordering
- Add Zod validation to POST handler using `createCompanySchema`
- Enforce `tenantId` on GET query

### Step 3: UI -- CompaniesTable Component (P0, depends on Steps 1-2)

**Create** `src/components/companies/CompaniesTable.tsx`
- Copy structure from `ContactsTable.tsx` (513 lines)
- Replace Contact type with Company type
- Replace columns: Name+Domain, Phone, City/Country, Industry (badge), Contacts count, Deals count, Owner, Actions
- Replace filter options: Industry dropdown, Company Type dropdown
- Change API endpoint to `/api/companies`
- Adapt CSV export headers and fields
- Change empty state icon to `Building2` and text to "No companies yet"

### Step 4: UI -- Companies List Page (P0, depends on Step 3)

**Create** `src/app/(dashboard)/companies/page.tsx`
- Minimal wrapper: import and render `<CompaniesTable />`
- Pattern: identical to `src/app/(dashboard)/contacts/page.tsx`

### Step 5: UI -- CompanyForm Component (P0, depends on Steps 1-2)

**Create** `src/components/companies/CompanyForm.tsx`
- Slide-in panel (512px right-side)
- Form sections: Basic Info, Company Details, Contact Info, Address
- Zod validation on submit
- Domain dedup check on domain field blur
- "Create and add another" option
- Success toast + table refresh on create

### Step 6 (P1): UI -- Company Detail Page

**Create** `src/components/companies/CompanyDetail.tsx` and `src/app/(dashboard)/companies/[id]/page.tsx`
- 3-column layout
- Left: Avatar + name + quick actions + About card
- Center: Tabs (Overview, Activities) + Activity timeline
- Right: Association cards (Contacts, Deals, Tickets placeholder)

### Step 7 (P2): Polish

**Create** `src/components/companies/CompanyCard.tsx`
**Modify** `prisma/seed.ts` -- add more diverse seed data

---

## 7. API Contract Summary

| Method | Endpoint | Status | Request | Response |
|--------|----------|--------|---------|----------|
| `GET` | `/api/companies` | EXISTS (enhance) | `?page=1&limit=50&search=&industry=&type=&size=&sort=createdAt&sortOrder=desc` | `{ data: Company[], pagination: { page, limit, total, totalPages } }` |
| `POST` | `/api/companies` | EXISTS (add Zod) | `{ name (required), domain?, industry?, type?, size?, annualRevenue?, phone?, website?, linkedinUrl?, address?, city?, state?, country?, postalCode?, ownerId?, lifecycleStage?, description? }` | `{ data: Company }` (201) |
| `GET` | `/api/companies/[id]` | NEW | - | `{ data: Company & { owner, contacts[], deals[], activities[] } }` (200) or `{ error }` (404) |
| `PATCH` | `/api/companies/[id]` | NEW | `Partial<CreateCompanyInput>` | `{ data: Company }` (200) |
| `DELETE` | `/api/companies/[id]` | NEW | - | `{ success: true }` (200) -- soft delete |

### Security Requirements (ALL endpoints)
- Every query MUST include `WHERE tenant_id = currentUser.tenantId`
- Every query MUST include `WHERE deleted_at IS NULL` (except restore)
- POST/PATCH must validate input with Zod
- Soft delete only (set `deleted_at`, never remove row)

---

## 8. Component Props Summary

### CompaniesTable (no props -- self-contained)
```typescript
// Matches ContactsTable pattern: no external props, manages own state
export function CompaniesTable() { ... }

// Internal types:
type Company = {
  id: string;
  name: string;
  domain: string | null;
  phone: string | null;
  industry: string | null;
  type: string | null;
  size: string | null;
  city: string | null;
  country: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  _count: { contacts: number; deals: number };
  createdAt: string;
};

type SortField = "name" | "industry" | "city" | "createdAt";
type SortOrder = "asc" | "desc";
```

### CompanyForm (slide-in create/edit form)
```typescript
interface CompanyFormProps {
  company?: Company;                         // If editing, pass existing data
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface CompanyFormData {
  name: string;          // Required
  domain?: string;
  description?: string;
  industry?: string;
  type?: string;
  size?: string;
  annualRevenue?: number;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerId?: string;
  lifecycleStage?: string;
}
```

### CompanyDetail (detail page -- P1)
```typescript
interface CompanyDetailProps {
  companyId: string;
}
```

### CompanyCard (compact card -- P2)
```typescript
interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    domain?: string | null;
    industry?: string | null;
  };
  onClick?: () => void;
}
```

### Constants (shared across components)
```typescript
const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "software", label: "Software" },
  { value: "consulting", label: "Consulting" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

const COMPANY_TYPES = [
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
  { value: "reseller", label: "Reseller" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1001-5000", label: "1001-5000" },
  { value: "5001+", label: "5001+" },
];

const LIFECYCLE_STAGES = [
  { value: "subscriber", label: "Subscriber", color: "gray" },
  { value: "lead", label: "Lead", color: "blue" },
  { value: "mql", label: "MQL", color: "purple" },
  { value: "sql", label: "SQL", color: "orange" },
  { value: "opportunity", label: "Opportunity", color: "yellow" },
  { value: "customer", label: "Customer", color: "green" },
  { value: "evangelist", label: "Evangelist", color: "pink" },
];
```

---

> **Document Status**: Complete
> **Handoff to**: Execution Team
> **Next Action**: Begin Step 1 (API -- Individual Company Route)
> **Estimated Total Effort**: ~1,260 lines of new code across 7 files + 2 file modifications
