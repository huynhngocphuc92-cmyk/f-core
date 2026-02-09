# Form Builder - E2E Test Report

## Test Environment
- Date: 2026-02-09
- URL: http://localhost:3000
- Method: Static code analysis + API contract verification (browser/curl access unavailable in this session)
- Analyzed Files: 12 source files across API routes, pages, and validation schemas

---

## Test Results

### TC-01: Forms List Page (/forms) - Page Load
- **Status:** FAIL
- **Steps:** Verify the page loads with form cards/table by tracing the data flow from API to UI
- **Result:** The `GET /api/forms` endpoint returns `{ data: forms, pagination: { page, limit, total, totalPages } }` (file: `src/app/api/forms/route.ts`, lines 83-91). However, the Forms list page (`src/app/(dashboard)/forms/page.tsx`, lines 56-59) does:
  ```typescript
  const data = await res.json();
  setForms(data); // data is { data: [...], pagination: {...} }
  ```
  It treats the entire response object as the forms array, instead of extracting `data.data`.
- **Issues:**
  - **BUG-001 (Critical):** Response shape mismatch -- frontend expects an array, API returns `{ data, pagination }`. The table will not render any forms because the `forms` state will be an object, not an array. `forms.length` will be `undefined`, `forms.filter()` will throw.

---

### TC-02: Forms List Page - Filter Tabs
- **Status:** FAIL (blocked by BUG-001)
- **Steps:** Click on All, Published, Draft, Archived tabs
- **Result:** Filter tabs are correctly defined (`all`, `draft`, `published`, `archived`) with counts. Client-side filtering on `form.status` is correct. However, since forms data never loads correctly due to BUG-001, filtering cannot work.
- **Issues:** Blocked by BUG-001

---

### TC-03: Forms List Page - Search
- **Status:** FAIL (blocked by BUG-001)
- **Steps:** Type in the search input to filter forms by name
- **Result:** Search implementation is correct -- filters `form.name.toLowerCase().includes(searchQuery.toLowerCase())`. Blocked by BUG-001.
- **Issues:** Blocked by BUG-001

---

### TC-04: Forms List Page - "Create Form" Button
- **Status:** PASS
- **Steps:** Verify the "Create Form" button links to `/forms/new`
- **Result:** The button is a Next.js `<Link href="/forms/new">` component with proper styling. Navigates correctly.
- **Issues:** None

---

### TC-05: Forms List Page - Submission Count Display
- **Status:** FAIL
- **Steps:** Verify submission count and view count display in table columns
- **Result:** The API returns form objects with `_count: { submissions: number, fields: number }` and `viewCount` as a top-level field. The frontend table references `form.submissionCount` and `form.viewCount` (lines 263-268). The `submissionCount` field does not exist on the API response -- it is `_count.submissions`.
- **Issues:**
  - **BUG-002 (Medium):** Field name mismatch for submission count. Frontend uses `form.submissionCount` but API returns `form._count.submissions`. The submission count column will always show `undefined`.

---

### TC-06: Create Form Page (/forms/new) - Form Creation
- **Status:** PASS
- **Steps:** Navigate to /forms/new, fill in form name and description, submit
- **Result:** The page correctly:
  1. Validates name is non-empty (client-side check, line 18)
  2. POSTs to `/api/forms` with `{ name, description }`
  3. API validates with `createFormSchema` (Zod: name 1-255 chars, description optional max 2000)
  4. Creates form with auto-generated slug
  5. Returns 201 with the created form object including `id`
  6. Frontend redirects to `/forms/${form.id}/edit` (line 39)
- **Issues:** None -- this flow is solid.

---

### TC-07: Create Form - Empty Name Validation
- **Status:** PASS
- **Steps:** Submit form with empty name
- **Result:** Client-side check `!name.trim()` shows error "Form name is required". Server-side Zod validation also enforces `z.string().min(1)`. Double protection.
- **Issues:** None

---

### TC-08: Form Builder/Editor - 3-Panel Layout
- **Status:** PASS
- **Steps:** Verify the builder loads with field palette (left), canvas (center), properties (right)
- **Result:** Layout correctly implemented:
  - Left sidebar: `w-64` (256px), shows field types grouped by Common/Choice/Advanced/Layout
  - Center canvas: `flex-1`, shows fields with drag handles and action buttons
  - Right panel: `w-80` (320px), shows properties for selected field or placeholder text
  - Top toolbar: form name input, status badge, Preview/Save/Publish buttons
- **Issues:** None structurally, but see responsive test TC-19.

