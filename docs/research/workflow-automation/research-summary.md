# Workflow Automation - Research Synthesis

> **Date:** 2026-02-08
> **Reports Synthesized:** competitive-analysis.md, ux-patterns.md, tech-research.md
> **Decision:** Ready for Implementation Planning

---

## 1. Executive Summary

Three parallel research streams analyzed workflow automation from competitive, UX, and technical perspectives. All three converge on a clear architectural direction for F-CORE:

**Build a HubSpot-style enrollment-based workflow engine using PostgreSQL-native infrastructure and React Flow for the visual builder.**

This approach:
- Mirrors HubSpot's proven UX (the gold standard for CRM workflows)
- Leverages our existing Supabase/PostgreSQL stack (zero new infrastructure)
- Uses React Flow, the industry-standard library (35K+ stars, MIT license, Next.js/Tailwind compatible)
- Supports incremental complexity (MVP linear flows -> advanced branching -> enterprise features)

---

## 2. Convergent Findings (All 3 Reports Agree)

### 2.1 Architecture: Object-Centric, Enrollment-Based Model
All reports confirm HubSpot's workflow paradigm is the natural fit for CRM:
- **Object-centric:** Each workflow operates on one CRM object type (contact, company, deal)
- **Enrollment-based:** Records enter workflows via triggers, progress through sequential actions
- **Three-part structure:** Trigger -> Actions -> Logic/Branching

### 2.2 Visual Builder: Vertical Auto-Layout
- Competitive analysis: HubSpot and Salesforce both use vertical top-to-bottom flow
- UX research: Vertical layout has the lowest learning curve for CRM users
- Tech research: React Flow supports auto-layout via dagre/elkjs algorithms

### 2.3 Canvas Library: React Flow (@xyflow/react)
- 35,100+ GitHub stars, 4.1M+ weekly npm installs
- MIT licensed, used by Stripe, Typeform, Vercel
- Direct alignment with F-CORE stack (Next.js, Tailwind, shadcn/ui)
- Custom node/edge components support our CRM-specific UI needs

### 2.4 Execution: PostgreSQL-Native (No Redis/External Queues)
- **Supabase Queues (pgmq):** Message queue built into our Supabase instance
- **pg_cron:** Scheduled trigger evaluation and delay processing
- **PostgreSQL triggers:** Property change detection via NOTIFY channels
- **Supabase Realtime:** Live execution monitoring for the UI

### 2.5 Storage: Hybrid Normalized + JSONB
- Core metadata (name, status, tenant_id) in normalized columns for fast filtering
- Workflow logic (steps, triggers, conditions) in JSONB for flexibility
- GIN indexes on JSONB columns for containment queries

---

## 3. Key Architectural Decisions

### ADR-1: Workflow Engine Type
**Decision:** Custom lightweight DAG executor (not XState, not Temporal)
**Rationale:** XState adds unnecessary bundle size for backend. Temporal requires a dedicated cluster. A custom TypeScript DAG executor is simpler, lighter, and sufficient for CRM workflows.

### ADR-2: Job Queue Technology
**Decision:** Supabase Queues (pgmq) for MVP, upgrade path to Inngest/pg-boss
**Rationale:** Weighted score analysis (Tech Research Section 3.6):
- pgmq: 8.75/10 (best stack fit, zero infrastructure, lowest cost)
- Inngest: 7.65/10 (best DX but SaaS cost)
- pg-boss: 7.15/10 (good but needs persistent process)

### ADR-3: Visual Builder Library
**Decision:** React Flow (@xyflow/react) v12+
**Rationale:** Industry standard, MIT licensed, Next.js compatible, Tailwind-ready. Alternatives (reaflow, Flowy, flow-builder) all have significantly smaller communities.

### ADR-4: Step Configuration UI
**Decision:** Left-side slide-in panel (HubSpot-style with n8n influence)
**Rationale:** Keeps workflow diagram visible while editing node details. Better than full-screen modals (Salesforce) or inline editing (Pipedrive).

### ADR-5: Mobile Strategy
**Decision:** Read-only monitoring with quick enable/disable toggle
**Rationale:** No major CRM provides a mobile workflow builder. Desktop-first with mobile monitoring is the industry consensus.

### ADR-6: Error Handling
**Decision:** Per-action retry with exponential backoff (n8n + Make pattern)
**Rationale:** HubSpot's error handling is basic. n8n/Make provide superior patterns: configurable retries per action type, error fallback paths, circuit breakers for repeated failures.

---

## 4. Data Model (Unified from All Reports)

