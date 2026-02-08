# Contacts Page Enhancement - Research Summary & Implementation Plan

> **Date:** 2026-02-08
> **Role:** Research Director
> **Sources:** competitive-analysis.md, ux-patterns.md, tech-research.md
> **Status:** APPROVED FOR IMPLEMENTATION

---

## 1. Key Findings

### From Competitive Analysis (competitive-analysis.md)

| # | Finding | Impact |
|---|---------|--------|
| CA-1 | HubSpot uses a **3-column record layout** (25% left sidebar, 50% center, 25% right sidebar) consistently across ALL record types. This is the gold-standard pattern. | Adopt as our detail page layout. |
| CA-2 | HubSpot's **slide-out create panel** (right-side, not modal) is the industry standard for CRM record creation. Salesforce and Pipedrive both use similar patterns. | ContactForm must be a slide-in panel, not a separate route. |
| CA-3 | **Activity timeline** is the center of every CRM record page, not the properties. Properties live in the sidebar. | Center column = tabs + timeline. Left column = about card. |
| CA-4 | HubSpot uses a **single Contact object with Lifecycle Stage** instead of Salesforce's Lead/Contact dual-object model. This is simpler and more modern. | Keep our single-object model. Use lifecycleStage field for progression. |
| CA-5 | **Association management** is critical: Contact-Company (many-to-many with primary), Contact-Deal, Contact-Ticket. Right sidebar cards with "+ Associate" buttons. | Build association cards in right sidebar with add/remove. |
| CA-6 | **Saved views, advanced filters, and bulk actions** are table stakes for any CRM list view. | Defer saved views to P1. Implement bulk actions and lead status filter now. |
| CA-7 | Pipedrive's **independent scrolling** for sidebar vs. main content is a UX win. | Apply `overflow-y-auto` independently to each column on detail page. |

### From UX Patterns (ux-patterns.md)

| # | Finding | Impact |
|---|---------|--------|
| UX-1 | Detail page layout: Left (300px) with avatar + about card, Center (flex-1) with tabs (Overview/Activity/Notes), Right (300px) with association cards. | Direct layout specification for ContactDetailPage. |
| UX-2 | Contact form: 512px wide slide-in panel with 4 sections (Personal Info, Professional Details, Company Association, Address). Email required as primary identifier. | Direct specification for ContactForm.tsx. |
| UX-3 | Table enhancements needed: Company column, Lead Status column, Created date column, working actions dropdown (View/Edit/Delete), create button opens form (not Link). | Exact modifications for ContactsTable.tsx. |
| UX-4 | Activity timeline colors: Email=blue, Call=green, Meeting=purple, Note=yellow, Task=orange. Each entry has icon + type label + description + timestamp. | Color constants for timeline component. |
| UX-5 | Association card pattern: header with count badge, collapsible body, "+ Associate" button opens search dropdown, X button to remove, star icon for primary. | Component specification for association cards. |
| UX-6 | Responsive breakpoints: Desktop (>=1280px) 3-column, Tablet (768-1279px) 2-column with toggles, Mobile (<768px) single stacked column. | CSS grid/flex specification. |
| UX-7 | States: Loading=skeleton pulse, Error=red text + retry, Empty=icon + text + CTA. Consistent across all views. | Standard state patterns. |

### From Tech Research (tech-research.md)

| # | Finding | Impact |
|---|---------|--------|
| TR-1 | **CRITICAL: No tenantId enforcement** in any contacts API route (GET list, GET [id], PATCH, DELETE). All routes are IDOR-vulnerable. Companies API correctly hardcodes tenantId. | Fix ALL routes before any other work. |
| TR-2 | POST /api/contacts uses `body.tenantId || "demo-tenant"` which is different from Companies' `"84d5dd22-9e29-425c-8ba0-1edfc255e236"`. Client-controlled tenantId is a security vulnerability. | Hardcode tenantId to match Companies pattern. |
| TR-3 | PATCH and DELETE have no existence check. Prisma throws a generic error instead of returning 404. Companies correctly does `findUnique` first. | Add existence + tenantId check before PATCH/DELETE. |
| TR-4 | ContactsTable.tsx (512 lines): Actions column is non-functional (MoreHorizontal icon with no dropdown). Create button is a Link to `/contacts/new` which does not exist. | Replace Link with onClick -> ContactForm. Add actions dropdown. |
| TR-5 | Database has 15 contacts, all in tenant `84d5dd22-...`. Zero ContactCompany records, zero DealContact records. 10 activities linked to contacts. All leadStatus values are NULL. | Seed data needs enrichment (P2). |
| TR-6 | Export function exports all current-page contacts regardless of selection. Companies exports selected items. | Fix export to respect selection. |
| TR-7 | No `overflow-x-auto` on table wrapper. Companies has it for mobile horizontal scrolling. | Add overflow wrapper. |
| TR-8 | Schema is complete with all needed fields (23+), indexes (tenantId, email, ownerId, lifecycleStage, deletedAt), and junction tables (ContactCompany, DealContact). **No schema changes needed.** | Proceed with implementation using existing schema. |

