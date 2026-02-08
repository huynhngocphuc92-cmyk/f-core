# Activity Timeline Feature - Code Review Report

> **Reviewer:** Senior Code Reviewer (Automated)
> **Date:** 2026-02-08
> **Feature:** Activity Timeline (Sprint 1)
> **Files Reviewed:** 7
> **Design System Reference:** `docs/DESIGN_SYSTEM.md` v1.0

---

## Files Under Review

| # | File | Role |
|---|------|------|
| 1 | `src/app/api/activities/route.ts` | GET list + POST create |
| 2 | `src/app/api/activities/[id]/route.ts` | GET, PATCH, DELETE by ID |
| 3 | `src/components/activities/ActivityIcon.tsx` | Icon/color mapping |
| 4 | `src/components/activities/ActivityItem.tsx` | Single activity card |
| 5 | `src/components/activities/ActivityForm.tsx` | Slide-in create form |
| 6 | `src/components/activities/ActivityTimeline.tsx` | Main timeline container |
| 7 | `src/app/(dashboard)/activities/page.tsx` | Page wrapper |

---

## CRITICAL Issues

### C-01: Hardcoded tenantId -- Authentication Bypass

**Severity:** CRITICAL
**Files:** `src/app/api/activities/route.ts` (lines 23, 82), `src/app/api/activities/[id]/route.ts` (lines 18, 50, 122)
**Category:** Security

All five API handler functions contain a hardcoded tenant ID:

```typescript
// TODO: Get tenantId from authenticated user session
const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
```

This means:
- Any unauthenticated user can access all activities for this tenant.
- There is no session validation whatsoever.
- The `TODO` comment confirms this is known but unresolved.

Per project rule (CLAUDE.md Section II.2): _"Every API/Query MUST have `WHERE tenant_id = ?`"_ -- while the where clause structurally includes `tenantId`, the value is not derived from an authenticated session, making the enforcement meaningless.

**Recommendation:** Integrate with the auth layer (e.g., `getServerSession()` or Supabase auth) to extract `tenantId` from the authenticated user's JWT/session. Until then, this endpoint is effectively unauthenticated.

---

### C-02: No Input Validation with Zod/Joi on POST and PATCH Bodies

**Severity:** CRITICAL
**Files:** `src/app/api/activities/route.ts` (POST handler, lines 62-156), `src/app/api/activities/[id]/route.ts` (PATCH handler, lines 42-113)
**Category:** Security

The POST endpoint performs only basic type validation (`body.type` against `validTypes`) but all other fields are passed directly from `request.json()` to the Prisma `create` call without schema validation:

```typescript
const body = await request.json();
// body.subject, body.body, body.contactId, etc. are used directly
```

The PATCH endpoint is worse -- it accepts arbitrary fields from the body and writes them into `updateData` without any validation:

```typescript
if (body.subject !== undefined) updateData.subject = body.subject;
if (body.body !== undefined) updateData.body = body.body;
// ... any value type is accepted
```

Per project rule (CLAUDE.md Section II.2): _"Inputs must be validated using Zod/Joi."_

Specific risks:
- `body.callDuration` should be validated as a non-negative integer, but any value is accepted (string, negative, float).
- `body.priority` and `body.status` accept arbitrary strings, not constrained to valid enum values.
- `body.emailTo`, `body.emailCc`, `body.emailBcc` have no email format validation.
- `body.dueDate`, `body.meetingStart`, `body.meetingEnd` accept any string passed to `new Date()`, which can produce `Invalid Date` objects.
- `body.ownerId` is never validated to belong to the same tenant.

**Recommendation:** Define Zod schemas for create and update payloads. Example:

```typescript
const createActivitySchema = z.object({
  type: z.enum(["email", "call", "meeting", "note", "task"]),
  subject: z.string().max(500).optional(),
  body: z.string().max(10000).optional(),
  contactId: z.string().uuid().optional(),
  // ... etc
});
```

---

### C-03: PATCH Update Query Missing tenantId in WHERE Clause

**Severity:** CRITICAL
**File:** `src/app/api/activities/[id]/route.ts` (line 100)
**Category:** Security

The PATCH handler checks existence with `tenantId`, but the actual `update` call uses only `{ id }`:

```typescript
// Line 52-54: Existence check includes tenantId (good)
const existing = await prisma.activity.findUnique({
  where: { id, tenantId },
});

// Line 99-100: Update does NOT include tenantId (bad)
const activity = await prisma.activity.update({
  where: { id },   // <-- Missing tenantId
  data: updateData,
  include: activityIncludes,
});
```

