# Deal Pipeline Kanban Board - Technical Research
> Date: 2026-02-08
> Author: AI Technical Researcher
> Status: Complete

---

## 1. Codebase Audit

### 1.1 Schema Analysis (`prisma/schema.prisma`)

The database schema is well-structured for a Kanban pipeline implementation.

#### Deal Model (lines 170-220)
```prisma
model Deal {
  id              String    @id @default(uuid())
  tenantId        String
  name            String
  description     String?
  amount          Decimal?  @db.Decimal(15, 2)
  currency        String    @default("USD")
  closeDate       DateTime?
  pipelineId      String          // FK -> Pipeline
  stageId         String          // FK -> PipelineStage
  probability     Int?      @default(0)
  ownerId         String?
  dealType        String?         // newbusiness, existingbusiness
  priority        String?         // low, medium, high
  properties      Json      @default("{}")
  deletedAt       DateTime?       // Soft delete
  closedAt        DateTime?
  closedReason    String?         // won, lost
  // Relations: tenant, owner, pipeline, stage, contacts[], companies[], activities[]
  // Indexes: tenantId, pipelineId, stageId, ownerId, closeDate, deletedAt
}
```

#### Pipeline Model (lines 335-354)
```prisma
model Pipeline {
  id          String    @id @default(uuid())
  tenantId    String
  name        String
  description String?
  isDefault   Boolean   @default(false)
  isActive    Boolean   @default(true)
  // Relations: tenant, stages[], deals[]
  // Indexes: tenantId, isDefault
}
```

#### PipelineStage Model (lines 356-377)
```prisma
model PipelineStage {
  id          String    @id @default(uuid())
  pipelineId  String
  name        String
  orderIndex  Int       @default(0)  // For column ordering
  probability Int       @default(0)  // 0-100
  color       String?                // Hex color for UI
  isClosed    Boolean   @default(false)
  isWon       Boolean   @default(false)
  // Relations: pipeline (cascade delete), deals[]
  // Indexes: pipelineId, orderIndex
}
```

#### Association Models
- **DealContact** (lines 239-249): M2M with role (decision_maker, influencer, blocker, champion)
- **DealCompany** (lines 251-261): M2M with isPrimary flag

**Assessment**: Schema is production-ready for Kanban. Key strengths:
- `PipelineStage.orderIndex` enables column ordering
- `PipelineStage.color` enables visual column differentiation
- `PipelineStage.isClosed/isWon` enables terminal stage logic
- `PipelineStage.probability` enables weighted pipeline calculations
- Soft delete via `deletedAt` on all CRM entities
- All necessary indexes are in place

### 1.2 Existing API Routes

#### GET /api/deals (`src/app/api/deals/route.ts`)
- Supports `page`, `limit`, `pipelineId`, `stageId` query params
- Includes: owner, stage (with color/probability), pipeline, contacts, companies
- Returns paginated response with `{ data, pagination }`
- **SECURITY ISSUE**: Missing `tenantId` filter in WHERE clause
- **ENHANCEMENT NEEDED**: Add `grouped=true` param to return deals grouped by stage

#### POST /api/deals (`src/app/api/deals/route.ts`)
- Requires: `name`, `pipelineId`, `stageId`
- Falls back to `body.tenantId || "demo-tenant"` -- needs proper tenant resolution
- **SECURITY ISSUE**: `tenantId` comes from request body, not session

#### GET /api/deals/[id] (`src/app/api/deals/[id]/route.ts`)
- Fetches single deal with full relations
- Includes pipeline.stages (ordered by orderIndex) -- good for showing stage progression
- **SECURITY ISSUE**: No `tenantId` check -- IDOR vulnerability

#### PATCH /api/deals/[id] (`src/app/api/deals/[id]/route.ts`)
- Supports partial update of all deal fields including `stageId`
- Handles `closedReason` with auto-setting `closedAt`
- **SECURITY ISSUE**: No `tenantId` check on update
- **ENHANCEMENT NEEDED**: When `stageId` changes, auto-update `probability` from stage

#### DELETE /api/deals/[id] (`src/app/api/deals/[id]/route.ts`)
- Correctly uses soft delete (`deletedAt: new Date()`)
- **SECURITY ISSUE**: No `tenantId` check

### 1.3 Existing Frontend Patterns

