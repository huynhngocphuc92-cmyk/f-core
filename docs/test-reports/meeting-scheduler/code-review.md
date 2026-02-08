# Code Review Report: Meeting Scheduler Implementation

> **Reviewer:** QA Code Reviewer (Automated)
> **Date:** 2026-02-08
> **Module:** Meeting Scheduler (Sprint Feature)
> **Status:** REVIEW COMPLETE - Issues Found

---

## Executive Summary

The Meeting Scheduler implementation spans 7 API route files, 3 dashboard pages, 2 client components, and 3 Prisma models. The code is generally well-structured and follows existing project patterns established in the contacts module. However, this review identified **6 CRITICAL**, **8 HIGH**, **5 MEDIUM**, **4 LOW**, and **3 INFO** findings across security, data integrity, frontend quality, and design system compliance.

**Total findings: 26**

---

## File Inventory

| # | File | Type | Lines |
|---|------|------|-------|
| 1 | `src/app/api/meetings/types/route.ts` | API Route | 120 |
| 2 | `src/app/api/meetings/types/[id]/route.ts` | API Route | 102 |
| 3 | `src/app/api/meetings/types/[id]/availability/route.ts` | API Route | 97 |
| 4 | `src/app/api/meetings/bookings/route.ts` | API Route | 65 |
| 5 | `src/app/api/meetings/bookings/[id]/route.ts` | API Route | 125 |
| 6 | `src/app/api/book/[userId]/[slug]/route.ts` | API Route (Public) | 200 |
| 7 | `src/app/api/book/[userId]/[slug]/slots/route.ts` | API Route (Public) | 141 |
| 8 | `src/app/(dashboard)/meetings/page.tsx` | Server Component | 253 |
| 9 | `src/app/(dashboard)/meetings/new/page.tsx` | Server Component | 17 |
| 10 | `src/app/(dashboard)/meetings/[id]/page.tsx` | Server Component | 52 |
| 11 | `src/app/book/[userId]/[slug]/page.tsx` | Server Component | 68 |
| 12 | `src/components/meetings/MeetingTypeForm.tsx` | Client Component | 413 |
| 13 | `src/components/meetings/BookingPage.tsx` | Client Component | 453 |
| 14 | `prisma/schema.prisma` (Meeting models) | Schema | ~112 |

---

## CRITICAL Findings

### C-01: Missing Tenant Isolation on All Authenticated API Routes

**Severity:** CRITICAL
**Category:** Security / Multi-tenancy
**Files affected:**
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (lines 5-36, GET)
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/route.ts` (lines 5-101, GET/PATCH/DELETE)
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/availability/route.ts` (lines 5-96, GET/PUT)
- `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/route.ts` (lines 5-64, GET)
- `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/[id]/route.ts` (lines 5-124, GET/PATCH)

**Description:** Per CLAUDE.md rule: "Every API/Query MUST have `WHERE tenant_id = ?`." None of the authenticated meeting API routes enforce tenant isolation. A user from Tenant A can read, update, or delete meeting types and bookings belonging to Tenant B by guessing or enumerating UUIDs.

**Evidence:**
```typescript
// GET /api/meetings/types/[id] - No tenantId check
const meetingType = await prisma.meetingType.findUnique({
  where: { id, deletedAt: null },  // <-- Missing: tenantId filter
  ...
});

// PATCH /api/meetings/types/[id] - No tenantId check
const meetingType = await prisma.meetingType.update({
  where: { id },  // <-- Missing: tenantId + ownership verification
  ...
});

// DELETE /api/meetings/types/[id] - No tenantId check
await prisma.meetingType.update({
  where: { id },  // <-- Missing: tenantId + ownership verification
  ...
});
```

**Impact:** Complete cross-tenant data breach. Any authenticated user can access or modify any tenant's meeting data. This is an IDOR (Insecure Direct Object Reference) vulnerability.

**Recommendation:** Extract `tenantId` from the authenticated session and include it in all `where` clauses. Add an authorization middleware or utility function.

---

### C-02: No Authentication on Authenticated API Routes

**Severity:** CRITICAL
**Category:** Security / Authentication
**Files affected:**
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts`
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/route.ts`
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/availability/route.ts`
- `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/route.ts`
- `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/[id]/route.ts`

**Description:** None of the dashboard-facing API routes verify that the caller is authenticated. There is no session check, no JWT validation, and no auth middleware. Any anonymous HTTP client can call these endpoints.

**Evidence:**
```typescript
// POST /api/meetings/types - Anyone can create meeting types
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // No authentication check
    // tenantId is taken from body input: body.tenantId || "demo-tenant"