While the existence check mitigates the immediate risk, there is a TOCTOU (time-of-check-time-of-use) race condition. Between the `findUnique` and the `update`, the activity's tenant could theoretically be changed (in a migration or concurrent operation), or a malicious request could exploit timing. The `where` clause of the `update` itself must include `tenantId`.

**Recommendation:** Change to `where: { id, tenantId }` on the update call.

---

### C-04: DELETE Uses Hard Delete Instead of Soft Delete

**Severity:** CRITICAL
**File:** `src/app/api/activities/[id]/route.ts` (line 115-145)
**Category:** Database Integrity

The DELETE handler performs a hard delete:

```typescript
// Line 115 comment says:
// DELETE /api/activities/[id] - Hard delete (activities don't have soft delete)

await prisma.activity.delete({ where: { id } });
```

However, looking at the Prisma schema, the `Activity` model does not have a `deletedAt` field, which means the schema itself was designed without soft delete. But per project rules (CLAUDE.md Section II.1): _"Use Soft Delete (`deleted_at`) for all CRM entities."_

While activities are not the same as Contacts/Companies/Deals, the project rule explicitly says "all CRM entities," and activity history is crucial audit trail data in a CRM. Hard deleting activities destroys the audit trail permanently.

Additionally, the `delete` WHERE clause also omits `tenantId`:

```typescript
await prisma.activity.delete({ where: { id } });  // Missing tenantId
```

**Recommendation:**
1. Add a `deletedAt DateTime?` column to the Activity model in the Prisma schema.
2. Change DELETE to set `deletedAt = new Date()` instead of hard deleting.
3. Add `deletedAt: null` to all read queries.
4. Include `tenantId` in the delete WHERE clause.

---

### C-05: DELETE Query Missing tenantId in WHERE Clause

**Severity:** CRITICAL
**File:** `src/app/api/activities/[id]/route.ts` (line 135)
**Category:** Security

Same TOCTOU issue as C-03:

```typescript
// Existence check has tenantId
const existing = await prisma.activity.findUnique({
  where: { id, tenantId },
});

// Delete does NOT have tenantId
await prisma.activity.delete({ where: { id } });
```

**Recommendation:** Change to `where: { id, tenantId }`.

---

## WARNING Issues

### W-01: No ownerId Validation Against Tenant Users

**Severity:** WARNING
**File:** `src/app/api/activities/route.ts` (line 124)
**Category:** Security

The POST handler validates `contactId`, `companyId`, and `dealId` against the tenant, but `ownerId` is passed through without any validation:

```typescript
ownerId: body.ownerId || null,
```

A malicious client could assign an activity to a user from a different tenant.

**Recommendation:** Add a User lookup with tenantId check:
```typescript
if (body.ownerId) {
  const user = await prisma.user.findUnique({
    where: { id: body.ownerId, tenantId, deletedAt: null },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
}
```

---

### W-02: GET List Missing deletedAt Filter on Activity Query

**Severity:** WARNING
**File:** `src/app/api/activities/route.ts` (line 25-31)
**Category:** Database Integrity

The GET list query does not filter out soft-deleted records. While the Activity model currently lacks `deletedAt`, once C-04 is addressed and soft delete is added, this query will need `deletedAt: null` in its WHERE clause:

```typescript
const where = {
  tenantId,
  // Missing: deletedAt: null
  ...(contactId && { contactId }),
  // ...
};
```

**Recommendation:** Add `deletedAt: null` to the where clause after adding the column.

---

### W-03: Duplicate ActivityData Interface Definition

**Severity:** WARNING
**Files:** `src/components/activities/ActivityItem.tsx` (lines 18-48), `src/components/activities/ActivityTimeline.tsx` (lines 14-38)
**Category:** TypeScript

The `ActivityData` interface is defined identically in both `ActivityItem.tsx` and `ActivityTimeline.tsx`. This violates DRY and will lead to divergence when one is updated but not the other.

**Recommendation:** Extract `ActivityData` to a shared types file, e.g., `src/types/activity.ts` or `src/components/activities/types.ts`, and import it in both components.

---

### W-04: Duplicate activityIncludes Object

**Severity:** WARNING
**Files:** `src/app/api/activities/route.ts` (lines 4-9), `src/app/api/activities/[id]/route.ts` (lines 4-9)
**Category:** TypeScript / DRY

The `activityIncludes` Prisma include object is copy-pasted across both route files:

```typescript
const activityIncludes = {
  owner: { select: { id: true, name: true, email: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: { id: true, name: true, domain: true } },
  deal: { select: { id: true, name: true, amount: true } },
};
```