---

## 2. Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D-1 | Detail page layout | 3-column (HubSpot-style) | Industry standard across all 3 CRMs analyzed. Consistent with our existing approach. |
| D-2 | Lead vs Contact model | Single Contact with Lifecycle Stage | Simpler than Salesforce's dual-object model. Already in our schema. HubSpot-aligned. |
| D-3 | Create contact UX | Right slide-in panel (not route/modal) | Matches CompanyForm.tsx pattern. Industry standard. Keeps user in context. |
| D-4 | Activity timeline position | Center column, Activities tab | All 3 CRMs put timeline in the center. Activity-first design philosophy from Pipedrive. |
| D-5 | Association UI | Right sidebar cards with add/remove | HubSpot pattern. Clean separation: left=properties, center=activity, right=associations. |
| D-6 | tenantId approach | Hardcode `84d5dd22-9e29-425c-8ba0-1edfc255e236` | Must match Companies API. Will replace with auth session in future sprint. |
| D-7 | Filters to add in P0 | Lead Status dropdown only | Lifecycle stage already exists. Lead status is the next most-used CRM filter. Owner filter deferred to P1. |
| D-8 | Inline editing | Defer to P1 | Requires significant UI complexity (hover states, input switching, save/cancel). Not needed for parity with Companies. |
| D-9 | Saved views | Defer to P1 | Complex feature (persistence, sharing, visibility). Not in Companies either. |
| D-10 | Import/export | Basic CSV export in P0, import deferred to P1 | Export already exists but needs fix for selection. Import requires column mapping wizard. |
| D-11 | Detail page in P0 | 3-column with about card, timeline placeholder, association cards | Full timeline and activity logging are P1. P0 gets the layout, about card, and association cards working. |
| D-12 | Association API | New endpoints under `/api/contacts/[id]/associations` | No existing association API. Need POST (create) and DELETE (remove) endpoints. |

---

## 3. P0 Scope (Build NOW)

The MINIMUM set of work to bring contacts to the same quality as the Companies page, plus the detail page foundation.

### 3.1 Security Fixes (MUST DO FIRST)

- **Fix tenantId enforcement** on ALL contacts API routes (GET list, GET [id], PATCH, DELETE, POST)
- **Add existence checks** before PATCH and DELETE (return 404 instead of Prisma error)
- **Hardcode tenantId** in POST to `84d5dd22-9e29-425c-8ba0-1edfc255e236` (remove `body.tenantId`)

### 3.2 ContactForm.tsx (CREATE)

- Slide-in panel matching CompanyForm.tsx pattern
- Props: `isOpen`, `onClose`, `onSuccess`
- Sections: Personal Info, Professional Details, Company Association (search-select), Address
- Email required as unique identifier
- POST to `/api/contacts`, close on success, show toast
- Estimated: ~380 lines

### 3.3 ContactsTable.tsx Enhancements (MODIFY)

- **Create button**: Replace `<Link href="/contacts/new">` with `<button onClick={() => setShowCreateForm(true)}>`. Integrate `<ContactForm />` at bottom of component.
- **Actions dropdown**: Replace non-functional MoreHorizontal with working dropdown (View details -> `/contacts/[id]`, Edit -> opens form with prefill, Delete -> confirm -> soft delete)
- **Individual delete**: Add `handleDelete(id, name)` function matching Companies pattern
- **Export fix**: Export selected contacts when items are selected, all visible when none selected
- **New columns**: Company (from API `companies[0].company.name`), Lead Status (badge), Created date
- **Lead status filter**: Add dropdown in filter panel
- **Table overflow**: Add `overflow-x-auto` wrapper
- **Active filter count**: Show badge on Filters button with count
- **Empty state**: Add Users icon from lucide
- **Type update**: Add `companies` and `leadStatus` to Contact type

