# F-CORE MASTER PLAN
> Version: 2.0
> Project: F-CORE - HubSpot CRM Clone
> Updated: 2026-02-07
> Status: ACTIVE
> Research: `docs/research/master-plan-research/`

---

## I. TAM NHIN & MUC TIEU

### Vision
Xay dung F-CORE thanh mot CRM platform hoan chinh, clone 80% tinh nang HubSpot voi UI/UX hien dai, modern tech stack (Next.js 16, Supabase), va chien luoc gia minh bach. Nham vao thi truong SMB/Mid-market tai Viet Nam va Dong Nam A.

### Core Identity (6 Pillars)

| # | Pillar | Description |
|---|--------|-------------|
| 1 | **All-in-one for free** | Free tier khong gioi han contacts, full CRUD, basic automation, khong branding |
| 2 | **Modern by design** | Next.js 16, React 19, Supabase - khong phai legacy adapted |
| 3 | **Open and transparent** | Open source, transparent pricing, self-hostable |
| 4 | **AI from day 1** | AI tich hop vao moi workflow - summaries, suggestions, predictions |
| 5 | **Developer-friendly** | API-first, webhook-first, extensible architecture |
| 6 | **Pipeline-first UX** | Pipedrive's simplicity + HubSpot's breadth |

### Success Metrics
- [ ] 100% responsive (mobile/tablet/desktop)
- [ ] Page load < 2 seconds
- [ ] Lighthouse score > 90
- [ ] 0 critical security vulnerabilities
- [ ] Multi-tenant data isolation verified
- [ ] All CRM entities use soft delete

---

## II. COMPETITIVE LANDSCAPE

> Full analysis: `docs/research/master-plan-research/competitive-analysis.md`

### HubSpot (Primary Clone Target)

| Aspect | Details |
|--------|---------|
| **7 Hubs** | Marketing, Sales, Service, Content, Data, Commerce + Breeze AI |
| **Free Tier** | 1,000 contacts, 2 users, 10 custom properties, 1 pipeline, no automation |
| **Pricing** | $20-$3,600/mo, complex tiers, mandatory onboarding fees |
| **Strength** | All-in-one platform, ease of use, inbound marketing |
| **Weakness** | Pricing opacity, contact limits, branding on free tier |

### Salesforce (Enterprise Reference)

