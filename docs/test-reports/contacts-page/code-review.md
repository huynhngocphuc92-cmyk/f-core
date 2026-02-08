# Contacts Page - Code Review Report

**Reviewer:** Claude Opus 4 (Senior Code Reviewer)
**Date:** 2026-02-08
**Sprint:** Sprint 1 - Core CRM
**Status:** PASS WITH FINDINGS (16 findings: 3 Critical, 5 Major, 5 Minor, 3 Info)

---

## Files Reviewed

| # | File | Lines | Type |
|---|------|-------|------|
| 1 | `src/app/api/contacts/route.ts` | 124 | API Route |
| 2 | `src/app/api/contacts/[id]/route.ts` | 161 | API Route |
| 3 | `src/app/api/contacts/[id]/associations/route.ts` | 195 | API Route |
| 4 | `src/components/contacts/ContactsTable.tsx` | 690 | Client Component |
| 5 | `src/components/contacts/ContactForm.tsx` | 533 | Client Component |
| 6 | `src/app/(dashboard)/contacts/page.tsx` | 5 | Server Component (Page) |

**Comparison Baseline:** `CompaniesTable.tsx`, `CompanyForm.tsx`, Companies API routes

---

## EXECUTIVE SUMMARY

The Contacts Page feature is well-implemented and follows consistent patterns established by the Companies feature. The codebase demonstrates good separation of concerns, proper soft-delete patterns, and a clean UI architecture. However, there are several findings that require attention before production readiness, primarily around input validation, security hardening, and minor consistency gaps.

---

## SECTION 1: SECURITY

### 1.1 tenantId Hardcoded on Server Side

**Status: PASS (with caveat)**

All API routes hardcode `tenantId` server-side. It is never accepted from request body/params.

| File | Line | Pattern |
|------|------|---------|
| `route.ts` (list) | 16 | `const tenantId = "84d5dd22-..."` |
| `route.ts` (create) | 75 | `const tenantId = "84d5dd22-..."` |
| `[id]/route.ts` GET | 12 | `const tenantId = "84d5dd22-..."` |
| `[id]/route.ts` PATCH | 75 | `const tenantId = "84d5dd22-..."` |
| `[id]/route.ts` DELETE | 134 | `const tenantId = "84d5dd22-..."` |
| `associations/route.ts` GET | 12 | `const tenantId = "84d5dd22-..."` |
| `associations/route.ts` POST | 74 | `const tenantId = "84d5dd22-..."` |
| `associations/route.ts` DELETE | 159 | `const tenantId = "84d5dd22-..."` |

**Note:** All marked with `// TODO: Get tenantId from authenticated user session`. This is acceptable for Sprint 1 but must be resolved before auth integration (Sprint 2).

### 1.2 IDOR Prevention

**Status: PASS**

All database queries include `tenantId` in the WHERE clause, preventing cross-tenant data access.

- GET single: `findUnique({ where: { id, tenantId, deletedAt: null } })` -- correct
- PATCH: Existence check uses `tenantId` before update -- correct
- DELETE: Existence check uses `tenantId` before soft delete -- correct
- Associations GET: Validates contact ownership by `tenantId` before querying associations -- correct
- Associations POST: Validates both contact AND target company belong to same tenant -- correct

### 1.3 SQL Injection

**Status: PASS**

All database access uses Prisma ORM with parameterized queries. No raw SQL is used anywhere.

### 1.4 XSS Prevention

**Status: PASS**

No use of `dangerouslySetInnerHTML` anywhere in the codebase. All user data is rendered through React's built-in escaping.

### 1.5 Existence Checks Before Mutation

**Status: PASS**

| Operation | Existence Check | File:Line |
|-----------|----------------|-----------|
| PATCH contact | `findUnique` before `update` | `[id]/route.ts:77-86` |
| DELETE contact | `findUnique` before `update` | `[id]/route.ts:136-145` |
| POST association | `findUnique` for contact AND company | `associations/route.ts:76-99` |
| DELETE association | `findUnique` for contact | `associations/route.ts:168-178` |

---

### FINDING SEC-01 [CRITICAL]: No Input Validation (Zod/Joi) on API Routes

**File:** `src/app/api/contacts/route.ts` (POST), `src/app/api/contacts/[id]/route.ts` (PATCH)

