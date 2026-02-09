# Form Builder - Code Review Report

## Review Date: 2026-02-09
## Reviewer: AI Code Reviewer (Senior)

---

## Files Reviewed

### Backend (API Routes)
1. `/Users/chong/hubspot-demo/src/lib/validations/form.ts` - Zod validation schemas
2. `/Users/chong/hubspot-demo/src/app/api/forms/route.ts` - GET (list) + POST (create)
3. `/Users/chong/hubspot-demo/src/app/api/forms/[id]/route.ts` - GET + PATCH + DELETE
4. `/Users/chong/hubspot-demo/src/app/api/forms/[id]/publish/route.ts` - POST
5. `/Users/chong/hubspot-demo/src/app/api/forms/[id]/fields/route.ts` - PUT batch
6. `/Users/chong/hubspot-demo/src/app/api/forms/[id]/submissions/route.ts` - GET + POST
7. `/Users/chong/hubspot-demo/src/app/api/forms/[id]/duplicate/route.ts` - POST

### Frontend (Pages)
8. `/Users/chong/hubspot-demo/src/app/(dashboard)/forms/page.tsx` - Forms list
9. `/Users/chong/hubspot-demo/src/app/(dashboard)/forms/new/page.tsx` - Create form
10. `/Users/chong/hubspot-demo/src/app/(dashboard)/forms/[id]/edit/page.tsx` - Form builder editor
11. `/Users/chong/hubspot-demo/src/app/(dashboard)/forms/[id]/page.tsx` - Form detail
12. `/Users/chong/hubspot-demo/src/app/(dashboard)/forms/[id]/submissions/page.tsx` - Submissions list
13. `/Users/chong/hubspot-demo/src/app/f/[formId]/page.tsx` - Public form

### Database
14. `/Users/chong/hubspot-demo/prisma/schema.prisma` - Form/FormField/FormSubmission models
15. `/Users/chong/hubspot-demo/prisma/seed.ts` - Seed data for forms

---

## Findings

### Critical Issues (Must Fix)

#### C-1: Tenant ID Bypass via Request Body (SECURITY)
**Files:** `src/app/api/forms/route.ts` (line 118), `src/app/api/forms/[id]/route.ts` (line 63), `src/app/api/forms/[id]/fields/route.ts` (line 17)
**Description:** The POST (create form), PATCH (update form), and PUT (batch fields) endpoints accept `tenantId` from the request body: `const tenantId = body.tenantId || "demo-tenant"`. This means any client can submit a different `tenantId` and potentially create/modify resources under another tenant's scope.
**Impact:** Multi-tenancy violation. An attacker could create forms or update fields under any tenant by simply including `tenantId` in the request body.
**Recommendation:** The `tenantId` must always come from the authenticated session or a server-side constant -- never from the client request body. Replace all instances of `body.tenantId || "demo-tenant"` with a server-resolved tenant identifier (e.g., from JWT/session).

#### C-2: ReDoS Vulnerability via User-Supplied Regex Pattern (SECURITY)
**File:** `src/app/api/forms/[id]/submissions/route.ts` (line 212)
**Description:** In the public submission endpoint, when processing custom validation rules, the code executes `new RegExp(String(rules.pattern)).test(value)`. The `rules.pattern` comes from `field.validationRules`, which is set by the form creator. If a malicious form creator sets a catastrophic regex pattern (e.g., `(a+)+$`), it can cause the server to hang (ReDoS attack).
**Impact:** Denial of service on the server. A single crafted submission could freeze the API handler.
**Recommendation:** Either: (1) sanitize/validate regex patterns when they are saved, (2) execute regex matching with a timeout wrapper, or (3) use a safe regex library (e.g., `safe-regex` or `re2`).

#### C-3: Form Builder Publish Uses PATCH Instead of /publish Endpoint (LOGIC BUG)
**File:** `src/app/(dashboard)/forms/[id]/edit/page.tsx` (lines 421-426)
**Description:** The `handlePublish` function sends a `PATCH` to `/api/forms/${formId}` with `{ status: "published" }`. However, the PATCH handler at line 89 of `/api/forms/[id]/route.ts` explicitly blocks status changes to "published" with the message: "Use the /publish endpoint to publish a form". This means the Publish button in the form builder will always fail for draft forms.
**Impact:** Users cannot publish forms from the builder UI. The publish functionality is broken.
**Recommendation:** Change the `handlePublish` function to call `POST /api/forms/${formId}/publish` instead of patching the status.

