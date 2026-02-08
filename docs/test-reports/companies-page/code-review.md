# Code Review: Companies Page

> **Reviewer**: Claude Code (Automated)
> **Date**: 2026-02-08
> **Scope**: Companies feature - API routes, frontend components, page shell
> **Reference**: Contacts feature pattern (for consistency comparison)

---

## Files Reviewed

1. `/Users/chong/hubspot-demo/src/app/api/companies/route.ts` (102 lines)
2. `/Users/chong/hubspot-demo/src/app/api/companies/[id]/route.ts` (160 lines)
3. `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx` (655 lines)
4. `/Users/chong/hubspot-demo/src/components/companies/CompanyForm.tsx` (448 lines)
5. `/Users/chong/hubspot-demo/src/app/(dashboard)/companies/page.tsx` (6 lines)

### Reference Files (for pattern comparison)

6. `/Users/chong/hubspot-demo/src/components/contacts/ContactsTable.tsx` (513 lines)
7. `/Users/chong/hubspot-demo/src/app/api/contacts/[id]/route.ts` (115 lines)
8. `/Users/chong/hubspot-demo/src/app/api/contacts/route.ts` (114 lines)

---

## Issues Found

---

### [CRITICAL] Issue 1: No Input Validation / Sanitization on POST and PATCH (Missing Zod/Joi)

- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/route.ts:58-101`
- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/[id]/route.ts:66-124`
- **Description**: The POST endpoint only validates that `body.name` exists and is a non-empty string. All other fields (`domain`, `phone`, `website`, `linkedinUrl`, `annualRevenue`, `ownerId`, `properties`, etc.) are accepted directly from the request body without any validation or sanitization. The PATCH endpoint has no validation at all. Per project rules (`CLAUDE.md` Section II.2), all inputs MUST be validated using Zod/Joi. Specific risks:
  - `annualRevenue` could receive a non-numeric value causing a Prisma/database error.
  - `ownerId` could be set to any arbitrary UUID, potentially referencing a user in a different tenant (IDOR risk, see Issue 2).
  - `properties` accepts arbitrary JSON which could contain excessively large payloads.
  - `website` and `linkedinUrl` are not validated as proper URLs.
  - `email`-like fields are not format-validated.
- **Recommendation**: Implement Zod schemas for both the POST and PATCH request bodies. Validate field types, formats (URL, email, phone patterns), string length limits, and whitelist allowed fields. Example:
  ```typescript
  import { z } from "zod";
  const CreateCompanySchema = z.object({
    name: z.string().min(1).max(255).trim(),
    domain: z.string().max(255).optional(),
    annualRevenue: z.number().positive().optional(),
    website: z.string().url().optional(),
    // ...etc
  });
  ```

---

### [CRITICAL] Issue 2: IDOR Vulnerability - No Ownership / Tenant Verification on `ownerId`

- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/route.ts:86`
- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/[id]/route.ts:106`
- **Description**: Both POST and PATCH accept `ownerId` from the request body and directly assign it to the company record. There is no verification that the provided `ownerId` belongs to the same tenant. An attacker could set `ownerId` to a user in a different tenant, creating a cross-tenant data reference. This is an Insecure Direct Object Reference (IDOR) vulnerability.
- **Recommendation**: Before creating/updating, verify that the `ownerId` (if provided) belongs to a user within the same `tenantId`:
  ```typescript
  if (body.ownerId) {
    const owner = await prisma.user.findFirst({
      where: { id: body.ownerId, tenantId },
    });
    if (!owner) {
      return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
    }
  }
  ```

---

### [CRITICAL] Issue 3: Hardcoded `tenantId` - No Authentication / Authorization

- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/route.ts:16,66`
- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/[id]/route.ts:11,74,133`
- **Description**: The `tenantId` is hardcoded as `"demo-tenant"` across all API endpoints. While the contacts API has a similar issue (`body.tenantId || "demo-tenant"`), the companies API does not even accept a `tenantId` override. In a production scenario, the tenant should be derived from an authenticated session/JWT. Per project rules (`CLAUDE.md` Section II.2), every API/Query MUST have `WHERE tenant_id = ?` derived from the authenticated user -- not from the request body or hardcoded.
- **Recommendation**: Implement an auth middleware or helper function (`getSessionTenant(request)`) that extracts the tenant from the authenticated session. Apply it uniformly across all API routes.

---

### [MAJOR] Issue 4: Contacts API GET Missing `tenantId` Filter

- **File**: `/Users/chong/hubspot-demo/src/app/api/contacts/route.ts:15-25`
- **Description**: (Cross-reference finding) The Contacts `GET /api/contacts` endpoint does NOT filter by `tenantId` at all. The Companies `GET /api/companies` correctly includes `tenantId` in the `where` clause. This is an inconsistency, and the contacts endpoint has a multi-tenancy security hole. While this is not in the Companies files being reviewed, it was discovered during cross-comparison and is noted for completeness.
- **Recommendation**: Add `tenantId` filter to the contacts list API to match the companies pattern.