```

**Impact:** Complete unauthorized access to all CRUD operations on meeting types, availability, and bookings.

**Note:** This is consistent with the contacts reference pattern, which also lacks auth. This suggests auth is planned but not yet implemented. However, for a CRM application, this remains critical.

---

### C-03: Client-Supplied `tenantId` Allows Tenant Impersonation

**Severity:** CRITICAL
**Category:** Security / Authorization
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (line 50)

**Description:** The `tenantId` is taken directly from the request body with a fallback to a hardcoded default. This means any client can set any `tenantId`, creating records in arbitrary tenants.

**Evidence:**
```typescript
const tenantId = body.tenantId || "demo-tenant";
```

**Impact:** A malicious user can create meeting types under any tenant by sending `{ tenantId: "victim-tenant-id", ... }` in the request body.

**Note:** Same pattern exists in contacts route (line 76). This is a systemic issue that should be addressed project-wide.

---

### C-04: No Input Validation (Missing Zod/Joi)

**Severity:** CRITICAL
**Category:** Security / Input Validation
**Files affected:**
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (POST handler)
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/route.ts` (PATCH handler)
- `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/[id]/route.ts` (PATCH handler)
- `/Users/chong/hubspot-demo/src/app/api/book/[userId]/[slug]/route.ts` (POST handler)

**Description:** Per CLAUDE.md: "Inputs must be validated using Zod/Joi." No schema validation is used on any endpoint. While basic presence checks exist (e.g., `!body.name || !body.duration`), there is no type checking, range validation, or sanitization.

**Evidence:**
```typescript
// POST /api/meetings/types - No validation on types
if (!body.name || !body.duration || !body.userId) {
  // Only checks presence, not type
  // body.duration could be a string, negative number, or 999999
  // body.name could be an object, contain HTML/scripts
}
```

**Specific concerns:**
- `duration` is not validated as a positive integer. Negative or zero values would create broken meetings.
- `bufferBefore`, `bufferAfter`, `minNotice`, `maxAdvance` accept any value with no range validation.
- `color` is not validated as a hex color string, enabling XSS via style injection.
- `locationType` is not validated against an enum (`video`, `phone`, `in_person`, `custom`).
- `inviteeEmail` on the public booking endpoint is not validated as an email format.
- `startTime`/`endTime` strings in availability are not validated as "HH:MM" format.

---

### C-05: Race Condition in Booking Creation (Double-Booking)

**Severity:** CRITICAL
**Category:** Data Integrity
**File:** `/Users/chong/hubspot-demo/src/app/api/book/[userId]/[slug]/route.ts` (lines 117-131)

**Description:** The overlap check and booking creation are not atomic. Between the `findFirst` check (line 117) and the `$transaction` create (line 147), another request could book the same slot, resulting in a double-booking. The overlap check itself is outside the transaction.

**Evidence:**
```typescript
// Step 1: Check for overlap (outside transaction)
const overlapping = await prisma.meetingBooking.findFirst({
  where: { ... },
});

if (overlapping) { return 409; }

// Step 2: Auto-match contact (more time passes)
const existingContact = await prisma.contact.findFirst({ ... });

// Step 3: Create booking inside transaction (but overlap check was outside)
const booking = await prisma.$transaction(async (tx) => {
  // Creates activity + booking, but overlap was checked above
});
```

**Impact:** Two concurrent booking requests for the same time slot can both pass the overlap check and both succeed, creating conflicting bookings.

**Recommendation:** Move the overlap check inside the transaction using `SELECT ... FOR UPDATE` or use a database-level unique constraint on the time range. Alternatively, perform the overlap check inside the `$transaction` callback using the `tx` client.

---

### C-06: Race Condition in Slug Uniqueness Check

**Severity:** CRITICAL
**Category:** Data Integrity
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (lines 59-63)

**Description:** The slug uniqueness check and creation are not atomic. Two concurrent requests with the same name could both find no existing slug, and both attempt to create with the same slug, causing one to fail with a unique constraint violation (unhandled).

