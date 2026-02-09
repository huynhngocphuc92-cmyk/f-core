# Ticketing System - Research Summary

> **Feature:** #10 Ticketing System (Service Hub)
> **Date:** 2026-02-09
> **Status:** Research Complete - Gate 1 PASS

---

## Research Documents

| Document | Lines | Key Findings |
|----------|-------|-------------|
| competitive-analysis.md | 770 | HubSpot, Zendesk, Freshdesk, Intercom compared across 13 dimensions |
| ux-patterns.md | 936 | 7 sections covering ticket creation, views, detail page, SLA indicators, priority/status visual hierarchy, agent experience |
| tech-research.md | 1531 | Complete Prisma schema, API design, ticket numbering, SLA algorithm, search/filtering, performance |

## Key Decisions

### 1. Architecture
- **Separate TicketPipeline** (not reusing Deal Pipeline) - ticket stages have different semantics (type-based lifecycle vs probability-based)
- **7 Prisma models**: Ticket, TicketComment, TicketPipeline, TicketPipelineStage, TicketSLAPolicy, TicketActivity, TicketCounter
- **CRM-native**: Tickets link to Contact, Company via foreign keys

### 2. Ticket Numbering
- Counter table with atomic UPSERT per tenant
- Stored as `Int`, displayed as `T-0001` at presentation layer
- Concurrency-safe via `INSERT ... ON CONFLICT DO UPDATE`

### 3. SLA System
- Calculated on-the-fly from activity log (no continuous write overhead)
- Business hours support with timezone handling
- 4 default policies: Urgent (30min/4h), High (1h/8h), Medium (4h/24h), Low (8h/72h)
- SLA pause on "waiting" statuses

### 4. Search Strategy
- Phase 1: Prisma `contains` with case-insensitive mode (ILIKE) - sufficient for demo
- Phase 2: PostgreSQL tsvector + GIN index for production scale

### 5. UI Approach
- List view (default) + Kanban board view (pipeline stages)
- Ticket detail: 3-column layout (header, conversation, sidebar)
- Status: New, Open, In Progress, Waiting, Resolved, Closed
- Priority: Urgent (red), High (orange), Normal (blue), Low (gray)
- Public replies vs Internal notes toggle

### 6. Scope for Sprint (Demo Phase)
**Include:**
- Ticket CRUD with pipeline/stages
- Comment threading (public + internal)
- Priority/status system with visual indicators
- Basic SLA display (timer visualization)
- List view + Kanban board
- Ticket detail page
- Assignment
- Filtering and search

**Defer:**
- Customer portal
- Knowledge base integration
- Email channel auto-create
- Canned responses / macros
- Real-time collision detection
- AI classification

## Gate 1 Checklist

- [x] competitive-analysis.md exists with >= 3 competitor references (4 competitors: HubSpot, Zendesk, Freshdesk, Intercom)
- [x] ux-patterns.md has user flow descriptions (7 sections with detailed UX patterns)
- [x] tech-research.md has recommended approach (complete Prisma schema + API design + algorithms)
- [x] research-summary.md synthesizes findings (this document)
- [x] Key decisions documented

## Gate 1 Verdict: **PASS**