#### ContactsTable (`src/components/contacts/ContactsTable.tsx`)
- Pattern: `"use client"` component with internal state management
- Data fetching: `useCallback` + `useEffect` with `fetch()` to API routes
- Features: search, filter, sort, pagination, bulk select, export CSV
- UI: Tailwind CSS, Lucide icons, inline modal via ContactForm
- **Good pattern to follow for DealForm**

#### ContactForm (`src/components/contacts/ContactForm.tsx`)
- Pattern: Slide-in panel (right side, `max-w-[512px]`)
- Props: `isOpen`, `onClose`, `onSuccess`
- Features: company search/association, form validation, error handling
- **Good pattern to follow for DealForm** (slide-in panel)

#### ContactDetailPage (`src/app/(dashboard)/contacts/[id]/page.tsx`)
- Pattern: 3-column layout (sidebar + main + associations)
- Uses `use(params)` for Next.js 16 async params
- Tabs: overview + activity timeline
- Association management: search + add + remove
- **Good pattern to follow for DealDetailPage**

### 1.4 Existing UI Components
Located in `src/components/ui/`:
- `button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`
- `badge.tsx`, `avatar.tsx`, `card.tsx`
- `modal.tsx`, `dropdown.tsx`

### 1.5 Missing Items
- No `src/app/(dashboard)/deals/` page exists yet
- No `src/app/api/pipelines/` API routes exist yet
- No `src/components/companies/CompaniesTable.tsx` exists (referenced but not found)
- No drag-and-drop library installed yet
- No deals page in the dashboard sidebar

---

## 2. Database Audit

### 2.1 Record Counts

| Table | Count | Notes |
|-------|-------|-------|
| Deal | 5 | All belong to tenant `84d5dd22-...` |
| DealCompany | 0 | No deal-company associations yet |
| DealContact | 0 | No deal-contact associations yet |
| Pipeline | 1 | "Sales Pipeline" (default, active) |
| PipelineStage | 7 | Full HubSpot-like pipeline stages |

### 2.2 Pipeline Configuration

**Pipeline**: "Sales Pipeline" (id: `default-pipeline`)
- tenantId: `84d5dd22-9e29-425c-8ba0-1edfc255e236`
- isDefault: true, isActive: true
- 7 stages total

**Pipeline Stages** (ordered by `orderIndex`):

| ID | Name | Order | Probability | Color | Closed? | Won? |
|----|------|-------|-------------|-------|---------|------|
| stage-1 | Appointment Scheduled | 0 | 20% | #0891b2 | No | No |
| stage-2 | Qualified to Buy | 1 | 40% | #0ea5e9 | No | No |
| stage-3 | Presentation Scheduled | 2 | 60% | #22c55e | No | No |
| stage-4 | Decision Maker Bought-In | 3 | 80% | #eab308 | No | No |
| stage-5 | Contract Sent | 4 | 90% | #f97316 | No | No |
| stage-6 | Closed Won | 5 | 100% | #10b981 | Yes | Yes |
| stage-7 | Closed Lost | 6 | 0% | #ef4444 | Yes | No |

### 2.3 Current Deals Distribution

| Stage | Count | Total Amount |
|-------|-------|-------------|
| Appointment Scheduled | 1 | $15,000 |
| Qualified to Buy | 1 | $5,000 |
| Presentation Scheduled | 1 | $50,000 |
| Decision Maker Bought-In | 1 | $120,000 |
| Contract Sent | 1 | $25,000 |
| Closed Won | 0 | $0 |
| Closed Lost | 0 | $0 |
| **TOTAL** | **5** | **$215,000** |

### 2.4 Deal Details

| Name | Amount | Stage | Close Date |
|------|--------|-------|-----------|
| Agency Marketing Suite | $15,000 | Appointment Scheduled | 2026-03-03 |
| StartupIO Starter Package | $5,000 | Qualified to Buy | 2026-02-17 |
| TechCorp Enterprise Deal | $50,000 | Presentation Scheduled | 2026-02-10 |
| Enterprise Consulting Project | $120,000 | Decision Maker Bought-In | 2026-02-24 |
| New Business Opportunity | $25,000 | Contract Sent | 2026-03-10 |

All deals owned by user `c3c85b55-2609-430d-88c3-0990fc9789cf`.

---

## 3. Drag-and-Drop Library Research

### 3.1 Library Comparison