### 3.4 Contact Detail Page (CREATE)

- Route: `/app/(dashboard)/contacts/[id]/page.tsx`
- 3-column layout: left sidebar (about card), center (tabs with overview/activity), right sidebar (association cards)
- **Left sidebar**: Avatar (initials), name, email, phone, quick action icons, about card (lifecycle stage, lead status, owner, job title, department, company)
- **Center**: Tab bar (Overview | Activity). Overview tab shows recent activities. Activity tab shows chronological timeline.
- **Right sidebar**: Companies card (list of associated companies, + Associate button), Deals card (list of associated deals, + Associate button)
- Responsive: 3-col desktop, 2-col tablet, 1-col mobile

### 3.5 Association Management API (CREATE)

- `POST /api/contacts/[id]/associations` - Create association `{ type: "company"|"deal", targetId: string, isPrimary?: boolean }`
- `DELETE /api/contacts/[id]/associations/[targetId]` - Remove association `{ type: "company"|"deal" }`
- Both endpoints enforce tenantId and validate existence
- `GET /api/contacts/[id]` already returns associations via include

### 3.6 Lead Status Filter API (MODIFY)

- Add `leadStatus` query parameter to `GET /api/contacts` route
- Filter: `...(leadStatus && { leadStatus })`

---

## 4. P1 Scope (Defer)

These features are explicitly **not in P0** and should be built in a subsequent sprint:

| Feature | Reason for Deferral |
|---------|-------------------|
| Inline editing (hover pencil, click-to-edit) | High UI complexity. Not in Companies page. Needs input type switching, save/cancel, undo. |
| Advanced filters (AND/OR logic, association-based) | Complex filter builder UI. Basic dropdown filters sufficient for now. |
| Saved views (create, name, visibility, share) | Requires persistence model (new DB table), complex UI. Not in Companies page. |
| Contact merge/dedup | Side-by-side comparison, property resolution, activity merging. Separate feature. |
| CSV import (column mapping, dedup) | Requires import wizard, progress tracking. Separate feature. |
| Owner filter dropdown | Requires fetching users list. Lower priority than lead status filter. |
| Board view (Kanban by lifecycle stage) | Entirely new view component. Nice-to-have. |
| Independent sidebar scrolling | UX enhancement but not blocking. |
| Activity logging from record (Log Call, Email, etc.) | Requires activity creation forms. Timeline display is P0; creation is P1. |
| Record preview sidebar (click in list to preview) | Extra UI panel. Not in Companies. |
| Seed data enrichment (jobTitle, leadStatus, associations) | Nice-to-have for demo quality. Does not block functionality. |
| Zod validation on API endpoints | Improves security but basic validation exists. |

---

## 5. File Manifest

| # | File Path | Purpose | Est. Lines | Priority | Action |
|---|-----------|---------|------------|----------|--------|
| 1 | `src/app/api/contacts/route.ts` | Fix tenantId enforcement in GET + POST, add leadStatus filter | ~130 | P0 | MODIFY |
| 2 | `src/app/api/contacts/[id]/route.ts` | Fix tenantId in GET/PATCH/DELETE, add existence checks | ~145 | P0 | MODIFY |
| 3 | `src/components/contacts/ContactForm.tsx` | Slide-in create/edit contact form panel | ~400 | P0 | CREATE |
| 4 | `src/components/contacts/ContactsTable.tsx` | Actions dropdown, create form integration, columns, filters, export fix | ~680 | P0 | MODIFY |
| 5 | `src/app/(dashboard)/contacts/[id]/page.tsx` | Contact detail page with 3-column layout | ~450 | P0 | CREATE |
| 6 | `src/app/api/contacts/[id]/associations/route.ts` | POST to create contact-company/deal associations | ~80 | P0 | CREATE |
| 7 | `src/app/api/contacts/[id]/associations/[targetId]/route.ts` | DELETE to remove association | ~60 | P0 | CREATE |
| 8 | `src/app/(dashboard)/contacts/page.tsx` | Add page metadata (title) | ~12 | P0 | MODIFY |

**Total P0 Effort:** 8 files (4 CREATE + 4 MODIFY), ~1,957 lines estimated

---

## 6. Implementation Order

