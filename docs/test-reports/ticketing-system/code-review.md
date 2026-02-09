# Ticketing System - Code Review Report

**Reviewer:** Claude Opus 4 (Automated Review)
**Date:** 2026-02-09
**Scope:** All ticketing system code files (20 files)
**Branch:** main

---

## Executive Summary

The ticketing system is a well-structured implementation covering Prisma schema, API routes, validation, and frontend pages. The architecture follows the existing CRM patterns (Contacts, Deals) and introduces ticket pipelines, SLA policies, comments, and activity tracking. Overall code quality is **good**, with several areas needing attention around security, race conditions, and input validation.

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| MAJOR | 9 |
| MINOR | 12 |
| INFO | 8 |

---

## 1. Prisma Schema (`prisma/schema.prisma`)

### [INFO] T-SCH-01: Well-designed schema with comprehensive indexes

The Ticket model includes composite indexes (`[tenantId, status]` and `[tenantId, assignedToUserId, status]`) which will benefit common query patterns. The `@@unique([tenantId, ticketNumber])` constraint ensures ticket number uniqueness per tenant. Soft delete via `deletedAt` is consistently applied across Ticket, TicketComment, TicketPipeline, TicketPipelineStage, and TicketSLAPolicy.

### [MINOR] T-SCH-02: TicketActivity model missing `deletedAt` field

**File:** `/Users/chong/hubspot-demo/prisma/schema.prisma` (lines 607-636)

The `TicketActivity` model is the only ticket-related model without a `deletedAt` field. While activity logs are typically immutable, this breaks consistency with the project rule that all CRM entities use soft delete.

```prisma
model TicketActivity {
  id              String    @id @default(uuid())
  // ... fields ...
  createdAt       DateTime  @default(now())
  // Missing: deletedAt DateTime?
}
```

### [MINOR] T-SCH-03: TicketComment missing `tenantId` field

**File:** `/Users/chong/hubspot-demo/prisma/schema.prisma` (lines 497-522)

The `TicketComment` model does not have a `tenantId` field. While tenant isolation is achieved via the parent ticket, having `tenantId` on the comment would enable direct tenant-scoped queries and provide an additional layer of data isolation defense-in-depth.

### [INFO] T-SCH-04: TicketSLAPolicy unique constraint on `[tenantId, priority]`

This is a good design decision that prevents multiple SLA policies for the same priority level within a tenant. Line 602.

### [MAJOR] T-SCH-05: TicketCounter race condition risk under concurrency

**File:** `/Users/chong/hubspot-demo/prisma/schema.prisma` (lines 638-644) and `/Users/chong/hubspot-demo/src/lib/ticket-number.ts` (lines 7-15)

The `TicketCounter` model uses a simple `lastNumber` field with Prisma's `upsert` + `increment`. While `upsert` with `increment` is atomic at the database level, under high concurrency the `upsert` operation's `create` branch could race if two requests try to create the counter simultaneously. The `tenantId` primary key on `TicketCounter` provides database-level uniqueness, so one would fail and need retry logic.

```typescript
// src/lib/ticket-number.ts
export async function getNextTicketNumber(tenantId: string): Promise<number> {
  const counter = await prisma.ticketCounter.upsert({
    where: { tenantId },
    update: { lastNumber: { increment: 1 } },
    create: { tenantId, lastNumber: 1 },
  });
  return counter.lastNumber;
}
```

**Risk:** No retry logic if the create branch races. Should wrap in a transaction with retry or use `ON CONFLICT` directly.

---

## 2. Library Files

### [INFO] T-LIB-01: Duplicate `formatTicketNumber` function

**Files:**
- `/Users/chong/hubspot-demo/src/lib/ticket-number.ts` (line 20-22)
- `/Users/chong/hubspot-demo/src/lib/format-ticket-number.ts` (line 4-6)

The `formatTicketNumber` function is defined identically in two separate files. The `ticket-number.ts` file imports `prisma` (server-only), so a separate client-safe copy in `format-ticket-number.ts` exists for client components. This is correct for Next.js server/client boundary reasons, but should be documented to prevent confusion.

### [CRITICAL] T-LIB-02: Tenant isolation relies on module-level cache without request scoping