**Evidence:**
```typescript
const existing = await prisma.meetingType.findUnique({
  where: { userId_slug: { userId: body.userId, slug: baseSlug } },
});
// Time gap where another request can create the same slug
const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

const meetingType = await prisma.meetingType.create({
  data: { ... slug ... },  // Could fail with unique constraint violation
});
```

**Impact:** Unhandled Prisma unique constraint error returns a generic 500 to the client. While not a data corruption issue (database constraint prevents it), it's a poor user experience.

**Recommendation:** Use a try/catch around the create and retry with a timestamp-suffixed slug on unique constraint violation, or use an `upsert` pattern.

---

## HIGH Findings

### H-01: No Authorization Check on PATCH/DELETE (IDOR)

**Severity:** HIGH
**Category:** Security / Authorization
**Files affected:**
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/route.ts` (PATCH, DELETE)
- `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/[id]/route.ts` (PATCH)
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/availability/route.ts` (PUT)

**Description:** Beyond the tenant isolation issue (C-01), there is no ownership verification. Even within the same tenant, any user can update or delete another user's meeting types. The `PATCH` on meeting types does not verify that the requesting user is the `userId` owner of the meeting type.

**Evidence:**
```typescript
// PATCH /api/meetings/types/[id] - No ownership check
const meetingType = await prisma.meetingType.update({
  where: { id },  // Any user can update any meeting type
  data: { ... },
});
```

---

### H-02: Availability PUT Endpoint Performs Hard Delete

**Severity:** HIGH
**Category:** Data Integrity / Design Rule Violation
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/availability/route.ts` (lines 60-80)

**Description:** Per CLAUDE.md: "Use Soft Delete (deleted_at) for all CRM entities." The availability PUT handler uses `deleteMany` which performs a hard delete. While `MeetingAvailability` is not a top-level CRM entity, it destroys historical data that could be useful for auditing.

**Evidence:**
```typescript
await prisma.$transaction([
  prisma.meetingAvailability.deleteMany({
    where: { meetingTypeId: id },  // Hard delete!
  }),
  prisma.meetingAvailability.createMany({ ... }),
]);
```

**Impact:** Previous availability records are permanently lost. No audit trail for when availability was changed.

---

### H-03: Bookings GET Endpoint Missing Tenant Filter

**Severity:** HIGH
**Category:** Security / Data Exposure
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/route.ts` (lines 17-46)

**Description:** The bookings list endpoint returns bookings across all tenants. There is no `tenantId` filter in the `where` clause.

**Evidence:**
```typescript
const where: Record<string, unknown> = {};
// No tenantId filter - returns all tenants' bookings
if (status) where.status = status;
if (meetingTypeId) where.meetingTypeId = meetingTypeId;
```

---

### H-04: Missing Validation on Availability Time Ranges

**Severity:** HIGH
**Category:** Data Integrity
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/availability/route.ts` (lines 44-57)

**Description:** While `dayOfWeek` is validated (0-6) and `startTime`/`endTime` presence is checked, there is no validation that `startTime < endTime`. A user could set `startTime: "17:00"` and `endTime: "09:00"`, which would produce zero slots or incorrect behavior in the slot generation logic.

**Evidence:**
```typescript
for (const entry of body.availability) {
  if (entry.dayOfWeek === undefined || !entry.startTime || !entry.endTime) {
    // Only checks presence, not that startTime < endTime
  }
}
```

---

### H-05: `MeetingTypeForm` Does Not Handle API Errors on Create

**Severity:** HIGH
**Category:** Error Handling / UX
**File:** `/Users/chong/hubspot-demo/src/components/meetings/MeetingTypeForm.tsx` (lines 136-158)

**Description:** The create flow fires a `fetch` POST but never checks the response status. If the API returns a 400 or 500 error, the form silently navigates to `/meetings` as if the creation succeeded.

**Evidence:**
```typescript
// Create new meeting type
await fetch("/api/meetings/types", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... }),
});
// No response status check!

// TODO comment acknowledges a bug:
// TODO: Set availability after creation (need meeting type ID from response)

router.push("/meetings");  // Always navigates away, even on failure
router.refresh();
```

**Additional issue:** The `TODO` comment on line 157 indicates that custom availability is NOT being saved on creation. Only default availability is created if `createDefaultAvailability` is not set to `false` -- but line 152 sets it to `false`. This means new meeting types are created with NO availability at all, despite the user configuring it in the form.

---

### H-06: Missing `deletedAt` Check in PATCH/DELETE on Meeting Types

**Severity:** HIGH
**Category:** Data Integrity
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/route.ts` (lines 47-68 PATCH, lines 88-91 DELETE)