| Aspect | Details |
|--------|---------|
| **Market Share** | 19.5% (#1 overall) |
| **Pricing** | $25-$500/user/mo, no free plan |
| **Strength** | Extreme customization (Apex, Lightning), enterprise scale |
| **Weakness** | Complex setup ($10K-$100K+ implementation), steep learning curve |

### Pipedrive (UX Reference)

| Aspect | Details |
|--------|---------|
| **Focus** | Sales pipeline management |
| **Pricing** | $14-$79/user/mo, transparent per-user |
| **Strength** | Pipeline visualization, simplicity, deal rotting feature |
| **Weakness** | No marketing/service tools, limited customization |

### F-CORE Differentiators

| vs HubSpot | vs Salesforce | vs Pipedrive |
|-----------|--------------|-------------|
| No contact limit (free) | Free tier exists | All-in-one platform |
| Transparent pricing | Setup in minutes | Custom objects/properties |
| No branding (free) | Ease of use | Full dashboard builder |
| Open source | All-in-one | Workflow automation |
| Modern tech stack | Modern UX | Content management |

---

## III. KIEN TRUC HE THONG

### A. Product Architecture

```
+---------------------------------------------------------+
|                      F-CORE CRM                          |
+----------+--------+---------+--------+--------+---------+
| Contacts | Compan | Deals   | Ticket | Activi | Settings|
| Module   | ies    | Pipeline| Module | ties   | & Admin |
+----------+--------+---------+--------+--------+---------+
|              CORE CRM DATABASE (Supabase)                |
|    Contacts, Companies, Deals, Tickets, Activities       |
|    Associations, Properties, Pipelines, Audit Log        |
+---------------------------------------------------------+
|    Auth (Supabase Auth) | RLS (Multi-tenancy)            |
+---------------------------------------------------------+
```

### B. Core Objects Model

```
+-----------+     +-----------+     +-----------+
| CONTACTS  |<--->| COMPANIES |<--->|   DEALS   |
|           |     |           |     |           |
| email     |     | name      |     | name      |
| first_name|     | domain    |     | amount    |
| last_name |     | industry  |     | stage     |
| phone     |     | size      |     | close_date|
| lifecycle |     | revenue   |     | pipeline  |
| owner     |     | owner     |     | owner     |
+-----------+     +-----------+     +-----------+
      |                 |                 |
      +-----------------+-----------------+
                        |
                +-------v-------+     +-----------+
                |  ACTIVITIES   |     |  TICKETS  |
                |               |     |           |
                | emails        |     | subject   |
                | calls         |     | status    |
                | meetings      |     | priority  |
                | notes         |     | pipeline  |
                | tasks         |     | SLA       |
                +---------------+     +-----------+
```

### C. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 16 |
| **UI Framework** | React + TypeScript (Strict) | 19 |
| **Styling** | Tailwind CSS | v4 |
| **UI Components** | shadcn/ui (Radix primitives) | Latest |
| **Data Table** | TanStack Table | v8 |
| **Drag & Drop** | dnd-kit | Latest |
| **Forms** | React Hook Form + Zod | Latest |
| **Server State** | TanStack Query | v5 |
| **Client State** | Zustand | v5 |
| **Charts** | Recharts | Latest |
| **Rich Text** | Tiptap | Latest |
| **Toasts** | Sonner | Latest |
| **Icons** | Lucide React | Latest |
| **Dates** | date-fns | v4 |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth + @supabase/ssr | Latest |
| **Hosting** | Vercel | Latest |
| **Theme** | Ocean Blue (#0891b2) | - |

---

## IV. DATABASE SCHEMA

> Full schema details: `docs/research/master-plan-research/tech-research.md`

### A. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Property storage | Hybrid (fixed + JSONB) | Type safety for standard fields, flexibility for custom |
| Multi-tenancy | Row-level with `tenant_id` + RLS | Native Supabase support, scales well |
| Soft delete | `deleted_at TIMESTAMPTZ` | Data preservation, easy undo, audit compliance |
| Relationships | Generic association table | Mirrors HubSpot's flexible linking system |
| Pagination | Cursor-based `(created_at, id)` | O(1) at any depth |
| Search | PostgreSQL tsvector + GIN | Full-text search without external service |
| Audit | Trigger-based audit_log | Tamper-proof, automatic, partitioned by month |

### B. Core Tables

```sql
-- Every table has these columns:
-- id UUID PRIMARY KEY
-- tenant_id UUID NOT NULL (indexed)
-- created_at, updated_at TIMESTAMPTZ
-- deleted_at TIMESTAMPTZ (soft delete)
-- custom_properties JSONB (flexible fields)

contacts          -- email, first_name, last_name, phone, lifecycle_stage, lead_status, owner_id
companies         -- name, domain, industry, size, annual_revenue, owner_id
deals             -- name, amount, stage_id, pipeline_id, close_date, owner_id
tickets           -- subject, status, priority, stage_id, pipeline_id, owner_id
activities        -- activity_type, subject, body, metadata(JSONB), activity_date, owner_id
```

### C. Schema Tables

```sql
property_definitions  -- object_type, internal_name, label, property_type, field_type, options, validation_rules
associations          -- from_object_type, from_object_id, to_object_type, to_object_id, label, is_primary
pipelines             -- object_type, label, display_order, is_default
pipeline_stages       -- pipeline_id, label, display_order, probability, is_closed, is_won, required_properties
organizations         -- name, slug, plan, settings
org_members           -- org_id, user_id, role
audit_log             -- table_name, record_id, operation, old_data, new_data, changed_fields, user_id
```

### D. Index Strategy

```sql
-- Tenant isolation (every table)
CREATE INDEX idx_{table}_tenant ON {table}(tenant_id);

-- Active records only
CREATE INDEX idx_{table}_active ON {table}(tenant_id, created_at) WHERE deleted_at IS NULL;

-- JSONB custom properties
CREATE INDEX idx_{table}_custom ON {table} USING GIN(custom_properties);

-- Full-text search
CREATE INDEX idx_{table}_search ON {table} USING GIN(search_vector);

-- Composite cursors for pagination
CREATE INDEX idx_{table}_cursor ON {table}(tenant_id, created_at DESC, id);
```

---

## V. UI/UX ARCHITECTURE

> Full patterns: `docs/research/master-plan-research/ux-patterns.md`

### A. 20 Priority Components

| # | Component | Description | Library |
|---|-----------|-------------|---------|
| 1 | **AppShell** | Collapsible sidebar + top bar layout | Custom |
| 2 | **DataTable** | Sortable, filterable, paginated, inline editing | TanStack Table |
| 3 | **RecordPage** | 3-column layout (properties \| timeline \| associations) | Custom |
| 4 | **Timeline** | Activity feed with type filters | Custom |
| 5 | **SlidePanel** | Right-side slide-in drawer (400-500px) | shadcn/ui Sheet |
| 6 | **FormBuilder** | Dynamic forms with Zod validation | React Hook Form |
| 7 | **Modal** | Dialog overlay (sm/md/lg) | shadcn/ui Dialog |
| 8 | **BoardView** | Kanban with drag-and-drop | dnd-kit |
| 9 | **BoardCard** | Configurable deal/ticket cards | Custom |
| 10 | **FilterBar** | Quick filters + advanced panel | Custom |
| 11 | **SavedViews** | Tab system for saved filter combinations | Custom |
| 12 | **SearchInput** | Global search with autocomplete (Cmd+K) | shadcn/ui Command |
| 13 | **Toast** | Notification toasts (success/error/warning/info) | Sonner |
| 14 | **Button** | Primary/secondary/danger with sizes/states | shadcn/ui Button |
| 15 | **DatePicker** | Calendar with range and presets | shadcn/ui Calendar |
| 16 | **Dropdown** | Select + action menu | shadcn/ui Select |
| 17 | **EmptyState** | Illustration + message + CTA | Custom |
| 18 | **LoadingSkeleton** | Shimmer placeholders | shadcn/ui Skeleton |
| 19 | **Tag/Badge** | Colored label pills | shadcn/ui Badge |
| 20 | **Avatar** | Initials fallback + photo | shadcn/ui Avatar |

### B. Page Layout Patterns

**List View (Contacts, Companies, Tickets)**
```
+-----------------------------------------------------------+
| Page Title                    [Create] [Import] [More]     |
+-----------------------------------------------------------+
| [View Tab 1] [View Tab 2] [+ Add View]                    |
+-----------------------------------------------------------+
| [Owner v] [Status v] [Date v] [+ More]  [Search] [Columns]|
+-----------------------------------------------------------+
| [x] | Name      | Email          | Phone    | Owner       |
|-----|-----------|----------------|----------|-------------|
| [ ] | John Doe  | john@acme.com  | +1-555.. | Sarah       |
+-----------------------------------------------------------+
| < Prev  [1] [2] [3]  Next >       Showing 1-25 of 1,234  |
+-----------------------------------------------------------+
```

**Record Detail (3-Column)**
```
+--Left (300px)----+--Center (flex)------+--Right (300px)----+
| [Avatar]         | [Overview][Activity]| Companies         |
| Name             |                     | [Card]            |
| [Note][Email]    | [Filter Bar]        |                   |
| [Call][Task]     |                     | Deals             |
|                  | [Activity 1]        | [Card]            |
| About This Record| [Activity 2]       |                   |
| +- Email: ...    | [Activity 3]        | Tickets           |
| +- Phone: ...    |                     | [Card]            |
| +- Owner: ...    |                     |                   |
| [View All Props] |                     | Attachments       |
+------------------+---------------------+-------------------+
```

**Pipeline Board (Deals, Tickets)**
```
+-----------------------------------------------------------+
| Pipeline: [Sales v]  [Table] [Board]  [Create Deal]       |
| Total: $450K | Weighted: $198K | Deals: 15                |
+-----------------------------------------------------------+
| Qualify(20%) | Connect(40%) | Propose(60%) | Close(80%)   |
| $50K / 3     | $120K / 4    | $80K / 2     | $100K / 2   |
| [Deal Card]  | [Deal Card]  | [Deal Card]  | [Deal Card] |
| [Deal Card]  | [Deal Card]  |              |             |
+-----------------------------------------------------------+
```

### C. Responsive Strategy

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| **Desktop** | >= 1280px | Full 3-column record, sidebar expanded |
| **Tablet** | 768-1279px | 2-column, sidebar toggleable |
| **Mobile** | < 768px | Single column, bottom nav, cards instead of tables |

---

## VI. SPRINT ROADMAP (16 Sprints, 6 Phases)

### Phase 1: Foundation (Sprints 1-2)

#### Sprint 1: Auth, Shell, Database Foundation
- [ ] Supabase project setup with RLS policies
- [ ] Auth flow (login, signup, password reset) with `@supabase/ssr`
- [ ] Organizations/tenants table with `org_members`
- [ ] AppShell: collapsible left sidebar (icon-only collapsed, hover to expand, pin toggle)
- [ ] Top navigation bar (logo, search placeholder, notifications, settings, user menu)
- [ ] Base layout with loading/error boundaries
- [ ] Design tokens setup (colors, typography, spacing per DESIGN_SYSTEM.md)

#### Sprint 2: Contact Management
- [ ] Contacts table (hybrid schema: fixed + JSONB)
- [ ] DataTable component (TanStack Table v8):
  - Sortable columns, quick filters, column customization
  - Row selection, inline editing, pagination (25/50/100)
- [ ] SlidePanel for "Create Contact" form
- [ ] Contact CRUD via Server Actions + Zod validation
- [ ] EmptyState, LoadingSkeleton, Toast components
- [ ] Bulk actions (edit, delete, assign)

### Phase 2: Core CRM (Sprints 3-5)

#### Sprint 3: Companies + Record Detail Page
- [ ] Companies table (hybrid schema)
- [ ] 3-column RecordPage layout component
- [ ] Contact detail page (RecordPage)
- [ ] Company detail page (RecordPage)
- [ ] Contact-Company associations (auto by email domain, manual)
- [ ] PropertyField component (inline editable)

#### Sprint 4: Deal Pipeline
- [ ] Deals, pipelines, pipeline_stages tables
- [ ] Kanban BoardView with dnd-kit
  - Stage columns (count + total), drag-drop cards
  - Configurable card properties, metrics bar
- [ ] Deal list view (table format)
- [ ] Deal creation form (SlidePanel)
- [ ] Pipeline settings (stages, probabilities)
- [ ] Deal detail page (RecordPage)
- [ ] Optimistic updates for drag-drop

#### Sprint 5: Activities + Associations
- [ ] Activities table (type-specific JSONB metadata)
- [ ] Timeline component
  - Activity entries with type icons
  - Filter bar (type, user, search)
  - Expand/collapse toggle
- [ ] Activity composer (quick action icons on record page)
- [ ] Note, Call, Meeting, Task creation forms
- [ ] Generic associations system
  - Contact-Company, Contact-Deal, Company-Deal
  - Association labels ("Primary", "Decision Maker")
  - Association cards in record right sidebar

### Phase 3: Customization + Service (Sprints 6-8)

#### Sprint 6: Custom Properties + Saved Views
- [ ] property_definitions table and admin UI
- [ ] Property creation wizard (name, type, options, validation)
- [ ] Dynamic form rendering based on property definitions
- [ ] SavedViews system (create/save/rename/delete, tabs, visibility)
- [ ] Advanced filter panel (AND/OR logic, all property types)

#### Sprint 7: Tickets + Global Search
- [ ] Tickets table with pipeline support
- [ ] Ticket list view + board view (Kanban)
- [ ] Ticket detail page (RecordPage)
- [ ] Full-text search (tsvector + GIN, Cmd+K global search)
- [ ] Autocomplete dropdown grouped by object type

#### Sprint 8: Dashboard + Settings
- [ ] Dashboard page with widget grid
  - KPI cards, bar/line/pie/funnel charts (Recharts)
  - Drag-and-drop widget placement and resizing
  - Global filters (date range, team, owner)
- [ ] Pre-built dashboard templates
- [ ] User Management settings (invite, permissions, teams)
- [ ] General settings (account, branding, currency)

### Phase 4: Communication + Data (Sprints 9-10)

#### Sprint 9: Email Integration + Import/Export
- [ ] Email logging on contact/deal timelines
- [ ] Email compose from record page
- [ ] Email templates (create, save, use)
- [ ] CSV Import (upload, column mapping, duplicate detection, progress)
- [ ] CSV Export (current view or all records)

#### Sprint 10: Notifications + Real-time
- [ ] In-app notifications (bell icon dropdown)
- [ ] Notification types (assignments, stage changes, task reminders)
- [ ] Notification preferences (settings)
- [ ] Supabase Realtime integration
  - Live deal board updates
  - Real-time notifications
  - Activity timeline live updates

### Phase 5: Automation + Marketing (Sprints 11-13)

#### Sprint 11: Workflow Automation
- [ ] Workflow engine (triggers, actions, branching logic)
- [ ] Visual workflow builder (node-based)
- [ ] Trigger types: record created, property changed, stage changed
- [ ] Action types: send email, create task, update property, assign owner
- [ ] Lead rotation (round-robin)
- [ ] Execution logging

#### Sprint 12: Email Marketing
- [ ] Email campaign builder (Tiptap-based editor)
- [ ] Contact list targeting and personalization tokens
- [ ] Send scheduling
- [ ] Campaign analytics (open/click/bounce rates)

#### Sprint 13: Forms + Landing Pages
- [ ] Drag-and-drop form builder
- [ ] Field mapping to contact properties
- [ ] Embed code generation
- [ ] Basic landing page builder (template-based)

### Phase 6: Advanced Features (Sprints 14-16)

#### Sprint 14: Knowledge Base
- [ ] Article editor (Tiptap)
- [ ] Category/section organization
- [ ] Search and analytics
- [ ] Public knowledge base portal

#### Sprint 15: Quotes + Products
- [ ] Product catalog (name, price, SKU)
- [ ] Quote generation (line items, discounts, templates)
- [ ] PDF export
- [ ] Invoice generation (basic)

#### Sprint 16: AI Features
- [ ] AI Copilot (contact/deal summaries, email drafts, meeting notes)
- [ ] Predictive features (win probability, next best action, lead scoring)
- [ ] Data quality (duplicate detection, missing field suggestions)

---

## VII. QUALITY GATES

### Per-Feature Gates

| Gate | Checks | Method |
|------|--------|--------|
| **Gate 1: Research** | Competitive analysis, UX patterns, tech research complete | Manual review |
| **Gate 2: Code** | TypeScript, build, lint, tenant_id, soft delete, design tokens | Automated commands |
| **Gate 3: QA** | E2E tests pass, data integrity, code review, zero bugs | Manual + automated |

### Code Quality

| Check | Command | Threshold |
|-------|---------|-----------|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Build | `npx next build` | Success |
| Lint | `npx eslint src/` | 0 errors |
| tenant_id | Grep all API routes | 100% coverage |
| Soft delete | Grep for DELETE | 0 hard deletes |

### Performance Gates

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTI | < 3.5s |
| Bundle Size | < 200KB initial |

### Security Gates

| Check | Requirement |
|-------|-------------|
| SQL Injection | Parameterized queries only (Supabase client) |
| XSS | Sanitize all user input, React's built-in escaping |
| CSRF | Server Actions + SameSite cookies |
| Auth | Supabase Auth + middleware protection |
| Multi-tenancy | RLS enabled, tenant_id on ALL queries |
| Validation | Zod on all inputs (client + server) |

---

## VIII. RISK ASSESSMENT

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | JSONB performance at scale | Medium | High | GIN indexes, materialize hot properties |
| 2 | RLS policy degradation | Medium | High | Index policy columns, cache tenant_id in JWT |
| 3 | Kanban drag-drop complexity | High | Medium | dnd-kit, optimistic updates, version locking |
| 4 | Scope creep | High | High | Strict sprint boundaries, P0/P1/P2/P3 |
| 5 | DataTable 10K+ rows | Medium | Medium | Virtual scrolling, cursor pagination |
| 6 | Multi-tenant data leakage | Low | Critical | RLS from day 1, automated isolation tests |
| 7 | Real-time sync conflicts | Medium | Medium | Optimistic UI with server reconciliation |
| 8 | Email deliverability | Medium | High | Established provider (Resend/Postmark) |
| 9 | Bundle size bloat | Medium | Medium | Dynamic imports, tree-shaking |
| 10 | Supabase vendor lock-in | Low | Medium | Repository pattern, standard PostgreSQL |

---

## IX. MODULE PRIORITY MATRIX

| Priority | Module | Complexity | Sprint | Dependencies |
|----------|--------|-----------|--------|-------------|
| P0 | Auth + Multi-tenancy | Medium | 1 | None |
| P0 | Navigation Shell | Medium | 1 | Auth |
| P0 | Contact Management | High | 2 | Auth, Shell |
| P0 | Company Management | Medium | 3 | Contacts |
| P0 | Deal Pipeline | High | 4 | Companies |
| P0 | Record Detail Page | High | 3-4 | Contacts |
| P1 | Activity Timeline | High | 5 | Record Detail |
| P1 | Associations System | Medium | 5 | All CRM Objects |
| P1 | Custom Properties | High | 6 | Property Definitions |
| P1 | Ticket Management | Medium | 7 | Pipelines |
| P1 | Dashboard + Reporting | High | 8 | Deals, Activities |
| P1 | Saved Views + Filters | Medium | 6 | DataTable |
| P2 | Global Search | Medium | 7 | Full-text Search |
| P2 | Email Integration | High | 9 | Activities |
| P2 | Settings + Users | Medium | 8 | RBAC |
| P2 | Import/Export | Medium | 9 | All CRM Objects |
| P2 | Notifications | Medium | 10 | Realtime |
| P3 | Workflow Automation | Very High | 11 | All Modules |
| P3 | Email Marketing | High | 12 | Contacts, Email |
| P3 | Forms + Landing Pages | High | 13 | Marketing |
| P3 | Knowledge Base | Medium | 14 | Content System |
| P3 | Quotes + Invoicing | High | 15 | Deals, Products |
| P3 | AI Features | High | 16 | All Modules |

---

## X. AI TEAMS STRATEGY

> Full details: `docs/AI_TEAMS_STRATEGY.md`

### Overview

F-CORE development uses a 3-Team AI orchestration model:

```
Research --> Gate 1 --> Execution --> Gate 2 --> Testing --> Gate 3 --> PR
                                                    |                |
                                                    +-- Fix Loop ----+
                                                    (max 3 cycles)
```

### Teams

| Team | Focus | Key Outputs |
|------|-------|-------------|
| **Team 1: Research** | Competitive analysis, UX patterns, tech research | `docs/research/{feature}/` |
| **Team 2: Execution** | Database, Backend, Frontend, UI polish | Source code + `docs/plans/{feature}/` |
| **Team 3: Testing** | E2E, data integrity, code review | `docs/test-reports/{feature}/` |

### Progressive Feature Development

1. Companies Page (simple CRUD - workflow validation)
2. Contacts Page (CRUD + associations)
3. Deal Pipeline (Kanban + drag-drop)

---

## XI. GIT WORKFLOW

```
main
  +-- feature/{feature-name}
       +-- commit: "research({feature}): Add analysis"       (after Gate 1)
       +-- commit: "feat({feature}): Add database schema"    (after DB)
       +-- commit: "feat({feature}): Add API routes"         (after Backend)
       +-- commit: "feat({feature}): Add UI components"      (after Frontend)
       +-- commit: "fix({feature}): Resolve BUG-001"         (fix loop)
       +-- PR: "feat: {Feature Name}"                        (after Gate 3)
```

---

## XII. FILE STRUCTURE

```
/Users/chong/hubspot-demo/
+-- docs/
|   +-- MASTER_PLAN.md              <-- This file
|   +-- DEVELOPMENT_STRATEGY.md     <-- Workflow & tools strategy
|   +-- AI_TEAMS_STRATEGY.md        <-- 3-team orchestration
|   +-- DESIGN_SYSTEM.md            <-- UI tokens, colors, typography
|   +-- REACT_BEST_PRACTICES.md     <-- React patterns
|   +-- research/                   <-- Team 1 research output
|   +-- plans/                      <-- Team 2 implementation plans
|   +-- test-reports/               <-- Team 3 test reports
|   +-- bugs/                       <-- Bug tracking
+-- src/
|   +-- app/                        <-- Next.js pages (App Router)
|   |   +-- (auth)/                 <-- Login, signup
|   |   +-- (dashboard)/            <-- Dashboard route group
|   |   |   +-- contacts/           <-- Contact pages
|   |   |   +-- companies/          <-- Company pages
|   |   |   +-- deals/              <-- Deal pages (list + board)
|   |   |   +-- tickets/            <-- Ticket pages
|   |   |   +-- settings/           <-- Settings pages
|   |   +-- api/                    <-- API routes
|   +-- components/
|   |   +-- ui/                     <-- shadcn/ui base components
|   |   +-- layout/                 <-- Sidebar, Header, AppShell
|   |   +-- contacts/               <-- Contact-specific components
|   |   +-- companies/              <-- Company-specific
|   |   +-- deals/                  <-- Deal-specific (BoardView, etc.)
|   |   +-- common/                 <-- Shared (Timeline, RecordPage, etc.)
|   +-- lib/
|   |   +-- supabase/               <-- Supabase client (browser + server)
|   |   +-- validations/            <-- Zod schemas
|   |   +-- utils.ts
|   +-- hooks/                      <-- Custom React hooks
|   +-- types/                      <-- TypeScript types
|   +-- actions/                    <-- Server Actions
+-- prisma/                         <-- Database schema
+-- supabase/                       <-- Supabase config, migrations
+-- CLAUDE.md                       <-- AI assistant instructions
+-- .env                            <-- Environment variables
```

---

## XIII. NEXT IMMEDIATE ACTIONS

### Sprint 1 Checklist
- [ ] Setup Supabase project with organizations table
- [ ] Implement RLS policies for tenant isolation
- [ ] Build auth flow (login, signup, password reset)
- [ ] Build AppShell (collapsible sidebar + top bar)
- [ ] Setup shadcn/ui with F-CORE design tokens
- [ ] Create base loading/error components

### Research References
- Competitive: `docs/research/master-plan-research/competitive-analysis.md`
- UX Patterns: `docs/research/master-plan-research/ux-patterns.md`
- Tech Stack: `docs/research/master-plan-research/tech-research.md`
- Summary: `docs/research/master-plan-research/research-summary.md`

---

*Master Plan v2.0 - Updated 2026-02-07 based on comprehensive HubSpot research.*
*References: docs/DEVELOPMENT_STRATEGY.md, docs/AI_TEAMS_STRATEGY.md*