**Recommendation:** Extract to a shared constants file, e.g., `src/lib/queries/activity.ts`.

---

### W-05: ActivityForm Has Excessive Individual useState Calls

**Severity:** WARNING
**File:** `src/components/activities/ActivityForm.tsx` (lines 40-62)
**Category:** React Patterns

The form component uses 12 individual `useState` hooks for form fields:

```typescript
const [activeType, setActiveType] = useState(defaultType);
const [subject, setSubject] = useState("");
const [body, setBody] = useState("");
const [callDirection, setCallDirection] = useState("outbound");
const [callOutcome, setCallOutcome] = useState("connected");
const [callDuration, setCallDuration] = useState("");
const [meetingStart, setMeetingStart] = useState("");
const [meetingEnd, setMeetingEnd] = useState("");
const [meetingLocation, setMeetingLocation] = useState("");
const [emailTo, setEmailTo] = useState("");
const [emailCc, setEmailCc] = useState("");
const [dueDate, setDueDate] = useState("");
const [priority, setPriority] = useState("medium");
```

This makes the reset logic (lines 65-80) fragile -- if a new field is added, the developer must remember to reset it in the `useEffect`.

**Recommendation:** Consolidate into `useReducer` or a single `useState` with an object, and use a `resetForm()` function.

---

### W-06: Form Inputs Deviate from Design System Specification

**Severity:** WARNING
**File:** `src/components/activities/ActivityForm.tsx` (all input elements)
**Category:** Design System

The design system specifies form inputs as:

```tsx
// Design System (docs/DESIGN_SYSTEM.md)
className="w-full px-4 py-2.5 rounded-lg border border-gray-200
           focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
```

The actual implementation uses:

```tsx
// Actual code
className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
           focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
```

Differences:
- Padding: `px-3 py-2` vs. `px-4 py-2.5` (inputs are smaller than spec)
- Border color: `border-gray-300` vs. `border-gray-200`
- Border radius: `rounded-md` vs. `rounded-lg`
- Focus ring: `ring-cyan-500` vs. `ring-cyan-100`
- Focus border: `focus:border-transparent` vs. `focus:border-[#0891b2]`
- Missing: `outline-none` uses `focus:outline-none` instead (functional equivalent but inconsistent)

**Recommendation:** Align all form inputs with the design system, or extract a shared input class/component.

---

### W-07: Toast z-index Does Not Follow Design System

**Severity:** WARNING
**File:** `src/components/activities/ActivityTimeline.tsx` (line 392)
**Category:** Design System

The design system specifies Toast z-index as `70`:

| Name | Value | Usage |
|------|-------|-------|
| Toast | 70 | Toast notifications |

The actual implementation uses `z-50`:

```tsx
className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg ...`}
```

This means toasts could appear behind modals (z-50) or popovers (z-60).

**Recommendation:** Change to `z-[70]` or define a Tailwind utility for the toast layer.

---

### W-08: No Delete Confirmation Dialog

**Severity:** WARNING
**File:** `src/components/activities/ActivityTimeline.tsx` (lines 181-193)
**Category:** UX

The `handleDelete` function immediately performs an optimistic delete without any confirmation:

```typescript
const handleDelete = async (id: string) => {
  // Optimistic remove -- no confirmation!
  setActivities((prev) => prev.filter((a) => a.id !== id));
  // ...
};
```

Deleting an activity is a destructive action (especially given C-04, where it is a hard delete). There is no "Are you sure?" dialog.

**Recommendation:** Add a confirmation dialog before deleting. At minimum, use `window.confirm()` or a proper modal component.

---

### W-09: ActivityIcon Stores JSX in Module-Level Config Object

**Severity:** WARNING
**File:** `src/components/activities/ActivityIcon.tsx` (lines 21-52)
**Category:** React Patterns

The `ACTIVITY_TYPE_CONFIG` object stores pre-created JSX elements as values:

```typescript
const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  email: {
    icon: <Mail className="w-4 h-4" />,
    // ...
  },