**Description:** The PATCH and DELETE handlers do not check if the meeting type has already been soft-deleted. A user can update or re-delete a soft-deleted meeting type, potentially resurrecting it or causing confusing behavior.

**Evidence:**
```typescript
// PATCH - No deletedAt check
const meetingType = await prisma.meetingType.update({
  where: { id },  // Missing: deletedAt: null
  data: { ... },
});

// DELETE - No deletedAt check
await prisma.meetingType.update({
  where: { id },  // Could re-soft-delete an already deleted record
  data: { deletedAt: new Date(), isActive: false },
});
```

---

### H-07: No Pagination on Meeting Types List API

**Severity:** HIGH
**Category:** Performance
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (lines 18-26)

**Description:** The GET handler for meeting types uses `findMany` without `skip`/`take` pagination. As the number of meeting types grows, this returns all records in a single response. The contacts reference endpoint correctly implements pagination.

**Evidence:**
```typescript
const meetingTypes = await prisma.meetingType.findMany({
  where,
  include: { ... },
  orderBy: { createdAt: "desc" },
  // No skip/take - returns ALL records
});
```

**Contrast with contacts reference:**
```typescript
const [contacts, total] = await Promise.all([
  prisma.contact.findMany({
    where,
    skip,      // Has pagination
    take: limit,
  }),
  prisma.contact.count({ where }),
]);
```

---

### H-08: Booking PATCH Reschedule Requires `userId` in Body (Not Validated)

**Severity:** HIGH
**Category:** Security / Data Integrity
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/[id]/route.ts` (lines 68-98)

**Description:** The reschedule logic checks for overlapping bookings using `body.userId` to find other bookings for the same host. If `body.userId` is not provided, the overlap check uses `undefined`, which means it would filter by `meetingType.userId === undefined` and effectively find no overlaps, allowing double-bookings.

**Evidence:**
```typescript
if (body.startTime && body.endTime) {
  const overlapping = await prisma.meetingBooking.findFirst({
    where: {
      id: { not: id },
      meetingType: {
        userId: body.userId,  // Could be undefined!
      },
      ...
    },
  });
}
```

**Impact:** If `userId` is omitted from the reschedule request body, the overlap check is silently bypassed.

---

## MEDIUM Findings

### M-01: `isActive` Filter Logic Bug in Meeting Types GET

**Severity:** MEDIUM
**Category:** Bug
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (line 16)

**Description:** The `isActive` filter logic is incorrect. When the query parameter is absent (`null`), the condition `isActive !== null` evaluates to `true` (because `null !== null` is `false` in JS), so this line actually never sets the filter. However, the real bug is more subtle: when `isActive` is an empty string (which `searchParams.get()` returns for `?isActive` with no value), `isActive !== null` is `true` and `isActive !== "false"` is also `true`, so it would filter to active-only even when the user did not intend to filter.

**Evidence:**
```typescript
if (isActive !== null) where.isActive = isActive !== "false";
// When isActive query param is absent: isActive = null, condition is false (OK)
// When isActive = "true": sets where.isActive = true (OK)
// When isActive = "false": sets where.isActive = false (OK)
// When isActive = "": sets where.isActive = true (BUG - empty string is truthy check)
```

**Actual Impact:** Minor, since users unlikely to send `?isActive` with no value, but demonstrates fragile parsing logic.

---

### M-02: Timezone Handling Inconsistency in Slot Generation

**Severity:** MEDIUM
**Category:** Bug / Logic
**File:** `/Users/chong/hubspot-demo/src/app/api/book/[userId]/[slug]/slots/route.ts` (lines 39-86)

**Description:** The slot generation logic uses UTC throughout but the availability times are stored as local times with a timezone field. The `visitorTimezone` parameter is accepted but not used for any server-side calculation -- it is only passed through in the response. The availability `startTime`/`endTime` (e.g., "09:00") are treated as UTC, but they should be interpreted in the availability's `timezone` field.

**Evidence:**
```typescript
const requestedDate = new Date(dateStr + "T00:00:00Z");
const dayOfWeek = requestedDate.getUTCDay();