### Step 1: Fix API Security (Blocks everything)
**Files:** `src/app/api/contacts/route.ts`, `src/app/api/contacts/[id]/route.ts`
**What:** Add tenantId to all WHERE clauses, hardcode tenantId in POST, add existence checks to PATCH/DELETE, add leadStatus filter param.
**Dependencies:** None
**Verification:** Manually test each endpoint returns only tenant-scoped data.

### Step 2: Create ContactForm.tsx
**Files:** `src/components/contacts/ContactForm.tsx`
**What:** Build slide-in panel with all form sections, validation, and API integration.
**Dependencies:** Step 1 (POST API must have correct tenantId)
**Verification:** Open form, fill fields, submit, verify contact created in DB with correct tenantId.

### Step 3: Enhance ContactsTable.tsx
**Files:** `src/components/contacts/ContactsTable.tsx`
**What:** Integrate ContactForm, add actions dropdown, fix export, add columns (company, lead status, created), add lead status filter, add overflow wrapper, fix empty state.
**Dependencies:** Step 2 (ContactForm must exist for import)
**Verification:** Create button opens form, actions dropdown works, export respects selection, new columns render.

### Step 4: Create Association API
**Files:** `src/app/api/contacts/[id]/associations/route.ts`, `src/app/api/contacts/[id]/associations/[targetId]/route.ts`
**What:** POST to create ContactCompany/DealContact records, DELETE to remove them.
**Dependencies:** Step 1 (tenantId pattern established)
**Verification:** Create association via API, verify junction record exists. Delete, verify removed.

### Step 5: Create Contact Detail Page
**Files:** `src/app/(dashboard)/contacts/[id]/page.tsx`
**What:** 3-column layout with about card (left), tabs + timeline (center), association cards (right). Wire up association add/remove to API from Step 4.
**Dependencies:** Step 4 (association API needed for add/remove buttons on detail page)
**Verification:** Navigate to `/contacts/[id]`, verify all 3 columns render, about card shows correct data, association cards load and allow add/remove.

### Step 6: Update Page Metadata
**Files:** `src/app/(dashboard)/contacts/page.tsx`
**What:** Add Next.js metadata export for page title.
**Dependencies:** None (can be done anytime)
**Verification:** Browser tab shows "Contacts | F-CORE".

---

## 7. API Contract Summary

### Existing Endpoints (After Fixes)

| Method | Endpoint | Status | Request | Response |
|--------|----------|--------|---------|----------|
| GET | `/api/contacts` | FIX tenantId | `?page=1&limit=50&search=&lifecycleStage=&leadStatus=` | `{ data: Contact[], pagination: { page, limit, total, totalPages } }` |
| POST | `/api/contacts` | FIX tenantId | `{ email, firstName, lastName, phone, mobilePhone, lifecycleStage, leadStatus, ownerId, jobTitle, department, website, linkedinUrl, address, city, state, country, postalCode }` | `Contact` (201) |
| GET | `/api/contacts/[id]` | FIX tenantId | - | `Contact` with owner, companies, deals, activities |
| PATCH | `/api/contacts/[id]` | FIX tenantId + 404 check | `{ ...partialContactFields }` | `Contact` with owner |
| DELETE | `/api/contacts/[id]` | FIX tenantId + 404 check | - | `{ success: true }` |

### New Endpoints

| Method | Endpoint | Status | Request | Response |
|--------|----------|--------|---------|----------|
| POST | `/api/contacts/[id]/associations` | CREATE | `{ type: "company" \| "deal", targetId: string, isPrimary?: boolean }` | `{ success: true, data: ContactCompany \| DealContact }` (201) |
| DELETE | `/api/contacts/[id]/associations/[targetId]` | CREATE | `?type=company \| deal` | `{ success: true }` |

### Error Response Pattern (All Endpoints)

```json
{ "error": "Human-readable error message" }
```

Status codes: 400 (validation), 404 (not found), 500 (server error)

---

## 8. Component Props Summary

### Constants

