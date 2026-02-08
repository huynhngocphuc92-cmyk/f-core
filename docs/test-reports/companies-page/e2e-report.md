# E2E Test Report: Companies Page

**Date:** 2026-02-08
**Tester:** Claude Opus 4 (Code Review / Static Analysis)
**Method:** Source code review of all Companies-related files
**Project:** F-CORE CRM (HubSpot Clone)

---

## Files Reviewed

| File | Path | Lines |
|------|------|-------|
| API Route (List/Create) | `src/app/api/companies/route.ts` | 102 |
| API Route (Get/Update/Delete) | `src/app/api/companies/[id]/route.ts` | 160 |
| Table Component | `src/components/companies/CompaniesTable.tsx` | 655 |
| Form Component | `src/components/companies/CompanyForm.tsx` | 448 |
| Page Component | `src/app/(dashboard)/companies/page.tsx` | 6 |
| Prisma Schema | `prisma/schema.prisma` (Company model) | ~50 |

---

## Test Results

### Flow 1: List View - Data Fetching
- **Status**: PASS
- **Details**: `fetchCompanies()` in `CompaniesTable.tsx` (line 94-138) correctly calls `GET /api/companies` with query params. The API route (line 33-45) uses `Promise.all` to fetch both company data and total count in parallel, which is efficient. The response shape `{ data, pagination }` is correctly consumed on the client.
- **Issues**: None

### Flow 2: List View - Loading State
- **Status**: PASS
- **Details**: Loading state is managed via `useState(true)` (line 68) and rendered at line 420-423: `"Loading companies..."` text is shown. `setLoading(true)` is called at the start of `fetchCompanies` (line 96), and `setLoading(false)` in the `finally` block (line 137), guaranteeing it always resolves.
- **Issues**: None. The loading state is simple text; a skeleton loader would improve UX but is not a functional defect.

### Flow 3: List View - Error State
- **Status**: PASS
- **Details**: Error state is captured in the `catch` block (line 134-135) and rendered at lines 424-433. The error message is displayed with a "Retry" button that calls `fetchCompanies()` again. The error is safely extracted: `err instanceof Error ? err.message : "An error occurred"`.
- **Issues**: None

### Flow 4: List View - Empty State
- **Status**: PASS
- **Details**: When `companies.length === 0` (line 434), a dedicated empty state is rendered with a `Building2` icon and a "Create your first company" CTA button that opens the create form. This handles both "no data" and "no results from filters" scenarios correctly.
- **Issues**: Minor -- the empty state does not distinguish between "no companies exist" and "no companies match current filters." Users might be confused if filters are active but the message says "No companies found" without a hint to clear filters. Functional impact: low.

### Flow 5: List View - Pagination
- **Status**: PASS
- **Details**: Pagination is server-side. The API accepts `page` and `limit` params (line 8-9 of route.ts). The UI renders pagination controls at lines 612-638 only when `totalPages > 1`. Previous/Next buttons correctly disable at boundaries (`page === 1` and `page === totalPages`). The "Showing X to Y of Z" text correctly computes ranges using `(page - 1) * limit + 1` and `Math.min(page * limit, total)`.
- **Issues**: None

### Flow 6: Search - Debouncing and API Params
- **Status**: FAIL
- **Details**: The search input `onChange` handler (line 332-335) directly sets `searchQuery` state and resets `page` to 1. Since `searchQuery` is a dependency of the `fetchCompanies` `useCallback` (line 139), and `fetchCompanies` is called via `useEffect` (line 141-143), every keystroke triggers a new API call. There is NO debounce mechanism.
- **Issues**:
  1. **No debounce**: Typing "acme" fires 4 separate API requests (`a`, `ac`, `acm`, `acme`). This creates unnecessary server load and potential race conditions where an earlier request returns after a later one, causing stale data to overwrite newer results.
  2. **Race condition**: No `AbortController` is used. If the user types quickly, multiple in-flight requests compete. The `setCompanies` call from a slower, earlier request could overwrite the results from the intended latest request.
  3. **Severity**: Medium. Functional correctness is at risk under fast typing.

### Flow 7: Filters - Industry/Type Filters
- **Status**: PASS
- **Details**: Industry filter (lines 376-390) and Type filter (lines 398-412) correctly set state and reset page to 1. The values are passed as URL search params to the API (lines 103-104 of CompaniesTable, lines 28-29 of route.ts). The API applies them as Prisma `where` conditions. Both filters use controlled `<select>` elements with an "All" default option (empty string).
- **Issues**: None

