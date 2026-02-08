# Activity Timeline & Activity Logging - Technical Research

> Date: 2026-02-08
> Author: AI Technical Researcher
> Status: Complete
> Sprint: 2 - Activity Timeline & Logging

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Codebase Audit](#2-codebase-audit)
3. [React Timeline Components](#3-react-timeline-components)
4. [Infinite Scroll & Virtualization](#4-infinite-scroll--virtualization)
5. [Optimistic Updates for Activities](#5-optimistic-updates-for-activities)
6. [Activity Form Patterns](#6-activity-form-patterns)
7. [Cursor-Based Pagination](#7-cursor-based-pagination)
8. [Supabase Realtime Integration](#8-supabase-realtime-integration)
9. [Component Architecture](#9-component-architecture)
10. [API Route Design](#10-api-route-design)
11. [Database Query Patterns](#11-database-query-patterns)
12. [State Management Strategy](#12-state-management-strategy)
13. [Performance Considerations](#13-performance-considerations)
14. [Trade-offs Analysis](#14-trade-offs-analysis)
15. [Implementation Roadmap](#15-implementation-roadmap)

---

## 1. Executive Summary

### Recommended Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Timeline UI | Custom Tailwind components (shadcn-style) | Full control, no bundle bloat, consistent with project aesthetic |
| Infinite Scroll | Intersection Observer API (native) | Zero-dependency, browser-optimized, React 19 compatible |
| Virtualization | `@tanstack/react-virtual` (conditional) | Only needed if timeline exceeds ~500 items; supports dynamic heights |
| Data Fetching | TanStack Query v5 (`useInfiniteQuery`) | Cursor pagination, optimistic updates, cache invalidation built-in |
| Forms | React Hook Form + Zod discriminated unions | Type-safe dynamic forms, minimal re-renders, Zod validation per CLAUDE.md rules |
| Pagination | Cursor-based (createdAt + id composite) | Performant for real-time data, natural fit for "load more" / infinite scroll |
| Realtime | Supabase Realtime (postgres_changes) | Already in stack (`@supabase/supabase-js@2.94.0`), zero additional dependencies |
| State Management | TanStack Query cache + React context for UI state | Server state in TQ, ephemeral UI state (filters, selected tab) in context |

### Why NOT external timeline libraries?

- **react-vertical-timeline-component**: Last meaningful update in 2022, no React 19 support, opinionated styling conflicts with Tailwind v4.
- **Syncfusion/Telerik/KendoReact**: Enterprise-licensed, massive bundle size (200KB+), styling override nightmare with Tailwind.
- **Mantine Timeline**: Would require adopting the full Mantine provider; conflicts with our shadcn-style component strategy.

**Verdict**: Build a custom timeline component using Tailwind CSS + Lucide icons. This aligns with the project's copy-paste component philosophy (shadcn-style), keeps bundle size minimal, and provides full design control matching the F-CORE design system.

---

## 2. Codebase Audit

### 2.1 Activity Model (prisma/schema.prisma, lines 267-329)

The existing schema is well-designed for a polymorphic activity system:

```prisma
model Activity {
  id              String    @id @default(uuid())
  tenantId        String

  // Discriminator
  type            String    // email, call, meeting, note, task

  // Shared fields
  subject         String?
  body            String?   @db.Text

  // Polymorphic associations
  contactId       String?
  companyId       String?
  dealId          String?
  ownerId         String?

  // Type-specific fields (call, meeting, email, task) ...

  metadata        Json      @default("{}")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Indexes on: tenantId, type, contactId, companyId, dealId,
  //             ownerId, createdAt(DESC), dueDate
}
```

**Assessment**: The schema is solid. The composite index `@@index([createdAt(sort: Desc)])` is crucial for cursor-based pagination. However, we need to add a **compound index** for efficient cursor queries:

```prisma
// RECOMMENDED: Add compound index for cursor pagination
@@index([tenantId, createdAt(sort: Desc), id])
```

### 2.2 Existing API (src/app/api/activities/route.ts)

Current state analysis:

| Feature | Status | Issue |
|---------|--------|-------|
| GET - List activities | Exists | Missing `tenantId` filter (SECURITY VIOLATION per CLAUDE.md) |
| GET - Pagination | Partial | Uses `take/limit` only, no cursor support |
| POST - Create activity | Exists | Works but lacks Zod validation |
| PATCH - Update activity | **Missing** | Needed for task completion, editing notes |
| DELETE - Soft delete | **Missing** | Must use `deletedAt` per project rules |
| GET by ID | **Missing** | Needed for activity detail views |

### 2.3 Existing Dependencies (package.json)

Relevant installed packages:
- `@supabase/supabase-js@2.94.0` - Realtime capability available
- `@supabase/ssr@0.8.0` - SSR client available
- `lucide-react@0.563.0` - Icons for timeline items
- `class-variance-authority@0.7.1` - Variant management for timeline items
- `clsx@2.1.1` + `tailwind-merge@3.4.0` - Class merging utilities

**Not installed but recommended**:
- `@tanstack/react-query` - For data fetching, caching, optimistic updates
- `@tanstack/react-virtual` - For virtualization if timeline grows large
- `react-hook-form` + `@hookform/resolvers` - For activity forms
- `zod` - For input validation (required per CLAUDE.md security rules)

---

## 3. React Timeline Components

### 3.1 Research Findings

Three primary approaches to building timeline UIs in React:

#### Approach A: External Library (react-vertical-timeline-component)
- **Pros**: Quick setup, built-in animations
- **Cons**: No React 19 support, styled-components dependency, not Tailwind-native, 15KB gzipped, limited customization for CRM-specific needs (activity type icons, quick actions)
- **Verdict**: REJECTED

#### Approach B: shadcn-style Custom Component
- **Pros**: Full design control, Tailwind-native, copy-paste (no dependency), matches project convention, lightweight (<2KB), supports SSR natively
- **Cons**: Initial build time (~2-3 hours)
- **Verdict**: RECOMMENDED

#### Approach C: Commercial Libraries (Syncfusion, KendoReact)
- **Pros**: Feature-rich, support contracts
- **Cons**: License cost, bundle bloat (200KB+), styling conflicts
- **Verdict**: REJECTED (overkill for this use case)

### 3.2 Recommended Timeline Component Design

A custom vertical timeline with the following anatomy:

```
TimelineContainer
  |-- TimelineFilters (type filter tabs + date range)
  |-- TimelineList
  |     |-- TimelineDateSeparator ("Today", "Yesterday", "Feb 5, 2026")
  |     |-- TimelineItem
  |     |     |-- TimelineConnector (vertical line + dot)
  |     |     |-- TimelineIcon (type-specific: phone, mail, calendar, etc.)
  |     |     |-- TimelineContent
  |     |     |     |-- TimelineHeader (subject + timestamp + owner avatar)
  |     |     |     |-- TimelineBody (body text, truncated with expand)
  |     |     |     |-- TimelineMetadata (call duration, email status, etc.)
  |     |     |     |-- TimelineActions (edit, delete, mark complete)
  |     |-- TimelineItem ...
  |     |-- TimelineLoadMore (intersection observer sentinel)
  |-- TimelineEmpty (zero-state illustration)
```

### 3.3 Activity Type Visual Mapping

```typescript
const ACTIVITY_TYPE_CONFIG = {
  email:   { icon: Mail,     color: 'blue',   label: 'Email' },
  call:    { icon: Phone,    color: 'green',  label: 'Call' },
  meeting: { icon: Calendar, color: 'purple', label: 'Meeting' },
  note:    { icon: FileText, color: 'amber',  label: 'Note' },
  task:    { icon: CheckSquare, color: 'cyan', label: 'Task' },
} as const;
```

---

## 4. Infinite Scroll & Virtualization

### 4.1 Research Findings

Three tiers of infinite list performance, each appropriate for different data volumes:

| Tier | Technique | DOM Nodes | Best For |
|------|-----------|-----------|----------|
| 1 | Simple Intersection Observer | Grows unbounded | < 200 items |
| 2 | Intersection Observer + DOM cleanup | Managed | 200-1000 items |
| 3 | Full virtualization (@tanstack/react-virtual) | Fixed window | 1000+ items |

### 4.2 Recommended Approach: Tier 1 with Tier 3 Escape Hatch

For a CRM activity timeline, the typical dataset per entity (contact/deal/company) is **50-300 activities**. Full virtualization is premature optimization for this range.

**Primary strategy**: Intersection Observer API with a sentinel div at the bottom of the list.

```typescript
// Core infinite scroll hook pattern
function useInfiniteScroll(fetchFn: (cursor: string | null) => Promise<Page>) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' } // Pre-fetch 200px before visible
    );
    observerRef.current.observe(node);
  }, [hasNextPage, isFetching]);

  return { sentinelRef };
}
```

**Integration with TanStack Query**: Use `useInfiniteQuery` which natively manages pages, cursors, and provides `fetchNextPage` / `hasNextPage`:

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['activities', { contactId, type }],
  queryFn: ({ pageParam }) => fetchActivities({ cursor: pageParam, contactId, type }),
  getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
  initialPageParam: null as string | null,
});

// Flatten pages into single array for rendering
const activities = data?.pages.flatMap(page => page.data) ?? [];
```

### 4.3 Virtualization Escape Hatch

If performance degrades (measurable via React DevTools profiler), add `@tanstack/react-virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: activities.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 120, // Estimated item height in px
  overscan: 5,
});
```

**Decision criteria for activating virtualization**:
- Timeline renders > 500 items without scroll performance degradation: No virtualization needed
- Timeline jank detected at > 200 items: Enable virtualization
- Use `React.memo` on TimelineItem first as a cheaper optimization

---

## 5. Optimistic Updates for Activities

### 5.1 Research Findings

TanStack Query v5 provides a mature optimistic update pattern via `useMutation` with `onMutate` / `onError` / `onSettled` lifecycle hooks. The pattern:

1. **onMutate**: Cancel in-flight queries, snapshot current cache, optimistically update cache
2. **onError**: Roll back to snapshot
3. **onSettled**: Invalidate queries to sync with server truth

### 5.2 Recommended Pattern for Activity Mutations

```typescript
// hooks/useCreateActivity.ts
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newActivity: CreateActivityInput) =>
      fetch('/api/activities', {
        method: 'POST',
        body: JSON.stringify(newActivity),
      }).then(res => res.json()),

    onMutate: async (newActivity) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['activities', { contactId: newActivity.contactId }],
      });

      // 2. Snapshot previous data
      const previousData = queryClient.getQueriesData({
        queryKey: ['activities'],
      });

      // 3. Optimistically insert at top of timeline
      queryClient.setQueriesData(
        { queryKey: ['activities', { contactId: newActivity.contactId }] },
        (old: InfiniteData<ActivitiesPage> | undefined) => {
          if (!old) return old;
          const optimisticActivity = {
            ...newActivity,
            id: `optimistic-${Date.now()}`,
            createdAt: new Date().toISOString(),
            _optimistic: true, // Flag for UI styling
          };
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0
                ? { ...page, data: [optimisticActivity, ...page.data] }
                : page
            ),
          };
        }
      );

      return { previousData };
    },

    onError: (_err, _newActivity, context) => {
      // 4. Roll back on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: (_data, _error, variables) => {
      // 5. Always refetch to sync
      queryClient.invalidateQueries({
        queryKey: ['activities', { contactId: variables.contactId }],
      });
    },
  });
}
```

### 5.3 Optimistic UI Indicators

Activities with `_optimistic: true` render with:
- A subtle pulsing animation or reduced opacity (0.7)
- A spinner icon replacing the activity type icon
- No action buttons (edit/delete) until confirmed by server

### 5.4 Task Completion Optimistic Update

```typescript
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      fetch(`/api/activities/${taskId}/complete`, { method: 'PATCH' })
        .then(res => res.json()),

    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['activities'] });
      const previous = queryClient.getQueriesData({ queryKey: ['activities'] });

      // Optimistically mark as completed
      queryClient.setQueriesData(
        { queryKey: ['activities'] },
        (old: InfiniteData<ActivitiesPage> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(activity =>
                activity.id === taskId
                  ? { ...activity, status: 'completed', completedAt: new Date().toISOString() }
                  : activity
              ),
            })),
          };
        }
      );

      return { previous };
    },

    onError: (_err, _taskId, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
```

---

## 6. Activity Form Patterns

### 6.1 Research Findings

The challenge: A single "Log Activity" form that dynamically changes fields based on the selected activity type (email, call, meeting, note, task). TypeScript discriminated unions provide the type-safe solution.

### 6.2 Recommended Pattern: Zod Discriminated Union + React Hook Form

#### Step 1: Define Zod schemas per activity type

```typescript
// lib/validators/activity.ts
import { z } from 'zod';

const baseActivitySchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().optional(),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
});