```

These JSX elements are created once at module load time and reused across all render cycles. While React handles this correctly (elements are immutable descriptions), it prevents dynamic sizing or styling of the icon per-use. The `size` prop on `ActivityIcon` only affects the container, not the icon itself.

**Recommendation:** Store the component reference instead of the instance, and render dynamically:

```typescript
const ACTIVITY_TYPE_CONFIG = {
  email: { Icon: Mail, label: "Email", ... },
};
// Then: <config.Icon className={iconSizeClass} />
```

---

### W-10: PATCH Endpoint Does Not Validate Type-Specific Fields Match Activity Type

**Severity:** WARNING
**File:** `src/app/api/activities/[id]/route.ts` (lines 63-97)
**Category:** API Design

The PATCH handler allows updating any field regardless of the activity type. For example, a client could set `callDuration` on an `email` activity, or `emailTo` on a `call` activity:

```typescript
// No check: if (existing.type === "call") before allowing callDuration update
if (body.callDuration !== undefined) updateData.callDuration = body.callDuration;
```

This leads to data inconsistency.

**Recommendation:** Validate that type-specific fields match `existing.type` before applying them.

---

## INFO Issues

### I-01: ActivityType Used as `string` Instead of Union Type in Props

**Severity:** INFO
**Files:** `src/components/activities/ActivityIcon.tsx` (line 59), `src/components/activities/ActivityItem.tsx` (line 20)
**Category:** TypeScript

`ActivityType` is defined as a proper union type in `ActivityIcon.tsx`:

```typescript
export type ActivityType = "email" | "call" | "meeting" | "note" | "task";
```

But the `ActivityIconProps` and `ActivityData` interfaces use `string` for the `type` field:

```typescript
interface ActivityIconProps {
  type: string;   // Should be ActivityType
}

interface ActivityData {
  type: string;   // Should be ActivityType
}
```

This loses type safety and allows invalid values to flow through without TypeScript catching them.

**Recommendation:** Use `ActivityType` wherever activity type is referenced.

---

### I-02: Missing ARIA Labels and Keyboard Accessibility

**Severity:** INFO
**Files:** `src/components/activities/ActivityItem.tsx`, `src/components/activities/ActivityForm.tsx`, `src/components/activities/ActivityTimeline.tsx`
**Category:** Accessibility

Several interactive elements lack accessibility attributes:

1. **ActivityItem.tsx**: The "more actions" button (line 180) has no `aria-label`:
   ```tsx
   <button onClick={() => setShowActions(!showActions)} className="...">
     <MoreHorizontal className="w-4 h-4" />
   </button>
   ```

2. **ActivityItem.tsx**: The expand/collapse button (line 292-307) has no `aria-expanded` attribute.

3. **ActivityForm.tsx**: The slide-in panel (line 149) has no `role="dialog"` or `aria-modal="true"`.

4. **ActivityForm.tsx**: The close button (line 153-158) has no `aria-label`.

5. **ActivityTimeline.tsx**: Filter chip buttons (line 243-253) have no `aria-pressed` state.

6. **ActivityForm.tsx**: The backdrop overlay (line 147) is clickable but has no keyboard handler and no `role`.

**Recommendation:** Add appropriate ARIA attributes:
- `aria-label="More actions"` on the menu button
- `aria-expanded={expanded}` on the expand/collapse toggle
- `role="dialog" aria-modal="true" aria-label="Log Activity"` on the form panel
- `aria-label="Close"` on close buttons
- `aria-pressed={isActive}` on filter chips

---

### I-03: No Error Boundary Around ActivityTimeline

**Severity:** INFO
**File:** `src/app/(dashboard)/activities/page.tsx`
**Category:** React Patterns

The page component directly renders `ActivityTimeline` without an error boundary:

```tsx
export default function ActivitiesPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.16))]">
      <ActivityTimeline />
    </div>
  );
}
```

If `ActivityTimeline` throws a render error, the entire page crashes with no graceful fallback.

**Recommendation:** Wrap in a React error boundary component.

---

### I-04: Inconsistent Response Format on DELETE

**Severity:** INFO
**File:** `src/app/api/activities/[id]/route.ts` (line 137)
**Category:** API Design

The GET and PATCH endpoints return `{ data: activity }`, but DELETE returns `{ success: true }`:

```typescript
// GET/PATCH
return NextResponse.json({ data: activity });