---

### TC-09: Form Builder - Adding Fields from Palette
- **Status:** PASS
- **Steps:** Click field types in the left palette to add them to the canvas
- **Result:** The `addField(type)` function correctly creates a new field via `createField(type, fields.length)` with auto-generated ID, label, name, and default options for dropdown/radio/checkbox. The new field is appended and auto-selected in the properties panel.
- **Issues:** None

---

### TC-10: Form Builder - Editing Field Properties
- **Status:** PASS
- **Steps:** Select a field and modify label, placeholder, required toggle in the properties panel
- **Result:** The `FieldProperties` component correctly:
  - Updates label and auto-generates name from label via `labelToName()`
  - Shows/hides placeholder based on field type (not for checkbox/radio/layout)
  - Toggle required with a custom switch component
  - Width selector with full/half/third options
  - Options editor for dropdown/radio/checkbox with add/remove capability
  - All updates propagate via `updateField(fieldId, updates)` callback
- **Issues:** None

---

### TC-11: Form Builder - Reordering Fields (Move Up/Down)
- **Status:** PASS
- **Steps:** Click move up/down buttons on fields to reorder
- **Result:** The `moveField()` function sorts fields by `order`, finds the target field index, and swaps order values with the adjacent field. Up button disabled at index 0, Down button disabled at last index.
- **Issues:** None for local state. However, see TC-13 for save issues.

---

### TC-12: Form Builder - Removing a Field
- **Status:** PASS
- **Steps:** Click delete button on a field in the canvas
- **Result:** The `deleteField()` function removes the field from the array and reindexes remaining fields' `order` values. If the deleted field was selected, selection is cleared.
- **Issues:** None

---

### TC-13: Form Builder - Save Form
- **Status:** FAIL
- **Steps:** Click Save button to persist form name and fields to the API
- **Result:** The save flow makes two requests:
  1. `PATCH /api/forms/${formId}` with `{ name: formName }` -- this works correctly.
  2. `PUT /api/forms/${formId}/fields` with `{ fields }` -- the frontend field objects use `order` as the property name (line 55 of the edit page: `order: number`), but the API field schema (`createFieldSchema` in `src/lib/validations/form.ts`) expects `orderIndex`. Since Zod strips unknown keys by default and `orderIndex` has a default of `0`, all fields will be saved with `orderIndex: 0`, destroying their ordering.
- **Issues:**
  - **BUG-003 (Critical):** Field ordering property mismatch. Frontend sends `order` but API schema expects `orderIndex`. All fields will be saved with `orderIndex: 0`, effectively randomizing field order on reload.

---

