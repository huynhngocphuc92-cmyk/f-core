# Workflow Automation - Implementation Plan

> **Date:** 2026-02-08
> **Based on:** Research Synthesis (docs/research/workflow-automation/research-summary.md)
> **Scope:** MVP (P0 + P1 features)

---

## Phase 1: Database Schema & Seed Data

### 1.1 Prisma Schema Additions
Add 6 new models to `prisma/schema.prisma`:

1. **WorkflowDefinition** - Core workflow storage (JSONB hybrid)
2. **WorkflowVersion** - Version history snapshots
3. **WorkflowExecution** - Runtime execution state
4. **WorkflowStepLog** - Step-level audit trail
5. **WorkflowEnrollment** - Enrollment tracking
6. **CrmEvent** - Event sourcing for triggers

Update `Tenant` model to add `workflows` relation.

### 1.2 Migration
Run `npx prisma migrate dev --name add_workflow_tables`

### 1.3 Seed Data
Add to `prisma/seed.ts`:
- 3 sample workflows (1 active, 1 draft, 1 paused)
- Sample steps (trigger -> action -> delay -> condition -> action)
- Sample executions and step logs

---

## Phase 2: Backend API Routes

### 2.1 Workflow CRUD (`/api/workflows`)
Following existing patterns from contacts/companies routes:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/workflows` | List workflows (paginated, filterable by status/objectType) |
| POST | `/api/workflows` | Create new workflow |
| GET | `/api/workflows/[id]` | Get single workflow with steps |
| PUT | `/api/workflows/[id]` | Update workflow (name, description, steps, trigger, settings) |
| DELETE | `/api/workflows/[id]` | Soft delete workflow |
| POST | `/api/workflows/[id]/activate` | Set status to active |
| POST | `/api/workflows/[id]/deactivate` | Set status to paused |

### 2.2 Execution Routes
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/workflows/[id]/executions` | List executions (paginated) |
| POST | `/api/workflows/[id]/execute` | Manual enrollment/execution |

### 2.3 Validation
- Zod schemas in `src/lib/workflow/schemas.ts`
- Validate all inputs (name, objectType, triggerConfig, steps)

---

## Phase 3: Frontend Components

### 3.1 Install React Flow
```bash
npm install @xyflow/react
```

### 3.2 Workflow List Page
`src/app/(dashboard)/workflows/page.tsx`
- Server component (same pattern as contacts page)
- Table with columns: Status toggle, Name, Type, Object, Enrolled, Last Modified
- Filters: All | Active | Paused | Draft
- Search, Create button
- Empty state

### 3.3 Workflow Builder Page
`src/app/(dashboard)/workflows/[id]/builder/page.tsx`
- Client component (React Flow requires client-side rendering)
- Top bar: back, name, status badge, publish button
- Canvas: React Flow with custom nodes
- Left panel: step palette / step configuration

### 3.4 Custom Node Components
`src/components/workflow/nodes/`
- TriggerNode.tsx - Enrollment trigger (green accent)
- ActionNode.tsx - Action steps (cyan accent)
- ConditionNode.tsx - If/then branches (yellow accent)
- DelayNode.tsx - Wait/delay steps (purple accent)
- AddStepNode.tsx - "+" button between nodes

### 3.5 Builder Components
`src/components/workflow/`
- WorkflowCanvas.tsx - React Flow wrapper
- StepPalette.tsx - Sidebar with draggable step types
- StepConfigPanel.tsx - Configuration form for selected step

### 3.6 Sidebar Update
Add "Workflows" to sidebar navigation in `src/components/layout/Sidebar.tsx`

---

## Phase 4: Workflow Engine (Simplified MVP)

### 4.1 Core Files
- `src/lib/workflow/types.ts` - TypeScript types
- `src/lib/workflow/constants.ts` - Action types, status enums
- `src/lib/workflow/schemas.ts` - Zod validation
- `src/lib/workflow/engine.ts` - DAG executor (sequential for MVP)

### 4.2 MVP Engine Scope
For MVP, the engine supports:
- Manual execution only (user clicks "Run" on a record)
- Sequential step execution (no parallel branches)
- Actions: update_property, create_task, send_notification
- If/then: evaluate simple property conditions
- Delay: record next_step_at and process via cron-like polling

---

## Execution Order

1. **Database Engineer:** Schema + Migration + Seed (Phase 1)
2. **Backend Developer:** API Routes + Validation + Engine (Phase 2 + 4)
3. **Frontend Developer:** Components + Builder + List (Phase 3) - can start in parallel with backend after schema is ready
4. **Integration:** Wire up frontend to API, sidebar update, testing
