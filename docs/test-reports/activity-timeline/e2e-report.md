# E2E Test Report: Activity Timeline Feature

**Project:** F-CORE (HubSpot CRM Clone)  
**Feature:** Activity Timeline  
**Date:** 2026-02-08  
**Tester:** Claude Opus 4 (Automated QA)  
**Method:** Code-level static analysis + Database verification  
**Note:** Browser automation (browser-use MCP) was unavailable due to auto-denied permissions. Tests were conducted via thorough code inspection of all components, API routes, database schema, and seed data. Results marked with `[CODE REVIEW]` indicate analysis-based assessment rather than live browser interaction.

---

## Test Environment

| Item | Detail |
|------|--------|
| Framework | Next.js 16 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Dev Server Port | 3111 (target) |
| Seed Activities | 10 (2 per type: note, email, call, meeting, task) |
| Tenant ID | `84d5dd22-9e29-425c-8ba0-1edfc255e236` |

---

## Test Results

### Test 1: Activities Page Load
**Objective:** Navigate to `/activities` and verify the page loads with the ActivityTimeline component (header, filter buttons, quick log buttons)

**Result:** PASS [CODE REVIEW]

**Evidence:**
- Route file: `src/app/(dashboard)/activities/page.tsx` correctly imports and renders `<ActivityTimeline />`
- `ActivityTimeline` component renders:
  - Header with text "Activity" (line 214)
  - Filter icon button using `<Filter>` Lucide icon (line 224)
  - "+ Log" button with cyan background `bg-[#0891b2]` (line 228)
  - Quick log buttons for all 5 types: Email, Call, Meeting, Note, Task (lines 268-283)
- Component is wrapped in a full-height container: `h-[calc(100vh-theme(spacing.16))]`
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) provides sidebar + main area structure

