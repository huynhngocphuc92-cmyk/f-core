# Contacts Page - UX Patterns

> **Date**: 2026-02-08
> **Role**: UX Analyst
> **Feature**: Contacts Page Enhancement

---

## 1. Contact Detail Page (RecordPage)

### Layout: 3-Column Desktop

```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Contacts    Contact Name    [Actions ▼] [Edit]│
├─────────────┬────────────────────────┬───────────────────┤
│  LEFT (300) │   CENTER (flex-1)      │  RIGHT (300)      │
│             │                        │                   │
│ [Avatar]    │ [Overview] [Activity]  │ ┌─── Companies ──┐│
│ Name        │                        │ │ TechCorp Inc   ││
│ Email       │ Activity Timeline      │ │ + Associate    ││
│ Phone       │ ┌─────────────────┐   │ └────────────────┘│
│             │ │ Email sent      │   │                   │
│ ── About ── │ │ 2h ago          │   │ ┌─── Deals ──────┐│
│ Lifecycle   │ └─────────────────┘   │ │ Enterprise     ││
│ Lead Status │ ┌─────────────────┐   │ │ $50,000        ││
│ Job Title   │ │ Note added      │   │ │ + Associate    ││
│ Department  │ │ Yesterday       │   │ └────────────────┘│
│ Owner       │ └─────────────────┘   │                   │
│ Company     │                        │                   │
│ Created     │                        │                   │
│ [View all]  │                        │                   │
├─────────────┴────────────────────────┴───────────────────┤
```

### Responsive Breakpoints
- **Desktop** (>=1280px): 3-column as above
- **Tablet** (768-1279px): 2-column (center + collapsible left/right toggle)
- **Mobile** (<768px): Single column, stacked cards

### Left Sidebar - About Card
- Avatar: 64px circle with initials (first + last name initial)
- Name: text-xl font-bold
- Email: clickable mailto link
- Phone: clickable tel link
- Quick actions row: Email, Call, Log Activity buttons (icon-only, 32px)
- About card: key-value pairs, click-to-edit on each field
- Fields: Lifecycle Stage (badge), Lead Status, Job Title, Department, Owner, Phone, Mobile, Website, Address
- "View all properties" link at bottom

### Center - Tabs + Timeline
- Tab bar: Overview | Activity | Notes
- Overview tab: Summary cards + recent activity
- Activity tab: Full chronological timeline
  - Each entry: icon (left) + type label + description + timestamp
  - Types: Email (blue), Call (green), Meeting (purple), Note (yellow), Task (orange)
  - Filter dropdown: All types, Emails, Calls, Meetings, Notes, Tasks
- Notes tab: Rich text notes with add note button

### Right Sidebar - Association Cards
- Companies card: List of associated companies with name + domain
  - "+ Associate" button opens search dropdown
  - Star icon for primary company
  - X button to remove association
- Deals card: List of associated deals with name + amount + stage badge
  - "+ Associate" button
- Each card: header with count badge, collapsible body

---

## 2. Contact Form (Slide-in Panel)

### Layout
- Position: Fixed right, 512px width, full height
- Overlay: bg-black/30 behind panel
- Header: Icon + "Create Contact" title + X close button
- Body: Scrollable form sections
- Footer: Cancel + Create button (sticky at bottom)

### Form Sections

#### Section 1: Personal Information
| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| First Name | text | No | e.g. John |
| Last Name | text | No | e.g. Doe |
| Email | email | Yes* | e.g. john@example.com |
| Phone | tel | No | e.g. +1 (555) 123-4567 |
| Mobile Phone | tel | No | e.g. +1 (555) 987-6543 |

*Email is required as the primary identifier for contacts

#### Section 2: Professional Details
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Job Title | text | No | e.g. VP of Sales |
| Department | text | No | e.g. Engineering |
| Lifecycle Stage | select | No | Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist |
| Lead Status | select | No | New, Open, In Progress, Open Deal, Unqualified, Attempted to Contact, Connected, Bad Timing |

#### Section 3: Company Association
| Field | Type | Required |
|-------|------|----------|
| Company | search-select | No |

- Autocomplete search by company name or domain
- Shows company name + domain in dropdown
- Creates ContactCompany junction record on submit