**File:** `/Users/chong/hubspot-demo/src/lib/tenant.ts` (lines 3, 11)

```typescript
let cachedTenantId: string | null = null;

export async function getDemoTenantId(): Promise<string> {
  if (cachedTenantId) return cachedTenantId;
  // ...
}
```

The `cachedTenantId` is a **module-level variable** that persists across requests in the same Node.js process. In a production multi-tenant system, this would be a **critical tenant isolation vulnerability** -- if the cache ever returned the wrong tenant for a request, all subsequent API calls would leak data across tenants. For the current demo mode with a single tenant this is safe, but this pattern is dangerous as a foundation for future multi-tenant support.

**Recommendation:** Use per-request context (e.g., Next.js `headers()` or `cookies()` for session-based tenant resolution) rather than module-level caching.

### [MINOR] T-LIB-03: Validation schema allows arbitrary string lengths for tags

**File:** `/Users/chong/hubspot-demo/src/lib/validations/ticket.ts` (line 19)

```typescript
tags: z.array(z.string()).default([]),
```

Tag strings have no length limit or character restrictions. Malicious input could include extremely long strings or special characters.

**Recommendation:** Add `.max(50)` to individual tag strings and `.max(20)` to the array.

### [MINOR] T-LIB-04: No validation on `description` length

**File:** `/Users/chong/hubspot-demo/src/lib/validations/ticket.ts` (line 10)

```typescript
description: z.string().optional(),
```

The description field maps to `@db.Text` in Prisma (unlimited length). No max length validation is applied. A malicious user could submit megabytes of text.

**Recommendation:** Add `.max(10000)` or similar reasonable limit.

### [MINOR] T-LIB-05: Comment content validation lacks max length

**File:** `/Users/chong/hubspot-demo/src/lib/validations/ticket.ts` (line 36)

```typescript
content: z.string().min(1, "Comment content is required"),
```

Same issue as above -- no maximum length bound on comment content.

### [MINOR] T-LIB-06: SLA `businessHoursStart`/`businessHoursEnd` regex is too permissive

**File:** `/Users/chong/hubspot-demo/src/lib/validations/ticket.ts` (lines 70-71)

```typescript
businessHoursStart: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
businessHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
```

The regex `^\d{2}:\d{2}$` allows invalid times like `"99:99"` or `"25:61"`. A proper time validation should check `00-23` for hours and `00-59` for minutes.

---

## 3. API Routes

### 3.1 `GET /api/tickets` (`src/app/api/tickets/route.ts`)

### [MAJOR] T-API-01: Unsanitized `sortBy` parameter allows arbitrary column access

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/route.ts` (lines 21-22, 57)

```typescript
const sortBy = searchParams.get("sortBy") || "createdAt";
const sortOrder = searchParams.get("sortOrder") || "desc";
// ...
orderBy: { [sortBy]: sortOrder },
```

The `sortBy` parameter is taken directly from user input and used as a Prisma `orderBy` key without validation. While Prisma will reject invalid column names (preventing SQL injection), this could expose internal column names through error messages and could cause unexpected server errors.

`sortOrder` is also unvalidated -- any value other than `"asc"` or `"desc"` will cause a Prisma error.

**Recommendation:** Whitelist allowed sort fields and validate sort order:
```typescript
const allowedSortFields = ["createdAt", "updatedAt", "priority", "status", "ticketNumber"];
const sortBy = allowedSortFields.includes(searchParams.get("sortBy") || "")
  ? searchParams.get("sortBy")!
  : "createdAt";
const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
```

### [MAJOR] T-API-02: `page` and `limit` parameters not validated for bounds

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/route.ts` (lines 12-13)

```typescript
const page = parseInt(searchParams.get("page") || "1");
const limit = parseInt(searchParams.get("limit") || "50");
```

No bounds checking: `page=0` or `page=-1` would produce negative `skip` values; `limit=999999` could cause excessive memory usage. `parseInt` on non-numeric strings returns `NaN`, which propagates silently.