```typescript
// Lifecycle Stages - Used in ContactForm select, ContactsTable filter & badges
const LIFECYCLE_STAGES = [
  { value: "subscriber", label: "Subscriber", color: "gray" },
  { value: "lead", label: "Lead", color: "blue" },
  { value: "mql", label: "MQL", color: "purple" },
  { value: "sql", label: "SQL", color: "orange" },
  { value: "opportunity", label: "Opportunity", color: "yellow" },
  { value: "customer", label: "Customer", color: "green" },
  { value: "evangelist", label: "Evangelist", color: "pink" },
] as const;

// Lead Statuses - Used in ContactForm select, ContactsTable filter & badges
const LEAD_STATUSES = [
  { value: "new", label: "New", color: "blue" },
  { value: "open", label: "Open", color: "cyan" },
  { value: "in_progress", label: "In Progress", color: "yellow" },
  { value: "open_deal", label: "Open Deal", color: "purple" },
  { value: "unqualified", label: "Unqualified", color: "gray" },
  { value: "attempted_to_contact", label: "Attempted to Contact", color: "orange" },
  { value: "connected", label: "Connected", color: "green" },
  { value: "bad_timing", label: "Bad Timing", color: "red" },
] as const;
```

### ContactForm Props

```typescript
interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editContact?: Contact | null; // If provided, form is in edit mode
}

// Internal form state
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobilePhone: string;
  jobTitle: string;
  department: string;
  lifecycleStage: string;
  leadStatus: string;
  website: string;
  linkedinUrl: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  companyId: string; // For association on create
}
```

### ContactsTable Types

```typescript
type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  lifecycleStage: string | null;
  leadStatus: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  companies: Array<{
    isPrimary: boolean;
    company: { id: string; name: string };
  }>;
  createdAt: string;
};

type SortField = "firstName" | "email" | "lifecycleStage" | "createdAt";
type SortOrder = "asc" | "desc";
```

### Contact Detail Page Types

```typescript
interface ContactDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  jobTitle: string | null;
  department: string | null;
  lifecycleStage: string | null;
  leadStatus: string | null;
  website: string | null;
  linkedinUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  companies: Array<{
    isPrimary: boolean;
    companyId: string;
    company: {
      id: string;
      name: string;
      domain: string | null;
      industry: string | null;
    };
  }>;
  deals: Array<{
    dealId: string;
    deal: {
      id: string;
      dealName: string;
      amount: number | null;
      stage: string | null;
    };
  }>;
  activities: Array<{
    id: string;
    type: string;
    subject: string | null;
    body: string | null;
    createdAt: string;
  }>;
}

// Activity type color map
const ACTIVITY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  email: { bg: "bg-blue-50", text: "text-blue-700", icon: "Mail" },
  call: { bg: "bg-green-50", text: "text-green-700", icon: "Phone" },
  meeting: { bg: "bg-purple-50", text: "text-purple-700", icon: "Calendar" },
  note: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "FileText" },
  task: { bg: "bg-orange-50", text: "text-orange-700", icon: "CheckSquare" },
};
```

### Association Card Props

```typescript
interface AssociationCardProps {
  title: string;                          // "Companies" | "Deals"
  items: AssociationItem[];
  onAdd: (targetId: string) => void;      // Called when user selects item from search
  onRemove: (targetId: string) => void;   // Called when user clicks X on item
  onSetPrimary?: (targetId: string) => void; // For companies only
  searchEndpoint: string;                 // "/api/companies?search=" | "/api/deals?search="
  emptyText: string;                      // "No companies associated"
}

interface AssociationItem {
  id: string;
  name: string;
  subtitle?: string;  // domain for companies, amount for deals
  isPrimary?: boolean; // For companies
}
```

---

## Appendix: Existing Code Reference

### Files That Already Exist (Current State)

| File | Lines | Status |
|------|-------|--------|
| `src/components/contacts/ContactsTable.tsx` | 512 | Working but has issues (no tenantId in API calls, broken action menu, no create form, missing columns) |
| `src/app/api/contacts/route.ts` | 113 | Working but CRITICAL security issues (no tenantId, client-controlled tenantId in POST) |
| `src/app/api/contacts/[id]/route.ts` | 114 | Working but CRITICAL security issues (no tenantId, no existence checks) |
| `src/app/(dashboard)/contacts/page.tsx` | 5 | Minimal wrapper, needs metadata |

### Reference Pattern Files (Companies - Gold Standard)

| File | Lines | Pattern to Copy |
|------|-------|-----------------|
| `src/components/companies/CompanyForm.tsx` | 447 | Slide-in panel, form sections, submit handler, isOpen/onClose/onSuccess props |
| `src/app/api/companies/route.ts` | ~100 | tenantId hardcoded in WHERE, proper filter params |
| `src/app/api/companies/[id]/route.ts` | ~130 | tenantId in findUnique, existence check before PATCH/DELETE, 404 response |

---

*End of Research Summary. Approved for implementation.*