---

### Major Issues (Should Fix)

#### M-1: Forms List Page Ignores Paginated API Response Structure
**File:** `src/app/(dashboard)/forms/page.tsx` (lines 56-59)
**Description:** The `fetchForms` function calls `fetch("/api/forms")` and then does `setForms(data)`, but the API returns `{ data: forms, pagination: { ... } }`. The code should be `setForms(data.data)`. Currently, the page is setting `forms` to the entire response object (which includes `data` and `pagination`), which will cause the list to render incorrectly or show no forms.
**Impact:** The forms list page may not render any forms, or will throw runtime errors because `forms.filter()` would fail on a non-array.
**Recommendation:** Change line 59 to `setForms(data.data || [])`.

#### M-2: Submissions Page Reads Wrong Response Shape
**File:** `src/app/(dashboard)/forms/[id]/submissions/page.tsx` (lines 70-78)
**Description:** The submissions API returns `{ data: submissions, pagination: { page, limit, total, totalPages } }`. The frontend code checks for `subsData.submissions` (line 77) which does not exist in the API response. It should be `subsData.data`. The `totalPages` is at `subsData.pagination.totalPages`, not `subsData.totalPages`.
**Impact:** Submissions will never render correctly, and pagination will not work.
**Recommendation:** Fix to `setSubmissions(subsData.data || [])` and `setTotalPages(subsData.pagination?.totalPages || 1)`.

#### M-3: Form Detail Page Same Submissions Shape Mismatch
**File:** `src/app/(dashboard)/forms/[id]/page.tsx` (line 80)
**Description:** Same issue as M-2. The detail page reads `subsData.submissions` instead of `subsData.data` from the API response.
**Impact:** Recent submissions on the form detail page will not display.
**Recommendation:** Change to `setSubmissions(subsData.data || [])`.

#### M-4: No Rate Limiting on Public Submission Endpoint
**File:** `src/app/api/forms/[id]/submissions/route.ts` (lines 105-108)
**Description:** The submission POST endpoint is public (no authentication required) and only logs the client IP without enforcing any rate limit. A comment on line 105 says "simple implementation - log but don't enforce".
**Impact:** An attacker can flood the database with spam submissions, causing storage exhaustion and potentially degrading performance.
**Recommendation:** Implement at minimum an in-memory rate limiter (e.g., `Map<string, { count, timestamp }>`) or use a library like `rate-limiter-flexible`. Consider adding CAPTCHA or honeypot validation.

#### M-5: Hard Delete of FormFields in Batch Update
**File:** `src/app/api/forms/[id]/fields/route.ts` (lines 45-47)
**Description:** The batch field update uses `deleteMany` to hard-delete all existing fields before recreating them. While FormField entities may not require soft delete (they are child entities), the project's CLAUDE.md explicitly mandates: "Use Soft Delete (deleted_at) for all CRM entities". Additionally, the FormField model in `schema.prisma` does not have a `deletedAt` column, so implementing soft delete would require a migration.
**Impact:** Violates project coding standards. Field history is permanently lost on each save.
**Recommendation:** Either add `deletedAt` to FormField and implement soft delete, or document this as an intentional exception for child entities that are always replaced in batch.

#### M-6: XSS Risk in Public Form Field Rendering
**File:** `src/app/f/[formId]/page.tsx` (lines 304-312)
**Description:** The form heading and paragraph field types render `field.label` directly into the DOM: `<h3>{field.label}</h3>` and `<p>{field.label}</p>`. While React escapes content by default in JSX expressions, if this pattern is ever changed to use `dangerouslySetInnerHTML` for rich text support, it would become an XSS vector. Additionally, submission data is rendered raw in the submissions page.
**Impact:** Low risk currently due to React's built-in escaping, but the architecture does not enforce sanitization at the data layer.
**Recommendation:** Add server-side sanitization (e.g., DOMPurify or similar) for any user-generated text content stored in the database, especially for `field.label`, `field.helpText`, and submission data values.

