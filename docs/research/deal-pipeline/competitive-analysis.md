# Deal Pipeline / Kanban Board - Competitive Analysis

> **Date:** 2026-02-08
> **Author:** F-CORE Research Team
> **Status:** Complete
> **Platforms Analyzed:** HubSpot, Salesforce, Pipedrive

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Deep Dives](#2-platform-deep-dives)
   - [HubSpot](#21-hubspot)
   - [Salesforce](#22-salesforce)
   - [Pipedrive](#23-pipedrive)
3. [Feature Comparison Matrix](#3-feature-comparison-matrix)
4. [Cross-Platform Pattern Analysis](#4-cross-platform-pattern-analysis)
5. [Best-in-Class Features to Adopt](#5-best-in-class-features-to-adopt)
6. [F-CORE Implementation Recommendations](#6-f-core-implementation-recommendations)

---

## 1. Executive Summary

All three major CRM platforms (HubSpot, Salesforce, Pipedrive) treat the deal pipeline kanban board as a **primary workspace** for sales teams. The kanban board is not a secondary view -- it is the central interface where reps spend most of their time managing deals.

**Key Findings:**
- All three platforms support **drag-and-drop** stage transitions with automatic recalculation of stage totals
- **Customizable deal cards** (selecting which fields to display) is standard across all platforms
- **Multiple pipelines** support is available on all three (with tier restrictions on HubSpot)
- **Stage probability/win likelihood** mapped to each stage is universal
- **Pipedrive** leads in visual simplicity and the unique **"deal rotting"** concept
- **HubSpot** leads in AI-powered insights (deal scoring, deal insights cards) and flexible views (kanban, table, calendar, Gantt)
- **Salesforce** leads in enterprise configurability (custom grouping, summarization, forecasting categories)

---

## 2. Platform Deep Dives

### 2.1 HubSpot

#### Pipeline Views
| View Type | Description | Availability |
|-----------|-------------|--------------|
| **Board/Kanban** | Cards organized by pipeline stage columns | All tiers |
| **Table/List** | Spreadsheet-style rows with sortable columns | All tiers |
| **Calendar** | Deals plotted by close date | Pro+ |
| **Gantt** | Timeline view for deal progression | Enterprise |
| **Split View** | Table + detail panel side by side | All tiers |

#### Deal Card Design
- **Default fields shown:** Deal name, Amount, Close date, Deal owner (avatar), Associated contact/company
- **Customization:** Super Admins can configure up to **4 default properties** displayed on cards for the entire account. Individual users can add personal card preferences.
- Cards show a **color-coded priority indicator** when deal tags are enabled
- **Deal Score** can be displayed directly on kanban cards (Pro/Enterprise)
- **New (2025):** "Time in current stage" and "Date entered current stage" can be displayed on cards for bottleneck identification
- **Deal Insights CRM Card:** AI-generated risk indicators, buyer goals, and key moments from call transcripts shown within deal records

#### Stage Management
- **Default stages:** Appointment Scheduled (20%) > Qualified to Buy (40%) > Presentation Scheduled (60%) > Decision Maker Bought-in (80%) > Contract Sent (90%) > Closed Won (100%) > Closed Lost (0%)
- Each stage has a configurable **win probability percentage**
- **Conditional stage properties:** When a deal moves to a specific stage, required fields can be enforced (e.g., "Loss Reason" required when moving to Closed Lost)
- **Pipeline rules (Pro+):** Restrict stage skipping, limit creation to specific stages, require approval for certain transitions
- Stages can be reordered via drag-and-drop in settings
- Stage colors are not natively customizable (system-assigned)

#### Drag-and-Drop Behavior
- Drag a deal card from one stage column to another
- **Weighted amount** at the top of each column automatically recalculates (Amount x Stage Probability)
- If conditional stage properties are configured, a **modal/side panel appears** prompting the user to fill required fields before the move completes
- If pipeline rules restrict skipping, the system blocks the drop and shows an error

#### Deal Amount Aggregation
- Each stage column header shows:
  - **Total count** of deals in the stage
  - **Total amount** (sum of deal amounts)
  - **Weighted amount** (sum of amounts x stage probability)
- Currency display is configurable per user preference

#### Win/Loss Tracking
- Closed Won and Closed Lost are dedicated terminal stages
- Required properties on close (e.g., close reason, competitor) enforceable via conditional stage properties
- Win rate reporting available in dashboards
- Deal velocity metrics track average time in each stage

#### Pipeline Filtering & Sorting
- Filter by: pipeline, deal owner, deal stage, amount range, close date range, deal properties, associated contacts/companies
- Advanced filters with AND/OR logic
- Saved views for quick access to filtered pipelines
- Sort deals within stages by: amount, close date, create date, last activity, deal name

#### Multiple Pipelines
- **Free:** 1 pipeline
- **Starter:** 2 pipelines
- **Professional:** 15 pipelines
- **Enterprise:** 50 pipelines
- Pipeline cloning available (clone stages, automations, rules, tags)
- Pipeline-specific create forms with different required fields per pipeline

#### Deal Creation Flow
1. Click "Create deal" button (top-right or within a stage column)
2. **Right-side panel slides in** with a form
3. Fields shown are customizable per pipeline via "Customize create deal form" in settings
4. **Conditional logic:** Different fields can appear based on pipeline selection
5. Required fields enforced (Deal name, Pipeline, Stage are always required)
6. Associate with Contact, Company, or Line Items during creation
7. "Create" or "Create and add another" buttons
8. Can also create deals from Contact/Company records, Sales Workspace, or via workflow automation

#### Forecasting Integration
- **Forecast categories** tied to deal stages (Pipeline, Best Case, Commit, Closed)
- Deal scoring with AI-predicted close probability
- Weighted pipeline value = Amount x Stage Probability
- Dashboard widgets for pipeline coverage, gap to quota
- Sales workspace integrates deal scoring and guided actions

---

### 2.2 Salesforce

#### Pipeline Views
| View Type | Description | Availability |
|-----------|-------------|--------------|
| **Kanban** | Cards organized by stage or any groupable field | All editions |
| **Table/List** | Standard list view with sortable columns | All editions |
| **Split View** | List + record detail side by side | All editions |
| **Pipeline Inspection** | Specialized list with change indicators | Enterprise+ |

#### Deal Card Design (Opportunity Kanban)
- **Default fields:** Opportunity Name, Amount, Account Name, Close Date (first 4 columns of the table view)
- **Customization:** Users can configure which fields appear via "Kanban Settings" -- choose up to **4 fields** per card via List View Controls
- **Opportunity Alerts:** Visual icons flag deals with:
  - Overdue tasks
  - No scheduled activities
  - Stalled deals (no activity in X days)
- **Details panel:** Click the arrow icon on a card to see Key Fields and Guidance for the current stage (configurable by admin via Path settings)
- Inline editing is supported directly from the card's detail panel
- Validation rules are enforced on inline edits

#### Stage Management
- Stages are defined via Opportunity object's Stage picklist (Object Manager > Opportunity > Fields > Stage)
- Each stage is mapped to:
  - **Probability percentage** (e.g., Prospecting = 10%, Negotiation = 80%)
  - **Forecast Category** (Pipeline, Best Case, Commit, Omitted, Closed)
- **Sales Path:** A visual progress bar at the top of each opportunity record showing all stages with guidance text, key fields, and coaching notes per stage
- Custom Record Types allow different stage sets for different sales processes (e.g., B2B vs B2C)
- Stages can be fully customized: add, remove, rename, reorder

#### Drag-and-Drop Behavior
- Drag opportunity card from one column to another
- **Automatic recalculation** of column summary (total amount or expected revenue)
- Stage field is updated immediately upon drop
- Salesforce validation rules fire on stage change -- if validation fails, the card snaps back
- **No confirmation modal** by default (direct stage update)
- Additional actions available via down-arrow menu: Edit, Delete, Change Owner

#### Deal Amount Aggregation
- Each column header displays:
  - **Sum of Amounts** (default) OR configurable summarization field
  - Can be changed to: Expected Revenue, Discount %, or any numeric field
- **Group By** is also configurable: Stage (default), Type, Opportunity Owner, Lead Source, or any picklist field
- This makes the Kanban highly flexible -- not just stage-based

#### Win/Loss Tracking
- Closed Won and Closed Lost are standard stages
- Competitor tracking via related list or custom fields on Opportunity
- Pipeline Inspection view shows color-coded arrows:
  - Green arrows = amount increase or date moved forward
  - Red arrows = amount decrease or date pushed back
- Hover over indicators to see previous values and who made the change

#### Pipeline Filtering & Sorting
- Based on **List Views** -- any list view can be displayed as Kanban
- Filter by: any opportunity field (standard or custom)
- Search within kanban by keyword
- **Charts:** Can overlay a chart (bar, pie, funnel) on top of the kanban view
- No built-in sort within columns (cards appear in list view order)

#### Multiple Pipelines
- Achieved through **Record Types + Sales Processes**
- Each Record Type can have its own set of stages (Sales Process)
- Unlimited Record Types/Pipelines (all editions)
- Toggle between Record Types above the Sales Path

#### Deal Creation Flow
1. Click "New" button on Opportunity list/kanban
2. If multiple Record Types exist, user selects Record Type first
3. Full-page form (or modal if configured) with all required fields
4. Standard required: Opportunity Name, Close Date, Stage, Account
5. Page layouts are customizable per Record Type by admin
6. Quick actions allow creating from related records (Account, Contact)
7. Heavy emphasis on admin-configured page layouts and validation rules

#### Forecasting Integration
- **Collaborative Forecasts:** Built-in forecasting module
- Forecast types configurable: by Amount, Quantity, or custom measures
- Forecast categories: Pipeline, Best Case, Most Likely, Commit, Closed
- Forecast hierarchy follows user Role Hierarchy
- **Pipeline Inspection:** Dedicated view for managers showing deal changes over time
- Custom columns: Gap to Quota, Pipeline Coverage
- AI-powered Einstein Forecasting predicts close likelihood
- Spring '26: New Kanban Board component in Flows for custom pipeline experiences

---

### 2.3 Pipedrive

#### Pipeline Views
| View Type | Description | Availability |
|-----------|-------------|--------------|
| **Pipeline (Kanban)** | Primary view -- deals as cards in stage columns | All plans |
| **List View** | Table-style deal listing | All plans |
| **Forecast View** | Revenue projection by time period | Pro+ |
| **Activities View** | Task-focused view of upcoming/overdue activities | All plans |

#### Deal Card Design
- **Default fields:** Deal title, Deal value, Contact person name, Organization name, Expected close date
- **Customization:** Up to **7 fields** can be displayed per card (deal, person, or organization fields)
- Configured via pipeline dropdown > "Customize deal cards"
- Cards show **activity indicators:**
  - Green icon = activity scheduled and on track
  - Yellow icon = activity due today
  - Red icon = activity overdue
  - Gray icon = no activity scheduled
- **Deal rotting visual:** Cards turn **red/highlighted** when a deal has been idle longer than the configured rotting period for that stage

#### Stage Management
- Fully customizable stages per pipeline (name, order, probability)
- **Stage probabilities:** Each stage has a win probability percentage
- **Deal Rotting:** Unique feature -- per-stage configuration of "days until rotten"
  - A deal "rots" if no activity has been completed or deal updated within X days
  - Rotten deals turn red in the pipeline view
  - Restored by: scheduling a new activity, editing deal details, or updating custom fields
  - Rotting periods are independent per stage (e.g., 3 days for "Contacted", 14 days for "Contract Sent")
- No built-in conditional required fields on stage change (available via third-party integrations or automations)

#### Drag-and-Drop Behavior
- Drag deal card to a new stage column
- Stage updates immediately (no confirmation modal)
- Pipeline values recalculate in real time
- Smooth animation during drag
- Activity-based sorting means deals requiring attention float to the top
- Can also drag deals to "Won" or "Lost" endpoints

#### Deal Amount Aggregation
- Each stage column shows:
  - **Deal count** in the stage
  - **Total weighted value** (deal value x stage probability)
  - **Total value** (sum of all deal amounts)
- Pipeline-level summary at the top shows total pipeline value
- Values update in real time on drag-and-drop

#### Win/Loss Tracking
- Dedicated "Won" and "Lost" actions (not just stages)
- When marking as Lost, a **loss reason** dropdown appears (customizable reasons)
- Won/Lost deals are removed from the active pipeline view
- Accessible via filters or the "Closed deals" section
- Win rate and conversion metrics in Reports
- Deal velocity tracking: average time per stage

#### Pipeline Filtering & Sorting
- **Pinned filters:** Save frequently used filter combinations at the top of the pipeline
- Filter by: deal owner, creation date, expected close date, value range, custom fields, activities status, products
- **Sort within stages by:**
  - Next activity date (default -- activity-based selling philosophy)
  - Deal value
  - Deal age
  - Custom field values
  - Alphabetical
- Change sort order (ascending/descending)

#### Multiple Pipelines
- **Essential:** 1 pipeline
- **Advanced:** Unlimited pipelines
- **Professional:** Unlimited pipelines
- **Power/Enterprise:** Unlimited pipelines
- Switch pipelines via dropdown at top of pipeline view
- Each pipeline has independent stages, probabilities, and rotting settings
- Deals can be moved between pipelines

#### Deal Creation Flow
1. Click "+ Deal" button or click within a stage column
2. **Quick-add modal** appears with minimal fields
3. Required fields: Deal title (auto-generated from contact/org if linked)
4. Optional during creation: Value, Contact, Organization, Expected close date, Pipeline, Stage
5. Custom fields can be added to creation form
6. "Save" creates deal and places it in the selected pipeline/stage
7. Very fast creation flow -- emphasis on speed over completeness (fill details later)
8. Can also create deals from Contact, Organization, or Email views

#### Forecasting Integration
- **Revenue Forecast view (Pro+):** Projects revenue based on expected close dates and deal values
- Weighted forecast uses stage probabilities
- Goal tracking for individual reps and teams
- Forecast vs. actual comparison charts
- No built-in AI forecasting (relies on probability + value calculations)
- Insights dashboards show deal velocity, conversion rates, pipeline trends

---

## 3. Feature Comparison Matrix

### 3.1 Core Pipeline Features

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Kanban Board View** | Yes | Yes | Yes (primary) |
| **Table/List View** | Yes | Yes | Yes |
| **Calendar View** | Yes (Pro+) | No (native) | No |
| **Gantt View** | Yes (Enterprise) | No (native) | No |
| **Split View** | Yes | Yes | No |
| **Forecast View** | Dashboard-based | Dedicated module | Pro+ view |

### 3.2 Deal Card Configuration

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Max fields on card** | 4 (admin-set) | 4 (user-set) | 7 (user-set) |
| **Custom field display** | Yes | Yes | Yes |
| **Activity indicators** | Limited | Alert icons | Colored icons |
| **Deal score on card** | Yes (Pro+) | No (native) | No |
| **Time in stage on card** | Yes (2025 update) | No (native) | Via "rotting" visual |
| **Owner avatar** | Yes | No (name only) | Yes |
| **Inline editing from card** | No (open record) | Yes (detail panel) | No (open record) |

### 3.3 Stage Management

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Custom stages** | Yes | Yes | Yes |
| **Stage probabilities** | Yes | Yes | Yes |
| **Stage colors** | System-assigned | System-assigned | System-assigned |
| **Required fields on move** | Yes (conditional) | Yes (validation rules) | No (native) |
| **Stage skip restrictions** | Yes (Pro+) | Via validation | No |
| **Deal rotting** | No | No | Yes (unique) |
| **Stage guidance/coaching** | No (native) | Yes (Sales Path) | No |
| **Approval workflows** | Yes (Enterprise) | Yes (Approval Process) | No |

### 3.4 Drag-and-Drop Behavior

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Drag between stages** | Yes | Yes | Yes |
| **Auto-recalculate totals** | Yes | Yes | Yes |
| **Confirmation on drop** | Only if required fields | No (direct update) | No (direct update) |
| **Validation on drop** | Conditional properties | Validation rules | None |
| **Animation/feedback** | Basic | Basic | Smooth |
| **Undo capability** | No | No | No |
| **Multi-select drag** | No | No | No |

### 3.5 Aggregation & Metrics

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Deal count per stage** | Yes | Yes | Yes |
| **Total amount per stage** | Yes | Yes | Yes |
| **Weighted amount** | Yes | Yes (Expected Revenue) | Yes |
| **Custom summarization** | No | Yes (any numeric field) | No |
| **Custom grouping** | No | Yes (any picklist field) | No |
| **Pipeline-level totals** | Yes | No (per-column only) | Yes |

### 3.6 Filtering & Sorting

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Basic filters** | Yes | Yes | Yes |
| **Advanced filters (AND/OR)** | Yes | Via list views | Yes |
| **Saved/pinned filters** | Yes (saved views) | Yes (list views) | Yes (pinned filters) |
| **Sort within stages** | Yes (multiple criteria) | No (list view order) | Yes (activity-based default) |
| **Search within kanban** | Yes | Yes | Yes |
| **Chart overlay** | No | Yes | No |

### 3.7 Multiple Pipelines

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Number of pipelines** | 1 (Free) to 50 (Enterprise) | Unlimited (via Record Types) | 1 (Essential) to Unlimited |
| **Pipeline cloning** | Yes | No (manual setup) | No |
| **Independent stage configs** | Yes | Yes | Yes |
| **Cross-pipeline deal move** | Yes | Via Record Type change | Yes |
| **Pipeline-specific forms** | Yes (conditional logic) | Yes (page layouts) | No |

### 3.8 Deal Creation

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Creation UI** | Side panel (slide-in) | Full page or modal | Quick-add modal |
| **Required fields** | Configurable per pipeline | Configurable per layout | Minimal (title only) |
| **Association during create** | Contact, Company, Line Items | Account (required) | Contact, Organization |
| **Conditional fields** | Yes (by pipeline) | Yes (by Record Type) | No |
| **"Create another" option** | Yes | No | No |
| **Speed of creation** | Medium | Slow (many fields) | Fast (minimal fields) |

### 3.9 Forecasting

| Feature | HubSpot | Salesforce | Pipedrive |
|---------|---------|------------|-----------|
| **Weighted pipeline** | Yes | Yes | Yes |
| **Forecast categories** | Yes | Yes (Pipeline/Best Case/Commit) | No |
| **AI deal scoring** | Yes (Pro+) | Yes (Einstein) | No |
| **Quota tracking** | Yes | Yes | Yes (Goals) |
| **Forecast vs. actual** | Dashboard widgets | Collaborative Forecasts | Pro+ charts |
| **Pipeline coverage** | Yes | Yes | No |
| **Deal change tracking** | Limited | Yes (Pipeline Inspection) | No |

---

## 4. Cross-Platform Pattern Analysis

### 4.1 What Is Consistent Across All Three

1. **Kanban is the primary deal management interface** -- all three treat it as a first-class view, not an afterthought
2. **Drag-and-drop is the core interaction** for moving deals between stages, with automatic total recalculation
3. **Customizable deal cards** -- users/admins can choose which fields appear on cards (typically 4-7 fields)
4. **Stage probability** -- every platform maps a win likelihood percentage to each stage
5. **Deal count + total amount** shown in each stage column header
6. **Weighted pipeline value** -- amount multiplied by stage probability is a universal concept
7. **Won/Lost as terminal stages** with dedicated handling (removal from active view, reason capture)
8. **Multiple pipelines** support for different sales processes
9. **Filtering and search** to narrow down visible deals
10. **No multi-select drag** -- all platforms only support single-card drag-and-drop

### 4.2 Key Differentiators

| Differentiator | Platform | Why It Matters |
|----------------|----------|----------------|
| **Deal Rotting** | Pipedrive | Visual urgency indicator for stalled deals -- unique and beloved by sales teams |
| **Activity-based card sorting** | Pipedrive | Cards needing attention float to top -- enforces activity-based selling |
| **AI Deal Scoring** | HubSpot/Salesforce | Predictive analytics on card -- reduces gut-feeling decisions |
| **Flexible Grouping** | Salesforce | Group by any picklist (Owner, Type, Source) -- not just Stage |
| **Custom Summarization** | Salesforce | Summarize by any numeric field -- goes beyond just Amount |
| **Sales Path with Guidance** | Salesforce | Per-stage coaching notes and key fields -- onboards new reps |
| **Conditional Stage Properties** | HubSpot | Require specific data on stage transitions -- enforces data hygiene |
| **Pipeline Cloning** | HubSpot | Clone entire pipeline config including automations -- speeds setup |
| **Flexible Views** | HubSpot (2025) | Kanban, table, calendar, Gantt, reports -- all from same data |
| **Pipeline Inspection** | Salesforce | Color-coded change tracking for managers -- shows deal movement direction |
| **Quick Deal Creation** | Pipedrive | Minimal required fields, fast modal -- reduces friction |
| **Deal Insights Card** | HubSpot (2025) | AI-summarized risks, goals, key moments from conversations |

### 4.3 UX Philosophy Differences

| Aspect | HubSpot | Salesforce | Pipedrive |
|--------|---------|------------|-----------|
| **Design philosophy** | "Guided simplicity" | "Configurable power" | "Visual momentum" |
| **Primary user** | Marketing-led sales teams | Enterprise sales orgs | SMB sales reps |
| **Learning curve** | Low-Medium | High | Low |
| **Admin dependency** | Medium | High | Low |
| **Data entry burden** | Medium (conditional fields) | High (many required fields) | Low (fill later) |
| **Visual feedback** | Clean, modern | Functional, dense | Colorful, intuitive |

---

## 5. Best-in-Class Features to Adopt

### Tier 1: Must-Have (MVP)

These features are consistent across all platforms and represent table stakes:

| # | Feature | Source | Rationale |
|---|---------|--------|-----------|
| 1 | **Kanban board with drag-and-drop** | All | Core interaction pattern -- users expect this |
| 2 | **Customizable deal cards (4-7 fields)** | All | Different teams need different info at-a-glance |
| 3 | **Stage count + total amount in headers** | All | Essential pipeline visibility |
| 4 | **Weighted pipeline value** | All | Stage probability x Amount for realistic forecasting |
| 5 | **Deal creation via side panel/modal** | HubSpot/Pipedrive | Fast creation without leaving the board |
| 6 | **Table/list view toggle** | All | Some users prefer spreadsheet-style data density |
| 7 | **Basic filtering (owner, stage, amount, date)** | All | Essential for focusing on relevant deals |
| 8 | **Multiple pipelines** | All | Different products/processes need separate pipelines |
| 9 | **Won/Lost terminal stages** | All | Standard deal lifecycle endpoint |
| 10 | **Pipeline-level summary totals** | HubSpot/Pipedrive | Quick understanding of total pipeline value |

### Tier 2: Competitive Differentiators (Post-MVP)

| # | Feature | Source | Rationale |
|---|---------|--------|-----------|
| 11 | **Deal rotting indicators** | Pipedrive | Unique, high-value visual -- drives rep action on stale deals |
| 12 | **Conditional required fields on stage move** | HubSpot | Enforces data quality at critical transition points |
| 13 | **Activity-based card sorting** | Pipedrive | Prioritizes deals needing attention -- supports activity-based selling |
| 14 | **Saved/pinned filter views** | All | Quick access to common pipeline slices |
| 15 | **Loss reason capture on close** | All | Critical for win/loss analysis and process improvement |
| 16 | **Time in stage display** | HubSpot | Bottleneck identification without leaving the board |
| 17 | **Stage guidance/coaching notes** | Salesforce | Helps new reps know what to do at each stage |

### Tier 3: Advanced/Enterprise (Future)

| # | Feature | Source | Rationale |
|---|---------|--------|-----------|
| 18 | **AI deal scoring** | HubSpot/Salesforce | Predictive close probability -- reduces wasted effort |
| 19 | **Pipeline inspection with change tracking** | Salesforce | Managers see deal movement direction over time |
| 20 | **Flexible grouping (by owner, type, source)** | Salesforce | Advanced pipeline analysis beyond stage-based view |
| 21 | **Forecast categories (Pipeline/Best Case/Commit)** | Salesforce | Structured forecasting methodology |
| 22 | **Deal insights from conversations** | HubSpot | AI-extracted risks and goals from call transcripts |
| 23 | **Calendar/Gantt views** | HubSpot | Alternative visualization for close-date planning |
| 24 | **Pipeline cloning** | HubSpot | Rapid pipeline setup for new teams/products |

---

## 6. F-CORE Implementation Recommendations

### 6.1 Architecture Decisions

| Decision | Recommendation | Reasoning |
|----------|---------------|-----------|
| **Primary view** | Kanban board (default) with table view toggle | Matches all three platforms; kanban is the expected UX |
| **Card field limit** | Up to 6 custom fields per card | Balance between HubSpot (4) and Pipedrive (7) |
| **Stage config** | Per-pipeline custom stages with probability % | Universal pattern; essential for weighted forecasting |
| **Deal creation** | Right-side slide-in panel (HubSpot style) | Modern, non-disruptive; faster than full-page (Salesforce) |
| **Filtering** | Filter bar above board + saveable filter presets | Combines HubSpot's advanced filters with Pipedrive's pinned filters |
| **Aggregation** | Count + Total + Weighted per stage column | Standard across all platforms |

### 6.2 Proposed Default Pipeline Stages

Based on the most common patterns across all three platforms:

| Stage | Probability | Color (suggestion) |
|-------|------------|-------------------|
| Qualified | 20% | Blue |
| Meeting Scheduled | 40% | Cyan |
| Proposal Sent | 60% | Indigo |
| Negotiation | 80% | Purple |
| Contract Sent | 90% | Amber |
| Closed Won | 100% | Green |
| Closed Lost | 0% | Red |

### 6.3 Deal Card Layout (Recommended)

```
+------------------------------------------+
| [Owner Avatar]  Deal Name           [$$$] |
|                                          |
| Company Name                             |
| Contact Name                             |
| Close Date: Jan 15, 2026                 |
| [Activity Icon] [Rotting Indicator]      |
+------------------------------------------+
```

**Required elements:**
- Deal name (linked, clickable)
- Deal amount (formatted currency, right-aligned)
- Owner avatar (small, top-left)
- Associated company name
- Associated contact name
- Expected close date

**Optional/configurable elements:**
- Activity status indicator (Pipedrive-style colored dots)
- Deal rotting indicator (Pipedrive-inspired)
- Time in stage (HubSpot-inspired)
- Deal score badge (future, AI-powered)
- Custom field slots (user-configurable)

### 6.4 Drag-and-Drop UX Specification

| State | Visual Feedback |
|-------|----------------|
| **Hover over card** | Subtle shadow elevation, cursor changes to grab |
| **Dragging** | Card lifts with shadow, slight opacity reduction on original position |
| **Over valid drop zone** | Target column header highlights, column background subtly changes color |
| **Over invalid drop zone** | Red indicator or no highlight |
| **Drop (no required fields)** | Card animates into new column, totals recalculate with brief highlight animation |
| **Drop (with required fields)** | Modal appears with required field form; card moves only after submission |
| **Drop cancelled** | Card animates back to original position |

### 6.5 Unique F-CORE Differentiators to Consider

1. **Deal Rotting + Activity Indicators (Pipedrive-inspired):** Implement deal rotting as a first-class feature from day one. Most HubSpot/Salesforce users request this via third-party add-ons.

2. **Keyboard Navigation:** None of the three platforms offer robust keyboard navigation for the kanban. F-CORE could differentiate by supporting arrow keys to navigate between cards, Enter to open, and keyboard shortcuts for common actions.

3. **Real-time Collaboration:** Show other users' cursors or recent activity on the board in real-time (like Figma for CRM). None of the three platforms do this well.

4. **Bulk Stage Move:** Allow selecting multiple deal cards and dragging them together. No platform currently supports multi-select drag on kanban boards.

5. **Undo on Stage Change:** Implement a toast notification with "Undo" button after drag-and-drop stage changes. None of the three platforms offer this, and it follows modern UX best practices.

### 6.6 Implementation Priority Roadmap

```
Sprint 1 (MVP):
  - Kanban board with columns per stage
  - Deal cards with 4 default fields
  - Drag-and-drop between stages
  - Stage headers with count + total amount
  - Single pipeline support
  - Table view toggle
  - Basic deal creation (slide-in panel)

Sprint 2 (Core Features):
  - Multiple pipelines with independent stages
  - Customizable deal card fields (up to 6)
  - Weighted pipeline values
  - Filtering (owner, amount, date, stage)
  - Saved filter views
  - Won/Lost with reason capture
  - Sort within stages

Sprint 3 (Differentiators):
  - Deal rotting (per-stage configuration)
  - Activity indicators on cards
  - Conditional required fields on stage move
  - Time in stage display
  - Pipeline-level summary bar
  - Keyboard navigation

Sprint 4 (Advanced):
  - Stage guidance/coaching notes
  - AI deal scoring (if applicable)
  - Forecast categories
  - Pipeline cloning
  - Advanced grouping options
  - Calendar/timeline view
```

---

## Appendix: Research Sources

- HubSpot Knowledge Base: Pipeline setup, board view customization, deal creation
- HubSpot Community: Product updates (August-December 2025)
- HubSpot Inbound 2025: Flexible CRM Views, Deal Insights announcements
- Salesforce Trailhead: Kanban view configuration, Sales Path setup
- Salesforce Documentation: Forecasting implementation, Pipeline Inspection
- Salesforce Spring '26 Release Notes: Kanban Board component in Flows
- Pipedrive Support: Deal rotting feature, deal card customization, pipeline setup
- Pipedrive Blog: Pipeline management, activity-based selling
- Pipeline CRM Help Center: Kanban board features
- UX Research: Drag-and-drop best practices (Pencil & Paper, LogRocket)
- Industry Analysis: Enterprise UX design patterns, CRM comparison tools