// Availability times are treated as UTC
windowStart.setUTCHours(startHour, startMinute, 0, 0);
windowEnd.setUTCHours(endHour, endMinute, 0, 0);
```

**Impact:** If a user sets availability as "09:00-17:00" in "America/New_York", the system treats this as 09:00-17:00 UTC, which is 04:00-12:00 EST. This means the generated slots are wrong for any non-UTC timezone.

---

### M-03: Dashboard Page Missing Tenant Filter in Server Component

**Severity:** MEDIUM
**Category:** Security
**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/meetings/page.tsx` (lines 5-30)

**Description:** The server component queries `getMeetingTypes()` and `getUpcomingBookings()` without any tenant or user filtering. This exposes all meeting types and bookings from all tenants on the dashboard.

**Evidence:**
```typescript
async function getMeetingTypes() {
  return prisma.meetingType.findMany({
    where: { deletedAt: null },  // No tenantId filter
    ...
  });
}

async function getUpcomingBookings() {
  return prisma.meetingBooking.findMany({
    where: {
      startTime: { gte: new Date() },
      status: "scheduled",
    },  // No tenantId filter
    ...
  });
}
```

---

### M-04: Design System Input Deviation

**Severity:** MEDIUM
**Category:** Design System Compliance
**Files affected:**
- `/Users/chong/hubspot-demo/src/components/meetings/MeetingTypeForm.tsx`
- `/Users/chong/hubspot-demo/src/components/meetings/BookingPage.tsx`

**Description:** The form inputs deviate from the Design System specification in `docs/DESIGN_SYSTEM.md`. The design system specifies `focus:ring-2 focus:ring-cyan-100` for inputs, but the meeting forms use only `focus:outline-none focus:border-[#0891b2]` without the ring effect.

**Design System specification (Section IV - Form Inputs):**
```tsx
className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
```

**Actual implementation:**
```tsx
className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
```

**Differences:**
1. Missing `focus:ring-2 focus:ring-cyan-100` (no focus ring)
2. Uses `py-2` instead of `py-2.5` (slightly smaller vertical padding)
3. Missing `transition-colors` on some inputs
4. Uses `focus:outline-none` instead of `outline-none`

---

### M-05: Missing Error Boundary / Error State in BookingPage

**Severity:** MEDIUM
**Category:** Error Handling / UX
**File:** `/Users/chong/hubspot-demo/src/components/meetings/BookingPage.tsx` (lines 123-153)

**Description:** The booking submission uses `alert()` for error display, which is a poor UX pattern. Additionally, there is no error state displayed inline in the form. API errors from slot fetching are silently swallowed (line 82 catches but only logs).

**Evidence:**
```typescript
// Slot fetch errors are silently swallowed
} catch (error) {
  console.error("Error fetching slots:", error);
  // No error state for the user
}

// Booking errors use alert()
} else {
  const data = await res.json();
  alert(data.error || "Failed to book meeting");
}
```

---

## LOW Findings

### L-01: Unused `Palette` Import

**Severity:** LOW
**Category:** Code Quality
**File:** `/Users/chong/hubspot-demo/src/components/meetings/MeetingTypeForm.tsx` (line 5)

**Description:** The `Palette` icon is imported from `lucide-react` but never used in the component.

**Evidence:**
```typescript
import { ArrowLeft, Clock, Video, Phone, MapPin, Palette } from "lucide-react";
// Palette is never referenced in the JSX
```

---

### L-02: Inconsistent Response Envelope

**Severity:** LOW
**Category:** API Design Consistency
**Files affected:**
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (GET returns `{ data: [...] }`, POST returns raw object)
- `/Users/chong/hubspot-demo/src/app/api/meetings/types/[id]/route.ts` (GET returns raw object)
- `/Users/chong/hubspot-demo/src/app/api/meetings/bookings/route.ts` (GET returns `{ data: [...], pagination: {...} }`)

**Description:** The API response format is inconsistent. Some endpoints wrap results in `{ data: ... }`, others return the raw object. The bookings list includes pagination metadata, but the meeting types list does not.

| Endpoint | Response Format |
|----------|----------------|
| `GET /meetings/types` | `{ data: [...] }` |
| `POST /meetings/types` | Raw object |
| `GET /meetings/types/[id]` | Raw object |
| `GET /meetings/bookings` | `{ data: [...], pagination: {...} }` |
| `GET /meetings/bookings/[id]` | Raw object |

---

### L-03: Missing `aria-label` on Interactive Elements

