# Property System - E2E Test Report

**Date:** 2026-02-08
**Tester:** QA Automation (Code Analysis + Database Verification)
**Feature:** Property System (Custom Fields Management)
**Branch:** main

---

## Summary

| Metric        | Value           |
|---------------|-----------------|
| Total Tests   | 11              |
| Passed        | 8               |
| Failed        | 2               |
| Warning       | 1               |
| Pass Rate     | 72.7%           |

---

## Test Results

### TC-01: Settings page loads - /settings redirects to /settings/properties

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/settings/page.tsx`

**Findings:**
- The `/settings` page uses Next.js `redirect()` from `next/navigation` to perform a server-side redirect to `/settings/properties`.
- The redirect is unconditional and executes immediately on page load.
- The settings page is nested under the `(dashboard)` route group, which wraps it in the `DashboardLayout` containing the `AppSidebar`.

**Code Evidence:**
```typescript
import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/settings/properties");
}
```

**Verdict:** The redirect is correctly implemented using Next.js server-side redirect. This will issue an HTTP 307 redirect before any client-side rendering occurs.

---

### TC-02: Property list - GET /api/properties?objectType=contact returns property definitions grouped by groupName

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/app/api/properties/route.ts`

**Findings:**
- The GET handler accepts `objectType` as a required query parameter and validates it against `["contact", "company", "deal"]`.
- Returns 400 if `objectType` is missing or invalid.
- Optional `groupName` filter is supported as an additional query parameter.
- Results are ordered by `groupName ASC` then `orderIndex ASC`.
- Response includes three fields: `data` (flat array), `groups` (properties grouped by `groupName`), and `meta` (total count + objectType).
- The `tenantId` is hardcoded to `"84d5dd22-9e29-425c-8ba0-1edfc255e236"` which matches the demo tenant in the database.
- Properties with null `groupName` are assigned to the `"Other"` group in the response.

**Code Evidence:**
```typescript
const groups: Record<string, typeof properties> = {};
for (const prop of properties) {
  const group = prop.groupName || "Other";
  if (!groups[group]) groups[group] = [];
  groups[group].push(prop);
}

return NextResponse.json({
  data: properties,
  groups,
  meta: { total: properties.length, objectType },
});
```

**Verdict:** API correctly returns grouped property definitions with proper validation and sorting. The `WHERE tenantId = ?` constraint is enforced (line 25).

---

### TC-03: Tab switching - Contact/Company/Deal tabs fetch different objectType properties

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/settings/properties/page.tsx`

**Findings:**
- Three tabs are defined: Contact Properties, Company Properties, Deal Properties.
- The `objectType` state defaults to `"contact"` and changes when a tab is clicked.
- The `fetchProperties` function is wrapped in `useCallback` with `objectType` as a dependency.
- A `useEffect` triggers `fetchProperties()` whenever `fetchProperties` changes (which changes when `objectType` changes).
- When switching tabs, search and filter states are reset (`setSearch("")` and `setFilterGroup(null)`).
- Each tab calls `GET /api/properties?objectType=${objectType}` with the correct object type.

**Code Evidence:**
```typescript
const OBJECT_TABS = [
  { id: "contact", label: "Contact Properties" },
  { id: "company", label: "Company Properties" },
  { id: "deal", label: "Deal Properties" },
];

// Tab click handler resets search/filter state
onClick={() => {
  setObjectType(tab.id);
  setSearch("");
  setFilterGroup(null);
}}
```

**Verdict:** Tab switching correctly triggers re-fetch with updated objectType parameter. State reset on tab switch prevents stale filter/search results from persisting across tabs.

---

### TC-04: Create property - POST /api/properties creates new custom property with validation

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/app/api/properties/route.ts`

**Findings:**
- Validates required fields: `objectType` (must be in valid list), `name` (must be string), `label` (must be string), `fieldType` (must be in valid list of 10 types).
- For `select`/`multiselect` field types, requires non-empty `options` array.
- Normalizes `name` to snake_case: lowercase, replace non-alphanumeric with underscore, collapse multiple underscores, trim leading/trailing underscores.
- Checks for duplicate names using the unique composite index `tenantId_objectType_name`.
- Auto-calculates `orderIndex` by finding the max in the same group and incrementing by 1.
- Forces `isSystem: false` for all user-created properties (line 135).
- Returns 201 status code on success.

**Validation Matrix:**

| Field       | Validation                              | Error Code |
|-------------|----------------------------------------|------------|
| objectType  | Required, must be contact/company/deal | 400        |
| name        | Required, must be string               | 400        |
| label       | Required, must be string               | 400        |
| fieldType   | Required, must be in 10 valid types    | 400        |
| options     | Required for select/multiselect        | 400        |
| duplicate   | Unique per tenant+objectType+name      | 409        |