### [MAJOR] T-API-03: Search with `ticketNumber` filter creates potential issues

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/route.ts` (lines 29-34)

```typescript
OR: [
  { title: { contains: search, mode: "insensitive" as const } },
  { description: { contains: search, mode: "insensitive" as const } },
  { ticketNumber: isNaN(parseInt(search)) ? undefined : parseInt(search) },
].filter(Boolean),
```

When search is a number, `{ ticketNumber: parseInt(search) }` performs an exact match, not a partial match. When search is not a number, `{ ticketNumber: undefined }` is truthy (it's an object), so `.filter(Boolean)` does not remove it. This means every non-numeric search will include `{ ticketNumber: undefined }` in the OR clause, which matches all records where `ticketNumber` is null (none in practice, but semantically incorrect).

### 3.2 `POST /api/tickets` (`src/app/api/tickets/route.ts`)

### [CRITICAL] T-API-04: Missing cross-tenant validation on `contactId`, `companyId`, `assignedToUserId`, `stageId`

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/route.ts` (lines 145-163)

When creating a ticket, the API accepts `contactId`, `companyId`, `assignedToUserId`, and `stageId` from user input but does **not** verify that these resources belong to the same tenant. An attacker could associate a ticket with a contact/company from a different tenant.

```typescript
const ticket = await prisma.ticket.create({
  data: {
    tenantId,
    // These IDs are not validated against the tenant:
    contactId: data.contactId,       // Could be from another tenant
    companyId: data.companyId,       // Could be from another tenant
    assignedToUserId: data.assignedToUserId, // Could be from another tenant
    stageId,                          // Could be from another pipeline/tenant
    // ...
  },
});
```

**Recommendation:** Before creating, verify each referenced entity belongs to the current tenant:
```typescript
if (data.contactId) {
  const contact = await prisma.contact.findFirst({
    where: { id: data.contactId, tenantId, deletedAt: null }
  });
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 400 });
}
```

### 3.3 `PATCH /api/tickets/[id]` (`src/app/api/tickets/[id]/route.ts`)

### [CRITICAL] T-API-05: Missing tenant validation on `stageId` during update

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/[id]/route.ts` (lines 128-136)

When updating a ticket's stage, the code fetches the stage by ID without verifying it belongs to the same pipeline/tenant:

```typescript
if (data.stageId && data.stageId !== existing.stageId) {
  const newStage = await prisma.ticketPipelineStage.findUnique({
    where: { id: data.stageId },
    select: { type: true },
  });
}
```

An attacker could move a ticket to a stage from a different pipeline or tenant.

### [MAJOR] T-API-06: Ticket update does not verify `assignedToUserId` or `contactId` belong to tenant

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/[id]/route.ts` (lines 148-163)

Same issue as T-API-04 but for the update path. The `updateTicketSchema` allows changing `contactId`, `companyId`, and `assignedToUserId` without tenant-scoping the lookup.

### [MINOR] T-API-07: Activity log records raw IDs instead of readable names

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/[id]/route.ts` (lines 114-123)

```typescript
activityEntries.push({
  // ...
  oldValue: existing[field] as string | null,  // Raw UUID
  newValue: data[field] as string | null,       // Raw UUID
  description: `${field} changed`,
});
```

For `assignedToUserId` and `stageId` changes, the activity log stores raw UUIDs as `oldValue`/`newValue`, making the activity log unreadable without additional lookups. The `description` is also not human-friendly (`"assignedToUserId changed"`).

### 3.4 Comments API (`src/app/api/tickets/[id]/comments/route.ts`)

### [INFO] T-API-08: Good pattern -- verifies ticket belongs to tenant before operations

Lines 16-23 correctly verify the ticket exists and belongs to the tenant before allowing comment creation or listing. This is a well-implemented tenant isolation pattern.

### [INFO] T-API-09: SLA first-response tracking on public comments is well implemented

Lines 89-95 correctly track the first public response time for SLA calculations, only setting `firstResponseAt` if it hasn't been set and the comment is not internal.

### 3.5 Pipelines API (`src/app/api/tickets/pipelines/[id]/route.ts`)

### [MAJOR] T-API-10: Stage update in PATCH does not verify stage belongs to this pipeline

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/pipelines/[id]/route.ts` (lines 80-102)

```typescript
if (stages) {
  for (const stage of stages) {
    if (stage.id) {
      await prisma.ticketPipelineStage.update({
        where: { id: stage.id },  // No pipeline ID check!
        data: { ... },
      });
    }
  }
}
```

