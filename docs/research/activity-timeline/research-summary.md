# Activity Timeline - Research Summary

> Date: 2026-02-08
> Status: Complete

## Key Decisions

### 1. Timeline UI Approach
**Decision**: Custom Tailwind timeline component (no external library)
- react-vertical-timeline-component is outdated (no React 19 support)
- Enterprise libraries (Syncfusion/KendoReact) too heavy
- Custom component aligns with project's shadcn-style approach
- Full design control matching F-CORE design system

### 2. Activity Types (P0)
5 core types matching existing Prisma model:
| Type | Icon (Lucide) | Color |
|------|---------------|-------|
| Email | `Mail` | blue-600 on blue-50 |
| Call | `Phone` | green-600 on green-50 |
| Meeting | `CalendarDays` | purple-600 on purple-50 |
| Note | `StickyNote` | yellow-600 on yellow-50 |
| Task | `CheckSquare` | orange-600 on orange-50 |

### 3. Timeline Layout
- Left-aligned vertical timeline with 2px gray-200 spine
- Date group headers (Today, Yesterday, day name, Month Day, full date)
- Activity cards with icon badge on spine
- Progressive disclosure: collapsed (2-line preview) → expanded (full content)
- Newest-first ordering

### 4. Data Fetching (P0)
- Regular React state + fetch (consistent with existing components)
- Cursor-based pagination for timeline queries
- "Load more" button at bottom (upgrade to infinite scroll in P1)
- No TanStack Query for now (project doesn't use it yet)

### 5. Activity Logging
- Tabbed form panel (slide-in, same pattern as DealForm)
- Quick-log buttons at top of timeline: Note, Email, Call, Meeting, Task
- Type-specific fields appear based on selected tab
- Associations (contact/company/deal) carried from context

### 6. API Improvements Needed
| Current | Fix |
|---------|-----|
| GET missing tenantId | Add tenantId filter |
| POST uses body.tenantId | Use hardcoded tenantId |
| No PATCH endpoint | Add PATCH /api/activities/[id] |
| No DELETE endpoint | Add DELETE (soft delete) |
| Returns `activity` directly | Wrap in `{ data: ... }` |
| No pagination | Add cursor-based pagination |

## Implementation Priorities

### P0 (This Sprint)
1. Fix API routes (security + CRUD completion)
2. ActivityTimeline component (vertical timeline with date groups)
3. ActivityItem component (collapsed/expanded, type-specific rendering)
4. ActivityForm (tabbed slide-in panel with type fields)
5. Standalone Activities page at /activities
6. Add "Activities" nav item to Sidebar

### P1 (Next Sprint)
- TanStack Query integration for caching/optimistic updates
- Infinite scroll with Intersection Observer
- Activity pinning
- Activity edit history
- Filter bar (by type, owner, date range)
- Integration into contact/company/deal detail pages

### P2 (Future)
- Supabase Realtime for live updates
- Virtualization for 500+ item timelines
- Zod validation on API routes
- Bulk activity import
- Activity search

## Component Architecture

```
src/components/activities/
├── ActivityTimeline.tsx    # Main timeline container with date groups
├── ActivityItem.tsx        # Single activity card (collapsed/expanded)
├── ActivityForm.tsx        # Slide-in form with type tabs
├── ActivityFilters.tsx     # Type filter chips (P0 basic)
└── ActivityIcon.tsx        # Icon+color helper for activity types

src/app/(dashboard)/activities/
└── page.tsx               # Standalone activities page

src/app/api/activities/
├── route.ts               # GET (list + cursor) + POST
└── [id]/
    └── route.ts           # GET + PATCH + DELETE
```

## API Design

### GET /api/activities
```
Params: contactId, companyId, dealId, type, cursor, limit (default 20)
Response: { data: Activity[], meta: { nextCursor, hasMore, total } }
```

### POST /api/activities
```
Body: { type, subject, body, contactId, companyId, dealId, ...typeFields }
Response: { data: Activity }
```

### PATCH /api/activities/[id]
```
Body: { subject?, body?, status?, ...typeFields }
Response: { data: Activity }
```

### DELETE /api/activities/[id]
```
Response: { success: true }
```

## Sources
- Competitive: HubSpot, Salesforce, Pipedrive, Zoho (12+ source references)
- UX: HubSpot UI patterns, Material Design, WCAG 2.1, NNGroup
- Tech: Intersection Observer API, TanStack Query, Prisma patterns