| Criteria | @dnd-kit/core | @hello-pangea/dnd | Native HTML5 DnD | pragmatic-drag-and-drop |
|----------|--------------|-------------------|------------------|------------------------|
| **Bundle Size** | ~12KB gzipped (core+sortable) | ~30KB gzipped | 0KB | ~15KB gzipped |
| **TypeScript** | First-class | Good (typed fork) | Manual types | First-class |
| **Accessibility** | Excellent (ARIA, keyboard) | Excellent | Poor | Good |
| **Touch Support** | Built-in sensors | Built-in | Needs polyfill | Built-in |
| **Keyboard DnD** | Built-in | Built-in | Not supported | Built-in |
| **API Complexity** | Moderate (hooks-based) | Simple (component-based) | Low-level | Moderate |
| **Customization** | Highly flexible | Opinionated | Full control | Flexible |
| **React 19 Compat** | Yes | Yes | N/A | Yes |
| **Maintenance** | Active (community) | Active (fork) | Browser native | Active (Atlassian) |
| **npm Weekly DL** | ~1.5M | ~600K | N/A | ~300K |
| **Kanban Suitability** | Excellent | Excellent | Fair | Good |
| **Multi-container** | Via @dnd-kit/sortable | Built-in | Manual | Built-in |
| **Drag Overlay** | Built-in DragOverlay | Built-in snapshot | Manual | Manual |

### 3.2 Recommendation: `@dnd-kit/core` + `@dnd-kit/sortable`

**Why @dnd-kit wins for this project:**

1. **Smallest bundle**: ~12KB vs ~30KB for hello-pangea/dnd. Critical for Next.js performance.
2. **Best accessibility**: Full ARIA support, screen reader announcements, keyboard navigation. HubSpot-grade UX.
3. **Most flexible**: Custom collision detection, sensors, and drag overlays. We can implement HubSpot's exact drag behavior.
4. **React 19 compatible**: Uses hooks exclusively, no deprecated lifecycle methods.
5. **Touch + keyboard**: Built-in support for mobile CRM users.
6. **Active ecosystem**: Most downloaded React DnD library, extensive community.

**Packages to install:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Key hooks and components needed:**
- `DndContext` -- wraps the entire Kanban board
- `useDroppable` -- makes each stage column a drop target
- `useSortable` -- makes each deal card draggable AND sortable within a column
- `SortableContext` -- provides sortable behavior within each column
- `DragOverlay` -- renders a floating copy of the dragged card for smooth UX
- `closestCorners` or `rectIntersection` -- collision detection for multi-column

### 3.3 Implementation Architecture

```
DndContext (onDragStart, onDragOver, onDragEnd)
  |
  +-- [For each PipelineStage]
  |     |
  |     +-- StageColumn (useDroppable)
  |           |
  |           +-- SortableContext (items=dealIds)
  |                 |
  |                 +-- DealCard (useSortable) x N
  |
  +-- DragOverlay
        |
        +-- DealCard (clone of active deal)
```

**Critical implementation details:**
- Use `onDragOver` (not just `onDragEnd`) to handle cross-container moves
- Track `activeId` state for DragOverlay rendering
- Use `closestCorners` collision detection for multi-column scenarios
- Implement optimistic UI update on `onDragEnd`, then PATCH to API
- Rollback UI state if API call fails

---

## 4. API Design

### 4.1 Enhanced Existing Endpoints

#### GET /api/deals (enhanced)
```
GET /api/deals?pipelineId=xxx&grouped=true
```
New query param: `grouped=true` returns deals grouped by stage:
```json
{
  "pipeline": {
    "id": "default-pipeline",
    "name": "Sales Pipeline"
  },
  "stages": [
    {
      "id": "stage-1",
      "name": "Appointment Scheduled",
      "orderIndex": 0,
      "color": "#0891b2",
      "probability": 20,
      "isClosed": false,
      "isWon": false,
      "deals": [...],
      "totalAmount": 15000,
      "count": 1
    },
    ...
  ],
  "summary": {
    "totalDeals": 5,
    "totalAmount": 215000,
    "weightedAmount": 127000
  }
}
```

**MUST add**: `WHERE tenantId = ?` on all queries.

#### PATCH /api/deals/[id] (enhanced for drag-drop)
```
PATCH /api/deals/[id]
Body: { "stageId": "stage-3" }
```
Enhancement: When `stageId` changes:
1. Validate the stageId belongs to the same pipeline
2. Auto-update `probability` from the target stage's probability
3. If moving to a closed stage (isClosed=true), set `closedAt` and `closedReason` (won/lost based on isWon)
4. If moving FROM a closed stage to an open stage, clear `closedAt` and `closedReason`
5. Return the updated deal with stage and pipeline info

