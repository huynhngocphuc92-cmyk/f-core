# Competitive Analysis: CRM Reporting & Custom Reports

> **Project:** F-CORE (HubSpot CRM Clone)
> **Date:** 2026-02-09
> **Author:** Competitive Analyst (AI-Assisted)
> **Purpose:** Research and document reporting/analytics features across major CRM competitors to inform F-CORE's reporting module roadmap.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [HubSpot](#2-hubspot)
3. [Salesforce](#3-salesforce)
4. [Pipedrive](#4-pipedrive)
5. [Zoho CRM](#5-zoho-crm)
6. [Monday.com](#6-mondaycom)
7. [Feature Comparison Matrix](#7-feature-comparison-matrix)
8. [Key Takeaways for F-CORE](#8-key-takeaways-for-f-core)

---

## 1. Executive Summary

CRM reporting has evolved from static tabular exports to AI-powered, real-time analytics platforms. The five competitors analyzed represent a spectrum from enterprise-grade analytics (Salesforce) to lightweight visual dashboards (Monday.com). HubSpot sits in the middle with a strong custom report builder, while Pipedrive focuses on sales-specific insights and Zoho offers the broadest visualization library at the most affordable price point.

**Key industry trends in 2025-2026:**
- AI-generated reports and natural language queries (Salesforce Einstein, Zoho Zia, Monday AI)
- Real-time / streaming analytics replacing cached reports
- Cross-object and multi-source reporting
- Drag-and-drop report builders with "smart chart" recommendations
- Scheduled PDF/email exports with role-based filtering
- Embeddable dashboards and white-label portals

---

## 2. HubSpot

### 2.1 Report Types

| Report Type | Description | Subscription |
|---|---|---|
| **Single Object Reports** | Analyze one CRM object (Contacts, Companies, Deals, Tickets, Quotes, Custom Objects, Payments, Activities, Line Items, Feedback) | Professional+ |
| **Funnel Reports** | Measure conversion rates between lifecycle stages or deal pipeline stages | Professional+ |
| **Custom Report Builder** | Multi-object, multi-data-source advanced reports combining CRM objects with marketing, sales, and service activities | Professional+ |
| **Contact Attribution Reports** | Which sources, assets, and interactions impacted lead generation | Enterprise only |
| **Deal Create Attribution Reports** | Which sources, assets, and interactions impacted deal generation | Enterprise only |
| **Custom Events Funnel** | Funnel reports using custom behavioral events | Enterprise only |

### 2.2 Chart Types

| Chart Type | Notes |
|---|---|
| Horizontal Bar | Supports stacking, percentage stacking |
| Vertical Bar (Column) | Supports stacking, percentage stacking |
| Line | Supports multiple Y-axes |
| Area | Supports multiple Y-axes |
| Pie | Standard proportional display |
| Doughnut | Ring-style pie variant |
| Summary (KPI) | Single-number display with percentage change comparison |
| Table | Sortable data table with inline aggregation |
| Gauge | Goal tracking against a target value |
| Pivot Table | Advanced tabular report with row/column grouping and aggregation |
| Combination | Bar + Line on dual Y-axes |

**Smart Chart:** HubSpot auto-recommends chart types based on the fields selected, reducing guesswork for non-technical users.

### 2.3 Dashboard Features

- Up to **300 dashboards** and **3,000 custom reports** (with reporting add-on at $200/mo)
- Default limits vary by plan (e.g., 10 dashboards / 10 reports on Starter)
- Dashboards support drag-and-drop widget arrangement
- Each dashboard can contain multiple report widgets
- Dashboards can be assigned specific owners
- Clone dashboards for rapid setup

### 2.4 Data Sources

- All standard CRM objects: Contacts, Companies, Deals, Tickets, Quotes, Line Items
- Custom Objects
- Marketing: Emails, Landing Pages, Blog Posts, CTAs, Forms, Ads, Campaigns (Primary Campaigns data source added 2025)
- Sales: Activities, Sequences, Meetings, Calls, Emails
- Service: Tickets, Feedback Submissions, Knowledge Base
- Commerce: Payments, Subscriptions
- Website: Page Views, Sessions
- Cross-object joins supported in Custom Report Builder

### 2.5 Filters and Date Ranges

- Property-based filters on any field in the data source
- Standard date ranges: Today, Yesterday, This Week, This Month, This Quarter, This Year, Last X days/weeks/months, Custom range
- **Compare By**: Date-based comparison (e.g., this quarter vs. same quarter last year)
- Relative date filters
- Dashboard-level date filters that apply to all reports

### 2.6 Scheduling and Export

| Feature | Details |
|---|---|
| **Email Scheduling** | Daily, Weekly, Monthly recurring emails for individual reports and dashboards |
| **Recipients** | HubSpot users (recurring); non-HubSpot users (one-time, Pro/Enterprise only with connected sending domain) |
| **Export Formats** | CSV, Excel (XLSX) for reports; image (PNG) for chart snapshots |
| **Slack Integration** | Share reports directly to Slack channels |
| **Dashboard Email** | Send full dashboard data as recurring email |
| **Manage Recurring** | Super Admins and dashboard owners can modify/delete recurring emails |

### 2.7 Real-time vs. Cached Data

- Reports pull **near real-time data** from the HubSpot database
- No explicit caching layer exposed to users
- Large reports may take a few seconds to process
- Dashboard widgets refresh when the dashboard is loaded

### 2.8 Custom Formulas / Calculated Fields

| Feature | Details |
|---|---|
| **Formula Fields (Report Builder)** | Row-level calculations using arithmetic, conditional logic (IF/THEN), date functions (DATEDIFF, NOW), string functions |
| **Calculated Properties** | Object-level properties that auto-calculate based on associated records (e.g., average deal size per company) |
| **Rollup Properties** | Aggregate values from associated records (SUM, AVG, MIN, MAX, COUNT) |
| **AI Formula Generation** | Not yet available in report builder (available for calculated properties via Breeze AI) |
| **Dataset Formulas** | Advanced formulas in Data Studio datasets including DATEDIFF, IF, conditional logic |

### 2.9 Sharing and Permissions

| Feature | Details |
|---|---|
| **Report Permissions** | Create/Own, Edit permissions configurable per user/team |
| **Dashboard Visibility** | Everyone, Specific Users/Teams, or Private (owner only) |
| **Reports Access Toggle** | Master toggle to grant/revoke access to all reporting tools |
| **Role-Based Dashboards** | Different dashboards for different roles; data filtered by user permissions |
| **Super Admin Override** | Super Admins can see and manage all reports/dashboards |
| **Export Permissions** | Controlled separately; can restrict who can export data |

---

## 3. Salesforce

### 3.1 Report Types

| Report Type | Description |
|---|---|
| **Tabular** | Simple spreadsheet-style list; no grouping, no charts; suitable for exports and mailing lists |
| **Summary** | Groups data by rows with subtotals; supports charts and dashboards; most commonly used |
| **Matrix** | Groups by both rows and columns; ideal for cross-dimensional analysis (e.g., revenue by product AND month) |
| **Joined** | Combines multiple report types (tabular + summary, matrix + summary, etc.) in a single view; up to 5 blocks |
| **Custom Report Types (CRT)** | Admin-defined templates specifying which objects and fields are available for reporting |

### 3.2 Chart Types

| Chart Type | Variants |
|---|---|
| Bar | Grouped, Stacked, Stacked to 100% |
| Column | Grouped, Stacked, Stacked to 100% |
| Line | Standard, Grouped, Cumulative, Grouped Cumulative |
| Pie | Standard |
| Donut | Standard |
| Funnel | Standard |
| Scatter | Standard |
| Gauge | Single metric against target |
| Metric / KPI Tile | Single number display |
| Table | Values Table, Pivot Table, Compare Table (in CRM Analytics / Einstein) |
| Map / Geo | Geographic data visualization (in CRM Analytics) |

### 3.3 Dashboard Features

- Up to **20 components per dashboard** (standard); more via CRM Analytics
- Dashboard components are individually configured widgets linked to source reports
- **Dynamic Dashboards**: Data displayed changes based on the logged-in user's role/permissions
- **Running User**: Dashboards can run as a specific user or as the logged-in user
- Drag-and-drop grid layout
- Dashboard folders for organization
- **CRM Analytics (formerly Einstein Analytics / Tableau CRM)**: Separate, more powerful dashboarding platform with interactive exploration, drill-downs, and AI-powered insights
- Einstein Analytics supports Values Tables, Pivot Tables, Compare Tables

### 3.4 Data Sources

- All standard Salesforce objects: Accounts, Contacts, Opportunities, Leads, Cases, Campaigns, Products, Quotes, Orders, Tasks, Events
- Custom Objects
- Cross-object reporting via lookup relationships
- **Data Cloud Reports**: Report on semantic data models and external data (with DC license)
- **CRM Analytics**: Can pull from Salesforce + external sources (Google Analytics 4 connector, Bulk API 2.0)
- **Tableau Integration**: For combining Salesforce data with any external data source

### 3.5 Filters and Date Ranges

- Field-level filters with operators (equals, contains, greater than, etc.)
- Standard date ranges and relative dates (THIS_MONTH, LAST_N_DAYS, etc.)
- Cross-filters: Include/exclude records based on related object existence
- **Dynamic Filters** on dashboards (users can change filters without editing)
- Filter logic (AND/OR combinations)
- Bucket fields for grouping values

### 3.6 Scheduling and Export

| Feature | Details |
|---|---|
| **Report Scheduling** | Schedule reports to run at specific times; results emailed automatically |
| **Dashboard Scheduling** | Schedule dashboard refreshes and email delivery |
| **Export Formats** | CSV, Excel, Printable View (up to 20,000 rows for joined reports) |
| **Slack Integration** | Share reports/dashboards to Slack channels |
| **Automated via Flow** | Trigger report generation through Salesforce Flow automation |
| **API Access** | Analytics REST API for programmatic report access |

### 3.7 Real-time vs. Cached Data

- Standard reports are **near real-time** (query the database on demand)
- Dashboards have a **refresh button** and show the last refresh timestamp
- **CRM Analytics**: Supports both scheduled data syncs and near real-time data
- **Streaming Analytics** (2025+): Dashboards that update every few seconds without page refresh
- Report row limit: 2,000 rows displayed (export for more)

### 3.8 Custom Formulas / Calculated Fields

| Feature | Details |
|---|---|
| **Row-Level Formulas** | Inline formulas within reports (available in Summary and Matrix formats) |
| **Summary Formulas** | Calculations on grouped/summarized data (Grand Total, Group Total, etc.) |
| **Cross-Object Formulas** | Reference fields from related objects in formulas |
| **Bucket Fields** | Group field values into categories without creating custom fields |
| **Einstein Formula Generation** | Natural language to formula generation (Winter '25+) |
| **Formula Fields (Object)** | Calculated fields on objects that auto-compute and are available in reports |

### 3.9 Sharing and Permissions

| Feature | Details |
|---|---|
| **Report Folders** | Shared, hidden, or read-only folders with role-based access |
| **Dashboard Folders** | Same folder-based sharing as reports |
| **Role Hierarchy** | Users see data based on their role in the hierarchy |
| **Dynamic Dashboards** | Each user sees only their own data (based on running user setting) |
| **Field-Level Security** | Sensitive fields hidden from reports based on profile |
| **Report Subscription** | Users can subscribe to reports to receive scheduled emails |
| **OWD / Sharing Rules** | Organization-wide defaults and sharing rules affect report data visibility |

---

## 4. Pipedrive

### 4.1 Report Types

| Report Type | Description |
|---|---|
| **Deal Performance** | Deals started, won, lost over time |
| **Deal Conversion** | Win/loss rates and conversion metrics |
| **Deal Duration** | Average sales cycle length |
| **Deal Progress** | Movement of deals through pipeline stages |
| **Activity Performance** | Activities planned, added, and completed |
| **Email Performance** | Emails sent, received, opened |
| **Revenue Forecast** | Expected revenue projections |
| **Subscription Revenue** | Recurring subscription revenue tracking |

**Note:** Pipedrive's reporting is focused exclusively on sales pipeline data. It does not support marketing, service, or multi-object cross-reporting natively.

### 4.2 Chart Types

| Chart Type | Notes |
|---|---|
| Column | Standard and grouped |
| Bar | Horizontal bar |
| Pie | Standard proportional |
| Scorecard / KPI | Single metric with trend indicator (up/down arrow) |
| Table | Customizable list view with sorting, export |
| Line | Basic trend visualization |

**AI Report Generator (2025+):** Users can type a natural language prompt to generate reports automatically.

### 4.3 Dashboard Features

- **Insights Dashboards**: Collection of reports on a single board
- Dashboard-level filters: User and Period
- Drag-and-drop report arrangement
- Color-coded pipeline stages for visual bottleneck identification
- **Shareable link**: Share live dashboards with non-Pipedrive users with one click
- Limited to basic charts; advanced analytics require third-party tools (Databox, Dear Lucy)
- Goals can be overlaid on dashboards

### 4.4 Data Sources

- Deals (primary focus)
- Activities (calls, meetings, emails, tasks)
- Contacts / People
- Organizations
- Products
- Projects
- Goals
- **Cannot combine multiple data sources** in a single report natively

### 4.5 Filters and Date Ranges

- Filter by User (rep/owner)
- Filter by Period (date range)
- Custom filters for pipeline, stage, product
- Limited compared to enterprise CRMs; no cross-filter or complex logic

### 4.6 Scheduling and Export

| Feature | Details |
|---|---|
| **Export Formats** | PDF, PNG for reports; XLSX, CSV for table data |
| **Scheduled Reports** | Not natively available; requires third-party integrations |
| **Email Reports** | Not natively available |
| **Shareable Links** | Live dashboard links for external stakeholders |
| **API Access** | REST API for programmatic data access |

### 4.7 Real-time vs. Cached Data

- Reports display **real-time data** from the Pipedrive database
- Dashboards update as deals move through the pipeline
- No explicit caching or refresh mechanism

### 4.8 Custom Formulas / Calculated Fields

| Feature | Details |
|---|---|
| **Custom Fields** | Add custom fields to deals, contacts, organizations |
| **Formula Fields** | Limited; no native formula builder in reports |
| **Calculated Metrics** | Basic aggregations (sum, count, average) in reports |
| **AI-Powered** | AI Sales Assistant provides predictive insights on deal outcomes |
| **No Report-Level Formulas** | Cannot create custom calculations within the report builder |

### 4.9 Sharing and Permissions

| Feature | Details |
|---|---|
| **Dashboard Sharing** | One-click shareable link (even for non-Pipedrive users) |
| **Visibility Sets** | Control which data users can see based on their role |
| **Permission Sets** | Configurable per user group (Admin, Manager, Regular User) |
| **Report Access** | Based on overall Insights feature access per plan |
| **No Folder-Based Sharing** | No report/dashboard folder structure |

---

## 5. Zoho CRM

### 5.1 Report Types

| Report Type | Description |
|---|---|
| **Tabular Reports** | Simple record lists with optional grouping and filtering |
| **Summary Reports** | Grouped data with subtotals and aggregate calculations |
| **Matrix Reports** | Cross-tabulation by rows and columns |
| **Joined Reports** | Combine up to 3 modules (CRM native) or unlimited modules (via Zoho Analytics) |
| **Pivot Tables** | Interactive pivot views with drag-and-drop dimensions |
| **Summary View** | Summarized data in tabular format with logical grouping |
| **KPI Widgets** | Single numeric, dial chart, bullet chart widgets (6 single-number + 2 chart types) |

### 5.2 Chart Types

Zoho CRM (native) supports:
- Column, Bar, Stacked Bar, Line, Area, Pie, Donut, Funnel, Heat Map, Table

**Zoho Analytics (advanced, 50+ chart types):**

| Chart Category | Types |
|---|---|
| **Standard** | Pie, Bar, Stacked Bar, Column, Line, Smooth Line, Area, Stacked Area |
| **Statistical** | Scatter, Histogram, Bubble, Packed Bubble, Bubble Pie |
| **Specialized** | Funnel, Doughnut, Web/Radar, Word Cloud, Butterfly, Combination |
| **Geographic** | Geo Map Chart, Multi-layer Maps |
| **Widgets** | Single Numeric, Dial Chart, Bullet Chart |
| **Tables** | Pivot Table, Summary View, Tabular View |

### 5.3 Dashboard Features

- **CRM Dashboards**: Built directly from saved reports; clickable drill-downs into raw data
- **Zoho Analytics Dashboards**: Multi-tabbed, interactive, embeddable dashboards
- Single and double column layouts
- KPI Widgets, user filters, rich-formatted text
- 100+ pre-built dashboard templates (sales, marketing, finance, HR, operations)
- **White-label portals**: Brand dashboards with custom logo, colors, favicon, domain
- **Homepages**: Bundle custom views, dashboard charts, and reports into role-specific mission control screens
- **Embeddable dashboards**: Embed in external websites/apps
- **Zoho Analytics Dashboards app**: Mobile access with swipe, filter, drill-down

### 5.4 Data Sources

- All CRM modules: Leads, Contacts, Accounts, Deals, Campaigns, Tasks, Events, Calls, Notes
- Custom modules
- Cross-module reporting via lookup relationships
- **Zoho Analytics**: 500+ data source connectors (CRM, Google Analytics, MySQL, QuickBooks, Salesforce, Shopify, etc.)
- Can combine CRM data with external data sources
- Asana, Zoho Finance Suite connectors (2025)

### 5.5 Filters and Date Ranges

- Property-based filters with operators
- Standard date ranges + custom ranges
- Fiscal year support with custom start month
- **Dynamic Thresholds**: Variable-based thresholds that change based on data values (2025+)
- Dashboard-level interactive filters
- Drill-down from charts to raw data
- Advanced search filter to locate reports

### 5.6 Scheduling and Export

| Feature | Details |
|---|---|
| **Report Scheduling** | Daily, Weekly, Monthly, Yearly automated delivery |
| **Recipients** | Individual users, groups by role/territory, non-CRM users |
| **Export Formats** | CSV, Excel (XLS/XLSX), PDF, HTML, Image |
| **Max Export Fields** | 200 fields per export; up to 5 lookup modules |
| **Dashboard Export** | PDF, Image |
| **Zoho Analytics** | Scheduled auto-refresh (hourly, daily, real-time); automated weekly reports with Slack alerts |
| **Print** | Direct print from charts and reports |

### 5.7 Real-time vs. Cached Data

- CRM reports are **near real-time** (query on demand)
- Zoho Analytics: Configurable sync schedule (hourly, daily, or real-time)
- Incremental fetch for large datasets (2025 update)
- Always fresh data with auto-sync

### 5.8 Custom Formulas / Calculated Fields

| Feature | Details |
|---|---|
| **Formula Fields (CRM)** | Custom calculated fields on any module with arithmetic, string, date functions |
| **Aggregate Calculations** | SUM, COUNT, AVG in reports |
| **Zoho Analytics Formulas** | Full SQL-like formula engine with window functions, date math, conditional logic |
| **Zia AI Insights** | Natural language queries, auto-generated insights, diagnostic analysis, trend predictions |
| **Custom SQL Queries** | Available in Zoho Analytics for advanced users |

### 5.9 Sharing and Permissions

| Feature | Details |
|---|---|
| **Fine-Grained Access** | Share with individual users or groups by role/territory |
| **Permission Levels** | Read, Write, Export, Share (independently configurable) |
| **Row-Level Filtering** | Share different data subsets to different users from the same report |
| **Public/Private Sharing** | Public (no login required) or Private (login required) |
| **Workspace Administrators** | Can edit shared reports; normal users use "Save As" |
| **Dashboard Drill-Through** | Public view drill-throughs (2025 update) |
| **Report Folders** | Auto-organized by category (Campaign Reports, Forecast Reports, Deal Reports, etc.) |
| **Favorites** | Quick-access folder for frequently used reports |

---

## 6. Monday.com

### 6.1 Report Types

Monday.com approaches reporting differently -- through **dashboard widgets** rather than traditional report types:

| Widget Type | Description |
|---|---|
| **Numbers** | Aggregate numbers from boards (sum, average, count, etc.) |
| **Chart** | Pie, Bar, Line, Stacked charts from board data |
| **Battery** | Visual progress indicator for tasks/projects |
| **Gantt** | Timeline-based project view with dependencies |
| **Workload** | Team capacity and resource allocation |
| **Time Tracking** | Hours logged per task/person |
| **Table** | Multi-board data table |
| **Calendar** | Date-based item view |
| **Pivot Table** | Cross-tabulation of board data |
| **Countdown** | Timer to deadline |
| **Bubble Chart** | Multi-dimensional comparison |
| **Llama Farm** | Item flow/movement tracking across statuses |
| **Activity Tracker** | Activities and emails aggregated by rep |
| **List** | Items from across the account (up to 100,000 items) |
| **Map** | Geographic data visualization |
| **Embedded** | Embed external content (Tableau, Google Data Studio, etc.) |
| **Text** | Rich text blocks for context |

### 6.2 Chart Types

| Chart Type | Notes |
|---|---|
| Pie | Distribution of data within a board |
| Bar | Comparisons between data categories; supports multi-board Y-axis |
| Line | Trends over time; supports ascending/descending sort |
| Stacked | Three-parameter visualization (X-axis, Y-axis, color) |
| Bubble | Multi-dimensional comparison |
| Funnel | Deal distribution across stages |

**Note:** Only Bar and Line charts support multi-board Y-axis aggregation.

### 6.3 Dashboard Features

- Up to **30 widgets per dashboard** (text widgets excluded from count)
- Connected boards per plan: Free (1), Standard (5), Pro (20), Enterprise (50)
- 50+ widgets and apps available
- No-code drag-and-drop builder
- **AI Blocks**: AI-powered insights, recommendations, and next-best-actions
- Real-time tracking; widgets update as items change
- Presentation mode for meetings
- **Generate Report Doc**: Auto-generate a workdoc explaining dashboard widgets
- Dashboard filtering by person, date, status
- Color-coded boards for visual clarity

### 6.4 Data Sources

- Monday.com boards (the primary and essentially only data source)
- Multi-board dashboards aggregate data across boards
- Custom columns: Numbers, Formula, Status, Date, Timeline, People
- **No native CRM object model** -- everything is boards and items
- Integrations via apps marketplace for external data
- Native CRM data for deal tracking, contacts, accounts (via Monday CRM product)

### 6.5 Filters and Date Ranges

- Dashboard-level filters by person, date range, status, group
- Widget-level filters
- Board-level custom views with multi-condition filters
- No complex cross-filter logic
- Limited compared to dedicated CRM platforms

### 6.6 Scheduling and Export

| Feature | Details |
|---|---|
| **Scheduled PDF Export** | Send dashboard as PDF on a recurring schedule |
| **Recipients** | Up to 50 per scheduled export; external users configurable by admin |
| **Frequency** | Customizable scheduling period |
| **Export Board Data** | Excel (XLSX) export per board |
| **Bulk Account Export** | ZIP file export of entire account data (admin only) |
| **Shareable Links** | Limited (no images in public/incognito view) |
| **Schedule Email Notifications** | Periodic dashboard email notifications |
| **Admin Controls** | Admins can disable scheduled PDF exports to external users |

### 6.7 Real-time vs. Cached Data

- **Real-time**: All dashboard widgets update immediately as board data changes
- No caching layer; data is always current
- This is a core strength of Monday.com's architecture

### 6.8 Custom Formulas / Calculated Fields

| Feature | Details |
|---|---|
| **Formula Column** | Board-level column with formulas (arithmetic, IF/THEN, date math, text functions) |
| **Numbers Column** | Aggregate in dashboards (SUM, AVG, etc.) |
| **AI Column** | AI-generated content/calculations based on item data |
| **No Report-Level Formulas** | Formulas live at the board level, not within dashboard widgets |
| **Limited Aggregation** | Dashboard Number widget supports basic aggregation only |

### 6.9 Sharing and Permissions

| Feature | Details |
|---|---|
| **Dashboard Types** | Main (visible to workspace members) or Private (invite only) |
| **Roles** | Owner (full control), Subscriber/Member (view-only or edit) |
| **Guest Access** | External guests can be invited as viewers |
| **Board Dependency** | Users must have access to the connected boards to see widget data |
| **Enterprise Roles** | Owner, Editor, Contributor, Assigned Contributor, Viewer (fine-grained) |
| **Admin Controls** | Admins can disable external sharing, control export permissions |

---

## 7. Feature Comparison Matrix

### 7.1 Report Types

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM | Monday.com |
|---|---|---|---|---|---|
| Tabular / List | Yes | Yes | Yes (Table) | Yes | Yes (Table widget) |
| Summary / Grouped | Yes | Yes | Limited | Yes | Via Chart widget |
| Matrix / Pivot | Yes (Pivot Table) | Yes | No | Yes | Yes (Pivot widget) |
| Joined / Multi-block | No | Yes (Joined) | No | Yes (up to 3 modules) | No |
| Funnel | Yes | Yes (chart) | No | Yes (chart) | Yes (chart) |
| KPI / Scorecard | Yes | Yes (Metric) | Yes (Scorecard) | Yes (KPI Widget) | Yes (Numbers) |
| Attribution | Yes (Enterprise) | Via CRM Analytics | No | No | No |
| Custom Report Builder | Yes | Yes | Limited | Yes | Widget-based |

### 7.2 Chart Types

| Chart Type | HubSpot | Salesforce | Pipedrive | Zoho CRM | Monday.com |
|---|---|---|---|---|---|
| Bar (Horizontal) | Yes | Yes | Yes | Yes | Yes |
| Column (Vertical) | Yes | Yes | Yes | Yes | Yes |
| Stacked Bar/Column | Yes | Yes | No | Yes | Yes |
| Line | Yes | Yes | Yes | Yes | Yes |
| Area | Yes | No (CRM Analytics yes) | No | Yes | No |
| Pie | Yes | Yes | Yes | Yes | Yes |
| Doughnut / Donut | Yes | Yes | No | Yes | No |
| Funnel | No (via funnel reports) | Yes | No | Yes | Yes |
| Scatter | No | Yes | No | Yes | No |
| Gauge | Yes | Yes | No | No (Dial in Analytics) | No |
| Bubble | No | No | No | Yes | Yes |
| Heat Map | No | No | No | Yes | No |
| Geo Map | No | Yes (CRM Analytics) | No | Yes | Yes (Map widget) |
| Combination | Yes | No (CRM Analytics yes) | No | Yes | No |
| Word Cloud | No | No | No | Yes | No |
| Radar / Web | No | No | No | Yes | No |
| **Total Chart Types** | ~10 | ~12 (20+ with CRM Analytics) | ~6 | ~25 (50+ with Analytics) | ~7 |

### 7.3 Dashboard Features

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM | Monday.com |
|---|---|---|---|---|---|
| Max Dashboards | 300 (add-on) | Unlimited (folder-based) | Unlimited | Unlimited | Unlimited |
| Max Reports/Widgets | 3,000 (add-on) | 20 components/dashboard | No hard limit | No hard limit | 30 widgets/dashboard |
| Drag-and-Drop | Yes | Yes | Yes | Yes | Yes |
| Dashboard Templates | Yes (Report Library) | Yes | Limited | Yes (100+) | Yes (11+ templates) |
| Dynamic / User-Based | Limited | Yes (Dynamic Dashboards) | No | Yes (Row-level filter) | Limited |
| Shareable Links | No (email only) | Limited | Yes (one-click) | Yes (Public/Private) | Limited |
| Embeddable | No | Via CRM Analytics | No | Yes (White-label) | Via Embedded widget |
| Mobile App | Yes | Yes | Yes | Yes (Dashboards app) | Yes |
| AI-Powered Insights | Limited (Breeze) | Yes (Einstein Copilot) | Yes (AI Assistant) | Yes (Zia AI) | Yes (AI Blocks) |

### 7.4 Data Sources

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM | Monday.com |
|---|---|---|---|---|---|
| CRM Objects | All standard + custom | All standard + custom | Deals, Activities, Contacts, Orgs | All modules + custom | Boards/Items (custom) |
| Cross-Object Reporting | Yes | Yes | No | Yes | Multi-board only |
| Marketing Data | Yes (emails, ads, pages) | Via Marketing Cloud | No | Yes (Campaigns) | No |
| Service Data | Yes (tickets, feedback) | Yes (Cases, Knowledge) | No | Yes (via Zoho Desk) | No |
| External Data Sources | No | Yes (Data Cloud, Tableau) | No | Yes (500+ connectors) | Via apps marketplace |
| Website Analytics | Yes (pages, sessions) | Via integration | No | Yes (via Analytics) | No |

### 7.5 Scheduling and Export

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM | Monday.com |
|---|---|---|---|---|---|
| Scheduled Email Reports | Yes (Daily/Weekly/Monthly) | Yes | No (third-party) | Yes (Daily/Weekly/Monthly/Yearly) | Yes (Periodic) |
| Export CSV | Yes | Yes | Yes | Yes | Yes |
| Export Excel | Yes | Yes | Yes | Yes | Yes |
| Export PDF | No (image only) | Via Print View | Yes | Yes | Yes (Scheduled PDF) |
| Export Image | Yes (PNG) | No | Yes (PNG) | Yes | No |
| API Access | Yes | Yes | Yes | Yes | Yes |
| Slack Integration | Yes | Yes | No | Yes (via Analytics) | Yes |
| External Recipients | One-time only (Pro+) | Via subscription | Via shareable link | Yes | Configurable by admin |

### 7.6 Formulas and Calculated Fields

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM | Monday.com |
|---|---|---|---|---|---|
| Report-Level Formulas | Yes (row-level) | Yes (row + summary) | No | Yes (SQL-like in Analytics) | No |
| Object-Level Formulas | Yes (Calculated Properties) | Yes (Formula Fields) | Limited (Custom Fields) | Yes (Formula Fields) | Yes (Formula Column) |
| Rollup / Aggregation | Yes | Yes | Basic | Yes | Basic |
| Cross-Object Formulas | No | Yes | No | Yes (via Analytics) | No |
| AI Formula Generation | Limited | Yes (Einstein) | No | Yes (Zia) | No |
| Custom SQL | No | No (SOQL via API) | No | Yes (Zoho Analytics) | No |

### 7.7 Sharing and Permissions

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM | Monday.com |
|---|---|---|---|---|---|
| Role-Based Access | Yes | Yes (advanced) | Yes | Yes (advanced) | Yes |
| Folder Organization | No (list-based) | Yes | No | Yes (auto-categorized) | No (workspace-based) |
| Row-Level Security | No | Yes (OWD/Sharing Rules) | Limited (Visibility Sets) | Yes | No (board-level) |
| Public Sharing | No | Limited | Yes (shareable links) | Yes (Public/Private) | Limited |
| Field-Level Security | No | Yes | No | Yes | Column-level permissions |
| Guest/External Access | One-time email | No (portal required) | Yes (link) | Yes (public sharing) | Yes (guest role) |

---

## 8. Key Takeaways for F-CORE

### 8.1 Priority Features (MVP -- Sprint 1-2)

These are table-stakes features that every CRM reporting module must have:

| Priority | Feature | Rationale |
|---|---|---|
| P0 | **Custom Report Builder** | Core feature across all competitors; drag-and-drop interface with data source selection |
| P0 | **5 Core Chart Types** | Bar, Line, Pie, Table, KPI/Scorecard -- covers 90% of use cases |
| P0 | **Dashboard with Widgets** | Drag-and-drop layout; at least 10 widgets per dashboard |
| P0 | **Standard CRM Data Sources** | Contacts, Companies, Deals, Activities -- must support cross-object joins |
| P0 | **Date Range Filters** | Standard presets (Today, This Week, This Month, etc.) + custom range |
| P0 | **CSV/Excel Export** | Universal export requirement |
| P0 | **Basic Permissions** | Owner/viewer model; dashboard visibility controls |

### 8.2 High-Value Features (Sprint 3-4)

These differentiate a "good" reporting module from a basic one:

| Priority | Feature | Rationale |
|---|---|---|
| P1 | **Funnel Reports** | HubSpot, Salesforce, and Zoho all have this; critical for pipeline analysis |
| P1 | **Pivot Tables** | Power users expect this; HubSpot, Salesforce, Zoho, and Monday all support it |
| P1 | **Gauge / Goal Charts** | Visual goal tracking; HubSpot and Salesforce offer this |
| P1 | **Scheduled Email Reports** | Daily/Weekly/Monthly; all major competitors except Pipedrive support this natively |
| P1 | **Formula Fields** | Row-level calculations in reports; HubSpot and Salesforce both support this |
| P1 | **Dashboard Templates** | Pre-built templates to accelerate adoption; Zoho leads with 100+ |
| P1 | **Compare By / Benchmarks** | Date comparison (this month vs last month); HubSpot and Salesforce excel here |

### 8.3 Advanced Features (Sprint 5+)

These are differentiators and enterprise requirements:

| Priority | Feature | Rationale |
|---|---|---|
| P2 | **Combination Charts** | Dual-axis charts (bar + line); HubSpot and Zoho support this |
| P2 | **Doughnut/Donut Charts** | Popular variant; easy to implement |
| P2 | **Area Charts** | Good for showing volume over time |
| P2 | **Scatter/Bubble Charts** | Advanced analysis; Salesforce and Zoho offer this |
| P2 | **Real-time Dashboards** | Monday.com and Salesforce (2025+) lead here |
| P2 | **PDF Export** | Zoho, Pipedrive, and Monday all support this |
| P2 | **Attribution Reports** | HubSpot Enterprise feature; complex but high-value |
| P2 | **Dynamic Dashboards** | Data changes based on logged-in user; Salesforce leads here |
| P2 | **Embeddable Dashboards** | Zoho leads with white-label portals |
| P2 | **Shareable Public Links** | Pipedrive and Zoho allow sharing with non-users |

### 8.4 AI-Powered Features (Future Roadmap)

| Priority | Feature | Inspiration |
|---|---|---|
| P3 | **Smart Chart Recommendations** | HubSpot's Smart Chart auto-suggests chart types based on data |
| P3 | **Natural Language Queries** | Salesforce Einstein, Zoho Zia -- "Show me deals closed this quarter by rep" |
| P3 | **AI Report Generation** | Pipedrive and Salesforce allow generating reports from natural language prompts |
| P3 | **AI Insights / Anomaly Detection** | Zoho Zia spots trends and explains metric changes |
| P3 | **Predictive Analytics** | Salesforce Einstein Discovery for forecasting |

### 8.5 Recommended Architecture

Based on the competitive analysis, the F-CORE reporting module should be built with these architectural principles:

1. **Data Layer**: Build a flexible query engine that supports cross-object joins (like HubSpot's Custom Report Builder). Use a report type system similar to Salesforce (define which objects and fields are available).

2. **Visualization Layer**: Start with a chart library like Chart.js, Recharts, or Nivo. These cover bar, line, pie, doughnut, area, scatter, funnel, gauge, and table views. Zoho's 50+ chart types are aspirational but unnecessary for MVP.

3. **Dashboard Engine**: Implement a grid-based dashboard layout (similar to react-grid-layout). Each cell contains a widget backed by a saved report. Target 15-20 widgets per dashboard.

4. **Formula Engine**: Implement row-level formula evaluation (arithmetic, conditionals, date functions). This aligns with HubSpot's approach and is simpler than Salesforce's multi-level formula system.

5. **Permissions Model**: Follow HubSpot's approach -- dashboard visibility (Everyone/Specific Users/Private) + report-level Create/Edit permissions. Add Salesforce-style dynamic dashboards as a P2 feature.

6. **Export Pipeline**: CSV and Excel exports are trivial with libraries like `xlsx`/`papaparse`. PDF export via `puppeteer` or `jspdf`. Scheduled emails via cron jobs with Resend/SendGrid.

### 8.6 Competitive Positioning

| Competitor | Strength | Weakness | F-CORE Opportunity |
|---|---|---|---|
| **HubSpot** | Excellent report builder UX; Smart Chart | Expensive (Pro+ required); limited public sharing | Match the UX at a lower price point |
| **Salesforce** | Most powerful and flexible; Einstein AI | Very complex; steep learning curve | Simplify the power -- offer 80% of capability with 20% of complexity |
| **Pipedrive** | Simple; real-time; shareable links | Very limited reporting; sales-only | Offer broader data sources with Pipedrive's simplicity |
| **Zoho CRM** | Most chart types (50+); cheapest; 500+ connectors | UI feels dated; fragmented between CRM and Analytics | Modern UI with Zoho's breadth of features |
| **Monday.com** | Real-time; beautiful widgets; no-code | Not a true CRM; limited analytics depth | CRM-native reporting with Monday's visual appeal |

---

## Appendix: Source References

- HubSpot Knowledge Base: Custom Report Builder, Chart Types, Sharing/Export, Formula Fields
- Salesforce Help: Reports and Dashboards, CRM Analytics, Trailhead Modules
- Pipedrive Support: Insights Reports, Chart Types, Dashboard Guide
- Zoho CRM Help: Analytics, Reports, Chart Types, Sharing, Scheduling
- Monday.com Support: Dashboards, Chart Widget, Permissions, Export
- Industry analyses from SmartBug Media, Databox, Supermetrics, CloudIntellect, Dear Lucy, Fruition Services
- Product update blogs from HubSpot (Jan 2025), Salesforce (Winter '25), Monday.com (Sep 2025), Zoho Analytics (Q3 2025)