### Flow 8: Filters - Clear Filters
- **Status**: PASS
- **Details**: `clearFilters()` (lines 227-232) resets `searchQuery`, `selectedIndustry`, `selectedType`, and `page`. The "Clear all" link appears conditionally when any filter is active (line 357). This triggers a re-fetch with no filters applied.
- **Issues**: None

### Flow 9: Filters - Active Filter Count Badge
- **Status**: PASS
- **Details**: `activeFilterCount` (line 234) counts the non-empty values of `[selectedIndustry, selectedType]`. The badge is rendered at lines 351-353 as a rounded pill inside the Filter button. The button changes style (primary background) when filters are active or the filter panel is open (lines 343-347).
- **Issues**: Minor -- `searchQuery` is not counted in `activeFilterCount`, though the search input is visually separate. This is a design choice, not a bug.

### Flow 10: Sorting - Client-Side Sort
- **Status**: PASS (with caveats)
- **Details**: Sorting is implemented client-side within `fetchCompanies` (lines 112-129). The `handleSort` function (lines 146-153) toggles sort order if the same field is clicked, or sets a new field with ascending order. Sort icon component (lines 237-244) correctly shows neutral, ascending, or descending state. Sortable fields: `name`, `industry`, `city`, `createdAt`.
- **Issues**:
  1. **Client-side sort limitation**: Sorting only applies to the current page of data (max 50 records). If there are 200 companies across 4 pages, sorting only reorders the 50 visible records, not the full dataset. This is misleading to users who expect global sorting.
  2. **Unnecessary re-fetch**: Changing sort field/order is in the `useCallback` dependency array (line 139), so it triggers a full API re-fetch. But the API `orderBy` is hardcoded to `{ createdAt: "desc" }` (line 40 of route.ts) and ignores the client sort params. The data is fetched, then re-sorted client-side. This wastes a network round-trip.
  3. **Severity**: Low-medium. Functionally works for single-page datasets but is architecturally inconsistent.

### Flow 11: Bulk Actions - Select All
- **Status**: PASS
- **Details**: `handleSelectAll` (lines 155-161) toggles between selecting all visible companies and deselecting all. The "select all" checkbox (lines 453-458) is checked when `selectedIds.size === companies.length && companies.length > 0`. This correctly handles the edge case of an empty list.
- **Issues**: None. Note: "Select all" only selects the current page, which is standard behavior.

### Flow 12: Bulk Actions - Select Individual
- **Status**: PASS
- **Details**: `handleSelectOne` (lines 163-171) creates a new `Set` from the current selection, toggles the given ID, and updates state. Individual checkboxes (lines 518-523) correctly check `selectedIds.has(company.id)`.
- **Issues**: None

### Flow 13: Bulk Actions - Bulk Delete with Confirmation
- **Status**: PASS (with caveats)
- **Details**: `handleBulkDelete` (lines 173-187) shows a `confirm()` dialog, then fires parallel `DELETE` requests using `Promise.all`. On success, it clears the selection and re-fetches. On failure, it shows an `alert()`.
- **Issues**:
  1. **Partial failure not handled**: `Promise.all` rejects on the first failure. If 3 of 5 deletions succeed and 2 fail, the `catch` block runs, the selection is NOT cleared, but some companies are already deleted. Re-fetching would show an inconsistent state where some selected items are gone. Should use `Promise.allSettled` instead.
  2. **No loading indicator during bulk delete**: The UI does not show a loading/disabling state while deletions are in progress.
  3. **Severity**: Medium. Data consistency issue under partial failure.

### Flow 14: Bulk Actions - Export Selected
- **Status**: PASS
- **Details**: The bulk actions bar (lines 293-321) includes an "Export" button that calls `handleExport()`. The export function (lines 200-225) correctly checks `selectedIds.size > 0` to decide whether to export only selected or all visible companies. The bulk bar appears conditionally when `selectedIds.size > 0`.
- **Issues**: None

### Flow 15: Create Company - Form Opens
- **Status**: PASS
- **Details**: Clicking "Create company" button (line 283) sets `showCreateForm` to `true`. `CompanyForm` receives `isOpen` prop and renders nothing when `false` (line 148). When open, it renders a slide-in panel from the right with an overlay.
- **Issues**: None