Per CLAUDE.md rule: *"Inputs must be validated using Zod/Joi."*

Currently, the POST route only checks:
```typescript
// Line 67-72
if (!body.email && !body.firstName) {
  return NextResponse.json(
    { error: "Email or first name is required" },
    { status: 400 }
  );
}
```

**Missing validations:**
- No email format validation on the server (only client-side in ContactForm.tsx:128)
- No string length limits (firstName, lastName, email, phone could be arbitrarily long)
- No type validation (body.ownerId could be a non-UUID string)
- No sanitization of phone numbers
- PATCH route has zero validation; any body field is blindly spread into the update

**Comparison:** The Companies `POST` route has slightly better validation (`typeof body.name !== "string"` check), but still lacks Zod schema validation.

**Recommendation:** Add a Zod schema for both POST and PATCH request bodies. Example:
```typescript
const CreateContactSchema = z.object({
  email: z.string().email().max(255).optional(),
  firstName: z.string().max(100).optional(),
  // ...
}).refine(data => data.email || data.firstName, {
  message: "Email or first name is required"
});
```

---

### FINDING SEC-02 [MAJOR]: Associations DELETE Does Not Verify Association Exists

**File:** `src/app/api/contacts/[id]/associations/route.ts`, Lines 180-184

```typescript
await prisma.contactCompany.delete({
  where: {
    contactId_companyId: { contactId: id, companyId },
  },
});
```

If the association does not exist, Prisma will throw a `PrismaClientKnownRequestError` (P2025), which would be caught by the generic catch block and return a 500 error. This should be a 404.

**Recommendation:** Add an existence check or use `deleteMany` and check the count:
```typescript
const deleted = await prisma.contactCompany.deleteMany({
  where: { contactId: id, companyId },
});
if (deleted.count === 0) {
  return NextResponse.json({ error: "Association not found" }, { status: 404 });
}
```

---

### FINDING SEC-03 [MINOR]: CSV Export Vulnerable to Formula Injection

**File:** `src/components/contacts/ContactsTable.tsx`, Lines 212-235

The CSV export concatenates user-controlled fields directly:
```typescript
const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
```

If a contact's name or email starts with `=`, `+`, `-`, or `@`, a spreadsheet application could interpret it as a formula (CSV injection / formula injection).