### TC-14: Form Builder - Publish Form
- **Status:** FAIL
- **Steps:** Click Publish button in the editor toolbar
- **Result:** The `handlePublish()` function (lines 413-434 of edit page) calls:
  ```typescript
  const res = await fetch(`/api/forms/${formId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "published" }),
  });
  ```
  However, the PATCH endpoint (`src/app/api/forms/[id]/route.ts`, lines 89-93) explicitly blocks this:
  ```typescript
  if (status === "published" && existing.status !== "published") {
    return NextResponse.json(
      { error: "Use the /publish endpoint to publish a form" },
      { status: 400 }
    );
  }
  ```
  The correct endpoint is `POST /api/forms/${formId}/publish`. Publishing from the editor will ALWAYS fail with a 400 error.
- **Issues:**
  - **BUG-004 (Critical):** Publish uses wrong endpoint. Editor PATCHes with `status: "published"` but API requires `POST /api/forms/[id]/publish`. User cannot publish any form from the editor.

---

### TC-15: Form Detail Page (/forms/[id]) - Stats Display
- **Status:** FAIL
- **Steps:** Navigate to a form's detail page and verify stats cards
- **Result:** The detail page shows three stats cards: Total Views (`form.viewCount`), Total Submissions (`form.submissionCount`), Conversion Rate (calculated from both). The API `GET /api/forms/[id]` returns `_count: { submissions: number }` and `viewCount` as a top-level field. The `submissionCount` field does not exist -- it's `_count.submissions`.
- **Issues:**
  - **BUG-002 (continued):** `form.submissionCount` is `undefined`. Both the submissions stat card and conversion rate will show `0` / `undefined`.

---

### TC-16: Form Detail Page - Publish/Unpublish Toggle
- **Status:** PARTIAL FAIL
- **Steps:** Click the Publish/Unpublish button on the detail page
- **Result:** The `handleTogglePublish()` function (lines 92-109) uses `PATCH /api/forms/${formId}` with `{ status: newStatus }`.
  - **Unpublish (published -> draft):** PASS -- The API allows PATCHing to `draft` from `published` since the guard only blocks transitioning TO `published`.
  - **Publish (draft -> published):** FAIL -- Same as BUG-004, the API blocks PATCH to `published` and requires `POST /publish`.
- **Issues:**
  - **BUG-004 (continued):** Publishing from detail page fails. Only unpublishing works.

---

### TC-17: Form Detail Page - Duplicate Button
- **Status:** PASS
- **Steps:** Click Duplicate button on the detail page
- **Result:** Correctly calls `POST /api/forms/${formId}/duplicate`. API creates a copy with "Copy of" prefix, new slug with timestamp, status reset to `draft`, and all fields duplicated in a transaction. Frontend redirects to the new form's edit page.
- **Issues:** None

---

### TC-18: Form Detail Page - Delete Button
- **Status:** PASS
- **Steps:** Click Delete button, confirm in modal
- **Result:** Shows confirmation modal with Cancel/Delete buttons. On confirm, calls `DELETE /api/forms/${formId}`. API performs soft delete (sets `deletedAt = new Date()`). Frontend redirects to `/forms`.
- **Issues:** None -- soft delete is correctly implemented.

---

### TC-19: Form Detail Page - Public URL Display
- **Status:** PASS
- **Steps:** Verify public URL is displayed and uses /f/ path
- **Result:** Public URL is correctly generated as `${window.location.origin}/f/${formId}`. Copy button uses `navigator.clipboard.writeText()`. "Open" link button appears only when status is `published`.
- **Issues:** None

---

### TC-20: Submissions Page (/forms/[id]/submissions) - Table Load
- **Status:** FAIL
- **Steps:** Navigate to submissions page, verify table loads
- **Result:** The API `GET /api/forms/[id]/submissions` returns `{ data: submissions, pagination: { ... } }` (file: `src/app/api/forms/[id]/submissions/route.ts`, lines 75-83). The submissions page (line 72-78) handles:
  ```typescript
  if (Array.isArray(subsData)) {
    setSubmissions(subsData);
  } else {
    setSubmissions(subsData.submissions || []);
    setTotalPages(subsData.totalPages || 1);
  }
  ```
  The response is NOT an array (it's `{ data, pagination }`), so it enters the `else` branch and tries `subsData.submissions` which is `undefined` -- it should be `subsData.data`. Falls back to `[]`.
- **Issues:**
  - **BUG-005 (Critical):** Response field name mismatch. Frontend reads `subsData.submissions` but API returns `subsData.data`. Submissions table will always appear empty.
  - **BUG-006 (Medium):** Pagination `totalPages` is read as `subsData.totalPages` but API returns `subsData.pagination.totalPages`. Pagination will not work.

---

### TC-21: Submissions Page - Expand Row Details
- **Status:** PASS (code logic correct, blocked by BUG-005)
- **Steps:** Click on a submission row to expand and see details
- **Result:** Expanding a row sets `expandedId` to the submission ID. The expanded row shows a 2-column grid of all data key-value pairs and the submission ID. ChevronDown/ChevronUp icons indicate state.
- **Issues:** Functionally correct but blocked by BUG-005 (no data ever loads).

---

### TC-22: Detail Page - Recent Submissions
- **Status:** FAIL
- **Steps:** Verify recent submissions appear on the form detail page
- **Result:** Detail page fetches `/api/forms/${formId}/submissions?limit=5` and processes:
  ```typescript
  const subsData = await subsRes.json();
  setSubmissions(Array.isArray(subsData) ? subsData : subsData.submissions || []);
  ```
  Same issue as BUG-005: `subsData.submissions` is `undefined`, should be `subsData.data`.
- **Issues:**
  - **BUG-005 (continued):** Recent submissions on detail page always empty.

---

### TC-23: Public Form (/f/[formId]) - Render
- **Status:** FAIL
- **Steps:** Navigate to /f/[formId] for a published form, verify fields render
- **Result:** The public form page fetches `GET /api/forms/${formId}` which returns fields with `orderIndex`. The page sorts fields with `sortedFields = [...form.fields].sort((a, b) => a.order - b.order)` (line 213). However, the API response field objects have `orderIndex`, not `order`. `a.order` will be `undefined`, causing sort to produce unpredictable results.

  Additionally, the field interface on the public form page defines `order: number` (line 26) but the API returns `orderIndex: number`.
- **Issues:**
  - **BUG-007 (Medium):** Field property name mismatch between API (`orderIndex`) and frontend (`order`). Fields may render in wrong order.

---

### TC-24: Public Form - Required Field Validation
- **Status:** PASS
- **Steps:** Submit with empty required fields
- **Result:** Client-side validation in `validate()` (lines 105-137) correctly:
  - Checks each required field for empty/whitespace values
  - Validates email format with regex
  - Validates URL format with `new URL()`
  - Sets `validationErrors` state which displays inline error messages with red border and AlertCircle icon
  Server-side also validates required fields and type-specific formats.
- **Issues:** None

---

### TC-25: Public Form - Successful Submission
- **Status:** PASS
- **Steps:** Fill all required fields and submit
- **Result:** The form submits to `POST /api/forms/${formId}/submissions` with `{ data: formData }`. API:
  1. Verifies form is published
  2. Validates submitted data against form field schema
  3. Checks required fields
  4. Performs type-specific validation (email, URL, number, custom rules)
  5. Auto-creates or links contact if email field present
  6. Creates submission with metadata (IP, user agent, referrer, UTM params)
  7. Returns 201 with submission object
  Frontend shows "Thank you!" page with green checkmark.
- **Issues:** None -- submission flow is solid.

---

### TC-26: Public Form - Unpublished Form
- **Status:** PASS
- **Steps:** Try to access a draft/archived form via /f/[formId]
- **Result:** The public form page checks `data.status !== "published"` after loading and shows "This form is not currently accepting responses." error. Additionally, the submission API (`POST /submissions`) checks `status: "published"` in the query and returns 404 if not published.
- **Issues:** None -- double protection works.

---

### TC-27: Responsive Design - Forms List (375px mobile)
- **Status:** FAIL
- **Steps:** Test forms list page at mobile viewport
- **Result:** The forms list uses `<table>` with 6 columns (Name, Status, Submissions, Views, Created, Actions). There is no responsive breakpoint or mobile adaptation. The table will overflow horizontally on mobile screens without any horizontal scroll wrapper.
- **Issues:**
  - **BUG-008 (Medium):** Forms list table not responsive. Needs `overflow-x-auto` wrapper or mobile card view.

---

### TC-28: Responsive Design - Form Builder (768px tablet)
- **Status:** FAIL
- **Steps:** Test form builder at tablet viewport
- **Result:** The form builder has fixed-width sidebars:
  - Left: `w-64` (256px)
  - Right: `w-80` (320px)
  - Center: `flex-1`
  At 768px viewport, the center canvas would get only `768 - 256 - 320 = 192px`, which is barely usable. There are no responsive breakpoints to collapse or hide sidebars.
- **Issues:**
  - **BUG-009 (Medium):** Form builder is not responsive. Sidebars should collapse to drawers or tabs on tablet/mobile.

---

### TC-29: API - Soft Delete Verification
- **Status:** PASS
- **Steps:** Verify DELETE endpoint uses soft delete
- **Result:** The DELETE handler (lines 132-166 of `[id]/route.ts`) correctly sets `deletedAt: new Date()` instead of hard-deleting. All GET/PATCH/DELETE operations filter by `deletedAt: null` ensuring soft-deleted forms are excluded from results.
- **Issues:** None

---

### TC-30: API - Tenant Isolation (Multi-tenancy)
- **Status:** PASS (with caveat)
- **Steps:** Verify every API query includes tenant_id filter
- **Result:** All API routes use `tenantId: "demo-tenant"` and include it in WHERE clauses:
  - `GET /api/forms`: `where: { tenantId, deletedAt: null }`
  - `GET /api/forms/[id]`: `where: { id, tenantId, deletedAt: null }`
  - `PATCH /api/forms/[id]`: Verifies ownership before update
  - `DELETE /api/forms/[id]`: Verifies ownership before soft delete
  - `POST /publish`: Verifies ownership
  - `GET /submissions`: Verifies form ownership, filters by tenantId
  - `POST /submissions`: Public endpoint, derives tenantId from form
  - `POST /duplicate`: Verifies ownership
- **Issues:** The tenantId is hardcoded to `"demo-tenant"` which is fine for demo but would need auth integration for production. All queries properly filter by tenant.

---

### TC-31: API - Input Validation (Zod)
- **Status:** PASS
- **Steps:** Verify all API endpoints validate inputs with Zod
- **Result:** All mutation endpoints use Zod schemas:
  - `POST /api/forms`: `createFormSchema` (name 1-255, description optional max 2000)
  - `PATCH /api/forms/[id]`: `updateFormSchema` (partial of create + status enum)
  - `PUT /api/forms/[id]/fields`: `updateFieldsSchema` (array of field schemas)
  - `POST /api/forms/[id]/submissions`: `submitFormSchema` (record of unknown values) + server-side field validation
  All return 400 with `validation.error.issues` on failure.
- **Issues:** None

---

### TC-32: API - Publish Guard (No Fields)
- **Status:** PASS
- **Steps:** Try to publish a form with no input fields
- **Result:** The `POST /publish` endpoint (lines 42-53) filters out layout fields (heading, paragraph, divider, spacer) and checks if at least one input field exists. Returns 400 with "Form must have at least one input field" if none found.
- **Issues:** None

---

### TC-33: API - Duplicate Form
- **Status:** PASS
- **Steps:** Verify duplicate creates a complete copy
- **Result:** The duplicate endpoint correctly:
  1. Loads original form with all fields
  2. Creates new form with "Copy of" prefix and timestamp slug
  3. Resets status to "draft"
  4. Copies all field properties including options, validation rules, conditional logic
  5. Uses database transaction for atomicity
  6. Returns 201 with new form including fields and submission count
- **Issues:** None

---

### TC-34: API - SQL Injection Prevention (Sort Field)
- **Status:** PASS
- **Steps:** Verify sortBy parameter is whitelisted
- **Result:** The GET endpoint (lines 20-28, 47-49) whitelists `sortBy` to `["createdAt", "updatedAt", "name", "status", "viewCount"]` and falls back to `"createdAt"`. Sort order is restricted to `"asc"` or `"desc"`. No SQL injection possible.
- **Issues:** None

---

## Bug Summary

| ID | Severity | Component | Description |
|------|----------|-----------|-------------|
| BUG-001 | Critical | Forms List Page | API returns `{data, pagination}` but frontend treats response as array |
| BUG-002 | Medium | Forms List + Detail | Frontend uses `submissionCount` but API returns `_count.submissions` |
| BUG-003 | Critical | Form Builder Save | Frontend sends `order` but API expects `orderIndex` -- fields lose ordering |
| BUG-004 | Critical | Editor + Detail Publish | Publish uses `PATCH {status:"published"}` but API requires `POST /publish` |
| BUG-005 | Critical | Submissions Page | Frontend reads `subsData.submissions` but API returns `subsData.data` |
| BUG-006 | Medium | Submissions Pagination | Frontend reads `subsData.totalPages` but API returns `subsData.pagination.totalPages` |
| BUG-007 | Medium | Public Form | Frontend sorts by `field.order` but API returns `field.orderIndex` |
| BUG-008 | Medium | Forms List | Table not responsive on mobile -- needs horizontal scroll or card view |
| BUG-009 | Medium | Form Builder | 3-panel layout not responsive -- sidebars don't collapse on tablet/mobile |

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 34 |
| Passed | 18 |
| Failed | 14 |
| Partial Fail | 2 |
| Pass Rate | 52.9% |
| Critical Bugs | 4 |
| Medium Bugs | 5 |
| Verdict | **FAIL** |

### Assessment

The Form Builder feature has a solid architectural foundation with well-structured API routes, proper Zod validation, multi-tenancy filtering, soft delete, and a comprehensive public form renderer. However, there are **4 critical bugs** that prevent core functionality from working:

1. **Data contract mismatches** between API responses and frontend expectations (BUG-001, BUG-005) make the forms list and submissions pages non-functional.
2. **Property naming inconsistency** between `order`/`orderIndex` (BUG-003, BUG-007) breaks field ordering on save and public form display.
3. **Wrong publish endpoint** (BUG-004) prevents forms from being published through the UI.

### Recommended Priority Fixes

1. **BUG-001 + BUG-005 + BUG-006:** Fix response parsing on forms list page and submissions page to use `.data` and `.pagination.totalPages` from API responses.
2. **BUG-003 + BUG-007:** Standardize field ordering property to `orderIndex` throughout the frontend, or rename in the API to `order`.
3. **BUG-004:** Change publish action in editor and detail page to use `POST /api/forms/[id]/publish` instead of PATCH.
4. **BUG-002:** Map `_count.submissions` to `submissionCount` in the frontend or normalize in the API response.
5. **BUG-008 + BUG-009:** Add responsive breakpoints for mobile/tablet views.

---

*Report generated via static code analysis on 2026-02-09. Testing method: API route code review, frontend component tracing, data contract verification across all 12 source files.*
