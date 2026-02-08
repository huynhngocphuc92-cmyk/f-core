# Competitive Analysis: CRM Contact Management Features

> **Research Date:** 2026-02-08
> **Purpose:** Inform F-CORE Contacts Page enhancement to match HubSpot-level quality
> **Platforms Analyzed:** HubSpot CRM, Salesforce Lightning, Pipedrive

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [HubSpot CRM (Primary Template)](#2-hubspot-crm-primary-template)
3. [Salesforce Lightning (Enterprise Reference)](#3-salesforce-lightning-enterprise-reference)
4. [Pipedrive (UX Reference)](#4-pipedrive-ux-reference)
5. [Feature Comparison Matrix](#5-feature-comparison-matrix)
6. [Recommendations for F-CORE](#6-recommendations-for-f-core)

---

## 1. Executive Summary

After extensive research of the three leading CRM platforms, the key findings are:

- **HubSpot** sets the gold standard for CRM contact management with its intuitive 3-column record layout, powerful saved views system, and seamless association management. It is our primary template.
- **Salesforce** excels at enterprise-grade customization with its Lightning App Builder, compact layouts, and the powerful Lead-to-Contact conversion model. Its flexibility is unmatched but comes at the cost of complexity.
- **Pipedrive** wins on UX simplicity with its streamlined contact detail view, activity-first design philosophy, and visual contacts timeline. It proves that clean, opinionated UX beats feature bloat.

**For F-CORE:** We should replicate HubSpot's 3-column record layout as our foundation, borrow Pipedrive's UX simplicity for interaction design, and selectively adopt Salesforce's compact layout concept for information density.

---

## 2. HubSpot CRM (Primary Template)

### 2.1 Contact Record Page (3-Column Layout)

HubSpot uses a distinctive **3-column layout** for all CRM record pages (contacts, companies, deals, tickets). This is the core pattern we must replicate.

#### Left Sidebar (~25% width)
- **Primary display properties** at top: First name, Last name, Job title (editable inline)
- **"About this contact" card**: Core properties displayed as label-value pairs
  - Email (unique identifier)
  - Phone number (auto-formatted with country code validation)
  - Lifecycle stage (dropdown)
  - Lead status
  - Contact owner (HubSpot user picker)
- **Activity icons row**: Quick-action icons for Note, Email, Call, Task, Meeting (customizable order via "Reorder activity buttons")
- **Actions dropdown**: Merge, Export contact data, Delete, View property history
- **Additional property cards**: Conditional/grouped property sections (e.g., "Service Properties" shown conditionally)
- Users can **customize which properties** appear via "Customize properties" action
- **Pencil icon (hover)** on any property to inline edit

#### Middle Column (~50% width)
- **Tab-based organization** (up to 10 custom tabs as of August 2025):
  - **Overview tab** (default on first visit):
    - Data highlights card (key metric values)
    - Recent activities card (last 3 activities)
    - Upcoming activities card (next 3 activities)
    - Allbound timeline card (calendar view, inbound/outbound direction)
    - Association cards (quick view of linked records)
  - **Activities tab** (most recently visited tab is remembered):
    - Chronological timeline of ALL interactions
    - Filter bar above timeline: emails, website activity, calls/meetings, tasks/notes, marketing activity
    - Activity types: calls, emails, meetings, notes, tasks, postal mail, LinkedIn, SMS, WhatsApp messages
    - Each activity expandable with details from compact layout
    - "Log" button to manually record activity
  - **Custom tabs** (e.g., "Sales" tab with deal-specific properties)

#### Right Sidebar (~25% width)
- **Association cards** for linked records:
  - Companies (with primary company designation)
  - Deals
  - Tickets
  - Payment links
  - Other contacts
  - Custom objects
- **Segment memberships** card
- **Attachments** card
- Each association card supports: sorting, searching, inline scrolling (updated Oct 2025)
- "Add" button on each card to create new associations
- Association labels (e.g., "Decision Maker", "Influencer" for Deal-Contact)

#### Key UX Patterns
- **Tab memory**: System remembers last visited tab (Overview or Activities)
- **Card-based design**: Every section is a card that can be reordered, added, or removed by admins
- **User-level customization**: Users can add/remove/reorder properties in their personal view
- **Admin-level customization**: Admins set defaults, team-specific views, and conditional cards

### 2.2 Contact List View (Index Page)

#### Table Layout
- **Standard data table** with rows for each contact
- **Columns**: Configurable per view; default includes Name, Email, Phone, Contact Owner, Last Activity Date
- **Column customization**: "Edit columns" button to add/remove/reorder columns
  - Drag-and-drop reordering
  - Freeze up to 3 columns (primary property always frozen)
  - Association columns available (e.g., "Contact -> Company (Primary)")
- **Inline sorting**: Click column header to sort ascending/descending

#### Views System
- **Default views** (provided by HubSpot): "My contacts", "All contacts", "Marketing contacts", "Recently created"
- **Saved views** (user-created):
  - Create: Click "+ Add view" > "Create new view"
  - Name the view
  - Set visibility: Private / My Team / Everyone
  - Apply filters and save
- **View tabs**: Views appear as horizontal tabs at the top
  - Reorderable
  - Admin can set default tab order for everyone
  - "All views" page for managing/previewing/sharing views
- **View types** (as of October 2025):
  - **List view**: Classic table with bulk actions and fast editing
  - **Board view**: Kanban-style cards (now available for contacts, not just deals)
  - **Reporting view**: Inline charts (e.g., Contacts by Lifecycle Stage)

#### Filtering
- **Quick filters**: Property dropdown menus at top of table (up to 5 configurable)
- **Advanced filters**: Click "Advanced filters" for complex filter builder
  - AND/OR logic
  - All property types supported
  - Association-based filtering (e.g., "has associated deal in stage X")
- **Search**: Global search bar + in-table search

#### Bulk Actions
- **Select records**: Individual checkboxes or "Select all" (with page vs. all distinction)
- **Available actions**:
  - Edit (bulk property update)
  - Delete
  - Assign owner
  - Create/update in workflows
  - Export
  - Enroll in sequence
  - Add to static list/segment

### 2.3 Contact Create/Edit Form

#### Create Contact Panel
- **Right-side slide-out panel** (not a full page or modal)
- **Customizable fields**: Admins configure which properties appear via Settings > Objects > Contacts
- **Required fields**: Email (unique identifier), any admin-marked required fields
- **Conditional logic** (Pro/Enterprise):
  - Show/require fields based on a controlling property's value
  - Example: If "Buying Role" = "Blocker", show "Employment Role" field
- **Property types supported**: Text, Number, Date, Dropdown, Multi-checkbox, Phone, Email, URL, HubSpot User picker, File
- **Association section**: "Associate contact with" section to link Company/Deal during creation
- **Quick property creation**: "Create a property" inline during form creation (May 2025 update)
- **Breeze AI**: Create properties by text description instead of wizard (2025 feature)

#### Inline Editing (Record Page)
- **Hover to reveal**: Pencil icon appears on hover over any editable property
- **Click to edit**: Click property value or pencil icon to enter edit mode
- **In-place editing**: Text fields become input, dropdowns become select, dates become date picker
- **Save/Cancel**: Save button (or Enter) to confirm, Cancel or Escape to discard
- **Property history**: Click property to view value change history with timestamps and sources
- **Phone number auto-formatting**: Country-specific validation and formatting at input time (May 2025)

### 2.4 Activity Timeline

#### Timeline Structure
- **Chronological reverse-order** (newest first)
- **Activity types tracked**:
  - Emails (sent, opened, clicked, replied)
  - Calls (logged, recorded)
  - Meetings (scheduled, completed)
  - Notes (manual)
  - Tasks (created, completed)
  - Postal mail
  - LinkedIn messages
  - SMS messages
  - WhatsApp messages
  - Website page views
  - Form submissions
  - Workflow actions
  - Deal changes
  - Marketing email interactions

#### Timeline Filters
- Filter by activity type (quick toggle buttons)
- Filter by date range
- Filter by user/team
- Search within timeline

#### Activity Cards
- **Recent activities card**: Shows last 3 activities (configurable)
- **Upcoming activities card**: Shows next 3 upcoming activities
- **Allbound timeline card**: Calendar view breaking down by inbound/outbound direction
- **Custom activity total cards**: Admin-created aggregate cards

#### Activity Logging
- **Log from record**: Click activity icon in left sidebar
- **Quick actions**: Log Call, Log Email, Log Meeting, Create Note, Create Task
- **Auto-logging**: Connected email accounts auto-log sends/receives/opens/clicks
- **Calendar sync**: Connected calendars auto-log meetings
- **Activity association**: Activities auto-associate with primary company; manually associable with other records

### 2.5 Association Management

#### Association Model
- **Bidirectional**: If A is associated to B, B is also associated to A
- **Multi-object**: Contact <-> Company, Contact <-> Deal, Contact <-> Ticket, Contact <-> Contact, Contact <-> Custom Object
- **Primary designation**: For Contact-Company, first association is primary by default
  - Primary company activities auto-associate with contact activities
  - Primary company shows in index page columns

#### Association Labels (Pro/Enterprise)
- **Standard labels**: "Contact at company" (default)
- **Custom labels**: "Decision Maker", "Influencer", "End User", "Technical Contact"
- **Purpose**: Clarify relationship roles for reporting and workflows

#### Automatic Company Association
- **Domain-based auto-association**: When contact email domain matches company domain, auto-associate
  - Freemail domains (gmail, yahoo) excluded; falls back to Website URL property
  - Subdomain creates separate company records (e.g., @example.com vs @info.example.com)
- **Admin setting**: Enable/disable in Settings > Objects > Companies
- **Domain exclusion list**: Up to 1,000 domains excluded from auto-association

#### Association Views
- **Right sidebar cards**: Each association type gets its own card
- **Index page columns**: Show associated records as columns (e.g., "Contact -> Companies")
- **Association import**: CSV import supports creating associations (source ID, destination ID, label columns)

### 2.6 Contact Merge/Dedup

#### Duplicate Detection
- **Manage Duplicates tool**: CRM > Contacts > Actions > Manage Duplicates
- **Matching criteria**: Name, email, phone number similarity
- **Confidence scoring**: System ranks duplicate pairs by likelihood

#### Merge Process
1. Navigate to primary contact record
2. Actions dropdown > Merge
3. Search and select secondary contact
4. Review property values side-by-side
5. Choose which values to keep (primary defaults)
6. Confirm merge

#### Merge Rules
- **Primary record preserved**: The record you start from becomes the primary
- **Property resolution**: Primary record values take precedence; empty fields filled from secondary
- **Activity merging**: All activities from both records combined in timeline
- **Association merging**: All associations from both records combined
- **Contact merge exceptions**: Certain properties (like original source) follow special merge logic
- **Post-merge cleanup**: Can delete additional email addresses, create new contacts from deleted emails

#### Dedup Prevention
- **Unique identifier**: Email address is the unique identifier for contacts
- **Import dedup**: During import, matches on email to update vs. create
- **Form submission dedup**: Uses browser cookie (user token) to match existing contacts
- **"Always create new contact" setting**: Option per form to force new records

### 2.7 Contact Import/Export

#### Import
- **Quick Import** (simplified): Drag-and-drop CSV, auto-maps columns to properties
- **Advanced Import**: Full wizard with object selection, association setup, advanced options
- **File requirements**: CSV, XLSX, or XLS format; max 512 MB; max 1,048,576 rows
- **Import options**:
  - Create and update contacts (rows matching email update; non-matching create)
  - Create new contacts only
  - Update existing contacts only
- **Column mapping**: Automatic pre-matching with manual override
- **Dedup key**: Email address (or Record ID, or custom unique property)
- **Association import**: Multi-file import to create contact + company + deal associations simultaneously
- **Language detection**: Column header language selection for proper mapping

#### Export
- **Index page export**: Select view > Export (CSV or XLSX)
- **Contact data export**: From contact record > Actions > Export contact data
  - Default properties + history
  - Optional: Custom properties + history
  - Optional: Contact activities (emails, calls, notes)
  - Optional: Associations
- **Bulk export**: Select contacts in list > Export
- **Email delivery**: Export file sent via email with download link

---

## 3. Salesforce Lightning (Enterprise Reference)

### 3.1 Contact vs. Lead Data Model

Salesforce uses a **dual-object model** that separates unqualified prospects (Leads) from qualified contacts (Contacts). This is the most significant architectural difference from HubSpot.

#### Lead Object
- **Standalone record**: Not associated with Accounts, Opportunities, or Cases
- **Purpose**: Represents unqualified prospects who have shown interest
- **Typical fields**: Name, Company (text field, not lookup), Title, Email, Phone, Lead Source, Lead Status
- **Limitations**:
  - Activities on Leads are NOT visible on Account records
  - Cannot be grouped by company in standard views
  - Reporting is siloed (Lead reports vs. Contact reports)

#### Contact Object
- **Associated record**: Connected to Accounts (companies), Opportunities (deals), Cases (tickets)
- **Purpose**: Represents qualified individuals with established relationships
- **Account-Contact relationship**: Many Contacts to one Account (standard); Junction object for many-to-many
- **Post-conversion**: Leads "disappear" and become Contacts + Accounts + optional Opportunities

#### Lead Conversion Process
1. Sales rep qualifies lead through interaction
2. Click "Convert" on Lead record
3. System creates or links: Contact + Account + optional Opportunity
4. Field mapping carries data from Lead fields to Contact/Account/Opportunity fields
5. Converted Lead is archived (hidden from standard Lead views)
6. All Lead activities transfer to the new Contact record

#### F-CORE Implications
- **Skip the Lead object**: HubSpot's single-object model (Contact with Lifecycle Stage) is simpler and more modern
- **Use Lifecycle Stage property** instead: Subscriber > Lead > MQL > SQL > Opportunity > Customer
- **Benefit**: No "conversion" process needed; single timeline for all interactions

### 3.2 Contact Detail Page Layout (Lightning Experience)

#### Page Structure
Salesforce Lightning uses a **customizable multi-region template** system:

- **Highlights Panel** (top bar):
  - Controlled by **Compact Layout** (admin-configured)
  - Shows 4-10 key fields: Name, Account, Title, Phone, Email, Owner
  - Cannot be customized via page layout editor (compact layout only)
  - "Quick action" buttons (Log a Call, New Task, New Event, Email, etc.)

- **Tab-based content area** (below highlights):
  - **Details tab**: Full property form with field sections (Information, Address, Description, etc.)
  - **Activity tab**:
    - Activity timeline (similar to HubSpot but with different UI)
    - OR Activity History + Open Activities related lists (admin choice, not both)
    - Log Call, New Task, New Event quick actions
    - Email composer
    - Chatter feed
  - **Related tab**: Related list cards for associated records
    - Account
    - Opportunities (Contact Roles)
    - Cases
    - Campaign History
    - Direct reports (Contact hierarchy)
  - **Custom tabs**: Added via Lightning App Builder

#### Compact Layout
- **Purpose**: Controls which fields appear in the Highlights Panel at the top
- **Applies globally**: One compact layout per object per record type
- **Also used in**: Activity timeline expanded views, hover lookup cards, mobile app
- **Configuration**: Object Manager > Contact > Compact Layouts
- **Fields**: Typically Name, Account, Title, Phone, Email (up to 10 fields, first field in bold)

#### Lightning App Builder Customization
- **Drag-and-drop page builder** for record pages
- **Templates**: Three Regions, Pinned Header, Pinned Left Sidebar, etc.
- **Components**: Record Detail, Related Lists, Activity Timeline, Tabs, Accordion, custom components
- **Assignment**: Pages assignable by App, Record Type, Profile, or Org Default
- **Regions**: Fixed proportional widths (50% main + 25% + 25% sidebars)

### 3.3 Key Salesforce Patterns

#### Related Lists (Associations)
- **Cards view**: Condensed related list cards (replaces classic scrolling related lists)
- **Wide regions**: Cards on separate "Related" tab
- **Narrow regions**: Cards inline on right sidebar
- **Customizable per user**: Users can adjust which related lists appear
- **Enhanced related list components**: Dynamic Related List - Single component for targeted display

#### Activity Timeline vs. Related Lists
- **Admin choice**: Activity Timeline component OR Activity History/Open Activities related lists
- **Cannot use both simultaneously** in Lightning Experience
- **Activity Timeline**: Chronological, expandable cards with compact layout fields
- **Activity History related list**: Traditional table format with sorting/filtering

#### Chatter Feed
- **Collaboration**: Team members can post, comment, @mention on records
- **Not in HubSpot**: Unique Salesforce feature
- **Consideration for F-CORE**: Could add a "Notes/Comments" feature for internal collaboration

### 3.4 UX Assessment

#### Strengths
- **Extreme customizability**: Lightning App Builder allows pixel-level control over record pages
- **Compact Layout concept**: Brilliant pattern for showing key fields in a highlights bar
- **Profile-based views**: Different page layouts for different user roles
- **Rich ecosystem**: Thousands of AppExchange components that plug into record pages

#### Weaknesses
- **Overwhelming complexity**: Too many configuration options lead to decision fatigue
- **Inconsistent UX**: No two Salesforce orgs look the same, making training difficult
- **Legacy patterns**: Classic vs. Lightning UI inconsistencies still exist
- **Learning curve**: Steep for both admins and end users
- **Activity timeline limitations**: Cannot show Activity Timeline AND related lists simultaneously

---

## 4. Pipedrive (UX Reference)

### 4.1 Person Detail Page

Pipedrive recently redesigned their contact detail view (rolled out to all users) with a focus on clarity and control.

#### Page Layout: 2-Column Design
- **Left sidebar** (scrollable independently):
  - **Summary panel** (new): Email, phone, linked organization, labels at the top
  - **Details section**: Custom fields organized into collapsible sections
    - Default fields: Label, Phone, Email, Organization
    - Custom fields: User-created (text, number, dropdown, etc.)
    - Grouped into named sections for organization
  - **Participants** section (for deals)
  - **Deals** section: List of all associated deals with status indicators
  - **Projects** section
  - **Manage sidebar sections**: "..." menu to hide/show/reorder sections

- **Main content area** (scrollable independently):
  - **Activity/history feed**: Chronological timeline of interactions
  - **Planned activities**: Upcoming scheduled items at top
  - **Notes**: Inline note creation
  - **Files**: Attached documents
  - **Email threads**: Synced email conversations

#### Sidebar Customization
- **Section management**: Toggle sections on/off, drag to reorder
- **Field customization**: Add custom fields, edit field properties directly from sidebar
- **Bulk edit mode**: Click pencil icon in section header to edit all fields in a section simultaneously
- **Collapsible sections**: Click to expand/collapse any section
- **Independent scrollbars**: Sidebar and main content scroll independently

### 4.2 Contact Timeline

Pipedrive's **Contacts Timeline** is a standout feature that provides a bird's-eye view of contact engagement.

#### Timeline View
- **Visual timeline**: Horizontal timeline showing all contacts with activities plotted chronologically
- **Color-coded deal bars**: Associated deals shown as colored bars along the timeline
  - Green: Won deal
  - Red: Lost deal
  - Blue: Open deal
- **Activity markers**: Icons for calls, emails, meetings, notes placed on timeline
- **Lookback period**: Adjustable from 1-12 months + slight future view

#### Timeline Filtering
- **Standard Pipedrive filters**: Apply any saved filter to the timeline view
- **Quick filter-out buttons**: Toggle activity types on/off above the contacts list
- **Follow-up frequency**: Set per-filter (e.g., "Contact monthly", "Contact weekly")
- **Overdue highlighting**: Contacts not contacted within the set frequency highlighted in red and shuffled to top
- **Priority indicator**: Completed activities lower the contact's priority in the list

### 4.3 Activity Scheduling from Contact

- **Schedule from anywhere**: Activities can be created from calendar, pipeline view, contacts timeline, or within a deal/person record
- **Activity types**: Default (calls, meetings, tasks, due dates, emails, lunches) + custom activities
- **Calendar sync**: Bidirectional sync with Google, Outlook, Office 365
- **Scheduler feature**: Generate booking links for contacts to self-schedule
  - Links embeddable in emails, signatures, landing pages
  - Auto-links booking to relevant deal and contact
  - Real-time slot blocking to prevent double-booking
  - Auto-generates meeting links (Google Meet, Zoom, Microsoft Teams)
- **Reminder notifications**: Automated reminders for both reps and contacts

### 4.4 Smart Contact Linking

- **Person-Organization linking**: Each person linked to one organization
- **Deal-Person-Organization chain**: Creating a deal creates person + organization simultaneously
- **Email auto-linking**: If emailed person exists in Pipedrive, email auto-links to their record; if not, creates new person
- **Multi-deal support**: One person can have multiple open deals simultaneously
- **Cross-record activity reflection**: Log activity on person, it appears on organization record (and vice versa)
- **Smart Contact Data**: Auto-enriches records with publicly available information
- **Duplicate detection**: "Merge Duplicates" tool under Tools and Apps

### 4.5 UX Assessment

#### Strengths
- **Simplicity**: Clean, uncluttered UI that focuses on what salespeople actually need
- **Activity-based selling philosophy**: Everything revolves around "what's my next action?"
- **Visual clarity**: Color coding, deal bars, overdue highlighting make priorities obvious
- **Contacts Timeline view**: Unique bird's-eye view that no other CRM offers
- **Speed**: Few clicks to complete common tasks (log call, schedule meeting, add note)
- **Smart defaults**: Sensible auto-linking and auto-creation reduce manual data entry
- **Independent scrolling**: Sidebar and main content scroll independently (excellent for long records)
- **Keyboard shortcuts**: Letters for quick actions (D=Deal, L=Lead, A=Activity)

#### Weaknesses
- **Limited customization**: Cannot create complex multi-column record layouts
- **Single organization link**: Person can only link to one organization (no multi-org support)
- **No conditional fields**: Cannot show/hide fields based on other field values
- **Limited reporting on timeline**: Cannot filter by user within timeline
- **No board view for contacts**: Board view only available for deals
- **Bulk actions limited in some views**: Need to switch to List view for bulk operations
- **No record-level permission control**: Same layout for all users

---

## 5. Feature Comparison Matrix

### 5.1 Contact Record Page

| Feature | HubSpot | Salesforce | Pipedrive | F-CORE Priority |
|---------|---------|------------|-----------|-----------------|
| 3-column layout | Yes | Yes (configurable) | 2-column | HIGH - Replicate HubSpot |
| Highlights/summary bar | Via compact display | Compact Layout | Summary panel | HIGH |
| Tab-based content | Yes (10+ tabs) | Yes (customizable) | No tabs | HIGH |
| Activity timeline | Yes (rich) | Yes (or related lists) | Yes (simple) | HIGH |
| Right sidebar associations | Yes (cards) | Related tab/sidebar | Left sidebar sections | HIGH |
| Inline property editing | Hover pencil icon | Click to edit | Pencil icon/bulk edit | HIGH |
| User-customizable layout | Properties only | Lightning App Builder | Sidebar sections | MEDIUM |
| Admin-configurable layout | Full control | Full control | Limited | LOW |
| Independent scrolling regions | No (page scroll) | No (page scroll) | Yes (sidebar + main) | MEDIUM |
| Property history | Yes (per property) | Field History Tracking | No | LOW |
| Activity icons (quick actions) | Yes (customizable) | Quick actions | Activity buttons | HIGH |
| Conditional property display | Yes (Pro+) | Yes (record types) | No | LOW |

### 5.2 Contact List View

| Feature | HubSpot | Salesforce | Pipedrive | F-CORE Priority |
|---------|---------|------------|-----------|-----------------|
| Saved views | Yes (Private/Team/All) | Yes (Personal/Org) | Yes (filters) | HIGH |
| Advanced filters | Yes (AND/OR, associations) | Yes (complex) | Yes (basic) | HIGH |
| Column customization | Yes (drag, freeze) | Yes (page layout) | Yes | HIGH |
| Quick filters | Yes (top bar dropdowns) | Yes | Yes | HIGH |
| Bulk actions | Yes (edit, delete, assign, export) | Yes (extensive) | Limited | HIGH |
| Board view | Yes (Oct 2025) | No standard | No (contacts) | LOW |
| Reporting view | Yes (inline charts) | Dashboard components | No | LOW |
| Search | Global + in-table | Global + SOQL | Global + in-table | HIGH |
| Record preview | Hover/sidebar preview | Hover lookup card | No | MEDIUM |
| Default views | Yes (My contacts, etc.) | Yes (Recently Viewed) | Yes | MEDIUM |

### 5.3 Contact Create/Edit

| Feature | HubSpot | Salesforce | Pipedrive | F-CORE Priority |
|---------|---------|------------|-----------|-----------------|
| Slide-out create panel | Yes (right panel) | Yes (quick action) | Modal/inline | HIGH |
| Required fields | Admin configurable | Admin configurable | Basic | HIGH |
| Conditional fields | Yes (Pro+) | Yes (record types) | No | LOW |
| Domain-based company auto-link | Yes (automatic) | No (manual) | Email auto-link | HIGH |
| Phone auto-formatting | Yes (country-specific) | No standard | No | MEDIUM |
| Association during create | Yes | Yes (lookups) | Yes (person+org+deal) | HIGH |
| Property creation inline | Yes (May 2025) | No (admin only) | Yes | LOW |

### 5.4 Associations

| Feature | HubSpot | Salesforce | Pipedrive | F-CORE Priority |
|---------|---------|------------|-----------|-----------------|
| Contact-Company | Many-to-many + primary | Many-to-one (Account) | One-to-one (Organization) | HIGH |
| Contact-Deal | Many-to-many + labels | Many-to-many (Contact Roles) | Many-to-many | HIGH |
| Contact-Ticket | Many-to-many | Many-to-many (Cases) | No standard | MEDIUM |
| Contact-Contact | Yes | No standard | No | LOW |
| Association labels | Yes (Pro+) | Contact Roles on Opps | No | LOW |
| Auto-association (domain) | Yes | No | Email-based | HIGH |
| Bulk association management | Yes (Jan 2026) | Yes | Limited | MEDIUM |

### 5.5 Merge/Dedup

| Feature | HubSpot | Salesforce | Pipedrive | F-CORE Priority |
|---------|---------|------------|-----------|-----------------|
| Duplicate detection | AI-powered suggestions | Matching rules | Duplicate finder tool | MEDIUM |
| Manual merge | Yes (side-by-side compare) | Yes | Yes (primary/secondary) | MEDIUM |
| Merge from record | Yes (Actions > Merge) | Yes | Yes (...> Merge) | MEDIUM |
| Activity preservation | All activities merged | All activities merged | Primary preserved | MEDIUM |
| Bulk dedup | Manage Duplicates page | Duplicate Rules | Merge Duplicates tool | LOW |
| Undo merge | No | No | No | LOW |

### 5.6 Import/Export

| Feature | HubSpot | Salesforce | Pipedrive | F-CORE Priority |
|---------|---------|------------|-----------|-----------------|
| CSV import | Yes (quick + advanced) | Yes (Data Import Wizard) | Yes | MEDIUM |
| XLSX import | Yes | Yes | Yes | LOW |
| Column auto-mapping | Yes (intelligent) | Yes | Yes | MEDIUM |
| Association import | Yes (multi-file) | Yes | No | LOW |
| Export from list | Yes (CSV/XLSX) | Yes (reports) | Yes (CSV) | MEDIUM |
| Contact data export | Yes (record-level, with history) | Yes | Yes | LOW |
| Import dedup | Email-based matching | External ID/Email | Email-based | MEDIUM |

---

## 6. Recommendations for F-CORE

### 6.1 Must-Have Features (Sprint Priority)

These features are essential to match HubSpot-level quality and should be implemented first:

#### Contact Detail Page
1. **3-column record layout**: Left sidebar (properties, ~25%), center (tabs/timeline, ~50%), right sidebar (associations, ~25%)
2. **Left sidebar "About this contact" card**: Show key properties (Email, Phone, Lifecycle Stage, Owner, Job Title, Company Name)
3. **Activity quick-action icons**: Note, Email, Call, Task, Meeting icons in left sidebar
4. **Center tabs**: Overview tab + Activities tab (minimum)
5. **Activity timeline**: Chronological feed with activity type icons, filter buttons, and expandable cards
6. **Right sidebar association cards**: Company, Deals, Tickets with "Add" buttons and search
7. **Inline editing**: Hover-to-reveal pencil icon, click-to-edit with save/cancel

#### Contact List View
1. **Saved views system**: Create, name, set visibility (Private/Team/Everyone), save filters + columns
2. **Advanced filters**: Property-based filtering with AND/OR logic
3. **Column customization**: Add/remove/reorder columns, drag-and-drop
4. **Quick filter bar**: Top-of-table dropdown filters for common properties
5. **Bulk actions toolbar**: Appears when records are selected (Edit, Delete, Assign Owner, Export)
6. **Default views**: "My contacts", "All contacts", "Recently created"

#### Contact Create/Edit Form
1. **Right-side slide-out panel**: Consistent with HubSpot's pattern
2. **Required field validation**: Email required, admin-configurable additional requirements
3. **Company association during creation**: Dropdown to link company during contact creation
4. **Domain-based auto-association**: Extract domain from email, auto-suggest/create company

### 6.2 Should-Have Features (Second Priority)

These features differentiate a good CRM from a great one:

1. **Contact merge**: Side-by-side comparison, property-by-property selection, activity preservation
2. **Independent sidebar scrolling** (from Pipedrive): Sidebar and main content scroll independently
3. **Compact/summary panel** (from Salesforce): Key fields displayed prominently at top of record
4. **Activity logging from record**: Log Call, Email, Meeting directly from the contact page
5. **CSV import with column mapping**: Upload CSV, map columns to properties, dedup on email
6. **CSV export**: Export current view's contacts as CSV
7. **Record preview sidebar**: Click on contact in list to see preview panel without navigating away
8. **Phone number formatting**: Auto-format based on country code

### 6.3 Nice-to-Have Features (Future Sprints)

1. **Association labels**: "Decision Maker", "Technical Contact", etc. on Contact-Deal links
2. **Contacts Timeline view** (from Pipedrive): Visual timeline showing all contacts with activity markers
3. **Board view for contacts**: Kanban-style view grouped by lifecycle stage
4. **Duplicate detection**: AI-powered duplicate suggestion tool
5. **Conditional form fields**: Show/hide form fields based on other field values
6. **Custom tabs on record page**: Allow admin to create additional tabs
7. **Property history**: Track and display value changes over time
8. **Reporting view**: Inline charts on the index page (contacts by lifecycle stage, etc.)

### 6.4 Features to Skip

These features add complexity without proportional value for F-CORE's current stage:

1. **Lead vs. Contact separation** (Salesforce): Use HubSpot's single-object + Lifecycle Stage model instead
2. **Lightning App Builder-level customization** (Salesforce): Too complex for current scope; card-based layout is sufficient
3. **Custom objects**: Not needed for MVP contact management
4. **Workflow automation from contacts**: Future feature, not part of contacts page enhancement
5. **Multi-account management**: Enterprise feature, not needed now
6. **Chatter/feed-based collaboration** (Salesforce): Internal notes per contact are sufficient

### 6.5 Key Design Principles (Derived from Research)

1. **HubSpot's consistency**: Every record type uses the same 3-column layout. Users learn it once.
2. **Pipedrive's focus**: Don't show everything; show what matters for the current task.
3. **Salesforce's compact layout concept**: Key fields at the top, always visible, never need to scroll.
4. **Activity-first thinking**: The timeline is the center of the contact page, not the properties.
5. **Hover-to-reveal**: UI chrome (edit icons, action buttons) appears on hover to keep the interface clean.
6. **Progressive disclosure**: Overview tab shows summary; Activities tab shows full history; properties are in the sidebar, not center stage.
7. **Independent scroll regions**: Left sidebar, center content, and right sidebar should scroll independently to prevent information loss during navigation.
8. **Card-based modularity**: Each section is a self-contained card that can be added, removed, or reordered.

### 6.6 Recommended Layout Specification for F-CORE

```
+------------------------------------------------------------------+
| HEADER BAR: [Avatar] Contact Name | [Actions v] [Edit] [Delete]  |
+------------------------------------------------------------------+
|  LEFT SIDEBAR  |  CENTER CONTENT          |  RIGHT SIDEBAR       |
|  (~280px)      |  (flex-1)                |  (~300px)            |
|                |                          |                      |
| [Activity      |  [Overview] [Activities] |  COMPANY CARD        |
|  Quick Icons]  |                          |  + Company Name      |
| Note Email     |  --- Overview Tab ---    |  + Domain            |
| Call Task Meet |  Data Highlights Card    |  + Industry          |
|                |  Recent Activities Card  |  [+ Add Company]     |
| ABOUT CONTACT  |  Upcoming Activities     |                      |
| Email          |                          |  DEALS CARD          |
| Phone          |  --- Activities Tab ---  |  + Deal Name ($)     |
| Lifecycle Stage|  [Filter: All | Email |  |  + Deal Stage        |
| Lead Status    |   Call | Meeting | Note]  |  [+ Add Deal]        |
| Contact Owner  |                          |                      |
| Job Title      |  [Activity Card]         |  TICKETS CARD        |
| Company        |  [Activity Card]         |  + Ticket Subject    |
|                |  [Activity Card]         |  + Status            |
| [See All Props]|  [Load More...]          |  [+ Add Ticket]      |
|                |                          |                      |
+----------------+--------------------------+----------------------+
```

---

## Sources

### HubSpot
- HubSpot Knowledge Base: Customize Records (Nov 2025) - https://knowledge.hubspot.com/object-settings/customize-records
- HubSpot Knowledge Base: Record Page Layout (Jan 2026) - https://knowledge.hubspot.com/records/work-with-records
- HubSpot Knowledge Base: Associate Records (Oct 2025) - https://knowledge.hubspot.com/records/associate-records
- HubSpot Knowledge Base: Saved Views (Feb 2026) - https://knowledge.hubspot.com/records/create-and-manage-saved-views
- HubSpot Knowledge Base: Merge Records - https://knowledge.hubspot.com/records/merge-records
- HubSpot Knowledge Base: Auto-Associate Companies - https://knowledge.hubspot.com/object-settings/automatically-create-and-associate-companies-with-contacts
- HubSpot Knowledge Base: Customize Create Form (Dec 2025) - https://knowledge.hubspot.com/object-settings/set-up-fields-seen-when-manually-creating-records
- HubSpot Knowledge Base: Default Contact Properties (Dec 2025) - https://knowledge.hubspot.com/properties/hubspots-default-contact-properties
- HubSpot Knowledge Base: Import Contacts (Jan 2026) - https://knowledge.hubspot.com/import-and-export/import-contacts-quick-import
- HubSpot Knowledge Base: Export Contact Data (Oct 2025) - https://knowledge.hubspot.com/import-and-export/export-contact-data
- HubSpot Knowledge Base: Bulk Edit Records (Dec 2025) - https://knowledge.hubspot.com/records/bulk-edit-records
- HubSpot Knowledge Base: Filter Activities (Dec 2025) - https://knowledge.hubspot.com/records/filter-activities-on-a-record-timeline
- HubSpot Community: Product Updates (Aug, Oct, Nov 2025, Jan 2026)

### Salesforce
- Salesforce Help: Page Layout Elements in Lightning - https://help.salesforce.com/s/articleView?id=platform.layouts_in_lex.htm
- Salesforce Trailhead: Compact Layouts - https://trailhead.salesforce.com/content/learn/modules/lex_customization/lex_customization_compact_layouts
- Salesforce Trailhead: Customize UI Layouts - https://trailhead.salesforce.com/content/learn/modules/lex_migration_customization/lex_migration_customization_layouts_ui
- Salesforce Trailhead: Lightning Record Pages - https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_recordpage
- SalesforceBen: Leads vs Contacts - https://www.salesforceben.com/salesforce-leads-vs-contacts-everything-you-need-to-know/
- Aptitude 8: Leads vs Contacts vs Accounts - https://aptitude8.com/blog/what-are-the-differences-between-leads-contacts-and-accounts-in-salesforce

### Pipedrive
- Pipedrive Blog: Contact Detail View - https://www.pipedrive.com/en/blog/contact-detail-view
- Pipedrive Blog: Contacts Timeline - https://www.pipedrive.com/en/blog/contacts-timeline-follow-up-leads
- Pipedrive Support: Detail View Sidebar - https://support.pipedrive.com/en/article/detail-view-sidebar
- Pipedrive Support: Data Organization - https://support.pipedrive.com/en/article/how-is-pipedrive-data-organized
- CRM.org: Pipedrive Review 2026 - https://crm.org/news/pipedrive-crm-review
- Pipedrive: Activity Calendar - https://www.pipedrive.com/en/features/activity-calendar