**Recommendation:** Prefix cell values with a single quote or escape them:
```typescript
const escapeCSV = (val: string) => {
  if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
  if (val.includes(',') || val.includes('"')) return `"${val.replace(/"/g, '""')}"`;
  return val;
};
```

---

## SECTION 2: TYPESCRIPT

### 2.1 Type Definitions

**Status: PASS**

All types are properly defined:
- `Contact` type at `ContactsTable.tsx:23-37` -- well-structured with nullable fields
- `SortField` and `SortOrder` union types at lines 39-40
- `CompanyOption` type at `ContactForm.tsx:27-31`
- `ContactFormProps` interface at `ContactForm.tsx:33-37`

### 2.2 No `any` Usage

**Status: PASS**

No `any` type found in any of the reviewed files. The only dynamic typing is `Record<string, unknown>` in `ContactForm.tsx:137`, which is acceptable.

### 2.3 Proper Null Handling

**Status: PASS**

Nullable fields from the database are correctly typed as `string | null` and handled with null coalescing (`||`) or optional chaining (`?.`) throughout.

### 2.4 `as const` for Prisma Mode

**Status: PASS**

```typescript
// route.ts:23-26
{ firstName: { contains: search, mode: "insensitive" as const } },
{ lastName: { contains: search, mode: "insensitive" as const } },
{ email: { contains: search, mode: "insensitive" as const } },
{ phone: { contains: search, mode: "insensitive" as const } },
```

Correctly uses `as const` to satisfy Prisma's strict typing for query modes. Consistent with Companies API route.

---

### FINDING TS-01 [MINOR]: `handleChange` Uses Loose `string` for Field Parameter

**File:** `src/components/contacts/ContactForm.tsx`, Line 116

```typescript
const handleChange = (field: string, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};
```

The `field` parameter accepts any string, losing type safety. If a typo is introduced (e.g., `"fistName"`), TypeScript will not catch it.

**Recommendation:** Use `keyof typeof formData`:
```typescript
const handleChange = (field: keyof typeof formData, value: string) => { ... };
```

**Note:** Same issue exists in `CompanyForm.tsx:87` -- this is a codebase-wide pattern to address.

---

### FINDING TS-02 [MINOR]: Client-Side Sort Has a Type Narrowing Gap

**File:** `src/components/contacts/ContactsTable.tsx`, Lines 116-131

```typescript
sortedContacts = [...sortedContacts].sort((a: Contact, b: Contact) => {
  let aVal: string | null = a[sortField];
  let bVal: string | null = b[sortField];
```

The type assertion `string | null` is technically incorrect for `createdAt` which is typed as `string` (not nullable) in the `Contact` type. While harmless at runtime, it shows a loose type correspondence between `SortField` and the actual `Contact` properties.

---

## SECTION 3: REACT / NEXT.JS PATTERNS

### 3.1 "use client" Directive

**Status: PASS**

| File | Has "use client" | Required? |
|------|------------------|-----------|
| `ContactsTable.tsx` | Yes (line 1) | Yes (uses hooks) |
| `ContactForm.tsx` | Yes (line 1) | Yes (uses hooks) |
| `contacts/page.tsx` | No | No (Server Component, correct) |

### 3.2 `use(params)` / Async Params (Next.js 15+)

**Status: PASS**

All dynamic route handlers correctly use `Promise<{ id: string }>` and `await params`:

```typescript
// [id]/route.ts:7
{ params }: { params: Promise<{ id: string }> }
// Line 10
const { id } = await params;
```

Consistent across all three API files that use dynamic params.

### 3.3 useCallback for Fetch Functions

**Status: PASS**

`fetchContacts` is wrapped in `useCallback` with proper dependency array:
```typescript
// ContactsTable.tsx:95-142
const fetchContacts = useCallback(async () => { ... },
  [page, limit, searchQuery, selectedLifecycleStage, selectedLeadStatus, sortField, sortOrder]
);
```

### 3.4 useEffect with Proper Dependencies

**Status: PASS**

```typescript
// ContactsTable.tsx:144-146 -- Data fetching
useEffect(() => { fetchContacts(); }, [fetchContacts]);

// ContactsTable.tsx:149-155 -- Click outside to close menu
useEffect(() => { ... }, [openMenuId]);

// ContactForm.tsx:67-92 -- Company search debounce
useEffect(() => { ... }, [companySearch]);
```

All dependency arrays are correct.

### 3.5 Memory Leak Prevention

**Status: PASS**

- The click-outside handler in `ContactsTable.tsx:149-155` properly cleans up the event listener via the return function.
- The company search debounce in `ContactForm.tsx:73-91` properly clears the timeout via the return function.

---

### FINDING REACT-01 [MAJOR]: Search Input Lacks Debounce

**File:** `src/components/contacts/ContactsTable.tsx`, Lines 367-370

```typescript
onChange={(e) => {
  setSearchQuery(e.target.value);
  setPage(1);
}}
```

Every keystroke in the search input triggers `setSearchQuery`, which updates the `fetchContacts` dependency, which triggers `useEffect`, which fires an API request. This causes an API call for every character typed.

**Contrast with:** `ContactForm.tsx:73-91` correctly implements a 300ms debounce for company search.

**Recommendation:** Add a debounce pattern similar to the one used in ContactForm:
```typescript
const [debouncedSearch, setDebouncedSearch] = useState("");
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
  return () => clearTimeout(timer);
}, [searchQuery]);
```
Then use `debouncedSearch` in the `fetchContacts` dependency array.

**Note:** Same issue exists in `CompaniesTable.tsx:332-335` -- codebase-wide pattern to fix.

---

### FINDING REACT-02 [MAJOR]: ContactForm Submit Button Outside `<form>` Element

**File:** `src/components/contacts/ContactForm.tsx`, Lines 509-528

The `<form>` element closes at line 509, but the submit button is in the footer at line 520-527:
```tsx
</form>                          {/* Line 509 */}

{/* Footer */}                   {/* Line 511 */}
<div className="px-6 py-4 ...">
  <button type="submit"          {/* Line 521 */}
    onClick={handleSubmit}        {/* Line 522 - workaround */}
