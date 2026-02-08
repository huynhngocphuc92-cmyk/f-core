# Email Marketing UX Patterns Research

> **Project:** F-CORE (HubSpot CRM Clone)
> **Date:** 2026-02-08
> **Author:** UX Analyst (AI-Assisted)
> **Status:** Research Complete
> **Sources:** HubSpot, Mailchimp, Klaviyo, Brevo, Stripo, Beefree, Customer.io, ActiveCampaign, MailerLite, Campaign Monitor, industry UX research

---

## Table of Contents

1. [Email Editor UX Patterns](#1-email-editor-ux-patterns)
2. [Campaign Creation Flow](#2-campaign-creation-flow)
3. [List Management UX](#3-list-management-ux)
4. [Analytics Dashboard UX](#4-analytics-dashboard-ux)
5. [Template Gallery UX](#5-template-gallery-ux)
6. [Mobile Considerations](#6-mobile-considerations)
7. [Wireframe Descriptions](#7-wireframe-descriptions)
8. [Implementation Recommendations for F-CORE](#8-implementation-recommendations-for-f-core)

---

## 1. Email Editor UX Patterns

### 1.1 Three-Panel Layout (Industry Standard)

The dominant pattern across HubSpot, Mailchimp, Brevo, Stripo, and Beefree uses a **three-panel layout**:

```
+-------------------+---------------------------+-------------------+
|                   |                           |                   |
|   LEFT SIDEBAR    |      EMAIL CANVAS         |   RIGHT PANEL     |
|   (Block Palette) |      (WYSIWYG Preview)    |   (Properties)    |
|                   |                           |                   |
|   - Content tab   |   Live drag-and-drop      |   Context-aware   |
|   - Style tab     |   editing area with        |   settings for    |
|   - Saved blocks  |   real email preview       |   selected block   |
|                   |                           |                   |
+-------------------+---------------------------+-------------------+
|                    TOOLBAR (Top Bar)                               |
|   [Undo] [Redo] [Preview] [Test] [Save] [Settings] [Send/Next]   |
+-------------------------------------------------------------------+
```

**Key observations from leaders:**

- **HubSpot:** Left sidebar with drag-and-drop modules. Inspector panel on right appears when a module is selected. Top toolbar with undo/redo, preview, and publish actions. Format selector (Default, Boxed, Simple) for overall email layout.
- **Brevo:** Three-tab left sidebar: Content (blocks), Style (global settings), and AI (content generation). Content blocks include Title, Text, Image, Button, Social, Divider, Spacer, HTML, Video, and Table.
- **Stripo:** Adds a dual-mode approach -- drag-and-drop AND code editor. Users can switch between visual editing and HTML/CSS editing per block.
- **Beefree:** Clean left panel with content blocks that snap into place. Known as the fastest and most intuitive builder. Good defaults so even quick builds look professional.
- **Customer.io:** Separates Rows (structure) from Content (elements). Users first define row structure (1-column, 2-column, etc.), then drag content blocks into rows.

### 1.2 Content Block Types (Standard Palette)

Based on analysis of 10+ email builders, the **essential content blocks** are:

| Block Type | Icon | Description | Priority |
|---|---|---|---|
| **Text** | `T` | Rich text with formatting toolbar | P0 - Must Have |
| **Heading** | `H` | H1-H3 with preset styles | P0 - Must Have |
| **Image** | Picture icon | Upload, URL, or stock photo picker | P0 - Must Have |
| **Button** | CTA icon | Configurable CTA with link | P0 - Must Have |
| **Divider** | Line icon | Horizontal rule (solid, dashed, dotted) | P0 - Must Have |
| **Spacer** | Arrows icon | Adjustable blank space | P0 - Must Have |
| **Columns** | Grid icon | 2-4 column layouts | P1 - Should Have |
| **Social** | Share icon | Social media icon links | P1 - Should Have |
| **Video** | Play icon | YouTube/Vimeo embed (thumbnail+link) | P1 - Should Have |
| **HTML** | Code icon | Raw HTML block for advanced users | P1 - Should Have |
| **Table** | Grid icon | Tabular data display | P2 - Nice to Have |
| **Menu** | Nav icon | Navigation links row | P2 - Nice to Have |
| **Product** | Cart icon | Dynamic product card from CRM | P2 - Nice to Have |
| **Footer** | Footer icon | Pre-configured legal footer | P1 - Should Have |

### 1.3 Block Palette UX (Sidebar vs. Inline)

**Sidebar approach (recommended, used by 90%+ of tools):**

- Left sidebar with scrollable list of available blocks
- Blocks organized into tabs or sections: "Content," "Layout/Structure," "Saved Blocks"
- Drag-and-drop from sidebar to canvas
- Visual affordance: block thumbnails with label text
- Collapse/expand sidebar to maximize canvas space

**Inline approach (less common):**

- Plus (+) button appears between existing blocks on hover
- Opens a popover/dropdown with block type options
- Used by Notion-style editors, less common in email builders
- Better for simple content but less discoverable for new users

**F-CORE recommendation:** Use the sidebar approach for primary block palette. Additionally, show a small "+" insertion point between blocks on the canvas for quick inline additions.

### 1.4 Property Panel (Right Panel / Inspector)

The right panel is **context-sensitive** and changes based on what is selected:

**When no block is selected -- Global Settings:**
- Email background color
- Default typeface and font size
- Default link color
- Content area width (typically 600px default)
- Default padding/margins

**When a block is selected -- Block Properties:**

```
+----------------------------------+
|  TEXT BLOCK PROPERTIES           |
|                                  |
|  Content                         |
|  [Rich text editor area]        |
|                                  |
|  Typography                      |
|  Font:     [Inter        v]     |
|  Size:     [16px         v]     |
|  Color:    [#333333      ]      |
|  Line-h:   [1.5          ]     |
|                                  |
|  Spacing                         |
|  Padding:  [16] [16] [16] [16]  |
|  Margin:   [0]  [0]  [0]  [0]  |
|                                  |
|  Background                      |
|  Color:    [transparent  ]      |
|                                  |
|  Responsive                      |
|  [ ] Hide on mobile             |
|  [ ] Hide on desktop            |
|                                  |
|  [Duplicate] [Delete]           |
+----------------------------------+
```

**Key properties per block type:**

- **Image:** Source URL, alt text, link URL, width (auto/fixed), alignment, border-radius
- **Button:** Label text, link URL, background color, text color, border-radius, padding, alignment, full-width toggle
- **Columns:** Column count, column widths (ratio), vertical alignment, stacking behavior on mobile
- **Social:** Platform selection (checkboxes), icon style (filled/outlined/colored), layout (horizontal/vertical), icon size

### 1.5 Preview Modes

Standard preview modes offered by leading tools:

| Mode | Trigger | Behavior |
|---|---|---|
| **Desktop Preview** | Toggle button or keyboard shortcut | Shows email at full width (600-700px content area) |
| **Mobile Preview** | Toggle button | Shows email in a phone-frame viewport (~375px) |
| **Dark Mode Preview** | Toggle button | Simulates dark mode rendering |
| **Plain Text Preview** | Tab or toggle | Shows plain-text fallback version |
| **Inbox Preview** | Modal or new tab | Shows how subject line, preheader, and sender appear in inbox |
| **Send Test Email** | Button in toolbar | Sends actual test email to specified address(es) |
| **Client Preview** | Third-party integration | Shows rendering across Gmail, Outlook, Apple Mail, etc. (Litmus/Email on Acid) |

**F-CORE MVP recommendation:** Desktop Preview, Mobile Preview, and Send Test Email. Dark mode preview as P1.

### 1.6 Undo/Redo, Save, and Autosave

**Best practices observed across platforms:**

- **Undo/Redo:** Keyboard shortcuts (Cmd+Z / Cmd+Shift+Z) and toolbar buttons. Track granular operations (text edits, block moves, property changes, block additions/deletions). Stack depth of 30-50 operations is typical.
- **Autosave:** Every 30-60 seconds, or on significant actions (block add/delete/move). Show "Saved" indicator with timestamp in the toolbar. No manual save button required when autosave is active -- but keep it visible as a reassurance element.
- **Draft Status:** Emails start as "Draft." Show draft label in the header bar. Allow naming/renaming the email at any time.
- **Version History:** Advanced feature (P2). Show list of auto-saved versions with timestamps. Allow restoring to a previous version.

### 1.7 Template Selection at Editor Entry

When users create a new email, the first screen is typically a template chooser:

```
+---------------------------------------------------------------+
|  Create New Email                                    [X Close] |
|                                                                |
|  +-------------------+  +-------------------+                  |
|  | [Start from       |  | [Use a Template]  |                  |
|  |  Scratch]          |  |                   |                  |
|  | Blank canvas       |  | Browse gallery    |                  |
|  +-------------------+  +-------------------+                  |
|                                                                |
|  -- OR choose a recently used template --                      |
|                                                                |
|  [Template 1]  [Template 2]  [Template 3]  [Template 4]       |
+---------------------------------------------------------------+
```

The user either selects "Start from scratch" (blank layout with header/footer) or browses the template gallery (see Section 5).

---

## 2. Campaign Creation Flow

### 2.1 Multi-Step Wizard (Industry Standard)

The overwhelming industry pattern is a **multi-step wizard** with 4-5 steps. Analysis of HubSpot, Klaviyo, Mailchimp, Brevo, and Customer.io reveals a consistent flow:

```
[1. Setup/Recipients] --> [2. Content/Design] --> [3. Settings] --> [4. Review] --> [5. Send/Schedule]
```

**Klaviyo's implementation (3-step condensed):**
1. Recipients + Settings (name, list, send method)
2. Content (template selection, subject line, editor)
3. Review + Send/Schedule

**HubSpot's implementation (integrated):**
- All settings on one page with sidebar navigation
- Editor is the primary view
- Settings panel slides out from a tab
- Review and send from a top-right button that opens a checklist panel

**Mailchimp's implementation (classic wizard):**
1. To (recipients)
2. From (sender info)
3. Subject (subject line + preview text)
4. Content (template + editor)
5. Review + Send

### 2.2 Recommended Step Sequence for F-CORE

Based on research, the optimal flow for an enterprise CRM clone is:

```
Step 1: Campaign Setup
  - Campaign name (internal)
  - Email type: Regular / Automated / A/B Test
  - Recipients: Select list(s) or segment(s)
  - Show estimated recipient count dynamically

Step 2: Content & Design
  - Subject line + Preview text
  - Sender name + Sender email + Reply-to
  - Template selection or start from scratch
  - Full drag-and-drop editor

Step 3: Settings
  - Send time: Now / Schedule / Optimal send time
  - Tracking: Opens, clicks, Google Analytics UTM parameters
  - Subscription type / email category
  - Plain text version (auto-generated with manual override)

Step 4: Review & Send
  - Checklist of all settings with edit links
  - Warning indicators for missing/incomplete items
  - Suggestion indicators for best-practice improvements
  - Final recipient count with suppression details
  - [Send Test Email] [Schedule] [Send Now]
```

### 2.3 Progress Indicator

**Best practice pattern (from Airbnb, Klaviyo, Customer.io):**

```
+-----------------------------------------------------------+
|  (1) Setup    --->    (2) Content    --->    (3) Settings    --->    (4) Review  |
|  [=========]          [=====     ]          [          ]          [          ]   |
+-----------------------------------------------------------+
```

**Key UX guidelines for progress indicators:**
- Show step labels, not just numbers
- Allow clicking on completed steps to navigate back
- Do NOT allow jumping to future uncompleted steps
- Show validation status per step (green check for complete, red dot for errors)
- Keep the progress bar visible and fixed at the top of the wizard
- Use a horizontal stepper for 4-5 steps; use a sidebar stepper for 6+ steps

### 2.4 Validation at Each Step

**Per-step validation rules:**

| Step | Required Fields | Warnings | Suggestions |
|---|---|---|---|
| Setup | Campaign name, at least 1 recipient list | Empty list selected | Use segmented list for better engagement |
| Content | Subject line, at least 1 content block | Missing preview text, missing alt text on images, no CTA button | Personalize subject line with recipient name |
| Settings | Subscription type | Missing UTM tracking | Enable open/click tracking |
| Review | All required fields across steps | Low-quality subject line score | A/B test subject line for better results |

**Validation display patterns:**
- Inline validation on field blur (red border + error message below field)
- Step-level summary in a sidebar checklist (HubSpot pattern)
- "Required," "Warnings," and "Suggestions" grouped separately on the Review step
- Block sending if required fields are missing; allow sending with warnings

### 2.5 Draft Saving and Resumption

**Critical UX patterns:**
- Auto-save draft on every step change and every 30 seconds
- Show a "Draft" badge on the campaign in the list view
- Allow users to exit and resume from the exact step they left off
- Drafts appear in the campaign list with a "Continue editing" CTA
- Include "Last edited" timestamp and the user who last edited (for teams)
- Mailchimp pattern: "You can finish this later" message when user tries to close the wizard

---

## 3. List Management UX

### 3.1 Contact List Types

**Two fundamental list types (HubSpot model):**

| List Type | Description | Use Case |
|---|---|---|
| **Static List** | Manually curated, frozen snapshot | Event attendees, one-time imports, specific campaigns |
| **Active (Dynamic) List** | Auto-updates based on filter criteria | Ongoing segments like "engaged contacts," "new subscribers" |

### 3.2 List Creation Flow

```
Step 1: Choose List Type
  +---------------------------+---------------------------+
  |  [Active List]            |  [Static List]            |
  |  Auto-updates when        |  Fixed set of contacts    |
  |  contacts match criteria  |  that you manually manage |
  +---------------------------+---------------------------+

Step 2: Name and Configure
  - List name (required)
  - Description (optional)
  - Folder (optional, for organization)

Step 3: Define Criteria (Active Lists only)
  [Visual Segment Builder -- see 3.3]

Step 4: Preview
  - Show matching contact count
  - Show sample contacts (first 10-20)
  - Allow scrolling through full preview
```

### 3.3 Visual Segment Builder (Filter Conditions)

The segment builder is one of the most critical UX components. Based on research of HubSpot, Klaviyo, ActiveCampaign, and Airtable:

**Architecture: Rule Groups with AND/OR Logic**

```
+---------------------------------------------------------------+
|  SEGMENT BUILDER                                               |
|                                                                |
|  Contacts who match [ALL v] of the following rules:            |
|                                                                |
|  +-----------------------------------------------------------+|
|  | Rule Group 1                                    [x Delete] ||
|  |                                                             ||
|  | [Contact Property v] [Email v] [contains v] [gmail.com   ] ||
|  |                                                             ||
|  | [+ Add condition]    Logic within group: [AND v]           ||
|  +-----------------------------------------------------------+|
|                                                                |
|  --- [AND / OR] ---                                            |
|                                                                |
|  +-----------------------------------------------------------+|
|  | Rule Group 2                                    [x Delete] ||
|  |                                                             ||
|  | [Activity v] [Opened email v] [in last v] [30 days      ] ||
|  |                                                             ||
|  | [+ Add condition]    Logic within group: [AND v]           ||
|  +-----------------------------------------------------------+|
|                                                                |
|  [+ Add Rule Group]                                            |
|                                                                |
|  Estimated contacts: 1,247                                     |
+---------------------------------------------------------------+
```

**Filter condition structure:**

Each condition has 3-4 parts:
1. **Category selector:** Contact Property, Company Property, Deal Property, Activity, List Membership, Form Submission, Email Engagement, Page Visit
2. **Field selector:** Based on category (e.g., Email, First Name, City, Lifecycle Stage)
3. **Operator:** Based on field type:
   - Text: is, is not, contains, does not contain, starts with, ends with, is known, is unknown
   - Number: equals, not equal, greater than, less than, between
   - Date: is, is before, is after, is between, in last N days, more than N days ago
   - Enum: is any of, is none of
   - Boolean: is true, is false
4. **Value input:** Text field, number input, date picker, multi-select dropdown (depending on operator)

**Key UX details:**
- Show real-time count of matching contacts as rules change
- Allow grouping conditions with AND/OR logic
- Support nested groups for complex queries
- Highlight invalid or conflicting conditions
- "Preview" button to show sample matching contacts in a side panel or modal

### 3.4 List Preview

```
+---------------------------------------------------------------+
|  List: "Engaged Newsletter Subscribers"                        |
|  Type: Active | Contacts: 1,247 | Last updated: 2 min ago     |
|                                                                |
|  [Edit Criteria]  [Export]  [Use in Campaign]  [...More]       |
|                                                                |
|  +-----------------------------------------------------------+|
|  | Name           | Email              | Last Active | Score  ||
|  |----------------|--------------------+-------------|--------||
|  | Alice Johnson  | alice@company.com  | 2h ago      | 85     ||
|  | Bob Smith      | bob@startup.io     | 1d ago      | 72     ||
|  | Carol Lee      | carol@agency.net   | 3h ago      | 91     ||
|  | ...            | ...                | ...         | ...    ||
|  +-----------------------------------------------------------+|
|                                                                |
|  Showing 1-20 of 1,247    [< Prev]  1 2 3 ... 63  [Next >]   |
+---------------------------------------------------------------+
```

### 3.5 Import/Export Flows

**Import flow (multi-step):**

```
Step 1: Upload
  - Drag-and-drop CSV/XLSX file upload area
  - Or paste data directly
  - Show file validation (format, size, encoding)

Step 2: Map Fields
  - Auto-detect column headers
  - Map each CSV column to a CRM contact property
  - Show unmapped columns with warning
  - Option to create new properties for unmapped columns

Step 3: Configure
  - Choose target list (existing or new)
  - Duplicate handling: Skip / Update / Create new
  - Opt-in status: Mark contacts as opted-in or marketing-eligible

Step 4: Review
  - Show total rows, valid rows, error rows
  - Preview first 5 mapped records
  - Show error summary (invalid emails, missing required fields)

Step 5: Import
  - Progress bar with real-time count
  - Summary on completion: imported, updated, skipped, errors
  - Download error report
```

**Export flow:**
- Select list or segment to export
- Choose format: CSV, XLSX
- Choose fields: All or select specific properties
- Download immediately or receive via email for large exports

---

## 4. Analytics Dashboard UX

### 4.1 Campaign Performance Overview

**Primary metrics (above the fold):**

```
+---------------------------------------------------------------+
|  Campaign: "Summer Newsletter 2026"          Sent: Feb 5, 2026 |
|                                                                |
|  +----------+  +----------+  +----------+  +----------+       |
|  | SENT     |  | OPENED   |  | CLICKED  |  | BOUNCED  |       |
|  | 12,450   |  | 4,892    |  | 1,247    |  | 156      |       |
|  | 100%     |  | 39.3%    |  | 10.0%    |  | 1.3%     |       |
|  | ---      |  | +2.1% ^  |  | -0.5% v  |  | -0.2% ^  |       |
|  +----------+  +----------+  +----------+  +----------+       |
|                                                                |
|  +----------+  +----------+  +----------+                      |
|  | UNSUB    |  | SPAM     |  | DELIVERED|                      |
|  | 23       |  | 2        |  | 12,294   |                      |
|  | 0.18%    |  | 0.02%    |  | 98.7%    |                      |
|  +----------+  +----------+  +----------+                      |
+---------------------------------------------------------------+
```

**Design guidelines for metric cards:**
- Use large, bold numbers for the primary value
- Show percentage below the raw count
- Delta comparison vs. previous campaign or account average (with up/down arrow and color coding: green = improvement, red = decline)
- Use subtle background colors or left-border accents per metric category
- Cards should be clickable to drill down into detailed data

### 4.2 Engagement Over Time (Charts)

**Primary chart: Opens and Clicks over Time**

```
+---------------------------------------------------------------+
|  Engagement Over Time                    [24h] [7d] [30d] [All]|
|                                                                |
|  100% |                                                        |
|       |    .                                                   |
|  75%  |   / \                                                  |
|       |  /   \    Opens (area fill, blue)                      |
|  50%  | /     \______                                          |
|       |/             \_____                                    |
|  25%  |  .                 \____                               |
|       | / \   Clicks (line, teal)                              |
|   0%  |/___\________________________                           |
|       |-----|-----|-----|-----|-----|                           |
|       12pm  6pm   12am  6am   12pm                             |
+---------------------------------------------------------------+
```

**Chart guidelines:**
- Area chart for opens (with semi-transparent fill)
- Line chart for clicks overlaid on the same axes
- Time range selector: 24 hours, 7 days, 30 days, All time
- Tooltip on hover showing exact values at each time point
- Use the brand color palette (Ocean Blue #0891b2 for opens, complementary teal for clicks)

### 4.3 Click Map / Heat Map

**Concept: Visual overlay on the sent email showing click intensity per link**

```
+---------------------------------------------------------------+
|  Click Map                                                     |
|                                                                |
|  +------------------------------------------+                  |
|  |  [Logo]                          [View]  |                  |
|  |                                          |                  |
|  |  +------+  Summer Sale!                  |                  |
|  |  |IMAGE |  Save up to 50%               |                  |
|  |  | #### |                                |                  |
|  |  +------+                                |                  |
|  |                                          |                  |
|  |  [==== Shop Now (487 clicks) ====]      |  <-- Hot (red)   |
|  |                                          |                  |
|  |  Featured Products                       |                  |
|  |  +--------+ +--------+ +--------+       |                  |
|  |  |  Prod1 | |  Prod2 | |  Prod3 |       |                  |
|  |  | 89 clk | | 156 clk| | 42 clk |       |  <-- Warm       |
|  |  +--------+ +--------+ +--------+       |                  |
|  |                                          |                  |
|  |  [Unsubscribe (12 clicks)]              |  <-- Cold (blue) |
|  +------------------------------------------+                  |
|                                                                |
|  Legend: [Cold 1-10] [Warm 11-50] [Hot 51+]                   |
+---------------------------------------------------------------+
```

**Implementation approach:**
- Render the sent email HTML in an iframe or sanitized container
- Overlay transparent clickable regions on each link
- Color-code regions by click count (gradient: blue -> yellow -> red)
- Show click count tooltip on hover per link
- Provide a sorted table view below the visual map listing all links with click counts

### 4.4 Comparative Analytics

**Campaign comparison table:**

```
+---------------------------------------------------------------+
|  Compare Campaigns                [Select campaigns to compare]|
|                                                                |
|  Metric        | Campaign A    | Campaign B    | Diff          |
|  --------------|---------------|---------------|----------------|
|  Sent          | 12,450        | 10,200        | +2,250        |
|  Open Rate     | 39.3%         | 35.1%         | +4.2% ^       |
|  Click Rate    | 10.0%         | 12.3%         | -2.3% v       |
|  Bounce Rate   | 1.3%          | 1.8%          | -0.5% ^       |
|  Unsub Rate    | 0.18%         | 0.25%         | -0.07% ^      |
+---------------------------------------------------------------+
```

**Additional comparison views:**
- Side-by-side bar charts for visual comparison
- Overlay line charts showing engagement curves on same axes
- Maximum 4 campaigns in a single comparison view

### 4.5 Dashboard Visual Hierarchy

Based on research from Improvado, HubSpot, and dashboard design best practices:

**Recommended layout (top to bottom):**

1. **Header:** Campaign name, status badge (Sent/Scheduled/Draft), sent date, recipient count
2. **KPI Cards Row:** Primary metrics (Delivered, Opened, Clicked, Bounced, Unsubscribed) -- large numbers, color-coded deltas
3. **Engagement Chart:** Opens and clicks over time (area/line chart)
4. **Click Map:** Visual email click heatmap (expandable section)
5. **Top Links Table:** Sorted list of clicked links with URL, click count, unique clicks, CTR
6. **Recipient Activity:** Tabbed table -- Opened, Clicked, Bounced, Unsubscribed -- with contact names and timestamps
7. **Device & Client Breakdown:** Pie or donut charts showing desktop vs. mobile, email client distribution

### 4.6 Export Reports

- Export to CSV/PDF
- Schedule recurring reports (daily/weekly/monthly)
- Email report link to stakeholders
- Include F-CORE branding on PDF exports

---

## 5. Template Gallery UX

### 5.1 Category-Based Browsing

**Template categories (based on HubSpot, Beefree, Stripo):**

| Category | Sub-categories |
|---|---|
| **Newsletter** | Weekly digest, Monthly roundup, Industry news |
| **Promotional** | Sale/Discount, Product launch, Seasonal, Flash sale |
| **Transactional** | Order confirmation, Shipping notification, Password reset |
| **Onboarding** | Welcome, Getting started, Feature education |
| **Event** | Invitation, Reminder, Follow-up, Thank you |
| **Re-engagement** | Win-back, Survey, Feedback request |
| **Announcement** | Company news, Product update, Policy change |
| **Blank/Layouts** | 1-column, 2-column, 3-column, Hero + content |

### 5.2 Gallery Layout

```
+---------------------------------------------------------------+
|  Email Templates                                    [+ Create] |
|                                                                |
|  [All] [Newsletter] [Promotional] [Onboarding] [Event] [More v]|
|                                                                |
|  Search: [Search templates...              ]                   |
|                                                                |
|  +-------------+  +-------------+  +-------------+            |
|  |             |  |             |  |             |            |
|  |  Template   |  |  Template   |  |  Template   |            |
|  |  Preview    |  |  Preview    |  |  Preview    |            |
|  |  (Scaled    |  |  (Scaled    |  |  (Scaled    |            |
|  |   email     |  |   email     |  |   email     |            |
|  |   render)   |  |   render)   |  |   render)   |            |
|  |             |  |             |  |             |            |
|  +-------------+  +-------------+  +-------------+            |
|  | Newsletter   |  | Welcome      |  | Flash Sale  |            |
|  | Weekly       |  | Onboarding   |  | Promotional |            |
|  +-------------+  +-------------+  +-------------+            |
|                                                                |
|  +-------------+  +-------------+  +-------------+            |
|  |  ...        |  |  ...        |  | [Start from |            |
|  |             |  |             |  |  Scratch]    |            |
|  +-------------+  +-------------+  +-------------+            |
+---------------------------------------------------------------+
```

### 5.3 Template Preview Interaction

**Hover behavior:**
- Scale up slightly (transform: scale(1.02)) with subtle shadow increase
- Show overlay with action buttons: "Preview" (eye icon) and "Use Template" (arrow icon)
- Show template name and category below the thumbnail

**Click/Preview behavior:**
- Open a modal or slide-over panel with full-size preview
- Split view: desktop preview on left, mobile preview on right
- Show template metadata: name, category, number of blocks, creation date
- Action buttons: "Use This Template," "Clone & Customize," "Back to Gallery"

### 5.4 "Start from Scratch" vs. "Use Template"

**Two entry points, always visible:**

1. **Start from scratch:** Opens editor with a blank layout containing only a pre-configured header (logo placeholder) and footer (unsubscribe link, company address). Optionally, offer layout starters: 1-column, 2-column, hero layout.

2. **Use template:** Opens the gallery. Selected template loads into the editor with all content pre-populated and editable.

### 5.5 Template Management

- **My Templates:** User-created templates saved from previous campaigns
- **Team Templates:** Shared templates across the organization
- **System Templates:** Pre-built templates provided by F-CORE
- **Clone:** Duplicate any template to create a new starting point
- **Edit:** Modify saved templates (warning: affects future use, not past campaigns)
- **Delete:** Soft delete with "Undo" option (30-second window)
- **Folders:** Organize templates into folders for large libraries

---

## 6. Mobile Considerations

### 6.1 Responsive Email Preview

**Critical because 50%+ of email opens happen on mobile:**
- Toggle between desktop and mobile preview in the editor
- Mobile preview shows actual phone-frame dimensions (375px width)
- Columns stack vertically on mobile (configurable per row)
- Font sizes increase on mobile for readability (minimum 14px body, 22px headings)
- Buttons expand to full width on mobile
- Images scale to 100% width
- "Hide on mobile" / "Show only on mobile" toggles per block

### 6.2 Campaign Management on Mobile (Responsive Web App)

**Mobile-optimized views for the campaign management interface:**

| Feature | Mobile Adaptation |
|---|---|
| Campaign list | Card-based list view with status badge, date, key metrics preview |
| Campaign details | Stacked KPI cards (2 per row), scrollable charts |
| Analytics | Simplified metrics view, swipeable chart cards |
| Template gallery | 1-column grid of template cards |
| Email editor | **Read-only preview only** (editing is desktop-only) |
| Contact lists | Searchable list with contact cards, simplified filters |

### 6.3 Editor on Mobile

**Industry consensus: Email editors are desktop-only for editing.**
- On mobile, show a read-only preview of the email content
- Display a banner: "Open on desktop to edit this email"
- Allow viewing campaign settings and analytics on mobile
- Allow sending test emails from mobile
- Allow approving/rejecting campaigns on mobile (for workflow approvals)

---

## 7. Wireframe Descriptions (Text-Based)

### 7.1 Email Marketing List Page (Campaign List)

```
+===================================================================+
|  [Sidebar]  |  Email Marketing                                     |
|             |                                                       |
|  Contacts   |  [+ Create Campaign]           [Search...]  [Filter v]|
|  Companies  |                                                       |
|  Deals      |  Filter Tabs:                                         |
|  ----       |  [All] [Drafts] [Scheduled] [Sent] [Archived]        |
|  Email >>   |                                                       |
|  Templates  |  +---------------------------------------------------+|
|  Campaigns  |  | Status | Name         | Sent    | Open% | Click% ||
|  Lists      |  |--------|--------------|---------|-------|--------||
|  Analytics  |  | SENT   | Summer News  | Feb 5   | 39.3% | 10.0%  ||
|  ----       |  | DRAFT  | Spring Promo | --      | --    | --     ||
|  Settings   |  | SCHED  | Weekly Dig.. | Feb 10  | --    | --     ||
|             |  | SENT   | Jan News     | Jan 15  | 42.1% | 11.2%  ||
|             |  | SENT   | Holiday Sale | Dec 20  | 45.7% | 15.3%  ||
|             |  +---------------------------------------------------+|
|             |                                                       |
|             |  Showing 1-10 of 47        [< Prev] 1 2 3 4 [Next >] |
+===================================================================+
```

**Key elements:**
- Sidebar navigation with "Email" section expanded showing sub-items
- Top action bar with "Create Campaign" primary CTA
- Tab filters for campaign status
- Table with columns: Status (badge), Name (clickable), Sent Date, Open Rate, Click Rate
- Bulk action support (checkbox per row) for archive, delete, duplicate
- Click on row opens campaign detail/analytics
- Hover on row shows quick action icons (edit, duplicate, archive)

### 7.2 Campaign Creation Wizard

```
+===================================================================+
|  Create Campaign                                         [X Close] |
|                                                                     |
|  Progress: (1) Setup ----> (2) Content ----> (3) Settings ----> (4) Review |
|            [=======]       [          ]       [          ]       [  ]|
|                                                                     |
|  STEP 1: CAMPAIGN SETUP                                            |
|  ----------------------------------------------------------------- |
|                                                                     |
|  Campaign Name *                                                    |
|  [Summer Newsletter 2026                                    ]      |
|                                                                     |
|  Email Type                                                         |
|  ( ) Regular      ( ) Automated      ( ) A/B Test                  |
|                                                                     |
|  Recipients *                                                       |
|  [Select list or segment...                              v]        |
|  Selected: Newsletter Subscribers (5,432 contacts)                  |
|                                                                     |
|  Exclusion Lists (optional)                                        |
|  [Select lists to exclude...                             v]        |
|                                                                     |
|                                                                     |
|  [Back]                                    [Save Draft] [Next -->] |
+===================================================================+
```

### 7.3 Email Editor Page Layout

```
+===================================================================+
|  [< Back to Campaign]  Summer Newsletter 2026   [Draft - Saved 2m] |
|                                                                     |
|  [Undo] [Redo]  |  [Desktop] [Mobile]  |  [Test] [Preview] [Next]  |
|===================================================================|
|           |                                    |                    |
|  BLOCKS   |         EMAIL CANVAS               |   PROPERTIES      |
|           |                                    |                    |
|  Content  |  +------------------------------+  |   Text Block      |
|  -------  |  |                              |  |   -----------     |
|  [T] Text |  |  [Header Logo]               |  |   Font: Inter    |
|  [H] Head |  |                              |  |   Size: 16px     |
|  [I] Img  |  |  Summer Newsletter           |  |   Color: #333    |
|  [B] Btn  |  |  =================           |  |   Line-h: 1.5    |
|  [--] Div |  |                              |  |                    |
|  [ ] Spcr |  |  Hello {{first_name}},       |  |   Padding         |
|           |  |                              |  |   T: 16  R: 16   |
|  Layout   |  |  We have exciting news...    |  |   B: 16  L: 16   |
|  -------  |  |                              |  |                    |
|  [1] 1col |  |  [======= Read More =======] |  |   Background      |
|  [2] 2col |  |                              |  |   Color: #fff     |
|  [3] 3col |  |  +--------+  +--------+     |  |                    |
|           |  |  | Image1 |  | Image2 |     |  |   Mobile           |
|  Saved    |  |  +--------+  +--------+     |  |   [ ] Hide on mob |
|  -------  |  |                              |  |                    |
|  [Footer] |  |  [Footer: Unsub | Address]  |  |   [Duplicate]      |
|  [Header] |  |                              |  |   [Delete]         |
|           |  +------------------------------+  |                    |
|           |                                    |                    |
+===================================================================+
```

**Key elements:**
- Top toolbar: navigation back, campaign name, draft status, undo/redo, preview toggles, action buttons
- Left panel (collapsible, ~240px): Block palette organized by Content/Layout/Saved sections
- Center canvas (flexible width): WYSIWYG email preview with drag-and-drop zones, selection highlights, and block action buttons (move up/down, duplicate, delete)
- Right panel (collapsible, ~280px): Context-sensitive property inspector
- Drag affordance: Blocks in left panel have grab handles; drop zones on canvas highlight on drag-over
- Selected block: Blue border highlight on canvas, corresponding properties shown in right panel

### 7.4 Template Gallery

```
+===================================================================+
|  Email Templates                               [+ Create Template] |
|                                                                     |
|  [All] [Newsletter] [Promotional] [Onboarding] [Event] [Blank]    |
|                                                                     |
|  [Search templates...                                      ]      |
|  [My Templates v] [System Templates v]                              |
|                                                                     |
|  +----------------+  +----------------+  +----------------+       |
|  |                |  |                |  |                |       |
|  |   +--------+  |  |   +--------+  |  |   +--------+  |       |
|  |   |  Email |  |  |   |  Email |  |  |   |  Email |  |       |
|  |   |  Mini  |  |  |   |  Mini  |  |  |   |  Mini  |  |       |
|  |   | Preview|  |  |   | Preview|  |  |   | Preview|  |       |
|  |   |        |  |  |   |        |  |  |   |        |  |       |
|  |   +--------+  |  |   +--------+  |  |   +--------+  |       |
|  |                |  |                |  |                |       |
|  | Weekly Digest  |  | Welcome Email |  | Flash Sale     |       |
|  | Newsletter     |  | Onboarding    |  | Promotional    |       |
|  | [Use] [Preview]|  | [Use] [Preview]|  | [Use] [Preview]|       |
|  +----------------+  +----------------+  +----------------+       |
|                                                                     |
|  +----------------+  +----------------+  +----------------+       |
|  |   [  Blank  ]  |  |                |  |                |       |
|  |   [  Start  ]  |  |   ...          |  |   ...          |       |
|  |   [ from    ]  |  |                |  |                |       |
|  |   [Scratch  ]  |  |                |  |                |       |
|  |   [   +     ]  |  |                |  |                |       |
|  | Start Fresh    |  | Event Invite   |  | Re-engagement  |       |
|  | Blank          |  | Event          |  | Win-back       |       |
|  +----------------+  +----------------+  +----------------+       |
+===================================================================+
```

**Key elements:**
- Category tabs for quick filtering
- Search bar for text search across template names and descriptions
- Ownership filter: My Templates / Team Templates / System Templates
- Grid of template cards (3 columns on desktop, 2 on tablet, 1 on mobile)
- Each card: scaled email preview thumbnail, template name, category label, action buttons
- "Start from Scratch" card always visible (first or last position)
- Hover on card: subtle scale-up, overlay with "Preview" and "Use Template" actions

### 7.5 Campaign Analytics Page

```
+===================================================================+
|  [< Campaigns]  Summer Newsletter 2026             [Export] [Share]|
|                                                                     |
|  Status: SENT | Sent: Feb 5, 2026, 10:00 AM | Recipients: 12,450  |
|                                                                     |
|  +----------+  +----------+  +----------+  +----------+           |
|  | DELIVERED|  | OPENED   |  | CLICKED  |  | BOUNCED  |           |
|  | 12,294   |  | 4,892    |  | 1,247    |  | 156      |           |
|  | 98.7%    |  | 39.3%    |  | 10.0%    |  | 1.3%     |           |
|  | vs avg   |  | +2.1%    |  | -0.5%    |  | -0.2%    |           |
|  +----------+  +----------+  +----------+  +----------+           |
|                                                                     |
|  +----------+  +----------+                                        |
|  | UNSUB    |  | SPAM RPT |                                        |
|  | 23       |  | 2        |                                        |
|  | 0.18%    |  | 0.02%    |                                        |
|  +----------+  +----------+                                        |
|                                                                     |
|  +---------------------------------------------------------+      |
|  | Engagement Over Time                  [24h][7d][30d][All]|      |
|  |                                                         |      |
|  |  [Area chart: Opens over time]                          |      |
|  |  [Line chart: Clicks over time]                         |      |
|  |                                                         |      |
|  +---------------------------------------------------------+      |
|                                                                     |
|  +---------------------------+  +------------------------------+   |
|  | Click Map                 |  | Top Clicked Links            |   |
|  | [Email preview with       |  | 1. Shop Now - 487 clicks    |   |
|  |  click heatmap overlay]   |  | 2. Product B - 156 clicks   |   |
|  |                           |  | 3. Read More - 134 clicks   |   |
|  |                           |  | 4. Product A - 89 clicks    |   |
|  |                           |  | 5. Footer Link - 42 clicks  |   |
|  +---------------------------+  +------------------------------+   |
|                                                                     |
|  +---------------------------------------------------------+      |
|  | Recipient Activity           [Opened][Clicked][Bounced] |      |
|  |                                                         |      |
|  | Name            | Email             | Action  | Time    |      |
|  |-----------------|-------------------|---------|---------|      |
|  | Alice Johnson   | alice@co.com      | Opened  | 10:02AM |      |
|  | Bob Smith       | bob@startup.io    | Clicked | 10:15AM |      |
|  | Carol Lee       | carol@net.com     | Opened  | 10:22AM |      |
|  +---------------------------------------------------------+      |
|                                                                     |
|  +---------------------------+  +------------------------------+   |
|  | Device Breakdown          |  | Email Client Breakdown       |   |
|  | [Donut: Desktop 52%       |  | [Donut: Gmail 38%            |   |
|  |         Mobile 41%        |  |         Apple Mail 28%       |   |
|  |         Tablet 7%]        |  |         Outlook 22%          |   |
|  |                           |  |         Other 12%]           |   |
|  +---------------------------+  +------------------------------+   |
+===================================================================+
```

**Key elements:**
- Header with campaign name, status, and key metadata
- KPI cards row (6 cards, responsive: 4+2 on desktop, 3+3 on tablet, 2x3 on mobile)
- Engagement chart with time-range selector
- Two-column layout: Click Map + Top Links (side by side on desktop, stacked on mobile)
- Recipient Activity table with tab filters for action type
- Device and Email Client breakdown donut charts (side by side)
- Export and Share buttons in the header

---

## 8. Implementation Recommendations for F-CORE

### 8.1 Phased Implementation Roadmap

| Phase | Scope | Priority |
|---|---|---|
| **Phase 1 (MVP)** | Campaign list page, basic campaign creation wizard (4 steps), simple text/image/button blocks editor, template gallery with 5-10 system templates, basic analytics (KPI cards + engagement chart) | P0 |
| **Phase 2** | Full block palette (all P0+P1 blocks), drag-and-drop reordering, undo/redo, autosave, mobile preview, send test email, visual segment builder, click map analytics | P1 |
| **Phase 3** | Template management (save/clone/organize), advanced analytics (device breakdown, comparative analytics, recipient activity), import/export contacts, A/B testing | P2 |
| **Phase 4** | Automated campaigns, version history, collaborative editing, scheduled reports, email client preview integration, AI-powered content suggestions | P3 |

### 8.2 Technology Recommendations

| Component | Recommended Approach |
|---|---|
| **Email Editor** | Build custom using React DnD or dnd-kit for drag-and-drop. Use a block-based architecture where each block type is a React component. Consider GrapesJS or MJML as starting points. |
| **Email Rendering** | Use MJML for responsive email HTML generation. MJML compiles to compatible HTML for all email clients. |
| **Template Storage** | Store templates as JSON (block tree structure) in PostgreSQL. Render to HTML on send using MJML. |
| **Analytics Charts** | Recharts or Chart.js for React-based charting. Lightweight and customizable. |
| **Click Map** | Render sent email in a sandboxed iframe. Overlay absolute-positioned divs on each link with color-coded backgrounds based on click data. |
| **Segment Builder** | Custom React component with recursive rule group rendering. Store filter definitions as JSON in the database. |
| **Rich Text Editing** | TipTap (ProseMirror-based) for inline text editing within blocks. Lightweight and extensible. |
| **Image Upload** | Supabase Storage for image hosting. Drag-and-drop upload with preview and crop functionality. |

### 8.3 Data Model Considerations

**Key entities for email marketing:**

```
Campaign
  - id, tenant_id, name, status (draft/scheduled/sending/sent/archived)
  - email_type (regular/automated/ab_test)
  - subject_line, preview_text
  - sender_name, sender_email, reply_to
  - scheduled_at, sent_at
  - template_id (FK)
  - content_json (JSON block tree)
  - settings_json (tracking, UTM, etc.)
  - created_by, created_at, updated_at, deleted_at

CampaignRecipient (junction)
  - campaign_id, contact_list_id, is_exclusion

ContactList
  - id, tenant_id, name, description, type (static/active)
  - filter_json (for active lists)
  - contact_count (cached, periodically refreshed)
  - created_by, created_at, updated_at, deleted_at

EmailTemplate
  - id, tenant_id, name, category, description
  - content_json (JSON block tree)
  - thumbnail_url
  - is_system (boolean), is_shared (boolean)
  - created_by, created_at, updated_at, deleted_at

CampaignAnalytics
  - campaign_id, sent_count, delivered_count
  - opened_count, unique_opens
  - clicked_count, unique_clicks
  - bounced_count (soft/hard breakdown)
  - unsubscribed_count, spam_reports
  - updated_at

CampaignEvent
  - id, campaign_id, contact_id
  - event_type (delivered/opened/clicked/bounced/unsubscribed/spam)
  - link_url (for click events)
  - device_type, email_client, ip_address
  - occurred_at

EmailSendLog
  - id, campaign_id, contact_id
  - status (queued/sent/delivered/bounced)
  - bounce_type (soft/hard), bounce_reason
  - sent_at, delivered_at
```

### 8.4 Key UX Principles to Follow

1. **Progressive Disclosure:** Show simple options first, reveal advanced settings on demand (collapsible sections, "Advanced" toggles).
2. **Smart Defaults:** Pre-fill sender name and email from organization settings. Auto-generate plain text version. Default tracking to ON.
3. **Constant Feedback:** Show real-time recipient counts, autosave indicators, validation status, and preview updates.
4. **Non-Destructive Actions:** Use soft delete everywhere. Provide undo for block deletions (5-second toast). Maintain draft state to prevent data loss.
5. **Consistent Patterns:** Reuse the same segment builder component in lists AND campaign recipient selection. Reuse the same table/filter patterns from the contacts module.
6. **Performance:** Lazy-load template thumbnails in the gallery. Debounce autosave and filter queries. Virtualize long recipient lists.

### 8.5 Accessibility Requirements

- All editor controls must be keyboard-accessible
- Drag-and-drop must have keyboard alternatives (move up/down buttons)
- Color contrast must meet WCAG AA standards (4.5:1 for text)
- Screen reader announcements for block additions, deletions, and moves
- Focus management when panels open/close
- ARIA labels on all icon-only buttons

---

## Appendix A: Competitive Feature Matrix

| Feature | HubSpot | Mailchimp | Klaviyo | Brevo | F-CORE Target |
|---|---|---|---|---|---|
| Drag-and-drop editor | Yes | Yes | Yes | Yes | Phase 1 |
| Block-based content | Yes | Yes | Yes | Yes | Phase 1 |
| Mobile preview | Yes | Yes | Yes | Yes | Phase 2 |
| A/B testing | Yes | Yes | Yes | Yes | Phase 3 |
| Dynamic content (personalization) | Yes | Yes | Yes | Yes | Phase 2 |
| Template gallery | 50+ | 100+ | 80+ | 40+ | 10+ (Phase 1) |
| Visual segment builder | Yes | Yes | Yes | Yes | Phase 2 |
| Click map analytics | Yes | Yes | No | No | Phase 2 |
| AI content generation | Yes | Yes | Yes | Yes | Phase 4 |
| Automated campaigns | Yes | Yes | Yes | Yes | Phase 4 |
| Code editor (HTML) | Yes | No | Yes | Yes | Phase 3 |
| Collaboration | Yes | No | No | No | Phase 4 |
| CRM integration | Native | Add-on | Add-on | Built-in | Native (Phase 1) |

## Appendix B: Key Metrics Definitions

| Metric | Formula | Target Benchmark |
|---|---|---|
| **Delivery Rate** | (Sent - Bounced) / Sent * 100 | > 95% |
| **Open Rate** | Unique Opens / Delivered * 100 | 20-30% (industry avg) |
| **Click-Through Rate (CTR)** | Unique Clicks / Delivered * 100 | 2-5% |
| **Click-to-Open Rate (CTOR)** | Unique Clicks / Unique Opens * 100 | 10-15% |
| **Bounce Rate** | Bounced / Sent * 100 | < 2% |
| **Unsubscribe Rate** | Unsubscribes / Delivered * 100 | < 0.5% |
| **Spam Complaint Rate** | Spam Reports / Delivered * 100 | < 0.1% |
| **List Growth Rate** | (New Subscribers - Unsubscribes) / Total List * 100 | > 2% monthly |

## Appendix C: Email Client Rendering Considerations

**Clients requiring special attention:**
- **Outlook (Windows):** Uses Word rendering engine. No CSS grid, limited flexbox. Table-based layouts required.
- **Gmail:** Strips `<style>` tags in some cases. Inline CSS preferred. Max 102KB before clipping.
- **Apple Mail:** Best standards support. Supports dark mode CSS media queries.
- **Yahoo Mail:** Limited CSS support. Inline styles preferred.
- **Mobile (iOS Mail, Gmail App):** Responsive design with `@media` queries. Minimum touch target: 44x44px.

**Recommendation:** Use MJML as the rendering engine. MJML handles cross-client compatibility automatically by generating table-based HTML with inline styles. This eliminates the need for manual cross-client testing in most cases.

---

> **Next Steps:**
> 1. Review this document with the product team
> 2. Prioritize Phase 1 features for Sprint planning
> 3. Create Figma wireframes based on Section 7 descriptions
> 4. Define Prisma schema extensions based on Section 8.3 data model
> 5. Set up MJML integration for email HTML rendering