**Severity:** LOW
**Category:** Accessibility
**Files affected:**
- `/Users/chong/hubspot-demo/src/components/meetings/BookingPage.tsx` (calendar navigation buttons, time slot buttons)
- `/Users/chong/hubspot-demo/src/components/meetings/MeetingTypeForm.tsx` (color picker buttons)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/meetings/page.tsx` (MoreHorizontal button, line 239)

**Description:** Several interactive elements lack proper ARIA attributes for screen readers.

**Evidence:**
```tsx
// Calendar navigation - no aria-label
<button onClick={prevMonth} className="...">
  <ChevronLeft className="w-5 h-5" />
</button>

// Color picker - no aria-label
<button key={c} type="button" onClick={() => setColor(c)} className="..."
  style={{ backgroundColor: c }}
/>
// Screen reader has no idea what this button does or which color it represents

// More menu button - no aria-label
<button className="p-1 text-gray-400 hover:text-gray-600 rounded">
  <MoreHorizontal className="w-4 h-4" />
</button>
```

---

### L-04: Hardcoded "demo-tenant" Fallback

**Severity:** LOW
**Category:** Technical Debt
**File:** `/Users/chong/hubspot-demo/src/app/api/meetings/types/route.ts` (line 50)

**Description:** The hardcoded `"demo-tenant"` fallback should be removed before production. While acceptable for development, this could mask missing tenant context.

```typescript
const tenantId = body.tenantId || "demo-tenant";
```

**Note:** Same pattern exists in the contacts API. Should be tracked as a project-wide issue.

---

## INFO Findings

### I-01: TODO Comment Indicates Incomplete Feature

**Severity:** INFO
**Category:** Completeness
**File:** `/Users/chong/hubspot-demo/src/components/meetings/MeetingTypeForm.tsx` (line 157)

**Description:** A `TODO` comment indicates that custom availability is not saved when creating a new meeting type. The create flow passes `createDefaultAvailability: false` but then does not use the response ID to call the availability API.

```typescript
// TODO: Set availability after creation (need meeting type ID from response)
```

**Impact:** Users configure availability in the form but it is discarded on creation. Only edit mode properly saves availability.

---

### I-02: Confirmation Page Claims Email Was Sent

**Severity:** INFO
**Category:** UX / Accuracy
**File:** `/Users/chong/hubspot-demo/src/components/meetings/BookingPage.tsx` (lines 207-209)

**Description:** The confirmation page displays "A confirmation email has been sent to {email}" but no email sending functionality exists in the backend.

```tsx
<p className="text-sm text-gray-500">
  A confirmation email has been sent to {inviteeEmail}
</p>
```

---

### I-03: Share Button Non-Functional

**Severity:** INFO
**Category:** Completeness
**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/meetings/page.tsx` (lines 158-164)

**Description:** The "Share" button on meeting type cards has no `onClick` handler. It renders as an interactive button but does nothing when clicked.

```tsx
<button
  className="flex items-center gap-1 px-3 py-1.5 ..."
  title="Copy booking link"
>
  <ExternalLink className="w-3.5 h-3.5" />
  Share
</button>
// No onClick handler - button does nothing
```

---

## Schema Review

### Schema Quality Assessment

The Prisma schema for the Meeting Scheduler models (`MeetingType`, `MeetingAvailability`, `MeetingBooking`) is well-designed:

**Positives:**
- Proper indexing on `tenantId`, `meetingTypeId`, `startTime`, `status`, `inviteeEmail`
- Unique constraint on `[userId, slug]` for clean booking URLs
- Proper cascade delete on `MeetingAvailability` when parent `MeetingType` is deleted
- `activityId` is marked `@unique` ensuring 1:1 relationship with `Activity`
- Soft delete support via `deletedAt` on `MeetingType`
- JSON fields with sensible defaults (`customFields @default("[]")`, `customResponses @default("{}")`)

**Concerns:**
- `MeetingBooking` lacks a `deletedAt` field, inconsistent with the soft-delete pattern used for other CRM entities
- `MeetingAvailability` lacks a `deletedAt` field (related to H-02 hard delete issue)
- No composite index on `[meetingTypeId, startTime]` for the common booking overlap query
- `dayOfWeek` on `MeetingAvailability` should ideally have a `@db.SmallInt` annotation for storage efficiency

---

## Design System Compliance Matrix