When updating stages by ID, there is no verification that the stage belongs to the pipeline being updated. An attacker could modify stages from a different pipeline.

### [MAJOR] T-API-11: N+1 query pattern in pipeline stage update

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/pipelines/[id]/route.ts` (lines 80-102)

Each stage update/create is performed in a separate query within a loop. For a pipeline with N stages, this executes N separate database queries. Should use `prisma.$transaction()` for atomicity and consider batch operations.

### [MINOR] T-API-12: No way to delete stages from a pipeline

The PATCH endpoint can update existing stages and create new ones, but there is no mechanism to soft-delete (or remove) stages from a pipeline. Stages can only be added or modified.

### 3.6 SLA API (`src/app/api/tickets/sla/route.ts`)

### [MAJOR] T-API-13: SLA creation does not handle soft-deleted policies correctly

**File:** `/Users/chong/hubspot-demo/src/app/api/tickets/sla/route.ts` (lines 44-53)

```typescript
const existing = await prisma.ticketSLAPolicy.findUnique({
  where: { tenantId_priority: { tenantId, priority: parsed.data.priority } },
});

if (existing && !existing.deletedAt) {
  return NextResponse.json(
    { error: `SLA policy for priority "${parsed.data.priority}" already exists` },
    { status: 409 }
  );
}
```

If a soft-deleted policy exists for the same priority, the code will attempt to create a new one, but the unique constraint `@@unique([tenantId, priority])` will cause a database error because the soft-deleted record still occupies the unique slot. The code should either restore the soft-deleted record or use a different approach.

---

## 4. Frontend Pages

### 4.1 Tickets List Page (`src/app/(dashboard)/tickets/page.tsx`)

### [MINOR] T-FE-01: Direct Prisma usage in server component duplicates tenant lookup

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/tickets/page.tsx` (lines 8-11)

```typescript
async function getTickets() {
  const tenant = await prisma.tenant.findFirst({
    where: { domain: "demo.f-core.com" },
    select: { id: true },
  });
```

Every server component page repeats the tenant lookup pattern instead of using `getDemoTenantId()` from `src/lib/tenant.ts`. This creates maintenance burden and inconsistency.

### [MINOR] T-FE-02: Search input is not functional (no state management)

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/tickets/page.tsx` (lines 116-122)

The search input is rendered but has no `onChange` handler or state management. It is purely decorative at this point.

### [MINOR] T-FE-03: Checkbox inputs have no state management

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/tickets/page.tsx` (lines 139-141, 176-179)

The header and row checkboxes render but are non-functional -- no state, no handlers. This is acceptable for initial UI scaffolding but should be flagged.

### [INFO] T-FE-04: Good design system compliance

The page uses `#0891b2` consistently for primary actions, hover states, and focus rings. The Kanban board and list views provide good UX flexibility.

### 4.2 Ticket Detail Page (`src/app/(dashboard)/tickets/[id]/page.tsx`)

### [MINOR] T-FE-05: XSS risk from rendering raw `tag` values

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/tickets/[id]/page.tsx` (line 283)

```tsx
{ticket.tags.map((tag) => (
  <span key={tag} className="...">
    <Tag className="w-3 h-3" />
    {tag}
  </span>
))}
```

Tags are user-supplied strings rendered directly in JSX. React auto-escapes strings, so this is not a direct XSS vulnerability. However, if tags ever contain HTML-like content, it could cause rendering artifacts. The real concern is that tags are not validated/sanitized at the API layer (see T-LIB-03).

### [INFO] T-FE-06: Pipeline progress visualization is well implemented

The pipeline progress bar (lines 134-159) correctly determines current, past, and future stages using `displayOrder` comparison. Uses the `#0891b2` brand color with opacity variation.

### 4.3 New Ticket Page (`src/app/(dashboard)/tickets/new/page.tsx`)

### [MAJOR] T-FE-07: No error handling or user feedback on submission failure

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/tickets/new/page.tsx` (lines 52-72)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ...
  try {
    const res = await fetch("/api/tickets", { ... });
    if (res.ok) {
      const ticket = await res.json();
      router.push(`/tickets/${ticket.id}`);
    }
    // No else branch! Errors are silently swallowed.
  } finally {
    setSubmitting(false);
  }
};
```

