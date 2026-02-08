# Companies Page - UX Patterns & User Flows
> Research Date: 2026-02-07
> Status: Complete
> Purpose: Detailed user flow specifications for F-CORE Companies feature
> References: HubSpot UX Patterns, F-CORE Design System, ContactsTable component
> Database Schema: prisma/schema.prisma (Company model)

---

## Table of Contents
1. [Flow 1: Company List View](#flow-1-company-list-view)
2. [Flow 2: Create Company](#flow-2-create-company)
3. [Flow 3: Company Detail Page (RecordPage)](#flow-3-company-detail-page-recordpage)
4. [Flow 4: Edit Company](#flow-4-edit-company)
5. [Flow 5: Delete Company](#flow-5-delete-company)
6. [Flow 6: Company-Contact Association](#flow-6-company-contact-association)
7. [Component Specifications](#component-specifications)
8. [State Management](#state-management)
9. [API Contract](#api-contract)
10. [Responsive Behavior](#responsive-behavior)

---

## Flow 1: Company List View

### 1.1 Page Layout

```
Route: /companies
Component: CompaniesPage (src/app/(dashboard)/companies/page.tsx)
Child:    CompaniesTable (src/components/companies/CompaniesTable.tsx)
```

**Full Page Structure:**
```
+--------------------------------------------------------------------+
| Page Header                                                         |
| Companies                              [Export] [Create company]    |
| 1,234 companies                                                     |
+--------------------------------------------------------------------+
| View Tabs                                                           |
| [All Companies] [My Companies] [+ Add View]                        |
+--------------------------------------------------------------------+
| Filters Bar                                                         |
| [Search companies...]  [Industry v] [Size v] [Owner v] [Filters]   |
|                                                     [Clear all]     |
+--------------------------------------------------------------------+
| Bulk Actions Bar (conditional - shown when rows selected)           |
| 3 companies selected          [Delete] [Export] [Assign Owner] [X]  |
+--------------------------------------------------------------------+
| Data Table                                                          |
| [x] | Name        | Domain       | Phone  | Industry | Owner | ... |
|-----|-------------|--------------|--------|----------|-------|-----|
| [ ] | Acme Corp   | acme.com     | +1-555 | Tech     | Sarah | ... |
| [ ] | Beta Inc    | beta.io      | +1-555 | Finance  | Mike  | ... |
| [ ] | Gamma LLC   | gamma.co     |   -    | SaaS     |   -   | ... |
+--------------------------------------------------------------------+
| Pagination                                                          |
| Showing 1-50 of 1,234 companies   [<] Page 1 of 25 [>]            |
+--------------------------------------------------------------------+
```

### 1.2 Page Header

**Layout:**
- Container: `p-6 pt-8` (matches ContactsTable)
- Left side: Title + count
- Right side: Action buttons

**Title:**
- Text: "Companies"
- Style: `text-2xl font-bold text-gray-900` (24px, bold, #111827)

**Subtitle / Record Count:**
- Text: "{total} company/companies"
- Style: `text-gray-600 mt-1` (14px, #4b5563)
- Pluralization: "1 company" vs "2 companies"

**Action Buttons (right-aligned):**
| Button | Type | Icon | Style |
|--------|------|------|-------|
| Export | Secondary | `Download` (Lucide) | `px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50` |
| Create company | Primary | `Plus` (Lucide) | `px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90` |

### 1.3 Saved Views (Tabs)

**Layout:**
- Horizontal tab row below page header
- Style: `flex items-center gap-1 border-b border-gray-200 mb-0`

**Default Views:**
| Tab | Filter Logic | Access |
|-----|-------------|--------|
| All Companies | `WHERE deleted_at IS NULL AND tenant_id = ?` | Everyone |
| My Companies | `WHERE owner_id = currentUserId AND deleted_at IS NULL` | Everyone |

**Tab Appearance:**
- Default tab: `px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border-b-2 border-transparent`
- Active tab: `px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary`
- Add View button: `px-3 py-2 text-sm text-gray-400 hover:text-gray-600` with `Plus` icon (14px)

**Tab Interactions:**
- Click tab to switch view (updates table query)
- Right-click opens context menu: Rename, Clone, Delete (custom views only)
- Default views ("All Companies", "My Companies") cannot be deleted
- Maximum custom views: 5 (free plan)

### 1.4 Default Table Columns

| # | Column | DB Field | Width | Sortable | Filterable | Render |
|---|--------|----------|-------|----------|------------|--------|
| 0 | Checkbox | - | 48px | No | No | `<input type="checkbox" />` |
| 1 | Name | `name` | flex (min 200px) | Yes | Search | Avatar + company name as link |
| 2 | Domain | `domain` | 180px | Yes | No | Plain text, link icon on hover |
| 3 | Phone | `phone` | 150px | No | No | Phone format, click-to-call |
| 4 | Industry | `industry` | 140px | Yes | Dropdown | Badge/pill |
| 5 | Owner | `owner.name` | 140px | Yes | Dropdown | Avatar + name |
| 6 | Created Date | `createdAt` | 140px | Yes | Date range | Relative time ("2 days ago") |
| 7 | Actions | - | 48px | No | No | Three-dot menu `MoreHorizontal` |

**Name Column (special rendering):**
```
+-----------------------------------------------+
| [Avatar] Company Name                          |
| (40px circle with initials, bg-primary)        |
+-----------------------------------------------+
```
- Avatar: `w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm`
- Initials: First character of company name, uppercase
- Company name link: `font-medium text-gray-900 hover:text-primary`
- Link target: `/companies/{company.id}`

### 1.5 Quick Filters

**Layout:**
- Row below tabs, above table
- `flex items-center gap-4 mb-6`

**Filter Controls:**
| Filter | Type | Options Source | Default |
|--------|------|---------------|---------|
| Search | Text input | Client-side + API | Empty |
| Industry | Dropdown select | Predefined list | "All industries" |
| Company Size | Dropdown select | Predefined list | "All sizes" |
| Owner | Dropdown select | Users from API | "All owners" |
| Lifecycle Stage | Dropdown select | Predefined list | "All stages" |

**Search Input:**
- Icon: `Search` (Lucide, left-positioned)
- Placeholder: "Search companies..."
- Style: `w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary`
- Max width: `max-w-md`
- Behavior: Debounced (300ms), searches `name`, `domain`, `phone` fields
- Reset page to 1 on search change

**Filter Toggle Button:**
- Text: "Filters"
- Icon: `Filter` (Lucide)
- Active state (when filters applied): `bg-primary text-white border-primary`
- Inactive state: `text-gray-700 bg-white border-gray-200 hover:bg-gray-50`
- Badge: Shows count of active filters as `px-2 py-0.5 text-xs bg-white/20 rounded-full`

**Clear All Link:**
- Text: "Clear all"
- Style: `text-sm text-gray-600 hover:text-gray-900 underline`
- Visibility: Only shown when any filter is active

**Industry Options:**
```typescript
const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education",
  "Manufacturing", "Retail", "Real Estate", "Marketing",
  "Consulting", "Non-Profit", "Government", "Media",
  "Energy", "Transportation", "Agriculture", "Other"
];
```

**Company Size Options:**
```typescript
const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1001-5000", label: "1,001-5,000 employees" },
  { value: "5001+", label: "5,001+ employees" },
];
```

**Lifecycle Stage Options:**
```typescript
const LIFECYCLE_STAGES = [
  { value: "subscriber", label: "Subscriber", color: "gray" },
  { value: "lead", label: "Lead", color: "blue" },
  { value: "mql", label: "MQL", color: "purple" },
  { value: "sql", label: "SQL", color: "orange" },
  { value: "opportunity", label: "Opportunity", color: "yellow" },
  { value: "customer", label: "Customer", color: "green" },
  { value: "evangelist", label: "Evangelist", color: "pink" },
];
```

### 1.6 Filter Panel (Expanded)

**Visibility:** Toggled by the "Filters" button.

**Layout:**
```
+----------------------------------------------------------------------+
| Filter Panel (bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6) |
| Grid: grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4               |
|                                                                       |
| Industry           Company Size        Owner            Lifecycle     |
| [All industries v] [All sizes    v]    [All owners  v] [All stages v] |
+----------------------------------------------------------------------+
```

**Each Filter Control:**
- Label: `block text-sm font-medium text-gray-700 mb-2`
- Select: `w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary`

### 1.7 Bulk Actions Bar

**Trigger:** Appears when `selectedIds.size > 0`.

**Layout:**
```
+----------------------------------------------------------------------+
| Bulk Actions Bar                                                      |
| (bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4)       |
|                                                                       |
| "3 companies selected"     [Assign] [Export] [Delete] [X]            |
+----------------------------------------------------------------------+
```

**Actions:**
| Action | Icon | Style | Behavior |
|--------|------|-------|----------|
| Assign Owner | `UserPlus` | Secondary (white bg, gray border) | Opens owner selection dropdown |
| Export | `Download` | Secondary | Exports selected companies as CSV |
| Delete | `Trash2` | Danger (red text, red border) | Opens confirmation modal |
| Clear | `X` | Icon button (blue hover) | Clears all selections |

**Selection Count Text:**
- Style: `text-sm font-medium text-blue-900`
- Format: "{count} company selected" / "{count} companies selected"

### 1.8 Table States

**Loading State:**
```
+-------------------------------------------+
| [Skeleton rows - shimmer animation]       |
| bg-gray-200 animate-pulse rounded h-4    |
| 5-10 skeleton rows matching column layout |
+-------------------------------------------+
```
- Container: `text-center py-12`
- Text: "Loading companies..." in `text-gray-500`

**Empty State (no records exist):**
```
+-------------------------------------------+
|          [Building icon - large]          |
|                                           |
|        No companies yet                   |
|   Start building your company database    |
|                                           |
|       [+ Create your first company]       |
+-------------------------------------------+
```
- Container: `text-center py-12`
- Icon: `Building2` (Lucide), `w-12 h-12 text-gray-300 mx-auto mb-4`
- Title: `text-gray-500 text-base`
- CTA: `inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80`

**Empty State (filters active, no results):**
```
+-------------------------------------------+
|          [Search icon - large]            |
|                                           |
|        No companies found                 |
|   Try adjusting your filters              |
|                                           |
|          [Clear filters]                  |
+-------------------------------------------+
```

**Error State:**
```
+-------------------------------------------+
|        Something went wrong               |
|   {error message}                         |
|                                           |
|            [Retry]                        |
+-------------------------------------------+
```
- Error text: `text-red-500`
- Retry button: `px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90`

### 1.9 Pagination

**Layout:**
```
+----------------------------------------------------------------------+
| Pagination (border-t border-gray-200 px-6 py-4)                      |
|                                                                       |
| "Showing 1 to 50 of 1,234 companies"   [<] Page 1 of 25 [>]        |
+----------------------------------------------------------------------+
```

**Left side - Record count:**
- Style: `text-sm text-gray-600`
- Format: "Showing {start} to {end} of {total} companies"

**Right side - Page navigation:**
- Previous button: `ChevronLeft` icon, disabled when `page === 1`
- Page indicator: `text-sm text-gray-600` "Page {page} of {totalPages}"
- Next button: `ChevronRight` icon, disabled when `page === totalPages`
- Button style: `p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed`

**Default page size:** 50 records per page.

### 1.10 Table Row Interactions

**Row Hover:**
- Background: `hover:bg-gray-50 transition-colors`
- Three-dot menu becomes visible

**Row Click (on name):**
- Navigates to `/companies/{id}` (Company Detail Page)

**Checkbox Selection:**
- Individual: Toggles row selection
- Header checkbox: Select all on current page
- When all selected, show "Select all {total} companies" link above table

**Three-dot Menu (MoreHorizontal):**
```
+------------------------+
| View details           |
| Edit company           |
|------------------------|
| Assign owner           |
| Create deal            |
|------------------------|
| Delete (red text)      |
+------------------------+
```

### 1.11 Search Behavior

**Search Algorithm:**
1. User types in search input
2. Debounce timer starts (300ms)
3. After debounce, API call with `?search={query}`
4. API searches across: `name`, `domain`, `phone`
5. Search is case-insensitive
6. Page resets to 1
7. Results count updates in header
8. Loading indicator shows during fetch

**Search Scope:** Current view only (respects active tab and filters).

---

## Flow 2: Create Company

### 2.1 Trigger

- **Primary:** "Create company" button in page header
- **Secondary:** "Create your first company" link in empty state
- **Tertiary:** Quick-create from global search (future)

### 2.2 Form Presentation

**Type:** Right-side slide-in panel (SlidePanel component).

**Panel Structure:**
```
+-- Main Content (dimmed) --+-- SlidePanel (right) --------+
|                            |                               |
| (company list visible      | Create company          [X]  |
|  behind semi-transparent   |-------------------------------|
|  overlay)                  |                               |
|                            | Company name *                |
|                            | [                           ] |
|                            |                               |
|                            | Domain                        |
|                            | [                           ] |
|                            |                               |
|                            | Industry                      |
|                            | [Select industry         v  ] |
|                            |                               |
|                            | Company type                  |
|                            | [Select type             v  ] |
|                            |                               |
|                            | Company size                  |
|                            | [Select size             v  ] |
|                            |                               |
|                            | Annual revenue                |
|                            | [                           ] |
|                            |                               |
|                            | Phone                         |
|                            | [                           ] |
|                            |                               |
|                            | --- Address ---               |
|                            | Street address                |
|                            | [                           ] |
|                            | City           State          |
|                            | [            ] [            ] |
|                            | Country        Postal Code    |
|                            | [            ] [            ] |
|                            |                               |
|                            | --- CRM Settings ---          |
|                            | Company owner                 |
|                            | [Search owner           v  ] |
|                            |                               |
|                            | Lifecycle stage               |
|                            | [Select stage            v  ] |
|                            |                               |
|                            | Description                   |
|                            | [                           ] |
|                            | [                           ] |
|                            |                               |
|                            | --- Associations ---          |
|                            | Associated contacts           |
|                            | [Search contacts...        ] |
|                            | + John Doe (john@acme.com) X |
|                            |                               |
|                            |-------------------------------|
|                            | [Cancel]   [Create company]   |
|                            | [Create and add another]      |
+----------------------------+-------------------------------+
```

### 2.3 Form Fields

| # | Field | DB Column | Type | Required | Validation | Default |
|---|-------|-----------|------|----------|------------|---------|
| 1 | Company name | `name` | Text input | Yes | Min 1 char, max 255 chars | - |
| 2 | Domain | `domain` | Text input | No | URL format (auto-strips protocol) | - |
| 3 | Industry | `industry` | Dropdown select | No | Must be from predefined list | - |
| 4 | Company type | `type` | Dropdown select | No | Must be from predefined list | - |
| 5 | Company size | `size` | Dropdown select | No | Must be from predefined list | - |
| 6 | Annual revenue | `annualRevenue` | Currency input | No | Numeric, >= 0 | - |
| 7 | Phone | `phone` | Phone input | No | Phone format | - |
| 8 | Street address | `address` | Text input | No | Max 500 chars | - |
| 9 | City | `city` | Text input | No | Max 100 chars | - |
| 10 | State | `state` | Text input | No | Max 100 chars | - |
| 11 | Country | `country` | Dropdown / text | No | Max 100 chars | - |
| 12 | Postal code | `postalCode` | Text input | No | Max 20 chars | - |
| 13 | Company owner | `ownerId` | User search select | No | Must be valid user in tenant | Current user |
| 14 | Lifecycle stage | `lifecycleStage` | Dropdown select | No | Must be from predefined list | - |
| 15 | Description | `description` | Textarea | No | Max 5000 chars | - |
| 16 | Website | `website` | URL input | No | URL format | - |
| 17 | LinkedIn URL | `linkedinUrl` | URL input | No | LinkedIn URL format | - |

**Company Type Options:**
```typescript
const COMPANY_TYPES = [
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
  { value: "reseller", label: "Reseller" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
];
```

### 2.4 Association Section

**Associated Contacts:**
- Type: Multi-select search input
- Search: Queries contacts API by name/email
- Display: Selected contacts shown as removable chips
- Chip format: `{firstName} {lastName} ({email})` with `X` button
- Data stored: Creates `ContactCompany` join records with `isPrimary = false`

### 2.5 Validation Rules

**Client-side (Zod schema):**
```typescript
const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  domain: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  type: z.enum(["prospect", "partner", "reseller", "vendor", "other"]).optional(),
  size: z.string().optional(),
  annualRevenue: z.number().min(0).optional(),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  ownerId: z.string().uuid().optional(),
  lifecycleStage: z.string().optional(),
  description: z.string().max(5000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
});
```

**Validation Display:**
- Red border on invalid field: `border-red-500`
- Error message below field: `text-xs text-red-500 mt-1`
- Validation triggered on blur (field loses focus)
- Form-level validation on submit

**Duplicate Detection:**
- On domain blur: Check if domain already exists in tenant
- Warning (non-blocking): "A company with domain {domain} already exists. [View existing]"
- Style: `bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800`

### 2.6 Form Actions

| Button | Type | Position | Behavior |
|--------|------|----------|----------|
| Cancel | Secondary | Bottom-left | Closes panel, discards form data |
| Create company | Primary | Bottom-right | Validates + submits form |
| Create and add another | Tertiary link | Below action buttons | Submits, clears form, keeps panel open |

**After Successful Creation:**
- Toast notification: "Company created successfully" (success type, green)
- Panel closes
- Table refreshes to show new company
- New company appears at top if sorted by `createdAt desc`

**If "Create and add another":**
- Toast notification shown
- Form resets to empty state
- Panel stays open
- Focus moves to Company name field

### 2.7 SlidePanel Specs

- Width: `w-full max-w-lg` (512px)
- Animation: Slide in from right, 200ms ease-out
- Overlay: `bg-black/50` (semi-transparent black)
- Close triggers: X button, Cancel button, Overlay click, Escape key
- Z-index: 50 (modal level)
- Scroll: Internal scroll for form content, sticky header/footer

---

## Flow 3: Company Detail Page (3-Column RecordPage)

### 3.1 Route and Layout

```
Route: /companies/{id}
Component: CompanyDetailPage (src/app/(dashboard)/companies/[id]/page.tsx)
Layout: Three-column RecordPage
```

**Breadcrumb:**
```
Companies > {Company Name}
```
- "Companies" links back to `/companies`
- Style: `text-sm text-gray-500` with `ChevronRight` separator
- Company name: `text-sm text-gray-900 font-medium`

**Three-Column Layout:**
```
+--Left (300px fixed)--+--Center (flex-1)------+--Right (300px fixed)-+
|                       |                        |                      |
|  Company Info         |  Content Tabs          |  Associations        |
|                       |                        |                      |
+-----height: 100vh, overflow-y: auto (each column scrolls independently)--+
```

- Container: `flex h-[calc(100vh-64px)]` (subtract top nav height)
- Left sidebar: `w-[300px] min-w-[300px] border-r border-gray-200 overflow-y-auto`
- Center column: `flex-1 overflow-y-auto`
- Right sidebar: `w-[300px] min-w-[300px] border-l border-gray-200 overflow-y-auto`

### 3.2 Left Sidebar (300px)

**Structure:**
```
+-- Left Sidebar ---------------------+
| padding: p-6                         |
|                                      |
| [Company Avatar - 64px circle]       |
| Company Name (H2, bold)              |
| domain.com (link, gray)              |
|                                      |
| Quick Actions Row                    |
| [Note] [Email] [Call] [Task] [Meet]  |
|                                      |
| --- About this company --- [Edit]    |
| Industry:       Technology           |
| Company Type:   Prospect             |
| Company Size:   51-200               |
| Annual Revenue: $5,000,000           |
| Phone:          +1 (555) 123-4567    |
| Owner:          Sarah Johnson        |
| Lifecycle:      [Lead badge]         |
| City:           San Francisco        |
| Country:        United States        |
| Website:        www.acme.com         |
| LinkedIn:       linkedin.com/...     |
| Created:        Feb 5, 2026          |
|                                      |
| [View all properties]                |
+--------------------------------------+
```

**Company Avatar:**
- Size: `w-16 h-16` (64px)
- Shape: `rounded-full`
- Background: `bg-primary` (#0891b2)
- Text: First character of company name, `text-2xl font-bold text-white`
- Fallback: Always use initials (no logo upload in MVP)
- Centering: `flex items-center justify-center mx-auto`

**Company Name:**
- Style: `text-xl font-bold text-gray-900 text-center mt-3`
- Truncation: `truncate` if name exceeds container width

**Domain Link:**
- Style: `text-sm text-gray-500 text-center hover:text-primary`
- Behavior: Opens `https://{domain}` in new tab
- Icon: Small `ExternalLink` icon (12px) after text

**Quick Action Icons:**
```
+---+---+---+---+---+
| N | E | C | T | M |
+---+---+---+---+---+
```
- Container: `flex items-center justify-center gap-2 mt-4 mb-6`
- Each button: `p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary`
- Icon size: `w-5 h-5`

| Icon | Lucide Name | Tooltip | Action |
|------|-------------|---------|--------|
| Note | `StickyNote` | "Log note" | Opens note composer in center column |
| Email | `Mail` | "Log email" | Opens email composer in center column |
| Call | `Phone` | "Log call" | Opens call logger in center column |
| Task | `CheckSquare` | "Create task" | Opens task form in center column |
| Meeting | `Calendar` | "Log meeting" | Opens meeting logger in center column |

**About This Company Card:**
- Header: `text-sm font-semibold text-gray-900 uppercase tracking-wider` "About this company"
- Container: `bg-white rounded-lg border border-gray-200 p-4 mt-2`
- Properties list: Vertical key-value pairs

**Property Row Layout:**
```
+--------------------------------------------+
| Label          Value                 [Edit] |
+--------------------------------------------+
```
- Label: `text-xs text-gray-500 font-medium mb-0.5`
- Value: `text-sm text-gray-900`
- Edit icon: Appears on hover (pencil icon, `w-3 h-3 text-gray-400`)
- Row padding: `py-2`
- Separator: `border-b border-gray-100` (except last item)

**Properties Displayed (default order):**
1. Industry (text or badge)
2. Company Type (text)
3. Company Size (text)
4. Annual Revenue (formatted currency: "$5,000,000")
5. Phone (formatted phone)
6. Owner (avatar + name)
7. Lifecycle Stage (colored badge, same as contacts)
8. City (text)
9. Country (text)
10. Website (link)
11. LinkedIn (link)
12. Created Date (formatted: "Feb 5, 2026")

**"View all properties" Link:**
- Style: `text-sm text-primary hover:text-primary/80 font-medium`
- Position: Bottom of "About" card
- Action: Opens full property sheet (modal or expanded card)

### 3.3 Center Column (flex-1)

**Tab Bar:**
```
+---------------------------------------------+
| [Overview] [Activities]                      |
+---------------------------------------------+
```
- Container: `border-b border-gray-200 px-6`
- Tab: `px-4 py-3 text-sm font-medium`
- Active tab: `text-primary border-b-2 border-primary`
- Inactive tab: `text-gray-500 hover:text-gray-700 border-b-2 border-transparent`

**Overview Tab Content:**
- Shows key summary cards
- "Recent Activity" section with last 5 activities
- "Associated Records" summary (contacts count, deals count)
- Empty state if no activities: "No activity yet. Log your first interaction."

**Activities Tab Content:**
```
+-- Activities Tab ------------------------------------------+
| Activity Composer (sticky top)                             |
| +-- Composer Bar ----------------------------------+      |
| | [Note] [Email] [Call] [Task] [Meeting]           |      |
| +--------------------------------------------------+      |
|                                                            |
| +-- Filter Bar ----------------------------------------+  |
| | [All] [Emails] [Calls] [Tasks] [Meetings] [Notes]   |  |
| | Filter by: [All Users v]                             |  |
| | [Expand All] [Collapse All]                          |  |
| +------------------------------------------------------+  |
|                                                            |
| +-- Timeline Entries ---------------------------------+   |
| |                                                     |   |
| | [Timeline connector line - left side]               |   |
| |                                                     |   |
| | [Note icon] Note added by Sarah Johnson             |   |
| | Feb 5, 2026 at 2:30 PM                              |   |
| | "Initial contact with decision maker..."            |   |
| |                                                     |   |
| | [Call icon] Call logged by Mike Chen                 |   |
| | Feb 4, 2026 at 10:15 AM | Duration: 12 min         |   |
| | Outcome: Connected                                  |   |
| |                                                     |   |
| +-----------------------------------------------------+   |
|                                                            |
| +-- Empty State (if no activities) -------------------+   |
| |         [Clock icon]                                |   |
| |    No activities yet                                |   |
| |    Log a note, call, or email to get started        |   |
| +-----------------------------------------------------+   |
+------------------------------------------------------------+
```

**Activity Timeline Entry:**
- Container: `relative pl-8 pb-6`
- Timeline line: `absolute left-3 top-8 bottom-0 w-px bg-gray-200`
- Timeline dot: `absolute left-1.5 top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white`
- Type icon: `w-4 h-4` in timeline dot area, color varies by type
- Header: `text-sm font-medium text-gray-900`
- Timestamp: `text-xs text-gray-500`
- Body: `text-sm text-gray-600 mt-1`

**Activity Type Colors:**
| Type | Dot Color | Icon |
|------|-----------|------|
| Note | `bg-gray-400` | `StickyNote` |
| Email | `bg-blue-400` | `Mail` |
| Call | `bg-green-400` | `Phone` |
| Task | `bg-orange-400` | `CheckSquare` |
| Meeting | `bg-purple-400` | `Calendar` |

### 3.4 Right Sidebar (300px)

**Structure:**
```
+-- Right Sidebar --------------------+
| padding: p-6                         |
|                                      |
| +-- Contacts Card --------- [+Add]-+|
| | [Avatar] John Doe               X ||
| |   john@acme.com                   ||
| |   Marketing Manager               ||
| |   Primary                         ||
| |                                   ||
| | [Avatar] Jane Smith              X ||
| |   jane@acme.com                   ||
| |   Sales Director                  ||
| +-----------------------------------+|
|                                      |
| +-- Deals Card ------------ [+Add]-+|
| | Enterprise Deal                   ||
| |   $50,000 | Qualified to Buy      ||
| |   Close: Mar 15, 2026             ||
| |                                   ||
| | Starter Package                   ||
| |   $5,000 | Presentation           ||
| |   Close: Feb 28, 2026             ||
| +-----------------------------------+|
|                                      |
| +-- Tickets Card ---------- [+Add]-+|
| |   No tickets yet                  ||
| |   [+ Create ticket]              ||
| +-----------------------------------+|
+--------------------------------------+
```

**Association Card (generic structure):**
- Container: `bg-white rounded-lg border border-gray-200 mb-4`
- Header: `flex items-center justify-between px-4 py-3 border-b border-gray-100`
- Title: `text-sm font-semibold text-gray-900`
- Add button: `text-sm text-primary hover:text-primary/80 font-medium` with `Plus` icon (14px)
- Content: `p-4`
- Empty state: `text-sm text-gray-500 text-center py-4`

**Contacts Association Card:**
- Each contact entry:
  - Avatar: `w-8 h-8 rounded-full bg-primary text-white text-xs font-medium`
  - Name: `text-sm font-medium text-gray-900 hover:text-primary` (links to `/contacts/{id}`)
  - Email: `text-xs text-gray-500`
  - Role/Title: `text-xs text-gray-400`
  - Primary badge: `text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full` (if `isPrimary`)
  - Remove button: `X` icon, `w-4 h-4 text-gray-400 hover:text-red-500` (appears on hover)
- Separator between entries: `border-b border-gray-50`
- Maximum displayed: 5, then "View all {count} contacts" link
- "+Add" button opens contact search dropdown

**Deals Association Card:**
- Each deal entry:
  - Deal name: `text-sm font-medium text-gray-900 hover:text-primary` (links to `/deals/{id}`)
  - Amount + Stage: `text-xs text-gray-500`
  - Close date: `text-xs text-gray-400`
- "+Add" button opens deal search/create dropdown

**Tickets Association Card:**
- Placeholder for future implementation
- Empty state with "Create ticket" CTA

### 3.5 Loading State

**Page Skeleton:**
```
+--Left Skeleton--+--Center Skeleton--+--Right Skeleton--+
| [circle pulse]  | [tab bar pulse]   | [card pulse]     |
| [lines pulse]   | [timeline pulse]  | [card pulse]     |
| [card pulse]    |                    | [card pulse]     |
+--animate-pulse across all three columns-----------------+
```

---

## Flow 4: Edit Company

### 4.1 Inline Editing (Detail Page)

**Trigger:** Click on any property value in the "About this company" card.

**Behavior:**
1. User hovers over a property row - Edit (pencil) icon appears on right
2. User clicks the value or the edit icon
3. Value transforms into an editable input (text input, dropdown, etc.)
4. User modifies the value
5. User clicks outside (blur) or presses Enter
6. Auto-save: API call `PATCH /api/companies/{id}` with changed field
7. Optimistic UI update (show new value immediately)
8. If save fails: Revert to old value, show error toast

**Inline Edit Transformations by Field Type:**
| Field Type | Edit Control |
|-----------|-------------|
| Text (name, phone, address) | `<input type="text">` replaces value |
| URL (domain, website, linkedin) | `<input type="url">` replaces value |
| Dropdown (industry, type, size, lifecycle) | `<select>` dropdown replaces value |
| Currency (annualRevenue) | `<input type="number">` with currency prefix |
| User (owner) | Search-select dropdown |

**Edit Input Styling:**
- Style: `w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20`
- Transition: Smooth border appearance, 150ms

**Auto-save Indicator:**
- While saving: Small spinner icon next to field (Lucide `Loader2`, `w-3 h-3 animate-spin`)
- Success: Brief green checkmark flash (200ms)
- Error: Red border + toast notification

### 4.2 Full Property Editor

**Trigger:** "View all properties" link at bottom of About card.

**Presentation:** Modal or slide-in panel.

**Layout:**
```
+-- View All Properties --------------------------------+
| All Properties                                   [X]  |
|-------------------------------------------------------|
| Search properties: [                              ]   |
|                                                       |
| --- General Information ---                           |
| Company name    | [Acme Corporation              ]   |
| Domain          | [acme.com                       ]   |
| Description     | [Leading tech company...        ]   |
|                                                       |
| --- Company Details ---                               |
| Industry        | [Technology                   v ]   |
| Type            | [Prospect                    v ]   |
| Size            | [51-200 employees            v ]   |
| Annual Revenue  | [$ 5,000,000                   ]   |
|                                                       |
| --- Contact Information ---                           |
| Phone           | [+1 (555) 123-4567             ]   |
| Website         | [https://acme.com              ]   |
| LinkedIn        | [https://linkedin.com/...      ]   |
|                                                       |
| --- Address ---                                       |
| Street          | [123 Main St                   ]   |
| City            | [San Francisco                 ]   |
| State           | [CA                            ]   |
| Country         | [United States                 ]   |
| Postal Code     | [94105                         ]   |
|                                                       |
| --- CRM ---                                           |
| Owner           | [Sarah Johnson               v ]   |
| Lifecycle Stage | [Lead                        v ]   |
| Created Date    | Feb 5, 2026 (read-only)          |
| Last Modified   | Feb 7, 2026 (read-only)          |
|                                                       |
|-------------------------------------------------------|
| [Cancel]                              [Save changes]  |
+-------------------------------------------------------+
```

**Property Groups:**
- Section headers: `text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6`
- First group has no top margin

---

## Flow 5: Delete Company

### 5.1 Trigger Points

| Location | Trigger | Type |
|----------|---------|------|
| List page - bulk action | Select rows + click "Delete" | Bulk soft delete |
| List page - row menu | Three-dot menu > "Delete" | Single soft delete |
| Detail page | Actions menu > "Delete company" | Single soft delete |

### 5.2 Confirmation Modal

**Structure:**
```
+-- Delete Confirmation Modal ------------------+
|                                                |
|   [Warning Icon - red triangle]                |
|                                                |
|   Delete company?                              |
|                                                |
|   Are you sure you want to delete              |
|   "Acme Corporation"? This action cannot       |
|   be undone.                                   |
|                                                |
|   [Cancel]                  [Delete company]   |
+------------------------------------------------+
```

**For Bulk Delete:**
```
   Delete {count} companies?

   Are you sure you want to delete {count}
   companies? This action cannot be undone.

   [Cancel]               [Delete {count} companies]
```

**Modal Specs:**
- Width: `max-w-md` (~400px)
- Padding: `p-6`
- Background: `bg-white rounded-xl shadow-2xl`
- Overlay: `bg-black/50`
- Z-index: 50

**Warning Icon:**
- Lucide: `AlertTriangle`
- Style: `w-12 h-12 text-red-500 mx-auto mb-4`

**Title:**
- Style: `text-lg font-semibold text-gray-900 text-center`

**Message:**
- Style: `text-sm text-gray-600 text-center mt-2`

**Buttons:**
| Button | Style | Action |
|--------|-------|--------|
| Cancel | `px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50` | Close modal |
| Delete company | `px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600` | Execute soft delete |

### 5.3 Soft Delete Implementation

**API Call:**
```
PATCH /api/companies/{id}
Body: { "deletedAt": "2026-02-07T10:00:00Z" }
```
- Sets `deleted_at` to current timestamp
- Does NOT remove the record from the database
- All queries filter by `WHERE deleted_at IS NULL`

**After Deletion:**
- Modal closes
- Toast notification: "Company deleted" with "Undo" action link
- Toast type: Success (green left border)
- Toast auto-dismiss: 5 seconds
- "Undo" action: Sets `deleted_at` back to NULL

**Navigation After Delete:**
- From list page: Row removed from table, count updates
- From detail page: Redirect to `/companies` list

---

## Flow 6: Company-Contact Association

### 6.1 Auto-Association by Email Domain

**Logic:**
1. When a new contact is created with an email (e.g., `john@acme.com`)
2. System extracts the domain part (`acme.com`)
3. Looks up companies with matching `domain` field
4. If found: Creates `ContactCompany` record with `isPrimary = false`
5. If multiple matches: Associate with the first match (most recently created)

**Implementation:**
- Runs server-side in `POST /api/contacts` handler
- Does not override existing associations
- Can be disabled per tenant (future setting)

### 6.2 Manual Association (Right Sidebar)

**Trigger:** Click "+Add" button on Contacts association card in right sidebar.

**Search Dropdown:**
```
+-- Add Contact Dropdown --------------------+
| Search contacts: [                       ] |
|--------------------------------------------|
| [Avatar] John Doe                          |
|   john@acme.com                            |
|                                            |
| [Avatar] Jane Smith                        |
|   jane@company.co                          |
|                                            |
| [Avatar] Bob Johnson                       |
|   bob@test.com                             |
|                                            |
| --- No results? ---                        |
| [+ Create new contact]                     |
+--------------------------------------------+
```

**Dropdown Specs:**
- Width: Same as card (fills right sidebar)
- Position: Below "+Add" button
- Max height: `max-h-64` (256px, then scroll)
- Search: Debounced (300ms), searches contact name and email
- Results: Show avatar, full name, email
- Each result: `px-3 py-2 hover:bg-gray-50 cursor-pointer`
- Create new: `px-3 py-2 text-primary font-medium hover:bg-primary/5`

**After Selection:**
- API call: `POST /api/companies/{companyId}/contacts` with `{ contactId, isPrimary: false }`
- Contact appears in association card immediately (optimistic update)
- Toast: "{Contact name} added to {Company name}"

### 6.3 Association Labels

**Stored in:** `ContactCompany.role` field.

**Available Roles:**
```typescript
const ASSOCIATION_ROLES = [
  { value: "employee", label: "Employee" },
  { value: "owner", label: "Owner" },
  { value: "decision_maker", label: "Decision Maker" },
  { value: "billing", label: "Billing Contact" },
  { value: "champion", label: "Champion" },
  { value: "influencer", label: "Influencer" },
  { value: "blocker", label: "Blocker" },
  { value: "end_user", label: "End User" },
];
```

**Primary Toggle:**
- Each contact in association card has a "Set as primary" option
- Only one contact can be `isPrimary = true` per company
- Primary contact shows a badge: "Primary"
- Toggle: Click three-dot menu on contact entry > "Set as primary"

### 6.4 Removing Association

**Trigger:** Click `X` icon on contact entry in association card (appears on hover).

**Behavior:**
- Confirmation: None for removing association (non-destructive; contact still exists)
- API call: `DELETE /api/companies/{companyId}/contacts/{contactId}`
- Removes `ContactCompany` join record
- Contact entry removed from card (optimistic update)
- Toast: "Association removed"

---

## Component Specifications

### CS-1: CompaniesTable Component

```
File: src/components/companies/CompaniesTable.tsx
Type: Client Component ("use client")
```

**Props:** None (fetches data internally, similar to ContactsTable).

**Internal State:**
```typescript
// Data
const [companies, setCompanies] = useState<Company[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Filters
const [searchQuery, setSearchQuery] = useState("");
const [selectedIndustry, setSelectedIndustry] = useState("");
const [selectedSize, setSelectedSize] = useState("");
const [selectedOwner, setSelectedOwner] = useState("");
const [selectedLifecycleStage, setSelectedLifecycleStage] = useState("");
const [showFilters, setShowFilters] = useState(false);

// Pagination
const [page, setPage] = useState(1);
const [limit] = useState(50);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(0);

// Sorting
const [sortField, setSortField] = useState<SortField>("createdAt");
const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

// Bulk selection
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// View tabs
const [activeView, setActiveView] = useState<string>("all");
```

**Type Definition:**
```typescript
type Company = {
  id: string;
  name: string;
  domain: string | null;
  phone: string | null;
  industry: string | null;
  size: string | null;
  annualRevenue: number | null;
  lifecycleStage: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  _count?: {
    contacts: number;
    deals: number;
  };
};

type SortField = "name" | "domain" | "industry" | "createdAt";
type SortOrder = "asc" | "desc";
```

### CS-2: CreateCompanyPanel Component

```
File: src/components/companies/CreateCompanyPanel.tsx
Type: Client Component ("use client")
```

**Props:**
```typescript
type CreateCompanyPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (company: Company) => void;
};
```

**Dimensions:**
- Panel width: `w-full max-w-lg` (512px)
- Header height: 56px
- Footer height: 64px
- Content: Scrollable between header and footer

### CS-3: CompanyDetailPage Component

```
File: src/app/(dashboard)/companies/[id]/page.tsx
Type: Server Component (with client sub-components)
```

**Sub-components:**
```
CompanyDetailPage (Server)
  +-- CompanyLeftSidebar (Client)
  |   +-- CompanyAvatar
  |   +-- QuickActions
  |   +-- AboutCard
  |   +-- InlineEditField
  +-- CompanyCenterColumn (Client)
  |   +-- TabBar
  |   +-- OverviewTab
  |   +-- ActivitiesTab
  |   |   +-- ActivityComposer
  |   |   +-- ActivityTimeline
  |   |   +-- ActivityEntry
  +-- CompanyRightSidebar (Client)
      +-- AssociationCard (generic)
      +-- ContactAssociationCard
      +-- DealAssociationCard
      +-- TicketAssociationCard (placeholder)
```

### CS-4: Design Tokens (Companies-specific)

**Avatar Colors (company initials):**
```typescript
// Deterministic color based on company name hash
const AVATAR_COLORS = [
  "#0891b2", // primary (cyan-600)
  "#0ea5e9", // sky-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
  "#f43f5e", // rose-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
];

function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
```

**Industry Badge Colors:**
```typescript
const INDUSTRY_COLORS: Record<string, string> = {
  "Technology": "bg-blue-50 text-blue-700",
  "Finance": "bg-green-50 text-green-700",
  "Healthcare": "bg-red-50 text-red-700",
  "Education": "bg-purple-50 text-purple-700",
  "Manufacturing": "bg-orange-50 text-orange-700",
  "Retail": "bg-pink-50 text-pink-700",
  "default": "bg-gray-50 text-gray-700",
};
```

### CS-5: Spacing & Layout Constants

| Element | Value | Tailwind |
|---------|-------|----------|
| Page padding | 24px horizontal, 32px top | `p-6 pt-8` |
| Section gap | 24px | `mb-6` |
| Card padding | 16px | `p-4` |
| Card border radius | 12px | `rounded-xl` |
| Table row height | 52px | `py-3` (with cell padding) |
| Left sidebar width | 300px | `w-[300px]` |
| Right sidebar width | 300px | `w-[300px]` |
| SlidePanel width | 512px | `max-w-lg` |
| Modal max-width | 400px (confirm), 600px (form) | `max-w-md`, `max-w-xl` |
| Button height | 36px (default), 28px (small) | `py-2`, `py-1.5` |
| Input height | 36px | `py-2` |
| Avatar (table) | 32px | `w-8 h-8` |
| Avatar (detail) | 64px | `w-16 h-16` |
| Icon (default) | 16px | `w-4 h-4` |
| Icon (action) | 20px | `w-5 h-5` |

---

## State Management

### SM-1: Data Fetching Strategy

**List Page:**
- Fetch on mount: `GET /api/companies?page=1&limit=50`
- Re-fetch on: page change, search change (debounced), filter change, sort change
- Optimistic updates for: bulk delete, single delete
- Cache invalidation: After create, edit, delete

**Detail Page:**
- Fetch on mount: `GET /api/companies/{id}?include=owner,contacts,deals`
- Activities: Separate fetch `GET /api/activities?companyId={id}&limit=20`
- Re-fetch on: inline edit save, activity logged, association change

### SM-2: URL State Sync

**Query Parameters (List Page):**
```
/companies?page=1&search=acme&industry=Technology&size=51-200&owner=uuid&view=all&sort=name&order=asc
```

| Param | Type | Default |
|-------|------|---------|
| page | number | 1 |
| search | string | "" |
| industry | string | "" |
| size | string | "" |
| owner | string (UUID) | "" |
| lifecycleStage | string | "" |
| view | string | "all" |
| sort | string | "createdAt" |
| order | "asc" / "desc" | "desc" |

### SM-3: Optimistic Updates

| Action | Optimistic Behavior | Rollback on Error |
|--------|--------------------|--------------------|
| Delete (single) | Remove row from table immediately | Re-add row, show error toast |
| Delete (bulk) | Remove selected rows immediately | Re-add rows, show error toast |
| Inline edit | Show new value immediately | Revert to old value, show error toast |
| Create | Close panel, refresh list | Show error toast, re-open panel with form data |
| Association add | Add entry to card immediately | Remove entry, show error toast |
| Association remove | Remove entry from card immediately | Re-add entry, show error toast |

---

## API Contract

### API-1: List Companies

```
GET /api/companies

Query Parameters:
  page: number (default: 1)
  limit: number (default: 50, max: 100)
  search: string (searches name, domain, phone)
  industry: string
  size: string
  ownerId: string (UUID)
  lifecycleStage: string
  sortField: string (default: "createdAt")
  sortOrder: "asc" | "desc" (default: "desc")

Response:
{
  data: Company[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

Security: WHERE tenant_id = currentUser.tenantId AND deleted_at IS NULL
```

### API-2: Get Company

```
GET /api/companies/{id}

Query Parameters:
  include: string (comma-separated: "owner,contacts,deals,activities")

Response:
{
  data: Company & {
    owner?: User,
    contacts?: (ContactCompany & { contact: Contact })[],
    deals?: (DealCompany & { deal: Deal })[],
    activities?: Activity[]
  }
}

Security: WHERE id = {id} AND tenant_id = currentUser.tenantId AND deleted_at IS NULL
```

### API-3: Create Company

```
POST /api/companies

Body: CreateCompanyInput (validated by Zod)

Response:
{
  data: Company
}

Security: tenant_id set from currentUser.tenantId, createdBy set from currentUser.id
```

### API-4: Update Company

```
PATCH /api/companies/{id}

Body: Partial<UpdateCompanyInput> (validated by Zod)

Response:
{
  data: Company
}

Security: WHERE id = {id} AND tenant_id = currentUser.tenantId AND deleted_at IS NULL
updatedBy set from currentUser.id
```

### API-5: Delete Company (Soft)

```
DELETE /api/companies/{id}

Response:
{
  data: { id: string, deletedAt: string }
}

Security: WHERE id = {id} AND tenant_id = currentUser.tenantId AND deleted_at IS NULL
Sets deleted_at = NOW()
```

### API-6: Company Associations

```
GET /api/companies/{id}/contacts
POST /api/companies/{id}/contacts
  Body: { contactId: string, isPrimary?: boolean, role?: string }
DELETE /api/companies/{id}/contacts/{contactId}

GET /api/companies/{id}/deals
POST /api/companies/{id}/deals
  Body: { dealId: string, isPrimary?: boolean }
DELETE /api/companies/{id}/deals/{dealId}

Security: All endpoints verify tenant_id ownership
```

---

## Responsive Behavior

### RB-1: Breakpoint Adaptations

**Desktop (>= 1280px):**
- Full three-column layout on detail page
- Table with all columns visible
- Slide-in panel at 512px width

**Tablet (768px - 1279px):**
- Detail page: Two columns (left sidebar + center), right sidebar toggleable via button
- Table: Hide some columns (Domain, Created Date), show as expandable row
- Slide-in panel: Full width minus 64px

**Mobile (< 768px):**
- Detail page: Single column, stacked (left sidebar on top, then center, right sidebar collapsed)
- Table: Card layout instead of table rows
- Slide-in panel: Full screen
- Filters: Collapsible accordion
- Pagination: Simplified (prev/next only, no page numbers)

### RB-2: Mobile Company Card Layout

```
+--Company Card (replaces table row)--+
| [Avatar] Acme Corporation        ... |
|   acme.com                           |
|   Technology | 51-200                |
|   Owner: Sarah Johnson              |
|   Created: 2 days ago               |
+--------------------------------------+
```
- Style: `rounded-lg border border-gray-200 p-4 mb-3`
- Three-dot menu: Top-right corner

### RB-3: Mobile Detail Page

```
+--Mobile Detail Layout--+
| [< Companies]          |
| [Avatar] Acme Corp     |
| [Note] [Email] [Call]  |
|                        |
| [About] [expand v]     |
| Industry: Technology   |
| Phone: +1-555-1234     |
| Owner: Sarah           |
|                        |
| [Contacts (3)] [>]     |
| [Deals (2)] [>]        |
|                        |
| [Activities]           |
| [Timeline entries...]  |
+------------------------+
```

---

## Implementation Checklist

### Phase 1: List Page
- [ ] CompaniesTable component (mirror ContactsTable patterns)
- [ ] Companies API route (`GET /api/companies`)
- [ ] Search and filter functionality
- [ ] Sorting (client-side initially, migrate to server-side)
- [ ] Pagination
- [ ] Bulk selection and actions
- [ ] Export to CSV
- [ ] View tabs (All, My Companies)

### Phase 2: Create Company
- [ ] CreateCompanyPanel component
- [ ] Create company API route (`POST /api/companies`)
- [ ] Form validation (Zod)
- [ ] Duplicate domain detection
- [ ] Contact association during creation
- [ ] "Create and add another" flow

### Phase 3: Detail Page
- [ ] Three-column RecordPage layout
- [ ] Left sidebar with company info
- [ ] Quick action icons
- [ ] About card with inline editing
- [ ] Center column with tabs
- [ ] Activity timeline (read-only initially)
- [ ] Right sidebar with association cards
- [ ] Contact association management

### Phase 4: Edit & Delete
- [ ] Inline editing with auto-save
- [ ] Full property editor
- [ ] Soft delete with confirmation modal
- [ ] Undo delete (toast action)
- [ ] Bulk delete

### Phase 5: Associations
- [ ] Auto-association by email domain
- [ ] Manual contact association (+Add)
- [ ] Association roles/labels
- [ ] Primary contact toggle
- [ ] Deal association management

---

> **Document Status:** Complete
> **Last Updated:** 2026-02-07
> **Total Flows:** 6 major user flows, 40+ sub-sections
> **Referenced From:** HubSpot UX Patterns (ux-patterns.md), ContactsTable.tsx, DESIGN_SYSTEM.md, prisma/schema.prisma
> **Usage:** Implementation guide for F-CORE Companies feature development