const noteSchema = baseActivitySchema.extend({
  type: z.literal('note'),
});

const emailSchema = baseActivitySchema.extend({
  type: z.literal('email'),
  emailTo: z.string().email('Invalid email').min(1),
  emailCc: z.string().optional(),
  emailBcc: z.string().optional(),
});

const callSchema = baseActivitySchema.extend({
  type: z.literal('call'),
  callDirection: z.enum(['inbound', 'outbound']),
  callOutcome: z.enum(['connected', 'left_voicemail', 'no_answer', 'busy']),
  callDuration: z.number().int().min(0).optional(),
});

const meetingSchema = baseActivitySchema.extend({
  type: z.literal('meeting'),
  meetingStart: z.string().datetime(),
  meetingEnd: z.string().datetime(),
  meetingLocation: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
});

const taskSchema = baseActivitySchema.extend({
  type: z.literal('task'),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
});

export const activitySchema = z.discriminatedUnion('type', [
  noteSchema,
  emailSchema,
  callSchema,
  meetingSchema,
  taskSchema,
]);

export type ActivityFormData = z.infer<typeof activitySchema>;
export type ActivityType = ActivityFormData['type'];
```

#### Step 2: Dynamic form component

```typescript
// components/activities/ActivityForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activitySchema, ActivityFormData, ActivityType } from '@/lib/validators/activity';