If the API returns a 400 or 500 error, the user receives no feedback. The form simply re-enables the submit button with no indication of what went wrong.

### [MINOR] T-FE-08: API errors in contact/company fetching are silently swallowed

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/tickets/new/page.tsx` (lines 36-45)

```typescript
fetch("/api/contacts?limit=100")
  .then((r) => r.json())
  .then((d) => setContacts(d.data || []))
  .catch(() => {});
```

Network errors or API failures are caught and ignored. The user sees empty dropdowns with no indication that data failed to load.

### 4.4 Pipelines Page (`src/app/(dashboard)/tickets/pipelines/page.tsx`)

### [INFO] T-FE-09: Clean, read-only display of pipeline configuration

Good layout. The page is purely informational with no edit functionality. The table structure with color indicators is clear and follows the design system.

### 4.5 SLA Policies Page (`src/app/(dashboard)/tickets/sla/page.tsx`)

### [MINOR] T-FE-10: Double sorting -- data fetched sorted, then re-sorted in component

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/tickets/sla/page.tsx` (lines 17-19, 46-49)

```typescript
// Fetched with orderBy
orderBy: [{ priority: "asc" }],

// Then re-sorted in component
const sorted = [...policies].sort(
  (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
);
```

The data is fetched with an `orderBy` (alphabetical on priority string), then re-sorted by a custom priority order. The database sort is wasted work. Should either remove the DB sort or use the DB-provided order directly.

---

## 5. Client Components

### 5.1 TicketKanbanBoard (`src/components/tickets/TicketKanbanBoard.tsx`)

### [INFO] T-COMP-01: Proper client component pattern

Correctly marked with `"use client"` and uses only client-safe imports. The `formatTicketNumber` import comes from `format-ticket-number.ts` (not `ticket-number.ts`), avoiding server-only `prisma` imports.

### [MINOR] T-COMP-02: No drag-and-drop support for Kanban board

The Kanban board is read-only. Cards cannot be dragged between columns to change ticket stages. This is a significant UX gap for a Kanban workflow. (Flagged as MINOR since it is a feature gap, not a bug.)

### 5.2 TicketDetailClient (`src/components/tickets/TicketDetailClient.tsx`)

### [INFO] T-COMP-03: Clean client component for comment submission

Good separation of concerns. The client component handles only the comment form interaction, while all data display is in the server component. Uses `router.refresh()` to refetch server data after comment submission.

---

## 6. AppSidebar (`src/components/dashboard/AppSidebar.tsx`)

### [INFO] T-SIDE-01: Tickets navigation properly integrated

The sidebar includes `{ name: "Tickets", href: "/tickets", icon: Ticket }` and the `isActive` check uses `pathname.startsWith(item.href + "/")` which correctly highlights the sidebar for sub-pages like `/tickets/123` and `/tickets/new`.

---

## 7. Seed File (`prisma/seed.ts`)

### [MAJOR] T-SEED-01: Hardcoded database credentials

**File:** `/Users/chong/hubspot-demo/prisma/seed.ts` (line 7)

```typescript
const pool = new pg.Pool({
  connectionString: "postgresql://postgres:123456@localhost:5432/hubspot_clone?schema=public",
});
```

Database credentials (`postgres:123456`) are hardcoded in the seed file. This is a security concern if this file is committed to a public repository. Should use environment variables (`process.env.DATABASE_URL`).

### [MINOR] T-SEED-02: Hardcoded IDs may conflict in non-clean databases

**File:** `/Users/chong/hubspot-demo/prisma/seed.ts` (lines 179-211)

IDs like `"ticket-pipeline-default"`, `"ticket-stage-1"`, etc. are hardcoded. While `upsert` handles re-runs safely, these could conflict with auto-generated UUIDs if the database is partially seeded.

### [MINOR] T-SEED-03: Ticket counter hardcoded to 6

**File:** `/Users/chong/hubspot-demo/prisma/seed.ts` (lines 239-246)

```typescript
await prisma.ticketCounter.upsert({
  where: { tenantId: tenant.id },
  update: { lastNumber: 6 },
  create: { tenantId: tenant.id, lastNumber: 6 },
});
```