### 4.2 New Endpoints Needed

#### GET /api/pipelines
```
GET /api/pipelines
```
Returns all active pipelines for the tenant with stage counts:
```json
{
  "data": [
    {
      "id": "default-pipeline",
      "name": "Sales Pipeline",
      "isDefault": true,
      "stages": [...],
      "dealCount": 5,
      "totalAmount": 215000
    }
  ]
}
```

#### GET /api/pipelines/[id]
```
GET /api/pipelines/[id]
```
Returns full pipeline detail with stages ordered by orderIndex.

#### POST /api/pipelines (P1 - future)
Create a new pipeline with stages. Deferred to later sprint.

#### PATCH /api/pipelines/[id] (P1 - future)
Update pipeline name/description, add/remove/reorder stages. Deferred.

### 4.3 API Security Checklist

| Endpoint | tenantId Check | Input Validation | IDOR Prevention |
|----------|---------------|-----------------|-----------------|
| GET /api/deals | MISSING - ADD | Need Zod schema | Need tenant scope |
| POST /api/deals | FROM BODY - FIX | Partial - enhance | Need tenant scope |
| PATCH /api/deals/[id] | MISSING - ADD | None - ADD Zod | Need tenant scope |
| DELETE /api/deals/[id] | MISSING - ADD | N/A | Need tenant scope |
| GET /api/pipelines | NEW - ADD | N/A | New - include |
| GET /api/pipelines/[id] | NEW - ADD | UUID validation | New - include |

---

## 5. File Manifest

### 5.1 P0 Scope (MVP Kanban Board)

#### API Routes (Modify Existing)
| File | Action | Est. Lines | Purpose |
|------|--------|-----------|---------|
| `src/app/api/deals/route.ts` | MODIFY | 90 -> 150 | Add grouped response, tenantId filter |
| `src/app/api/deals/[id]/route.ts` | MODIFY | 92 -> 130 | Add stage transition logic, tenantId filter |

#### API Routes (New)
| File | Action | Est. Lines | Purpose |
|------|--------|-----------|---------|
| `src/app/api/pipelines/route.ts` | CREATE | ~60 | List pipelines for tenant |
| `src/app/api/pipelines/[id]/route.ts` | CREATE | ~50 | Get pipeline with stages |

#### Frontend Components (New)
| File | Action | Est. Lines | Purpose |
|------|--------|-----------|---------|
| `src/components/deals/KanbanBoard.tsx` | CREATE | ~250 | Main board with DndContext |
| `src/components/deals/StageColumn.tsx` | CREATE | ~80 | Droppable column container |
| `src/components/deals/DealCard.tsx` | CREATE | ~100 | Draggable deal card |
| `src/components/deals/DealForm.tsx` | CREATE | ~200 | Slide-in create/edit form |
| `src/components/deals/PipelineHeader.tsx` | CREATE | ~60 | Pipeline selector + summary stats |

#### Page Wrappers (New)
| File | Action | Est. Lines | Purpose |
|------|--------|-----------|---------|
| `src/app/(dashboard)/deals/page.tsx` | CREATE | ~30 | Deals Kanban page wrapper |

#### Sidebar Update (Modify)
| File | Action | Est. Lines | Purpose |
|------|--------|-----------|---------|
| `src/components/dashboard/AppSidebar.tsx` | MODIFY | +5 | Add "Deals" nav item |

#### Package Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**P0 Total: ~1,115 lines across 10 files (4 modify, 6 create)**

### 5.2 P1 Enhancements (Post-MVP)

| File | Action | Est. Lines | Purpose |
|------|--------|-----------|---------|
| `src/app/(dashboard)/deals/[id]/page.tsx` | CREATE | ~400 | Deal detail page (3-col layout) |
| `src/components/deals/DealTimeline.tsx` | CREATE | ~120 | Activity timeline on deal |
| `src/components/deals/StageProgress.tsx` | CREATE | ~60 | Visual stage progression bar |
| `src/app/api/pipelines/route.ts` | ENHANCE | +80 | Pipeline CRUD (POST) |
| `src/app/api/pipelines/[id]/route.ts` | ENHANCE | +100 | Pipeline update (PATCH, DELETE) |
| `src/components/deals/DealAssociations.tsx` | CREATE | ~150 | Contact/Company association panel |
| `src/components/deals/DealFilters.tsx` | CREATE | ~80 | Filter bar (owner, amount, date) |
| Zod validation schemas | CREATE | ~60 | Input validation for all deal endpoints |

