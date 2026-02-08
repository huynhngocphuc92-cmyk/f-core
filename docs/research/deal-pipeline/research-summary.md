# Deal Pipeline Kanban Board - Research Summary

> **Date**: 2026-02-08
> **Author**: Research Director (Synthesis)
> **Status**: Complete
> **Sources**: competitive-analysis.md, ux-patterns.md, tech-research.md

---

## Executive Summary

The Deal Pipeline Kanban Board is the #1 workspace for sales teams across HubSpot, Salesforce, and Pipedrive. All three platforms treat the kanban board as a primary interface with drag-and-drop stage transitions, customizable deal cards, and weighted pipeline calculations.

Our database schema (Pipeline, PipelineStage, Deal models) is production-ready with 5 seeded deals, 1 pipeline, and 7 stages. The existing deal API routes have a **critical security gap** (missing tenantId) that must be fixed in this sprint.

---

## Key Decisions

| Decision | Choice | Source |
|----------|--------|--------|
| DnD Library | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | Tech Research - smallest bundle (12KB), best a11y, React 19 compat |
| Card Layout | Deal name, amount, company, close date, owner avatar | Competitive Analysis - consistent across all 3 platforms |
| Stage Transitions | Free-form (any stage to any stage) | Competitive - matches HubSpot behavior |
| Closed Stage Logic | Auto-set closedAt/closedReason on Closed Won/Lost | UX Patterns - terminal stage handling |
| Deal Form | 512px slide-in panel (right side) | UX Patterns + existing ContactForm pattern |
| Column Width | 280px fixed | UX Patterns - optimal for card readability |
| State Management | Local state (useState/useCallback) | Tech Research - consistent with existing ContactsTable |
| Optimistic Updates | Yes, with rollback on error | UX Patterns - smooth drag UX requires instant feedback |

---

## P0 Scope (This Sprint)

### Files to Modify (4)
1. `src/app/api/deals/route.ts` — Add tenantId, grouped response mode, enhanced filters
2. `src/app/api/deals/[id]/route.ts` — Add tenantId, stage transition logic (auto-probability, closedAt)
3. `src/components/layout/Sidebar.tsx` — Add "Deals" nav item with pipeline icon
4. `prisma/seed.ts` — Add deal-contact and deal-company associations for test data

### Files to Create (7)
1. `src/app/api/pipelines/route.ts` — GET pipelines for tenant (~60 lines)
2. `src/app/api/pipelines/[id]/route.ts` — GET pipeline with stages (~50 lines)
3. `src/components/deals/KanbanBoard.tsx` — Main board with DndContext, drag handlers (~300 lines)
4. `src/components/deals/StageColumn.tsx` — Droppable column with header/body/footer (~120 lines)
5. `src/components/deals/DealCard.tsx` — Draggable deal card with 6 fields (~120 lines)
6. `src/components/deals/DealForm.tsx` — Slide-in create form with associations (~250 lines)
7. `src/app/(dashboard)/deals/page.tsx` — Deals page wrapper (~30 lines)

### Total: ~1,100 lines across 11 files

---

## Critical Security Fix

**ALL existing deal API routes are missing tenantId WHERE clauses.** This is an IDOR vulnerability.

Fix pattern (same as Contacts Page):
```typescript
const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
// Every query: where: { tenantId, deletedAt: null, ... }
```

---

## Database State

| Entity | Count | Notes |
|--------|-------|-------|
| Pipeline | 1 | "Sales Pipeline" (default, active) |
| PipelineStage | 7 | Full stages with colors, probabilities |
| Deal | 5 | $215,000 total value |
| DealCompany | 0 | Need associations for UI testing |
| DealContact | 0 | Need associations for UI testing |

**Stage Distribution**: 1 deal per stage (Appointment Scheduled through Contract Sent), 0 in Closed Won/Lost.

---

## Implementation Order

1. Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
2. Fix security: Add tenantId to existing deal routes (GET, POST, PATCH, DELETE)
3. Enhance PATCH: auto-update probability on stage change, handle closedAt/closedReason
4. Create pipeline API routes (GET /api/pipelines, GET /api/pipelines/[id])
5. Build KanbanBoard + StageColumn + DealCard components
6. Build DealForm slide-in panel
7. Create deals page + add sidebar nav item
8. Polish: animations, empty states, loading skeleton

---

## Deferred to P1

- Deal detail page (3-column layout like Contacts)
- Deal timeline/activity log
- Table/list view toggle
- Advanced filters (amount range, date range, priority)
- Saved filter presets
- Deal rotting indicators
- Loss reason capture modal
- Pipeline CRUD (create/edit/delete pipelines)
- Zod validation schemas
- Mobile responsive (tabbed column view)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| @dnd-kit SSR in Next.js | `"use client"` directive on all DnD components |
| Missing tenantId (IDOR) | Fix FIRST before building any new features |
| Drag performance | Only 5 deals; virtualize at >100 per column (P2) |
| Mobile drag UX | @dnd-kit touch sensors; "Move to..." context menu fallback |