The counter is hardcoded to 6 (matching the 6 seed tickets). If the seed is re-run after production tickets have been created, the `update` branch would reset the counter to 6, potentially causing duplicate ticket numbers.

---

## 8. Cross-Cutting Concerns

### [MAJOR] T-CROSS-01: No rate limiting on any API endpoints

None of the ticketing API routes implement rate limiting. The SLA API, pipeline PATCH, and ticket creation endpoints could be abused with rapid requests.

### [MINOR] T-CROSS-02: Inconsistent error response format

Some endpoints return `{ error: "message" }`, others return `{ error: "message", details: ... }`. A standardized error response format should be used across all endpoints.

### [INFO] T-CROSS-03: No pagination on comments or activities

The ticket detail API loads all comments (no limit) and takes only 20 activities. For tickets with hundreds of comments, this could cause performance issues. Consider paginating both.

---

## Summary of Findings by File

| File | CRITICAL | MAJOR | MINOR | INFO |
|------|----------|-------|-------|------|
| `prisma/schema.prisma` | 0 | 1 | 1 | 2 |
| `src/lib/tenant.ts` | 1 | 0 | 0 | 0 |
| `src/lib/ticket-number.ts` | 0 | 0 | 0 | 1 |
| `src/lib/format-ticket-number.ts` | 0 | 0 | 0 | 0 |
| `src/lib/validations/ticket.ts` | 0 | 0 | 3 | 0 |
| `src/app/api/tickets/route.ts` | 1 | 2 | 0 | 0 |
| `src/app/api/tickets/[id]/route.ts` | 1 | 1 | 1 | 0 |
| `src/app/api/tickets/[id]/comments/route.ts` | 0 | 0 | 0 | 2 |
| `src/app/api/tickets/pipelines/route.ts` | 0 | 0 | 0 | 0 |
| `src/app/api/tickets/pipelines/[id]/route.ts` | 0 | 2 | 1 | 0 |
| `src/app/api/tickets/sla/route.ts` | 0 | 1 | 0 | 0 |
| `src/app/(dashboard)/tickets/page.tsx` | 0 | 0 | 3 | 1 |
| `src/app/(dashboard)/tickets/[id]/page.tsx` | 0 | 0 | 1 | 1 |
| `src/app/(dashboard)/tickets/new/page.tsx` | 0 | 1 | 1 | 0 |
| `src/app/(dashboard)/tickets/pipelines/page.tsx` | 0 | 0 | 0 | 1 |
| `src/app/(dashboard)/tickets/sla/page.tsx` | 0 | 0 | 1 | 0 |
| `src/components/tickets/TicketKanbanBoard.tsx` | 0 | 0 | 1 | 1 |
| `src/components/tickets/TicketDetailClient.tsx` | 0 | 0 | 0 | 1 |
| `src/components/dashboard/AppSidebar.tsx` | 0 | 0 | 0 | 1 |
| `prisma/seed.ts` | 0 | 1 | 2 | 0 |

---

## Priority Action Items

### Must Fix Before Production (CRITICAL)

1. **T-LIB-02** -- Replace module-level tenant cache with per-request context
2. **T-API-04** -- Add cross-tenant validation for all foreign key references on ticket creation
3. **T-API-05** -- Add cross-tenant validation for stage updates

### Should Fix (MAJOR)

1. **T-API-01** -- Whitelist `sortBy` and validate `sortOrder` parameters
2. **T-API-02** -- Add bounds checking on `page` and `limit` parameters
3. **T-API-06** -- Validate referenced entities belong to tenant on ticket update
4. **T-API-10** -- Verify stage belongs to pipeline on pipeline update
5. **T-API-11** -- Use `$transaction()` for batch stage updates
6. **T-API-13** -- Handle soft-deleted SLA policies in create flow
7. **T-FE-07** -- Add error handling and user feedback on form submission
8. **T-SEED-01** -- Move database credentials to environment variables
9. **T-SCH-05** -- Add retry logic to ticket number generation

### Nice to Have (MINOR + INFO)

- Add max length to tag and description validations
- Improve time validation regex for SLA business hours
- Add human-readable names to activity log entries
- Add drag-and-drop to Kanban board
- Standardize error response format
- Add pagination to comments

---

*Report generated by automated code review. All findings should be validated by a human reviewer before action.*