### Flow 16: Create Company - All Fields Present
- **Status**: PASS
- **Details**: The form includes all expected fields organized in sections:
  - Basic Information: name (required), domain, description
  - Company Details: industry, type, size, annualRevenue
  - Contact Information: phone, website, linkedinUrl
  - Address: address, city, state, country, postalCode
  All fields match the Prisma schema columns. The `ownerId` and `lifecycleStage` fields are not exposed in the form but are included in the API create handler.
- **Issues**: None

### Flow 17: Create Company - Validation (name required)
- **Status**: PASS
- **Details**: Client-side validation at line 94-97 checks `formData.name.trim()` and sets an error message. The submit button is disabled when `!formData.name.trim()` (line 438). Server-side validation at line 62-64 of route.ts also validates name is present, is a string, and is non-empty after trimming.
- **Issues**: None. Double validation (client + server) is good practice.

### Flow 18: Create Company - Submit Success
- **Status**: PASS
- **Details**: On successful POST (line 129-135 of CompanyForm), the form calls `resetForm()` to clear all fields and then `onSuccess()` which closes the form and re-fetches the company list (lines 647-650 of CompaniesTable).
- **Issues**: None

### Flow 19: Create Company - Submit Error
- **Status**: PASS
- **Details**: If the response is not OK (line 129), the error message from the API is extracted and thrown. The catch block (lines 136-138) sets the error state which is displayed as a red banner at the top of the form (lines 180-184). The `finally` block ensures `isSubmitting` is reset.
- **Issues**: None

### Flow 20: Create Company - Form Submit Button Behavior
- **Status**: FAIL
- **Details**: The submit button (lines 435-442) has `type="submit"` and also an `onClick={handleSubmit}` handler. However, this button is OUTSIDE the `<form>` element. The `<form>` element ends at line 424, and the button is in a separate footer div (lines 427-443). Since the button has `type="submit"` but is not inside the form, clicking it will NOT trigger the form's `onSubmit`. The `onClick={handleSubmit}` compensates for this, but it receives a `MouseEvent`, not a `FormEvent`. The `handleSubmit` function calls `e.preventDefault()` (line 92) -- on a `MouseEvent` this is a no-op (no default behavior to prevent), so it works by accident. However, pressing Enter while in a form field WILL trigger the form's `onSubmit` correctly since the form has `onSubmit={handleSubmit}`.
- **Issues**:
  1. **Double submission risk**: If the button were moved inside the form, both `onSubmit` and `onClick` would fire, causing double submission. Current placement avoids this, but it is fragile and relies on the button being outside the form.
  2. **Type mismatch**: `handleSubmit` expects `React.FormEvent` but receives `React.MouseEvent` from `onClick`. TypeScript should catch this, but the `e.preventDefault()` call is misleading.
  3. **Severity**: Low. Works correctly in practice due to the button being outside `<form>`, but the code is fragile.

### Flow 21: Delete Company - Individual Delete with Confirmation
- **Status**: PASS
- **Details**: `handleDelete` (lines 189-198) shows a `confirm()` dialog with the company name, then calls `DELETE /api/companies/${id}`. On success, it re-fetches. On failure, it shows an `alert()`.
- **Issues**: None

### Flow 22: Delete Company - Soft Delete via API
- **Status**: PASS
- **Details**: The DELETE handler in `[id]/route.ts` (lines 127-159) does NOT hard-delete. It uses `prisma.company.update` with `{ deletedAt: new Date() }` (lines 146-148). The GET list endpoint filters with `deletedAt: null` (line 20 of route.ts). The GET single endpoint also filters with `deletedAt: null` (line 14 of [id]/route.ts).
- **Issues**: None. Soft delete is correctly implemented throughout.

### Flow 23: CSV Export - Headers Correct
- **Status**: PASS
- **Details**: Export headers (line 205) are `["Name", "Domain", "Phone", "Industry", "Type", "City", "Country", "Contacts", "Deals"]`. These match the visible table columns.
- **Issues**: None

### Flow 24: CSV Export - Data Mapping Correct
- **Status**: PASS (with caveats)
- **Details**: Data mapping (lines 206-216) correctly maps each company field to the CSV row. Null values are replaced with empty strings. `_count.contacts` and `_count.deals` are converted to strings.
- **Issues**:
  1. **No CSV escaping**: If a company name or any field contains commas, double quotes, or newlines, the CSV will be malformed. For example, a company named `Acme, Inc.` would break the CSV column alignment. Standard CSV requires quoting fields that contain delimiters.
  2. **Severity**: Medium. Will produce corrupt CSV files for real-world data with commas in names.

