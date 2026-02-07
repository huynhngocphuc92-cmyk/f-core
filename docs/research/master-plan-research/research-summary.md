# Research Summary: F-CORE Master Plan Research

> **Synthesis Date:** 2026-02-07
> **Research Director:** F-CORE Architecture Team
> **Sources:** Competitive Analysis, UX Patterns, Tech Research
> **Purpose:** Unified reference document driving the F-CORE Master Plan

---

## Key Findings

### From Competitive Analysis

1. **HubSpot has 7 hubs**: Marketing, Sales, Service, Content, Data, Commerce + Breeze AI (cross-platform AI layer)
2. **Free tier is generous but increasingly limited**: 1,000 contacts (down from 1M previously), 2 users, 10 custom properties per object, 1 deal pipeline, no automation, no custom reporting, HubSpot branding on all outward-facing assets
3. **Salesforce** is more customizable (Apex code, custom objects, Lightning components) but complex -- typical implementation costs $10K-$100K+ and requires dedicated admin resources. 19.5% market share (#1 overall). No free plan.
4. **Pipedrive** excels at pipeline simplicity and visual deal management. Transparent per-user pricing ($14-$79/user/mo). Beloved "deal rotting" feature. No marketing or service tools.
5. **F-CORE opportunity spaces**:
   - Generous free tier (no artificial contact limit)
   - Transparent, predictable per-user pricing (like Pipedrive, unlike HubSpot's complex tiers)
   - Modern tech stack (Next.js 16, React 19, Supabase) -- faster than legacy CRM platforms
   - Open source advantage -- self-hostable, no vendor lock-in
   - AI-native from day 1 (not bolted on like competitors)
   - All-in-one approach (CRM + Marketing + Sales + Service like HubSpot, not single-purpose like Pipedrive)
6. **HubSpot pricing is complex**: Annual commitments required for Pro/Enterprise, mandatory onboarding fees ($1,500-$7,000), contact tier overage billing, 30-35% negotiation discounts common -- all signals of pricing opacity
7. **AI is the new battleground**: HubSpot has Breeze (7 AI agents), Salesforce has Einstein/Agentforce -- both investing heavily. F-CORE must ship with meaningful AI from launch.

### From UX Patterns

1. **Collapsible left sidebar navigation**: Icons when collapsed, hover or pin to expand. Tools grouped by hub/function. Up to 10 bookmarks for quick access.
2. **3-column record detail layout**: Left sidebar (properties + quick actions) | Center column (activity timeline with tabs) | Right sidebar (associations). This is the most recognizable and important HubSpot UX pattern.
3. **Data tables with saved views**: Horizontal quick filters above table, advanced filter panel (slide-out), customizable columns (add/remove/reorder), inline editing, bulk actions via checkbox selection, "View Tabs" for saved filter combinations (private/team/everyone).
4. **Kanban board for deals**: Drag-drop between stages, stage totals (count + dollar amount), configurable deal cards (4-6 properties), collapsible columns, metrics bar above board showing weighted/total pipeline value, deal rotting indicators.
5. **Slide-in panels for record creation**: Right-side drawer (~400-500px), overlays content with semi-transparent backdrop, used for create forms, advanced filters, property editing, quick previews.
6. **Activity timeline with filter bar**: Chronological feed of emails, calls, meetings, notes, tasks. Filter by type (checkbox toggles), user, team. Expand/collapse all. Search within activities.
7. **Dashboard with draggable widgets**: KPI cards, bar/line/pie/funnel/donut charts, table widgets, leaderboards. Grid-based layout with resize and reposition. Global filters (date range, team, owner). Up to 50 widgets per dashboard.
8. **20 priority UI components identified**:
   - AppShell (sidebar + top bar layout)
   - DataTable (sortable, filterable, paginated, inline editing)
   - RecordPage (3-column layout)
   - Timeline (activity feed with filters)
   - SlidePanel (right-side drawer)
   - FormBuilder (dynamic forms with validation)
   - Modal (dialog overlay)
   - BoardView (Kanban with drag-and-drop)
   - BoardCard (configurable deal/ticket cards)
   - FilterBar (quick filters + advanced panel)
   - SavedViews (tab system for filter combinations)
   - SearchInput (global search with autocomplete, Cmd+K)
   - Toast (notification system)
   - Button (primary/secondary/danger/sizes/states)
   - DatePicker (calendar with range and presets)
   - Dropdown (select + action menu)
   - EmptyState (illustration + message + CTA)
   - LoadingSkeleton (shimmer placeholder)
   - Tag/Badge (colored label pills)
   - Avatar (initials fallback + photo)
9. **Responsive strategy**: Desktop >= 1280px (full 3-column), Tablet 768-1279px (2-column), Mobile < 768px (single column, bottom nav). HubSpot relies on native mobile app for mobile experience; F-CORE should be mobile-responsive web-first.
10. **Design tokens mapped**: Ocean Blue (#0891b2) primary, 4px spacing base unit, Lexend Deca / Inter typography, card shadows and border radius standards documented.

### From Tech Research

1. **Hybrid schema recommended**: Fixed columns for standard fields (email, first_name, lifecycle_stage -- indexed, type-safe) + JSONB `custom_properties` column for user-defined fields (flexible, GIN-indexed). Best of both EAV and pure JSONB approaches.
2. **Property definition table**: Schema for custom fields stored in `property_definitions` table with type system (string/number/date/enumeration/bool), field types (text/textarea/select/checkbox/date), validation rules (min/max/regex/required/unique), options for enumerations, and display ordering.
3. **Generic association table**: Flexible object-to-object linking with `from_object_type`, `from_object_id`, `to_object_type`, `to_object_id`, association labels (e.g., "Decision Maker", "Primary"), and `is_primary` flag. Supports the many-to-many relationship patterns HubSpot uses.
4. **Row-Level Security (RLS) with `tenant_id`**: Every CRM table has `tenant_id UUID NOT NULL`. RLS policies enforce tenant isolation at the database level using `auth.uid()` -> `org_members` lookup. Index all columns used in policies.
5. **Next.js App Router with Server Components**: Layouts and data-fetching pages as Server Components, interactive elements (forms, drag-and-drop, tables) as Client Components. Push `"use client"` to leaf components.
6. **Recommended core libraries**:
   - **shadcn/ui** (UI components -- copy-paste ownership, Radix primitives)
   - **TanStack Table v8** (headless data table -- sorting, filtering, selection, pagination)
   - **dnd-kit** (drag-and-drop -- modern, accessible, touch support, Kanban)
   - **React Hook Form + Zod** (form management + validation)
   - **TanStack Query v5** (server state caching, optimistic updates)
   - **Zustand v5** (client-side global state -- sidebar, filters, modals)
   - **Recharts** (charts -- bar, line, pie, funnel for dashboards)
   - **Tiptap** (rich text editor -- notes, email drafts, descriptions)
   - **Sonner** (toast notifications)
   - **date-fns** (date handling -- tree-shakable)
   - **Lucide React** (icons)
7. **Cursor pagination for performance**: O(1) at any depth, unlike offset-based which degrades. Use `(created_at, id)` composite cursor.
8. **Supabase Realtime** for live updates: Deal stage changes, notifications, collaborative editing via `postgres_changes` subscriptions.
9. **Audit logging via database triggers**: Automatic INSERT/UPDATE/DELETE tracking on all CRM tables. Stores old_data, new_data, changed_fields, user_id, timestamp.
10. **Full-text search**: PostgreSQL `tsvector` generated columns with GIN index across name, email, phone fields. `ts_rank` for relevance scoring.
11. **Security stack**: OWASP Top 10 mitigations documented, Zod validation on all inputs, CSRF via SameSite cookies + Server Actions, rate limiting via Upstash, RBAC with roles table and permission JSON structure.

---

## Key Decisions Made

Based on the combined research, the following architectural decisions are established:

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | **Property storage model** | Hybrid (fixed columns + JSONB) | Type safety for standard fields (indexed, queryable), flexibility for unlimited custom properties. Avoids EAV complexity. |
| 2 | **Multi-tenancy strategy** | Row-level with `tenant_id` + Supabase RLS | Scales to thousands of tenants, native Supabase support, no operational overhead of schema-per-tenant. Every query automatically filtered. |
| 3 | **Soft delete pattern** | `deleted_at TIMESTAMPTZ` on all CRM entities | Data preservation for audit compliance, easy undo, no orphan cascading. Partial index `WHERE deleted_at IS NULL` for performance. |
| 4 | **Frontend framework** | Next.js 16 App Router (Server Components default) | SSR for initial loads, streaming for progressive rendering, Server Actions for mutations, edge-compatible auth. |
| 5 | **UI component library** | shadcn/ui (copy-paste, Radix primitives, Tailwind) | Full code ownership, no dependency lock-in, accessible by default, massive community, excellent dark mode support. |
| 6 | **Data table solution** | TanStack Table v8 (headless) | Integrates with shadcn/ui, supports sorting/filtering/selection/pagination/column pinning/virtual scrolling. 15KB bundle. |
| 7 | **Drag-and-drop library** | dnd-kit | Modern, accessible, touch/keyboard support, not deprecated (unlike react-beautiful-dnd). Works with App Router. |
| 8 | **Form + validation** | React Hook Form + Zod | Industry standard. Zod schemas shared between client validation and Server Action validation. Type inference with `z.infer`. |
| 9 | **State management** | TanStack Query (server state) + Zustand (client state) | Clean separation. TQ handles caching/refetching/optimistic updates for API data. Zustand handles UI state (sidebar, filters, modals). |
| 10 | **Pagination strategy** | Cursor-based (composite `created_at, id`) | O(1) performance at any depth. Critical for CRM lists that may have thousands of records. |
| 11 | **Auth strategy** | Supabase Auth + `@supabase/ssr` cookies | Secure server-side session management, no client-side token exposure, edge-compatible, MFA support. |
| 12 | **Object relationship model** | Generic association table | Mirrors HubSpot's flexible association system. Supports many-to-many with labels, primary designations. Single table for all object relationships. |
| 13 | **Audit logging** | PostgreSQL triggers (automatic) | Tamper-proof, no application code changes needed, captures all changes including direct DB operations. Partition by month for performance. |
| 14 | **Real-time updates** | Supabase Realtime (`postgres_changes`) | Native to Supabase, no additional infrastructure. Critical for Kanban board deal movements and notifications. |
| 15 | **Chart library** | Recharts | React-native (built on D3), composable, responsive. Supports all chart types needed: bar, line, pie, funnel, area for CRM dashboards. |

---

## Recommended Module Priority

| Priority | Module | Complexity | Sprint | Dependencies |
|----------|--------|-----------|--------|--------------|
| P0 | Auth + Multi-tenancy (RLS) | Medium | Sprint 1 | None |
| P0 | Navigation Shell (Sidebar + Top Bar) | Medium | Sprint 1 | Auth |
| P0 | Contact Management (CRUD + Table) | High | Sprint 2 | Auth, Shell |
| P0 | Company Management | Medium | Sprint 3 | Contacts |
| P0 | Deal Pipeline (Kanban + List) | High | Sprint 4 | Companies |
| P0 | Record Detail Page (3-column) | High | Sprint 3-4 | Contacts |
| P1 | Activity Timeline + Notes/Tasks | High | Sprint 5 | Record Detail |
| P1 | Associations System | Medium | Sprint 5 | Contacts, Companies, Deals |
| P1 | Custom Properties System | High | Sprint 6 | Property Definitions Table |
| P1 | Ticket Management | Medium | Sprint 7 | Pipelines |
| P1 | Dashboard + Reporting | High | Sprint 8 | Deals, Activities |
| P1 | Saved Views + Advanced Filters | Medium | Sprint 6 | DataTable |
| P2 | Global Search (Cmd+K) | Medium | Sprint 7 | Full-text Search |
| P2 | Email Integration + Tracking | High | Sprint 9 | Activities |
| P2 | Settings + User Management | Medium | Sprint 8 | RBAC |
| P2 | Import/Export (CSV) | Medium | Sprint 9 | All CRM Objects |
| P2 | Notification System | Medium | Sprint 10 | Realtime |
| P3 | Workflow Automation | Very High | Sprint 11 | All Modules |
| P3 | Email Marketing (Basic) | High | Sprint 12 | Contacts, Email |
| P3 | Forms + Landing Pages | High | Sprint 13 | Marketing |
| P3 | Knowledge Base | Medium | Sprint 14 | Content System |
| P3 | Quotes + Invoicing | High | Sprint 15 | Deals, Products |
| P3 | AI Features (Copilot) | High | Sprint 16 | All Modules |

---

## Recommended Sprint Plan

### Phase 1: Foundation (Sprints 1-2)

**Sprint 1: Auth, Shell, and Database Foundation** (1 week)
- Set up Supabase project with RLS policies
- Implement auth flow (login, signup, password reset) with `@supabase/ssr`
- Create organizations/tenants table with `org_members`
- Build AppShell: collapsible left sidebar (icon-only collapsed, hover to expand, pin toggle)
- Build top navigation bar (logo, search placeholder, notifications placeholder, settings, user menu)
- Create base layout with loading/error boundaries
- Set up design tokens (colors, typography, spacing, shadows per DESIGN_SYSTEM.md)

**Sprint 2: Contact Management** (1.5 weeks)
- Create contacts table (hybrid schema: fixed columns + JSONB custom_properties)
- Build DataTable component with TanStack Table v8:
  - Sortable columns (click header)
  - Quick filters (owner, lifecycle stage, lead status)
  - Column customization (add/remove/reorder)
  - Row selection with checkboxes
  - Inline editing
  - Pagination (25/50/100 per page)
- Build SlidePanel component for "Create Contact" form
- Implement contact CRUD via Server Actions with Zod validation
- Build EmptyState, LoadingSkeleton, Toast components
- Implement bulk actions (edit, delete, assign)

### Phase 2: Core CRM Objects (Sprints 3-5)

**Sprint 3: Companies + Record Detail Page** (1.5 weeks)
- Create companies table (hybrid schema)
- Build 3-column RecordPage layout:
  - Left sidebar: avatar, quick action icons, "About this [object]" property card, collapsible cards
  - Center column: tab system (Overview, Activities), activity composer placeholder
  - Right sidebar: association cards (collapsible, scrollable)
- Implement Contact detail page using RecordPage layout
- Implement Company detail page
- Build association system: contact-company linking (auto by domain, manual)
- Build PropertyField component (inline editable fields for record sidebar)

**Sprint 4: Deal Pipeline** (1.5 weeks)
- Create deals, pipelines, and pipeline_stages tables
- Build Kanban BoardView with dnd-kit:
  - Stage columns with count + total value
  - Drag-and-drop deal cards between stages
  - Configurable card properties (name, amount, close date, owner)
  - Stage totals and weighted amounts
  - Collapsible columns
  - Metrics bar above board
- Build deal list view (table format with all DataTable features)
- Build Deal creation form (SlidePanel)
- Pipeline configuration in Settings (add/remove/reorder stages, set probabilities)
- Deal detail page using RecordPage layout
- Implement optimistic updates for drag-and-drop with TanStack Query

**Sprint 5: Activities + Associations** (1.5 weeks)
- Create activities table (type-specific JSONB metadata)
- Build Timeline component:
  - Activity entries (email, call, meeting, note, task) with type icons
  - Filter bar (type checkboxes, user filter, search)
  - Expand/collapse all toggle
  - Chronological ordering
- Build activity composer (quick action icons on record page)
- Implement Note creation, Call logging, Meeting logging, Task creation
- Build full Associations system:
  - Generic association table
  - Contact-Company, Contact-Deal, Company-Deal, Deal-Contact linking
  - Association labels ("Primary", "Decision Maker")
  - Association cards in record right sidebar

### Phase 3: Customization + Service (Sprints 6-8)

**Sprint 6: Custom Properties + Saved Views** (1.5 weeks)
- Build property_definitions table and admin UI
- Property creation wizard:
  - Name, internal name, type, field type
  - Options editor (for enumerations)
  - Validation rules (required, unique, min/max, regex)
  - Group assignment and display ordering
- Dynamic form rendering based on property definitions
- SavedViews system:
  - Create/save/rename/delete views
  - View tabs above DataTable
  - Private/Team/Everyone visibility
  - Store: filters + column config + sort order
- Advanced filter panel (slide-out):
  - AND/OR logic
  - All property types as filter criteria
  - Save filter as view

**Sprint 7: Tickets + Global Search** (1.5 weeks)
- Create tickets table with pipeline support
- Ticket list view (table) and board view (Kanban)
- Ticket detail page (RecordPage layout)
- Ticket-Contact, Ticket-Company associations
- Implement full-text search:
  - `tsvector` generated columns with GIN index
  - Global search component (Cmd+K shortcut)
  - Autocomplete dropdown grouped by object type
  - Recent searches
  - Object-specific search on list pages

**Sprint 8: Dashboard + Settings** (1.5 weeks)
- Build Dashboard page with widget grid:
  - KPI cards (number + trend indicator)
  - Bar, line, pie/donut, funnel charts with Recharts
  - Table widgets
  - Drag-and-drop widget placement and resizing
  - Global filters (date range, team, owner)
- Pre-built dashboard templates (Sales Overview, Pipeline, Activity)
- User Management settings:
  - User table (invite, edit permissions, deactivate)
  - RBAC roles table with permission JSON
  - Team management
- General settings (account defaults, branding, currency)

### Phase 4: Communication + Data (Sprints 9-10)

**Sprint 9: Email Integration + Import/Export** (1.5 weeks)
- Email integration:
  - Email logging on contact/deal timelines
  - Email compose from record page
  - Email templates (create, save, use)
  - Basic open/click tracking
- CSV Import:
  - File upload and parsing
  - Column mapping UI
  - Duplicate detection (by email)
  - Import progress tracking
  - Error reporting
- CSV Export:
  - Export current view (with applied filters)
  - Export all records
  - Column selection

**Sprint 10: Notifications + Real-time** (1 week)
- Notification system:
  - In-app notifications (bell icon dropdown)
  - Notification types: record assignments, deal stage changes, task reminders, mentions
  - Mark as read/unread
  - Notification preferences (settings page)
- Supabase Realtime integration:
  - Live deal board updates (when teammates move deals)
  - Real-time notifications
  - Activity timeline live updates
- Toast notification refinement (success/error/warning/info)

### Phase 5: Automation + Marketing (Sprints 11-13)

**Sprint 11: Workflow Automation (Basic)** (2 weeks)
- Workflow engine:
  - Trigger types: record created, property changed, deal stage changed, form submitted
  - Action types: send email, create task, update property, assign owner
  - Visual workflow builder (node-based)
  - Branching logic (if/then/else)
  - Workflow activation/deactivation
  - Execution logging
- Basic lead rotation (round-robin assignment)
- Deal stage automation (auto-create task when deal enters stage)

**Sprint 12: Email Marketing** (1.5 weeks)
- Email campaign builder:
  - Drag-and-drop email editor (Tiptap-based)
  - Email templates
  - Contact list targeting
  - Personalization tokens
  - Send scheduling
- Campaign analytics:
  - Open rate, click rate, bounce rate
  - Unsubscribe tracking
  - Campaign performance dashboard

**Sprint 13: Forms + Landing Pages** (1.5 weeks)
- Form builder:
  - Drag-and-drop form fields
  - Field mapping to contact properties
  - Submission notifications
  - Thank-you page/message
  - Embed code generation
- Landing page builder (basic):
  - Template-based pages
  - Form embedding
  - SEO basics (title, description)
  - Published URL

### Phase 6: Advanced Features (Sprints 14-16)

**Sprint 14: Knowledge Base** (1.5 weeks)
- Article editor (Tiptap rich text)
- Category/section organization
- Search functionality
- Article analytics (views, helpfulness rating)
- Public knowledge base portal

**Sprint 15: Quotes + Products** (1.5 weeks)
- Product catalog (name, price, SKU, description)
- Quote generation:
  - Line items from product catalog
  - Discount application
  - Quote templates
  - PDF export
  - E-signature placeholder
- Invoice generation (basic)
- Quote-Deal-Contact associations

**Sprint 16: AI Features** (2 weeks)
- AI Copilot:
  - Contact/deal summary generation
  - Email draft assistance
  - Meeting notes summarization
  - Smart property suggestions
- Predictive features:
  - Deal win probability (basic ML model)
  - Next best action suggestions
  - Lead scoring
- Data quality:
  - Duplicate detection
  - Missing field suggestions
  - Data enrichment integration

---

## Risk Assessment

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | **JSONB custom properties performance at scale** | Medium | High | GIN indexes, limit JSONB query depth, consider materializing hot custom properties into columns as patterns emerge |
| 2 | **RLS policy performance degradation** | Medium | High | Index all policy columns, use `(SELECT auth.uid())` stable form, cache tenant_id in JWT custom claims, load test at 100+ tenants |
| 3 | **Kanban drag-and-drop complexity** | High | Medium | Use dnd-kit (proven), implement optimistic updates, debounce API calls, handle race conditions with version locking |
| 4 | **Scope creep beyond CRM core** | High | High | Strict sprint boundaries, P0/P1/P2/P3 prioritization, ship MVP (Sprints 1-8) before expanding to P2/P3 features |
| 5 | **DataTable performance with 10K+ rows** | Medium | Medium | Virtual scrolling (TanStack Virtual), cursor pagination, server-side filtering/sorting, lazy column rendering |
| 6 | **Multi-tenant data leakage** | Low | Critical | RLS enabled from day 1, automated tests for cross-tenant access, security audit before launch, never bypass RLS in application code |
| 7 | **Real-time sync conflicts** | Medium | Medium | Optimistic UI with server reconciliation, last-write-wins with conflict notification, version fields on records |
| 8 | **Email deliverability** | Medium | High | Use established transactional email provider (Resend/Postmark), SPF/DKIM/DMARC configuration, warm-up sending domain |
| 9 | **Bundle size bloat** | Medium | Medium | Dynamic imports for heavy components (charts, rich text, kanban), tree-shake unused shadcn components, monitor with `@next/bundle-analyzer` |
| 10 | **Supabase vendor lock-in** | Low | Medium | Abstract data access behind repository pattern, use standard PostgreSQL features, keep migration files exportable |
| 11 | **Custom property validation complexity** | Medium | Medium | Start with basic validation (required, type checking), add regex/formula validation incrementally, server-side validation always authoritative |
| 12 | **Workflow engine reliability** | High | High | Start with simple trigger->action workflows, add branching later, implement dead-letter queue for failed executions, comprehensive logging |

---

## F-CORE Differentiators

### vs. HubSpot

| Differentiator | F-CORE Advantage | HubSpot Limitation |
|---------------|-----------------|-------------------|
| **No contact limit (free tier)** | Generous free tier with no artificial ceiling | 1,000 contacts (reduced from 1M), punishes growth |
| **Transparent pricing** | Simple per-user pricing, no contact-tier complexity | Complex tier-based pricing, mandatory onboarding fees ($1,500-$7,000), annual commitments |
| **Open source** | Self-hostable, forkable, community-driven, no vendor lock-in | Proprietary, data locked in HubSpot servers |
| **Modern tech stack** | Next.js 16, React 19, Supabase -- fast, developer-friendly | Legacy monolith, slower UI, limited extensibility |
| **No branding on free tier** | Clean, professional appearance from day 1 | HubSpot branding on all forms, emails, chat, meeting links |
| **Custom properties (free)** | Generous custom property allowance | Only 10 custom properties on free plan |
| **Developer-first** | API-first architecture, webhook-first, extensible | Developer tools locked behind Enterprise tier |

### vs. Salesforce

| Differentiator | F-CORE Advantage | Salesforce Limitation |
|---------------|-----------------|---------------------|
| **Time to value** | Setup in minutes, not months | Average implementation takes months, requires consultants ($10K-$100K+) |
| **Free tier exists** | Full CRM at $0 to start | No free plan (15-day trial only) |
| **Ease of use** | HubSpot-inspired intuitive UI, minimal training | Steep learning curve, requires Trailhead certification |
| **All-in-one** | CRM + Marketing + Service in one platform | Marketing Cloud is separate purchase ($1,250+/mo) |
| **Cost at scale** | Predictable per-user pricing | $25-$500/user/mo depending on tier, additional costs for add-ons |
| **Modern UX** | Clean, fast, responsive | Dated UI in many areas, complex navigation |

### vs. Pipedrive

| Differentiator | F-CORE Advantage | Pipedrive Limitation |
|---------------|-----------------|---------------------|
| **All-in-one platform** | CRM + Marketing + Service + Commerce | Sales-only CRM, no marketing or service tools |
| **Free tier** | Start at $0 | No free plan (14-day trial only) |
| **Customizable objects** | Custom properties, custom objects, flexible schema | Limited customization beyond pipeline configuration |
| **Reporting depth** | Full dashboard builder with multiple chart types | Basic reporting, limited custom analytics |
| **Workflow automation** | Cross-functional workflows spanning all modules | Sales-focused, lightweight automations only |
| **Content management** | Website, blog, landing pages, knowledge base | None -- requires third-party tools |

### Core F-CORE Identity

1. **"All-in-one for free"**: The most generous free CRM tier in the market -- unlimited contacts, full CRUD, basic automation, no branding
2. **"Modern by design"**: Built on 2026 tech stack (Next.js 16, React 19, Supabase), not adapted from 2010s architecture
3. **"Open and transparent"**: Open source code, transparent pricing, self-hostable option, no vendor lock-in
4. **"AI from day 1"**: Not an AI add-on but AI integrated into every workflow -- summaries, suggestions, predictions, automation
5. **"Developer-friendly"**: API-first, webhook-first, extensible architecture with clear documentation and community
6. **"Pipeline-first UX"**: Combining Pipedrive's pipeline simplicity with HubSpot's all-in-one breadth -- visual, intuitive, drag-and-drop

---

## Implementation Quick Reference

### Tech Stack Summary

```
Frontend:  Next.js 16 + React 19 + TypeScript 5 (Strict)
Styling:   Tailwind CSS v4 + shadcn/ui (Radix primitives)
Database:  Supabase (PostgreSQL) + RLS
Auth:      Supabase Auth + @supabase/ssr
Tables:    TanStack Table v8
DnD:       dnd-kit
Forms:     React Hook Form + Zod
State:     TanStack Query v5 (server) + Zustand v5 (client)
Charts:    Recharts
Editor:    Tiptap
Toasts:    Sonner
Icons:     Lucide React
Dates:     date-fns v4
Deploy:    Vercel
```

### Database Schema Highlights

```
Core Tables:        contacts, companies, deals, tickets, activities
Schema Tables:      property_definitions, pipelines, pipeline_stages
Relationship:       associations (generic, labeled, primary flag)
Access Control:     organizations, org_members, roles
Audit:              audit_log (trigger-based, partitioned)
Pattern:            tenant_id on every row, deleted_at soft delete
Indexes:            tenant_id composite, GIN on JSONB, tsvector for search
```

### Critical Patterns

```
Multi-tenancy:      WHERE tenant_id = ? (enforced by RLS)
Soft Delete:        WHERE deleted_at IS NULL (partial index)
Pagination:         Cursor-based (created_at, id) -- O(1)
Validation:         Zod schemas shared client + server
State Split:        Server state (TanStack Query) vs UI state (Zustand)
Components:         Server Components default, Client only for interactivity
Real-time:          Supabase postgres_changes subscriptions
```

---

> **Document Status:** Complete
> **Last Updated:** 2026-02-07
> **Total Research Sources:** 50+ URLs across competitive analysis, UX patterns, and tech research
> **Next Step:** Update `docs/MASTER_PLAN.md` based on this synthesis