Six core tables, refined from overlapping proposals across all three reports:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `workflow_definitions` | Workflow metadata + JSONB steps | name, object_type, status, trigger_config (JSONB), steps (JSONB), viewport (JSONB), settings (JSONB), tenant_id, deleted_at |
| `workflow_versions` | Version history snapshots | workflow_id, version, trigger_config, steps, change_summary |
| `workflow_executions` | Runtime execution state | workflow_id, object_id, status, current_step_id, step_results (JSONB), error_message, next_step_at |
| `workflow_step_logs` | Audit trail per step | execution_id, step_id, status, input_data, output_data, duration_ms, attempt |
| `workflow_enrollments` | Enrollment tracking | workflow_id, object_id, enrolled_by, unenrolled_at, unenroll_reason |
| `crm_events` | Event sourcing for triggers | event_type, object_type, object_id, property_name, old_value, new_value |

All tables include `tenant_id` for multi-tenancy and appropriate indexes.

---

## 5. MVP Scope (P0 Features)

Consensus MVP features from all three reports:

| Feature | Source |
|---------|--------|
| Workflow CRUD (create, list, edit, soft delete) | All 3 |
| Visual builder with React Flow (vertical auto-layout) | UX + Tech |
| Trigger: property change | Competitive + Tech |
| Trigger: record created | Competitive + Tech |
| Trigger: manual enrollment | Competitive |
| Action: update property | All 3 |
| Action: create task | All 3 |
| Action: send notification | All 3 |
| Action: delay/wait | All 3 |
| Action: send email | All 3 |
| If/then branching (single condition) | All 3 |
| Enable/disable toggle | UX |
| Pre-publish validation | UX |
| Basic execution history | All 3 |
| Workflow list with status filters | UX |

### Deferred to Phase 2:
- Multi-branch if/then, value-equals branching
- Re-enrollment settings, suppression lists
- Workflow cloning, folders
- Dry-run simulation, performance metrics dashboard
- Schedule-based triggers, webhooks

### Deferred to Phase 3:
- AI-assisted workflow creation
- Cross-object workflows
- Custom code actions
- Workflow templates library
- Version comparison

---

## 6. Implementation File Structure

```
src/
  lib/
    workflow/
      engine.ts                 # Core DAG execution engine
      trigger-evaluator.ts      # Evaluate trigger conditions
      action-handlers/
        index.ts                # Action handler registry
        update-property.ts
        create-task.ts
        send-email.ts
        send-notification.ts
        delay.ts
        webhook.ts
      schemas.ts                # Zod validation schemas
      types.ts                  # TypeScript types
      constants.ts              # Action types, status enums
  app/
    (dashboard)/
      workflows/
        page.tsx                # Workflow list page
        [id]/
          page.tsx              # Workflow detail/edit page
          builder/
            page.tsx            # Visual workflow builder
        actions.ts              # Server Actions
    api/
      workflows/
        route.ts                # Workflow CRUD
        [id]/
          route.ts              # Single workflow operations
          execute/
            route.ts            # Manual execution trigger
        process/
          route.ts              # Queue consumer endpoint
  components/
    workflow/
      WorkflowBuilder.tsx       # Main builder component
      WorkflowCanvas.tsx        # React Flow canvas
      StepPalette.tsx           # Drag-and-drop step sidebar
      StepConfigPanel.tsx       # Step configuration form
      ExecutionHistory.tsx      # Execution log viewer
      nodes/
        TriggerNode.tsx
        ActionNode.tsx
        ConditionNode.tsx
        DelayNode.tsx
        AddStepNode.tsx
```

---

## 7. New Dependencies

| Package | Purpose | Size Impact |
|---------|---------|-------------|
| `@xyflow/react` ^12.x | Visual workflow builder | ~50KB gzipped |
| `date-fns` ^3.x | Delay/timing calculations | ~6KB (tree-shakeable) |

Already in stack: `zod`, `@prisma/client`, `@supabase/supabase-js`, `tailwindcss`

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| React Flow bundle size | Page load speed | Dynamic import, code split builder page |
| pgmq reliability at scale | Execution failures | Implement dead letter queue, fallback to pg-boss if needed |
| Complex branching UI | User confusion | Start with simple if/then only, progressive disclosure |
| Delay precision (pg_cron) | Delays off by minutes | Acceptable for CRM (not real-time); document as "approximate" |
| JSONB query performance | Slow filtering | GIN indexes on trigger_config and steps columns |

---

## 9. Gate 1 Checklist

- [x] competitive-analysis.md: 6 platforms analyzed (HubSpot, Salesforce, Pipedrive, Zapier, Make, n8n) with 14 comparison matrices
- [x] ux-patterns.md: 12 sections including wireframes, user flows, accessibility requirements, 22 research sources
- [x] tech-research.md: 10 sections including complete SQL schema, Prisma models, code examples, 2,043 lines
- [x] research-summary.md: This document - unified synthesis with 6 ADRs, MVP scope, data model, file structure
- [x] Key decisions stored in Memory MCP

**Verdict: GATE 1 PASS** - Research is comprehensive, consistent across all three reports, and provides clear direction for implementation.

---

*Synthesized: 2026-02-08*
*Next: Implementation Plan (Task #151)*
