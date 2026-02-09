# Ticketing System - Technical Architecture Research

> **Project:** F-CORE (HubSpot CRM Clone)
> **Module:** Service Hub - Ticketing System
> **Stack:** Next.js 16, TypeScript, Prisma 7.x, PostgreSQL (Supabase), Tailwind CSS v4
> **Date:** 2026-02-09
> **Priority:** P2 (per MASTER_PLAN.md Feature Priority Matrix)
> **Status:** Research Complete

---

## Table of Contents

1. [Database Schema Design](#1-database-schema-design)
2. [API Route Design](#2-api-route-design)
3. [Ticket Numbering System](#3-ticket-numbering-system)
4. [SLA Calculation Algorithm](#4-sla-calculation-algorithm)
5. [Search and Filtering](#5-search-and-filtering)
6. [Performance Considerations](#6-performance-considerations)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Database Schema Design

### 1.1 Design Principles

Following the existing F-CORE patterns established in `prisma/schema.prisma`:

- **UUIDs** for all primary keys (`@id @default(uuid())`)
- **Multi-tenancy** via `tenantId` on every entity with `@@index([tenantId])`
- **Soft delete** via `deletedAt DateTime?` on all CRM entities
- **Audit columns**: `createdAt`, `updatedAt`, `deletedAt`
- **JSON fields** for flexible/custom properties (`@default("{}")`)
- **Consistent relation patterns** matching Contact, Company, Deal models

### 1.2 Entity-Relationship Diagram

```
┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   TicketPipeline │     │       Ticket          │     │   TicketSLAPolicy│
│                  │◄────│                       │────►│                  │
│ - id             │     │ - id                  │     │ - id             │
│ - tenantId       │     │ - ticketNumber        │     │ - tenantId       │
│ - name           │     │ - title               │     │ - name           │
│ - isDefault      │     │ - description         │     │ - priority       │
│ - deletedAt      │     │ - priority            │     │ - firstResponse  │
│                  │     │ - status              │     │ - nextResponse   │
│   stages[] ─────►│     │ - category            │     │ - resolutionTime │
│                  │     │ - source              │     │ - businessHours  │
└──────────────────┘     │ - tenantId            │     │ - isActive       │
                         │ - contactId ──────────│──►  └──────────────────┘
┌──────────────────┐     │ - companyId ──────────│──►
│TicketPipelineStage│    │ - assignedToUserId    │
│                  │◄────│ - createdById         │
│ - id             │     │ - pipelineId          │     ┌──────────────────┐
│ - pipelineId     │     │ - stageId             │     │  TicketComment   │
│ - name           │     │ - slaId               │     │                  │
│ - displayOrder   │     │ - dueDate             │◄────│ - id             │
│ - type           │     │ - firstResponseAt     │     │ - ticketId       │
│ - color          │     │ - resolvedAt          │     │ - authorId       │
│ - deletedAt      │     │ - closedAt            │     │ - content        │
└──────────────────┘     │ - tags                │     │ - isInternal     │
                         │ - customFields        │     │ - attachments    │
┌──────────────────┐     │ - deletedAt           │     │ - deletedAt      │
│  TicketActivity  │     └──────────────────────-┘     └──────────────────┘
│                  │              │
│ - id             │◄─────────────┘
│ - ticketId       │
│ - tenantId       │
│ - type           │
│ - field          │
│ - oldValue       │
│ - newValue       │
│ - performedById  │
└──────────────────┘
```

### 1.3 Prisma Schema Definitions

#### Ticket (Core Entity)

```prisma
model Ticket {
  id                String    @id @default(uuid())
  tenantId          String

  // Ticket Identity
  ticketNumber      Int                           // Sequential per tenant: displayed as T-0001
  title             String
  description       String?   @db.Text            // Rich text (HTML/Markdown)

  // Classification
  priority          String    @default("medium")  // low, medium, high, urgent
  status            String    @default("open")    // Derived from stage type, kept for quick filtering
  category          String?                       // bug, feature_request, question, billing, etc.
  source            String    @default("web")     // web, email, chat, phone, api

  // Associations
  contactId         String?
  companyId         String?
  assignedToUserId  String?
  createdById       String?

  // Pipeline
  pipelineId        String
  stageId           String

  // SLA
  slaId             String?
  dueDate           DateTime?                     // SLA-calculated resolution deadline

  // SLA Timestamps
  firstResponseAt   DateTime?                     // When first public response was sent
  resolvedAt        DateTime?                     // When moved to "resolved" stage
  closedAt          DateTime?                     // When moved to "closed" stage

  // Flexible fields
  tags              String[]  @default([])        // PostgreSQL array type
  customFields      Json      @default("{}")      // JSONB for custom properties

  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?

  // Relations
  tenant            Tenant               @relation(fields: [tenantId], references: [id])
  contact           Contact?             @relation(fields: [contactId], references: [id])
  company           Company?             @relation(fields: [companyId], references: [id])
  assignedTo        User?                @relation("TicketAssignee", fields: [assignedToUserId], references: [id])
  createdBy         User?                @relation("TicketCreator", fields: [createdById], references: [id])
  pipeline          TicketPipeline       @relation(fields: [pipelineId], references: [id])
  stage             TicketPipelineStage  @relation(fields: [stageId], references: [id])
  sla               TicketSLAPolicy?     @relation(fields: [slaId], references: [id])
  comments          TicketComment[]
  activities        TicketActivity[]

  // Indexes
  @@unique([tenantId, ticketNumber])              // Unique ticket number per tenant
  @@index([tenantId])
  @@index([status])
  @@index([priority])
  @@index([assignedToUserId])
  @@index([contactId])
  @@index([companyId])
  @@index([pipelineId])
  @@index([stageId])
  @@index([slaId])
  @@index([dueDate])
  @@index([createdAt(sort: Desc)])
  @@index([deletedAt])
  @@index([tenantId, status])                     // Composite for common query pattern
  @@index([tenantId, assignedToUserId, status])   // Composite for "my open tickets"
}
```

**Design Decisions:**

- `ticketNumber` is an `Int` (not the formatted "T-0001" string). Formatting is done at the application/presentation layer. This keeps the column sortable and indexable as a simple integer.
- `status` is denormalized from the pipeline stage `type` field. While the stage determines the lifecycle position, having a top-level `status` enables fast filtering without JOIN. It is updated whenever `stageId` changes, via application logic.
- `tags` uses PostgreSQL native `String[]` array type instead of JSON. This enables direct `@>` (contains) array operators for efficient filtering.
- `customFields` as `Json` mirrors the `properties` pattern used on Contact, Company, and Deal models.

#### TicketComment

```prisma
model TicketComment {
  id          String    @id @default(uuid())
  ticketId    String
  authorId    String?

  // Content
  content     String    @db.Text              // Rich text (HTML/Markdown)
  isInternal  Boolean   @default(false)       // true = internal note, false = public reply

  // Attachments
  attachments Json      @default("[]")        // Array of {name, url, size, mimeType}

  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  // Relations
  ticket      Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author      User?     @relation(fields: [authorId], references: [id])

  @@index([ticketId])
  @@index([authorId])
  @@index([createdAt(sort: Desc)])
  @@index([isInternal])
}
```

**Design Decisions:**

- `isInternal` boolean distinguishes between internal notes (visible only to agents) and public replies (visible to the customer). This is a core HubSpot pattern.
- `attachments` as JSON array avoids a separate join table for what is essentially metadata. Each attachment object stores `{name, url, size, mimeType}`. Files are stored in Supabase Storage; only references are kept here.
- `onDelete: Cascade` on the ticket relation ensures comments are cleaned up if a ticket is hard-deleted (though soft delete is the standard).

#### TicketPipeline

```prisma
model TicketPipeline {
  id          String    @id @default(uuid())
  tenantId    String

  name        String
  description String?
  isDefault   Boolean   @default(false)

  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  // Relations
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  stages      TicketPipelineStage[]
  tickets     Ticket[]

  @@index([tenantId])
  @@index([isDefault])
}
```

**Design Decisions:**

- Separate `TicketPipeline` from the existing `Pipeline` model (used for Deals). In HubSpot, ticket pipelines and deal pipelines are distinct objects with different stage semantics. Ticket stages have a `type` enum (open/in_progress/waiting/resolved/closed) whereas deal stages have `probability` and `isWon`/`isClosed` booleans.
- Only one pipeline per tenant can be `isDefault = true`. This is enforced at the application layer with a transaction that unsets the previous default before setting a new one.

#### TicketPipelineStage

```prisma
model TicketPipelineStage {
  id            String    @id @default(uuid())
  pipelineId    String

  name          String
  displayOrder  Int       @default(0)
  type          String    @default("open")  // open, in_progress, waiting, resolved, closed
  color         String?                     // Hex color for UI badge/indicator

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  pipeline      TicketPipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  tickets       Ticket[]

  @@index([pipelineId])
  @@index([displayOrder])
}
```

**Design Decisions:**

- `type` enum values map to SLA timer behavior:
  - `open` -- SLA timer is running, ticket is new/unassigned.
  - `in_progress` -- SLA timer is running, ticket is being worked on.
  - `waiting` -- SLA timer is **paused** (waiting on customer response).
  - `resolved` -- SLA timer stops, ticket is resolved but not yet confirmed closed.
  - `closed` -- Final state, ticket is done.
- `displayOrder` allows drag-and-drop reordering of stages in the UI (same pattern as `PipelineStage.orderIndex` for deals).

#### Default Stages (Seed Data)

```
| displayOrder | name              | type         | color   |
|--------------|-------------------|--------------|---------|
| 0            | New               | open         | #3B82F6 |
| 1            | Waiting on contact| waiting      | #F59E0B |
| 2            | Waiting on us     | in_progress  | #8B5CF6 |
| 3            | Resolved          | resolved     | #10B981 |
| 4            | Closed            | closed       | #6B7280 |
```

#### TicketSLAPolicy

```prisma
model TicketSLAPolicy {
  id                  String    @id @default(uuid())
  tenantId            String

  name                String                      // e.g., "Premium Support", "Standard"
  description         String?

  // Target priority (which tickets get this SLA)
  priority            String                      // low, medium, high, urgent

  // SLA Targets (in minutes)
  firstResponseTime   Int                         // Minutes to first public response
  nextResponseTime    Int?                        // Minutes between subsequent responses
  resolutionTime      Int                         // Minutes to full resolution

  // Business hours
  businessHoursOnly   Boolean   @default(true)    // true = count only business hours
  businessHoursStart  String    @default("09:00") // HH:mm format
  businessHoursEnd    String    @default("17:00") // HH:mm format
  businessDays        Int[]     @default([1,2,3,4,5]) // 0=Sun, 1=Mon, ... 6=Sat
  timezone            String    @default("Asia/Ho_Chi_Minh")

  // Status
  isActive            Boolean   @default(true)

  // Audit
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  // Relations
  tenant              Tenant    @relation(fields: [tenantId], references: [id])
  tickets             Ticket[]

  @@unique([tenantId, priority])                  // One SLA policy per priority per tenant
  @@index([tenantId])
  @@index([isActive])
}
```

**Design Decisions:**

- SLA policies are mapped 1:1 with priority levels per tenant. When a ticket is created with `priority: "high"`, the system automatically finds the tenant's active SLA policy for "high" priority and attaches it.
- `businessHoursStart`/`businessHoursEnd` stored as strings in "HH:mm" format for simplicity. A production system might evolve to support different hours per day.
- `businessDays` as `Int[]` (PostgreSQL array) allows easy customization (e.g., Middle Eastern businesses might use Sun-Thu instead of Mon-Fri).
- `timezone` is critical for accurate SLA calculation. Stored per-policy so different SLA tiers can potentially use different timezone rules.

#### TicketActivity (Audit Trail)

```prisma
model TicketActivity {
  id              String    @id @default(uuid())
  ticketId        String
  tenantId        String

  // Activity details
  type            String    // status_change, assignment_change, priority_change,
                            // sla_breach, sla_warning, comment_added, stage_change,
                            // tag_added, tag_removed, field_updated, created, reopened
  field           String?   // Which field changed (e.g., "status", "assignedToUserId")
  oldValue        String?   // Previous value (serialized)
  newValue        String?   // New value (serialized)
  description     String?   // Human-readable description

  // Who performed the action
  performedById   String?   // null = system action

  // Metadata
  metadata        Json      @default("{}")        // Extra context (SLA remaining time, etc.)

  // Audit
  createdAt       DateTime  @default(now())

  // Relations
  ticket          Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedBy     User?     @relation(fields: [performedById], references: [id])

  @@index([ticketId])
  @@index([tenantId])
  @@index([type])
  @@index([createdAt(sort: Desc)])
}
```

**Design Decisions:**

- This is a write-heavy, read-occasionally table. Kept lean with no `updatedAt` (activities are immutable).
- `oldValue`/`newValue` are strings to handle any field type uniformly. Complex values (like JSON objects) are serialized.
- `performedById` is nullable because system-triggered events (SLA breach detection, auto-assignment) have no human actor.
- No `deletedAt` -- activity records are immutable audit logs and should never be deleted.

#### TicketCounter (for Sequential Numbering)

```prisma
model TicketCounter {
  tenantId      String    @id
  lastNumber    Int       @default(0)

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
}
```

This is a supporting table for the ticket numbering system (see Section 3).

### 1.4 Required Changes to Existing Models

The following existing models need relation additions:

```prisma
// In model Tenant, add:
ticketPipelines     TicketPipeline[]
ticketSLAPolicies   TicketSLAPolicy[]
tickets             Ticket[]
ticketCounters      TicketCounter?

// In model User, add:
assignedTickets     Ticket[]        @relation("TicketAssignee")
createdTickets      Ticket[]        @relation("TicketCreator")
ticketComments      TicketComment[]
ticketActivities    TicketActivity[]

// In model Contact, add:
tickets             Ticket[]

// In model Company, add:
tickets             Ticket[]
```

---

## 2. API Route Design

### 2.1 Route Structure

Following the existing Next.js App Router convention used for contacts, companies, and deals:

```
src/app/api/tickets/
  route.ts                          # GET (list), POST (create)
  [id]/
    route.ts                        # GET (detail), PATCH (update), DELETE (soft delete)
    comments/
      route.ts                      # GET (list comments), POST (add comment)
    assign/
      route.ts                      # PATCH (assign/reassign)
    status/
      route.ts                      # PATCH (status transition)
  pipelines/
    route.ts                        # GET (list pipelines), POST (create pipeline)
    [id]/
      route.ts                      # GET (detail), PATCH (update), DELETE (soft delete)
      stages/
        route.ts                    # GET (list stages), POST (add stage)
        reorder/
          route.ts                  # PATCH (reorder stages)
  sla/
    route.ts                        # GET (list SLA policies), POST (create)
    [id]/
      route.ts                      # GET (detail), PATCH (update), DELETE (soft delete)
```

### 2.2 API Specifications

#### GET /api/tickets -- List Tickets

```typescript
// Query Parameters
interface ListTicketsParams {
  page?: number;         // Default: 1
  limit?: number;        // Default: 50, max: 200
  search?: string;       // Full-text search on title + description
  status?: string;       // Filter: open, in_progress, waiting, resolved, closed
  priority?: string;     // Filter: low, medium, high, urgent
  assignedToUserId?: string;
  contactId?: string;
  companyId?: string;
  pipelineId?: string;
  stageId?: string;
  category?: string;
  source?: string;
  tags?: string;         // Comma-separated tag filter
  slaStatus?: string;    // breached, at_risk, on_track
  createdAfter?: string; // ISO date
  createdBefore?: string;
  sortBy?: string;       // created, updated, priority, dueDate, ticketNumber
  sortOrder?: string;    // asc, desc (default: desc)
}

// Response
interface ListTicketsResponse {
  data: TicketWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  aggregations?: {       // Optional summary counts
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
}
```

**Implementation Notes:**
- Follow the existing pattern from `src/app/api/contacts/route.ts` and `src/app/api/deals/route.ts`.
- `slaStatus` filter requires runtime calculation (comparing SLA due date against current time) -- cannot be a simple WHERE clause. Use a post-query filter or calculate an `slaStatus` virtual field.
- `search` parameter uses Prisma's `contains` with `mode: "insensitive"` for initial implementation. PostgreSQL full-text search is a performance optimization for later (see Section 5).

#### POST /api/tickets -- Create Ticket

```typescript
// Request Body
interface CreateTicketRequest {
  title: string;              // Required
  description?: string;
  priority?: string;          // Default: "medium"
  category?: string;
  source?: string;            // Default: "web"
  contactId?: string;
  companyId?: string;
  assignedToUserId?: string;
  pipelineId?: string;        // If omitted, use tenant's default pipeline
  stageId?: string;           // If omitted, use pipeline's first stage
  tags?: string[];
  customFields?: Record<string, unknown>;
}

// Response: 201 Created
// Returns the full ticket with relations
```

**Implementation Notes:**
- `ticketNumber` is auto-generated (see Section 3).
- If `pipelineId` is omitted, query `TicketPipeline` where `isDefault = true` for the tenant.
- If `stageId` is omitted, use the stage with the lowest `displayOrder` in the selected pipeline.
- `status` is derived from the selected stage's `type`.
- SLA policy is auto-attached based on `priority` (find active `TicketSLAPolicy` for the tenant + priority).
- `dueDate` is calculated from the SLA policy's `resolutionTime` (see Section 4).
- Create a `TicketActivity` with `type: "created"` in the same transaction.

#### GET /api/tickets/[id] -- Get Ticket Detail

```typescript
// Response includes full relations
interface TicketDetailResponse {
  ...ticket,
  contact: ContactSummary | null;
  company: CompanySummary | null;
  assignedTo: UserSummary | null;
  createdBy: UserSummary | null;
  pipeline: { id, name };
  stage: { id, name, type, color };
  sla: TicketSLAPolicy | null;
  slaStatus: {                    // Computed at runtime
    firstResponse: SLATimerStatus;
    resolution: SLATimerStatus;
  };
  recentComments: TicketComment[]; // Last 5 comments
  recentActivities: TicketActivity[]; // Last 10 activities
}

interface SLATimerStatus {
  target: number;           // Target in minutes
  elapsed: number;          // Business minutes elapsed
  remaining: number;        // Business minutes remaining
  status: 'on_track' | 'at_risk' | 'breached';
  dueAt: string;           // ISO datetime
  breachedAt?: string;     // ISO datetime (if breached)
}
```

#### PATCH /api/tickets/[id] -- Update Ticket

```typescript
// Request Body (all fields optional)
interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: string;
  category?: string;
  contactId?: string | null;
  companyId?: string | null;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

// Note: status/stage changes go through /status endpoint
// Note: assignment changes go through /assign endpoint
```

**Implementation Notes:**
- Priority changes should trigger SLA policy re-evaluation and `dueDate` recalculation.
- All field changes should create `TicketActivity` records with `type: "field_updated"`.

#### DELETE /api/tickets/[id] -- Soft Delete Ticket

```typescript
// Sets deletedAt = now()
// Response: 200 OK with { message: "Ticket deleted" }
```

#### PATCH /api/tickets/[id]/assign -- Assign Ticket

```typescript
interface AssignTicketRequest {
  assignedToUserId: string | null; // null to unassign
}
```

**Implementation Notes:**
- Creates `TicketActivity` with `type: "assignment_change"`.
- If this is the first assignment and ticket is in "open" stage, optionally auto-move to "in_progress".

#### PATCH /api/tickets/[id]/status -- Change Ticket Status

```typescript
interface ChangeStatusRequest {
  stageId: string;                // Target stage
  comment?: string;               // Optional comment on transition
}
```

**Implementation Notes:**
- Validates the stage belongs to the ticket's pipeline.
- Updates both `stageId` and `status` (derived from stage `type`).
- If stage type is "resolved", set `resolvedAt = now()`.
- If stage type is "closed", set `closedAt = now()`.
- If moving from "resolved"/"closed" back to an active stage, clear `resolvedAt`/`closedAt` and create a "reopened" activity.
- Creates `TicketActivity` with `type: "stage_change"` and `type: "status_change"`.

#### GET/POST /api/tickets/[id]/comments

```typescript
// GET query params
interface ListCommentsParams {
  page?: number;
  limit?: number;
  includeInternal?: boolean; // Default: true (agents see all; customer portal hides internal)
}

// POST body
interface CreateCommentRequest {
  content: string;          // Required, rich text
  isInternal?: boolean;     // Default: false
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
}
```

**Implementation Notes:**
- A public (non-internal) comment on a ticket that has no `firstResponseAt` should set `firstResponseAt = now()` and update the SLA timer.
- Creates `TicketActivity` with `type: "comment_added"`.

### 2.3 Validation Schema (Zod)

```typescript
import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(50000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().max(100).optional(),
  source: z.enum(['web', 'email', 'chat', 'phone', 'api']).default('web'),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  assignedToUserId: z.string().uuid().optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  customFields: z.record(z.unknown()).default({}),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(50000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().max(100).optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(50000),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    size: z.number().int().positive(),
    mimeType: z.string(),
  })).max(10).default([]),
});

export const assignTicketSchema = z.object({
  assignedToUserId: z.string().uuid().nullable(),
});

export const changeStatusSchema = z.object({
  stageId: z.string().uuid(),
  comment: z.string().max(5000).optional(),
});
```

---

## 3. Ticket Numbering System

### 3.1 Requirements

- Sequential numbers per tenant: T-0001, T-0002, etc.
- No gaps under normal operation.
- Concurrency-safe: two simultaneous ticket creations must not get the same number.
- Performant: should not be a bottleneck.

### 3.2 Approach: Counter Table with Row-Level Locking

**Why not PostgreSQL SEQUENCE?**
PostgreSQL sequences are global objects, not row-scoped. Creating one sequence per tenant is operationally complex (DDL per tenant signup) and hard to manage with Prisma migrations. A counter table with row-level locking is simpler, portable, and sufficient for our scale.

**Why not MAX(ticketNumber) + 1?**
This is racy under concurrent inserts. Two transactions could read the same MAX, both compute the same next number, and one would fail on the unique constraint. A retry loop would work but is less elegant.

### 3.3 Implementation

#### Database Model (already defined above)

```prisma
model TicketCounter {
  tenantId      String    @id
  lastNumber    Int       @default(0)
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
}
```

#### Number Generation Function

```typescript
// src/lib/ticket-numbering.ts

import prisma from '@/lib/prisma';

/**
 * Generates the next ticket number for a tenant.
 * Uses SELECT ... FOR UPDATE for row-level locking to ensure
 * concurrency safety.
 *
 * MUST be called inside a Prisma interactive transaction.
 */
export async function getNextTicketNumber(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  tenantId: string
): Promise<number> {
  // Atomic increment with row-level lock via raw SQL
  // This is the most reliable pattern for PostgreSQL
  const result = await tx.$queryRaw<Array<{ last_number: number }>>`
    INSERT INTO "TicketCounter" ("tenantId", "lastNumber")
    VALUES (${tenantId}, 1)
    ON CONFLICT ("tenantId")
    DO UPDATE SET "lastNumber" = "TicketCounter"."lastNumber" + 1
    RETURNING "lastNumber" AS last_number
  `;

  return result[0].last_number;
}

/**
 * Formats a ticket number for display.
 * Example: 42 -> "T-0042"
 */
export function formatTicketNumber(num: number): string {
  return `T-${num.toString().padStart(4, '0')}`;
}
```

#### Usage in Ticket Creation

```typescript
const ticket = await prisma.$transaction(async (tx) => {
  const ticketNumber = await getNextTicketNumber(tx, tenantId);

  return tx.ticket.create({
    data: {
      tenantId,
      ticketNumber,
      title: body.title,
      // ... other fields
    },
  });
});
```

### 3.4 Concurrency Analysis

- **INSERT ... ON CONFLICT DO UPDATE** is atomic in PostgreSQL. The `ON CONFLICT` clause acquires a row-level lock on the conflicting row, ensuring only one transaction at a time can increment the counter.
- Under high concurrency, competing transactions will serialize on the counter row. This is acceptable because ticket creation is not a high-throughput operation (hundreds per minute at most, not millions).
- The `RETURNING` clause eliminates the need for a separate SELECT, reducing round-trips.
- If the counter row does not exist yet (first ticket for a new tenant), the INSERT creates it with `lastNumber = 1`. Subsequent calls hit the `ON CONFLICT` path.

### 3.5 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Transaction rollback after number generation | Number is "consumed" (gap created). This is acceptable -- true gapless sequences require serialized access. |
| Concurrent ticket creation | Serialized on the counter row. Second transaction waits briefly for the first to commit/rollback. |
| New tenant with no counter row | UPSERT creates the row and returns 1. |
| Very high volume (>1000 tickets/minute) | Counter table becomes a bottleneck. Mitigate with batch pre-allocation (allocate ranges of 10-100 numbers) -- unlikely to be needed for our use case. |

---

## 4. SLA Calculation Algorithm

### 4.1 Overview

SLA calculation determines deadlines and remaining time for two key metrics:
1. **First Response Time** -- how long until the first public reply to the customer.
2. **Resolution Time** -- how long until the ticket is resolved.

The complexity comes from **business hours**: SLA timers should only count time during configured working hours.

### 4.2 Core Algorithm: Business Hours Calculation

```typescript
// src/lib/sla/business-hours.ts

interface BusinessHoursConfig {
  startHour: number;        // e.g., 9 for 09:00
  startMinute: number;      // e.g., 0
  endHour: number;          // e.g., 17 for 17:00
  endMinute: number;        // e.g., 0
  businessDays: number[];   // e.g., [1,2,3,4,5] for Mon-Fri
  timezone: string;         // e.g., "Asia/Ho_Chi_Minh"
}

/**
 * Calculate the number of business minutes between two timestamps.
 *
 * Algorithm:
 * 1. Convert both timestamps to the SLA's timezone.
 * 2. Iterate day-by-day from start to end.
 * 3. For each day that is a business day:
 *    a. Determine the effective start time (max of day's business start, actual start).
 *    b. Determine the effective end time (min of day's business end, actual end).
 *    c. If effective start < effective end, add the difference to total.
 * 4. Return total minutes.
 */
export function calculateBusinessMinutes(
  startTime: Date,
  endTime: Date,
  config: BusinessHoursConfig
): number {
  // Implementation uses date-fns-tz for timezone handling
  // Pseudo-algorithm:

  let totalMinutes = 0;
  let current = startOfDay(startTime, config.timezone);
  const end = endTime;

  while (current <= end) {
    const dayOfWeek = getDayOfWeek(current, config.timezone);

    if (config.businessDays.includes(dayOfWeek)) {
      const dayStart = setTime(current, config.startHour, config.startMinute, config.timezone);
      const dayEnd = setTime(current, config.endHour, config.endMinute, config.timezone);

      const effectiveStart = max(dayStart, startTime);
      const effectiveEnd = min(dayEnd, endTime);

      if (effectiveStart < effectiveEnd) {
        totalMinutes += differenceInMinutes(effectiveEnd, effectiveStart);
      }
    }

    current = addDays(current, 1);
  }

  return totalMinutes;
}

/**
 * Calculate the deadline (future datetime) given a start time
 * and a number of business minutes.
 *
 * Inverse of calculateBusinessMinutes: given a start point and
 * a duration in business minutes, returns the wall-clock time
 * when that many business minutes will have elapsed.
 */
export function calculateDeadline(
  startTime: Date,
  businessMinutes: number,
  config: BusinessHoursConfig
): Date {
  let remainingMinutes = businessMinutes;
  let current = startTime;

  while (remainingMinutes > 0) {
    const dayOfWeek = getDayOfWeek(current, config.timezone);

    if (config.businessDays.includes(dayOfWeek)) {
      const dayStart = setTime(current, config.startHour, config.startMinute, config.timezone);
      const dayEnd = setTime(current, config.endHour, config.endMinute, config.timezone);

      const effectiveStart = max(dayStart, current);

      if (effectiveStart < dayEnd) {
        const availableMinutes = differenceInMinutes(dayEnd, effectiveStart);

        if (remainingMinutes <= availableMinutes) {
          return addMinutes(effectiveStart, remainingMinutes);
        }

        remainingMinutes -= availableMinutes;
      }
    }

    // Move to start of next day
    current = startOfNextDay(current, config.timezone);
  }

  return current;
}
```

### 4.3 SLA Timer State Machine

```
                    ┌───────────────────────────────────────────┐
                    │            SLA TIMER STATES               │
                    │                                           │
   Ticket Created   │  ┌─────────┐    Stage = waiting          │
   ─────────────────┼─►│ RUNNING │──────────────────►┌────────┐│
                    │  └─────────┘                   │ PAUSED ││
                    │       │     ◄───────────────────└────────┘│
                    │       │      Stage != waiting              │
                    │       │                                    │
                    │       │  Stage = resolved/closed           │
                    │       ▼                                    │
                    │  ┌──────────┐                              │
                    │  │ STOPPED  │                              │
                    │  └──────────┘                              │
                    │       │                                    │
                    │       │  Reopened (back to active stage)   │
                    │       ▼                                    │
                    │  ┌─────────┐                               │
                    │  │ RUNNING │ (resumed)                     │
                    │  └─────────┘                               │
                    │       │                                    │
                    │       │  SLA target exceeded               │
                    │       ▼                                    │
                    │  ┌──────────┐                              │
                    │  │BREACHED  │                              │
                    │  └──────────┘                              │
                    └───────────────────────────────────────────┘
```

### 4.4 SLA Tracking Implementation

Rather than storing a continuously-updated "elapsed time" column (which would require constant writes), we calculate SLA status on-the-fly from the activity log.

```typescript
// src/lib/sla/calculator.ts

interface SLATimerResult {
  target: number;               // Target in business minutes
  elapsedBusinessMinutes: number;
  remainingBusinessMinutes: number;
  status: 'on_track' | 'at_risk' | 'breached';
  dueAt: Date;
  breachedAt: Date | null;
}

/**
 * Calculates the current SLA status for a ticket.
 *
 * Strategy:
 * 1. Fetch all stage_change activities for the ticket, ordered by time.
 * 2. Build intervals of "running" time (when the stage type was NOT "waiting").
 * 3. Sum up business minutes across all running intervals.
 * 4. Compare against the SLA target.
 *
 * "at_risk" threshold: 80% of target time consumed.
 */
export async function calculateSLAStatus(
  ticket: TicketWithSLA,
  metric: 'firstResponse' | 'resolution'
): Promise<SLATimerResult> {
  const sla = ticket.sla;
  if (!sla) return null;

  const target = metric === 'firstResponse'
    ? sla.firstResponseTime
    : sla.resolutionTime;

  // Already met?
  if (metric === 'firstResponse' && ticket.firstResponseAt) {
    const elapsed = calculateBusinessMinutes(
      ticket.createdAt,
      ticket.firstResponseAt,
      buildConfig(sla)
    );
    return {
      target,
      elapsedBusinessMinutes: elapsed,
      remainingBusinessMinutes: Math.max(0, target - elapsed),
      status: elapsed <= target ? 'on_track' : 'breached',
      dueAt: calculateDeadline(ticket.createdAt, target, buildConfig(sla)),
      breachedAt: elapsed > target ? ticket.firstResponseAt : null,
    };
  }

  if (metric === 'resolution' && ticket.resolvedAt) {
    const elapsed = calculateActiveBusinessMinutes(ticket, sla);
    return {
      target,
      elapsedBusinessMinutes: elapsed,
      remainingBusinessMinutes: Math.max(0, target - elapsed),
      status: elapsed <= target ? 'on_track' : 'breached',
      dueAt: calculateDeadline(ticket.createdAt, target, buildConfig(sla)),
      breachedAt: elapsed > target ? ticket.resolvedAt : null,
    };
  }

  // Still active -- calculate elapsed so far
  const elapsed = calculateActiveBusinessMinutes(ticket, sla);
  const remaining = Math.max(0, target - elapsed);
  const atRiskThreshold = target * 0.8;

  let status: 'on_track' | 'at_risk' | 'breached';
  if (elapsed >= target) {
    status = 'breached';
  } else if (elapsed >= atRiskThreshold) {
    status = 'at_risk';
  } else {
    status = 'on_track';
  }

  return {
    target,
    elapsedBusinessMinutes: elapsed,
    remainingBusinessMinutes: remaining,
    status,
    dueAt: calculateDeadline(ticket.createdAt, target, buildConfig(sla)),
    breachedAt: null,
  };
}
```

### 4.5 Handling Pauses (Waiting on Customer)

When a ticket moves to a "waiting" stage, the SLA timer should pause. This is handled by tracking stage transitions:

```typescript
/**
 * Calculates total active business minutes for a ticket,
 * excluding time spent in "waiting" stages.
 */
async function calculateActiveBusinessMinutes(
  ticket: TicketWithSLA,
  sla: TicketSLAPolicy
): Promise<number> {
  const config = buildConfig(sla);
  const activities = await getStageChangeActivities(ticket.id);

  let totalMinutes = 0;
  let intervalStart = ticket.createdAt;
  let isRunning = true; // Starts running when created

  for (const activity of activities) {
    if (activity.type === 'stage_change') {
      const newStageType = activity.metadata?.stageType;

      if (isRunning && newStageType === 'waiting') {
        // Timer was running, now pausing
        if (sla.businessHoursOnly) {
          totalMinutes += calculateBusinessMinutes(intervalStart, activity.createdAt, config);
        } else {
          totalMinutes += differenceInMinutes(activity.createdAt, intervalStart);
        }
        isRunning = false;
      } else if (!isRunning && newStageType !== 'waiting') {
        // Timer was paused, now resuming
        intervalStart = activity.createdAt;
        isRunning = true;
      }
    }
  }

  // If timer is still running, count up to now
  if (isRunning) {
    const now = new Date();
    if (sla.businessHoursOnly) {
      totalMinutes += calculateBusinessMinutes(intervalStart, now, config);
    } else {
      totalMinutes += differenceInMinutes(now, intervalStart);
    }
  }

  return totalMinutes;
}
```

### 4.6 Breach Detection (Background Job)

For proactive breach alerts, a background job should run periodically:

```typescript
/**
 * Cron job: Check for SLA breaches and at-risk tickets.
 * Suggested frequency: Every 5 minutes.
 *
 * Implementation options:
 * 1. Next.js API route triggered by external cron (e.g., Supabase pg_cron, Vercel cron)
 * 2. Supabase Edge Function on a schedule
 */
// GET /api/tickets/sla/check (protected, cron-only)
export async function checkSLABreaches() {
  // 1. Find all open tickets with SLA policies
  // 2. Calculate SLA status for each
  // 3. For newly breached tickets:
  //    a. Create TicketActivity with type: "sla_breach"
  //    b. (Future) Send notification to assigned agent and manager
  // 4. For newly at-risk tickets:
  //    a. Create TicketActivity with type: "sla_warning"
  //    b. (Future) Send notification
}
```

### 4.7 Default SLA Policies (Seed Data)

```
| Priority | First Response | Next Response | Resolution | Business Hours |
|----------|---------------|---------------|------------|----------------|
| urgent   | 30 min        | 30 min        | 4 hours    | Yes            |
| high     | 1 hour        | 2 hours       | 8 hours    | Yes            |
| medium   | 4 hours       | 8 hours       | 24 hours   | Yes            |
| low      | 8 hours       | 24 hours      | 72 hours   | Yes            |
```

---

## 5. Search and Filtering

### 5.1 Phase 1: Prisma-Based Search (Initial Implementation)

For the initial implementation, use Prisma's built-in `contains` with case-insensitive mode, matching the pattern already used in the contacts API.

```typescript
// Search on title + description
const searchWhere = search ? {
  OR: [
    { title: { contains: search, mode: 'insensitive' as const } },
    { description: { contains: search, mode: 'insensitive' as const } },
    { ticketNumber: isNumeric(search) ? parseInt(search) : undefined },
  ].filter(Boolean),
} : {};
```

**Limitations:**
- `contains` translates to `ILIKE '%term%'` in PostgreSQL, which cannot use B-tree indexes.
- Acceptable for < 100K tickets per tenant. Performance degrades beyond that.

### 5.2 Phase 2: PostgreSQL Full-Text Search (Performance Optimization)

When ticket volume grows, migrate to PostgreSQL's native full-text search with `tsvector` and GIN indexes.

#### Migration SQL

```sql
-- Add a generated tsvector column for full-text search
ALTER TABLE "Ticket" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX idx_ticket_search ON "Ticket" USING GIN (search_vector);

-- Query example:
-- SELECT * FROM "Ticket"
-- WHERE search_vector @@ websearch_to_tsquery('english', 'login issue')
-- AND "tenantId" = $1 AND "deletedAt" IS NULL
-- ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', 'login issue')) DESC;
```

**Note on Prisma Compatibility:**
- Prisma does not natively support `tsvector` columns or `@@` operators. The full-text search query must be executed via `prisma.$queryRaw`.
- The `GENERATED ALWAYS AS ... STORED` column is auto-maintained by PostgreSQL and invisible to Prisma writes.
- Prisma's built-in `fullTextSearch` preview feature supports PostgreSQL but does NOT use GIN indexes for acceleration. Raw SQL is required for index-backed full-text search.

### 5.3 Filter Implementation

```typescript
// src/app/api/tickets/route.ts

function buildWhereClause(params: ListTicketsParams, tenantId: string) {
  const where: Prisma.TicketWhereInput = {
    tenantId,
    deletedAt: null,
  };

  if (params.status) {
    where.status = params.status;
  }

  if (params.priority) {
    where.priority = params.priority;
  }

  if (params.assignedToUserId) {
    where.assignedToUserId = params.assignedToUserId;
  }

  if (params.contactId) {
    where.contactId = params.contactId;
  }

  if (params.companyId) {
    where.companyId = params.companyId;
  }

  if (params.pipelineId) {
    where.pipelineId = params.pipelineId;
  }

  if (params.stageId) {
    where.stageId = params.stageId;
  }

  if (params.category) {
    where.category = params.category;
  }

  if (params.source) {
    where.source = params.source;
  }

  if (params.tags) {
    // PostgreSQL array containment: ticket.tags must contain ALL specified tags
    where.tags = { hasEvery: params.tags.split(',') };
  }

  if (params.createdAfter || params.createdBefore) {
    where.createdAt = {};
    if (params.createdAfter) {
      where.createdAt.gte = new Date(params.createdAfter);
    }
    if (params.createdBefore) {
      where.createdAt.lte = new Date(params.createdBefore);
    }
  }

  // Text search (Phase 1: ILIKE)
  if (params.search) {
    const searchTerm = params.search.trim();
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];

    // Also search by ticket number if the search term looks like "T-0042" or "42"
    const numericMatch = searchTerm.match(/^T?-?(\d+)$/i);
    if (numericMatch) {
      where.OR.push({ ticketNumber: parseInt(numericMatch[1]) });
    }
  }

  return where;
}
```

### 5.4 Sort Options

```typescript
function buildOrderBy(
  sortBy: string = 'created',
  sortOrder: string = 'desc'
): Prisma.TicketOrderByWithRelationInput {
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'updated':
      return { updatedAt: order };
    case 'priority':
      // Priority needs custom ordering: urgent > high > medium > low
      // Prisma doesn't support custom enum ordering, so we use raw SQL or
      // a numeric priority field. For now, alphabetical sort is acceptable.
      return { priority: order };
    case 'dueDate':
      return { dueDate: order };
    case 'ticketNumber':
      return { ticketNumber: order };
    case 'created':
    default:
      return { createdAt: order };
  }
}
```

**Priority Sorting Enhancement (Future):**
For correct priority ordering (urgent > high > medium > low), consider either:
1. A `priorityOrder` integer column (urgent=0, high=1, medium=2, low=3) alongside the `priority` string.
2. A raw SQL `ORDER BY CASE` clause via `$queryRaw`.

---

## 6. Performance Considerations

### 6.1 Index Strategy

The following indexes are defined in the Prisma schema (Section 1.3). Here is the rationale for each:

| Index | Query Pattern | Type |
|-------|--------------|------|
| `@@index([tenantId])` | Every query filters by tenant | B-tree |
| `@@index([status])` | Filter by ticket status | B-tree |
| `@@index([priority])` | Filter by priority | B-tree |
| `@@index([assignedToUserId])` | "My tickets" view | B-tree |
| `@@index([contactId])` | Contact detail page - related tickets | B-tree |
| `@@index([companyId])` | Company detail page - related tickets | B-tree |
| `@@index([pipelineId])` | Pipeline view / board view | B-tree |
| `@@index([stageId])` | Stage-specific queries | B-tree |
| `@@index([dueDate])` | Sort by SLA deadline | B-tree |
| `@@index([createdAt(sort: Desc)])` | Default sort order | B-tree (desc) |
| `@@index([deletedAt])` | Soft delete filter | B-tree |
| `@@unique([tenantId, ticketNumber])` | Ticket number lookup | B-tree (unique) |
| `@@index([tenantId, status])` | Tenant + status filter (most common) | Composite B-tree |
| `@@index([tenantId, assignedToUserId, status])` | "My open tickets" (dashboard widget) | Composite B-tree |
| `search_vector` (Phase 2) | Full-text search | GIN |

**Index Guidelines:**
- Do NOT over-index. Each index adds write overhead. The above set covers the most common query patterns.
- Use `EXPLAIN ANALYZE` on slow queries before adding new indexes.
- Composite indexes follow the left-prefix rule: `(tenantId, status)` covers queries filtering on `tenantId` alone, but not `status` alone (which has its own single-column index).

### 6.2 Pagination Strategy

Follows the existing cursor-based-ready, offset-based pagination pattern used in contacts and deals APIs:

```typescript
const [tickets, total] = await Promise.all([
  prisma.ticket.findMany({
    where,
    include: { /* relations */ },
    orderBy: buildOrderBy(sortBy, sortOrder),
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.ticket.count({ where }),
]);
```

**Limitations of Offset Pagination:**
- `OFFSET` performance degrades for large offsets (page 1000+). PostgreSQL must scan and discard all preceding rows.
- For the expected scale (< 100K tickets per tenant), offset pagination is acceptable.

**Future: Cursor-Based Pagination:**
If deep pagination becomes an issue, switch to cursor-based:
```typescript
// Cursor = last ticket's id
prisma.ticket.findMany({
  take: limit,
  skip: 1,    // Skip the cursor itself
  cursor: { id: lastTicketId },
  orderBy: { createdAt: 'desc' },
});
```

### 6.3 JSON Field Querying

Custom fields stored in `customFields` (JSONB) can be queried using Prisma's JSON filters:

```typescript
// Find tickets where customField "region" equals "APAC"
prisma.ticket.findMany({
  where: {
    customFields: {
      path: ['region'],
      equals: 'APAC',
    },
  },
});
```

**Performance Note:**
- JSONB queries without indexes perform sequential scans on the JSON data.
- For frequently-queried custom fields, consider a GIN index on the `customFields` column:

```sql
CREATE INDEX idx_ticket_custom_fields ON "Ticket" USING GIN ("customFields");
```

- This GIN index supports `@>` (containment) queries: `WHERE "customFields" @> '{"region": "APAC"}'::jsonb`.
- Prisma's `path` + `equals` does NOT use GIN indexes. For GIN-backed queries, use `$queryRaw`.

### 6.4 Tag Querying

Tags use PostgreSQL's native `text[]` array type. Prisma supports array operations:

```typescript
// Tickets that have ALL of these tags
prisma.ticket.findMany({
  where: { tags: { hasEvery: ['billing', 'urgent'] } },
});

// Tickets that have ANY of these tags
prisma.ticket.findMany({
  where: { tags: { hasSome: ['billing', 'urgent'] } },
});
```

**Performance Note:**
For tag-heavy querying, add a GIN index:

```sql
CREATE INDEX idx_ticket_tags ON "Ticket" USING GIN ("tags");
```

### 6.5 N+1 Prevention

Use Prisma's `include` to eagerly load relations in list queries. Limit included data to essential fields using `select`:

```typescript
prisma.ticket.findMany({
  include: {
    contact: { select: { id: true, firstName: true, lastName: true, email: true } },
    company: { select: { id: true, name: true } },
    assignedTo: { select: { id: true, name: true, avatarUrl: true } },
    stage: { select: { id: true, name: true, type: true, color: true } },
    pipeline: { select: { id: true, name: true } },
    // Do NOT include comments or activities in list view -- load on detail
  },
});
```

### 6.6 Aggregation Queries

Dashboard widgets (ticket count by status, by priority) should use dedicated count queries:

```typescript
// Count tickets by status for dashboard
const statusCounts = await prisma.ticket.groupBy({
  by: ['status'],
  where: { tenantId, deletedAt: null },
  _count: true,
});

// Count tickets by priority
const priorityCounts = await prisma.ticket.groupBy({
  by: ['priority'],
  where: { tenantId, deletedAt: null },
  _count: true,
});
```

---

## 7. Implementation Roadmap

### Phase 1: Core CRUD (Sprint 10-11)

| Task | Effort | Priority |
|------|--------|----------|
| Add Prisma schema models (Ticket, TicketComment, TicketPipeline, TicketPipelineStage, TicketSLAPolicy, TicketActivity, TicketCounter) | 2h | P0 |
| Update existing models (Tenant, User, Contact, Company) with new relations | 1h | P0 |
| Run migration and seed default pipeline + stages + SLA policies | 1h | P0 |
| Implement ticket numbering utility | 1h | P0 |
| Implement GET/POST /api/tickets | 3h | P0 |
| Implement GET/PATCH/DELETE /api/tickets/[id] | 2h | P0 |
| Implement GET/POST /api/tickets/[id]/comments | 2h | P0 |
| Implement PATCH /api/tickets/[id]/assign | 1h | P0 |
| Implement PATCH /api/tickets/[id]/status | 2h | P0 |
| Zod validation schemas | 1h | P0 |
| Activity logging on all mutations | 2h | P1 |

### Phase 2: Pipeline & SLA Management (Sprint 11)

| Task | Effort | Priority |
|------|--------|----------|
| Implement GET/POST /api/tickets/pipelines | 2h | P0 |
| Implement GET/PATCH /api/tickets/pipelines/[id] | 1h | P0 |
| Implement stage reordering | 1h | P1 |
| Implement GET/POST /api/tickets/sla | 2h | P1 |
| Implement SLA calculation engine (business hours) | 4h | P1 |
| Implement SLA status computation on ticket detail | 2h | P1 |

### Phase 3: Search & UI (Sprint 12)

| Task | Effort | Priority |
|------|--------|----------|
| Full-text search (Phase 1: ILIKE) | 1h | P0 |
| Advanced filtering (all filter params) | 2h | P0 |
| Ticket list page (table view) | 4h | P0 |
| Ticket detail page | 4h | P0 |
| Ticket board view (Kanban) | 4h | P1 |
| Pipeline settings page | 3h | P1 |
| SLA settings page | 2h | P1 |

### Phase 4: Advanced Features (Sprint 13+)

| Task | Effort | Priority |
|------|--------|----------|
| Full-text search with tsvector + GIN (Phase 2) | 3h | P2 |
| SLA breach detection cron job | 2h | P2 |
| Email channel integration (auto-create tickets from email) | 4h | P2 |
| Ticket merge functionality | 3h | P3 |
| Customer portal (external ticket view) | 6h | P3 |
| Knowledge base integration | 4h | P3 |

---

## Appendix A: Dependency Table

| Package | Purpose | Status |
|---------|---------|--------|
| `prisma` (7.x) | ORM, schema, migrations | Already installed |
| `zod` | Request validation | Already installed |
| `date-fns` | Date arithmetic for SLA | Need to install |
| `date-fns-tz` | Timezone handling for SLA | Need to install |
| `@types/node` | Node.js types | Already installed |

## Appendix B: HubSpot Reference

This design closely follows HubSpot's Service Hub architecture:

- **Ticket Object**: Maps to HubSpot's ticket CRM object with subject, priority, pipeline, and stage.
- **Pipelines/Stages**: HubSpot uses separate ticket pipelines with configurable stages. Stages have a "status type" (new/open/pending/closed) similar to our `type` field.
- **SLAs**: HubSpot Service Hub Professional+ supports SLA goals for first response and time-to-close, with business hours configuration.
- **Comments/Notes**: HubSpot uses "engagements" (notes, emails, calls) associated with tickets. Our `TicketComment` model simplifies this to a direct comment thread.
- **Activity Feed**: HubSpot shows a timeline of all changes on the ticket record. Our `TicketActivity` model captures this audit trail.

## Appendix C: Key Trade-offs

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| Separate TicketPipeline vs reusing Pipeline | Code duplication vs type safety | Ticket stages have fundamentally different semantics (type-based lifecycle) than deal stages (probability-based). Separate models prevent confusion. |
| Counter table vs PostgreSQL SEQUENCE | Slightly slower vs operational complexity | Counter table works with Prisma, is tenant-scoped, and avoids DDL per tenant. |
| SLA calculated on-the-fly vs stored | CPU per request vs write complexity | On-the-fly calculation is simpler, always accurate, and avoids stale data. Caching can be added if it becomes a bottleneck. |
| `status` denormalized from stage | Data redundancy vs query performance | Status is the #1 filter criterion. Denormalizing avoids a JOIN on every list query. Application logic ensures consistency. |
| Tags as `String[]` vs junction table | Less normalized vs simpler queries | For a fixed-length tag list (max 20), an array column is simpler and faster than a many-to-many join. |
| `customFields` as JSONB vs EAV table | Schema flexibility vs query performance | JSONB is the established pattern in the codebase (Contact.properties, Company.properties). Consistency wins. |