**Verdict:** Comprehensive validation is in place. The `isSystem: false` enforcement prevents privilege escalation through the API.

---

### TC-05: Edit property - PATCH /api/properties/[id] updates label, description, group, options

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts`

**Findings:**
- Verifies property exists and belongs to the tenant before updating.
- Returns 404 if property not found.
- Universal updatable fields (system and non-system): `label`, `description`, `groupName`, `orderIndex`, `defaultValue`.
- Non-system-only updatable fields: `isRequired`, `isReadonly`, `fieldType` (with validation against valid types).
- Options can be updated only when the field type is `select` or `multiselect`.
- Uses the `params` as a `Promise` (Next.js 15+ pattern) with `await params`.

**Update Permission Matrix:**

| Field        | System Property | Non-System Property |
|--------------|:--------------:|:-------------------:|
| label        | Yes            | Yes                 |
| description  | Yes            | Yes                 |
| groupName    | Yes            | Yes                 |
| orderIndex   | Yes            | Yes                 |
| defaultValue | Yes            | Yes                 |
| isRequired   | No             | Yes                 |
| isReadonly   | No             | Yes                 |
| fieldType    | No             | Yes                 |
| options      | Conditional    | Conditional         |

**Verdict:** Edit functionality is correctly implemented with appropriate access control differentiating system and non-system properties.

---

### TC-06: Delete property - DELETE /api/properties/[id] removes non-system properties

**Status:** FAIL

**File:** `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts`

**Findings:**
- Verifies property exists and belongs to tenant. Returns 404 if not found.
- Checks `isSystem` flag and returns 403 for system properties (see TC-07).
- **CRITICAL ISSUE:** Uses `prisma.propertyDefinition.delete()` -- this is a **hard delete**, not a soft delete.
- Per the project's `CLAUDE.md` rule: _"Use Soft Delete (`deleted_at`) for all CRM entities. Never hard delete."_
- The `PropertyDefinition` schema does NOT have a `deletedAt` column, which means the schema itself was designed without soft-delete support for this table.
- Additionally, deleting a property definition does not check whether any existing records have data stored for this property in their `properties` JSONB column. Orphan data could remain.

**Code Evidence (Hard Delete):**
```typescript
await prisma.propertyDefinition.delete({ where: { id, tenantId } });
```

**Schema Evidence (No deletedAt column):**
```prisma
model PropertyDefinition {
  id          String    @id @default(uuid())
  // ... other fields ...
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  // NOTE: No deletedAt field
}
```

**Verdict:** FAIL. The delete operation performs a hard delete, violating the project's soft-delete policy. The `PropertyDefinition` model is missing a `deletedAt` column in the Prisma schema. No orphan data cleanup is performed.

---

### TC-07: System property protection - DELETE returns 403 for system properties

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/app/api/properties/[id]/route.ts`

**Findings:**
- Before any delete operation, the handler checks `existing.isSystem`.
- If `true`, returns HTTP 403 with error message `"System properties cannot be deleted"`.
- The check occurs after the existence/tenant check (404), ensuring proper error priority.
- On the frontend (`PropertySettingsPage`), the delete button is conditionally rendered only for non-system properties (`{!prop.isSystem && (...)}`), providing a UI-level guard as well.
- System properties display a Lock icon in the property list table.

**Code Evidence:**
```typescript
if (existing.isSystem) {
  return NextResponse.json(
    { error: "System properties cannot be deleted" },
    { status: 403 }
  );
}
```

**Frontend Evidence:**
```tsx
{!prop.isSystem && (
  <button onClick={() => handleDelete(prop.id)} ...>
    <Trash2 className="w-3.5 h-3.5" />
  </button>
)}
```

**Verdict:** System property protection is correctly enforced at both API and UI levels. Defense-in-depth is properly implemented.

---

