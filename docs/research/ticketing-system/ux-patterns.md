# Ticketing/Helpdesk System - UX Patterns Analysis

> **Project:** F-CORE (HubSpot Clone)
> **Date:** 2026-02-09
> **Purpose:** Actionable UX patterns for implementing the Service Hub ticketing module
> **Sources:** Zendesk, Freshdesk, HubSpot Service Hub, Intercom, Jira Service Management, UX research publications

---

## Table of Contents

1. [Ticket Creation UX](#1-ticket-creation-ux)
2. [Ticket List/Board Views](#2-ticket-listboard-views)
3. [Ticket Detail Page](#3-ticket-detail-page)
4. [SLA Visual Indicators](#4-sla-visual-indicators)
5. [Priority & Status Visual Hierarchy](#5-priority--status-visual-hierarchy)
6. [Agent Experience](#6-agent-experience)
7. [Implementation Recommendations for F-CORE](#7-implementation-recommendations-for-f-core)

---

## 1. Ticket Creation UX

### 1.1 Form Layout: Multi-Step vs Single Page

**Industry consensus: Multi-step wizard for customers, single-page for agents.**

| Approach | Best For | Pros | Cons |
|----------|----------|------|------|
| **Multi-step wizard** | Customer-facing portal | Reduces cognitive load, higher completion rates, progressive disclosure | More clicks, can feel slow for power users |
| **Single-page form** | Agent-side creation | Fast for trained users, full context visible | Can overwhelm new agents with too many fields |
| **Slide-over panel** | Quick creation from any view | Non-disruptive, maintains context | Limited space for complex forms |
| **Modal dialog** | Minimal creation flow | Focused attention, clear call-to-action | Cannot reference other content while creating |

**Recommended for F-CORE:**
- **Agent-side:** Slide-over panel (right drawer) with single-page form for quick ticket creation
- **Customer portal:** Multi-step wizard (2-3 steps max)

### 1.2 Required & Suggested Fields

**Step 1 - Core Information (Always visible):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Subject/Title | Text input | Yes | Auto-suggest from knowledge base as user types |
| Description | Rich text editor | Yes | Support markdown, paste images inline |
| Priority | Dropdown/Radio | Auto-set | Default to "Normal", allow override |
| Category/Type | Dropdown | Yes | Hierarchical: Category > Sub-category |

**Step 2 - Routing (Progressive disclosure):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Pipeline | Dropdown | Yes | Pre-selected based on category |
| Assignee | Search dropdown | No | Auto-assign via round-robin or skill-based routing |
| Team/Group | Dropdown | No | Determines assignment pool |
| Contact | Association picker | Yes | Link to CRM contact record |
| Company | Auto-populated | Auto | Pulled from contact association |

**Step 3 - Additional Context (Optional):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Attachments | File upload | No | Drag-and-drop zone, max 25MB per file |
| Tags | Multi-select/chips | No | Free-form with suggestions |
| Due Date | Date picker | No | Calculated from SLA if not set manually |
| Custom Properties | Dynamic | Varies | Pipeline-specific fields |

### 1.3 Smart Defaults & Auto-Suggestions

**Patterns to implement:**

1. **Knowledge Base Deflection:** As the user types the subject, show 3-5 related knowledge base articles in a dropdown. This is proven to reduce ticket volume by 15-30% (Coveo research).

2. **Smart Category Detection:** Use keyword matching on the description to auto-suggest category. Example: "password" or "login" keywords -> "Account Access" category.

3. **Auto-Priority Assignment:** Set default priority based on:
   - Customer tier (VIP contacts -> High)
   - Category (Security issues -> Urgent)
   - Keywords in description ("down", "outage", "critical" -> High/Urgent)

4. **Contact Auto-Association:** When an agent creates a ticket from a contact's timeline, pre-fill the contact association.

5. **Template Selection:** Offer ticket templates for common issue types that pre-fill category, priority, and description structure.

### 1.4 File Attachment Patterns

```
+--------------------------------------------------+
|  [Drag files here or click to upload]            |
|                                                  |
|   Supported: PNG, JPG, PDF, DOC (max 25MB)      |
+--------------------------------------------------+
|  invoice.pdf  (245 KB)  [x]                      |
|  screenshot.png  (1.2 MB)  [x]                   |
+--------------------------------------------------+
```

**Key patterns:**
- Drag-and-drop zone with click fallback
- Paste from clipboard (Ctrl+V for screenshots)
- Inline image embedding in rich text description
- Progress indicator for uploads
- File type validation with clear error messages
- Thumbnail preview for images
- Maximum file count (e.g., 10 files) and total size limit

---

## 2. Ticket List/Board Views

### 2.1 List View (Default)

The list view is the primary view for agents handling high volumes. It must prioritize scannability and quick actions.

**Layout Structure:**

```
+----------------------------------------------------------------------+
| [+ Create Ticket]  [Views: My Tickets v]  [Search...]               |
+----------------------------------------------------------------------+
| Filters: [Status v] [Priority v] [Assignee v] [Pipeline v] [+ More] |
+----------------------------------------------------------------------+
| [ ] | #  | Subject          | Contact    | Status  | Priority | SLA     | Assignee | Updated    |
+----------------------------------------------------------------------+
| [ ] | 1042 | Login issue... | J. Smith   | [Open]  | [!High]  | 2h left | @agent1  | 2m ago     |
| [ ] | 1041 | Billing que... | M. Jones   | [Wait]  | [Normal] | 4h left | @agent2  | 15m ago    |
| [ ] | 1040 | Feature req... | A. Brown   | [Open]  | [!Low]   | 8h left | --       | 1h ago     |
+----------------------------------------------------------------------+
| Showing 1-25 of 156 tickets  [< Prev] [1] [2] [3] ... [7] [Next >]  |
+----------------------------------------------------------------------+
```

**Essential list features:**

| Feature | Implementation |
|---------|---------------|
| **Column customization** | Drag to reorder, toggle visibility, save as "View" |
| **Sorting** | Click column header to sort asc/desc, multi-column sort with Shift+click |
| **Quick filters** | Pill-style filter chips at top, remember last filter per user |
| **Saved views** | Named filter combinations (e.g., "My Open Tickets", "Urgent Unassigned") |
| **Bulk actions** | Checkbox selection -> floating action bar: Assign, Change Status, Merge, Delete |
| **Row hover preview** | Show first 2 lines of description on hover (tooltip or expandable row) |
| **Inline editing** | Click on Status/Priority/Assignee cells to edit directly in the list |
| **Row density** | Compact/Comfortable/Spacious toggle (Freshdesk pattern) |

### 2.2 Kanban Board View

Kanban boards provide visual workflow management. Best for teams using status-based workflows.

**Layout Structure:**

```
+----------------------------------------------------------------------+
| Group by: [Status v]  |  Filter: [Priority v] [Assignee v]          |
+----------------------------------------------------------------------+
|                                                                      |
| NEW (12)        | IN PROGRESS (8) | WAITING (5)   | RESOLVED (24)   |
| [Column limit: 15]                                                   |
|                                                                      |
| +------------+ | +------------+  | +------------+ | +------------+  |
| | #1042      | | | #1038      |  | | #1035      | | | #1030      |  |
| | Login issue| | | API error  |  | | Billing Q  | | | Setup help |  |
| | J. Smith   | | | T. Wilson  |  | | M. Jones   | | | K. Lee     |  |
| | [!High]    | | | [!Urgent]  |  | | [Normal]   | | | [Low]      |  |
| | SLA: 2h    | | | SLA: 30m   |  | | SLA: Paused| | | Resolved   |  |
| | @agent1    | | | @agent2    |  | | @agent1    | | | @agent3    |  |
| +------------+ | +------------+  | +------------+ | +------------+  |
| +------------+ | +------------+  |                 |                 |
| | #1041      | | | #1036      |  |                 |                 |
| | ...        | | | ...        |  |                 |                 |
| +------------+ | +------------+  |                 |                 |
+----------------------------------------------------------------------+
```

**Key Kanban patterns:**

| Feature | Details |
|---------|---------|
| **Drag-and-drop** | Move cards between columns to change status |
| **Group by options** | Status (default), Priority, Assignee, Pipeline |
| **Column limits (WIP)** | Optional Work-In-Progress limits per column with visual warnings |
| **Card content** | Ticket ID, subject (truncated), contact name, priority badge, SLA indicator, assignee avatar |
| **Card color accent** | Left border color matches priority (red/orange/blue/gray) |
| **Column counters** | Show ticket count per column |
| **Collapsed columns** | Allow collapsing completed status columns (Resolved, Closed) |
| **Quick add** | "+" button at top of each column for fast ticket creation with that status |

### 2.3 Table View (Advanced)

For data-heavy operations and reporting-oriented users.

```
+----------------------------------------------------------------------+
| Columns: [Customize] | Export: [CSV] [Excel]  | Density: [Compact v] |
+----------------------------------------------------------------------+
| Full data table with all ticket properties, resizable columns,       |
| row selection, and Excel-like filtering per column.                   |
+----------------------------------------------------------------------+
```

### 2.4 Quick Preview / Peek

A split-pane or side-panel preview that avoids full page navigation.

**Pattern (Freshdesk "Quick List"):**

```
+---------------------------+------------------------------------------+
| Ticket List (narrow)      | Ticket Preview (expanded)                |
|                           |                                          |
| > #1042 Login issue...    | Subject: Login issue after password...   |
|   #1041 Billing que...    | Status: Open | Priority: High            |
|   #1040 Feature req...    | Contact: John Smith                      |
|                           |                                          |
|                           | Description:                             |
|                           | I changed my password yesterday and now  |
|                           | I cannot log in. I've tried resetting... |
|                           |                                          |
|                           | [Reply] [Add Note] [Change Status v]     |
+---------------------------+------------------------------------------+
```

**Implementation approach:**
- Click on a ticket row to open a right-side preview panel (40-60% width)
- The list narrows but remains navigable
- Arrow keys navigate between tickets in the list
- Double-click or "Open Full" button navigates to the full detail page
- Escape key closes the preview panel

### 2.5 Pagination Strategy

**Recommendation: Cursor-based pagination with page numbers.**

| Pattern | When to Use |
|---------|-------------|
| **Page numbers** | Default for ticket lists (goal-oriented browsing) |
| **Infinite scroll** | NOT recommended for tickets (users need to refind items, have specific goals) |
| **Load more button** | Acceptable alternative to pagination for mobile |
| **Virtual scrolling** | For very large datasets (1000+ visible items) |

**Pagination component:**

```
Showing 1-25 of 156 tickets | Items per page: [10] [25] [50] [100]
[< Prev] [1] [2] [3] ... [7] [Next >]
```

- Default: 25 items per page
- Persist user's page size preference
- Show total count for context
- Support keyboard navigation (Left/Right arrows)

---

## 3. Ticket Detail Page

### 3.1 Page Layout (Three-Column Pattern)

The ticket detail page is where agents spend the most time. Use a layout that maximizes efficiency.

**Layout structure:**

```
+----------------------------------------------------------------------+
| < Back to Tickets                            [Prev Ticket] [Next Ticket] |
+----------------------------------------------------------------------+
| HEADER                                                                |
| Ticket #1042: Login issue after password reset                        |
| [Open v]  [!High]  Pipeline: Support  |  Created: 2h ago by J.Smith  |
| [Actions v: Merge | Clone | Print | Delete]                          |
+======================================================================+
|                                     |                                |
| MAIN CONTENT (60%)                  | SIDEBAR (40%)                  |
|                                     |                                |
| +--------------------------------+  | +----------------------------+ |
| | Conversation Thread            |  | | TICKET PROPERTIES          | |
| |                                |  | | Status:    [Open v]        | |
| | [J. Smith] 2h ago             |  | | Priority:  [High v]        | |
| | I changed my password and now |  | | Assignee:  [@agent1 v]     | |
| | I cannot log in...            |  | | Pipeline:  [Support v]     | |
| |                                |  | | Category:  [Account v]     | |
| | [Agent1 - Internal Note] 1h   |  | | Source:    Email            | |
| | Checked auth logs, seeing 403 |  | | SLA:                       | |
| | errors after pwd change.      |  | | Response:  [====] 1h left  | |
| |                                |  | | Resolution:[==  ] 6h left  | |
| | [Agent1 - Public Reply] 30m   |  | +----------------------------+ |
| | Hi John, I've identified the  |  |                                |
| | issue. Could you try...       |  | +----------------------------+ |
| |                                |  | | CONTACT INFO               | |
| +--------------------------------+  | | John Smith                 | |
|                                     | | john@company.com           | |
| +--------------------------------+  | | Company: Acme Corp         | |
| | REPLY BOX                      |  | | [View Contact Record]      | |
| |                                |  | +----------------------------+ |
| | [Reply] [Note] [Forward]       |  |                                |
| |                                |  | +----------------------------+ |
| | [Rich text editor area]        |  | | ASSOCIATIONS               | |
| |                                |  | | Company: Acme Corp         | |
| | [@ Mention] [# Template]      |  | | Deal: Enterprise Plan      | |
| | [Attachment] [Knowledge Base]  |  | | Related Tickets: #1038     | |
| |                                |  | +----------------------------+ |
| | [Send Reply v] [Discard]       |  |                                |
| +--------------------------------+  | +----------------------------+ |
|                                     | | ACTIVITY TIMELINE          | |
| +--------------------------------+  | | - Status: New -> Open      | |
| | ACTIVITY LOG (Collapsible)     |  | | - Assigned to Agent1       | |
| +--------------------------------+  | | - Priority: Normal -> High | |
|                                     | +----------------------------+ |
+----------------------------------------------------------------------+
```

### 3.2 Header Section

**Required elements:**

| Element | Design Pattern |
|---------|---------------|
| **Ticket ID** | `#1042` - monospace font, clickable to copy |
| **Subject line** | Editable on click (inline editing), H2 size |
| **Status badge** | Colored pill badge (see Section 5) |
| **Priority indicator** | Colored icon + text (see Section 5) |
| **Pipeline name** | Subtle text or breadcrumb: `Support > Technical` |
| **Creation info** | "Created 2h ago by John Smith via Email" |
| **Navigation** | Previous/Next ticket arrows for sequential processing |
| **Actions dropdown** | Merge, Clone, Print, Delete (with confirmation), Follow/Unfollow |

### 3.3 Conversation Thread

The conversation thread is the core of the ticket detail page. It displays the full history of interactions.

**Message types with visual differentiation:**

| Type | Visual Treatment | Background | Icon |
|------|-----------------|------------|------|
| **Customer message** | Left-aligned, no accent | `gray-50` | User avatar |
| **Public reply** (agent) | Right-aligned or full-width, brand accent | `white` with `cyan-600` left border | Agent avatar |
| **Internal note** | Full-width, warning accent | `amber-50` with `amber-400` left border | Lock/Eye-off icon |
| **System event** | Centered, muted | Inline gray text | System icon |
| **Forwarded message** | Full-width, info accent | `blue-50` with `blue-400` left border | Forward icon |

**Internal notes UX patterns:**

```
+----------------------------------------------------------------------+
| [Lock icon] Internal Note - visible only to your team                |
| +------------------------------------------------------------------+ |
| | This is a private note. The customer will NOT see this.          | |
| | Background: amber-50                                             | |
| +------------------------------------------------------------------+ |
| | IMPORTANT: Add a persistent yellow warning banner when the       | |
| | reply box is in "Note" mode to prevent accidental public posts.  | |
+----------------------------------------------------------------------+
```

**Thread display options:**
- Default: Newest messages at bottom (chat-like natural reading order)
- Option to reverse: Newest at top (email-like, configurable per user)
- Collapse long messages with "Show more" after 5 lines
- Expand/collapse all system events
- Rich content support: images, code blocks, lists, links

### 3.4 Reply/Comment Box

```
+----------------------------------------------------------------------+
| [Reply]  [Note]  [Forward]                                           |
+----------------------------------------------------------------------+
| [Warning banner: "You are writing an INTERNAL NOTE" - only in Note]  |
+----------------------------------------------------------------------+
|                                                                      |
| [B] [I] [U] [Link] [Code] [List] [Image] [Table]                    |
|                                                                      |
| Type your reply here...                                              |
|                                                                      |
|                                                                      |
+----------------------------------------------------------------------+
| [@] Mention  [#] Canned Response  [KB] Knowledge Base  [Attach]     |
+----------------------------------------------------------------------+
| Status after send: [Open v]  |  [Send Reply]  [v: Send & Close]     |
+----------------------------------------------------------------------+
```

**Key UX patterns for the reply box:**

1. **Tab switching:** Reply / Note / Forward tabs with clear visual mode indicators
2. **Rich text editor:** Toolbar with essential formatting (bold, italic, links, code, lists)
3. **Canned response insertion:** Type `#` to search and insert predefined responses
4. **@mention:** Type `@` to mention team members (triggers notification)
5. **Knowledge base linking:** Insert KB article links with preview
6. **Status change on send:** Dropdown to set status after sending (e.g., "Send & set to Waiting")
7. **Draft auto-save:** Save drafts every 30 seconds to prevent data loss
8. **Signature auto-append:** For public replies, append agent's email signature
9. **CC/BCC fields:** Expandable for public replies
10. **Collision detection:** Show warning if another agent is also replying ("Agent2 is typing...")

### 3.5 Sidebar Properties

**Property panel design:**

- Editable inline (click to change, auto-saves)
- Grouped into collapsible sections
- SLA timers prominently displayed
- Custom properties rendered dynamically based on pipeline

**Core property groups:**

| Section | Properties |
|---------|-----------|
| **Ticket Details** | Status, Priority, Pipeline, Stage, Category, Source, Tags |
| **SLA** | Time to First Response (timer), Time to Resolution (timer) |
| **Assignment** | Owner/Assignee, Team |
| **Contact** | Name, email, phone, company (linked to CRM) |
| **Dates** | Created, Last Updated, Due Date, Closed Date |
| **Associations** | Company, Deals, Related Tickets |
| **Custom Properties** | Dynamic fields based on pipeline configuration |

### 3.6 Activity Timeline

A chronological log of all changes made to the ticket.

```
Activity Log
--------------------------------------------------
[clock] 2 min ago     Status changed: New -> Open (by System - auto-assignment rule)
[user]  5 min ago     Assigned to Agent1 (by System - round-robin)
[edit]  10 min ago    Priority changed: Normal -> High (by Agent1)
[tag]   15 min ago    Tag added: "password-reset" (by Agent1)
[merge] 30 min ago    Ticket #1039 merged into this ticket (by Agent2)
--------------------------------------------------
```

**Pattern details:**
- Distinct icons for each event type (status change, assignment, property edit, merge, etc.)
- Timestamp with relative time ("2 min ago") and absolute on hover ("Feb 9, 2026 14:32")
- Actor attribution (who made the change)
- Collapsible by default to keep focus on conversation
- Filterable: "Show all" / "Property changes only" / "Assignments only"

---

## 4. SLA Visual Indicators

### 4.1 SLA Timer Component

The SLA timer is critical for agents to prioritize their work effectively.

**Timer states and visual treatment:**

| State | Time Remaining | Color | Icon | Visual |
|-------|---------------|-------|------|--------|
| **On Track** | > 50% remaining | `green-500` / `teal-500` | Clock | Solid green progress bar |
| **Warning** | 25-50% remaining | `amber-500` | Clock with alert | Yellow progress bar, subtle pulse |
| **At Risk** | < 25% remaining | `orange-500` | Warning triangle | Orange progress bar, visible pulse |
| **Breached** | Past due | `red-500` | X circle | Red, counting UP (time overdue) |
| **Paused** | Waiting on customer | `gray-400` | Pause icon | Gray, frozen timer |
| **Completed** | Met SLA | `green-500` | Check circle | Green check, "Met in 2h 15m" |

### 4.2 Timer Display Formats

**Compact (for list view / cards):**

```
Response SLA: [====----] 2h left     (green/yellow/red progress bar)
Resolution:  [========] BREACHED +1h (red, counting up)
```

**Expanded (for ticket detail sidebar):**

```
+----------------------------------------+
| SLA Goals                              |
+----------------------------------------+
| First Response                         |
| Target: 4 hours                        |
| [==========----------] 2h 15m left     |
| Due by: Feb 9, 2026 16:30              |
+----------------------------------------+
| Resolution                             |
| Target: 24 hours                       |
| [====------------------] 18h 30m left  |
| Due by: Feb 10, 2026 10:00             |
+----------------------------------------+
```

**Countdown display patterns:**

| Time Remaining | Display Format | Example |
|---------------|----------------|---------|
| > 24 hours | Days + Hours | "2d 4h left" |
| 1-24 hours | Hours + Minutes | "5h 30m left" |
| < 1 hour | Minutes + Seconds | "45m 12s left" |
| Breached | Negative elapsed time | "Overdue by 2h 15m" |

### 4.3 SLA in List View

```
| Ticket   | Subject        | SLA Status                    |
|----------|----------------|-------------------------------|
| #1042    | Login issue    | [green dot] Response: 2h left |
| #1041    | Billing query  | [yellow dot] Response: 30m    |
| #1040    | Outage report  | [red dot] BREACHED +1h        |
| #1039    | Feature req    | [gray dot] Paused             |
```

### 4.4 SLA Notification Patterns

| Trigger | Notification Type | Recipient |
|---------|-------------------|-----------|
| SLA at 50% | In-app badge | Assigned agent |
| SLA at 75% (warning) | In-app + email | Assigned agent |
| SLA at 90% (critical) | In-app + email + push | Agent + team lead |
| SLA breached | In-app + email + push + escalation | Agent + manager + auto-reassign |
| SLA paused | In-app badge update | Assigned agent |

---

## 5. Priority & Status Visual Hierarchy

### 5.1 Priority Levels

**F-CORE Priority System (mapping to design tokens):**

| Priority | Color | Tailwind Classes | Icon | Badge Style |
|----------|-------|-----------------|------|-------------|
| **Urgent** | Red | `bg-red-50 text-red-700 border-red-200` | `AlertTriangle` (Lucide) | Filled pill with icon, pulsing dot |
| **High** | Orange | `bg-orange-50 text-orange-700 border-orange-200` | `ArrowUp` (Lucide) | Filled pill with icon |
| **Normal** | Blue | `bg-blue-50 text-blue-700 border-blue-200` | `Minus` (Lucide) | Outlined pill |
| **Low** | Gray | `bg-gray-50 text-gray-600 border-gray-200` | `ArrowDown` (Lucide) | Outlined pill, muted |

**Priority badge component:**

```tsx
// Visual representation (not actual code yet)
<Badge variant="urgent">  // red pill + AlertTriangle icon + "Urgent" text
<Badge variant="high">    // orange pill + ArrowUp icon + "High" text
<Badge variant="normal">  // blue pill + Minus icon + "Normal" text
<Badge variant="low">     // gray pill + ArrowDown icon + "Low" text
```

**Priority in different contexts:**

| Context | Display |
|---------|---------|
| List view | Small colored dot + text or icon-only for compact |
| Kanban card | Left border color accent + small badge |
| Ticket header | Full pill badge with icon and text |
| Notifications | Icon + color-coded text |

### 5.2 Status System

**F-CORE Ticket Status Flow:**

```
[New] --> [Open] --> [In Progress] --> [Waiting] --> [Resolved] --> [Closed]
                          |                ^             |
                          +---- [Escalated] ----+        |
                          |                              |
                          +----------- [Reopened] -------+
```

**Status badge definitions:**

| Status | Color | Tailwind Classes | Dot Color | Description |
|--------|-------|-----------------|-----------|-------------|
| **New** | Green | `bg-green-50 text-green-700` | `bg-green-500` | Just created, not yet viewed |
| **Open** | Cyan | `bg-cyan-50 text-cyan-700` | `bg-cyan-500` | Acknowledged, work not started |
| **In Progress** | Blue | `bg-blue-50 text-blue-700` | `bg-blue-500` | Agent actively working on it |
| **Waiting** | Amber | `bg-amber-50 text-amber-700` | `bg-amber-500` | Waiting on customer response |
| **Escalated** | Purple | `bg-purple-50 text-purple-700` | `bg-purple-500` | Escalated to higher tier |
| **Resolved** | Teal | `bg-teal-50 text-teal-700` | `bg-teal-500` | Solution provided |
| **Closed** | Gray | `bg-gray-100 text-gray-500` | `bg-gray-400` | Finalized, no further action |
| **Reopened** | Rose | `bg-rose-50 text-rose-700` | `bg-rose-500` | Previously resolved, new activity |

**Status badge component pattern:**

```
+------------------+
| [dot] In Progress|  <-- pill badge with colored dot + text
+------------------+

Alternative (compact): [blue dot only] with tooltip "In Progress"
```

### 5.3 Accessibility Considerations

- NEVER use color alone to convey meaning (WCAG 2.2 - 1.4.1)
- Always pair color with text labels, icons, or patterns
- Status dots must have adjacent text or icon as secondary indicator
- Ensure sufficient contrast ratios (4.5:1 minimum for text)
- Priority icons provide meaning independent of color (arrows, triangles)
- Use `aria-label` attributes on all status/priority badges

---

## 6. Agent Experience

### 6.1 Assignment & Notifications

**Assignment methods:**

| Method | UX Pattern | When to Use |
|--------|-----------|-------------|
| **Round-robin** | Auto-assign, agent sees new ticket in queue | Default for general queues |
| **Skill-based** | Route based on agent skills/categories | Specialized support teams |
| **Manual claim** | Agent clicks "Claim" on unassigned tickets | Low-volume, high-touch support |
| **Load-balanced** | Assign to agent with fewest open tickets | High-volume teams |
| **Manager assign** | Drag-and-drop from Kanban or dropdown | Team leads managing workload |

**Notification types:**

```
+--------------------------------------------------+
| [Bell icon with red badge: 3]                    |
+--------------------------------------------------+
| Notifications                                    |
|                                                  |
| [dot] Ticket #1042 assigned to you        2m ago |
|       Login issue after password reset           |
|                                                  |
| [dot] SLA Warning: #1038 - 30 min left   15m ago |
|       API error affecting integrations           |
|                                                  |
| [dot] New reply on #1035                 1h ago  |
|       John Smith responded to billing query      |
|                                                  |
| [View All Notifications]                         |
+--------------------------------------------------+
```

### 6.2 Quick Actions

Agents need to perform common operations with minimal clicks.

**Quick action patterns:**

| Action | UX Pattern | Keyboard Shortcut |
|--------|-----------|-------------------|
| **Change status** | Dropdown in header/sidebar, auto-save | `S` then arrow keys |
| **Assign to self** | "Claim" button or "Assign to me" | `A` |
| **Change priority** | Click priority badge to cycle or dropdown | `P` |
| **Add internal note** | Quick note input in ticket detail | `N` |
| **Merge tickets** | Search and select duplicate ticket | `M` |
| **Snooze/Follow-up** | Set reminder date/time | `Z` |
| **Copy ticket link** | Click ticket ID to copy URL | `C` |
| **Navigate tickets** | Previous/Next arrows in detail view | `J` / `K` (Vim-style) |

**Floating Quick Action Bar (on ticket selection in list):**

```
+----------------------------------------------------------------------+
| 3 tickets selected: [Assign v] [Status v] [Priority v] [Merge] [x]  |
+----------------------------------------------------------------------+
```

### 6.3 Canned Responses / Macros

Canned responses (also called macros, snippets, or templates) allow agents to insert pre-written replies.

**Insertion UX:**

1. **Shortcode trigger:** Type `#` in the reply box to open a searchable dropdown
2. **Sidebar panel:** Dedicated canned response panel with categories and search
3. **Keyboard shortcut:** Ctrl+Shift+M to open macro selector

**Canned response features:**

| Feature | Description |
|---------|-------------|
| **Variable interpolation** | `{{contact.first_name}}`, `{{ticket.id}}`, `{{agent.name}}` |
| **Categories** | Organize by topic: Billing, Technical, General, Closures |
| **Search** | Full-text search across response titles and content |
| **Personal vs Shared** | Agent-specific macros vs team/org-wide macros |
| **Multi-action macros** | Insert text + change status + change priority in one click |
| **Preview** | Show rendered response before inserting |
| **Analytics** | Track which macros are used most/least |

**Macro selector UI:**

```
+---------------------------------------------+
| # Search macros...                          |
+---------------------------------------------+
| Personal Macros                             |
|   [star] My follow-up template              |
|   [star] Technical investigation            |
+---------------------------------------------+
| Shared - Billing                            |
|   Refund acknowledgment                     |
|   Payment issue follow-up                   |
|   Invoice request                           |
+---------------------------------------------+
| Shared - Technical                          |
|   Password reset instructions               |
|   Browser troubleshooting steps             |
|   API rate limit explanation                 |
+---------------------------------------------+
```

### 6.4 Agent Workload Visibility

**Team dashboard patterns:**

```
+----------------------------------------------------------------------+
| Team Workload                                                        |
+----------------------------------------------------------------------+
| Agent       | Open | In Progress | Waiting | Avg Response | CSAT     |
|-------------|------|-------------|---------|-------------|----------|
| @agent1     | 8    | 3           | 5       | 1h 12m      | 92%      |
| @agent2     | 12   | 5           | 2       | 45m         | 88%      |
| @agent3     | 4    | 2           | 1       | 2h 30m      | 95%      |
| Unassigned  | 6    | --          | --      | --          | --       |
+----------------------------------------------------------------------+
```

**Individual agent dashboard:**

```
+----------------------------------------------------------------------+
| My Dashboard                                                         |
+----------------------------------------------------------------------+
| [12] Open Tickets  [3] SLA At Risk  [1] Overdue  [8] Resolved Today |
+----------------------------------------------------------------------+
| Priority Queue (sorted by SLA urgency)                               |
| 1. #1042 - Login issue        [!High] SLA: 30m left  [Open Ticket]  |
| 2. #1038 - API error          [!Urgent] SLA: 1h left [Open Ticket]  |
| 3. #1041 - Billing query      [Normal] SLA: 4h left  [Open Ticket]  |
+----------------------------------------------------------------------+
```

### 6.5 Collision Detection

When multiple agents work on the same ticket, prevent duplicate work.

**Patterns:**
- Show avatars of other agents currently viewing the ticket
- Display "Agent2 is typing a reply..." warning in real-time
- Lock the reply box if another agent is actively composing (optional, configurable)
- Show tooltip: "Agent2 is also viewing this ticket"

```
+----------------------------------------------------------------------+
| Ticket #1042                          [Agent2 avatar] Also viewing   |
+----------------------------------------------------------------------+
| [!] Agent2 is currently typing a reply to this ticket                |
+----------------------------------------------------------------------+
```

---

## 7. Implementation Recommendations for F-CORE

### 7.1 Phase 1: MVP (Must Have)

| Feature | Priority | Complexity |
|---------|----------|------------|
| Ticket creation form (slide-over) | P0 | Medium |
| Ticket list view with sorting/filtering | P0 | High |
| Ticket detail page (conversation + sidebar) | P0 | High |
| Status badges and priority indicators | P0 | Low |
| Reply box with public/internal note toggle | P0 | Medium |
| Basic SLA timer display | P0 | Medium |
| Manual ticket assignment | P0 | Low |
| Pagination (cursor-based) | P0 | Medium |

### 7.2 Phase 2: Enhanced (Should Have)

| Feature | Priority | Complexity |
|---------|----------|------------|
| Kanban board view | P1 | High |
| Saved views (named filters) | P1 | Medium |
| Canned responses / macros | P1 | Medium |
| Bulk actions | P1 | Medium |
| Activity timeline | P1 | Medium |
| SLA notifications and escalation | P1 | High |
| Quick preview panel | P1 | Medium |
| Inline editing in list view | P1 | Medium |

### 7.3 Phase 3: Advanced (Nice to Have)

| Feature | Priority | Complexity |
|---------|----------|------------|
| Collision detection | P2 | High |
| Ticket merging | P2 | High |
| Agent workload dashboard | P2 | High |
| Keyboard shortcuts | P2 | Low |
| Custom views sharing | P2 | Medium |
| Multi-action macros | P2 | Medium |
| Knowledge base deflection | P2 | High |
| Customer portal (self-service) | P2 | Very High |

### 7.4 Component Architecture

**Suggested React component tree:**

```
TicketModule/
  TicketListPage/
    TicketFilters          - Filter chips bar
    TicketViewSwitcher     - List / Kanban / Table toggle
    TicketListView         - Default list with sortable columns
    TicketKanbanView       - Drag-and-drop board
    TicketTableView        - Full data table
    TicketQuickPreview     - Right panel preview
    TicketPagination       - Page controls
    TicketBulkActions      - Floating bar for multi-select
  TicketDetailPage/
    TicketHeader           - ID, subject, status, priority, actions
    TicketConversation     - Message thread
      MessageBubble        - Individual message (customer/agent/note/system)
    TicketReplyBox         - Rich text reply/note/forward composer
    TicketSidebar/
      TicketProperties     - Editable property fields
      SLATimer             - Visual countdown timer
      ContactInfo          - Associated contact card
      TicketAssociations   - Links to companies, deals
      ActivityTimeline     - Chronological event log
  TicketCreateForm/
    TicketCreateDrawer     - Slide-over panel
    TicketFieldRenderer    - Dynamic field rendering
  Shared/
    StatusBadge            - Reusable status pill component
    PriorityBadge          - Reusable priority pill component
    SLAIndicator           - Compact SLA progress display
    CannedResponsePicker   - Macro search and insert
    TicketCard             - Card for Kanban view
```

### 7.5 Data Model Reference

These UX patterns assume the following ticket entity structure (to be validated against `prisma.schema`):

```
Ticket {
  id              String
  ticketNumber    Int (auto-increment, display as #1042)
  subject         String
  description     String (rich text / HTML)
  status          Enum (NEW, OPEN, IN_PROGRESS, WAITING, ESCALATED, RESOLVED, CLOSED, REOPENED)
  priority        Enum (URGENT, HIGH, NORMAL, LOW)
  source          Enum (EMAIL, CHAT, PHONE, PORTAL, MANUAL)
  pipelineId      String (FK -> Pipeline)
  stageId         String (FK -> PipelineStage)
  categoryId      String (FK -> TicketCategory)
  assigneeId      String (FK -> User, nullable)
  contactId       String (FK -> Contact)
  companyId       String (FK -> Company, nullable)
  tenantId        String (FK -> Tenant, REQUIRED for multi-tenancy)
  slaResponseDue  DateTime (nullable)
  slaResolveDue   DateTime (nullable)
  slaResponseMet  Boolean (nullable)
  slaResolveMet   Boolean (nullable)
  tags            String[] (array)
  createdAt       DateTime
  updatedAt       DateTime
  closedAt        DateTime (nullable)
  deletedAt       DateTime (nullable, soft delete)
}

TicketComment {
  id              String
  ticketId        String (FK -> Ticket)
  authorId        String (FK -> User)
  type            Enum (PUBLIC_REPLY, INTERNAL_NOTE, FORWARD, SYSTEM)
  body            String (rich text / HTML)
  attachments     Attachment[] (relation)
  tenantId        String (FK -> Tenant)
  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime (nullable, soft delete)
}

TicketActivity {
  id              String
  ticketId        String (FK -> Ticket)
  actorId         String (FK -> User, nullable for system events)
  action          Enum (STATUS_CHANGED, PRIORITY_CHANGED, ASSIGNED, UNASSIGNED, MERGED, TAG_ADDED, TAG_REMOVED, PROPERTY_CHANGED)
  oldValue        String (nullable)
  newValue        String (nullable)
  tenantId        String (FK -> Tenant)
  createdAt       DateTime
}

CannedResponse {
  id              String
  title           String
  body            String (rich text with variable placeholders)
  category        String
  scope           Enum (PERSONAL, TEAM, ORGANIZATION)
  ownerId         String (FK -> User, for personal scope)
  tenantId        String (FK -> Tenant)
  usageCount      Int (for analytics/sorting)
  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime (nullable, soft delete)
}
```

### 7.6 Design Token Mapping (F-CORE Design System)

These patterns should use the existing F-CORE design tokens:

| UX Element | F-CORE Token | Tailwind |
|------------|-------------|----------|
| Primary actions (Reply, Create) | Ocean Blue | `bg-cyan-600 hover:bg-sky-500` |
| Status badges | See Section 5.2 | Per-status color mapping |
| Priority badges | See Section 5.1 | Per-priority color mapping |
| SLA on-track | Success | `text-teal-500` |
| SLA warning | Warning | `text-amber-400` |
| SLA breached | Error | `text-red-500` |
| Internal note background | Warning light | `bg-amber-50` |
| Card borders | Border | `border-gray-200` |
| Text in properties | Text Secondary | `text-gray-600` |
| Muted/disabled text | Text Muted | `text-gray-400` |

---

## References

- [Coveo: 8 Support Ticket UI Best Practices](https://www.coveo.com/blog/support-ticket-ui-best-practices/)
- [Freshdesk: Ticket Details View](https://support.freshdesk.com/support/solutions/articles/37588-understand-the-ticket-details-view)
- [Freshservice: Kanban Board for Tickets](https://support.freshservice.com/support/solutions/articles/50000004013)
- [HubSpot: Service Hub Ticketing System](https://www.hubspot.com/products/service/ticketing-system)
- [HubSpot: SLA Goals in Help Desk](https://knowledge.hubspot.com/help-desk/set-sla-goals-in-help-desk)
- [Mojo Helpdesk: Ticket Status Colors](https://www.mojohelpdesk.com/blog/2025/06/mojo-ticket-status-colors-refreshed)
- [NNGroup: Infinite Scrolling Tips](https://www.nngroup.com/articles/infinite-scrolling-tips/)
- [Revelation Helpdesk: SLA Timelines Guide](https://revelationhelpdesk.com/blog/post/SLA-Timelines)
- [Smashing Magazine: Infinite Scroll Done Right](https://www.smashingmagazine.com/2022/03/designing-better-infinite-scroll/)
- [UX StackExchange: Color Coding for Ticket Status](https://ux.stackexchange.com/questions/133399/)
- [UX StackExchange: Color Palette for Priority](https://ux.stackexchange.com/questions/95706/)
- [Zendesk: Contextual Workspaces](https://www.zendesk.com/blog/enhancing-agent-experience-contextual-workspaces/)
- [Zendesk: Side Conversations](https://support.zendesk.com/hc/en-us/articles/4408832279962)
- [Medium: Better UX for Support Ticket Systems](https://medium.com/everestengineering/better-ux-for-support-ticket-systems-875858a50628)
- [Dell Design System: Badge Component](https://www.delldesignsystem.com/components/badge)
- [Jitbit: Helpdesk Ticket Priority Levels](https://www.jitbit.com/news/helpdesk-ticket-priority-levels/)