export function ActivityForm({ onSubmit, defaultType = 'note' }: Props) {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { type: defaultType },
  });

  const activityType = form.watch('type');

  // Reset type-specific fields when type changes
  const handleTypeChange = (newType: ActivityType) => {
    form.reset({
      type: newType,
      subject: form.getValues('subject'), // Preserve shared fields
      body: form.getValues('body'),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Type selector tabs */}
      <TypeTabs value={activityType} onChange={handleTypeChange} />

      {/* Shared fields always visible */}
      <Input {...form.register('subject')} placeholder="Subject" />
      <Textarea {...form.register('body')} placeholder="Details..." />

      {/* Conditional type-specific fields */}
      {activityType === 'email' && <EmailFields form={form} />}
      {activityType === 'call' && <CallFields form={form} />}
      {activityType === 'meeting' && <MeetingFields form={form} />}
      {activityType === 'task' && <TaskFields form={form} />}
      {/* 'note' has no extra fields */}

      <Button type="submit">Log Activity</Button>
    </form>
  );
}
```

### 6.3 Form UX Pattern: Slide Panel

Following HubSpot's UX, the activity form should open as a **slide-over panel** from the right side, not a modal dialog. This allows the user to reference the contact/deal information on the left while filling in the form.

```
+------------------------------------------+
|  Contact: John Doe     | [Activity Form] |
|  +------------------+  | Type: [Call]    |
|  | Timeline         |  | Subject: ___   |
|  | - Email sent...  |  | Outcome: ___   |
|  | - Call logged...  |  | Duration: ___  |
|  +------------------+  | [Save] [Cancel] |
+------------------------------------------+
```

---

## 7. Cursor-Based Pagination

### 7.1 Research Findings

**Offset pagination** (`SKIP N LIMIT M`) has fundamental problems for timeline data:

1. **Performance**: PostgreSQL must scan and discard N rows. At offset 10,000+, this becomes noticeably slow.
2. **Consistency**: If new activities are inserted while paginating, items shift and can be duplicated or skipped.
3. **Real-time conflict**: New activities push older items down, causing phantom duplicates when paginating.

**Cursor pagination** (`WHERE createdAt < cursor ORDER BY createdAt DESC LIMIT M`) solves all three:

1. **Performance**: Uses B-tree index scan directly; O(log n) regardless of page depth.
2. **Consistency**: Cursor position is absolute; new inserts don't affect pagination of older items.
3. **Real-time friendly**: New items appear at the top; cursor-based pages below remain stable.

### 7.2 Cursor Design

Since `createdAt` is not guaranteed to be unique (two activities could be created in the same millisecond), we use a **compound cursor** of `(createdAt, id)`:

```typescript
// Cursor encoding/decoding
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
  const [isoDate, id] = decoded.split('|');
  return { createdAt: new Date(isoDate), id };
}
```

### 7.3 Prisma Cursor Query

```typescript
// Using Prisma's built-in cursor pagination
async function getActivities({
  tenantId,
  cursor,
  limit = 20,
  contactId,
  type,
}: ActivityQueryParams) {
  const activities = await prisma.activity.findMany({
    where: {
      tenantId,  // MANDATORY per CLAUDE.md security rules
      ...(contactId && { contactId }),
      ...(type && { type }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,  // Fetch one extra to determine hasNextPage
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,  // Skip the cursor item itself
    }),
    include: {
      owner: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } },
    },
  });

  const hasNextPage = activities.length > limit;
  const items = hasNextPage ? activities.slice(0, limit) : activities;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return {
    data: items,
    meta: {
      nextCursor,
      hasNextPage,
    },
  };
}
```

### 7.4 Why Prisma's Built-In Cursor Over Raw SQL

Prisma's `cursor` / `skip` / `take` directly maps to efficient SQL:

```sql
-- Generated SQL for cursor pagination
SELECT * FROM "Activity"
WHERE "tenantId" = $1
  AND "createdAt" <= (SELECT "createdAt" FROM "Activity" WHERE "id" = $cursor)
  AND ("createdAt" < (SELECT "createdAt" FROM "Activity" WHERE "id" = $cursor)
       OR "id" < $cursor)