#### M-7: Public Form Fetches Full Form Data Without Tenant Scoping
**File:** `src/app/f/[formId]/page.tsx` (line 60)
**Description:** The public form page fetches from `/api/forms/${formId}`, which hits the GET handler that requires `tenantId = "demo-tenant"`. This works for the demo, but in a real multi-tenant system, the public form endpoint should not rely on a hardcoded tenant. The API response also includes internal fields like `tenantId`, `settings`, and `_count` that should not be exposed to anonymous users.
**Impact:** Information leakage. Internal data structure exposed to public users.
**Recommendation:** Create a dedicated public API endpoint (e.g., `/api/public/forms/[id]`) that only returns fields needed for rendering (name, description, fields) without internal metadata.

#### M-8: `file` Field Type Declared But Not Implemented
**File:** `src/lib/validations/form.ts` (line 18), `src/app/(dashboard)/forms/[id]/edit/page.tsx`
**Description:** The Zod schema includes `"file"` as a valid field type, but there is no file upload handling anywhere in the codebase -- neither in the form builder UI (FIELD_TYPES array), the public form renderer, nor the submission endpoint.
**Impact:** A user could potentially create a field with type "file" via the API, but it would not render or function in any UI. This is a dead code path that could cause confusion.
**Recommendation:** Either implement file upload support or remove `"file"` from the `fieldTypeEnum` and add a comment noting it as a future enhancement.

---

### Minor Issues (Nice to Fix)