#### Section 4: Address
| Field | Type | Required |
|-------|------|----------|
| Street Address | text | No |
| City | text | No |
| State | text | No |
| Country | text | No |
| Postal Code | text | No |

### Validation Rules
- Email: format validation (regex or type="email")
- At least one of firstName, lastName, or email should be provided
- Show inline error messages below fields

### Submit Behavior
- POST to /api/contacts
- On success: close panel, refresh table, show success toast
- On error: show error message in form
- Loading state: "Creating..." on button, disabled

---

## 3. Enhanced Contact List View

### Current State (ContactsTable.tsx)
- Search bar (name, email search)
- Lifecycle stage filter
- Sortable columns (name, email, lifecycle, created)
- Bulk select + bulk delete
- CSV export
- Pagination (50/page)

### Enhancements Needed

#### 3.1 Column Updates
| Column | Current | Enhanced |
|--------|---------|----------|
| Name | firstName + lastName | Avatar + full name + email preview |
| Email | email | Keep as-is |
| Phone | phone | Keep as-is |
| Company | NOT SHOWN | Primary company name (from association) |
| Lifecycle | badge | Keep as-is |
| Lead Status | NOT SHOWN | Badge with color |
| Owner | name | Keep as-is |
| Created | NOT SHOWN | Date formatted |
| Actions | Non-functional MoreHorizontal | Working dropdown menu |

#### 3.2 Filter Enhancements
- Add Lead Status dropdown filter
- Add Owner dropdown filter (populated from API)

#### 3.3 Row Actions Dropdown
- View details → navigates to /contacts/[id]
- Edit → opens slide-in form with pre-filled data
- Delete → confirmation dialog → soft delete

#### 3.4 Create Button
- Change from `<Link href="/contacts/new">` to button that opens ContactForm slide-in
- Matches CompaniesTable pattern

#### 3.5 Export Enhancement
- Export selected (when items selected) or all visible

---

## 4. Association Management

### Associate Contact with Company
1. User clicks "+ Associate" on Companies card (detail page)
2. Search dropdown appears with text input
3. User types company name → autocomplete results
4. User selects company → POST /api/contacts/[id]/associations
5. Company appears in association card
6. First company auto-set as primary (star icon filled)

### Remove Association
1. User hovers association card item → X button appears
2. User clicks X → confirmation: "Remove association with [Company]?"
3. Confirm → DELETE /api/contacts/[id]/associations/[companyId]
4. Item removed from card

### API Endpoints Needed
- `POST /api/contacts/[id]/associations` - { type: "company", targetId: "..." }
- `DELETE /api/contacts/[id]/associations/[associationId]`
- `GET /api/contacts/[id]` - already includes associations via include

---

## 5. Activity Timeline

### Display
- Chronological list, newest first
- Each entry:
  ```
  [Icon] [Type Label] · [Relative time]
  [Description/subject line]
  [Preview of content - truncated to 2 lines]
  ```
- Activity type colors:
  - Email: blue (bg-blue-50, text-blue-700)
  - Call: green (bg-green-50, text-green-700)
  - Meeting: purple (bg-purple-50, text-purple-700)
  - Note: yellow (bg-yellow-50, text-yellow-700)
  - Task: orange (bg-orange-50, text-orange-700)

### Filter
- Dropdown: "All activities" | Emails | Calls | Meetings | Notes | Tasks

### Empty State
- Icon: Clock or Activity
- Text: "No activities yet"
- CTA: "Log your first activity"

---

## 6. States Reference

### Loading States
- Table: Skeleton rows (pulse animation)
- Detail page: Skeleton cards per column
- Form submit: Button shows "Creating..." / "Saving..."

### Error States
- Table: Red text + Retry button
- Detail page: Error card with retry
- Form: Inline error messages per field + top-level error banner

### Empty States
- Table: Users icon + "No contacts found" + "Create your first contact" CTA
- Timeline: Clock icon + "No activities yet"
- Associations: "No companies associated" + "+ Associate" button

---

## 7. Accessibility

- All interactive elements: keyboard navigable (Tab order)
- Form inputs: associated labels with htmlFor
- Buttons: aria-label for icon-only buttons
- Dropdown menus: aria-expanded, aria-controls
- Status badges: aria-label with full text (not just color)
- Focus visible: ring-2 ring-primary on all focusable elements
- Screen reader: sr-only text for visual-only information