ORDER BY "createdAt" DESC
LIMIT $limit;
```

This leverages the `@@index([tenantId, createdAt(sort: Desc), id])` compound index we recommended adding.

---

## 8. Supabase Realtime Integration

### 8.1 Research Findings

Supabase Realtime uses PostgreSQL's Write-Ahead Log (WAL) via logical replication to stream database changes to connected clients over WebSockets. The feature is already available in the project via `@supabase/supabase-js@2.94.0`.

**Key considerations**:
- Each subscriber triggers a read operation per change event (for RLS checks)
- For 100 subscribers watching 1 table, 1 INSERT = 100 reads
- Filter subscriptions by relevant columns to reduce load

### 8.2 Recommended Realtime Hook

```typescript
// hooks/useActivityRealtime.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useActivityRealtime(entityFilter: {
  contactId?: string;
  companyId?: string;
  dealId?: string;
}) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Build filter string for the subscription
    const filterParts: string[] = [];
    if (entityFilter.contactId) {
      filterParts.push(`contactId=eq.${entityFilter.contactId}`);
    }
    if (entityFilter.companyId) {
      filterParts.push(`companyId=eq.${entityFilter.companyId}`);
    }
    if (entityFilter.dealId) {
      filterParts.push(`dealId=eq.${entityFilter.dealId}`);
    }

    const channel: RealtimeChannel = supabase
      .channel(`activities-${Object.values(entityFilter).filter(Boolean).join('-')}`)
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'Activity',
          ...(filterParts.length === 1 && { filter: filterParts[0] }),
        },
        (payload) => {
          // Instead of manually updating cache, invalidate to refetch
          // This is safer than trying to merge realtime payloads
          queryClient.invalidateQueries({
            queryKey: ['activities', entityFilter],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityFilter.contactId, entityFilter.companyId, entityFilter.dealId]);
}
```

### 8.3 Realtime Strategy: Invalidation vs Direct Cache Update

| Strategy | Pros | Cons |
|----------|------|------|
| **Invalidation** (recommended) | Simple, always consistent, handles complex includes | Extra network round-trip for refetch |
| **Direct cache update** | Instant, no extra fetch | Payload doesn't include `include` relations; must manually hydrate owner, contact, etc. |

**Recommendation**: Use **invalidation** for simplicity and correctness. The refetch is fast because cursor-based queries hit the index. If the extra latency (typically <100ms) is noticeable, we can add a direct cache update later as an optimization.

### 8.4 Supabase Realtime Prerequisites

1. Enable Realtime on the `Activity` table in Supabase Dashboard:
   - Go to Database > Tables > Activity > Enable Realtime
   - Or run: `ALTER PUBLICATION supabase_realtime ADD TABLE "Activity";`

2. Ensure RLS policies are set (Supabase checks RLS per subscriber):
   ```sql
   CREATE POLICY "Users can view activities in their tenant"
     ON "Activity" FOR SELECT
     USING (tenant_id = auth.jwt() ->> 'tenant_id');
   ```

---

## 9. Component Architecture

### 9.1 File Tree

```
src/
  components/
    activities/
      ActivityTimeline.tsx           # Main container (server component wrapper)
      ActivityTimelineClient.tsx     # Client component with data fetching
      TimelineItem.tsx               # Single activity item (memoized)
      TimelineItemSkeleton.tsx       # Loading skeleton
      TimelineDateSeparator.tsx      # "Today", "Yesterday", etc.
      TimelineFilters.tsx            # Type filter tabs + date range
      TimelineEmpty.tsx              # Zero-state
      ActivityForm.tsx               # Log activity slide panel
      ActivityFormFields/
        EmailFields.tsx              # Email-specific form fields
        CallFields.tsx               # Call-specific form fields
        MeetingFields.tsx            # Meeting-specific form fields
        TaskFields.tsx               # Task-specific form fields
      ActivityActions.tsx            # Edit, delete, complete actions
      ActivityTypeIcon.tsx           # Icon + color by activity type

  hooks/
    activities/
      useActivities.ts              # useInfiniteQuery wrapper
      useCreateActivity.ts          # Mutation with optimistic update
      useUpdateActivity.ts          # PATCH mutation
      useDeleteActivity.ts          # Soft delete mutation
      useCompleteTask.ts            # Task completion mutation
      useActivityRealtime.ts        # Supabase realtime subscription

  lib/
    validators/
      activity.ts                   # Zod schemas (discriminated union)

  app/
    api/
      activities/
        route.ts                    # GET (list, cursor pagination), POST (create)
        [id]/
          route.ts                  # GET (by id), PATCH (update), DELETE (soft delete)
          complete/
            route.ts                # PATCH (task completion shortcut)