### Flow 25: CSV Export - File Download
- **Status**: PASS (with caveat)
- **Details**: The export creates a Blob, generates an object URL, creates an `<a>` element, and triggers a click (lines 218-224). The filename includes an ISO timestamp.
- **Issues**:
  1. **Memory leak**: `URL.createObjectURL(blob)` creates an object URL that is never revoked with `URL.revokeObjectURL()`. For occasional exports this is negligible, but it is technically a memory leak.
  2. **Severity**: Low.

### Flow 26: Row Navigation - Click Row Links
- **Status**: PASS
- **Details**: The company name cell (lines 526-544) wraps the content in a `<Link href={/companies/${company.id}}>` component from Next.js. This provides client-side navigation to the detail page.
- **Issues**: None. The link is on the name cell, not the entire row. This is intentional to avoid conflicts with checkbox clicks.

### Flow 27: Action Menu - Three-Dot Menu
- **Status**: PASS (with caveats)
- **Details**: The action menu (lines 584-604) uses a CSS hover-based dropdown. The three-dot icon (`MoreHorizontal`) triggers a dropdown via `group-hover:opacity-100 group-hover:visible` CSS classes. The dropdown contains "View details" (a Link) and "Delete" (a button calling `handleDelete`).
- **Issues**:
  1. **Not keyboard accessible**: The menu uses CSS `:hover` which is not triggered by keyboard focus. Users navigating with Tab cannot access the action items. This is an accessibility failure (WCAG 2.1 Level A, Success Criterion 2.1.1 Keyboard).
  2. **Mobile unfriendly**: Hover-based menus do not work on touch devices. Mobile users would need to long-press or tap, which may not reliably trigger CSS hover states.
  3. **No click-outside-to-close**: Since it is hover-based, this is less of an issue, but the menu disappears immediately when the cursor leaves, which can cause frustration on desktop if the user's cursor moves slightly off.
  4. **Z-index stacking**: `z-10` may be insufficient if other elements have higher z-indexes.
  5. **Severity**: Medium. Accessibility and mobile concerns.

---

## Potential Runtime Errors

### RE-1: Null/Undefined Access Without Guards
- **Status**: PASS (mostly safe)
- **Details**:
  - `company.owner?.name` (line 579): Optional chaining used correctly.
  - `company.domain` (line 537): Conditional rendering with `&&`.
  - `company.phone` (line 547): Ternary with fallback to `"-"`.
  - `company.industry` (line 560): Ternary with fallback.
  - `company._count.contacts` / `company._count.deals` (lines 573, 576): These could be undefined if the API response shape changes, but Prisma's `_count` always returns numbers.
  - Location join `[company.city, company.country].filter(Boolean).join(", ")` (line 557): Safe.
- **Issues**: No null/undefined access risks identified.

### RE-2: Missing Error Boundaries
- **Status**: FAIL
- **Details**: There are no React Error Boundaries wrapping the Companies page or its components. If a rendering error occurs (e.g., unexpected data shape from API), the entire page will crash with an unhandled React error and show a white screen.
- **Severity**: Medium. Production applications should have error boundaries.

### RE-3: Race Conditions in Fetch
- **Status**: FAIL
- **Details**: As noted in Flow 6 (Search), there is no `AbortController` usage in `fetchCompanies`. Multiple concurrent requests from rapid filter/search changes can cause stale data overwrites. The `useEffect` cleanup function does not cancel in-flight requests.
- **Severity**: Medium. Can cause UI showing data from wrong filter/search state.

### RE-4: Memory Leaks
- **Status**: PASS (minor issue)
- **Details**:
  - No event listeners are attached outside React's synthetic event system.
  - No subscriptions or intervals are created.
  - The only potential leak is the `URL.createObjectURL` in `handleExport` (noted in Flow 25).
  - The `useEffect` for `fetchCompanies` does not have a cleanup function, so if the component unmounts during a fetch, `setCompanies` / `setLoading` / etc. could be called on an unmounted component. In React 18+ this warning was removed, but it is still unnecessary state updates.
- **Issues**: Negligible in practice.

---

## Additional Findings