---

### [MAJOR] Issue 5: Contacts API `[id]` Routes Missing `tenantId` Filter

- **File**: `/Users/chong/hubspot-demo/src/app/api/contacts/[id]/route.ts:12,55,101`
- **Description**: (Cross-reference finding) The contacts `[id]` routes (GET, PATCH, DELETE) do NOT filter by `tenantId`. In contrast, the Companies `[id]` routes correctly include `tenantId` in the `findUnique` where clause. The contacts API allows any user to access/modify/delete any contact by ID across tenants. This is a multi-tenancy security hole in the contacts reference code.
- **Recommendation**: Add `tenantId` filter to contacts `[id]` routes, matching the companies pattern.

---

### [MAJOR] Issue 6: CSV Export Vulnerable to CSV Injection

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:200-225`
- **Description**: The `handleExport` function creates CSV content by joining fields with commas. However, it does not escape field values that may contain commas, double quotes, or newlines. More critically, it does not sanitize values that start with `=`, `+`, `-`, `@`, `\t`, or `\r` which can trigger formula injection when the CSV is opened in Excel or Google Sheets. If a company name is set to `=HYPERLINK("http://evil.com","click")`, it becomes a weaponized CSV.
- **Recommendation**: Implement proper CSV escaping:
  ```typescript
  const escapeCSV = (val: string) => {
    if (/[,"\n\r]/.test(val) || /^[=+\-@\t\r]/.test(val)) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  ```
  Also consider using a proper CSV library like `papaparse`.

---

### [MAJOR] Issue 7: `handleChange` Uses `string` Instead of `keyof` for Field Parameter

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompanyForm.tsx:87`
- **Description**: The `handleChange` function signature is `(field: string, value: string)`. The `field` parameter should be typed as `keyof typeof formData` (or a dedicated type) instead of a bare `string`. This loses type safety -- a typo in the field name (e.g., `handleChange("naem", "value")`) would silently fail to update the intended field without any compile-time error.
- **Recommendation**: Change the type to:
  ```typescript
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  ```

---

### [MAJOR] Issue 8: Response Format Inconsistency Between Contacts and Companies APIs

- **File**: `/Users/chong/hubspot-demo/src/app/api/contacts/route.ts:105`
- **File**: `/Users/chong/hubspot-demo/src/app/api/contacts/[id]/route.ts:36,82`
- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/route.ts:96`
- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/[id]/route.ts:56,116`
- **Description**: The Companies API consistently wraps responses in `{ data: ... }` (e.g., `{ data: company }`), which is a good pattern. However, the Contacts API returns the raw object without wrapping (e.g., `return NextResponse.json(contact)` on line 36 and 82 of contacts `[id]/route.ts`, and `return NextResponse.json(contact, { status: 201 })` on line 105 of contacts `route.ts`). The list endpoint for contacts does use `{ data: contacts, pagination: ... }`. This inconsistency will cause confusion for frontend consumers and makes building a generic API client harder.
- **Recommendation**: Standardize all single-entity responses to use the `{ data: ... }` wrapper consistently. The Companies pattern is the correct one.

---

### [MAJOR] Issue 9: `annualRevenue` Passed as Raw Value Without Decimal Type Handling

- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/route.ts:77`
- **Description**: The `annualRevenue` field is defined as `Decimal @db.Decimal(15, 2)` in the Prisma schema. The API passes `body.annualRevenue || null` directly. If the client sends a string like `"abc"` or a number with excessive precision, Prisma will throw a database error that gets caught as a generic 500. The CompanyForm frontend parses it with `parseFloat`, but there is no server-side validation of numeric type or range.
- **Recommendation**: Validate on the server that `annualRevenue` is a valid number and within the Decimal(15,2) range before passing to Prisma. Use Zod's `z.number()` or `z.string().regex()` with transformation.

---

### [MAJOR] Issue 10: Bulk Delete Sends Unbounded Parallel Requests

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:173-187`
- **Description**: The `handleBulkDelete` function uses `Promise.all` with `Array.from(selectedIds).map(...)`. If 100+ companies are selected, this fires 100+ parallel DELETE requests simultaneously. This could overwhelm the API, cause rate limiting issues, or hit browser connection limits. The same issue exists in the contacts reference code (line 155).
- **Recommendation**: Either implement a batch delete API endpoint (`DELETE /api/companies` with body `{ ids: [...] }`) or throttle the parallel requests using chunking:
  ```typescript
  const chunks = chunkArray(Array.from(selectedIds), 10);
  for (const chunk of chunks) {
    await Promise.all(chunk.map(id => fetch(`/api/companies/${id}`, { method: "DELETE" })));
  }
  ```

---

### [MINOR] Issue 11: Duplicate Constant Definitions (INDUSTRIES, COMPANY_TYPES)

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:43-63`
- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompanyForm.tsx:6-26`
- **Description**: The `INDUSTRIES` and `COMPANY_TYPES` arrays are defined identically in both `CompaniesTable.tsx` and `CompanyForm.tsx`. This violates DRY and creates a maintenance burden -- if a new industry is added to one file but not the other, the filter options and form options will diverge.
- **Recommendation**: Extract these constants to a shared module, e.g., `/src/lib/constants/companies.ts`, and import from both components.

---

### [MINOR] Issue 12: Submit Button Outside `<form>` Tag

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompanyForm.tsx:435-442`
- **Description**: The "Create company" submit button has `type="submit"` but is placed outside the `<form>` element (the form ends at line 424, the button is at line 435). As a result, the `type="submit"` does not trigger native form submission. Instead, it relies on the `onClick={handleSubmit}` handler. This means pressing Enter in a form field will not submit the form (since the button is not part of the form). The `onClick` handler also receives a `MouseEvent`, not a `FormEvent`, so the `e.preventDefault()` call on line 92 may behave unexpectedly in some scenarios.
- **Recommendation**: Either move the footer buttons inside the `<form>` element, or add a `form="company-form"` attribute to the button and give the form an `id="company-form"`.

---

### [MINOR] Issue 13: Object URL Memory Leak in CSV Export

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:220-224`
- **Description**: `URL.createObjectURL(blob)` creates an object URL, but `URL.revokeObjectURL(url)` is never called after the download completes. This creates a memory leak, especially if the user exports multiple times during a session. The same issue exists in the contacts reference code (line 180-184).
- **Recommendation**: Revoke the URL after the download triggers:
  ```typescript
  a.click();
  URL.revokeObjectURL(url);
  ```

---

### [MINOR] Issue 14: Dropdown Menu Uses CSS `group-hover` Instead of Click/Focus

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:585-603`
- **Description**: The action dropdown menu on each table row uses CSS `group-hover:opacity-100 group-hover:visible` to show/hide. This approach has several issues:
  - Not keyboard accessible (cannot be reached via Tab/Enter/Space).
  - On mobile/touch devices, hover is unreliable.
  - The menu stays open as long as the mouse hovers, which can interfere with clicking other elements.
  - No ARIA attributes (`aria-expanded`, `aria-haspopup`, `role="menu"`).
- **Recommendation**: Convert to a click-triggered dropdown using React state, with proper ARIA attributes and keyboard event handlers. Consider using a headless UI library (e.g., Radix UI `DropdownMenu`, Headless UI `Menu`).

---

### [MINOR] Issue 15: Missing `aria-label` on Icon-Only Buttons

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:586,314-317,619-625,630-634`
- **Description**: Several buttons contain only icons without text labels or `aria-label` attributes:
  - The "More" actions button (MoreHorizontal icon, line 586)
  - The close selection button (X icon, line 314-317)
  - Pagination buttons (ChevronLeft/ChevronRight, lines 619-625, 630-634)
  These are inaccessible to screen readers.
- **Recommendation**: Add `aria-label` attributes:
  ```tsx
  <button aria-label="More actions" ...>
  <button aria-label="Clear selection" ...>
  <button aria-label="Previous page" ...>
  <button aria-label="Next page" ...>
  ```

---

### [MINOR] Issue 16: `SortIcon` Component Defined Inside Render Function

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:237-244`
- **Description**: The `SortIcon` component is defined as a function inside the `CompaniesTable` component body. This means it is recreated on every render. While React handles this reasonably well for small components, it is a minor performance concern and breaks the "stable component identity" pattern. The same issue exists in the contacts reference code (line 194-201).
- **Recommendation**: Extract `SortIcon` outside the component or memoize it:
  ```typescript
  const SortIcon = React.memo(({ field, sortField, sortOrder }: SortIconProps) => { ... });
  ```

---

### [MINOR] Issue 17: Search Input Triggers API Call on Every Keystroke

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx:332-335`
- **Description**: The search input updates `searchQuery` state on every `onChange` event, which is included in the `fetchCompanies` dependency array. This means every keystroke triggers an API call. For a fast typist, this could result in dozens of unnecessary API calls. The same issue exists in the contacts reference code.
- **Recommendation**: Implement a debounce mechanism. Use a `debouncedSearchQuery` state that updates 300-500ms after the user stops typing:
  ```typescript
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  ```

---

### [MINOR] Issue 18: Contacts PATCH Does Not Verify Record Exists Before Update

- **File**: `/Users/chong/hubspot-demo/src/app/api/contacts/[id]/route.ts:47-90`
- **Description**: (Cross-reference finding) The contacts PATCH endpoint directly calls `prisma.contact.update()` without first checking if the record exists and is not soft-deleted. If the record does not exist, Prisma throws a `RecordNotFound` error which gets caught as a generic 500. In contrast, the Companies PATCH endpoint (line 76-85) correctly performs a `findUnique` check first and returns a 404. The Companies pattern is better.
- **Recommendation**: Apply the Companies PATCH pattern to the Contacts PATCH endpoint -- check existence before update.

---

### [INFO] Issue 19: Companies API Has Better Multi-Tenancy Than Contacts

- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/route.ts:18-19`
- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/[id]/route.ts:14`
- **Description**: The Companies API consistently includes `tenantId` and `deletedAt: null` in all query where clauses. The Contacts list API is missing `tenantId`, and the Contacts `[id]` routes are missing both `tenantId` and `deletedAt: null` checks. The Companies code is the better pattern and should be used as the reference for fixing the Contacts routes.
- **Recommendation**: No action needed for Companies. This is noted as positive feedback.

---

### [INFO] Issue 20: Page Component Is Minimal (Good)

- **File**: `/Users/chong/hubspot-demo/src/app/(dashboard)/companies/page.tsx`
- **Description**: The page component is a thin wrapper that simply renders `<CompaniesTable />`. This is a clean pattern that separates the route/page concern from the component logic. It matches the recommended Next.js pattern for "use client" components within server pages.
- **Recommendation**: No action needed. This is good architecture.

---

### [INFO] Issue 21: Companies DELETE Uses Soft Delete (Correct)

- **File**: `/Users/chong/hubspot-demo/src/app/api/companies/[id]/route.ts:126-159`
- **Description**: The DELETE endpoint correctly performs a soft delete by setting `deletedAt: new Date()`. This aligns with the project rule (`CLAUDE.md` Section II.1) requiring soft deletes for all CRM entities. The Contacts DELETE also uses soft delete (line 101-104), though without the existence check.
- **Recommendation**: No action needed.

---

### [INFO] Issue 22: Design System Compliance Is Consistent

- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompaniesTable.tsx`
- **File**: `/Users/chong/hubspot-demo/src/components/companies/CompanyForm.tsx`
- **Description**: Both components consistently use the design system tokens:
  - `bg-primary`, `text-primary`, `hover:bg-primary/90` for primary actions
  - `text-gray-900` for headings, `text-gray-600` for body text, `text-gray-400` for muted text
  - `border-gray-200` for borders
  - `bg-gray-50` for section backgrounds
  - `rounded-lg`, `rounded-xl` for border radius
  - `text-sm`, `text-xs` for proper font sizing
  - Proper use of `transition-colors` for interactive elements
  These match the `docs/DESIGN_SYSTEM.md` specifications.
- **Recommendation**: No action needed. Good design system adherence.

---

## Summary

| Severity | Count | Details |
|----------|-------|---------|
| **CRITICAL** | 3 | Missing input validation (#1), IDOR on ownerId (#2), Hardcoded tenantId (#3) |
| **MAJOR** | 7 | Contacts tenantId gaps (#4, #5), CSV injection (#6), Loose typing (#7), Response inconsistency (#8), Decimal handling (#9), Unbounded parallel deletes (#10) |
| **MINOR** | 8 | Duplicate constants (#11), Submit outside form (#12), Object URL leak (#13), Hover dropdown (#14), Missing aria-labels (#15), SortIcon in render (#16), No search debounce (#17), Contacts PATCH no exist-check (#18) |
| **INFO** | 4 | Better tenancy than contacts (#19), Clean page component (#20), Correct soft delete (#21), Good design system usage (#22) |

### Verdict: **FAIL**

The Companies code has **3 CRITICAL issues** that must be addressed before the feature can be considered production-ready:

1. **No Zod/Joi input validation** on API endpoints (violates project CLAUDE.md rules).
2. **IDOR vulnerability** on `ownerId` -- cross-tenant user assignment is possible.
3. **No real authentication** -- `tenantId` is hardcoded (this is a known project-wide tech debt but still CRITICAL for security review).

The code quality and patterns are generally solid and in several areas (multi-tenancy filtering, existence checks before update/delete, response wrapping) the Companies implementation is *better* than the reference Contacts implementation. After resolving the Critical issues, this code is well-structured and maintainable.

### Positive Highlights

- Clean separation of concerns (page shell vs. component logic).
- Consistent use of the F-CORE design system.
- Soft deletes properly implemented.
- Multi-tenancy filter applied in all database queries (better than Contacts reference).
- Existence checks before PATCH and DELETE operations (better than Contacts reference).
- Proper use of TypeScript generics for state typing.
- Good UX patterns: bulk actions, filters, sorting, pagination, empty states, error states.