```

### 9.2 Component Dependency Graph

```
ActivityTimeline (server)
  |
  +-- ActivityTimelineClient (client)
       |
       +-- TimelineFilters
       |     |-- TypeTab (email | call | meeting | note | task | all)
       |     |-- DateRangePicker
       |
       +-- TimelineList (virtual scroll container)
       |     |-- TimelineDateSeparator
       |     |-- TimelineItem (React.memo)
       |     |     |-- ActivityTypeIcon
       |     |     |-- TimelineContent
       |     |     |-- ActivityActions
       |     |     |     |-- EditButton -> opens ActivityForm
       |     |     |     |-- DeleteButton -> useDeleteActivity
       |     |     |     |-- CompleteButton -> useCompleteTask (task only)
       |     |-- sentinel div (Intersection Observer)
       |
       +-- ActivityForm (slide panel)
       |     |-- TypeTabs
       |     |-- Shared fields (subject, body)
       |     |-- EmailFields | CallFields | MeetingFields | TaskFields
       |
       +-- TimelineEmpty
```

---

## 10. API Route Design

### 10.1 Endpoint Specifications

#### GET /api/activities

List activities with cursor-based pagination.

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `cursor` | string | No | null | Cursor for pagination (activity ID) |
| `limit` | number | No | 20 | Items per page (max 100) |
| `contactId` | string | No | - | Filter by contact |
| `companyId` | string | No | - | Filter by company |
| `dealId` | string | No | - | Filter by deal |
| `type` | string | No | - | Filter by activity type |
| `ownerId` | string | No | - | Filter by owner |

**Response Shape**:
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "call",
      "subject": "Follow-up call",
      "body": "Discussed Q3 pipeline...",
      "createdAt": "2026-02-08T10:30:00Z",
      "owner": { "id": "uuid", "name": "John" },
      "contact": { "id": "uuid", "firstName": "Jane", "lastName": "Doe" },
      "company": { "id": "uuid", "name": "Acme Corp" },
      "deal": null,
      "callDuration": 300,
      "callOutcome": "connected",
      "callDirection": "outbound",
      "_meta": {
        "typeConfig": { "icon": "phone", "color": "green", "label": "Call" }
      }
    }
  ],
  "meta": {
    "nextCursor": "base64-encoded-cursor-or-null",
    "hasNextPage": true,
    "total": 142
  }
}
```