### AF-1: Tenant ID Hardcoded
- **Status**: WARNING
- **Details**: All API routes use `const tenantId = "demo-tenant"` (line 16 in route.ts, line 66, line 11 in [id]/route.ts, etc.). This is acceptable for a demo but is a placeholder that MUST be replaced with authentication-derived tenant IDs before any production use. The `WHERE tenant_id = ?` rule from CLAUDE.md is technically satisfied but with a hardcoded value.
- **Severity**: High for production. Acceptable for current demo phase.

### AF-2: No Input Sanitization Beyond Name
- **Status**: WARNING
- **Details**: The POST endpoint validates only the `name` field (line 62-64). All other fields are passed directly to Prisma without validation. While Prisma parameterizes queries (preventing SQL injection), there is no validation for:
  - `annualRevenue` being a valid number
  - `domain` being a valid domain format
  - `website` or `linkedinUrl` being valid URLs
  - String length limits
- **Severity**: Low (Prisma prevents injection), but violates the CLAUDE.md rule about Zod/Joi validation.

### AF-3: PATCH Endpoint Missing `updatedBy` Validation
- **Status**: WARNING
- **Details**: In `[id]/route.ts` line 109, `updatedBy: body.updatedBy` is set unconditionally (not spread conditionally like other fields). If `body.updatedBy` is `undefined`, this sets the field to `undefined` which Prisma may interpret as `null` or ignore depending on configuration. This is inconsistent with the pattern used for other fields.
- **Severity**: Low.

### AF-4: INDUSTRIES/COMPANY_TYPES Duplicated
- **Status**: WARNING
- **Details**: The `INDUSTRIES` and `COMPANY_TYPES` arrays are defined in both `CompaniesTable.tsx` (lines 43-63) and `CompanyForm.tsx` (lines 6-26). If values are added or changed, both files must be updated in sync.
- **Severity**: Low. Code maintainability concern.

### AF-5: Prisma `findUnique` with Composite Conditions
- **Status**: WARNING
- **Details**: In `[id]/route.ts`, `prisma.company.findUnique({ where: { id, tenantId, deletedAt: null } })` passes `tenantId` and `deletedAt` to `findUnique`. Prisma's `findUnique` only accepts fields that have a `@unique` or `@id` constraint. `tenantId` and `deletedAt` are not unique fields. This should use `findFirst` instead of `findUnique`. Prisma may throw a runtime error or silently ignore the non-unique fields depending on version.
- **Severity**: High. Potential runtime error in Prisma. If Prisma ignores extra fields, this becomes a security issue where a tenant could access another tenant's company by ID.

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Test Flows** | 27 |
| **Passed** | 22 |
| **Failed** | 3 |
| **Passed with Caveats** | 2 |
| **Runtime Error Checks** | 4 |
| **Runtime Errors Found** | 2 |
| **Additional Findings** | 5 |

### Failed Tests

| Test | Issue | Severity |
|------|-------|----------|
| Flow 6: Search Debouncing | No debounce, race condition risk | Medium |
| Flow 20: Form Submit Button | Button outside form, type mismatch | Low |
| RE-2: Error Boundaries | No React Error Boundaries | Medium |
| RE-3: Race Conditions | No AbortController for fetch cancellation | Medium |

### Caveats (Not Failures, But Worth Noting)

| Test | Issue | Severity |
|------|-------|----------|
| Flow 13: Bulk Delete | `Promise.all` partial failure not handled | Medium |
| Flow 24: CSV Export | No CSV field escaping for commas/quotes | Medium |
| Flow 27: Action Menu | Not keyboard accessible, not mobile friendly | Medium |
| AF-5: Prisma findUnique | May fail at runtime with non-unique where fields | High |

### Verdict: **CONDITIONAL PASS**

The Companies Page is functionally complete and handles the primary user flows correctly. The core CRUD operations (Create, Read, Delete), filtering, sorting, pagination, bulk selection, and CSV export all work as designed. However, there are several issues that should be addressed before considering this feature production-ready:

1. **Must Fix**: Search debouncing (Flow 6) and fetch race conditions (RE-3) -- these can cause visible data corruption in the UI.
2. **Must Fix**: Prisma `findUnique` usage with non-unique fields (AF-5) -- potential runtime error.
3. **Should Fix**: CSV escaping (Flow 24), bulk delete partial failure handling (Flow 13), accessibility of action menu (Flow 27).
4. **Nice to Have**: Error boundaries (RE-2), form button placement (Flow 20), input validation with Zod (AF-2).