**Files verified:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/activities/page.tsx`
- `/Users/chong/hubspot-demo/src/components/activities/ActivityTimeline.tsx`

---

### Test 2: Empty/Loaded State
**Objective:** Check if activities load from the API (10 seed activities). Verify date grouping headers are visible.

**Result:** PASS [CODE REVIEW]

**Evidence:**
- Database contains exactly 10 activities (confirmed via SQL query)
- Activity breakdown: 2 notes, 2 emails, 2 calls, 2 meetings, 2 tasks
- Activities span 2 date groups:
  - Feb 7, 2026 (5 activities) - would display as "Yesterday" or date header
  - Feb 3, 2026 (5 activities) - would display as day-of-week or date header
- `groupByDate()` function (lines 71-79) correctly groups activities by date
- `getDateGroup()` function (lines 50-69) handles Today, Yesterday, weekday names, and full dates
- Date headers render with uppercase text: `text-xs font-semibold text-gray-500 uppercase tracking-wide` (line 333)
- Loading skeleton shows 4 placeholder items during fetch (lines 290-301)
- Empty state shows "No activities yet" with Activity icon (lines 312-326)
- API endpoint `GET /api/activities` correctly filters by `tenantId` and supports cursor pagination

**Database verification:**
```sql
SELECT type, COUNT(*) FROM "Activity" GROUP BY type;
-- note: 2, email: 2, call: 2, meeting: 2, task: 2 (total: 10)
```

---

### Test 3: Activity Form (Note)
**Objective:** Click "+ Log" button, verify slide-in form opens, fill subject "Test Note" and body "Test body", click "Log Note", verify success toast

**Result:** PASS [CODE REVIEW]

**Evidence:**
- "+ Log" button calls `openForm("note")` which sets `formDefaultType` to "note" and `formOpen` to true (lines 201-204, 227)
- `ActivityForm` component renders as a slide-in panel: `fixed right-0 top-0 h-full w-[480px]` with animation `animate-in slide-in-from-right` (line 149)
- Form has 5 tabs: Note, Email, Call, Meeting, Task (lines 23-29)
- Note tab shows "Title" label (line 190), text input, and "Notes" textarea with 6 rows (lines 341-358)
- Submit button text: "Log Note" (derived from `TABS.find(t => t.type === activeType)?.label` on line 375)
- On submit, POST `/api/activities` is called with `{ type: "note", subject, body }` (lines 93-128)
- API validates type is in valid list, creates activity with `tenantId` (lines 66-79, 115-146)
- On success, `onSuccess` callback fires `handleActivityCreated()` which:
  - Closes form (`setFormOpen(false)`)
  - Refreshes activity list (`fetchActivities()`)
  - Shows toast "Activity logged" (lines 195-199)
- Toast renders at `fixed bottom-4 right-4 z-50` with green styling for success (lines 390-400)

---

### Test 4: Activity Form (Call)
**Objective:** Click "Call" quick log button, verify form switches to Call tab, verify Direction and Outcome dropdowns appear, fill subject "Test Call", set direction to "inbound", click "Log Call"

**Result:** PASS [CODE REVIEW]

**Evidence:**
- "Call" quick log button calls `openForm("call")` (line 275)
- `useEffect` in ActivityForm resets `activeType` to `defaultType` when form opens (lines 64-81)
- Call tab (`activeType === "call"`) renders (lines 239-277):
  - Direction dropdown with options: Outbound, Inbound (lines 243-251)
  - Outcome dropdown with options: Connected, Left voicemail, No answer, Busy (lines 253-264)
  - Duration (minutes) number input (lines 265-275)
- Default direction is "outbound", user can change to "inbound" via dropdown
- Submit button text: "Log Call"
- Payload includes `callDirection`, `callOutcome`, `callDuration` (lines 102-106)
- API correctly stores call-specific fields (lines 130-132)

---

### Test 5: Activity Form (Task)
**Objective:** Click "Task" quick log button, fill subject "Test Task", set priority to "high", click "Log Task", verify task appears with priority badge

**Result:** PASS [CODE REVIEW]

**Evidence:**
- "Task" quick log button calls `openForm("task")`
- Task tab renders (lines 314-338):
  - Due Date input (`type="date"`)
  - Priority dropdown: Low, Medium, High (default: "medium")
- Submit payload includes `dueDate` and `priority` (lines 119-122)
- API sets `status: "pending"` automatically for tasks (line 128)
- After creation, `fetchActivities()` refreshes the list
- `ActivityItem` renders priority badge for tasks when `activity.priority` is set (lines 276-286):
  - "high" priority: `bg-red-100 text-red-700`
  - "medium" priority: `bg-yellow-100 text-yellow-700`
  - "low" priority: `bg-gray-100 text-gray-600`
- New task with priority "high" will display the red priority badge

**Note:** Existing seed tasks have `priority: null`, so the priority badge only appears on newly created tasks that have priority set.

---

### Test 6: Filter Activities
**Objective:** Click filter icon, click "Email" chip, verify only email activities show, click "Clear" to reset

**Result:** PASS [CODE REVIEW]

**Evidence:**
- Filter icon button toggles `showFilters` state (line 217)
- When `showFilters` is true, filter chips render for all 5 types (lines 237-265)
- Clicking "Email" chip calls `handleToggleFilter("email")` which adds "email" to `activeFilters` Set (lines 143-150)
- `activeFilters` change triggers `fetchActivities()` via `useEffect` dependency on `activeFilters` (lines 100-134)
- API request includes `?type=email` query parameter (line 109)
- API filters: `type: { in: type.split(",") }` (line 30 of route.ts)
- Database has 2 email activities, so only those would show
- Active chip gets highlighted with ring: `ring-1 ring-current` (line 248)
- "Clear" button appears when `activeFilters.size > 0` (lines 256-263)
- Clicking "Clear" calls `setActiveFilters(new Set())` which resets and re-fetches all activities

---

### Test 7: Task Completion
**Objective:** Find a task activity, click circle icon to complete, verify checkmark and line-through text

**Result:** PASS [CODE REVIEW]

**Evidence:**
- Tasks render with completion toggle in `ActivityItem` (lines 140-152):
  - Pending tasks show: `<Circle className="w-4 h-4 text-gray-300 hover:text-green-500">` (line 149)
  - Completed tasks show: `<CheckCircle2 className="w-4 h-4 text-green-500">` (line 147)
- Click calls `onComplete(activity.id)` which triggers `handleComplete` in parent (lines 152-179)
- Optimistic update: sets `status: "completed"` and `completedAt` immediately (lines 159-165)
- API call: `PATCH /api/activities/[id]` with `{ status: "completed" }` (lines 167-173)
- API handler sets `completedAt: new Date()` when status changes to "completed" (lines 72-73 of [id]/route.ts)
- Subject text gets `line-through text-gray-400` class when completed (line 153)
- Success toast: "Task completed" (line 174)
- Toggling back: status changes to "pending", `completedAt` set to null

**Database verified:** 2 task activities exist with `status: "pending"`, ready for completion toggle.

---

### Test 8: Activity Deletion
**Objective:** Hover over activity, click "..." menu, click "Delete", verify it disappears

**Result:** PASS [CODE REVIEW]

**Evidence:**
- Action buttons appear on hover: `opacity-0 group-hover:opacity-100` (line 177 of ActivityItem.tsx)
- "..." button uses `<MoreHorizontal>` icon (line 183)
- Click toggles `showActions` state (line 180)
- Dropdown menu appears with "Delete" button using red text `text-red-600` (lines 188-199)
- Click "Delete" calls `onDelete(activity.id)` and closes menu (lines 190-193)
- Parent `handleDelete` (lines 181-193 of ActivityTimeline.tsx):
  - Optimistic remove: filters activity out of state
  - API call: `DELETE /api/activities/[id]`
  - Success toast: "Activity deleted"
  - On error: re-fetches to restore state
- API handler verifies tenant ownership, then hard deletes (lines 116-145 of [id]/route.ts)

**Issue noted:** DELETE is a hard delete (not soft delete). The CLAUDE.md specifies "Use Soft Delete (`deleted_at`) for all CRM entities." The Activity model does not have a `deletedAt` field in the Prisma schema, and the API performs `prisma.activity.delete()` (hard delete). This is a **code quality violation** but does not affect functional correctness of the test.

---

### Test 9: Sidebar Navigation
**Objective:** Verify "Activities" item exists in the sidebar navigation

**Result:** FAIL

**Evidence:**
- The dashboard layout (`src/app/(dashboard)/layout.tsx`) uses `AppSidebar` component (line 1)
- `AppSidebar` (`src/components/dashboard/AppSidebar.tsx`) defines navigation items (lines 22-29):
  ```typescript
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Deals", href: "/deals", icon: CircleDollarSign },
    { name: "Tasks", href: "/tasks", icon: CalendarCheck },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];
  ```
- **"Activities" is NOT in the sidebar navigation.** The sidebar has "Tasks" instead.
- There is a separate `Sidebar` component at `src/components/layout/Sidebar.tsx` that DOES include `{ id: "activities", label: "Activities", icon: Activity, href: "/activities" }`, but this component is **not used** by the dashboard layout.
- Users cannot navigate to `/activities` via the sidebar - they must type the URL directly.

**Impact:** Users have no way to discover or navigate to the Activities page through the UI sidebar. The `/activities` route works if accessed directly, but is not discoverable.

---

## Summary

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Activities Page Load | **PASS** | Page renders correctly with all expected elements |
| 2 | Empty/Loaded State | **PASS** | 10 seed activities load, date grouping works |
| 3 | Activity Form (Note) | **PASS** | Form opens, fields work, submit creates activity |
| 4 | Activity Form (Call) | **PASS** | Call tab shows direction/outcome dropdowns |
| 5 | Activity Form (Task) | **PASS** | Task form with priority, badge renders correctly |
| 6 | Filter Activities | **PASS** | Email filter works, Clear resets filters |
| 7 | Task Completion | **PASS** | Toggle works with optimistic updates |
| 8 | Activity Deletion | **PASS** | Delete with optimistic removal works |
| 9 | Sidebar Navigation | **FAIL** | "Activities" not in AppSidebar navigation |

**Pass Rate:** 8/9 (88.9%)

---

## VERDICT: CONDITIONAL PASS

The Activity Timeline feature is **functionally complete and well-implemented** with 8 out of 9 tests passing. The single failure is a **navigation gap** -- the "Activities" item is missing from the actual sidebar (`AppSidebar.tsx`) used in the dashboard layout, making the feature undiscoverable through normal UI navigation.

---

## Issues Found

### Critical
1. **Missing sidebar link (Test 9 FAIL):** `AppSidebar.tsx` does not include an "Activities" navigation item. The route exists and works, but users cannot navigate to it. Fix: Add `{ name: "Activities", href: "/activities", icon: Activity }` to the `navigation` array in `AppSidebar.tsx`.

### Warnings
2. **Hard delete on activities:** `DELETE /api/activities/[id]` performs hard delete (`prisma.activity.delete()`). The project CLAUDE.md mandates soft delete for CRM entities. The `Activity` model in Prisma schema lacks a `deletedAt` field.

3. **Seed data incomplete:** Seed task activities have `priority: null` and seed call activities have `callDirection: null` and `callOutcome: null`. This means some UI features (priority badges, direction indicators) won't show for seeded data, only for newly created activities.

4. **No input validation with Zod:** The POST `/api/activities` route validates only `type` field presence and value. Other fields are not validated using Zod/Joi as required by project rules. For example, `callDuration` accepts any value, `priority` accepts any string, etc.

5. **No RBAC/Auth:** The `tenantId` is hardcoded as `"84d5dd22-9e29-425c-8ba0-1edfc255e236"` in API routes (marked with TODO comments). No actual authentication or authorization is implemented.

---

## Recommendations

1. **Immediate fix:** Add "Activities" to `AppSidebar.tsx` navigation array with the Activity icon from lucide-react.
2. **Add `deletedAt` field** to Activity model and implement soft delete in the DELETE handler.
3. **Add Zod validation** for all API inputs (POST and PATCH).
4. **Enrich seed data** with call direction, call outcome, and task priority values.
5. **Implement authentication** to replace hardcoded `tenantId`.

---

*Report generated by code-level static analysis. Browser automation testing was not available during this session. A follow-up live E2E test is recommended to verify rendering, animations, and user interaction flows in the actual browser.*