// DELETE
return NextResponse.json({ success: true });
```

The project convention is `{ data }` for success responses.

**Recommendation:** Return `{ data: { id } }` or `{ data: null }` with HTTP 204 (No Content) for consistency.

---

### I-05: Potential Stale Closure in handleToggleFilter

**Severity:** INFO
**File:** `src/components/activities/ActivityTimeline.tsx` (lines 143-150)
**Category:** React Patterns

The `handleToggleFilter` function is not wrapped in `useCallback`:

```typescript
const handleToggleFilter = (type: string) => {
  setActiveFilters((prev) => {
    const next = new Set(prev);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    return next;
  });
};
```

While the functional updater form of `setActiveFilters` avoids stale closure over `activeFilters`, the function itself is recreated on every render. Since it is passed as an `onClick` handler directly (not to a child via props), this is a minor performance issue, not a correctness bug.

**Recommendation:** Wrap in `useCallback` with an empty dependency array (since it only uses the functional updater form).

---

### I-06: Loading Skeleton Has Fixed Count

**Severity:** INFO
**File:** `src/components/activities/ActivityTimeline.tsx` (lines 290-301)
**Category:** UX

The loading skeleton always renders exactly 4 placeholder items:

```tsx
{[1, 2, 3, 4].map((i) => (
  <div key={i} className="flex gap-3">
    {/* skeleton */}
  </div>
))}
```

This is a minor UX detail, but the skeleton count does not adapt to viewport height.

**Recommendation:** Consider using a CSS-based approach or matching the `limit` parameter for a more realistic loading preview.

---

### I-07: Primary Button Hover Color Inconsistency

**Severity:** INFO
**Files:** `src/components/activities/ActivityForm.tsx` (line 373), `src/components/activities/ActivityTimeline.tsx` (line 228, 321)
**Category:** Design System

The primary button uses `hover:bg-[#0ea5e9]` which maps to `sky-500`. Per the design system, this is the correct hover color. However, the design system button specification includes `shadow-lg shadow-cyan-500/25` which is absent from all button instances in this feature:

```tsx
// Design system spec:
className="... shadow-lg shadow-cyan-500/25"

// Actual (ActivityForm, line 373):
className="px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors disabled:opacity-50"
// Missing: shadow-lg shadow-cyan-500/25
```

**Recommendation:** Add the brand shadow to primary buttons for design consistency.

---

### I-08: `isLast` Computation in ActivityTimeline is Inefficient

**Severity:** INFO
**File:** `src/components/activities/ActivityTimeline.tsx` (lines 346-349)
**Category:** Performance

The `isLast` prop computation calls `Array.from(dateGroups.keys()).pop()` on every iteration:

```tsx
isLast={
  idx === groupActivities.length - 1 &&
  dateLabel === Array.from(dateGroups.keys()).pop()
}
```

This creates a new array from the Map keys for every activity item rendered.

**Recommendation:** Pre-compute the last date key before the loop:

```typescript
const dateKeys = Array.from(dateGroups.keys());
const lastDateKey = dateKeys[dateKeys.length - 1];
```

---

### I-09: No Rate Limiting or Request Size Limit on POST/PATCH

**Severity:** INFO
**Files:** `src/app/api/activities/route.ts`, `src/app/api/activities/[id]/route.ts`
**Category:** Security

Neither the POST nor PATCH endpoint has any rate limiting or request body size validation. A malicious client could:
- Spam create thousands of activities rapidly.
- Send an extremely large `body` field (the schema uses `@db.Text` which is unlimited).

**Recommendation:** Implement rate limiting middleware and validate `body` field length (e.g., max 50,000 characters).

---

### I-10: GET List Does Not Filter Soft-Deleted Associated Records

**Severity:** INFO
**File:** `src/app/api/activities/route.ts` (lines 4-9)
**Category:** Database Integrity

The `activityIncludes` eagerly loads related contacts, companies, and deals, but does not filter out soft-deleted ones:

```typescript
const activityIncludes = {
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  // No: where: { deletedAt: null }
};
```

Activities associated with deleted contacts/companies/deals will still show those associations, potentially displaying data from records that the user considers "deleted."

**Recommendation:** Add `where: { deletedAt: null }` to each association include, or handle null associations gracefully in the UI.

---

## Summary Table

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 5 | C-01, C-02, C-03, C-04, C-05 |
| WARNING | 10 | W-01 through W-10 |
| INFO | 10 | I-01 through I-10 |
| **Total** | **25** | |

---

## VERDICT: FAIL

**Reason:** 5 CRITICAL issues found. The feature MUST NOT be merged until all CRITICAL issues are resolved.

### Priority Fix Order

1. **C-01** -- Replace hardcoded tenantId with session-based authentication.
2. **C-02** -- Add Zod validation schemas for all API inputs.
3. **C-03** -- Add `tenantId` to PATCH update WHERE clause.
4. **C-05** -- Add `tenantId` to DELETE WHERE clause.
5. **C-04** -- Add `deletedAt` to Activity schema and convert to soft delete.

After CRITICAL fixes, address WARNING issues in priority order: W-01 (security), W-08 (UX safety), W-06 (design system), then remaining items.

---

*Report generated by Senior Code Reviewer for F-CORE project.*