### TC-08: Search and filter - Client-side search by label/name, filter by group

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/settings/properties/page.tsx`

**Findings:**
- **Search:** Client-side filtering by both `label` and `name` fields using case-insensitive matching (`toLowerCase().includes()`).
- **Group Filter:** Dropdown select populated dynamically from the loaded properties' unique `groupName` values. Defaults to "All groups".
- Both filters work together (AND logic): a property must match both the search term and the selected group.
- The summary bar at the bottom shows contextual information: count of filtered properties, search term, and active group filter.
- Empty state messages differentiate between "no search results" and "no properties defined".

**Code Evidence:**
```typescript
const filtered = properties.filter((p) => {
  if (search) {
    const q = search.toLowerCase();
    if (!p.label.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q)) return false;
  }
  if (filterGroup && (p.groupName || "Other") !== filterGroup) return false;
  return true;
});
```

**Verdict:** Search and filter work correctly with proper AND logic, case-insensitive matching, and contextual empty states.

---

### TC-09: Sidebar navigation - Settings nav item in AppSidebar bottom nav, active state on /settings/*

**Status:** PASS (with minor observation)

**File:** `/Users/chong/hubspot-demo/src/components/dashboard/AppSidebar.tsx`

**Findings:**
- Settings is in the `bottomNavigation` array alongside Help, correctly separated from main navigation items.
- Settings links to `/settings` which redirects to `/settings/properties` (TC-01).
- Active state detection uses `pathname.startsWith(item.href + "/")`, which correctly matches both `/settings` exactly and `/settings/properties` (and any future `/settings/*` routes).
- Active styling for bottom nav: `bg-gray-800 text-white` (different from main nav's `bg-[#0891b2] text-white`).
- The sidebar uses `usePathname()` from `next/navigation` for path detection.

**Minor Observation:** The main `<main>` element in `DashboardLayout` has a fixed `ml-64`, but the sidebar supports a collapsed state (`w-16`). When collapsed, there will be a gap between the sidebar and content. This is a layout issue, not specific to the property system.

**Code Evidence:**
```typescript
const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

// Active state detection
const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
```

**Verdict:** Settings navigation item is correctly placed in the bottom nav with proper active state detection for `/settings/*` routes.

---

### TC-10: PropertyField rendering - All 10 field types render correctly in view and edit mode

**Status:** PASS

**File:** `/Users/chong/hubspot-demo/src/components/properties/PropertyField.tsx`

**Findings:**
- The component handles all 10 field types defined in `VALID_FIELD_TYPES`:

| # | Field Type   | Edit Input          | View Rendering                        |
|---|-------------|---------------------|---------------------------------------|
| 1 | text        | `<input type="text">` | Plain text span                     |
| 2 | number      | `<input type="number">` | Locale-formatted number            |
| 3 | date        | `<input type="date">` | Formatted date (e.g., "Feb 8, 2026") |
| 4 | datetime    | `<input type="datetime-local">` | Formatted datetime           |
| 5 | select      | `<select>` with options | Resolved option label              |
| 6 | multiselect | Checkbox group      | Pill/badge tags                       |
| 7 | checkbox    | `<input type="checkbox">` | "Yes" / "No" text                |
| 8 | email       | `<input type="email">` | `mailto:` link                     |
| 9 | phone       | `<input type="tel">` | `tel:` link                          |
| 10| url         | `<input type="url">` | External link (opens new tab)        |

- The component uses `memo()` for performance optimization.
- View mode shows `"--"` placeholder for null/undefined/empty values.
- Edit mode respects `isRequired` and `isReadonly` attributes on all applicable field types.
- Default fallback renders a text input for unknown field types.
- The `PropertyValue` sub-component is exported separately for standalone use.

**Verdict:** All 10 field types are fully implemented in both view and edit mode with appropriate HTML input types, formatting, and accessibility attributes.

---

### TC-11: Duplicate prevention - POST returns 409 if property name already exists

**Status:** FAIL (Partial - Logic correct, but edge case exists)

**File:** `/Users/chong/hubspot-demo/src/app/api/properties/route.ts`

**Findings:**
- The API normalizes the property name to snake_case before checking for duplicates.
- Uses `prisma.propertyDefinition.findUnique()` with the composite unique constraint `tenantId_objectType_name`.
- Returns 409 with descriptive error message: `Property "${name}" already exists for ${objectType}`.
- The database has a unique index `PropertyDefinition_tenantId_objectType_name_key` enforcing this at the DB level as well.

**Issue Found - Race Condition:**
- There is a TOCTOU (Time-of-Check-Time-of-Use) race condition. Between the `findUnique` check (line 105-108) and the `create` call (line 124-140), another concurrent request could create a property with the same name. If this happens, Prisma will throw a unique constraint violation error, which will be caught by the generic catch block and returned as a 500 error instead of the expected 409.
- This is a low-severity issue in practice (single-tenant demo environment), but is technically incorrect behavior.

**Frontend Handling:**
- The `PropertyDefinitionForm` component displays error messages from the API response in a red error box.
- On 409 responses, the error message `"Property \"xxx\" already exists for contact"` will be shown to the user.

**Code Evidence:**
```typescript
// Check for duplicate name
const existing = await prisma.propertyDefinition.findUnique({
  where: {
    tenantId_objectType_name: { tenantId, objectType: body.objectType, name },
  },
});
if (existing) {
  return NextResponse.json(
    { error: `Property "${name}" already exists for ${body.objectType}` },
    { status: 409 }
  );
}
// ... gap where race condition can occur ...
const property = await prisma.propertyDefinition.create({ ... });
```

**Database Evidence:**
```
CREATE UNIQUE INDEX "PropertyDefinition_tenantId_objectType_name_key"
  ON public."PropertyDefinition" USING btree ("tenantId", "objectType", name)
```

**Verdict:** FAIL (edge case). The 409 response works correctly for single-user scenarios, but a race condition exists that could result in a 500 error instead of 409 under concurrent requests. The duplicate unique constraint violation from Postgres is not explicitly caught and mapped to a 409 response.

---

## Database Verification

### Table Structure
- **Table:** `PropertyDefinition` exists in the `public` schema.
- **Columns:** All 16 columns match the Prisma schema (id, tenantId, objectType, name, label, description, fieldType, options, isRequired, isReadonly, isSystem, groupName, orderIndex, defaultValue, createdAt, updatedAt).
- **Indexes:**
  - `PropertyDefinition_pkey` - Primary key on `id`
  - `PropertyDefinition_tenantId_objectType_idx` - Composite index for query performance
  - `PropertyDefinition_tenantId_objectType_name_key` - Unique constraint for duplicate prevention

### Seed Data Status
- **Current row count:** 0 (seed script has NOT been run)
- **Seed script defines:** 33 property definitions (16 contact, 10 company, 7 deal)
- **All seeded properties are marked `isSystem: true`**
- **Tenant exists:** `84d5dd22-9e29-425c-8ba0-1edfc255e236` ("F-CORE Demo") is present in the Tenant table

### Missing `deletedAt` Column
- The `PropertyDefinition` model does NOT include a `deletedAt` field.
- Other CRM entities (`Contact`, `Company`, `Deal`) all have `deletedAt DateTime?` for soft-delete support.
- This is an inconsistency in the schema design.

---

## Additional Findings

### A1: Hardcoded Tenant ID (WARNING)

**Severity:** Medium

All API routes hardcode the tenant ID:
```typescript
const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
```

This bypasses proper authentication and multi-tenancy. In production, this should be extracted from the authenticated session/JWT. This is acceptable for a demo/prototype but must be addressed before any production deployment.

### A2: No Input Sanitization with Zod/Joi

**Severity:** Low

Per `CLAUDE.md` rule: _"Inputs must be validated using Zod/Joi."_ The property API routes use manual validation with `typeof` checks and array inclusion tests. While functionally correct, this does not comply with the stated validation framework requirement.

### A3: PropertyDefinitionForm State Reset Bug

**Severity:** Low

**File:** `/Users/chong/hubspot-demo/src/components/properties/PropertyDefinitionForm.tsx`

The form state is initialized with `useState` using `editData` values. However, if the same form component is reused (not unmounted/remounted) with different `editData`, the state will NOT update because `useState` only uses its initial value on mount. The `isOpen` conditional rendering (`if (!isOpen) return null;`) may cause remounting in some cases, but this is fragile and depends on React's reconciliation behavior.

### A4: No Confirmation Dialog on Delete

**Severity:** Low

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/settings/properties/page.tsx`

Clicking the delete button immediately triggers the API call without a confirmation dialog. This could lead to accidental deletions, particularly problematic given the hard-delete issue in TC-06.

### A5: Layout Responsiveness Issue

**Severity:** Low

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/layout.tsx`

The main content area has a fixed `ml-64` margin, but the sidebar toggles between `w-64` and `w-16`. When the sidebar is collapsed, there is wasted space. The `transition-all duration-300` class on the `<main>` element suggests this was intended to be dynamic but the margin value is static.

---

## Recommendations

1. **[CRITICAL] Add `deletedAt` to PropertyDefinition schema** and convert the DELETE handler to soft delete.
2. **[HIGH] Handle Prisma unique constraint errors** in the POST handler catch block to return 409 instead of 500 on race conditions.
3. **[MEDIUM] Replace hardcoded tenant ID** with session-based authentication.
4. **[MEDIUM] Add Zod validation** to all property API routes per project coding standards.
5. **[LOW] Add confirmation dialog** before property deletion.
6. **[LOW] Fix sidebar collapse layout** to use dynamic margin.
7. **[LOW] Run seed script** to populate default property definitions -- the PropertyDefinition table is currently empty.

---

## Conclusion

The Property System feature is **functionally complete** with 8 of 11 test cases passing. The core CRUD operations, tab switching, search/filter, sidebar navigation, and field type rendering all work correctly. The two failures relate to:

1. **Hard delete violation** (TC-06) -- The PropertyDefinition model lacks soft-delete support, violating the project's data integrity policy.
2. **Race condition in duplicate prevention** (TC-11) -- The TOCTOU gap between check and create can produce incorrect error codes under concurrent requests.

Both issues require schema and code changes before the feature can be considered production-ready.