#### POST /api/activities

Create a new activity. Body validated with Zod discriminated union.

**Request Body**: Matches `ActivityFormData` Zod schema (type-discriminated).

**Response**: `201 Created` with the created activity object.

#### GET /api/activities/[id]

Get a single activity by ID.

**Response**: Single activity object.

#### PATCH /api/activities/[id]

Update an activity. Validates that the activity belongs to the current tenant.

**Request Body**: Partial activity fields.

**Response**: Updated activity object.

#### DELETE /api/activities/[id]

Soft-delete an activity (sets `deletedAt`). Validates tenant ownership.

**Response**: `200 OK` with `{ success: true }`.

#### PATCH /api/activities/[id]/complete

Shortcut endpoint for completing a task. Sets `status: 'completed'` and `completedAt: now()`.

**Response**: Updated activity object.

### 10.2 Error Response Shape

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Subject is required",
    "details": [
      { "field": "subject", "message": "Required" }
    ]
  }
}
```

---

## 11. Database Query Patterns

### 11.1 Timeline Query with Cursor Pagination (Prisma)

```typescript
// Most common query: contact's activity timeline
const result = await prisma.activity.findMany({
  where: {
    tenantId,            // ALWAYS enforced
    contactId,
    deletedAt: null,     // Exclude soft-deleted
    ...(type && { type }),
  },
  orderBy: [
    { createdAt: 'desc' },
    { id: 'desc' },     // Tiebreaker for same-millisecond entries
  ],
  take: limit + 1,
  ...(cursor && {
    cursor: { id: cursor },
    skip: 1,
  }),
  include: {
    owner: { select: { id: true, name: true } },
    contact: { select: { id: true, firstName: true, lastName: true } },
    company: { select: { id: true, name: true } },
    deal: { select: { id: true, name: true } },
  },
});
```

### 11.2 Activity Count by Type (for filter badges)

```typescript
// Get counts per type for filter tab badges
const typeCounts = await prisma.activity.groupBy({
  by: ['type'],
  where: {
    tenantId,
    contactId,
    deletedAt: null,
  },
  _count: true,
});

