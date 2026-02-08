# Competitive Analysis: Activity Timeline in CRM Platforms

> **Research Date:** February 8, 2026
> **Researcher:** F-CORE Research Team (Competitive Analyst)
> **Objective:** Analyze activity timeline implementations across leading CRM platforms to inform F-CORE's activity timeline feature design.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform-by-Platform Analysis](#platform-by-platform-analysis)
3. [Feature Comparison Table](#feature-comparison-table)
4. [Activity Types Supported](#activity-types-supported)
5. [Timeline UI Patterns](#timeline-ui-patterns)
6. [Inline Actions](#inline-actions)
7. [Key Differentiators](#key-differentiators)
8. [Recommendations for F-CORE](#recommendations-for-f-core)

---

## Executive Summary

Activity timelines are the central nervous system of any CRM record page. They provide sales reps, marketers, and support teams with a chronological narrative of every touchpoint with a contact, company, or deal. All four major CRM platforms -- HubSpot, Salesforce, Pipedrive, and Zoho CRM -- have invested heavily in this feature but approach it with distinct philosophies:

- **HubSpot** leads with the most versatile and user-friendly timeline, featuring multi-channel activity cards, an Allbound Timeline (calendar-style view), pinning, and deep inline filtering.
- **Salesforce** provides the most customizable Lightning Activity Timeline with enterprise-grade layout controls and Einstein AI integration for activity insights.
- **Pipedrive** takes a unique approach with a dedicated Contacts Timeline view that emphasizes follow-up frequency and deal-centric activity tracking.
- **Zoho CRM** splits its activity tracking between an "Open Activities" related list and a separate "History" tab for audit-style change tracking, with a newer Timeline View for module-level record visualization.

---

## Platform-by-Platform Analysis

### 1. HubSpot Activity Timeline

**Location:** Middle column of contact/company/deal/ticket record pages, under the "Activities" tab.

**Core Design Philosophy:** "Chronological story of engagement" -- HubSpot treats the timeline as a narrative, showing every meaningful touchpoint from most recent to oldest.

#### Key Features

| Feature | Details |
|---------|---------|
| **Chronological Feed** | Activities displayed newest-first in a scrollable feed in the middle panel of the record page. |
| **Activity Types Displayed** | Emails (sent/opened/clicked/replied), calls (logged + recorded), meetings (booked + completed), notes, tasks, form submissions, website page views, workflow actions, deal stage changes, LinkedIn/SMS/WhatsApp messages, postal mail, custom events (including webhook-triggered). |
| **Filter Bar** | Dropdown above the timeline to filter by activity type checkboxes (Notes, Emails, Calls, Tasks, Meetings, etc.). Also filter by user and team. Filters persist per-user per-object type. |
| **Sub-Tabs** | Dedicated sub-tabs for Notes, Emails, Calls, Tasks, and Meetings to isolate a single activity type. |
| **Pinning** | Users can pin a note or activity to the top of the timeline so it stays visible regardless of new entries. Useful for critical customer information. |
| **Activity Cards** | Configurable cards added to the middle column: "Recent Activities" (last 3), "Upcoming Activities" (next 3), "Allbound Timeline" (calendar-style inbound/outbound view), and custom activity totals cards. |
| **Allbound Timeline Card** | A calendar-format view that plots activities by direction (inbound vs. outbound), providing a visual overview of engagement density over time. |
| **Inline Logging** | Orange action buttons at the top of the record (Create Note, Log Call, Log Email, Log Meeting, Create Task) allow instant activity creation without leaving the page. |
| **Activity History** | Each manually logged activity (email, call, note) stores an edit history showing who changed what and when. |
| **Cross-Object Association** | Activities can be associated with multiple records (contacts, companies, deals, tickets). When a deal is created, up to 2,000 recent activities from associated contacts carry over. |
| **Company-Level Aggregation** | Form submissions from all associated contacts now appear on the company record timeline (Jan 2026 update). |
| **Activity Index Pages** | Dedicated pages for each activity type (CRM > Contacts > Calls, etc.) with table views, quick filters, advanced filters, bulk actions, and custom view tabs. |
| **Mobile Support** | Full timeline access via iOS/Android apps with ability to log calls, emails, meetings, notes, and tasks. |
| **Sales Workspace Integration** | Activity feed integrated into the Sales Workspace with filtering by activity type and sequence enrollment. |

#### Strengths
- Most comprehensive activity type coverage (including website visits, form submissions, marketing activities, custom events).
- Allbound Timeline card is a unique differentiator for visual inbound/outbound tracking.
- Pinning feature keeps critical context visible.
- Seamless inline activity creation from the record page.
- Deep filtering with per-user persistence.

#### Weaknesses
- The middle-column layout can feel crowded with many activity types enabled.
- No built-in follow-up frequency indicator (unlike Pipedrive).
- Timeline filtering is checkbox-based only -- no date range filter directly on the timeline (must use activity cards or index pages).

---

### 2. Salesforce Activity Timeline

**Location:** Right-hand panel or center panel of record pages (configurable) in Lightning Experience. Replaces the Classic "Open Activities" and "Activity History" related lists.

**Core Design Philosophy:** Enterprise-grade customizable timeline with AI-augmented insights.

#### Key Features

| Feature | Details |
|---------|---------|
| **Timeline Sections** | Activities divided into "Upcoming & Overdue" and "Past Activity" sections within a single timeline. |
| **Activity Types Displayed** | Tasks, Events (meetings), Logged Calls, Sent Emails. Custom activity objects can be added to the timeline. |
| **Expand/Collapse** | Individual activities can be expanded with an arrow, or all expanded/collapsed at once using the "Expand All" / "Collapse All" buttons. |
| **Filter Options** | Funnel icon in top-right corner filters by activity type (Tasks, Events, Calls, Emails) and by date range. |
| **Refresh Button** | Real-time refresh of activities near the filter options. |
| **Row Layout** | Row 1: Subject + due date (tasks) or start date (events). Row 2: Auto-generated activity summary. Row 3: Customizable fields (admin-controlled via compact layouts). |
| **Compact Layout Customization** | Admins can customize what fields appear in the third row of each activity via event and task compact layouts. |
| **Composer Bar** | Quick-action buttons above the timeline: Log a Call, New Task, New Event, Send Email. Allows creation without navigating away. |
| **View All** | "View All" link opens a full-page list of all activities for deep exploration. |
| **Einstein Activity Capture** | AI-powered system that automatically captures emails and calendar events from connected accounts (Gmail/Outlook), surfaces activity insights, and recommends next actions. |
| **Toggle to Related Lists** | Admins can toggle between the Activity Timeline view and the Classic "Open Activities" / "Activity History" related list format per page layout. |
| **Supported Objects** | Accounts, Contacts, Cases, Claims, Leads, Opportunities, and custom activity-enabled objects. |
| **Personal Settings** | Users can control whether they see Timeline or Related Lists via personal settings (independent of admin page layout). |

#### Strengths
- Enterprise-grade customization of fields displayed per activity.
- Einstein AI integration provides predictive insights and automatic activity capture.
- Expand/Collapse UX is clean and information-dense.
- Toggle between Timeline and Related Lists gives users flexibility.
- Activity Timeline supports custom objects.

#### Weaknesses
- More complex setup -- requires admin configuration.
- Visually less modern than HubSpot's card-based UI.
- No built-in pinning feature.
- No calendar-style Allbound view.
- Activity types are more limited (no website visits, form submissions, marketing events in the core timeline).

---

### 3. Pipedrive Activity Management

**Location:** Two distinct views: (a) Contact/Deal detail page with activity history in the main section, and (b) A dedicated "Contacts Timeline" view accessible from the Contacts menu.

**Core Design Philosophy:** Activity-based selling -- the timeline exists to ensure no contact goes unattended and every deal has a next action.

#### Key Features

| Feature | Details |
|---------|---------|
| **Detail View** | The contact/deal detail page shows a chronological history of all activities, calls, emails, notes, and deal changes in the main section with a sidebar for quick info. |
| **Contacts Timeline View** | A separate horizontal timeline view (Contacts > Contacts Timeline) that plots activities for multiple contacts on a visual timeline with rows per contact. Available on Professional plan and above. |
| **Default Activity Types** | Calls, Meetings, Tasks, Due Dates, Emails, Lunches. Custom activity types can be created. |
| **Follow-Up Frequency** | Unique feature: Set how often contacts should be followed up. Contacts overdue for follow-up are highlighted in red. A counter at the top shows how many contacts need attention. |
| **Date Filter** | Choose the lookback period for the timeline view (e.g., last 7 days, 30 days, etc.). |
| **Custom Person Filters** | Create or use saved filters to narrow which contacts appear on the timeline. |
| **Activity-Type Filter** | Toggle activity types on/off (blue = selected, gray = deselected). Click "all" to add/remove all. |
| **Quick Actions on Timeline** | "+" buttons across the timeline to add activities, deals, or notes directly without leaving the view. |
| **Group Email** | Select multiple contacts from the timeline and send a group email. |
| **Email Sync** | Sent and received emails appear on the timeline when Email Sync is enabled (Advanced plan+). |
| **Deal Rotting** | Visual indicator when a deal has not had activity within a configurable timeframe. |
| **Activity Dashboard** | Click any activity to open its detail view with contact info, deal context, previous notes, phone numbers, and email addresses for immediate action. |
| **Collapsible Sidebar Sections** | New contact detail view includes collapsible sections to hide distractions and focus on what matters. |
| **Calendar Integration** | Two-way sync with Google/Outlook calendars. Activities from CRM appear in external calendars and vice versa. |

#### Strengths
- Follow-up frequency indicator is a unique and powerful sales productivity feature.
- Multi-contact timeline view is excellent for managers monitoring team activity.
- Deal rotting provides proactive alerts when engagement drops.
- Custom activity types allow businesses to track industry-specific actions.
- Clean activity-based selling philosophy.

#### Weaknesses
- No pinning feature for activities.
- Contacts Timeline requires Professional plan or higher.
- Less comprehensive activity tracking (no website visits, form submissions, or marketing activities).
- The dedicated timeline view is separate from the record detail -- requires navigation.
- No AI-powered activity capture or insights.

---

### 4. Zoho CRM Activities

**Location:** Record detail page with multiple tabs: "Timeline" (History tab for audit trail), "Open Activities" related list, and "Closed Activities" related list. Plus a newer module-level "Timeline View."

**Core Design Philosophy:** Comprehensive audit trail combined with separate activity management -- a dual-purpose system for both CRM usage and compliance.

#### Key Features

| Feature | Details |
|---------|---------|
| **Record Detail Page Tabs** | The record page has related lists for "Open Activities" (upcoming tasks, meetings, calls) and "Closed Activities" (completed items). Also has a "History" tab for timeline/audit trail. |
| **History / Timeline Tab** | The History tab displays a full chronological audit trail: field changes, notes added, attachments uploaded, tasks created/completed, meetings scheduled, calls logged, emails sent. Shows who made each change and when. |
| **Activity Types** | Tasks, Events (Meetings), Calls. Notes are tracked separately. Emails are logged via Zoho SalesInbox or third-party integration. |
| **Open Activities Related List** | Shows three record types: Tasks, Events (Meetings), and Calls that are pending or upcoming. |
| **360-Degree View** | Record detail page shows related information including emails, texts, status changes, notes, and activities across associated records. |
| **Timeline View (Module Level)** | A newer view that plots records across a horizontal timeline by days, weeks, months, or quarters. Designed for visualizing record progression rather than activity history. |
| **Filter Capabilities** | History tab can be filtered by: source (CRM UI, API, workflow, bulk action, etc.), user (done_by.id), date range (audited_time), and record type (Notes, Attachments, Tasks, Calls, Events, Emails). |
| **Audit Trail Integration** | Deep integration with the system audit log. Every field change is tracked with old value, new value, user, timestamp, and source. |
| **Automation Source Tracking** | Timeline entries indicate whether changes came from CRM UI, API, workflow, blueprint, assignment rules, mass update, or other automation sources. |
| **Homepage Activity Component** | A homepage widget showing open activities, overdue activities, and all-day meetings/tasks with preference-based filtering. |
| **Third-Party Add-ins** | Partners like Twelve/Three offer "History (All Activities)" unified view that combines Calls, Tasks, and Meetings in a single related list (not available natively). |

#### Strengths
- Most comprehensive audit trail with source tracking (CRM UI vs. API vs. workflow vs. automation).
- Excellent for compliance and governance requirements.
- Filter by who made changes and how (source type).
- Deep API support for timeline data retrieval.
- Flexible module-level Timeline View for record visualization.

#### Weaknesses
- Activities are fragmented across multiple related lists and tabs -- no single unified activity timeline like HubSpot.
- Default UX requires switching between "Open Activities," "Closed Activities," and "History" tabs.
- Third-party add-in needed for a truly unified activity view.
- Less visually appealing timeline compared to HubSpot or Salesforce.
- No pinning, no follow-up frequency, no Allbound-style view.

---

## Feature Comparison Table

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---------|---------|------------|-----------|----------|
| **Unified Timeline** | Yes (middle column) | Yes (Lightning Timeline) | Partial (detail view + separate timeline page) | No (split across tabs/lists) |
| **Chronological Order** | Newest first | Sectioned (Upcoming, Past) | Newest first (detail) / Left-to-right (timeline) | Newest first (History tab) |
| **Filter by Activity Type** | Yes (checkboxes + sub-tabs) | Yes (funnel icon) | Yes (toggle buttons) | Yes (API filters; limited in UI) |
| **Filter by User/Team** | Yes | No (standard) | Yes (custom filters) | Yes (done_by filter) |
| **Filter by Date Range** | Via activity cards | Yes (in filter) | Yes (lookback period) | Yes (audited_time filter) |
| **Pinning** | Yes | No | No | No |
| **Expand/Collapse** | Card-based (always visible) | Yes (individual + all) | Collapsible sections | No |
| **Inline Activity Creation** | Yes (top-of-record buttons) | Yes (composer bar) | Yes (+ buttons on timeline) | Yes (related list actions) |
| **Allbound / Calendar View** | Yes (Allbound Timeline card) | No | No | No |
| **Follow-Up Frequency** | No | No | Yes (unique feature) | No |
| **Deal Rotting Alerts** | No (workflow-based) | No (workflow-based) | Yes (built-in) | No |
| **AI Activity Capture** | Partial (Breeze AI) | Yes (Einstein Activity Capture) | No | Yes (Zia AI, limited) |
| **Edit History on Activities** | Yes | No (standard) | No | Yes (audit trail) |
| **Cross-Object Association** | Yes (multi-record) | Yes (Name + Related To fields) | Yes (person/org/deal) | Yes (related modules) |
| **Website Visit Tracking** | Yes | No (native) | Yes (Web Visitors add-on) | Yes (SalesIQ integration) |
| **Form Submission Tracking** | Yes (incl. company-level) | No (native) | No | Yes (Zoho Forms) |
| **Custom Activity Types** | Call/Meeting types only | Custom objects | Yes (fully custom) | Yes (custom modules) |
| **Mobile Timeline Access** | Yes | Yes | Yes | Yes |
| **Bulk Activity Actions** | Yes (index pages) | Yes (list views) | Yes (group email) | Yes (mass actions) |
| **Activity Cards/Widgets** | Yes (Recent, Upcoming, Totals) | No (standard) | No | Yes (homepage widget) |
| **Audit Trail / Source Tracking** | Partial (edit history) | Yes (Setup Audit Trail) | No | Yes (comprehensive) |

---

## Activity Types Supported

| Activity Type | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---------------|---------|------------|-----------|----------|
| **Emails** | Yes (sent/open/click/reply) | Yes (sent/logged) | Yes (with sync) | Yes (SalesInbox) |
| **Calls** | Yes (logged + recorded) | Yes (logged) | Yes (with integrations) | Yes (logged) |
| **Meetings** | Yes (booked + completed) | Yes (events) | Yes | Yes (events) |
| **Notes** | Yes | No (separate) | Yes | Yes (separate) |
| **Tasks** | Yes | Yes | Yes | Yes |
| **SMS Messages** | Yes | No (native) | No | No (native) |
| **WhatsApp Messages** | Yes | No (native) | No | No (native) |
| **LinkedIn Messages** | Yes | No (native) | No | No (native) |
| **Postal Mail** | Yes | No | No | No |
| **Form Submissions** | Yes | No (native) | No | Yes (Zoho Forms) |
| **Website Page Views** | Yes | No (native) | Paid add-on | Yes (SalesIQ) |
| **Workflow/Automation Actions** | Yes | No (in timeline) | No | Yes (audit trail) |
| **Deal Stage Changes** | Yes | No (in timeline) | No | Yes (audit trail) |
| **Custom Events** | Yes (webhook + custom) | Custom objects | Custom types | Custom modules |

---

## Timeline UI Patterns

### Pattern 1: Chronological Feed (HubSpot, Salesforce)
- Activities stacked vertically in reverse chronological order.
- Each entry is a card/row with icon, type indicator, subject, timestamp, and preview content.
- HubSpot uses a card-based approach with color-coded activity type icons.
- Salesforce uses a more compact three-row layout with expand/collapse controls.

### Pattern 2: Sectioned Timeline (Salesforce)
- Activities split into "Upcoming & Overdue" and "Past Activity" sections.
- Clear visual separation between what needs attention and what has been done.
- Helps prioritize follow-up actions.

### Pattern 3: Horizontal Multi-Contact Timeline (Pipedrive)
- Each contact gets a row; activities are plotted as icons on a horizontal timeline.
- Great for comparing follow-up cadences across multiple contacts at once.
- Follow-up frequency highlighting (red = overdue).

### Pattern 4: Tabbed/Split View (Zoho CRM)
- Open Activities, Closed Activities, and History are separate tabs/related lists.
- History tab provides audit trail functionality.
- Requires tab-switching to get the full picture.

### Pattern 5: Calendar/Allbound View (HubSpot)
- Activities plotted on a calendar-style card organized by inbound/outbound direction.
- Provides density visualization of engagement over time.

---

## Inline Actions Available

| Action | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|--------|---------|------------|-----------|----------|
| **Log a Call** | Yes (top button) | Yes (composer) | Yes (+ button) | Yes (related list) |
| **Send Email** | Yes (top button) | Yes (composer) | Yes (+ button) | Yes (related list) |
| **Create Task** | Yes (top button) | Yes (composer) | Yes (+ button) | Yes (related list) |
| **Schedule Meeting** | Yes (top button) | Yes (composer) | Yes (+ button) | Yes (related list) |
| **Create Note** | Yes (top button) | No (separate) | Yes (+ button) | Yes (related list) |
| **Pin Activity** | Yes (actions menu) | No | No | No |
| **Edit Activity** | Yes (inline) | Yes (expand + edit) | Yes (detail view) | Yes (edit icon) |
| **Delete Activity** | Yes (actions menu) | Yes (actions menu) | Yes (detail view) | Yes (actions menu) |
| **Create Follow-Up Task** | Yes (from logged activity) | No (standard) | No | No |
| **Associate to Records** | Yes (inline) | Yes (Related To field) | Yes (link to deal) | Yes (module linking) |
| **View Edit History** | Yes (history link) | No | No | Yes (timeline) |
| **Send Group Email** | No (from timeline) | No | Yes (multi-select) | Yes (mass email) |

---

## Key Differentiators

### HubSpot
1. **Allbound Timeline Card** -- Unique calendar-style visualization of inbound vs. outbound activities.
2. **Activity Pinning** -- Pin important notes/activities to the top of the timeline for persistent visibility.
3. **Broadest Activity Coverage** -- Tracks emails, calls, meetings, notes, tasks, form submissions, page views, LinkedIn/SMS/WhatsApp, postal mail, workflow events, and custom events.
4. **Company-Level Aggregation** -- Form submissions from all associated contacts appear on the company timeline.
5. **Activity Cards** -- Configurable card widgets (Recent, Upcoming, Totals, Allbound) provide at-a-glance summaries.

### Salesforce
1. **Einstein Activity Capture** -- AI automatically captures emails and calendar events without manual logging.
2. **Enterprise Customization** -- Compact layouts let admins control exactly what fields display per activity row.
3. **Expand/Collapse UX** -- Individual and bulk expand/collapse for efficient information density management.
4. **Sectioned Timeline** -- Clear separation of "Upcoming & Overdue" vs. "Past Activity."
5. **Toggle View** -- Users can switch between Timeline and Related Lists based on preference.

### Pipedrive
1. **Follow-Up Frequency** -- Configurable follow-up intervals with red highlighting for overdue contacts and a counter for contacts needing attention.
2. **Multi-Contact Horizontal Timeline** -- Visualize activities across multiple contacts simultaneously.
3. **Deal Rotting** -- Automated staleness detection for deals without recent activity.
4. **Custom Activity Types** -- Fully custom activity types beyond the standard set.
5. **Group Email from Timeline** -- Select multiple contacts and send emails directly from the timeline view.

### Zoho CRM
1. **Comprehensive Audit Trail** -- Tracks every field change with old/new values, user, timestamp, and source (CRM UI, API, workflow, etc.).
2. **Source Tracking** -- Know whether a change came from manual UI entry, API call, workflow automation, mass update, or migration.
3. **Module-Level Timeline View** -- Visualize records across days/weeks/months/quarters on a horizontal timeline.
4. **Deep API Filtering** -- Powerful programmatic filtering of timeline data by source, user, date, and record type.
5. **Compliance-Ready** -- Audit trail and source tracking make it suitable for regulated industries.

---

## Recommendations for F-CORE

Based on this competitive analysis, here are the recommended features and design decisions for F-CORE's activity timeline implementation:

### Tier 1: Must-Have (MVP)

| Feature | Rationale | Reference Platform |
|---------|-----------|-------------------|
| **Unified chronological timeline** | Core feature -- all activity types in one feed, newest first, on the record detail page middle column. | HubSpot |
| **Activity type icons** | Visual differentiation of emails, calls, meetings, notes, tasks with distinct icons and colors. | HubSpot, Salesforce |
| **Filter by activity type** | Checkbox-based filter dropdown above the timeline to show/hide specific activity types. | HubSpot |
| **Filter by user/team** | Allow filtering to see only activities created by specific users or teams. | HubSpot |
| **Inline activity creation** | Action buttons at the top of the record page to create/log notes, calls, emails, meetings, tasks. | HubSpot, Salesforce |
| **Activity types supported** | Emails (sent/open/click/reply), Calls (logged), Meetings, Notes, Tasks. | All platforms |
| **Expand/Collapse activities** | Click to expand activity details, with compact preview by default. | Salesforce |
| **Cross-object association** | Activities linked to contacts, companies, deals. Activities visible on all associated records. | HubSpot |

### Tier 2: High Priority (Sprint 2-3)

| Feature | Rationale | Reference Platform |
|---------|-----------|-------------------|
| **Activity pinning** | Pin critical notes/activities to the top of the timeline. Unique UX advantage from HubSpot. | HubSpot |
| **Sectioned view (Upcoming/Past)** | Split timeline into "Upcoming & Overdue" and "Completed" sections for clarity. | Salesforce |
| **Date range filtering** | Filter timeline by date range to focus on specific periods. | Salesforce, Pipedrive |
| **Activity sub-tabs** | Dedicated tabs for Notes, Emails, Calls, Tasks, Meetings below the main filter. | HubSpot |
| **Follow-up frequency indicator** | Set follow-up intervals per contact, highlight overdue contacts. A compelling sales productivity feature. | Pipedrive |
| **Edit history on activities** | Track who edited an activity and what changed. | HubSpot, Zoho |
| **Activity cards (Recent/Upcoming)** | Summary cards showing the 3 most recent and 3 upcoming activities. | HubSpot |
| **Deal rotting indicator** | Visual flag when a deal has not had activity within a configurable timeframe. | Pipedrive |

### Tier 3: Differentiators (Sprint 4+)

| Feature | Rationale | Reference Platform |
|---------|-----------|-------------------|
| **Allbound Timeline (calendar view)** | Calendar-style view plotting inbound vs. outbound activities. Unique to HubSpot, strong differentiator. | HubSpot |
| **Form submission tracking** | Show form submissions on contact and company timelines. | HubSpot |
| **Website page view tracking** | Track and display page views on the timeline. | HubSpot |
| **AI activity capture** | Automatically capture emails and calendar events from Gmail/Outlook without manual logging. | Salesforce (Einstein) |
| **Multi-contact timeline view** | Horizontal timeline view across multiple contacts for managers. | Pipedrive |
| **Audit trail with source tracking** | Track change source (UI, API, workflow, import) for compliance. | Zoho |
| **Custom activity types** | Allow admins to define custom activity types beyond the defaults. | Pipedrive |
| **Activity totals card** | Show total counts of activities by type (inbound/outbound) in a summary card. | HubSpot |
| **LinkedIn/SMS/WhatsApp tracking** | Track multi-channel messaging within the timeline. | HubSpot |
| **Group email from timeline** | Select multiple contacts and send bulk emails. | Pipedrive |

### Design Principles for F-CORE Timeline

1. **Single Source of Truth** -- All activities on one unified timeline. Do not fragment across multiple tabs like Zoho.
2. **Progressive Disclosure** -- Show compact activity previews by default, expand for full details (Salesforce pattern).
3. **Filter Persistence** -- Filters should persist per-user per-object type (HubSpot pattern).
4. **Action-First UX** -- Prominent inline action buttons at the top of every record page (HubSpot pattern).
5. **Mobile-First Design** -- The timeline must render beautifully on mobile, with touch-friendly expand/collapse and swipe actions.
6. **Performance** -- Virtualize/paginate the timeline for contacts with hundreds of activities. Load in batches of 20-50 activities.
7. **Real-Time Updates** -- New activities should appear instantly via WebSocket/Supabase Realtime without requiring a page refresh.

### Suggested Data Model

```
Activity {
  id: UUID (PK)
  tenant_id: UUID (FK, required for multi-tenancy)
  type: ENUM ('email', 'call', 'meeting', 'note', 'task', 'form_submission', 'page_view', 'custom')
  subtype: STRING (e.g., 'email_sent', 'email_opened', 'call_inbound', 'meeting_booked')
  subject: STRING
  body: TEXT
  direction: ENUM ('inbound', 'outbound', 'internal')
  status: ENUM ('pending', 'completed', 'cancelled', 'overdue')
  priority: ENUM ('low', 'medium', 'high')
  is_pinned: BOOLEAN (default: false)
  due_date: TIMESTAMP (nullable, for tasks/meetings)
  completed_at: TIMESTAMP (nullable)
  duration_minutes: INTEGER (nullable, for calls/meetings)
  
  -- Associations
  created_by_user_id: UUID (FK)
  assigned_to_user_id: UUID (FK, nullable)
  contact_id: UUID (FK, nullable)
  company_id: UUID (FK, nullable)
  deal_id: UUID (FK, nullable)
  
  -- Metadata
  metadata: JSONB (flexible storage for type-specific data)
  source: ENUM ('manual', 'api', 'workflow', 'import', 'email_sync', 'calendar_sync')
  
  -- Soft delete + timestamps
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  deleted_at: TIMESTAMP (nullable, soft delete)
}

ActivityAssociation {
  activity_id: UUID (FK)
  record_type: ENUM ('contact', 'company', 'deal', 'ticket')
  record_id: UUID
  -- Allows many-to-many association between activities and records
}

ActivityEditHistory {
  id: UUID (PK)
  activity_id: UUID (FK)
  edited_by_user_id: UUID (FK)
  field_name: STRING
  old_value: TEXT
  new_value: TEXT
  edited_at: TIMESTAMP
}
```

### Suggested API Endpoints

```
GET    /api/activities?record_type=contact&record_id={id}&type=email,call&user_id={id}&from={date}&to={date}&page={n}&limit=20
POST   /api/activities                    -- Create/log an activity
PATCH  /api/activities/{id}               -- Update an activity
DELETE /api/activities/{id}               -- Soft delete
POST   /api/activities/{id}/pin           -- Pin/unpin an activity
GET    /api/activities/{id}/history       -- Get edit history
GET    /api/activities/summary?record_type=contact&record_id={id}  -- Get activity counts and recent/upcoming summaries
```

---

## Sources

- HubSpot Knowledge Base: [Filter activity index pages and record timelines](https://knowledge.hubspot.com/records/filter-activities-on-a-record-timeline)
- HubSpot Knowledge Base: [Create or log activities on a record](https://knowledge.hubspot.com/records/manually-log-activities-on-records)
- HubSpot Knowledge Base: [Associate activities with records](https://knowledge.hubspot.com/records/associate-activities-with-records)
- HubSpot Knowledge Base: [Default activity properties](https://knowledge.hubspot.com/properties/hubspots-default-activity-properties)
- HubSpot Community: [January 2026 Product Updates](https://community.hubspot.com/t5/Releases-and-Updates/Top-Product-Updates-for-January-2026/ba-p/1247546)
- Salesforce Help: [Manage Activities with the Activity Timeline](https://help.salesforce.com/s/articleView?id=xcloud.lex_pro_tips_activity_timeline.htm)
- Salesforce Help: [Activity Timeline Customization Considerations](https://help.salesforce.com/s/articleView?id=sales.activity_timeline_customization_considerations_lex.htm)
- SalesforceBen: [Salesforce Activities: Everything You Need to Know](https://www.salesforceben.com/salesforce-activities-everything-you-need-to-know/)
- Weflow Blog: [Salesforce Activity Timeline: The What, How & Why](https://www.getweflow.com/blog/salesforce-activity-timeline)
- Pipedrive Support: [Contacts Timeline](https://support.pipedrive.com/en/article/contacts-timeline)
- Pipedrive Blog: [Use Contacts Timeline for Timely Lead Follow-Ups](https://www.pipedrive.com/en/blog/contacts-timeline-follow-up-leads)
- Pipedrive: [Activities & Goals Management](https://www.pipedrive.com/en/features/activities-goals)
- Zoho CRM Help: [Timeline in Record Detail Page](https://help.zoho.com/portal/en/kb/crm/manage-crm-data/timeline/articles/timeline-in-record-detail-page)
- Zoho CRM Help: [Timeline View](https://help.zoho.com/portal/en/kb/crm/using-crm-for-everyone/module-views/articles/timeline-view)
- Zoho CRM Developer Docs: [Get Timeline of a Record API](https://www.zoho.com/crm/developer/docs/api/v8/timeline-of-a-record.html)
- Twelve/Three: [History (All Activities) for Zoho CRM](https://www.twelvethree.com/history-all-activities-list-for-zoho-crm)
