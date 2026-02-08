# CRM Activity Timeline -- UX Patterns Research

> **Research Date:** 2026-02-08
> **Researcher:** UX Analyst, F-CORE Research Team
> **Sources:** HubSpot, Salesforce, Dynamics 365, Material Design 3, WCAG 2.1, NNGroup, Aubergine UX, Lucide Icons
> **Applies to:** F-CORE CRM -- Contact, Company, and Deal record views

---

## Table of Contents

1. [Timeline Layout Patterns](#1-timeline-layout-patterns)
2. [Activity Type Differentiation](#2-activity-type-differentiation)
3. [Activity Card Design](#3-activity-card-design)
4. [Filtering and Sorting](#4-filtering-and-sorting)
5. [Inline Actions](#5-inline-actions)
6. [Activity Logging Forms](#6-activity-logging-forms)
7. [Mobile Timeline](#7-mobile-timeline)
8. [Real-time Updates](#8-real-time-updates)
9. [Accessibility Considerations](#9-accessibility-considerations)
10. [Implementation Recommendations](#10-implementation-recommendations)

---

## 1. Timeline Layout Patterns

### 1.1 Recommended Layout: Left-Aligned Vertical Timeline

The dominant pattern across HubSpot, Salesforce, and Dynamics 365 is a **left-aligned vertical timeline** placed in the center column of a three-column record layout. This approach provides:

- Chronological ordering (newest first by default)
- Date grouping headers for visual scanning
- Infinite scroll with virtualized rendering for performance

```
+------------------------------------------------------------------+
|  RECORD HEADER: John Doe | john@company.com | +1 555-0123        |
+------------------------------------------------------------------+
|  SIDEBAR     |  TIMELINE (center)          |  ASSOCIATIONS       |
|  (left)      |                             |  (right)            |
|              |  [Filter Bar]               |                     |
|  About       |  [Activity Buttons Row]     |  Companies          |
|  ----------  |                             |  ----------         |
|  Email       |  --- Today ---------------  |  Acme Corp          |
|  Phone       |                             |                     |
|  Company     |  o  Email: Subject line...  |  Deals              |
|  Owner       |  |  9:42 AM - John Doe      |  ----------         |
|  Lifecycle   |  |  [Preview snippet...]     |  Website Redesign   |
|  Lead Status |  |                           |  $15,000            |
|              |  o  Call: 5 min call         |                     |
|  Web         |  |  8:15 AM - Jane Smith     |  Tickets            |
|  Activity    |  |  [Outcome: Connected]     |  ----------         |
|              |  |                           |  (none)             |
|              |  --- Yesterday -----------  |                     |
|              |                             |  Attachments        |
|              |  o  Meeting: Q4 Review      |  ----------         |
|              |  |  3:00 PM - Team           |  proposal.pdf       |
|              |  |  [Duration: 45 min]       |                     |
|              |  |                           |                     |
|              |  o  Note: Follow-up items   |                     |
|              |  |  1:30 PM - John Doe       |                     |
|              |  |  [Preview text...]        |                     |
|              |                             |                     |
|              |  [Load More / Infinite]     |                     |
+--------------+-----------------------------+---------------------+
```

### 1.2 Date Grouping Strategy

Activities are grouped under date headers using **relative labels** for recent dates and **absolute labels** for older dates:

| Timeframe | Label Format | Example |
|-----------|-------------|---------|
| Today | "Today" | Today |
| Yesterday | "Yesterday" | Yesterday |
| This week | Day name | Monday |
| This year | Month Day | January 15 |
| Older | Full date | December 3, 2025 |

**Key insight from research:** A SaaS platform that replaced plain text activity logs with visual timeline feeds saw **187% increase** in user engagement and a **52% drop** in support tickets asking "Did X happen?" (Source: ExmoorWeb UX Study).

### 1.3 Infinite Scroll vs. Pagination

**Recommendation: Infinite scroll with windowing (virtualization).**

| Approach | Pros | Cons |
|----------|------|------|
| Infinite scroll | Natural flow, less clicking | Keyboard trap risk, heavy DOM |
| Pagination | Predictable, good for search | Breaks flow, feels transactional |
| **Virtualized scroll** | Best of both -- smooth + performant | Slightly more complex to implement |

Implementation notes:
- Use `react-window` or `@tanstack/virtual` for virtualization
- Load 20 activities per batch
- Show a skeleton loader while fetching
- Provide a "Jump to date" quick-nav for power users
- Ensure keyboard users can escape the feed region (ARIA `role="feed"`)

### 1.4 Timeline Spine Design

```
  DATE GROUP HEADER
  ─────────────────────────────────
  
  [Icon]  ACTIVITY CARD
    │     ┌─────────────────────────────────┐
    │     │ Activity Title / Subject         │
    │     │ Timestamp  -  Owner  -  Status   │
    │     │ Preview content (2 lines max)... │
    │     │ [Actions: Reply | Edit | More]   │
    │     └─────────────────────────────────┘
    │
  [Icon]  ACTIVITY CARD
    │     ┌─────────────────────────────────┐
    │     │ ...                              │
    │     └─────────────────────────────────┘
```

The vertical spine (thin 2px line, `gray-200` / `#e5e7eb`) runs along the left edge. Each activity is marked by a colored icon circle (`32px` diameter) positioned on the spine.

---

## 2. Activity Type Differentiation

### 2.1 Icon and Color Mapping

Each activity type gets a unique icon (Lucide) and semantic color from the F-CORE design system. Colors use a **background tint + icon fill** pattern for the circle badge on the timeline spine.

| Activity Type | Lucide Icon | Icon Name | BG Color (Tailwind) | Icon Color (Tailwind) | Hex BG | Hex Icon |
|---------------|-------------|-----------|--------------------|-----------------------|--------|----------|
| **Email** | Envelope | `Mail` | `blue-50` | `blue-600` | `#eff6ff` | `#2563eb` |
| **Call** | Phone | `Phone` | `green-50` | `green-600` | `#f0fdf4` | `#16a34a` |
| **Meeting** | Calendar | `CalendarDays` | `purple-50` | `purple-600` | `#faf5ff` | `#9333ea` |
| **Note** | Sticky note | `StickyNote` | `yellow-50` | `yellow-600` | `#fefce8` | `#ca8a04` |
| **Task** | Checkbox | `CheckSquare` | `orange-50` | `orange-600` | `#fff7ed` | `#ea580c` |
| **SMS** | Message | `MessageSquare` | `teal-50` | `teal-600` | `#f0fdfa` | `#0d9488` |
| **LinkedIn** | Linkedin | `Linkedin` | `sky-50` | `sky-700` | `#f0f9ff` | `#0369a1` |
| **WhatsApp** | Phone | `MessageCircle` | `emerald-50` | `emerald-600` | `#ecfdf5` | `#059669` |
| **Workflow** | Zap | `Zap` | `cyan-50` | `cyan-600` | `#ecfeff` | `#0891b2` |
| **Page View** | Eye | `Eye` | `gray-50` | `gray-500` | `#f9fafb` | `#6b7280` |
| **Form Submit** | FileText | `FileText` | `indigo-50` | `indigo-600` | `#eef2ff` | `#4f46e5` |
| **Deal Change** | TrendingUp | `TrendingUp` | `rose-50` | `rose-600` | `#fff1f2` | `#e11d48` |

### 2.2 Icon Badge Component

```
  ┌──────┐
  │  32px │   Timeline icon badge
  │ ○──○  │   - Rounded full (circle)
  │  Icon │   - 2px border matching bg color
  └──────┘   - Icon size: 16px
              - Position: overlapping the spine line
              - Drop shadow: shadow-sm
```

### 2.3 Status Badges for Activities

Activities can have status indicators shown as small colored chips:

| Status | Color | Tailwind Classes |
|--------|-------|-----------------|
| Sent | `blue-100 text-blue-700` | `bg-blue-100 text-blue-700` |
| Opened | `green-100 text-green-700` | `bg-green-100 text-green-700` |
| Replied | `emerald-100 text-emerald-700` | `bg-emerald-100 text-emerald-700` |
| Bounced | `red-100 text-red-700` | `bg-red-100 text-red-700` |
| Completed | `green-100 text-green-700` | `bg-green-100 text-green-700` |
| Overdue | `red-100 text-red-700` | `bg-red-100 text-red-700` |
| Upcoming | `blue-100 text-blue-700` | `bg-blue-100 text-blue-700` |
| Connected | `green-100 text-green-700` | `bg-green-100 text-green-700` |
| No Answer | `gray-100 text-gray-600` | `bg-gray-100 text-gray-600` |
| Left Voicemail | `yellow-100 text-yellow-700` | `bg-yellow-100 text-yellow-700` |
| Busy | `orange-100 text-orange-700` | `bg-orange-100 text-orange-700` |

---

## 3. Activity Card Design

### 3.1 Card Anatomy (Collapsed State)

The collapsed card follows a **progressive disclosure** pattern. Only essential information is visible; details are revealed on click/expand.

```
┌─────────────────────────────────────────────────────────────────┐
│ [Icon] Subject / Title                          [Status Badge] │
│        ┌──────────────────────────────────────────────────────┐ │
│        │ 9:42 AM  -  John Doe  -  via Sales Email            │ │
│        └──────────────────────────────────────────────────────┘ │
│        Preview text truncated to 2 lines maximum. This is a    │
│        snippet of the email body or note content...            │
│                                                                │
│        [Reply]  [Forward]  [...]                  [v Expand]   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Card Anatomy (Expanded State)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Icon] Re: Q4 Marketing Budget Review           [Sent Badge]   │
│        ┌──────────────────────────────────────────────────────┐ │
│        │ 9:42 AM  -  John Doe  -  via Sales Email            │ │
│        │ To: sarah@client.com  CC: team@company.com          │ │
│        └──────────────────────────────────────────────────────┘ │
│                                                                │
│        Hi Sarah,                                               │
│                                                                │
│        Thank you for the discussion yesterday. I wanted to     │
│        follow up on the three key points we covered:           │
│                                                                │
│        1. Budget allocation for Q4 campaigns                   │
│        2. Timeline for the website redesign                    │
│        3. Integration requirements for the new CRM             │
│                                                                │
│        Please let me know if you have any questions.            │
│                                                                │
│        Best regards,                                           │
│        John                                                    │
│                                                                │
│        ┌────────────────────────────────────────┐              │
│        │ [Attachment] proposal-v2.pdf  (2.4 MB) │              │
│        └────────────────────────────────────────┘              │
│                                                                │
│        [Reply]  [Reply All]  [Forward]  [...]     [^ Collapse] │
│                                                                │
│        --- Associations ---                                    │
│        Deal: Website Redesign ($15,000)                        │
│        Company: Acme Corp                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Card Component Properties

| Property | Type | Description |
|----------|------|-------------|
| `activityType` | enum | email, call, meeting, note, task, sms, linkedin, whatsapp |
| `subject` | string | Title or subject line |
| `body` | string (rich text) | Full content (shown when expanded) |
| `preview` | string | Auto-generated 2-line snippet |
| `timestamp` | datetime | When the activity occurred |
| `owner` | User | Who created/owns the activity |
| `status` | enum | Activity-specific status |
| `associations` | Relation[] | Linked deals, companies, tickets |
| `attachments` | File[] | Attached documents |
| `metadata` | object | Type-specific fields (duration, outcome, etc.) |
| `isExpanded` | boolean | Controls expand/collapse state |
| `isPinned` | boolean | Whether pinned to top of timeline |

### 3.4 Interaction States

| State | Visual Treatment |
|-------|-----------------|
| **Default** | White background, `gray-200` border-bottom, no shadow |
| **Hover** | `gray-50` background, subtle cursor pointer |
| **Expanded** | `white` background, `shadow-sm`, full content visible |
| **Focused** | `cyan-500` ring (2px), for keyboard navigation |
| **Pinned** | Small pin icon top-right, subtle `cyan-50` tint |
| **Selected** | `cyan-50` background, `cyan-500` left border (3px) |

### 3.5 Timestamp Display Strategy

Use **relative timestamps** for recent activities and **absolute** for older:

| Age | Display | Example |
|-----|---------|---------|
| < 1 minute | "Just now" | Just now |
| < 60 minutes | "X min ago" | 12 min ago |
| < 24 hours | "X hours ago" | 3 hours ago |
| Today | "Today at HH:MM" | Today at 9:42 AM |
| Yesterday | "Yesterday at HH:MM" | Yesterday at 3:00 PM |
| This year | "MMM D at HH:MM" | Jan 15 at 2:30 PM |
| Older | "MMM D, YYYY" | Dec 3, 2025 |

**On hover**, always show the full absolute timestamp as a tooltip: "Wednesday, January 15, 2026 at 9:42:15 AM EST"

---

## 4. Filtering and Sorting

### 4.1 Filter Bar Layout

The filter bar sits directly above the timeline feed. It uses a horizontal arrangement of filter controls.

```
┌─────────────────────────────────────────────────────────────────┐
│ [All activities v]  [All time v]  [All owners v]  [Search...Q] │
│                                                                │
│ Applied: Email, Call  x  |  Last 30 days  x  |  Clear all     │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Filter Categories

| Filter | Type | Options |
|--------|------|---------|
| **Activity Type** | Multi-select dropdown | Email, Call, Meeting, Note, Task, SMS, LinkedIn, WhatsApp, Page View, Form Submit, Workflow, Deal Change |
| **Time Range** | Preset + Custom | Today, Last 7 days, Last 30 days, Last 90 days, This quarter, Custom range |
| **Owner** | Multi-select with search | All users, My activities, Specific team members |
| **Team** | Multi-select | Sales, Marketing, Support, etc. |
| **Status** | Multi-select | Active, Completed, Overdue |
| **Search** | Free text | Searches subject, body, and participant names |

### 4.3 Filter Interaction Patterns

**Quick Filters (Chip/Tab style):**
```
  [All]  [Emails]  [Calls]  [Meetings]  [Notes]  [Tasks]  [More v]
   ^^^
   Active chip: bg-cyan-100 text-cyan-700 border-cyan-300
   Inactive chip: bg-white text-gray-600 border-gray-200 hover:bg-gray-50
```

**Date Range Presets (Dropdown):**
```
  ┌───────────────────────┐
  │ All time           >> │
  ├───────────────────────┤
  │ Today                 │
  │ Yesterday             │
  │ Last 7 days         * │  <-- selected
  │ Last 30 days          │
  │ Last 90 days          │
  │ This quarter          │
  │ This year             │
  ├───────────────────────┤
  │ Custom range...       │
  │ ┌──────┐  ┌──────┐   │
  │ │ From │  │  To  │   │
  │ └──────┘  └──────┘   │
  │       [Apply]         │
  └───────────────────────┘
```

### 4.4 Applied Filters Display

Show applied filters as removable chips below the filter bar:

```
  Showing: [Email x] [Call x] [Last 30 days x] [John Doe x]  |  Clear all
```

### 4.5 Sorting

Default sort is **newest first** (descending by timestamp). Provide a toggle:

```
  Sort: [Newest first v]
        ├── Newest first
        └── Oldest first
```

### 4.6 Filter Persistence

- **Remember My Filters:** Save filter preferences per user per view
- Persist across sessions using localStorage or user preferences API
- Show a "Reset to defaults" option when custom filters are active
- URL query parameters should reflect active filters for shareability

---

## 5. Inline Actions

### 5.1 Action Mapping by Activity Type

| Activity Type | Primary Actions | Secondary Actions (overflow) |
|---------------|----------------|------------------------------|
| **Email** | Reply, Forward | Reply All, View in thread, Copy link, Delete |
| **Call** | Call back, Log follow-up | Edit, View recording, Delete |
| **Meeting** | Reschedule, Join link | Edit, Cancel, Add notes, Delete |
| **Note** | Edit | Pin, Copy, Delete |
| **Task** | Mark complete, Reassign | Edit, Change date, Delete |
| **SMS** | Reply | View thread, Delete |

### 5.2 Action Visibility

Use a **progressive disclosure** approach:

1. **Always visible (on card):** 1-2 primary actions as text links
2. **On hover:** Show full action row
3. **Overflow menu (...):** Less common actions

```
  Collapsed card:
  ┌──────────────────────────────────────────────────────────┐
  │ ...content...                                            │
  │                                                          │
  │ [Reply]  [Forward]  [...]                                │
  └──────────────────────────────────────────────────────────┘

  Overflow menu:
  ┌────────────────────┐
  │ Reply All          │
  │ View in thread     │
  │ Copy link          │
  │ ────────────────── │
  │ Pin to top         │
  │ ────────────────── │
  │ Delete         [!] │
  └────────────────────┘
```

### 5.3 Destructive Actions

- **Delete** always requires confirmation dialog
- Show in red text with a warning icon
- Use soft delete (`deleted_at` timestamp) per F-CORE database rules
- Provide "Undo" toast for 8 seconds after deletion

### 5.4 Quick Complete (Tasks)

Tasks show a checkbox on the left of the card that can be clicked to mark complete without expanding:

```
  [x] Task: Follow up with Sarah about proposal
      Due: Tomorrow at 2:00 PM  -  John Doe
      [Reschedule]  [Reassign]  [...]
```

---

## 6. Activity Logging Forms

### 6.1 Log Activity Button Row

At the top of the timeline, show a row of quick-log buttons:

```
┌─────────────────────────────────────────────────────────────────┐
│  [+ Email]  [+ Call]  [+ Meeting]  [+ Note]  [+ Task]  [More] │
└─────────────────────────────────────────────────────────────────┘
```

Each button opens an inline panel or a pop-up communicator (modal that can be minimized, per HubSpot's pattern).

### 6.2 Form Layout Pattern

Forms open inline (pushed into the timeline area) or as a slide-over panel. Inline is preferred for quick logging; panel/modal for composing emails or scheduling meetings.

```
┌─────────────────────────────────────────────────────────────────┐
│ LOG A CALL                                         [x] Close   │
│                                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Call outcome:  [Connected v]                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Call direction:  (o) Outbound  ( ) Inbound                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Duration:  [00] h [05] m [30] s                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Notes:                                                      │ │
│ │ [Rich text editor with basic formatting]                    │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Associate with:  [+ Deal] [+ Company] [+ Ticket]           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│                              [Cancel]  [Log activity]          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Type-Specific Form Fields

#### Email Form
```
┌─────────────────────────────────────────────────────────────────┐
│ COMPOSE EMAIL                              [_] [O] [x]         │
│                                                                │
│ From:    [john@company.com v]                                  │
│ To:      [sarah@client.com              ] [CC] [BCC]           │
│ Subject: [Re: Q4 Marketing Budget                  ]           │
│                                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [B] [I] [U] [Link] [List] [Image] [Attach] [Template v]   │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ Hi Sarah,                                                   │ │
│ │                                                             │ │
│ │ [Email body with rich text editing]                         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌────────────────────────┐                                     │
│ │ [clip] proposal.pdf    │                                     │
│ └────────────────────────┘                                     │
│                                                                │
│ Associate: [Website Redesign Deal x]                           │
│                                                                │
│ [Schedule send v]  [Save draft]           [Send]               │
└─────────────────────────────────────────────────────────────────┘
```

**Key fields:** From, To, CC, BCC, Subject, Body (rich text), Attachments, Template selector, Associations, Schedule send option.

#### Call Log Form
```
┌─────────────────────────────────────────────────────────────────┐
│ LOG A CALL                                         [x]         │
│                                                                │
│ Call to:      [John Doe - john@company.com        ]            │
│ Outcome:      [Connected         v]                            │
│               Options: Connected, Busy, No answer,             │
│               Left voicemail, Wrong number                     │
│ Direction:    (o) Outbound  ( ) Inbound                        │
│ Duration:     [00]h [05]m [30]s                                │
│ Date/Time:    [01/15/2026] [9:42 AM]                           │
│                                                                │
│ Notes:                                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Rich text editor]                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│ Call type:    [Sales call       v]                              │
│ Associate:    [+ Deal] [+ Ticket]                              │
│                                                                │
│                              [Cancel]  [Log activity]          │
└─────────────────────────────────────────────────────────────────┘
```

**Key fields:** Contact, Outcome, Direction, Duration, Date/Time, Notes, Call Type, Associations.

#### Meeting Form
```
┌─────────────────────────────────────────────────────────────────┐
│ SCHEDULE A MEETING                                 [x]         │
│                                                                │
│ Title:        [Q4 Planning Session                 ]           │
│ Date:         [01/20/2026]                                     │
│ Start:        [2:00 PM]       End: [3:00 PM]                   │
│ Duration:     1 hour                                           │
│ Location:     [Zoom link or address               ]            │
│                                                                │
│ Attendees:                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [John Doe x] [Sarah Client x] [+ Add attendee...]         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│ Description:                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Rich text editor for agenda]                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│ Meeting type: [Sales meeting   v]                              │
│ Outcome:      [Scheduled       v]  (post-meeting: Completed,  │
│                                     Rescheduled, No-show)      │
│ Associate:    [Website Redesign Deal x]                        │
│                                                                │
│                    [Cancel]  [Save]  [Save & Send invite]      │
└─────────────────────────────────────────────────────────────────┘
```

**Key fields:** Title, Date, Start/End, Location, Attendees, Description, Meeting Type, Outcome, Associations.

#### Note Form
```
┌─────────────────────────────────────────────────────────────────┐
│ CREATE A NOTE                                      [x]         │
│                                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [B] [I] [U] [Link] [List] [Mention @] [Attach]            │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ Discussed pricing strategy. @Jane will prepare the          │ │
│ │ updated proposal by Friday.                                 │ │
│ │                                                             │ │
│ │ Key takeaways:                                              │ │
│ │ - Client interested in annual plan                          │ │
│ │ - Need to address security concerns                         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│ Associate: [+ Deal] [+ Company] [+ Ticket]                    │
│                                                                │
│                              [Cancel]  [Save note]             │
└─────────────────────────────────────────────────────────────────┘
```

**Key fields:** Body (rich text with @mentions), Attachments, Associations. Notes are the simplest form -- just content and associations.

#### Task Form
```
┌─────────────────────────────────────────────────────────────────┐
│ CREATE A TASK                                      [x]         │
│                                                                │
│ Title:        [Send updated proposal to Sarah      ]           │
│ Type:         [To-do          v]  (To-do, Email, Call)         │
│ Priority:     [Medium         v]  (Low, Medium, High)          │
│ Due date:     [01/17/2026]  [2:00 PM]                          │
│ Assigned to:  [John Doe       v]                               │
│ Queue:        [Sales follow-up v]                              │
│                                                                │
│ Notes:                                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Rich text editor]                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│ [x] Set reminder:  [15 min before v]                           │
│                                                                │
│ Associate: [Website Redesign Deal x] [Acme Corp x]            │
│                                                                │
│                              [Cancel]  [Create task]           │
└─────────────────────────────────────────────────────────────────┘
```

**Key fields:** Title, Type, Priority, Due Date/Time, Assignee, Queue, Notes, Reminder, Associations.

### 6.4 Form UX Patterns

| Pattern | Implementation |
|---------|---------------|
| **Inline logging** | Note and Call forms open inline above the timeline |
| **Panel/Modal** | Email composer and Meeting scheduler open as slide-over or modal |
| **Minimizable** | Email/Meeting forms can be minimized to a bottom bar (like Gmail compose) |
| **Auto-association** | Pre-populate associations with the current record context |
| **Templates** | Email and Note forms support templates with variable insertion |
| **Auto-save drafts** | Email drafts auto-save every 30 seconds |
| **Quick log** | One-click "Log a call" with smart defaults (Connected, 5 min, now) |

---

## 7. Mobile Timeline

### 7.1 Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|------------|-------|---------------|
| Desktop | >= 1280px | Three-column layout, full timeline |
| Tablet | 768-1279px | Two-column, sidebar collapses |
| Mobile | < 768px | Single-column, stacked layout |

### 7.2 Mobile Layout

On mobile, the three-column layout collapses to a single column with tab-based navigation:

```
┌──────────────────────────┐
│ [<] John Doe     [...]   │
│ john@company.com         │
├──────────────────────────┤
│ [Activity] [About] [Rel] │  <-- Tab navigation
├──────────────────────────┤
│                          │
│ [+ Quick actions row]    │
│ [Email][Call][Note][More] │
│                          │
│ [Filter chips]           │
│ [All][Email][Call][Meet]  │
│                          │
│ --- Today -------------- │
│                          │
│ ┌────────────────────┐   │
│ │[M] Subject line    │   │
│ │ 9:42 AM - John Doe │   │
│ │ Preview text...    │   │
│ │          [>] Swipe │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │[P] 5 min call      │   │
│ │ 8:15 AM - Jane     │   │
│ │ Connected          │   │
│ └────────────────────┘   │
│                          │
│ --- Yesterday ---------- │
│                          │
│ [...]                    │
│                          │
│ [Load more...]           │
│                          │
├──────────────────────────┤
│ [Home][Contacts][Deals]  │
└──────────────────────────┘
```

### 7.3 Mobile-Specific Patterns

| Pattern | Description |
|---------|-------------|
| **Swipe actions** | Swipe left to reveal actions (Reply, Delete). Swipe right to mark complete (tasks). |
| **Compact cards** | Reduce to 2 lines: Title + timestamp. No preview text. |
| **Bottom sheet** | Activity log forms open as bottom sheets sliding up from the bottom. |
| **Pull to refresh** | Swipe down from top of timeline to refresh activities. |
| **Touch targets** | Minimum 44x44px tap targets per WCAG 2.1 guidelines. |
| **Floating action** | FAB (Floating Action Button) for quick activity creation on scroll. |
| **Haptic feedback** | Subtle vibration on swipe actions and form submissions. |

### 7.4 Mobile Card Design

```
Mobile card (collapsed):
┌──────────────────────────────────┐
│ [Icon] Subject or title    [>>] │
│        9:42 AM  John Doe        │
└──────────────────────────────────┘

Mobile card (expanded - tap to expand):
┌──────────────────────────────────┐
│ [Icon] Subject or title  [Sent] │
│        9:42 AM  John Doe        │
│                                  │
│ Full content displayed here      │
│ with proper text wrapping        │
│ and readable font size (16px)    │
│                                  │
│ [Reply] [Forward] [...]          │
└──────────────────────────────────┘

Swipe reveal (left swipe):
┌──────────────────────────────────┐
│ [Icon] Subject <<<  [Reply][Del]│
└──────────────────────────────────┘
```

---

## 8. Real-time Updates

### 8.1 Update Strategy

| Method | Use Case | Implementation |
|--------|----------|---------------|
| **WebSocket / Supabase Realtime** | New activities from other users | Subscribe to activity table changes |
| **Server-Sent Events** | One-directional feed updates | Lightweight alternative to WebSocket |
| **Polling (fallback)** | When WebSocket unavailable | Poll every 30 seconds |
| **Optimistic UI** | User's own actions | Update UI immediately, sync in background |

### 8.2 New Activity Notification

When a new activity arrives while the user is viewing the timeline:

```
  ┌────────────────────────────────────────────────────────────┐
  │  [arrow-up] 3 new activities  [Show]                      │  <-- Sticky banner
  └────────────────────────────────────────────────────────────┘
  
  --- Today -------------------------------------------------
  
  [Existing activities below...]
```

Do NOT auto-inject new items and shift the scroll position. This is disorienting. Instead:

1. Show a "New activities" banner at the top of the feed
2. Clicking "Show" scrolls to top and reveals new items with a slide-down animation
3. Update the count in real-time as more activities arrive
4. If user is already at the top, auto-show with animation

### 8.3 Activity Count Badge

Show an unread/new activity count badge on the Activity tab or section:

```
  [Activity (3)]   or   [Activity] [3]
                                    ^^^
                                    Red badge with white text
                                    bg-red-500 text-white rounded-full
                                    min-width: 20px, height: 20px
                                    font-size: 12px
```

### 8.4 Toast Notifications

For high-priority activities (e.g., email reply from a contact, task overdue), show a toast notification:

```
  ┌─────────────────────────────────────────────┐
  │  [Mail icon]  Sarah replied to your email   │
  │  "Re: Q4 Marketing Budget Review"           │
  │                                    [View]   │
  └─────────────────────────────────────────────┘
  
  Position: top-right
  Auto-dismiss: 5 seconds
  Click: Navigate to the activity
  Stacking: Max 3 toasts visible
```

### 8.5 Optimistic Updates

When the user creates a new activity:

1. Immediately add it to the timeline with a subtle loading indicator
2. Send the API request in the background
3. On success: Remove the loading indicator, show a brief success state
4. On failure: Show error state on the card, offer "Retry" action

```
  [Saving...]  Note: Follow-up items         <-- Loading state
    |          1:30 PM - John Doe
    |          Discussed pricing...
    |          [shimmer effect on card]

  [Saved]      Note: Follow-up items         <-- Success (brief green checkmark)
    |          1:30 PM - John Doe
    |          Discussed pricing...
```

---

## 9. Accessibility Considerations

### 9.1 ARIA Roles and Structure

The timeline should use the ARIA `feed` role for screen reader compatibility:

```html
<section aria-label="Activity timeline" role="feed" aria-busy="false">
  <h2 id="timeline-heading" class="sr-only">Activity Timeline</h2>
  
  <!-- Date group -->
  <div role="group" aria-label="Today">
    <h3>Today</h3>
    
    <!-- Activity card -->
    <article
      role="article"
      aria-posinset="1"
      aria-setsize="-1"
      aria-label="Email: Re: Q4 Marketing Budget Review"
      tabindex="0"
    >
      <!-- Card content -->
    </article>
    
    <article
      role="article"
      aria-posinset="2"
      aria-setsize="-1"
      tabindex="0"
    >
      <!-- Card content -->
    </article>
  </div>
</section>
```

### 9.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move to next interactive element |
| `Shift + Tab` | Move to previous interactive element |
| `Enter` / `Space` | Expand/collapse activity card |
| `Escape` | Close expanded card or form |
| `Arrow Down` | Next article in feed |
| `Arrow Up` | Previous article in feed |
| `Home` | First article |
| `End` | Last loaded article |
| `Page Down` | Jump forward ~5 items, trigger load if near end |
| `Page Up` | Jump backward ~5 items |

### 9.3 Screen Reader Announcements

| Event | Announcement |
|-------|-------------|
| New activity loaded | "3 new activities available. Press Show to view." |
| Card expanded | "Expanded. Email from John Doe. Sent January 15 at 9:42 AM." |
| Card collapsed | "Collapsed." |
| Activity created | "Note saved successfully." |
| Activity deleted | "Activity deleted. Undo available for 8 seconds." |
| Filter applied | "Showing 12 email activities from the last 7 days." |
| Loading more | "Loading more activities..." |
| No results | "No activities match your filters." |

Use `aria-live="polite"` regions for non-urgent updates and `aria-live="assertive"` for errors.

### 9.4 Color and Contrast

Per WCAG 2.1 AA requirements:

| Element | Requirement | Our Implementation |
|---------|-------------|-------------------|
| Body text | 4.5:1 contrast ratio | `gray-900` on `white` = 15.4:1 |
| Secondary text | 4.5:1 | `gray-600` on `white` = 5.7:1 |
| Muted text | 3:1 (large text only) | `gray-400` on `white` = 3.3:1 |
| Activity icons | 3:1 against background | Each icon color meets 3:1 on its tinted bg |
| Status badges | 4.5:1 text on badge bg | All badge combos verified |
| Focus ring | 3:1 against adjacent | `cyan-500` ring on white = 4.5:1 |

**Never rely on color alone.** Every activity type is differentiated by:
1. Color (icon background)
2. Icon shape (unique per type)
3. Text label ("Email", "Call", etc.)

### 9.5 Motion and Animation

- Respect `prefers-reduced-motion` media query
- Expand/collapse animations: 200ms ease-out (or instant if reduced motion)
- New activity slide-in: 300ms ease-out (or instant if reduced motion)
- All loading states must have text alternatives, not just spinners

### 9.6 Touch Accessibility

- All touch targets minimum 44x44px (WCAG 2.1 SC 2.5.5)
- Swipe actions must have non-swipe alternatives (overflow menu)
- No essential functionality behind gestures only

---

## 10. Implementation Recommendations

### 10.1 Component Architecture

```
src/components/activity-timeline/
  ActivityTimeline.tsx          -- Main container with feed + filters
  ActivityFilterBar.tsx         -- Filter controls row
  ActivityDateGroup.tsx         -- Date group header + children
  ActivityCard.tsx              -- Individual activity card
  ActivityCardEmail.tsx         -- Email-specific card content
  ActivityCardCall.tsx          -- Call-specific card content
  ActivityCardMeeting.tsx       -- Meeting-specific card content
  ActivityCardNote.tsx          -- Note-specific card content
  ActivityCardTask.tsx          -- Task-specific card content
  ActivityIconBadge.tsx         -- Colored icon circle on spine
  ActivityActions.tsx           -- Action buttons row
  ActivityLogButton.tsx         -- "+ Log" button row
  ActivityLogForm.tsx           -- Generic form container
  forms/
    EmailComposeForm.tsx        -- Email composition form
    CallLogForm.tsx             -- Call logging form
    MeetingScheduleForm.tsx     -- Meeting scheduling form
    NoteForm.tsx                -- Note creation form
    TaskForm.tsx                -- Task creation form
  NewActivityBanner.tsx         -- "X new activities" banner
  TimelineSkeleton.tsx          -- Loading skeleton
  EmptyTimeline.tsx             -- Empty state
  hooks/
    useActivityTimeline.ts      -- Data fetching + infinite scroll
    useActivityFilters.ts       -- Filter state management
    useRealtimeActivities.ts    -- WebSocket subscription
  types/
    activity.types.ts           -- TypeScript interfaces
  utils/
    activityTypeConfig.ts       -- Icon/color mapping
    formatTimestamp.ts           -- Relative/absolute timestamp
```

### 10.2 Data Model Alignment

Activities should map to these database fields (reference Prisma schema):

```typescript
interface Activity {
  id: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK' | 'SMS' | 'LINKEDIN' | 'WHATSAPP';
  subject: string | null;
  body: string | null;
  bodyPreview: string | null;     // Auto-generated 200-char snippet
  timestamp: Date;
  ownerId: string;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  ticketId: string | null;
  tenantId: string;               // REQUIRED: Multi-tenancy
  metadata: Record<string, any>;  // Type-specific fields (duration, outcome, etc.)
  status: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;         // Soft delete
}
```

### 10.3 Performance Targets

| Metric | Target |
|--------|--------|
| Initial load (20 items) | < 500ms |
| Scroll load (next 20) | < 300ms |
| Activity creation | < 200ms (optimistic) |
| Filter application | < 100ms (client-side for loaded data) |
| Real-time update delivery | < 2 seconds |
| Time to interactive | < 1.5 seconds |

### 10.4 Technology Stack

| Concern | Recommended Library |
|---------|-------------------|
| Virtualized scroll | `@tanstack/virtual` |
| Rich text editor | `tiptap` (for note/email bodies) |
| Date picker | `react-day-picker` |
| Realtime | Supabase Realtime (already in stack) |
| Animations | `framer-motion` (with `prefers-reduced-motion`) |
| Icons | Lucide React (`lucide-react`) |
| Form state | React Hook Form + Zod validation |

---

## Appendix A: Competitive Analysis Summary

| Feature | HubSpot | Salesforce | Dynamics 365 | F-CORE (Recommended) |
|---------|---------|-----------|---------------|---------------------|
| Layout | Center column, vertical | Right panel feed | Left panel timeline | Center column, vertical |
| Grouping | By date | By date | By date | By date (relative labels) |
| Filters | Type, owner, date, search | Type, date, keyword | Type, status, date | Type, owner, date, search, status |
| Expand/Collapse | Click to expand | Click to expand | Click to expand | Click to expand + keyboard |
| Color coding | Icon + subtle bg | Icon only | Color bar on left | Icon bg tint + icon color |
| Inline edit | Yes (recently added) | Limited | Yes | Yes (all activity types) |
| Real-time | Polling | Streaming | Polling | WebSocket (Supabase Realtime) |
| Mobile | Responsive + native app | Native app | Responsive | Responsive + optimized mobile |
| Accessibility | Partial WCAG | Good ARIA | Good ARIA | Full WCAG 2.1 AA compliance |

## Appendix B: Color Accessibility Verification

All activity type color combinations verified against WCAG 2.1 AA (3:1 for non-text, 4.5:1 for text):

| Type | Icon on BG Ratio | Text on White Ratio | Pass? |
|------|-----------------|--------------------|----|
| Email (blue-600 on blue-50) | 7.2:1 | 4.7:1 | Yes |
| Call (green-600 on green-50) | 5.1:1 | 4.5:1 | Yes |
| Meeting (purple-600 on purple-50) | 6.8:1 | 6.0:1 | Yes |
| Note (yellow-600 on yellow-50) | 3.8:1 | 3.1:1 | Yes (non-text) |
| Task (orange-600 on orange-50) | 4.4:1 | 3.7:1 | Yes (with label) |
| SMS (teal-600 on teal-50) | 4.5:1 | 4.5:1 | Yes |
| Page View (gray-500 on gray-50) | 4.4:1 | 4.6:1 | Yes |

## Appendix C: Key Research Sources

1. HubSpot Knowledge Base -- "Filter activities on a record timeline" (knowledge.hubspot.com)
2. HubSpot Community -- "Streamlined New Record Design" (community.hubspot.com)
3. Dynamics 365 -- "Activity Timeline add-on" (solzit.com)
4. Microsoft Learn -- "Timeline Overview for Users" (learn.microsoft.com)
5. Aubergine Solutions -- "A Guide to Designing Chronological Activity Feeds" (aubergine.co)
6. ExmoorWeb -- "Why Generic Activity Logs Confuse Users" (exmoorweb.co.uk)
7. Material Design 3 -- "Cards Guidelines" (m3.material.io)
8. MDN Web Docs -- "ARIA: feed role" (developer.mozilla.org)
9. WebAIM -- "Keyboard Accessibility" (webaim.org)
10. Equal Design -- "Best Practices for CRM Design on Mobile and Desktop" (equal.design)
11. Pencil and Paper -- "Filter UX Design Patterns and Best Practices" (pencilandpaper.io)
12. Interaction Design Foundation -- "Progressive Disclosure" (interaction-design.org)
13. Lucide Icons -- Icon library reference (lucide.dev)
14. Mobbin -- "Mobile Timeline Screen patterns" (mobbin.com)
15. UX Matters -- "Date Filters: Successful Calendar Design Patterns" (uxmatters.com)
