# Meeting Scheduler - Research Synthesis
> Feature: Meeting Scheduler (#7)
> Date: 2026-02-08
> Status: COMPLETE

---

## Executive Summary

Meeting Scheduler is Item #7 in the F-CORE Master Plan (P1 priority, Medium complexity, Sales Hub). Research across competitors (HubSpot, Calendly, Salesforce, Pipedrive), UX patterns, and technical architecture confirms this feature is well-scoped for implementation.

---

## Key Decisions

### 1. Data Model
- **3 new models**: `MeetingType`, `MeetingAvailability`, `MeetingBooking`
- **Reuse Activity model**: Each booking creates an Activity (type: "meeting") for timeline
- **Relations**: MeetingBooking links to Contact, Company, Deal, Activity
- **Soft delete**: All models use `deletedAt` pattern

### 2. URL Structure
- **Admin pages**: `/meetings` (dashboard), `/meetings/new` (create type)
- **Public booking**: `/book/[userId]/[slug]` (outside dashboard layout)
- **Slug-based**: Each meeting type has a unique slug per user

### 3. Overlap Prevention
- **Application-level**: Use Prisma transactions to check-then-create
- **No EXCLUDE constraints**: Prisma doesn't support them natively
- **Buffer times**: Include buffer before/after in overlap checks

### 4. Timezone Strategy
- **Storage**: All times in UTC
- **Availability**: Time strings + IANA timezone (e.g., "09:00" + "Asia/Ho_Chi_Minh")
- **Display**: Auto-detect visitor timezone via `Intl` API
- **Library**: `date-fns` + `date-fns-tz` (lightweight, tree-shakeable)

### 5. Scope for MVP
| Include | Exclude (Phase 2) |
|---------|-------------------|
| Meeting types CRUD | Round Robin assignment |
| Availability management | Calendar sync (Google/O365) |
| Public booking pages | Email reminders |
| Time slot generation | Embed widgets |
| CRM auto-association | Booking analytics |
| Timezone handling | Routing forms |
| Cancel/reschedule | Group meetings |

---

## Architecture Overview

```
Public Booking Flow:
  Visitor → /book/[userId]/[slug]
    → GET available dates (API)
    → GET time slots for date (API)
    → POST create booking (API)
    → Confirmation page
    → Activity + Contact created in CRM

Admin Flow:
  User → /meetings
    → List meeting types
    → Create/edit meeting type
    → Set availability
    → View upcoming bookings
    → Manage bookings (cancel, mark complete)
```

---

## Implementation Approach

### Phase 1: Database (Task #137)
1. Add MeetingType, MeetingAvailability, MeetingBooking to Prisma schema
2. Update User, Tenant, Contact, Company, Deal, Activity with new relations
3. Run migration
4. Update seed data with sample meeting types + bookings

### Phase 2: Backend API (Task #137)
1. Private API routes for meeting type CRUD
2. Private API routes for availability management
3. Private API routes for booking management
4. Public API routes for booking flow (slots, create booking)
5. CRM association logic (auto-create contact + activity)

### Phase 3: Frontend (Task #138)
1. Meetings list page (`/meetings`)
2. Meeting type create/edit form
3. Availability editor component
4. Upcoming bookings view
5. Public booking page (`/book/[userId]/[slug]`)
6. Calendar date picker component
7. Time slot picker component
8. Booking form component
9. Confirmation page
10. Add "Meetings" to sidebar navigation

### Phase 4: Integration (Task #139)
1. End-to-end booking flow testing
2. CRM association verification
3. Timezone edge cases
4. Mobile responsive polish
5. Error states and edge cases

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Timezone bugs | Use date-fns-tz consistently, store UTC only |
| Race conditions (double booking) | Prisma transactions with overlap check |
| Large number of time slots | Paginate by date, lazy-load slots |
| Mobile UX complexity | Progressive disclosure, step-by-step flow |
| Schema migration conflicts | Branch from main, careful merge |

---

## References
- `docs/research/meeting-scheduler/competitive-analysis.md`
- `docs/research/meeting-scheduler/ux-patterns.md`
- `docs/research/meeting-scheduler/tech-research.md`