| Design Token | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Primary Color | `#0891b2` | `#0891b2` | PASS |
| Primary Hover | `#0ea5e9` | `#0ea5e9` | PASS |
| Card Border Radius | `rounded-2xl` | `rounded-xl` | DEVIATION |
| Card Border | `border-gray-100` | `border-gray-200` | MINOR DEVIATION |
| Input Padding | `py-2.5` | `py-2` | DEVIATION |
| Focus Ring | `focus:ring-2 focus:ring-cyan-100` | Not present | FAIL |
| Button Shadow | `shadow-lg shadow-cyan-500/25` | Not present | DEVIATION |
| Font Weights | Per spec | Correct | PASS |
| Spacing | 4px base unit | Consistent | PASS |
| Icons | Lucide React | Lucide React | PASS |
| Responsive Grid | `grid-cols-1 md:2 lg:3` | `grid-cols-1 md:2 lg:3` | PASS |

---

## Summary by Category

| Category | CRITICAL | HIGH | MEDIUM | LOW | INFO | Total |
|----------|----------|------|--------|-----|------|-------|
| Security / Auth | 2 | 1 | 1 | 0 | 0 | 4 |
| Security / Validation | 1 | 1 | 0 | 0 | 0 | 2 |
| Security / Tenant | 1 | 1 | 0 | 1 | 0 | 3 |
| Data Integrity | 2 | 2 | 0 | 0 | 0 | 4 |
| Error Handling | 0 | 1 | 1 | 0 | 0 | 2 |
| Performance | 0 | 1 | 0 | 0 | 0 | 1 |
| Design System | 0 | 0 | 1 | 0 | 0 | 1 |
| Accessibility | 0 | 0 | 0 | 1 | 0 | 1 |
| API Design | 0 | 0 | 0 | 1 | 0 | 1 |
| Code Quality | 0 | 0 | 0 | 1 | 0 | 1 |
| Bug | 0 | 0 | 1 | 0 | 0 | 1 |
| Completeness | 0 | 0 | 0 | 0 | 3 | 3 |
| Logic | 0 | 0 | 1 | 0 | 0 | 1 |
| **Total** | **6** | **8** | **5** | **4** | **3** | **26** |

---

## Recommendations Priority

### Immediate (Must Fix Before Merge)
1. **C-01 + C-02 + C-03:** Implement authentication middleware and derive `tenantId` from session.
2. **C-04:** Add Zod validation schemas for all request bodies.
3. **C-05:** Move overlap check inside the transaction for booking creation.
4. **H-05:** Fix MeetingTypeForm to check API response status and save availability on create.
5. **H-06:** Add `deletedAt: null` checks to PATCH and DELETE handlers.

### Short-term (Next Sprint)
6. **C-06:** Add retry logic for slug generation on unique constraint violation.
7. **H-01:** Add ownership verification for mutation operations.
8. **H-02:** Consider soft-delete for availability or accept hard-delete with documentation.
9. **H-07:** Add pagination to meeting types list endpoint.
10. **H-08:** Derive userId from session for reschedule overlap check.
11. **M-02:** Fix timezone handling in slot generation.
12. **M-03:** Add tenant filtering to dashboard server components.

### Medium-term (Backlog)
13. **M-04:** Align input styles with design system specification.
14. **M-05:** Replace `alert()` with inline error state component.
15. **L-01 through L-04:** Code cleanup items.
16. **I-01 through I-03:** Feature completion items.

---

## Conclusion

The Meeting Scheduler implementation demonstrates good architectural decisions (server/client component split, transaction usage for booking+activity creation, proper soft delete on meeting types, clean slug-based URLs). However, it has significant security gaps that are consistent with the project's early development stage -- particularly around authentication, tenant isolation, and input validation. The most urgent concern is the race condition in booking creation (C-05), which can lead to double-bookings even with a single-tenant setup.

The frontend components are well-structured with proper TypeScript interfaces, good UX flow (calendar -> slot selection -> form -> confirmation), and responsive design. The primary frontend issue is the incomplete create flow in `MeetingTypeForm` (H-05/I-01) where custom availability is silently discarded.

Before this feature is production-ready, the CRITICAL and HIGH findings must be addressed. The security issues (C-01 through C-04) should ideally be resolved project-wide, not just for the meetings module.

---

*Report generated: 2026-02-08*
*Reviewed by: QA Code Reviewer*
*Next review: After fixes are applied*