#### m-1: Duplicate Type Definitions Across Frontend Files
**Files:** All frontend pages define their own `Form`, `FormField`, `Submission` interfaces independently.
**Description:** The `Form` interface is defined separately in `page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`, `[id]/submissions/page.tsx`, and `f/[formId]/page.tsx`. These definitions are slightly inconsistent (some include `submissionCount`, others don't; `status` is typed differently in each).
**Recommendation:** Create a shared types file (e.g., `src/types/form.ts`) and import from there. This prevents type drift and reduces maintenance burden.

#### m-2: `multi_select` Field Type Missing from Builder UI
**File:** `src/app/(dashboard)/forms/[id]/edit/page.tsx`
**Description:** The `FIELD_TYPES` array in the builder (line 77-97) does not include `multi_select`, even though it is defined in the Zod schema. Users cannot add multi-select fields through the UI.
**Recommendation:** Add a `multi_select` entry to the FIELD_TYPES array with an appropriate icon.

#### m-3: Missing `aria-label` and Accessibility Attributes
**Files:** All frontend pages.
**Description:** Interactive elements like the action menu button, toggle switches, move up/down buttons, and modal overlays lack proper `aria-label`, `aria-expanded`, `aria-haspopup`, and `role` attributes.
**Recommendation:** Add ARIA attributes for screen reader support. For example, the action menu button should have `aria-expanded={actionMenuOpen === form.id}` and `aria-label="Actions"`.

#### m-4: Client-Side Search and Filtering Instead of Server-Side
**File:** `src/app/(dashboard)/forms/page.tsx` (lines 72-78)
**Description:** The forms list page fetches all forms and then filters client-side by status and search query. The API already supports `?status=` and `?search=` query parameters.
**Recommendation:** Pass `activeTab` and `searchQuery` to the API request for server-side filtering, especially as the number of forms grows. Add debounce to the search input.

#### m-5: Form Builder Does Not Handle API `orderIndex` vs Local `order`
**File:** `src/app/(dashboard)/forms/[id]/edit/page.tsx`
**Description:** The builder uses `field.order` internally, but the API returns `field.orderIndex`. When loading from the API (line 315), the raw API data is set directly into state. The `FormField` interface uses `order` while the database uses `orderIndex`. This naming mismatch could cause fields to render in wrong order after loading.
**Recommendation:** Map `orderIndex` to `order` when loading from the API, and map `order` back to `orderIndex` when saving.

#### m-6: Seed File Contains Hardcoded Database Credentials
**File:** `prisma/seed.ts` (line 6)
**Description:** The connection string `postgresql://postgres:123456@localhost:5432/hubspot_clone?schema=public` is hardcoded with password `123456`.
**Recommendation:** Use `process.env.DATABASE_URL` instead of hardcoding credentials.

#### m-7: Unused `request` Parameter in Some Endpoints
**File:** `src/app/api/forms/[id]/duplicate/route.ts` (line 9)
**Description:** The `request: NextRequest` parameter is declared but never used.
**Recommendation:** Prefix with underscore (`_request`) or remove if not needed by the framework.

#### m-8: Delete Confirmation Modal Says "Cannot Be Undone" but Uses Soft Delete
**File:** `src/app/(dashboard)/forms/page.tsx` (lines 377-378), `src/app/(dashboard)/forms/[id]/page.tsx` (line 438-439)
**Description:** The delete confirmation text says "This action cannot be undone. All submissions will also be deleted." However, the backend uses soft delete (`deletedAt`), so the data is actually recoverable. The submissions are also not soft-deleted (they remain in the database).
**Recommendation:** Update the copy to accurately reflect the soft delete behavior, or add logic to also soft-delete related submissions.

#### m-9: No Loading/Disabled State During Duplicate Operation
**File:** `src/app/(dashboard)/forms/page.tsx` (lines 96-105)
**Description:** The `handleDuplicate` function does not set any loading state, so the user gets no feedback and could click multiple times.
**Recommendation:** Add a `duplicating` state and disable the button while the request is in progress.

#### m-10: `submitFormSchema` Is Too Permissive
**File:** `src/lib/validations/form.ts` (line 89)
**Description:** `submitFormSchema` is defined as `z.record(z.string(), z.unknown())`, which accepts any key-value pairs with no size or depth limits. A malicious user could submit extremely large JSON payloads.
**Impact:** Potential denial of service via large payloads.
**Recommendation:** Add `.max()` on the record or validate the payload size in the endpoint before parsing.

---

### Positive Observations

1. **Soft Delete Pattern Consistently Applied:** The Form model correctly uses `deletedAt` and all queries include `deletedAt: null` in the where clause. This is a solid pattern.

2. **Proper Next.js 16 Params Handling:** All API route handlers correctly use `{ params }: { params: Promise<{ id: string }> }` with `await params`, which is the correct pattern for Next.js 16's async params.

3. **Well-Structured Zod Validation:** The validation schemas in `form.ts` are well-organized with proper type exports. The separation of `createFormSchema`, `updateFormSchema`, `createFieldSchema`, and `submitFormSchema` follows good practice.

4. **Sort Column Whitelisting:** The GET `/api/forms` endpoint properly whitelists sort columns (line 20-28) to prevent injection via the `sortBy` parameter. This is a good security practice.

5. **Atomic Transactions:** Both the batch field update and form duplication endpoints use Prisma `$transaction()` to ensure data consistency. This prevents partial updates.

6. **Server-Side Validation for Public Submissions:** The submission endpoint performs thorough server-side validation including required field checks, email format validation, URL validation, and custom validation rules. This is defense-in-depth since the client also validates.

7. **Auto-Contact Creation:** The submission endpoint intelligently auto-creates or links contacts based on submitted email addresses, which mirrors HubSpot's behavior well.

8. **Consistent Design System Usage:** All frontend components consistently use the brand colors (`#0891b2` primary, `#0ea5e9` hover), consistent spacing, border radius patterns, and Tailwind utility classes.

9. **Pagination on List Endpoints:** Both the forms list and submissions list APIs implement proper pagination with `page`, `limit`, `total`, and `totalPages`.

10. **Good Component Architecture in Form Builder:** The builder page is well-organized with separated concerns: `PreviewModal`, `PreviewField`, `FieldProperties` as distinct components within the same file.

---

## Summary

| Category | Count |
|----------|-------|
| Critical | 3 issues |
| Major    | 8 issues |
| Minor    | 10 issues |

### Verdict: **FAIL**

The codebase has **3 critical issues** that must be resolved before deployment:

1. **C-1 (Tenant ID Bypass):** A fundamental multi-tenancy security vulnerability where the tenant ID is accepted from the client request body.
2. **C-2 (ReDoS):** Server-side regex execution with user-controlled patterns can cause denial of service.
3. **C-3 (Publish Button Broken):** The form builder's publish functionality calls the wrong API endpoint and will always fail for draft forms.

The major issues (M-1 through M-3) around API response shape mismatches mean several pages likely do not render data correctly at runtime. These should be considered high priority as well.

### Recommended Priority Order
1. Fix C-1 (security), C-3 (broken feature), M-1, M-2, M-3 (data display broken)
2. Fix C-2 (ReDoS), M-4 (rate limiting), M-7 (public API information leakage)
3. Fix remaining major and minor issues
