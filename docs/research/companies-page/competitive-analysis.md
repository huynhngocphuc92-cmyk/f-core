# F-CORE Companies Feature: Competitive Analysis

> **Research Date:** 2026-02-07
> **Scope:** Companies/Accounts/Organizations feature deep-dive
> **Competitors Analyzed:** HubSpot, Salesforce, Pipedrive
> **Purpose:** Inform F-CORE Companies page implementation

---

## Table of Contents

1. [HubSpot Companies Feature (Deep Dive)](#1-hubspot-companies-feature)
2. [Salesforce Account Management](#2-salesforce-account-management)
3. [Pipedrive Organizations](#3-pipedrive-organizations)
4. [Feature Comparison Matrix](#4-feature-comparison-matrix)
5. [F-CORE Companies Recommendations](#5-f-core-companies-recommendations)

---

## 1. HubSpot Companies Feature

### 1.1 Company List View (Index Page)

HubSpot's company index page is accessed via **CRM > Companies** and follows the same data table pattern used across all CRM objects.

#### Layout Structure

```
+------------------------------------------------------------------+
| Companies                          [Create company] [Import] [v]  |
+------------------------------------------------------------------+
| [View: List | Board | Report]                                     |
+------------------------------------------------------------------+
| [View Tabs: All companies | My companies | Custom Views...]       |
+------------------------------------------------------------------+
| [Quick Filters: Owner | Create date | Lead status | + More]      |
+------------------------------------------------------------------+
| [ ] | Name ^ | Domain | Phone | City | Owner | Last activity     |
|-----|--------|--------|-------|------|-------|---------------------|
| [ ] | Acme   | acm... | 555.. | NYC  | Rep A | 2 days ago         |
| [ ] | Beta   | bet... | 555.. | LA   | Rep B | Today              |
+------------------------------------------------------------------+
| Showing 1-25 of 1,234     [< Prev] [1] [2] [3] [Next >]          |
+------------------------------------------------------------------+
```

#### Default Columns

| Column | Description |
|--------|-------------|
| Name | Company name (link to detail) |
| Company domain name | Primary domain |
| Phone number | Main phone |
| City | Location |
| Company owner | Assigned user |
| Last activity date | Most recent interaction |
| Create date | When record was created |
| Lifecycle stage | Current stage in funnel |
| Industry | Business vertical |

#### View Types (as of 2025/2026)

1. **List View** (default) -- Classic table layout with columns, sorting, filtering, bulk actions, inline editing
2. **Board View** (new) -- Kanban board grouped by Lifecycle Stage (Subscriber > Lead > MQL > SQL > Opportunity > Customer > Evangelist). Drag-and-drop cards between stages.
3. **Report View** (new) -- Embedded summary charts/visualizations directly on the index page. Quick view of trends (e.g., Companies by Industry, Companies by Lifecycle Stage) without building full reports.

#### Saved Views & Filters

- **Default views:** All companies, My companies, Unassigned companies
- **Sales workspace views:** All companies, All target accounts, No decision maker, No activities, No open deals
- **Custom views:** User-created with custom filter criteria
- **View sharing:** Private (just me), Team, Everyone
- **Quick filters:** Horizontal bar with common property filters (owner, create date, lifecycle stage, industry)
- **Advanced filters:** Slide-out panel with access to ALL company properties. Supports operators: is, is not, contains, doesn't contain, is known, is unknown, etc.
- **Column customization:** Add, remove, reorder columns. Click "Edit columns" in top-right.
- **Sorting:** Click any column header to toggle ascending/descending

#### Bulk Actions

When checkboxes are selected, a bulk action bar appears:
- Edit properties (bulk update)
- Assign owner
- Delete (soft delete)
- Create tasks
- Enroll in workflow
- Export
- Add to static list

#### Pagination

- 25, 50, or 100 records per page
- Page number navigation with prev/next

---

### 1.2 Company Create Form

Company creation is done via a **right-side slide-out panel** (not a modal, not a full page).

#### Create Form Fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| Company name | Yes* | Text | *At least name OR domain required |
| Company domain name | Yes* | Text | *Primary unique identifier for dedup |
| Company owner | No | User picker | Defaults to creator |
| Lifecycle stage | No | Select | Default based on settings |
| Phone number | No | Phone | Standard formatting |
| Industry | No | Select | ~150 pre-defined options |
| City | No | Text | Location |
| State/Region | No | Text | Location |
| Country/Region | No | Select | Location |
| Description | No | Multi-line text | About the company |
| Number of employees | No | Number | Company size |
| Annual revenue | No | Currency | Revenue |

#### Key Behaviors

- **Domain-based dedup:** HubSpot warns if a company with the same domain already exists
- **Enrichment trigger:** After creation, if domain is provided, HubSpot Insights/Breeze enrichment can auto-fill ~20+ properties
- **Association on create:** Can associate with contacts, deals during creation
- **Custom properties:** Any custom properties marked as "required" appear in the create form

---

### 1.3 Company Detail Page (3-Column Layout)

```
+-------------------+---------------------------+-------------------+
| LEFT SIDEBAR      | MIDDLE COLUMN             | RIGHT SIDEBAR     |
| (Properties)      | (Activities/Timeline)     | (Associations)    |
|                   |                           |                   |
| [Company Logo]    | [Tab: Overview]           | CONTACTS          |
| Company Name      | [Tab: Activities]         | [Contact Card]    |
| Domain link       | [Tab: Sales]              | [Contact Card]    |
|                   | [Tab: Custom...]          | [+Add contact]    |
| [Quick Actions]   |                           |                   |
| - Note            | OVERVIEW TAB:             | DEALS             |
| - Email           | [Company Summary Card]    | [Deal Card]       |
| - Call            | - Activities overview     | [+Add deal]       |
| - Task            | - Stakeholders            |                   |
| - Meeting         | - Lifecycle stage         | TICKETS           |
|                   | - Associated deals info   | [Ticket Card]     |
| ABOUT THIS CO.    | - Product/ticket info     | [+Add ticket]     |
| Domain: acme.com  |                           |                   |
| Phone: 555...     | [Data Highlights Card]    | COMPANIES         |
| Industry: Tech    | [Recent Communications]   | (Parent/Child)    |
| Owner: Rep A      |                           | [+Add company]    |
| Lifecycle: Lead   | ACTIVITIES TAB:           |                   |
| Annual Rev: $10M  | [Activity Composer]       | ATTACHMENTS       |
| Employees: 500    | [Note|Email|Call|Task|    | [File list]       |
| City: San Fran    |  Meeting|SMS|WhatsApp]    |                   |
|                   |                           |                   |
| [+ View all       | [Filter: All|Notes|       |                   |
|  properties]      |  Emails|Calls|Tasks|      |                   |
|                   |  Meetings|Logged]         |                   |
| CONDITIONAL CARDS |                           |                   |
| [ICP Tier card]   | [Activity Timeline]       |                   |
| [Service Props]   | - Shows all interactions  |                   |
+-------------------+---------------------------+-------------------+
```

#### Left Sidebar Details

- **Company logo:** Auto-fetched from domain (via enrichment/clearbit)
- **Company name + domain link** prominently displayed
- **Quick actions bar:** Note, Email, Call, Task, Meeting icons
- **"About this company" card:** Key properties displayed, inline editable
- **Conditional cards:** Show/hide based on property values (e.g., show ICP tier card only when Target Account = True)
- **"View all properties" link:** Opens full property sheet

#### Middle Column

- **Tabs:** Overview (default), Activities, Sales, Custom tabs
- **Company Summary Card** (new): Aggregated view showing activities count, stakeholders, lifecycle stage, deal/product/ticket summaries
- **Activity Composer:** Create notes, emails, calls, tasks, meetings directly
- **Activity Timeline:** Chronological feed of ALL interactions, filterable by type
- **Data from associated records:** Activities from contacts, deals, tickets associated to the company also appear
- **Cards are customizable** by admins via Record Page Editor

#### Right Sidebar

- **Associated contacts:** Preview cards with name, email, title. Shows association labels (e.g., "Decision Maker", "Billing Contact")
- **Associated deals:** Deal name, stage, amount, close date
- **Associated tickets:** Ticket name, status, priority
- **Associated companies:** Parent/child company relationships
- **Attachments:** Files linked to the company record
- **Memberships, Playbooks, Attribution** (subscription-dependent)
- Cards are collapsible and reorderable

---

### 1.4 Company-Contact Associations

#### Auto-Linking by Domain

HubSpot has an automatic association feature (enabled by default):

- **How it works:** When a contact is added with an email address (e.g., `john@acme.com`), HubSpot matches the email domain to the `Company domain name` property
- **Auto-create:** If no company record exists for that domain, HubSpot automatically creates one and populates it with enrichment data
- **Freemail handling:** If the contact has a freemail address (gmail.com, yahoo.com, etc.), HubSpot checks the contact's `Website URL` property instead
- **Subdomain handling:** Each unique subdomain creates a separate company record (e.g., `@example.com` and `@info.example.com` = two companies)
- **Domain exclusion:** Admins can exclude up to 1,000 domains from auto-association
- **Oldest record wins:** If multiple companies share a domain, the contact is associated with the oldest company record

#### Manual Linking

- From company detail page: Click "+Add contact" in the right sidebar Contacts card
- From contact detail page: Click "+Add company" in the right sidebar Companies card
- Search by name or email to find and associate
- Bulk association via import (CSV with company domain + contact email)

#### Association Labels

- **Built-in labels:** Primary (free tier), custom labels (Pro+)
- **Company-to-Contact examples:** Decision Maker, Billing Contact, End User, Champion
- **Company-to-Company examples:** Parent Company, Child Company, Headquarters, Regional Office, Partner
- **Contact-to-Contact examples:** Partner, Parent, Child, Manager, Colleague
- **Label limits:** Configurable in Settings > Objects > Companies > Associations
- **Label-based filtering:** Can filter views by association label (e.g., show only contacts who are "Decision Makers")

---

### 1.5 Company Enrichment

HubSpot acquired Clearbit and integrated it as native data enrichment (now powered by Breeze AI).

#### How It Works

1. **Domain-based lookup:** Company domain is matched against HubSpot's database of 60M+ company domains
2. **Auto-enrichment:** Can be configured to run automatically on new records or manually triggered
3. **Bulk enrichment:** Available via workflows (Pro+) or from index page bulk actions
4. **Monthly refresh:** AI continuously updates records with fresh data each month

#### Properties Enriched (Company)

| Property | Type | Example |
|----------|------|---------|
| Industry | Select | Technology |
| Industry group | Select | Commercial and Professional Services |
| Number of employees | Number | 500 |
| Annual revenue | Currency | $10,000,000 |
| City | Text | San Francisco |
| State/Region | Text | California |
| Country/Region | Select | United States |
| Company description | Text | "A leading..." |
| Founded year | Number | 2010 |
| Total money raised | Currency | $50,000,000 |
| Is public | Boolean | Yes |
| Web technologies | Multi-text | WordPress, React, AWS |
| Company keywords | Multi-text | SaaS, CRM, Marketing |
| LinkedIn handle | Text | company/acme |
| Logo URL | URL | https://logo.clearbit.com/acme.com |
| Time zone | Text | America/Los_Angeles |

#### Enrichment Configuration

- **Overwrite rules:** Fill empty values only, or overwrite existing values
- **Custom mapping:** Map enrichment fields to custom properties
- **Enrichment history:** Logged in the activity timeline with details of which properties were updated
- **Conversational enrichment (new 2025):** AI extracts data from emails, calls, and support tickets to update records automatically

---

### 1.6 Company Hierarchy (Parent/Child)

#### Structure

- **Single-level hierarchy:** Parent company > Child companies
- **A child can only have ONE parent**
- **A parent can have up to 10,000 children**
- **Multi-level nesting:** A child company can also be a parent to other companies, creating chains (e.g., Global HQ > Regional Office > Local Branch)

#### Setup Methods

1. **Manual:** From company detail page > Companies card > "+Add company" > Select company > Add label "Parent Company" or "Child Company"
2. **Import:** CSV with Associated company ID/domain column, mapped as association with "Parent Company" label
3. **Edit existing:** Hover over associated company > More > Edit association labels

#### UI Display

- Parent company record shows "Related Companies" card with all child companies listed
- Child company record shows link to parent company and sibling companies
- Company index page can display parent/child as columns in list view

#### Limitations

- Parent-child does NOT affect contact auto-association (association goes to oldest company by domain, not by hierarchy)
- Parent-child does NOT sync to Salesforce (if using HubSpot-Salesforce integration)
- No automatic rollup of child company metrics to parent (must be done via custom reporting or workflows)

---

### 1.7 Company Properties (Standard/Default)

#### Complete Default Company Properties

| Category | Properties |
|----------|------------|
| **Identity** | Company name, Company domain name, Additional domains |
| **Contact Info** | Phone number, Fax number, Street address, Street address 2, City, State/Region, State/Region code, Zip, Country/Region, Country/Region code, Time zone |
| **Firmographic** | Industry, Industry group, Type (Prospect/Partner/Reseller/Vendor/Other), Annual revenue, Number of employees, Is public, Founded year, SIC code |
| **Enrichment** | About us (description), Company keywords, Web technologies, LinkedIn company page, Logo URL, Has been enriched |
| **Financial** | Total money raised, Total revenue (auto-calculated from closed deals) |
| **Lifecycle** | Lifecycle stage, Lead status, Date entered [stage] (auto-generated per stage) |
| **Sales** | Company owner, Close date (auto-set when moved to Customer) |
| **ABM** | Target account, Ideal Customer Profile Tier (Tier 1/2/3), Buying role |
| **Analytics** | Number of pageviews, Number of sessions, First page seen, Last page seen, Original source, Original source drill-down 1/2, First touch converting campaign, Last touch converting campaign |
| **Activity** | Last activity date, Last contacted, Last booked meeting date, Last logged call date, Last logged email date, Number of times contacted, Number of sales activities |
| **Associations** | Number of associated contacts, Number of associated deals, Number of open deals, Number of form submissions, Number of decision makers |
| **System** | Create date, Last modified date, Record ID, Created by user ID, Updated by user ID, Merged object IDs |

#### Custom Properties

- **Free tier:** Up to 10 custom properties per object
- **Starter:** Up to 1,000 custom properties
- **Pro/Enterprise:** Virtually unlimited
- **Field types available:** Single-line text, Multi-line text, Number, Phone, Date, Date+time, Select (dropdown), Multi-select, Radio, Checkbox, File, URL, HubSpot user, Rich text, Calculated, Score, and more
- **Property groups:** Organize properties into collapsible groups (e.g., "Financial Info", "Social Media", "Custom Data")
- **Calculated properties:** Formula-based properties (Pro+)

---

### 1.8 Board View for Companies

The board view for companies (new as of late 2025) uses **Lifecycle Stage** as the pipeline/column grouper.

#### Board Structure

```
+-----------+-----------+-----------+-----------+-----------+
| SUBSCRIBER| LEAD      | MQL       | SQL       | CUSTOMER  |
| (12)      | (8)       | (5)       | (3)       | (25)      |
+-----------+-----------+-----------+-----------+-----------+
| [Acme Co] | [Beta Inc]| [Gamma]   | [Delta]   | [Epsilon] |
| Tech      | Finance   | Health    | SaaS      | E-comm    |
| Rep A     | Rep B     | Rep A     | Rep C     | Rep B     |
|           |           |           |           |           |
| [Zeta Co] | [Eta Ltd] | [Theta]   |           | [Iota]    |
| Retail    | Media     | Edu       |           | Mfg       |
+-----------+-----------+-----------+-----------+-----------+
```

#### Board Features

- **Drag-and-drop** cards between lifecycle stages
- **Customizable card properties:** Choose which fields appear on each card (up to 4 default + 2 user-customizable)
- **Card sections:** Quick actions, key properties, approval sections
- **Filtering:** Same quick filters and advanced filters as list view
- **Custom lifecycle stages:** Admins can add custom stages beyond the defaults

---

## 2. Salesforce Account Management

### 2.1 Account Object Overview

Salesforce uses the **Account** object (equivalent to HubSpot's Company). Accounts are the cornerstone of Salesforce's B2B CRM model.

#### Key Characteristics

| Feature | Details |
|---------|---------|
| Object name | Account |
| Record types | Business Account, Person Account (B2C) |
| Parent-child | Native `ParentId` lookup field |
| Hierarchy depth | Unlimited levels (recommended 5-6 max) |
| Customization | Fully customizable via Lightning App Builder, Apex, Visualforce |
| Sharing model | Role-based, Territory-based, Manual sharing rules |

### 2.2 Account Standard Fields

| Category | Fields |
|----------|--------|
| **Identity** | Account Name, Account Number, Site, Account Source |
| **Contact Info** | Phone, Fax, Website |
| **Billing Address** | Billing Street, City, State, Zip, Country |
| **Shipping Address** | Shipping Street, City, State, Zip, Country |
| **Firmographic** | Industry (picklist), Type (Prospect/Customer/Channel Partner/etc.), Ownership (Public/Private/Subsidiary/Other), Annual Revenue, Number of Employees, SIC Code, Ticker Symbol, NAICS Code, NAICS Description, Year Started, D-U-N-S Number |
| **Classification** | Rating (Hot/Warm/Cold), Account Source, Active (custom) |
| **Ownership** | Account Owner, Account Team |
| **Hierarchy** | Parent Account (lookup), View Hierarchy button |
| **Description** | Description (text area) |
| **System** | Created By, Created Date, Last Modified By, Last Modified Date, Record ID |

### 2.3 Account Hierarchy (Key Differentiator)

Salesforce's account hierarchy is significantly more powerful than HubSpot's:

| Capability | Salesforce | HubSpot |
|-----------|------------|---------|
| Hierarchy levels | Unlimited (recommend 5-6) | Single-level (parent-child chain possible) |
| View Hierarchy button | Native, one-click tree view | No equivalent (flat list of related companies) |
| Rollup summaries | Native cross-object rollups | Not native (requires workflows/custom code) |
| Territory planning | Native territory management | Not available |
| Hierarchy fields | Custom formula fields per level | Not available |
| Sharing inheritance | Parent-child sharing rules | Not available |

#### How Salesforce Hierarchy Works

1. **ParentId field** on each Account links to another Account
2. **"View Hierarchy" button** on the record page displays a tree visualization
3. **Unlimited nesting:** Global Corp > Region > Country > Division > Office
4. **Custom hierarchy definitions** (via packages like "Complete Hierarchies") allow multiple hierarchy views for the same company set
5. **Rollup fields** can aggregate child account data to the parent (revenue, employee count, deal count)

### 2.4 Key Salesforce Differentiators for Accounts

| Feature | Description | F-CORE Relevance |
|---------|-------------|-----------------|
| **Account Teams** | Multiple users assigned to an account with specific roles (Executive Sponsor, Technical Lead, etc.) | High - Useful for complex B2B sales |
| **Territory Management** | Group accounts by geography, product line, or custom criteria. Assign reps to territories. | Medium - Enterprise feature |
| **Person Accounts** | Merge Account + Contact into one record for B2C use cases | Low - B2C-specific |
| **Account Plans** | Structured planning documents attached to accounts | Low - Enterprise |
| **Account Insights** | Einstein AI-powered insights on account health, engagement | Medium - Good for AI features |
| **Multi-currency** | Track revenue in multiple currencies per account | Medium - International use |
| **Record Types** | Different page layouts, picklist values, and business processes per account type | High - Flexible data modeling |
| **Sharing Rules** | Granular access control based on hierarchy, criteria, manual grants | Medium - Security feature |

---

## 3. Pipedrive Organizations

### 3.1 Organization Overview

Pipedrive uses the term **Organization** (equivalent to HubSpot's Company / Salesforce's Account). Organizations are one of three core record types: People, Organizations, and Deals.

### 3.2 Organization Default Fields

| Field | Type | Notes |
|-------|------|-------|
| Organization name | Text | Required, primary identifier |
| Owner | User | Assigned Pipedrive user |
| Label | Tag/Color | Visual categorization (colored labels) |
| Address | Address | Full address with Google Maps integration |
| Visibility | Select | Private / Shared within team / Visible to all |

#### Additional Default Tracking Fields (Auto-populated)

| Field | Type | Auto-set |
|-------|------|----------|
| Open deals | Number | Count of open deals linked to the org |
| Closed deals | Number | Count of closed deals |
| Won deals | Number | Count of won deals |
| Lost deals | Number | Count of lost deals |
| Related open deals | Number | Related deals |
| Related closed deals | Number | Related deals |
| Email messages | Number | Count of linked emails |
| Activities | Number | Count of activities |
| Done activities | Number | Completed activities |
| Undone activities | Number | Pending activities |
| Files | Number | Attached files count |
| Notes | Number | Notes count |
| Followers | Number | Users following this org |
| Next activity | Date | Upcoming activity date |
| Last activity | Date | Most recent activity date |
| Active flag | Boolean | Whether org is active |

### 3.3 Organization-Contact Linking

Pipedrive uses a simpler linking model than HubSpot:

- **Manual linking:** Add a person to an organization, or link an organization to a person
- **Domain-based:** Not auto-linked by email domain by default (unlike HubSpot)
- **One-to-many:** A person can belong to one organization; an organization can have many people
- **Linking fields:** Organization name, domain, URL used for matching (via third-party tools like Insycle)
- **No association labels:** Unlike HubSpot, no built-in role labels (Decision Maker, etc.)

### 3.4 Smart Contact Data & Enrichment

Pipedrive offers data enrichment in two tiers:

| Feature | Tier | What It Does |
|---------|------|-------------|
| **Smart Contact Data** | All plans | Pulls publicly available info (Google, LinkedIn) from an email address. Enriches basic contact/org data with one click |
| **Data Enrichment (Firmographic)** | Premium+ | Auto-populates organization fields: Address, Industry, Employee count, Annual revenue, Website, LinkedIn profile |
| **Data Enrichment (Email)** | Ultimate | Enriches contact email addresses |
| **Data Enrichment (Phone)** | Ultimate | Enriches contact phone numbers |

#### Organization Enrichment Fields

- Address (city, country)
- Industry
- Employee count
- Annual revenue
- Website
- LinkedIn profile

#### Key Enrichment Behaviors

- Only empty fields are enriched (existing data never overwritten)
- User sees a summary and must confirm before applying
- Works inline from the deal or contact detail view
- Requires: correct org name + at least one of: linked person with work email, website URL, or LinkedIn profile

### 3.5 Key Pipedrive Differentiators for Organizations

| Feature | Description | F-CORE Relevance |
|---------|-------------|-----------------|
| **Colored Labels** | Simple visual tags on organizations (custom colors + names). Very quick to scan in list view. | High - Simple and effective |
| **Google Maps integration** | Address field has native map view, useful for field sales | Medium - Nice-to-have |
| **Contacts Map** | Visualize all organizations on a map based on address | Medium - Visual feature |
| **Custom fields (extensive)** | 30-500 custom fields depending on plan. Field types include: Organization link, Person link, Address (with Maps), Time, Time Range, Date Range | High - Flexible data model |
| **Activity-first design** | Every org view emphasizes next activity date and overdue activities prominently | High - Drives sales action |
| **Deal rotting alerts** | Visual indicator when deals linked to an org are stalling | Medium - Unique innovation |
| **No hierarchy** | No native parent-child organization feature | N/A |
| **Formula fields** | Calculated custom fields for scoring and metrics | Medium |
| **Pipeline simplicity** | Organizations don't have their own pipeline/board view (only Deals do) | Note for design |
| **Visibility controls** | Per-record visibility: Private, Team, or Everyone | High - Simple permission model |

---

## 4. Feature Comparison Matrix

| Feature | HubSpot | Salesforce | Pipedrive | F-CORE Target |
|---------|---------|------------|-----------|---------------|
| **List view** | Full table with quick filters, advanced filters, saved views, inline editing | Fully customizable list views, report views | Sortable/filterable list with labels | Match HubSpot |
| **Board/Kanban view** | By Lifecycle Stage (new 2025) | Not native for Accounts (available via AppExchange) | Not available for Organizations | Match HubSpot |
| **Report view on index** | Embedded charts (new 2025) | Native report embedding | Dashboard-only | Defer (P2) |
| **Saved views** | Free: limited, Pro: unlimited | Unlimited | Available all plans | Match HubSpot |
| **Create form** | Slide-out panel | Full page or modal (configurable) | Slide-out panel | Slide-out panel |
| **Detail page** | 3-column layout, tabs, timeline | Fully customizable Lightning pages | 2-section (detail + timeline) | 3-column (HubSpot style) |
| **Domain-based dedup** | Native | Not built-in (requires D&B or custom) | Not built-in | Implement |
| **Auto-create from email** | Yes (domain matching) | No | No | Implement |
| **Contact auto-linking** | By email domain (auto) | Manual or via triggers | Manual | Implement |
| **Association labels** | Free: Primary only, Pro: custom | Via junction objects or custom fields | Not available | Implement (basic) |
| **Parent/Child hierarchy** | Single-level + chaining | Unlimited levels | Not available | Single-level (match HubSpot) |
| **Data enrichment** | Native (Clearbit/Breeze), 60M+ domains | Via AppExchange (ZoomInfo, D&B) | Smart Contact Data + Firmographic (Premium+) | Defer (P2) |
| **Lifecycle stages** | Default + custom stages | Custom picklists | Not available for orgs | Implement defaults |
| **Custom properties** | 10 (free) to unlimited | Unlimited | 30-500 by plan | Match HubSpot free tier+ |
| **Activity timeline** | Full timeline with filters | Full timeline | Activity-first with next/overdue emphasis | Match HubSpot |
| **Company summary card** | Aggregated overview (new 2025) | Customizable compact layouts | Not available | Implement |
| **Record preview** | Hover sidebar preview | Hover preview | Quick view | Implement |
| **Bulk actions** | Edit, delete, assign, export, workflow | Edit, delete, assign, export, mass actions | Edit, delete, merge, export | Match HubSpot core set |
| **Import/Export** | CSV import with mapping, dedup by domain | CSV, API, data loader | CSV import | CSV import |
| **Logo auto-fetch** | Yes (from domain via enrichment) | Not native | Not native | Implement (P1) |

---

## 5. F-CORE Companies Recommendations

### 5.1 Must-Have Features (P0 -- Sprint Implementation)

These features are essential for the Companies page to be functional and competitive with HubSpot's free tier.

| # | Feature | Description | Inspired By |
|---|---------|-------------|-------------|
| 1 | **Company List View (Table)** | Full data table with sortable columns, pagination (25/50/100), column customization | HubSpot |
| 2 | **Default Columns** | Name, Domain, Phone, City, Owner, Industry, Lifecycle Stage, Last Activity, Create Date | HubSpot |
| 3 | **Quick Filters** | Horizontal filter bar with: Owner, Lifecycle Stage, Industry, Create Date | HubSpot |
| 4 | **Advanced Filters** | Slide-out panel with ALL properties as filterable criteria with operators (is, is not, contains, is known, is unknown) | HubSpot |
| 5 | **Saved Views** | Create, name, save, and switch between custom filtered views. Default views: All companies, My companies | HubSpot |
| 6 | **Company Create (Slide-out)** | Right-side slide-out panel with fields: Name (required), Domain, Owner, Lifecycle Stage, Phone, Industry, City, Description | HubSpot |
| 7 | **Domain-based Deduplication** | Warn user if company with same domain already exists during create | HubSpot |
| 8 | **Company Detail Page** | 3-column layout: Left (properties), Middle (timeline/tabs), Right (associations) | HubSpot |
| 9 | **About This Company Card** | Left sidebar card showing key properties, inline editable | HubSpot |
| 10 | **Activity Timeline** | Middle column showing all notes, calls, emails, tasks, meetings. Filterable by type | HubSpot |
| 11 | **Activity Composer** | Toolbar above timeline: create Note, Email, Call, Task, Meeting | HubSpot |
| 12 | **Contact Associations** | Right sidebar: list associated contacts with name, email, title. Add/remove contacts | HubSpot |
| 13 | **Deal Associations** | Right sidebar: list associated deals with name, stage, amount. Add/remove deals | HubSpot |
| 14 | **Standard Properties** | Implement core set: Name, Domain, Phone, Address (Street, City, State, Zip, Country), Industry, Type, Owner, Lifecycle Stage, Annual Revenue, Number of Employees, Description | HubSpot + Salesforce |
| 15 | **Bulk Actions** | Checkbox selection > Edit, Delete (soft), Assign owner, Export | HubSpot |
| 16 | **Search** | Object-specific search bar (search by name, domain, phone) | HubSpot |
| 17 | **Pagination** | 25/50/100 per page, page numbers, prev/next | HubSpot |
| 18 | **Sorting** | Click column headers for asc/desc sorting | HubSpot |
| 19 | **Empty State** | Illustration + "No companies yet" message + "Create company" CTA | HubSpot |
| 20 | **Lifecycle Stage Property** | Default stages: Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist, Other | HubSpot |

### 5.2 Nice-to-Have Features (P1 -- Post-MVP)

These features significantly enhance the UX but are not blocking for initial launch.

| # | Feature | Description | Inspired By |
|---|---------|-------------|-------------|
| 1 | **Board View (Kanban)** | Kanban board grouped by Lifecycle Stage. Drag-and-drop cards between stages. | HubSpot (2025 feature) |
| 2 | **Contact Auto-Linking** | Automatically associate contacts with companies based on email domain matching | HubSpot |
| 3 | **Association Labels** | Label relationships: "Decision Maker", "Billing Contact" for contacts; "Parent Company", "Child Company" for companies | HubSpot |
| 4 | **Parent/Child Hierarchy** | Link companies as parent-child. Child has one parent, parent has many children. Display in "Related Companies" card. | HubSpot + Salesforce |
| 5 | **Company Logo Auto-fetch** | Fetch company logo from domain using a service like Clearbit Logo API or Google Favicon | HubSpot |
| 6 | **Inline Editing** | Edit property values directly in the list view table without opening the record | HubSpot |
| 7 | **Custom Properties** | Allow users to create custom fields on companies (text, number, select, date, etc.) | All three |
| 8 | **Record Preview Sidebar** | Hover or click to show a preview sidebar without navigating to the full detail page | HubSpot |
| 9 | **Company Summary Card** | Middle column card aggregating: activity count, contact count, deal count/value, lifecycle timeline | HubSpot (2025 feature) |
| 10 | **View Sharing** | Set saved views as Private, Team-visible, or Everyone | HubSpot |
| 11 | **Import from CSV** | Upload CSV with company data, map columns to properties, handle domain-based dedup | All three |
| 12 | **Export to CSV** | Export filtered/selected companies to CSV | All three |
| 13 | **Colored Labels/Tags** | Visual tags on companies for quick categorization (similar to Pipedrive's colored labels) | Pipedrive |
| 14 | **Ticket Associations** | Right sidebar: list associated tickets | HubSpot |
| 15 | **Attachments Card** | Right sidebar: files attached to the company record | HubSpot |

### 5.3 Future Features (P2 -- Growth Phase)

| # | Feature | Description | Inspired By |
|---|---------|-------------|-------------|
| 1 | **Data Enrichment** | Domain-based auto-fill of company properties (industry, size, revenue, description, logo) | HubSpot (Clearbit) |
| 2 | **Report View** | Embedded summary charts on the index page (Companies by Industry, by Stage, etc.) | HubSpot (2025 feature) |
| 3 | **Auto-Create Companies** | Automatically create company records when contacts with new domains are added | HubSpot |
| 4 | **Workflow Automation** | Trigger workflows based on company property changes (e.g., lifecycle stage change) | HubSpot |
| 5 | **Freemail Detection** | Identify and handle freemail domains (gmail, yahoo, etc.) differently during auto-association | HubSpot |
| 6 | **Conversational Enrichment** | AI extracts company data from emails, calls, and tickets to update records | HubSpot (2025 Breeze feature) |
| 7 | **Account Teams** | Assign multiple users to a company with specific roles (like Salesforce Account Teams) | Salesforce |
| 8 | **Custom Lifecycle Stages** | Allow admins to create custom lifecycle stages beyond defaults | HubSpot |
| 9 | **Activity Rollup from Children** | Aggregate activity counts and deal values from child companies to parent | Salesforce |
| 10 | **Maps View** | Visualize companies on a map based on address data | Pipedrive |
| 11 | **Target Accounts / ABM** | Mark companies as target accounts, ICP tier scoring | HubSpot |
| 12 | **Multi-level Hierarchy** | Support unlimited hierarchy depth with tree visualization | Salesforce |
| 13 | **Conditional Cards** | Show/hide property cards on detail page based on record state | HubSpot |
| 14 | **Calculated Properties** | Formula-based properties (e.g., Total deal value, Days since last contact) | HubSpot + Pipedrive |
| 15 | **Deal Rotting Alerts** | Visual indicator when deals linked to a company are stalling | Pipedrive |

### 5.4 Implementation Notes for F-CORE

#### Database Schema Considerations

```
companies:
  - id (UUID, PK)
  - tenant_id (UUID, FK -> tenants, REQUIRED for multi-tenancy)
  - name (VARCHAR, required)
  - domain (VARCHAR, unique per tenant, primary dedup key)
  - phone (VARCHAR)
  - street_address (VARCHAR)
  - street_address_2 (VARCHAR)
  - city (VARCHAR)
  - state (VARCHAR)
  - zip (VARCHAR)
  - country (VARCHAR)
  - industry (VARCHAR, enum/reference table)
  - type (ENUM: prospect, partner, reseller, vendor, customer, other)
  - lifecycle_stage (ENUM: subscriber, lead, mql, sql, opportunity, customer, evangelist, other)
  - owner_id (UUID, FK -> users)
  - parent_company_id (UUID, FK -> companies, nullable, for hierarchy)
  - description (TEXT)
  - annual_revenue (DECIMAL)
  - number_of_employees (INTEGER)
  - is_public (BOOLEAN)
  - founded_year (INTEGER)
  - logo_url (VARCHAR)
  - linkedin_url (VARCHAR)
  - website (VARCHAR)
  - last_activity_date (TIMESTAMP)
  - last_contacted (TIMESTAMP)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - deleted_at (TIMESTAMP, soft delete)
  - created_by (UUID, FK -> users)
  - updated_by (UUID, FK -> users)
```

#### Key API Endpoints

```
GET    /api/companies              -- List with filters, pagination, sorting
POST   /api/companies              -- Create company (with domain dedup check)
GET    /api/companies/:id          -- Get company detail
PATCH  /api/companies/:id          -- Update company properties
DELETE /api/companies/:id          -- Soft delete
POST   /api/companies/:id/restore  -- Restore soft-deleted
GET    /api/companies/:id/contacts -- Associated contacts
GET    /api/companies/:id/deals    -- Associated deals
GET    /api/companies/:id/activities -- Activity timeline
POST   /api/companies/:id/activities -- Log activity (note, call, etc.)
GET    /api/companies/:id/children -- Child companies
POST   /api/companies/bulk-update  -- Bulk property update
POST   /api/companies/import       -- CSV import
GET    /api/companies/export       -- CSV export
```

#### Security Checklist (Per CLAUDE.md Rules)

- Every query MUST include `WHERE tenant_id = ?`
- Input validation with Zod schemas for all create/update operations
- Domain validation (proper URL format) before dedup check
- Rate limiting on bulk operations
- Soft delete only (never hard delete)
- Foreign key indexes on: tenant_id, owner_id, parent_company_id, domain

---

## Sources

### HubSpot Companies
- https://knowledge.hubspot.com/records/view-and-filter-records
- https://knowledge.hubspot.com/records/create-and-manage-saved-views
- https://knowledge.hubspot.com/records/work-with-records
- https://knowledge.hubspot.com/records/view-a-company-record-summary
- https://knowledge.hubspot.com/records/associate-records
- https://knowledge.hubspot.com/object-settings/create-and-use-association-labels
- https://knowledge.hubspot.com/object-settings/automatically-create-and-associate-companies-with-contacts
- https://knowledge.hubspot.com/records/add-a-parent-or-child-company
- https://knowledge.hubspot.com/properties/hubspot-crm-default-company-properties
- https://knowledge.hubspot.com/records/enrich-your-contact-and-company-data
- https://knowledge.hubspot.com/records/get-started-with-data-enrichment
- https://knowledge.hubspot.com/object-settings/select-properties-to-show-on-records-in-board-view
- https://knowledge.hubspot.com/records/use-lifecycle-stages
- https://knowledge.hubspot.com/object-settings/customize-records
- https://knowledge.hubspot.com/object-settings/set-default-index-page-views
- https://developers.hubspot.com/docs/api-reference/crm-companies-v3/guide
- https://www.hubspot.com/products/crm/data-enrichment
- https://www.hubspot.com/company-news/fall-2025-spotlight

### Salesforce Accounts
- https://techmantranow.com/insights/f/account-hierarchy-in-salesforce-a-complete-guide2025
- https://help.salesforce.com/s/articleView?id=sales.account_fields.htm
- https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_Account.htm
- https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_account.htm

### Pipedrive Organizations
- https://zeeg.me/en/blog/post/pipedrive-crm-features
- https://www.pipedrive.com/en/blog/data-enrichment
- https://www.pipedrive.com/en/features/smart-contact-data
- https://help.ortto.com/a-217-pipedrive-organization-fields
- https://zeeg.me/en/blog/post/pipedrive-custom-fields
- https://www.empler.ai/blog/full-power-of-pipedrive-essential-tips-for-crm-enrichment

---

> **Document Status:** Complete
> **Last Updated:** 2026-02-07
> **Prepared for:** F-CORE Companies Page Implementation