```

The submit button has `type="submit"` but is not inside the `<form>`. The `onClick={handleSubmit}` is a workaround that bypasses the form's native validation and submission flow. While it works, it means pressing Enter in a form field won't trigger submission.

**Note:** This same issue exists in `CompanyForm.tsx:424-443` -- codebase-wide pattern.

**Recommendation:** Either:
1. Move the footer inside the `<form>` element, OR
2. Use `form` attribute on the button: `<button type="submit" form="contact-form">` and add `id="contact-form"` to the form element.

---

### FINDING REACT-03 [MAJOR]: Duplicate LIFECYCLE_STAGES and LEAD_STATUSES Constants

**File:** `ContactsTable.tsx:42-61` and `ContactForm.tsx:6-25`

These constants are defined independently in both files with slight differences:

| Constant | ContactsTable.tsx | ContactForm.tsx |
|----------|------------------|-----------------|
| `LIFECYCLE_STAGES` | Has `color` field | No `color` field |
| `LEAD_STATUSES` | Has `color` field, "Attempted" label | No `color` field, "Attempted to Contact" label |

**Risk:** If a new lifecycle stage is added, it must be updated in two places, creating a maintenance burden and inconsistency risk.

**Recommendation:** Extract shared constants to a single source of truth:
```
src/lib/constants/crm.ts  (or src/constants/contacts.ts)
```

---

## SECTION 4: CONSISTENCY WITH COMPANIES

### 4.1 Slide-in Panel Pattern

**Status: PASS**

| Aspect | CompanyForm | ContactForm | Match? |
|--------|-------------|-------------|--------|
| Width | `max-w-[512px]` | `max-w-[512px]` | Yes |
| Overlay | `bg-black/30 z-40` | `bg-black/30 z-40` | Yes |
| Panel z-index | `z-50` | `z-50` | Yes |
| Header structure | icon + title + close | icon + title + close | Yes |
| Footer structure | Cancel + Submit | Cancel + Submit | Yes |
| Layout | `flex flex-col` | `flex flex-col` | Yes |

### 4.2 Table Structure

**Status: PASS (with minor difference)**

| Aspect | CompaniesTable | ContactsTable | Match? |
|--------|---------------|---------------|--------|
| Checkbox column | Yes | Yes | Yes |
| Sortable headers | Yes (4 fields) | Yes (4 fields) | Yes |
| Action menu | hover-based group | click-based toggle | DIFF |
| Pagination | prev/next + text | prev/next + text | Yes |
| Empty state | Icon + CTA | Icon + CTA | Yes |
| Loading state | Text only | Text only | Yes |
| Error state | Text + Retry | Text + Retry | Yes |

### 4.3 Filter Pattern

**Status: PASS**

Both use the same pattern: toggle button with active count badge, expandable filter panel with selects, clear all link.

### 4.4 Response Format

**Status: PASS**

All API routes consistently use `{ data: ... }` wrapper for success responses and `{ error: "..." }` for error responses.

---

### FINDING CONSISTENCY-01 [MINOR]: Action Menu Implementation Differs

**File:** `ContactsTable.tsx:612-638` vs `CompaniesTable.tsx:585-603`

| Feature | CompaniesTable | ContactsTable |
|---------|---------------|---------------|
| Trigger | CSS hover (`:group-hover`) | Click (state-based toggle) |
| State | No state needed | `openMenuId` state + useEffect for outside click |
| Complexity | Simpler | More complex but more accessible |

The ContactsTable approach (click-based) is actually **better** for accessibility and mobile, but it creates an inconsistency. The CompaniesTable should eventually be updated to match.

---

### FINDING CONSISTENCY-02 [INFO]: ContactsTable Avatar Uses Circle, CompaniesTable Uses Rounded Square

**File:** `ContactsTable.tsx:565` vs `CompaniesTable.tsx:530`

```tsx
// ContactsTable - circle avatar with initials
<div className="w-8 h-8 rounded-full bg-primary ...">