// Result: [{ type: 'email', _count: 23 }, { type: 'call', _count: 15 }, ...]
```

### 11.3 Upcoming Tasks Query

```typescript
// Tasks due soon (for task widget)
const upcomingTasks = await prisma.activity.findMany({
  where: {
    tenantId,
    type: 'task',
    status: 'pending',
    deletedAt: null,
    dueDate: {
      gte: new Date(),
      lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
    },
  },
  orderBy: { dueDate: 'asc' },
  take: 10,
  include: {
    contact: { select: { id: true, firstName: true, lastName: true } },
    owner: { select: { id: true, name: true } },
  },
});
```

### 11.4 Activity Feed Across All Entities (Global Feed)

```typescript
// Global activity feed for dashboard
const globalFeed = await prisma.activity.findMany({
  where: {
    tenantId,
    deletedAt: null,
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  include: {
    owner: { select: { id: true, name: true } },
    contact: { select: { id: true, firstName: true, lastName: true } },
    company: { select: { id: true, name: true } },
    deal: { select: { id: true, name: true } },
  },
});
```

### 11.5 Recommended Index Addition

Add to `prisma/schema.prisma` in the Activity model:

```prisma
// Existing indexes are good, but add compound index for cursor queries:
@@index([tenantId, contactId, createdAt(sort: Desc)])
@@index([tenantId, companyId, createdAt(sort: Desc)])
@@index([tenantId, dealId, createdAt(sort: Desc)])
@@index([tenantId, type, createdAt(sort: Desc)])
```

These compound indexes cover the most common access patterns:
- "All activities for this contact, newest first" (timeline view)
- "All activities for this company, newest first"
- "All activities for this deal, newest first"
- "All calls for this tenant, newest first" (filtered view)

---

## 12. State Management Strategy

### 12.1 Architecture Decision

```
+----------------------------------------------------------+
|                     State Layers                          |
+----------------------------------------------------------+
|                                                           |
|  Server State (TanStack Query)                           |
|  +-------------------------------------------------+     |
|  | queryKey: ['activities', filters]                |     |
|  | useInfiniteQuery for paginated timeline          |     |
|  | useMutation for create/update/delete             |     |
|  | Optimistic updates via onMutate                  |     |
|  | Cache invalidation on mutation success           |     |
|  | Realtime invalidation via Supabase subscription  |     |
|  +-------------------------------------------------+     |
|                                                           |
|  UI State (React Context - ActivityTimelineContext)       |
|  +-------------------------------------------------+     |
|  | activeFilter: ActivityType | 'all'               |     |
|  | isFormOpen: boolean                               |     |
|  | editingActivity: Activity | null                  |     |
|  | selectedActivityId: string | null                 |     |
|  +-------------------------------------------------+     |
|                                                           |
|  Form State (React Hook Form - scoped to ActivityForm)   |
|  +-------------------------------------------------+     |
|  | Managed entirely within ActivityForm component   |     |
|  | Zod validation via zodResolver                   |     |
|  | form.watch('type') drives conditional fields     |     |
|  +-------------------------------------------------+     |
|                                                           |
+----------------------------------------------------------+
```

### 12.2 Query Key Strategy

```typescript
// Query key factory for consistent key management
const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters: ActivityFilters) => [...activityKeys.lists(), filters] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
  counts: (entityId: string) => [...activityKeys.all, 'counts', entityId] as const,
};
```

### 12.3 Why NOT Zustand/Redux

- **Server state**: TanStack Query handles caching, background refetching, pagination, optimistic updates. Adding Zustand for server state would create a dual-cache problem.
- **UI state**: The activity timeline's UI state (filters, open panels) is local to the timeline feature. React Context is sufficient and avoids another dependency.
- **Form state**: React Hook Form manages its own state. No external store needed.

---

## 13. Performance Considerations

### 13.1 Rendering Performance

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| `React.memo` on TimelineItem | `export const TimelineItem = memo(function TimelineItem(...) {...})` | Prevents re-render when parent re-renders but item data hasn't changed |
| Stable callback refs | `useCallback` for intersection observer ref | Prevents observer recreation on every render |
| Flat list vs nested pages | `data.pages.flatMap(p => p.data)` memoized with `useMemo` | Single array computation cached between renders |
| Date separator memoization | Compute date groups in `useMemo` | Avoid re-computing date boundaries on every render |
| Lazy load activity form | `dynamic(() => import('./ActivityForm'), { ssr: false })` | Form code split; only loaded when user clicks "Log Activity" |

### 13.2 Network Performance

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| Cursor pagination | 20 items per page, load more on scroll | Constant page load time regardless of dataset size |
| Selective includes | Only `select` needed relation fields | Reduce payload size by ~40% vs full includes |
| Stale-while-revalidate | TanStack Query `staleTime: 30_000` (30s) | Avoid redundant refetches on tab switches |
| Request deduplication | TanStack Query built-in | Multiple components requesting same data = 1 network call |
| Prefetching | `queryClient.prefetchInfiniteQuery` on hover | Anticipate user navigation for instant page loads |

### 13.3 Database Performance

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| Compound indexes | `@@index([tenantId, contactId, createdAt(sort: Desc)])` | Index-only scans for timeline queries |
| Cursor pagination | `cursor: { id }, skip: 1, take: limit` | O(log n) vs O(n) for offset pagination |
| Selective loading | `select` instead of full model load | Reduce data transfer from DB |
| Count optimization | `groupBy` for type counts instead of multiple `count()` calls | Single query for all filter badges |
| Connection pooling | PrismaClient singleton with pg Pool (already configured) | Reuse connections across requests |

### 13.4 Bundle Size Budget

| Package | Gzipped Size | Justification |
|---------|-------------|---------------|
| `@tanstack/react-query` | ~13KB | Essential for data fetching strategy |
| `react-hook-form` | ~9KB | Performant forms (zero re-renders on input) |
| `zod` | ~13KB | Required by CLAUDE.md for input validation |
| `@hookform/resolvers` | ~2KB | Connects Zod to RHF |
| `@tanstack/react-virtual` | ~3KB | Only if virtualization needed |
| **Total** | **~40KB** | Acceptable for CRM application |

---

## 14. Trade-offs Analysis

### 14.1 Custom Timeline vs Library

| Factor | Custom (Recommended) | Library |
|--------|---------------------|---------|
| Bundle size | 0 KB (just Tailwind) | 15-200 KB |
| Design control | Full | Limited by library API |
| Maintenance | Self-maintained | Dependency updates |
| Time to build | 3-4 hours | 1 hour setup + hours of customization |
| React 19 support | Guaranteed | Often lagging |
| Accessibility | Must implement (ARIA roles) | Usually built-in |
| **Verdict** | **Better for this project** | Better for prototypes |

### 14.2 TanStack Query vs SWR vs Manual Fetching

| Factor | TanStack Query (Recommended) | SWR | Manual (fetch + useState) |
|--------|------------------------------|-----|--------------------------|
| Infinite queries | First-class `useInfiniteQuery` | Basic `useSWRInfinite` | Complex custom implementation |
| Optimistic updates | Built-in `onMutate` lifecycle | Manual cache manipulation | Entirely custom |
| Devtools | Excellent devtools panel | Basic | None |
| Bundle size | ~13KB | ~4KB | 0 KB |
| Learning curve | Moderate | Low | None (but high for edge cases) |
| **Verdict** | **Best for complex CRM needs** | Good for simpler apps | Not viable for this scope |

### 14.3 Cursor vs Offset Pagination

| Factor | Cursor (Recommended) | Offset |
|--------|---------------------|--------|
| Performance at depth | O(log n) always | O(n) at deep offsets |
| Consistency with real-time data | Stable (no phantom duplicates) | Unstable (items shift) |
| "Jump to page X" | Not possible | Possible |
| Implementation complexity | Slightly higher | Simple |
| Prisma support | Built-in cursor/skip/take | Built-in skip/take |
| **Verdict** | **Correct choice for timeline** | Only for paginated tables |

### 14.4 Realtime Strategy: Invalidation vs Direct Cache Merge

| Factor | Invalidation (Recommended) | Direct Cache Merge |
|--------|---------------------------|-------------------|
| Correctness | Always correct (refetches full shape) | Risk of stale/partial data |
| Complexity | Low (1 line: `invalidateQueries`) | High (manual cache surgery) |
| Latency | ~100-200ms refetch delay | Near-instant |
| Includes/relations | Automatically hydrated | Must manually join |
| **Verdict** | **Start here, optimize later** | Upgrade path if needed |

---

## 15. Implementation Roadmap

### Phase 1: Foundation (Day 1)

1. Install dependencies: `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`
2. Set up `QueryClientProvider` in app layout
3. Add compound indexes to Prisma schema and run migration
4. Fix GET `/api/activities` to enforce `tenantId`
5. Implement cursor-based pagination in GET endpoint
6. Create Zod validation schemas for activities

### Phase 2: API Completion (Day 2)

1. Create PATCH `/api/activities/[id]` endpoint
2. Create DELETE `/api/activities/[id]` endpoint (soft delete)
3. Create GET `/api/activities/[id]` endpoint
4. Create PATCH `/api/activities/[id]/complete` endpoint
5. Add Zod validation to POST endpoint
6. Add error response standardization

### Phase 3: Timeline UI (Day 3-4)

1. Build `TimelineItem` component with type-based styling
2. Build `ActivityTypeIcon` component
3. Build `TimelineDateSeparator` component
4. Build `TimelineFilters` component (type tabs)
5. Build `ActivityTimelineClient` with `useInfiniteQuery` + Intersection Observer
6. Build `TimelineEmpty` and `TimelineItemSkeleton`
7. Integrate timeline into Contact detail page

### Phase 4: Activity Form (Day 5)

1. Build `ActivityForm` with React Hook Form + Zod resolver
2. Build type-specific field components (EmailFields, CallFields, etc.)
3. Build slide panel container for form
4. Wire up `useCreateActivity` with optimistic updates
5. Wire up edit mode for `useUpdateActivity`

### Phase 5: Polish & Realtime (Day 6)

1. Enable Supabase Realtime on Activity table
2. Implement `useActivityRealtime` hook
3. Add task completion UI with optimistic update
4. Add soft delete UI with confirmation dialog
5. Performance testing and optimization
6. Accessibility audit (ARIA roles, keyboard navigation)

---

## Appendix A: Key External References

- [TanStack Query Optimistic Updates](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates)
- [Prisma Cursor-Based Pagination](https://www.prisma.io/docs/orm/prisma-client/queries/pagination#cursor-based-pagination)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Intersection Observer API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [React Hook Form with Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

## Appendix B: HubSpot Activity Timeline Reference

HubSpot's activity timeline features observed during research:
- Vertical timeline with left-aligned dots and connector lines
- Activity type icons with color coding (blue for email, green for call, etc.)
- Collapsible body text with "Show more" for long entries
- Inline quick actions (edit, delete) on hover
- Filter tabs at the top: All, Notes, Emails, Calls, Tasks, Meetings
- Date group headers ("Today", "Yesterday", "Feb 5, 2026")
- "Log activity" button opens right slide panel
- Task checkbox for inline completion
- Activity count badges on filter tabs
