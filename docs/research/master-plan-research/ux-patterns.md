# HubSpot UX Patterns & User Flows - Comprehensive Research
> Research Date: 2026-02-07
> Purpose: Guide F-CORE CRM UI/UX implementation
> Source: HubSpot Knowledge Base, Product Updates, Community, Developer Docs

---

## Table of Contents
1. [Global Navigation Structure](#1-global-navigation-structure)
2. [Contact Management Flows](#2-contact-management-flows)
3. [Company Management Flows](#3-company-management-flows)
4. [Deal Pipeline Flows](#4-deal-pipeline-flows)
5. [Dashboard & Reporting](#5-dashboard--reporting)
6. [Activity & Timeline](#6-activity--timeline)
7. [Settings & Configuration](#7-settings--configuration)
8. [Common UI Components](#8-common-ui-components)
9. [Mobile Responsiveness](#9-mobile-responsiveness)

---

## 1. Global Navigation Structure

### 1.1 Left Sidebar Navigation
HubSpot uses a **collapsible left sidebar** as the primary navigation mechanism. Key behaviors:

- **Default state**: Collapsed (shows only icons)
- **Hover behavior**: Hovering over the sidebar expands it to show labels
- **Pin behavior**: Click "Keep navigation open" icon in bottom-left to lock it open
- **Organization**: Tools grouped by business function/hub

**Sidebar Menu Items (Top to Bottom):**
```
[Icon] Global Home        → Homepage / dashboard
[Icon] Bookmarks          → Up to 10 saved shortcuts to frequently used pages
[Icon] CRM                → Contacts, Companies, Deals, Tickets, Lists, Inbox, Tasks,
                             Playbooks, Templates, Snippets
[Icon] Marketing          → Social Agent, Campaigns, Email, Social, Ads, Events,
                             Forms, CTAs, SMS, Lead Scoring, Journeys, Analytics
[Icon] Content            → Content Agent, Website Pages, Landing Pages, Blog,
                             Podcasts, Case Studies, HubDB, SEO, Design Manager, Files
[Icon] Sales              → Sales Workspace, Target Accounts, Documents, Meetings,
                             Sequences, Activity Feed, Forecast, Coaching, Analytics
[Icon] Commerce           → Overview, Payments, Invoices, Payment Links, Quotes,
                             Products, Subscriptions
[Icon] Service            → Help Desk, Customer Success, Customer Agent, Chatflows,
                             Knowledge Base, Customer Portal, Feedback Surveys, Analytics
[Icon] Data Management    → Integrations, Custom Events, Data Quality Command Center,
                             Datasets, Data Model, Data Enrichment
[Icon] Automations        → Workflows
[Icon] Reporting          → Dashboards, Reports, Goals
[Icon] Breeze (AI)        → Overview, Social Agent, Customer Agent, Content Agent
[Icon] Development        → UI Extensions, Development home
[Icon] Partners           → Directory Info, Resources (for partner accounts)
```

### 1.2 Top Navigation Bar
The top bar is a horizontal strip containing:

```
+------------------------------------------------------------------+
| [HubSpot Logo]   [Search]        [Notifications] [Settings] [User Menu] |
+------------------------------------------------------------------+
```

**Components:**
- **Search bar**: Global search across all CRM objects, with autocomplete suggestions
- **Notifications bell**: Shows recent activity notifications, form submissions, task reminders
- **Settings gear icon**: Direct link to account settings
- **Help/Support icon**: Links to Knowledge Base, community, Academy
- **User avatar/menu**: Profile preferences, language, sign out
- **Marketplace icon**: Access to App Marketplace and Asset Marketplace

### 1.3 Breadcrumbs
- HubSpot uses a **minimal breadcrumb** pattern on detail pages
- Format: `Object Name > Record Name` (e.g., "Contacts > John Doe")
- Breadcrumbs appear at the top of record pages and settings pages
- Settings pages use deeper breadcrumbs: `Settings > Objects > Contacts > Record Customization`

### 1.4 Hub Switching
- Users switch between Hubs via the left sidebar categories
- Each sidebar item (CRM, Marketing, Sales, etc.) expands to show sub-tools
- **Bookmarks** allow quick access: hover over a menu item, click the bookmark icon
- Up to 10 bookmarks can be saved for quick navigation
- Bookmarks can be reordered via drag-and-drop

### 1.5 F-CORE Implementation Notes
```
Navigation Architecture:
+-- Left Sidebar (collapsible, icon-only when collapsed)
|   +-- Logo at top
|   +-- Primary nav items with icons
|   +-- "Pin open" toggle at bottom
|
+-- Top Bar (fixed, always visible)
|   +-- Search (cmd+K pattern)
|   +-- Notifications
|   +-- Settings
|   +-- User menu
|
+-- Main Content Area
    +-- Breadcrumbs (when in detail views)
    +-- Page content
```

---

## 2. Contact Management Flows

### 2.1 Contact List View (Index Page)

**Layout Structure:**
```
+------------------------------------------------------------+
| View Tabs: [All Contacts] [My Contacts] [+ Add View]      |
+------------------------------------------------------------+
| Quick Filters: [Contact Owner v] [Lead Status v] [+ More]  |
| [Advanced Filters]                    [Edit Columns] [Search]|
+------------------------------------------------------------+
| [x] | Name          | Email           | Phone    | Owner   |
|-----|---------------|-----------------|----------|---------|
| [ ] | John Doe      | john@example.com| +1-555.. | Sarah   |
| [ ] | Jane Smith    | jane@company.co | +1-555.. | Mike    |
| [ ] | Bob Johnson   | bob@acme.com    | +1-555.. | Sarah   |
+------------------------------------------------------------+
| < 1 2 3 ... 50 >                         Showing 1-25 of 1,234 |
+------------------------------------------------------------+
```

**View Tabs (Saved Views):**
- Tabs appear horizontally above the table
- Default views: "All Contacts", "My Contacts", "Marketing Contacts", "Unassigned Contacts"
- Users can create custom views with saved filters
- Views can be: Private, Team-shared, or Everyone
- Tabs can be reordered via drag-and-drop
- Right-click menu on tabs: Rename, Clone, Manage Sharing, Delete
- Free plan: up to 5 custom views

**Quick Filters:**
- Property-based dropdown filters above the table
- Default quick filters: Contact Owner, Lead Status, Create Date
- Configurable: admins can set which properties appear as quick filters
- Filters update the table in real-time

**Advanced Filters:**
- Opens a right-side panel
- AND/OR logic for combining filter conditions
- Filter by any contact property
- Supports operators: is, is not, contains, starts with, is known/unknown, greater/less than
- Can add multiple filter groups

**Table Features:**
- **Columns**: Customizable via "Edit columns" button
  - Add/remove columns from any contact property
  - Drag to reorder columns
  - Default columns: Name, Email, Phone, Contact Owner, Last Activity Date
- **Sorting**: Click column header to sort (ascending/descending toggle)
- **Column actions**: Three-dot menu on column header: Sort, Freeze column, Add column
- **Inline editing**: Click on a cell to edit property value directly in the table
- **Row hover**: Shows quick action icons (preview, edit)
- **Pagination**: Bottom of table, shows page numbers and total record count

**Search:**
- Search input above table (top-right area)
- Searches across name, email, and other indexed properties
- Results filter the current view in real-time

### 2.2 Creating a New Contact

**Trigger:** "Create contact" button in upper right of contact list page

**Form appears in a right-side slide-in panel:**
```
+-- Right Panel (Slide-in) --+
| Create Contact         [X] |
|-----------------------------|
| Email *                     |
| [                         ] |
|                             |
| First Name                  |
| [                         ] |
|                             |
| Last Name                   |
| [                         ] |
|                             |
| Phone Number                |
| [                         ] |
|                             |
| Job Title                   |
| [                         ] |
|                             |
| Lifecycle Stage             |
| [Subscriber          v    ] |
|                             |
| Contact Owner               |
| [                    v    ] |
|                             |
| --- Associate contact with -|
| Company: [Search...       ] |
| Deal:    [Search...       ] |
|                             |
| [ ] Set as marketing contact|
|                             |
| [Cancel]    [Create Contact]|
+-----------------------------+
```

**Key Fields:**
- **Email** (recommended, used for deduplication)
- First Name, Last Name
- Phone Number
- Job Title
- Lifecycle Stage (dropdown)
- Contact Owner (dropdown of HubSpot users)
- Company Name

**Validation:**
- Email format validation
- Duplicate detection by email address
- Required fields enforcement (configurable by admin)

**Additional options:**
- Associate with existing Company, Deal, Ticket records
- Data privacy consent options (if enabled)
- Marketing contact toggle
- "Create and add another" button for batch creation

### 2.3 Contact Detail Page (Record Page)

**Three-Column Layout:**
```
+--Left Sidebar (300px)--+--Center Column (flex)---+--Right Sidebar (300px)--+
|                        |                         |                         |
| [Avatar + Name]        | [Overview] [Activities] | Companies               |
| [Email] [Call] [Task]  | [Custom Tabs...]        | +-- Acme Corp (Primary) |
| [Meeting] [Note] [...] |                         | +-- Add Company         |
|                        | -- Timeline --           |                         |
| About this contact     | [Filter: All | Email |  | Deals                   |
| +-- Email: john@...    |  Calls | Tasks | Mtgs]  | +-- Enterprise Deal     |
| +-- Phone: +1-555..    |                         | +-- Add Deal            |
| +-- Owner: Sarah       | [Log activity] [Note]   |                         |
| +-- Lifecycle: Lead    |                         | Tickets                 |
| +-- Lead Status: New   | > Email sent to John    | +-- Support #1234       |
| +-- Last Activity: 2d  |   by Sarah - 2 days ago | +-- Add Ticket          |
| +-- Create Date: ...   |                         |                         |
| [View All Properties]  | > Call logged            | Attachments             |
|                        |   Duration: 5 min        | +-- proposal.pdf        |
| Communication Subs     |   Outcome: Connected     |                         |
| +-- Marketing: Yes     |                         | Segments (Lists)        |
| +-- Sales: Yes         | > Note added             | +-- Hot Leads           |
|                        |   "Interested in..."     | +-- Newsletter          |
| Website Activity       |                         |                         |
| +-- Last page viewed   |                         | Workflows               |
| +-- Total visits: 12   |                         | +-- Lead nurture         |
+------------------------+-------------------------+-------------------------+
```

**Left Sidebar:**
- Contact avatar (auto-generated from initials or photo)
- Contact name (large, bold)
- Quick action icons (horizontally arranged): Note, Email, Call, Task, Meeting
  - Icons can be reordered by user
  - Ellipsis (...) menu for additional actions: Log postal mail, WhatsApp, LinkedIn message
- "About this contact" property card:
  - Shows key properties in a vertical list
  - Each property has inline editing (hover to see edit icon)
  - "View all properties" link at bottom opens full property sheet
  - Properties can be customized per user (add/remove/reorder)
  - Up to 50 properties per card
- Communication subscriptions card
- Website activity card (page views, form submissions)
- Cards are **collapsible** (click to expand/collapse)
- Cards can be **reordered** via drag-and-drop (if admin allows)

**Center Column (Middle):**
- **Tabs**: Overview, Activities, and custom tabs (Enterprise)
- **Overview tab**: High-level cards showing:
  - Recent activities summary
  - Key properties highlighted
  - Associated records preview
- **Activities tab**: Chronological timeline of all interactions
  - Activity types: Emails, Calls, Meetings, Notes, Tasks, Postal Mail, WhatsApp, LinkedIn
  - Filter bar above timeline: checkboxes for each activity type
  - Filter by user or team
  - Search activities by keyword
  - Expand all / Collapse all toggle
  - Activities show: type icon, description, user, timestamp
  - Each activity is expandable to see full details

**Right Sidebar:**
- **Association cards** for related records:
  - Companies (with Primary label)
  - Deals
  - Tickets
  - Custom objects
- Each association card shows:
  - Up to 6 properties of the associated record
  - "+Add [object]" button
  - Search within associations
  - Inline scrolling
  - Sort options
- **Segments** card (list memberships)
- **Workflows** card (enrolled workflows)
- **Attachments** card
- **Attribution reports** card (Enterprise)
- Cards are collapsible and can be customized

### 2.4 Editing Contact Properties

**Inline Editing (on record page):**
- Hover over any property in the left sidebar "About this contact" card
- Click the edit (pencil) icon that appears
- Property becomes editable in-place
- Auto-save on blur (no manual save button required as of April 2025 update)
- For dropdowns: click to open dropdown selector
- For date fields: opens date picker

**Full Property Editor:**
- Click "View all properties" to see complete property list
- Opens a searchable panel with all properties organized by group
- Each property is editable inline

**Bulk Editing (from list view):**
- Select multiple records via checkboxes
- Action bar appears above table with bulk operations:
  - Edit (batch update a property value)
  - Assign (change owner)
  - Create tasks
  - Add to static list/segment
  - Enroll in workflow (Pro/Enterprise)
  - Delete
  - Export
  - Enrich records
- Select all: checkbox selects current page, then "Select all X records" link for entire view

### 2.5 Search and Filter Patterns

**Global Search:**
- Accessible from top navigation bar
- Searches across all CRM objects simultaneously
- Autocomplete with recent searches and suggestions
- Results grouped by object type (Contacts, Companies, Deals, etc.)

**Index Page Filters:**
- **Quick filters**: Property dropdown buttons above the table
- **Advanced filters**: Right panel with complex filter builder
  - AND/OR logic
  - Filter by any property
  - Operators vary by property type (text, number, date, enum)
  - Filters can be saved as part of a view

**Saved Views:**
- Combine filters + column configuration + sort order
- Visibility: Private (only me), Team, Everyone
- Tabs for quick switching between views
- Default view setting per user

---

## 3. Company Management Flows

### 3.1 Company List View
- Same table layout as contacts
- Default columns: Company Name, Company Domain, Phone, City, Owner, Create Date
- Views/filters/search work identically to contacts
- Board view available (grouped by Lifecycle Stage)

### 3.2 Company Detail Page
- Same three-column layout as contacts
- **Left sidebar**: Company properties (Name, Domain, Industry, Revenue, Employee Count, Owner)
- **Center column**: Activities timeline, Overview tab
- **Right sidebar**:
  - Associated Contacts (with role labels like "Primary", "Decision Maker")
  - Associated Deals
  - Associated Tickets
  - Child/Parent company associations

### 3.3 Company-Contact Associations
- Contacts auto-associate with companies based on email domain
- Manual association via "Add contact" in right sidebar
- Association labels: Primary, Billing Contact, Decision Maker, etc.
- One contact can be associated with multiple companies
- One company can have unlimited associated contacts
- Primary company association is bidirectional

### 3.4 Domain-Based Company Enrichment
- When a company domain is recognized, HubSpot auto-fills:
  - Company Name
  - Industry
  - City / Country
  - Employee Count (range)
  - Annual Revenue (range)
  - Description
  - LinkedIn URL
  - Website
- Enrichment can be triggered:
  - Automatically on company creation (if domain provided)
  - Manually: bulk select companies > "Enrich records"
  - Via Settings > Data Management > Data Enrichment
- Enrichment property mapping is configurable (which properties get updated)
- Overwrite rules can be set per property

---

## 4. Deal Pipeline Flows

### 4.1 Kanban Board Layout

**Board View Structure:**
```
+--Pipeline: [Sales Pipeline v]--+--[Table View] [Board View]--+
+----------------------------------------------------------------+
| Metrics: Total: $450K | Weighted: $198K | Avg: $45K           |
+----------------------------------------------------------------+
|                                                                |
| Appointment    | Qualified     | Presentation  | Decision     |
| Scheduled (20%)| to Buy (40%) | Scheduled(60%)| Maker(80%)   |
| $50,000        | $120,000      | $80,000       | $100,000     |
| 3 deals        | 4 deals       | 2 deals       | 2 deals      |
|                |               |               |              |
| +----------+  | +----------+  | +----------+  | +----------+ |
| | Acme Deal|  | | Beta Corp|  | | Gamma Inc|  | | Delta Ltd| |
| | $15,000  |  | | $30,000  |  | | $40,000  |  | | $50,000  | |
| | Close:3/1|  | | Close:2/28| | | Close:3/15| | | Close:2/20||
| | Sarah    |  | | Mike     |  | | Sarah    |  | | Mike     | |
| +----------+  | +----------+  | +----------+  | +----------+ |
| | Widget Co|  | | Epsilon  |  | | Zeta Inc |  |              |
| | $20,000  |  | | $40,000  |  | | $40,000  |  | +----------+ |
| | Close:3/5|  | | Close:3/10| |            |  | | Theta Co | |
| | Mike     |  | | Sarah    |  |            |  | | $50,000  | |
| +----------+  | +----------+  |            |  | | Close:3/1| |
|                |               |            |  | | Sarah    | |
| [Collapsed]    | +----------+  |            |  | +----------+ |
|  Contract Sent | | Omega Inc|  |            |  |              |
|  (90%) $100K   | | $50,000  |  |            |  |              |
|  1 deal        | +----------+  |            |  |              |
+----------------------------------------------------------------+
| Closed Won (100%) | Closed Lost (0%)                           |
+----------------------------------------------------------------+
```

**Board Components:**

**Stage Columns:**
- Column header: Stage name, probability percentage
- Below header: Total amount for stage, deal count
- Weighted amount calculated: stage total x probability
- Columns can be **collapsed** to save space (shows summary only)
- Column width is equal for all stages

**Deal Cards:**
- Card displays configurable properties (default: Name, Amount, Close Date, Owner)
- Up to 4-6 custom properties per card
- Quick action icons on hover (email, call)
- Card includes contact/company avatar or initials
- Priority/urgency indicators
- Deal score (if configured)

**Data Metrics Bar (above board):**
- Total deal amount (sum of all deals in view)
- Weighted deal amount
- Open deal amount
- Closed won deal amount
- Average amounts per deal
- Metrics update in real-time as deals move
- Can be hidden/shown with "Hide metrics" toggle
- Customizable: choose which metrics to display

### 4.2 Creating a Deal

**Trigger:** "Create deal" button (top right)
**Form:** Right-side slide-in panel (same pattern as contact creation)

**Key Fields:**
- Deal Name *
- Pipeline * (dropdown)
- Deal Stage * (dropdown, filtered by selected pipeline)
- Amount
- Close Date
- Deal Owner
- Deal Type (New Business, Existing Business)
- Priority (Low, Medium, High)

**Associations:**
- Associate with Contact(s)
- Associate with Company

### 4.3 Moving Deals Between Stages

**Drag and Drop:**
- Click and hold a deal card
- Drag horizontally to target stage column
- Visual indicators: target column highlights on hover
- Drop to move deal to new stage
- Weighted amounts recalculate automatically (delay icon shown during calculation)
- Conditional properties may appear (required properties for the new stage)

**Alternative methods:**
- Click on deal card > open deal detail > change stage dropdown
- Inline edit stage property from table view

### 4.4 Deal Detail View
- Same three-column layout as contacts
- **Left sidebar**: Deal properties (Amount, Stage, Close Date, Pipeline, Owner, Priority)
- **Center column**: Activities timeline, overview
- **Right sidebar**: Associated Contacts, Companies, Line Items, Quotes

### 4.5 Pipeline Configuration

**Path:** Settings > Objects > Deals > Pipelines tab

**Features:**
- **Create pipeline**: Name, access permissions
- **Add stages**: Click "+ Add deal stage" below existing stages
- **Rename stages**: Click on stage name to edit
- **Reorder stages**: Drag and drop stages
- **Set probability**: Dropdown per stage (0-100%), or type custom value
- **Required properties**: Configure which properties must be filled when deal enters a stage
- **Conditional stage properties**: Show certain properties only for specific stages
- **Stage automations**: Trigger actions when deal enters a stage (send email, create task, etc.)
- **Clone pipeline**: Duplicate existing pipeline as template
- **Delete pipeline**: Only if no active deals reference it

**Default Pipeline Stages:**
1. Appointment Scheduled (20%)
2. Qualified to Buy (40%)
3. Presentation Scheduled (60%)
4. Decision Maker Bought-in (80%)
5. Contract Sent (90%)
6. Closed Won (100%)
7. Closed Lost (0%)

### 4.6 Multiple Pipelines
- Available on Starter+ plans
- Each pipeline has its own stages and probabilities
- Switch between pipelines via dropdown above the board
- Deals belong to exactly one pipeline
- Can move deals between pipelines

### 4.7 Deal Forecasting
- **Forecast tool**: Settings > Forecast configuration
- **Forecast categories**: Not Forecasted, Pipeline, Best Case, Commit, Closed Won
- Deal stages map to forecast categories
- Forecast amounts calculated by category
- Goal-based forecasting per user/team
- Forecast columns are customizable
- Automatic forecast category updates when deal stage changes (via workflow)

---

## 5. Dashboard & Reporting

### 5.1 Default Dashboard Layout

**Structure:**
```
+------------------------------------------------------------+
| Dashboard: [Sales Dashboard v]    [+ Add Report] [Actions] |
+------------------------------------------------------------+
|                                                             |
| +------------------+ +------------------+ +---------------+|
| | Revenue This     | | Deals Created    | | Win Rate      ||
| | Month            | | This Month       | |               ||
| | $125,000         | | 24               | | 32%           ||
| | [KPI Card]       | | [KPI Card]       | | [KPI Card]    ||
| +------------------+ +------------------+ +---------------+|
|                                                             |
| +---------------------------+ +----------------------------+|
| | Deal Pipeline             | | Revenue by Source           ||
| | [Funnel Chart]            | | [Bar Chart]                 ||
| |                           | |                              ||
| |  Appointment  ████████ 50 | |  Organic  █████████ $80K    ||
| |  Qualified    ██████ 35   | |  Paid     ██████ $45K       ||
| |  Presentation ████ 20     | |  Referral ████ $30K         ||
| |  Decision     ███ 12      | |  Direct   ██ $15K           ||
| |  Contract     ██ 8        | |                              ||
| |  Closed Won   █ 5         | |                              ||
| +---------------------------+ +----------------------------+|
|                                                             |
| +---------------------------+ +----------------------------+|
| | Activity Summary          | | Top Performers              ||
| | [Table Widget]            | | [Leaderboard]               ||
| +---------------------------+ +----------------------------+|
+------------------------------------------------------------+
```

### 5.2 Widget Types

**KPI / Single Metric Cards:**
- Large number display
- Comparison to previous period (percentage change)
- Trend indicator (up/down arrow)

**Chart Types:**
- Bar charts (horizontal / vertical)
- Line charts (time series)
- Area charts
- Pie / Donut charts
- Funnel charts (pipeline conversion)
- Pivot tables
- Scatter plots

**Table Widgets:**
- Data tables with sortable columns
- Row-level drill-through to records

**Special Widgets:**
- Goals progress bars
- Leaderboards (ranked by metric)
- Activity summaries
- Pipeline snapshots

### 5.3 Custom Report Builder Flow

**Step 1: Choose Report Type**
- Navigate: Reporting > Reports > Create Report > Custom Report
- Options:
  - Create report on your own
  - Start with a dataset (Enterprise)
  - AI-assisted report creation

**Step 2: Select Data Sources**
- Primary data source (e.g., Contacts, Deals, Companies)
- Toggle to add additional data sources
- Add association labels to filter by relationship type

**Step 3: Add Fields**
- Drag properties into designated slots:
  - X-axis
  - Y-axis
  - Group by (breakdown)
  - Filters
- Available properties depend on selected data sources

**Step 4: Configure Visualization**
- Choose chart type (bar, line, pie, table, KPI, etc.)
- Customize colors, labels, legends
- Set date ranges and comparison periods

**Step 5: Apply Filters**
- Property-based filters
- Date range filters
- Owner/team filters

**Step 6: Save & Add to Dashboard**
- Name the report
- Add to existing dashboard or create new
- Set permissions (private, team, everyone)

### 5.4 Dashboard Customization

**Adding Reports:**
- "Add report" button opens a side panel
- Browse saved reports or templates
- Drag-and-drop reports onto dashboard (new feature, Oct 2025)
- Report library with pre-built templates

**Layout:**
- Grid-based layout
- Reports can be resized (drag corners)
- Reports can be repositioned (drag to move)
- Responsive grid adapts to screen size

**Sharing:**
- Share via Slack integration
- Email dashboard on schedule
- Set dashboard permissions (private, team, everyone)

**Dashboard Templates:**
- Pre-built dashboards for common use cases:
  - Sales Overview
  - Marketing Performance
  - Service Dashboard
  - Revenue Analytics

---

## 6. Activity & Timeline

### 6.1 Activity Types

| Activity Type | Icon | Properties |
|--------------|------|------------|
| **Email** | Envelope | Subject, Body, To/From, Open/Click tracking, Attachments |
| **Call** | Phone | Duration, Outcome (Connected, Left Voicemail, No Answer, Busy), Notes, Recording |
| **Meeting** | Calendar | Date/Time, Duration, Attendees, Location Type (Phone/Address/Video), Description, Outcome |
| **Note** | Document | Body text, Attachments |
| **Task** | Checkbox | Title, Type (Call/Email/To-Do), Due Date, Priority, Status, Owner, Queue |
| **Postal Mail** | Envelope with stamp | Body, Date |
| **WhatsApp** | Chat bubble | Message content, Timestamp |
| **LinkedIn** | LinkedIn icon | Message content, Timestamp |
| **SMS** | Phone message | Message content, Timestamp |

### 6.2 Timeline Component Layout

```
+-- Activities Tab ------------------------------------------+
| [Overview] [Activities] [Custom Tabs...]                   |
|                                                            |
| +-- Filter Bar ------------------------------------------+ |
| | [All] [Emails] [Calls] [Tasks] [Meetings] [Notes]     | |
| | Filter by: [All Users v] [All Teams v]                 | |
| | Search: [Search activities...                        ] | |
| | [Expand All] [Collapse All]                            | |
| +-------------------------------------------------------+ |
|                                                            |
| +-- Activity Entry (Expanded) -------------------------+ |
| | [Email Icon] Email sent to John Doe                   | |
| | by Sarah Johnson - Feb 5, 2026 at 2:30 PM            | |
| | Subject: Follow-up on proposal                       | |
| | Preview: "Hi John, I wanted to follow up on..."      | |
| | [Opened] [Clicked: 2 links]                          | |
| | Associated: Acme Corp Deal                           | |
| +------------------------------------------------------+ |
|                                                            |
| +-- Activity Entry (Collapsed) ------------------------+ |
| | [Call Icon] Call logged - Sarah Johnson               | |
| | Feb 4, 2026 at 10:15 AM | Duration: 12 min          | |
| | Outcome: Connected                                   | |
| +------------------------------------------------------+ |
|                                                            |
| +-- Activity Entry ------------------------------------+ |
| | [Note Icon] Note added by Mike Chen                  | |
| | Feb 3, 2026 at 4:00 PM                              | |
| | "Customer expressed interest in enterprise plan..."  | |
| +------------------------------------------------------+ |
+-----------------------------------------------------------+
```

### 6.3 Logging Activities

**From Record Page:**
- Quick action icons at top of left sidebar
- Default icons: Note, Email, Call, Task, Meeting
- Icons can be reordered per user preference
- Ellipsis menu for additional activity types

**Logging a Call:**
1. Click Call icon on record
2. Fill in: Duration, Outcome dropdown, Notes
3. Associate with deals/tickets (optional)
4. Click "Log call"
5. Activity appears immediately in timeline

**Logging an Email:**
1. Click Email icon
2. Fill in: Subject, Body, Date/Time sent
3. Or compose and send directly from HubSpot
4. Tracked emails auto-log opens and clicks

**Logging a Meeting:**
1. Click Meeting icon
2. Fill in: Date, Duration, Attendees, Location, Notes
3. Set outcome: Held, Rescheduled, No-show
4. Associate with deals

**Creating a Task:**
1. Click Task icon
2. Fill in: Title, Type (Call/Email/To-Do), Due Date
3. Set Priority, Assign to user
4. Add to task queue
5. Task appears in timeline and task list

### 6.4 Activity Filters on Timeline
- **Type filters**: Checkbox toggles for each activity type
- **User filter**: Dropdown to show activities by specific user
- **Team filter**: Dropdown to show activities by team
- **Search**: Full-text search across activity subjects and bodies
- **Expand/Collapse**: Toggle all activities expanded or collapsed
- Filters are per-record (do not persist across records)

### 6.5 Task Management Flow

**Task List (Index Page):**
- Navigate: CRM > Tasks
- Views: All Tasks, My Tasks, Due Today, Overdue, Completed
- Table with columns: Task Name, Associated Record, Due Date, Type, Priority, Status, Owner
- Quick filters: Due Date, Type, Priority, Owner

**Task Queues:**
- Group related tasks into queues
- Process tasks sequentially (guided workflow)
- Mark complete, log activity, move to next task

**Task Properties:**
- Title
- Type: Call, Email, To-Do
- Due Date & Time
- Priority: None, Low, Medium, High
- Status: Not started, In progress, Completed, Waiting, Deferred
- Owner (assigned user)
- Associated records
- Notes/description
- Reminders

---

## 7. Settings & Configuration

### 7.1 Settings Page Structure

**Navigation:** Click gear icon in top navigation bar

**Left Sidebar Categories:**
```
Account & Setup
  +-- Account Defaults
  +-- Users & Teams
  +-- Branding
  +-- Currency
  +-- Security
  +-- Privacy & Consent

Data Management
  +-- Properties
  +-- Data Enrichment
  +-- Import & Export
  +-- Audit Logs

Objects
  +-- Contacts
  |   +-- Setup (lifecycle stages)
  |   +-- Record Customization
  |   +-- Associations
  +-- Companies
  |   +-- Setup
  |   +-- Record Customization
  |   +-- Associations
  +-- Deals
  |   +-- Setup
  |   +-- Pipelines (stages, probabilities)
  |   +-- Record Customization
  |   +-- Associations
  +-- Tickets
  |   +-- Setup
  |   +-- Pipelines
  |   +-- Record Customization
  +-- Custom Objects
  +-- Activities (calls, meetings settings)

Marketing
  +-- Email
  +-- Forms
  +-- Social
  +-- Ads
  +-- SEO

Sales
  +-- Sequences
  +-- Meetings
  +-- Calling
  +-- Forecast

Service
  +-- Help Desk
  +-- Knowledge Base
  +-- Feedback
  +-- Customer Portal

Integrations
  +-- Connected Apps
  +-- API Keys
  +-- Email Integrations
  +-- Calendar Sync

Notifications
  +-- Email Notifications
  +-- Desktop Notifications
  +-- Mobile Notifications
```

### 7.2 User Management
**Path:** Settings > Users & Teams

**User Table:**
- Columns: Name, Seat, Permission Sets, Access, Main Team, Extra Teams, Invite Status, Last Active
- Actions: Invite user, Edit permissions, Deactivate
- Highlight card at top showing: total users, active users, pending invites

**Permission Levels:**
- Super Admin (full access)
- Permission sets (customizable bundles)
- Granular property-level access control

### 7.3 Property Settings
**Path:** Settings > Data Management > Properties

**Features:**
- Object selector dropdown (Contact, Company, Deal, Ticket, Custom)
- Property table: Name, Type, Group, Created By, Used In
- Create new property:
  - Name, Internal name
  - Group (General, Contact Info, etc.)
  - Type: Single-line text, Multi-line text, Number, Dropdown, Checkbox, Date, etc.
  - Required/Optional
  - Visibility settings
- Property access management (view/edit permissions per user/team)
- Property groups for organization

### 7.4 Pipeline Settings
**Path:** Settings > Objects > [Object] > Pipelines

**Features:**
- Pipeline selector dropdown
- Stage editor (add, rename, reorder, delete)
- Stage properties:
  - Name
  - Probability (for deals)
  - Open/Closed status
  - Conditional properties
- Automation tab (per-stage triggers)
- Board and card view customization
- Pipeline access permissions

### 7.5 Notification Preferences
**Path:** Settings > Notifications (or user icon > Profile & Preferences > Notifications)

**Channel types:**
- Email notifications
- Desktop (browser) notifications
- Mobile push notifications

**Notification categories:**
- CRM: Record assignments, property changes, deal stage updates
- Tasks: Assignment, reminders, due dates
- Sales: Email opens, link clicks, document views
- Forms: New submissions
- Conversations: New messages
- Workflows: Errors, completions
- Security: Login alerts, password changes

---

## 8. Common UI Components

### 8.1 Data Tables

**Structure:**
```
+-- Table Header ------------------------------------------+
| [Checkbox] | Column A [Sort] | Column B [Sort] | Actions |
+------+---------------------------------------------------+
|  [ ] | Value            | Value             | [...     ]|
|  [ ] | Value            | Value             | [...     ]|
|  [ ] | Value            | Value             | [...     ]|
+------+---------------------------------------------------+
| [< Prev] [1] [2] [3] ... [Next >]    Showing 1-25 of 500|
+----------------------------------------------------------+
```

**Features:**
- **Selection**: Checkbox column on left for row selection
- **Bulk selection**: Header checkbox selects all on page, then "Select all X records" for entire dataset
- **Column headers**: Sortable (click to toggle asc/desc), resizable
- **Column menu**: Three-dot icon: Sort ascending, Sort descending, Freeze column, Insert column
- **Row hover**: Background color change, action icons appear
- **Inline editing**: Click cell to edit (text fields, dropdowns)
- **Pagination**: Page numbers with prev/next, records per page selector (25, 50, 100)
- **Empty state**: Illustration + "No records found" message + "Create [record]" CTA
- **Loading state**: Skeleton rows (placeholder shimmer animation)
- **Sticky header**: Table header remains visible on scroll
- **Column reordering**: Drag columns via header
- **Fixed columns**: Name column typically frozen on scroll

### 8.2 Forms

**Field Layout:**
- Single-column layout (stacked fields)
- Label above input
- Placeholder text in inputs
- Required indicator: asterisk (*) after label
- Help text below field (optional)

**Field Types:**
- Text input (single line)
- Text area (multi-line)
- Number input
- Dropdown select (single)
- Multi-select dropdown
- Checkbox
- Radio buttons
- Date picker
- File upload
- Rich text editor
- Phone input (with country code)
- Currency input

**Validation Display:**
- Red border on invalid field
- Error message below field in red text
- Error icon inline with message
- Validation on blur (when field loses focus)
- Form-level error summary at top (if multiple errors)

**Form Actions:**
- Primary button: "Save" or "Create [Object]" (right-aligned)
- Secondary button: "Cancel" (left of primary)
- Tertiary: "Create and add another"

### 8.3 Modals (Dialog Boxes)

**Sizes:**
- Small: ~400px wide (confirmation dialogs)
- Medium: ~600px wide (forms, selections)
- Large: ~800px wide (complex editors)

**Structure:**
```
+-- Modal -----------------------------------+
| Title                              [X]     |
|--------------------------------------------|
|                                            |
| Content area                               |
| (form fields, messages, selections)        |
|                                            |
|--------------------------------------------|
| [Cancel]              [Primary Action]     |
+--------------------------------------------+
```

**Behaviors:**
- Dark overlay behind modal (semi-transparent black)
- Close via: X button, Cancel button, clicking overlay, Escape key
- Focus trapped inside modal
- Scroll within modal if content exceeds viewport
- Animation: Fade in + slight scale up

**Confirmation Dialogs:**
- Used for destructive actions (delete, remove)
- Warning icon
- "Are you sure?" message with context
- "Delete" button in red/danger style
- "Cancel" button as secondary

### 8.4 Sidebars / Drawers (Slide-in Panels)

**Behavior:**
- Slides in from the right side of the screen
- Overlays main content (does not push it)
- Semi-transparent overlay on left
- Close via X button or clicking overlay
- Width: approximately 400-500px

**Used For:**
- Create record forms (Contact, Deal, Company)
- Advanced filter configuration
- Property editing
- Quick record preview
- Association management
- Column editing

**Structure:**
```
+-- Content Area ----------+-- Slide-in Panel --+
|                          | Panel Title    [X]  |
|  (main page content,     |                     |
|   partially visible       | Content             |
|   behind overlay)         | (forms, lists,      |
|                          |  settings)          |
|                          |                     |
|                          |                     |
|                          | [Cancel]  [Action]  |
+--------------------------+---------------------+
```

### 8.5 Buttons

**Hierarchy:**
| Type | Style | Usage |
|------|-------|-------|
| **Primary** | Solid fill, brand color (HubSpot orange #FF7A59 / F-CORE ocean blue) | Main actions: Save, Create, Submit |
| **Secondary** | Outlined border, no fill | Alternative actions: Cancel, Back |
| **Tertiary** | Text-only, no border | Subtle actions: "Learn more", links |
| **Danger** | Solid red fill (#D94F4F) | Destructive: Delete, Remove |
| **Success** | Solid green fill | Confirm, Approve |
| **Disabled** | Greyed out, no pointer | Unavailable action |

**Sizes:**
- Small: 28px height (inline actions)
- Medium: 36px height (default)
- Large: 44px height (primary CTAs)

**States:**
- Default
- Hover (slight darkening)
- Active/Pressed (further darkening)
- Focus (outline ring for accessibility)
- Loading (spinner icon replaces text)
- Disabled (greyed out, not clickable)

**Icon Buttons:**
- Square buttons with only an icon
- Used for: Edit, Delete, More options, Collapse/Expand
- Tooltip on hover showing action name

### 8.6 Cards

**Deal Card (Board View):**
```
+-- Deal Card ------------------+
| Deal Name                     |
| $25,000                       |
| Close: Mar 15, 2026           |
| Owner: Sarah Johnson          |
| [Quick Actions on hover]      |
+-------------------------------+
```
- Configurable properties (up to 4-6)
- Contact/company avatar
- Priority indicator
- Hover reveals quick action buttons

**Contact Card (Compact/Preview):**
```
+-- Contact Card ---------------+
| [Avatar] John Doe             |
| john@example.com              |
| Acme Corp | Marketing Manager |
| Last Activity: 2 days ago     |
+-------------------------------+
```

**Association Card (Right Sidebar):**
```
+-- Companies -------- [+Add] --+
| [Logo] Acme Corporation       |
| Primary                       |
| Industry: Technology          |
| Revenue: $10M - $50M         |
| [View Record]                 |
+-------------------------------+
```

### 8.7 Empty States
- Centered illustration or icon (simple, friendly)
- Heading: "No [objects] yet" or "No results found"
- Description: Brief explanation of what should appear here
- CTA button: "Create [object]" or "Import [objects]" or "Clear filters"
- Used consistently across: tables, timelines, dashboards, association cards

### 8.8 Loading States
- **Skeleton screens**: Grey placeholder blocks mimicking content layout (shimmer animation)
- **Spinner**: Circular loading indicator for buttons and small sections
- **Progress bar**: For long operations (import, export)
- **Delay icon**: Small indicator next to values being recalculated (e.g., weighted amounts)
- Loading states are never blank screens - always show skeleton structure

### 8.9 Toast Notifications
- Position: Bottom-left of screen (or top-right in some contexts)
- Auto-dismiss after 3-5 seconds
- Types:
  - **Success**: Green left border + check icon + message
  - **Error**: Red left border + error icon + message
  - **Warning**: Yellow/amber left border + warning icon
  - **Info**: Blue left border + info icon
- Action link: Optional "Undo" or "View" button within toast
- Can stack multiple toasts
- Dismissible via X button

### 8.10 Dropdown Menus

**Standard Dropdown:**
- Trigger: Click (not hover)
- Panel appears below trigger
- Items can have: icon + label + description
- Supports search/filter within dropdown (for long lists)
- Keyboard navigation (arrow keys, enter to select)
- Dividers between groups

**Action Menu (Three-dot / Kebab):**
- Trigger: Click "..." icon
- Items: text actions, some with icons
- Destructive actions at bottom in red text
- Dividers to group related actions

### 8.11 Search with Autocomplete
- Input with search icon (left) and clear button (right)
- Debounced search (waits for typing pause)
- Dropdown results panel:
  - Grouped by object type (Contacts, Companies, Deals)
  - Each result shows: name, secondary info (email, domain)
  - Recent searches section
  - "View all results" link at bottom
- Keyboard navigation supported
- Cmd/Ctrl+K shortcut for global search

### 8.12 Date Pickers
- Calendar grid dropdown
- Month/year navigation (arrows + dropdowns)
- Today highlight
- Date range picker (start - end)
- Quick presets: Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, Custom
- Time picker: Hour/minute selector (12h or 24h format)
- Relative dates in filters: "in the last X days", "more than X days ago"

### 8.13 Tag / Label Components
- Small colored pills/badges
- Used for: Lifecycle stages, Lead status, Deal stages, Labels
- Color-coded by category
- Removable (X icon on hover for editable contexts)
- In filters: multi-select checkboxes with colored indicators
- Truncated with "+N more" when too many to display

---

## 9. Mobile Responsiveness

### 9.1 HubSpot Mobile App
HubSpot provides a dedicated native **mobile app** (iOS + Android) rather than just a responsive web app. The app provides:

**Key Features:**
- Contact, Company, Deal, Ticket management
- Caller ID integration (links incoming calls to CRM)
- Activity logging (calls, meetings, notes)
- Task management and reminders
- Pipeline board view (deals)
- Dashboard and report viewing
- Push notifications for real-time updates
- Business card scanner
- HubSpot keyboard (share CRM data in any app)
- Email tracking (opens, clicks)
- Call recording via HubSpot number
- Offline mode (view and edit, sync when online)

### 9.2 Responsive Breakpoints (Web Platform)

HubSpot's web CRM uses the following breakpoint:

| Breakpoint | Max Width | Preview Width | Target |
|-----------|-----------|---------------|--------|
| Desktop | > 767px | N/A | Full layout |
| Mobile | <= 767px | 520px | Simplified layout |

**Note:** The HubSpot CRM web app is primarily designed for desktop. The mobile app handles the mobile experience. However, HubSpot's CMS (website builder) supports responsive design with these patterns:
- Standard breakpoint at 767px
- Bootstrap-compatible responsive grid
- Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

### 9.3 Mobile Navigation Pattern
**Mobile App Navigation:**
- Bottom tab bar navigation (iOS/Android native pattern)
- Key tabs: Home, Contacts, Deals, Tasks, More
- Hamburger menu for less-used items
- Search accessible from top bar
- Pull-to-refresh on lists

### 9.4 Table Behavior on Mobile
- Tables transform to card/list layout
- Key properties shown per card
- Tap to expand/view record detail
- Horizontal scrolling for data-heavy views
- Simplified column set (name + 1-2 key fields)

### 9.5 Pipeline Board on Mobile
- Horizontal scrollable stages
- Swipe left/right between stages
- Deal cards stack vertically within each stage
- Tap card to view deal details
- Stage totals visible at top of each column
- Drag-and-drop replaced with action button to move stages

### 9.6 F-CORE Responsive Strategy
For F-CORE, recommended approach:
```
Breakpoints:
- Desktop: >= 1280px (full three-column record layout)
- Tablet: 768px - 1279px (two-column, sidebar toggles)
- Mobile: < 768px (single column, bottom nav)

Responsive behaviors:
- Navigation: Sidebar collapses to icons, then to hamburger menu
- Tables: Horizontal scroll with frozen name column, or card view
- Record pages: Stacked columns on mobile (left sidebar > center > right sidebar)
- Pipeline board: Horizontal scroll, one stage visible at a time
- Dashboard: Single-column widget stack on mobile
- Modals: Full-screen on mobile
- Slide-in panels: Full-screen on mobile
```

---

## Appendix: Component Inventory for F-CORE

### Priority Components (Phase 1)
1. **AppShell** - Layout with collapsible sidebar + top bar
2. **DataTable** - Sortable, filterable, paginated table with inline editing
3. **RecordPage** - Three-column layout (left/center/right)
4. **Timeline** - Activity timeline with filters
5. **SlidePanel** - Right-side slide-in drawer
6. **FormBuilder** - Dynamic form with validation
7. **Modal** - Dialog overlay
8. **BoardView** - Kanban board with drag-and-drop
9. **BoardCard** - Configurable deal/ticket cards
10. **FilterBar** - Quick filters + advanced filter panel
11. **SavedViews** - Tab system for saved filter combinations
12. **SearchInput** - Global search with autocomplete
13. **Toast** - Notification toasts
14. **Button** - Button system (primary/secondary/danger/sizes)
15. **DatePicker** - Calendar with range and presets
16. **Dropdown** - Select + action menu
17. **EmptyState** - Consistent empty state component
18. **LoadingSkeleton** - Skeleton loading placeholders
19. **Tag/Badge** - Colored label pills
20. **Avatar** - User/company avatar with initials fallback

### Design Tokens Summary (from HubSpot patterns)
```
Colors:
  - Primary: Ocean Blue (#0891b2) [F-CORE brand]
  - Danger: Red (#D94F4F)
  - Success: Green (#00BDA5)
  - Warning: Amber (#F5C26B)
  - Info: Blue (#0091AE)
  - Background: White (#FFFFFF)
  - Surface: Light Gray (#F5F8FA)
  - Border: Gray (#CBD6E2)
  - Text Primary: Dark (#33475B)
  - Text Secondary: Medium Gray (#516F90)
  - Text Muted: Light Gray (#7C98B6)

Spacing: 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

Border Radius:
  - Small: 3px (inputs, badges)
  - Medium: 6px (cards, panels)
  - Large: 8px (modals)
  - Full: 50% (avatars)

Typography:
  - Font: Lexend Deca / Inter / system-ui
  - H1: 24px / bold
  - H2: 20px / semi-bold
  - H3: 16px / semi-bold
  - Body: 14px / regular
  - Small: 12px / regular
  - Caption: 11px / regular

Shadows:
  - Card: 0 1px 3px rgba(0,0,0,0.08)
  - Dropdown: 0 4px 12px rgba(0,0,0,0.15)
  - Modal: 0 8px 24px rgba(0,0,0,0.2)
  - Sidebar: 2px 0 8px rgba(0,0,0,0.08)
```

---

> **Document Status:** Complete
> **Last Updated:** 2026-02-07
> **Total Sections:** 9 major areas, 50+ sub-sections
> **Usage:** Reference for F-CORE UI component design and user flow implementation