// CompaniesTable - rounded square with icon
<div className="w-8 h-8 rounded-lg bg-primary/10 ...">
```

This is actually a **correct** design distinction (contacts = people = circles, companies = buildings = squares), following standard CRM conventions.

---

## SECTION 5: CODE QUALITY

### 5.1 Console Usage

**Status: PASS**

Only `console.error` is used, exclusively in catch blocks of API routes. No `console.log` found.

### 5.2 Error Handling

**Status: PASS**

All API routes have try/catch with proper error responses. All client-side fetches handle errors gracefully with user-facing messages.

### 5.3 Dead Code

**Status: PASS**

No dead code, unused imports, or commented-out code found in any of the reviewed files.

---

### FINDING CQ-01 [CRITICAL]: Bulk Delete Has No Rate Limiting / Batch Size Cap

**File:** `src/components/contacts/ContactsTable.tsx`, Lines 196-210

```typescript
const handleBulkDelete = async () => {
  await Promise.all(
    Array.from(selectedIds).map((id) =>
      fetch(`/api/contacts/${id}`, { method: "DELETE" })
    )
  );
};
```

If a user selects all 50 contacts on a page and clicks delete, this fires 50 simultaneous HTTP requests. With large datasets, this could:
- Overwhelm the server
- Hit connection limits
- Cause partial failures with no rollback

**Recommendation:** Either:
1. Implement a batch delete API endpoint (`DELETE /api/contacts` with body `{ ids: [...] }`)
2. Rate-limit client-side requests (e.g., batch of 5 at a time using `p-limit`)

**Note:** Same issue exists in `CompaniesTable.tsx:173-187`.

---

### FINDING CQ-02 [CRITICAL]: Delete Response Not Checked

**File:** `src/components/contacts/ContactsTable.tsx`, Lines 188-194

```typescript
const handleDelete = async (id: string, name: string) => {
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    fetchContacts();  // Always refetches, even if delete failed
  } catch {
    alert("Failed to delete contact");
  }
};
```

The `fetch` call only throws on network errors, not on HTTP error responses (4xx, 5xx). If the server returns a 404 or 500, the code will silently proceed to `fetchContacts()` without alerting the user.

**Recommendation:**
```typescript
const response = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
if (!response.ok) throw new Error("Delete failed");
fetchContacts();
```

**Note:** Same issue exists in `CompaniesTable.tsx:189-198` and in `handleBulkDelete`.

---

### FINDING CQ-03 [INFO]: URL.createObjectURL Memory Leak in Export

**File:** `src/components/contacts/ContactsTable.tsx`, Lines 229-235

```typescript
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `contacts-${new Date().toISOString()}.csv`;
a.click();
// Missing: URL.revokeObjectURL(url);
```

The created object URL is never revoked, causing a minor memory leak. While unlikely to cause issues in practice, it is a best-practice violation.

**Recommendation:** Add `URL.revokeObjectURL(url)` after the click:
```typescript
a.click();
URL.revokeObjectURL(url);
```

---

### FINDING CQ-04 [INFO]: Associations API POST Does Not Support Deal Associations

**File:** `src/app/api/contacts/[id]/associations/route.ts`, Lines 88-138

The POST handler only supports `type === "company"`. If `type === "deal"` is sent, the request falls through to the generic 400 error at line 136. While the GET handler (line 26-53) correctly returns both companies AND deals, the POST handler only allows company creation.

This may be intentional for Sprint 1 scope, but should be documented as a known limitation.

---

### FINDING CQ-05 [MAJOR]: `page` and `limit` Query Parameters Not Validated

**File:** `src/app/api/contacts/route.ts`, Lines 8-9

```typescript
const page = parseInt(searchParams.get("page") || "1");
const limit = parseInt(searchParams.get("limit") || "50");
```

- `parseInt("abc")` returns `NaN`, which would cause `skip` to be `NaN` and `take` to be `NaN`
- `parseInt("-1")` returns `-1`, causing negative offset
- `parseInt("99999")` could pull an enormous dataset
- No upper bound on `limit`

**Recommendation:**
```typescript
const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50") || 50));
```

**Note:** Same issue exists in Companies `route.ts`.

---

## SECTION 6: MISSING FILES

### 6.1 Contact Detail Page

**File:** `src/app/(dashboard)/contacts/[id]/page.tsx` -- **DOES NOT EXIST**

The ContactsTable links to `/contacts/${contact.id}` (lines 562, 625), but no corresponding page component exists at `src/app/(dashboard)/contacts/[id]/page.tsx`.

Clicking on a contact name or selecting "View details" from the action menu will result in a 404 page.

**Impact:** Feature is incomplete. The contact detail page is a critical part of the CRM workflow.

**Note:** This was listed as one of the files to review, suggesting it was planned but not yet implemented.

---

## SUMMARY OF FINDINGS

| ID | Severity | Category | File(s) | Summary |
|----|----------|----------|---------|---------|
| SEC-01 | CRITICAL | Security | API routes | No Zod/Joi input validation on POST/PATCH |
| SEC-02 | MAJOR | Security | associations/route.ts | DELETE does not verify association existence (returns 500 instead of 404) |
| SEC-03 | MINOR | Security | ContactsTable.tsx | CSV export vulnerable to formula injection |
| TS-01 | MINOR | TypeScript | ContactForm.tsx | `handleChange` field param is loose `string` |
| TS-02 | MINOR | TypeScript | ContactsTable.tsx | Sort type narrowing gap |
| REACT-01 | MAJOR | React | ContactsTable.tsx | Search input lacks debounce (API call per keystroke) |
| REACT-02 | MAJOR | React | ContactForm.tsx | Submit button outside `<form>` element |
| REACT-03 | MAJOR | React | Both | Duplicate LIFECYCLE_STAGES/LEAD_STATUSES constants |
| CONSISTENCY-01 | MINOR | Consistency | ContactsTable.tsx | Action menu uses click vs CompaniesTable hover |
| CONSISTENCY-02 | INFO | Consistency | ContactsTable.tsx | Avatar shape differs (correct by design) |
| CQ-01 | CRITICAL | Code Quality | ContactsTable.tsx | Bulk delete fires N simultaneous requests |
| CQ-02 | CRITICAL | Code Quality | ContactsTable.tsx | Delete response not checked (fetch doesn't throw on 4xx/5xx) |
| CQ-03 | INFO | Code Quality | ContactsTable.tsx | ObjectURL not revoked in export |
| CQ-04 | INFO | Code Quality | associations/route.ts | POST only supports company, not deal associations |
| CQ-05 | MAJOR | Code Quality | route.ts | page/limit query params not validated (NaN, negative, unbounded) |
| MISSING-01 | -- | Missing | contacts/[id]/page.tsx | Contact detail page does not exist (404 on click) |

---

## VERDICT

### What Was Done Well

1. **Consistent architecture** -- All patterns follow the established CompaniesTable/CompanyForm precedent
2. **Proper soft delete** -- `deletedAt: null` filter in all queries, `deletedAt: new Date()` for deletes
3. **Tenant isolation** -- `tenantId` consistently applied in all database queries
4. **Clean TypeScript** -- No `any`, proper null handling, typed state and props
5. **Good UX patterns** -- Proper loading/error/empty states, bulk actions, filter panel
6. **Associations API** -- Well-designed with proper duplicate detection and primary flag logic
7. **Company search in form** -- Nice debounced autocomplete with proper blur/focus handling
8. **Next.js 15+ compliance** -- Correct `Promise<{ id: string }>` params pattern
9. **Click-outside menu** -- ContactsTable improves on CompaniesTable's hover pattern

### What Needs Improvement

1. **Input validation** -- Add Zod schemas to all API POST/PATCH routes (SEC-01)
2. **Response checking** -- Check `response.ok` after fetch calls for delete operations (CQ-02)
3. **Search debounce** -- Add debounce to search input to avoid per-keystroke API calls (REACT-01)
4. **Constants deduplication** -- Extract shared constants to single file (REACT-03)
5. **Contact detail page** -- Implement the `/contacts/[id]` page (MISSING-01)

### Recommended Priority for Fixes

1. **P0 (Before merge):** CQ-02 (response checking), CQ-05 (param validation)
2. **P1 (Sprint 1):** SEC-01 (Zod validation), REACT-01 (debounce), MISSING-01 (detail page)
3. **P2 (Sprint 2):** CQ-01 (batch delete), REACT-02 (form structure), REACT-03 (constants)
4. **P3 (Backlog):** SEC-02, SEC-03, TS-01, CQ-03, CQ-04

---

*Review completed by Claude Opus 4 on 2026-02-08.*