---

## 6. Security Concerns

### 6.1 Critical: Multi-Tenancy (PRIORITY 1)

**Current State**: All deal API routes are missing `tenantId` checks. This is an IDOR vulnerability.

**Required Fix** (every query must include):
```typescript
// Derive tenantId from authenticated session, NOT from request body
const tenantId = await getTenantIdFromSession(request);

// Every Prisma query must scope by tenant
const deals = await prisma.deal.findMany({
  where: {
    tenantId,          // <-- MANDATORY
    deletedAt: null,
    pipelineId,
  },
});
```

**For the demo** (no auth yet), use a constant:
```typescript
const DEMO_TENANT_ID = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
```

### 6.2 Stage Transition Validation

**Concern**: Should we restrict which stage transitions are allowed?

**HubSpot Behavior**: HubSpot allows free-form stage moves (any stage to any stage). No forced linear progression.

**Recommendation**: Allow any transition but add special handling for:
- Moving to `Closed Won` -> set `closedAt`, `closedReason = "won"`
- Moving to `Closed Lost` -> set `closedAt`, `closedReason = "lost"`
- Moving FROM closed to open -> clear `closedAt`, `closedReason`
- **Validate**: Target `stageId` must belong to the deal's current `pipelineId`
- **Validate**: Target `stageId` must exist and not be soft-deleted

### 6.3 Amount Validation

```typescript
// Zod schema for deal amount
const dealAmountSchema = z.number()
  .min(0, "Amount cannot be negative")
  .max(999999999999.99, "Amount exceeds maximum")
  .optional();
```

### 6.4 IDOR Prevention on Deal Updates

```typescript
// PATCH /api/deals/[id]
// MUST verify the deal belongs to the current tenant
const deal = await prisma.deal.findFirst({
  where: {
    id,
    tenantId,        // <-- CRITICAL: prevents IDOR
    deletedAt: null,
  },
});

if (!deal) {
  return NextResponse.json({ error: "Deal not found" }, { status: 404 });
}
```

### 6.5 Pipeline Access Control

```typescript
// When validating stageId changes, verify the pipeline belongs to tenant
const stage = await prisma.pipelineStage.findFirst({
  where: {
    id: newStageId,
    pipeline: {
      tenantId,      // <-- Verify pipeline ownership via relation
    },
  },
});
```

### 6.6 Rate Limiting (P1)

Drag-and-drop can trigger rapid API calls. Consider:
- Debounce PATCH calls (only send after 500ms of no further drags)
- Optimistic UI updates with rollback on failure
- Queue rapid moves and batch them

---

## 7. Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DnD Library | @dnd-kit/core + sortable | Smallest bundle, best accessibility, React 19 compat |
| State Management | Local state (useState) | Consistent with existing codebase pattern |
| Data Fetching | fetch() in useCallback | Consistent with ContactsTable pattern |
| Form Pattern | Slide-in panel | Consistent with ContactForm pattern |
| Optimistic Updates | Yes, with rollback | Smooth drag-drop UX requires instant visual feedback |
| Stage Transitions | Free-form (any to any) | Matches HubSpot behavior |
| Closed Stage Logic | Auto-set closedAt/closedReason | Business requirement for pipeline reporting |
| tenantId Strategy | Hardcoded demo tenant (for now) | Auth not implemented yet; placeholder ready |

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| @dnd-kit SSR issues in Next.js | Medium | Use `"use client"` directive, dynamic import if needed |
| Drag performance with many deals | Low | 5 deals now; virtualize at >100 deals per column (P2) |
| Concurrent edits (two users dragging) | Low | Single-user demo; add optimistic locking later |
| Missing tenantId on existing routes | High | Fix in this sprint before building UI |
| Mobile drag UX | Medium | @dnd-kit has touch sensors; test on mobile viewport |

---

## 9. Implementation Order

1. **Install @dnd-kit packages** (5 min)
2. **Fix security: Add tenantId to existing deal routes** (30 min)
3. **Create pipeline API routes** (30 min)
4. **Build KanbanBoard + StageColumn + DealCard** (2-3 hours)
5. **Build DealForm (slide-in panel)** (1 hour)
6. **Build PipelineHeader** (30 min)
7. **Create deals page + add sidebar nav** (15 min)
8. **Test drag-drop + API integration** (1 hour)
9. **UI polish: animations, mobile responsive** (1 hour)

**Estimated Total: ~7-8 hours**
