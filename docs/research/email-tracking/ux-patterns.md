# Email Tracking UX Patterns - F-CORE CRM

> **Version:** 1.0
> **Date:** 2026-02-08
> **Author:** UX Research Team
> **Status:** Research Complete
> **References:** HubSpot, Gmail, Outlook, Salesforce, Streak, OnePageCRM, Brevo

---

## Table of Contents

1. [Email Compose UI](#1-email-compose-ui)
2. [Email Thread / Conversation View](#2-email-thread--conversation-view)
3. [Tracking Status Indicators](#3-tracking-status-indicators)
4. [Email List on Record Pages](#4-email-list-on-record-pages)
5. [Email Templates UI](#5-email-templates-ui)
6. [Mobile Email Patterns](#6-mobile-email-patterns)
7. [Accessibility](#7-accessibility)
8. [Wireframes (ASCII)](#8-wireframes-ascii)
9. [F-CORE Implementation Notes](#9-f-core-implementation-notes)

---

## 1. Email Compose UI

### 1.1 Layout Pattern: Modal vs. Inline

**Industry Standard (HubSpot, Gmail):**
- **Modal compose** is the dominant pattern for new emails from CRM record pages.
- Gmail uses a **bottom-right floating compose panel** that can be expanded to full-screen.
- HubSpot uses a **centered overlay modal** with a semi-transparent backdrop.
- Salesforce uses an **inline panel** within the activity composer on record pages.

**F-CORE Recommendation:**
- Use a **centered modal** (max-width 720px) for composing new emails.
- Allow the modal to expand to **full-screen** via a toggle button.
- For quick replies within a thread, use **inline reply** within the thread view.

### 1.2 Rich Text Editor Toolbar

**Best Practices (TinyMCE, Gmail, HubSpot):**

| Toolbar Group | Controls | Priority |
|---------------|----------|----------|
| Text Format | Bold, Italic, Underline, Strikethrough | Essential |
| Font | Font family, Font size | Secondary |
| Color | Text color, Highlight color | Secondary |
| Alignment | Left, Center, Right | Essential |
| Lists | Ordered list, Unordered list | Essential |
| Indentation | Increase indent, Decrease indent | Secondary |
| Insert | Link, Image, Table, Horizontal rule | Essential |
| Actions | Undo, Redo | Essential |
| Advanced | HTML source, Clear formatting | Tertiary |

**Key Design Decisions:**
- Toolbar should be **sticky at the top** of the editor area.
- Use **grouped toolbar buttons** with visual separators between groups.
- On narrow viewports, collapse secondary groups into an **overflow menu** (...).
- Support **Markdown shortcuts** (e.g., `**bold**` auto-converts).
- Preserve formatting on **paste from Google Docs / Word** (strip unnecessary markup, keep semantic formatting).
- Recommended library: **TipTap** (React-first, extensible, accessible).

### 1.3 Recipient Fields (To / CC / BCC)

**HubSpot Pattern:**
- **To field** is always visible with contact autocomplete.
- **CC/BCC fields** are hidden by default; revealed via "CC" and "BCC" text links.
- Autocomplete searches across: contact name, email address, company name.
- Selected recipients render as **chips/tokens** with avatar, name, and a remove (x) button.
- Chips are **color-coded**: existing CRM contacts (cyan), unknown emails (gray).

**Autocomplete Behavior:**
```
User types: "joh"
Dropdown shows:
  +--------------------------------------------------+
  | [Avatar] John Smith  john@acme.com     Acme Corp |
  | [Avatar] Johnny Lee  jlee@beta.io      Beta Inc  |
  | [+] Add "joh" as new email                       |
  +--------------------------------------------------+
```

**Validation:**
- Real-time email format validation (red outline on invalid).
- Warn if sending to a contact with `email_opt_out = true`.
- Show **"Someone"** label for contacts not yet in CRM, with a tooltip to create contact.

### 1.4 Subject Line

**Patterns:**
- Single-line input, auto-expanding if text is long.
- Pre-filled when replying (Re: ...) or forwarding (Fwd: ...).
- Character count indicator shown after 60+ characters (for deliverability awareness).
- Merge field insertion supported (e.g., `{{contact.first_name}}`).

### 1.5 Attachment Handling

**HubSpot / Gmail Patterns:**
- **Drag-and-drop** zone overlaid on the entire compose area.
- **Paperclip icon** in the toolbar footer for traditional file picker.
- File list below the editor body showing: file icon, name, size, progress bar, remove button.
- Max file size: 20MB per file (show error for oversized files).
- Inline images: pasted/dropped images appear inline in the editor.

**File Preview Chips:**
```
+------------------------------------------+
| [PDF] proposal.pdf  2.4 MB        [x]   |
| [IMG] screenshot.png  856 KB      [x]   |
+------------------------------------------+
```

### 1.6 Template Selector Integration

**HubSpot Pattern:**
- **"Templates"** button in the bottom toolbar of the compose modal.
- Opens a **template picker panel** (slide-in from right or dropdown).
- Template selection replaces the body content (with confirmation if body is non-empty).
- After insertion, merge fields are highlighted with a **distinct background color** (e.g., cyan-50).

**Flow:**
```
[Templates] button click
  -> Slide-in panel with:
     - Search bar (filter by name/category)
     - Category tabs (All, Sales, Support, Marketing)
     - Template cards showing:
       - Template name
       - Preview snippet (first 100 chars)
       - Last used date
       - Usage count
     - "Preview" button (expands to full preview)
     - "Use Template" button (inserts into editor)
```

### 1.7 Send Button with Scheduling

**Gmail / HubSpot Pattern:**
- **Split button**: Primary action "Send" + dropdown caret for options.
- Dropdown options:
  - Send now (default)
  - Schedule send (opens date/time picker)
  - Send and create task (sends + creates follow-up reminder)
- Keyboard shortcut: `Cmd+Enter` / `Ctrl+Enter` for immediate send.

**Split Button Layout:**
```
+-------------------+---+
|    Send            | v |
+-------------------+---+
      |
      v
  +------------------------+
  | Schedule send...       |
  | Send & create task     |
  +------------------------+
```

### 1.8 Draft Auto-Save Behavior

**Best Practices:**
- Auto-save every **30 seconds** or on **blur** (user clicks outside compose).
- Show a subtle "Draft saved" timestamp near the bottom of the modal.
- Drafts persist across browser sessions (stored in database, not just localStorage).
- When user navigates away with unsaved changes: show a **confirmation dialog**.
- Draft indicator on the email list: show a "Draft" badge in yellow.

**Visual Feedback:**
```
Saving states:
  "Saving..."       -> gray, pulsing text
  "Draft saved 2s ago" -> green checkmark + timestamp
  "Save failed"     -> red warning icon + retry link
```

### 1.9 Tracking Toggle

**HubSpot Pattern:**
- Checkbox at the bottom of the compose window: "Track email opens and clicks".
- Enabled by default for sales emails.
- Tooltip explains what tracking does and privacy implications.
- When tracking is on, links in the email body are automatically wrapped with tracking URLs.
- Visual indicator: a small eye icon appears next to the Send button.

---

## 2. Email Thread / Conversation View

### 2.1 Thread Layout

**Gmail Pattern (Industry Standard):**
- **Newest message at the bottom**, reading like a natural conversation.
- Older messages are **collapsed by default** (showing sender + snippet).
- Click to expand any collapsed message.
- **"Show X older messages"** link to batch-expand all.
- The latest unread message is always **auto-expanded**.

**HubSpot Pattern (CRM Context):**
- Emails are shown within a **timeline** on the contact record.
- Each email is a **card** that can be expanded/collapsed.
- Thread grouping is by **subject line** + participant matching.
- Most recent email at the **top** of the timeline (reverse chronological for CRM context).

**F-CORE Recommendation:**
- On **record detail pages** (timeline): reverse chronological (newest at top), matching CRM conventions.
- In a **dedicated email view/conversation panel**: chronological (oldest at top), matching email conventions.
- Always auto-expand the **most recent unread** message.
- Collapsed messages show: sender avatar, sender name, date, first line snippet.

### 2.2 Collapsed vs. Expanded Message States

**Collapsed State:**
```
+-------------------------------------------------------------+
| [Avatar] John Smith           Feb 7, 2026 2:30 PM           |
| "Thanks for the proposal. I'll review it with my team..."   |
+-------------------------------------------------------------+
```

**Expanded State:**
```
+-------------------------------------------------------------+
| [Avatar] John Smith              Feb 7, 2026 2:30 PM        |
|          john@acme.com           [Reply] [Forward] [...]     |
+-------------------------------------------------------------+
| To: me@fcore.com                                             |
| CC: sarah@acme.com                                           |
+-------------------------------------------------------------+
|                                                               |
| Thanks for the proposal. I'll review it with my team and     |
| get back to you by Friday.                                    |
|                                                               |
| Best regards,                                                 |
| John                                                          |
|                                                               |
+-------------------------------------------------------------+
| [PDF] proposal-v2.pdf  1.2 MB  [Download]                   |
+-------------------------------------------------------------+
| --- Original Message ---                   [Show/Hide]       |
+-------------------------------------------------------------+
```

### 2.3 Reply / Forward Actions

**Placement:**
- **Reply** and **Forward** buttons in the message header (top-right of each expanded message).
- A **reply box** appears inline at the bottom of the thread when Reply is clicked.
- Forward opens the **compose modal** pre-filled with the forwarded content.

**Action Bar:**
```
[Reply]  [Reply All]  [Forward]  [...More]
                                     |
                                     v
                              +------------------+
                              | Print            |
                              | Download as PDF  |
                              | Delete           |
                              +------------------+
```

### 2.4 Quoted Text Handling

**Best Practices:**
- When replying, include quoted text below the reply area.
- Quoted text is **collapsed by default** with a "Show quoted text" toggle.
- Quoted text has a **left border indicator** (4px cyan-600 line) and lighter text color (gray-400).
- Users can select and trim quoted text before sending.

### 2.5 Thread Grouping Logic

**Rules (from Gmail / HubSpot):**
- Group emails that share the same **subject line** (stripping Re:/Fwd: prefixes).
- Match by **References** and **In-Reply-To** email headers (more reliable than subject).
- If a user changes the subject line significantly, start a **new thread**.
- Max thread depth: 100 messages (paginate after that).

---

## 3. Tracking Status Indicators

### 3.1 Delivery Status Icons

**Status Lifecycle:**
```
Queued -> Sending -> Sent -> Delivered -> Opened -> Clicked
                       |
                       +-> Bounced (hard/soft)
                       +-> Failed
                       +-> Spam Reported
```

**Icon and Color System:**

| Status | Icon | Color (Tailwind) | Description |
|--------|------|-------------------|-------------|
| Queued | `Clock` | `gray-400` | Email is queued for sending |
| Sending | `Loader` (animated) | `gray-400` | Currently being transmitted |
| Sent | `Check` | `gray-500` | Delivered to mail server |
| Delivered | `CheckCheck` | `blue-500` | Confirmed delivery to inbox |
| Opened | `Eye` | `cyan-600` (Primary) | Recipient opened email |
| Opened (multiple) | `Eye` + count badge | `cyan-600` + badge | Opened N times |
| Clicked | `MousePointerClick` | `green-500` (Success) | Recipient clicked a link |
| Bounced (soft) | `AlertTriangle` | `amber-500` (Warning) | Temporary delivery failure |
| Bounced (hard) | `XCircle` | `red-500` (Error) | Permanent delivery failure |
| Failed | `XCircle` | `red-500` (Error) | Send failed |
| Spam Report | `ShieldAlert` | `red-500` (Error) | Marked as spam |
| Unsubscribed | `UserMinus` | `gray-500` | Recipient unsubscribed |

**Icon Source:** Lucide Icons (consistent with F-CORE icon set).

### 3.2 Open Tracking Display

**HubSpot Pattern:**
- **Real-time desktop notification** when a tracked email is opened.
- **Activity feed** shows: "[Contact Name] opened your email" with timestamp.
- On the email card: eye icon + "Opened X times" text.
- **First open** is highlighted; subsequent opens show as a count.
- Multiple opens timeline shows IP/location approximation.

**Open Tracking Card:**
```
+--------------------------------------------------+
| [Eye Icon] Opened                                |
| First opened: Feb 7, 2026 2:30 PM               |
| Total opens: 5                                    |
| Last opened: Feb 8, 2026 9:15 AM                |
| Location: San Francisco, CA (approx.)            |
+--------------------------------------------------+
```

**Important UX Note (from HubSpot research):**
- Open tracking uses a **1px tracking pixel** which can be blocked by email clients.
- Apple Mail Privacy Protection pre-loads images, inflating open counts.
- Always show a **disclaimer tooltip**: "Open tracking may not reflect all opens due to email client privacy settings."
- Display open metrics as **trend indicators**, not precise counts.

### 3.3 Click Tracking Display

**Pattern:**
- When a recipient clicks a tracked link, show the **specific link URL** that was clicked.
- Group clicks by link URL, showing count per link.
- Timeline entry: "[Contact] clicked [link text] in your email."

**Click Detail View:**
```
+--------------------------------------------------+
| Clicked Links                                     |
|--------------------------------------------------|
| [Link] View Proposal    - Clicked 3 times        |
|   Last: Feb 8, 2026 9:20 AM                      |
| [Link] Pricing Page     - Clicked 1 time         |
|   Last: Feb 7, 2026 4:45 PM                      |
+--------------------------------------------------+
```

### 3.4 Real-Time Notifications

**HubSpot / Streak Pattern:**
- **Desktop push notification** (via browser Notification API):
  ```
  +------------------------------------------+
  | F-CORE                                    |
  | John Smith opened "Proposal Q1"           |
  | 2 minutes ago                             |
  +------------------------------------------+
  ```
- **In-app toast notification** (bottom-right corner):
  - Slide-in animation, auto-dismiss after 5 seconds.
  - Click to navigate to the email or contact record.
- **Activity feed badge** in the sidebar (unread count).
- **Sound notification** (optional, configurable in user settings).

### 3.5 Timeline Integration

**HubSpot Pattern:**
- Email tracking events appear in the **contact timeline** alongside other activities (calls, meetings, notes).
- Events grouped by the parent email:
  ```
  [Email Icon] Email: "Proposal Q1" sent to john@acme.com
    |- [Delivered] Feb 7, 2:00 PM
    |- [Opened] Feb 7, 2:30 PM
    |- [Clicked] "View Proposal" Feb 7, 2:35 PM
    |- [Opened] Feb 8, 9:15 AM (re-opened)
  ```
- Tracking events are **nested under the email activity** rather than appearing as separate timeline entries.

---

## 4. Email List on Record Pages

### 4.1 Layout on Contact / Company / Deal Pages

**HubSpot Pattern:**
- Emails appear as **cards within the Activity Timeline** on the record detail page.
- The timeline is the central panel on the record page.
- An **Activity filter bar** at the top allows filtering by type: All, Emails, Calls, Meetings, Notes, Tasks.

**Filter Bar:**
```
+------------------------------------------------------------------+
| [All] [Emails] [Calls] [Meetings] [Notes] [Tasks]  [+ Log]      |
+------------------------------------------------------------------+
```

### 4.2 Email Card in Timeline

**Card Structure:**
```
+------------------------------------------------------------------+
| [Email Icon] [Tracking Status]                         Feb 7     |
| Subject: Proposal for Q1 Partnership                             |
|------------------------------------------------------------------|
| From: me@fcore.com                                               |
| To: john@acme.com                                                 |
|------------------------------------------------------------------|
| Hi John, I wanted to follow up on our conversation...            |
| [Show more]                                                       |
|------------------------------------------------------------------|
| [Reply]  [Forward]  [...]         Opened 5x | Clicked 2 links    |
+------------------------------------------------------------------+
```

### 4.3 Filtering and Sorting

**Filter Options:**
| Filter | Options |
|--------|---------|
| Direction | All, Sent, Received |
| Status | All, Tracked, Opened, Clicked, Bounced |
| Date Range | Last 7 days, 30 days, 90 days, Custom |
| Associations | This contact only, Include company emails, Include deal emails |

**Default Sort:** Newest first (reverse chronological).

**No-results State:**
```
+--------------------------------------------------+
| [Email Icon]                                      |
| No emails found                                   |
| Try adjusting your filters or send the first      |
| email to this contact.                            |
|                                                    |
| [Compose Email]                                    |
+--------------------------------------------------+
```

### 4.4 Preview vs. Full View

**Interaction Pattern:**
- **Preview mode** (default): Shows subject, first 2 lines of body, tracking status.
- **Click to expand**: Shows full email body, attachments, tracking details.
- **Full view link**: "Open in new tab" to see the email in a dedicated view.
- Transition: smooth expand/collapse animation (200ms ease-in-out).

### 4.5 Association Indicators

**Pattern:**
- Show **association badges** on email cards indicating which CRM records the email is linked to.
- Badge format: `[Contact] John Smith` | `[Company] Acme Corp` | `[Deal] Q1 Partnership`
- Badges are clickable, navigating to the associated record.
- If an email is associated with multiple records, show all badges.

---

## 5. Email Templates UI

### 5.1 Template Picker / Browser

**HubSpot Pattern:**
- Accessed from the **compose modal** via a "Templates" button.
- **Two-panel layout**: categories on the left, template list on the right.
- Categories: All, Recently Used, My Templates, Team Templates, [Custom Categories].
- Each template card shows: name, preview snippet, last used, usage count.
- **Search** across template name and content.

**Template Browser Layout:**
```
+-----------------------------------------------------------+
| Search templates...                            [x Close]  |
|-----------------------------------------------------------|
| Categories        | Template List                          |
| [All]             | +-----------------------------------+ |
| [Recently Used]   | | Follow-up After Meeting           | |
| [Sales]           | | "Hi {{first_name}}, It was great  | |
| [Support]         | | meeting you today..."              | |
| [Onboarding]      | | Used 42 times | Last: 2 days ago  | |
|                   | | [Preview] [Use Template]           | |
|                   | +-----------------------------------+ |
|                   | +-----------------------------------+ |
|                   | | Cold Outreach - Enterprise        | |
|                   | | "Hi {{first_name}}, I noticed     | |
|                   | | {{company}} is growing..."        | |
|                   | | Used 18 times | Last: 1 week ago  | |
|                   | | [Preview] [Use Template]           | |
|                   | +-----------------------------------+ |
+-----------------------------------------------------------+
```

### 5.2 Template Preview

**Pattern:**
- **Full preview panel** that shows the template rendered with sample data.
- Merge fields are displayed with a **placeholder highlight** (e.g., background cyan-50).
- Show which merge fields are used: `{{first_name}}`, `{{company}}`, `{{deal_name}}`.
- Preview includes: Subject line, Body, Attachments (if any).

### 5.3 Variable / Merge Field Insertion

**Patterns from CRM Systems:**

| CRM | Syntax | Trigger |
|-----|--------|---------|
| HubSpot | `{{contact.firstname}}` | Toolbar button |
| Salesforce | `{{{Recipient.FirstName}}}` | Toolbar button |
| Zoho | `#firstname` | Type `#` to trigger autocomplete |
| Copper | `{{first_name}}` | Type `#` or `+` button |
| OnePageCRM | `[contact.firstname]` | Variable dropdown |

**F-CORE Recommendation:**
- Use **double curly brace** syntax: `{{contact.first_name}}`.
- **Two insertion methods:**
  1. Toolbar button "Insert Variable" -> opens dropdown picker.
  2. Type `{{` in the editor -> triggers inline autocomplete.
- **Variable picker dropdown** organized by entity:
  ```
  Contact: first_name, last_name, email, phone, company...
  Company: name, domain, industry, size...
  Deal: name, amount, stage, close_date...
  User: first_name, last_name, email, signature...
  ```
- **Fallback values**: Support `{{contact.first_name | "there"}}` syntax.
- **Visual rendering**: Merge fields show as **styled chips** in the editor (cyan background, rounded).

### 5.4 Template Categories

**Standard Categories:**
| Category | Description |
|----------|-------------|
| Sales | Cold outreach, follow-ups, proposals |
| Support | Ticket responses, escalation, resolution |
| Onboarding | Welcome, setup guide, check-in |
| Marketing | Newsletters, announcements, events |
| Internal | Team updates, meeting requests |
| Custom | User-created categories |

### 5.5 Template Management

**Features:**
- **Create**: New template from scratch or "Save as template" from a composed email.
- **Edit**: Rich text editor identical to the compose view.
- **Clone**: Duplicate an existing template for modification.
- **Share**: Toggle visibility between "Only me" and "Entire team."
- **Analytics**: Per-template metrics: times used, open rate, click rate.
- **Folder/Tags**: Organize templates into folders or tag-based categorization.

---

## 6. Mobile Email Patterns

### 6.1 Responsive Compose Form

**Key Adaptations:**
- Compose opens as a **full-screen modal** on mobile (not a floating panel).
- Toolbar collapses to a **single row** with overflow scroll or grouped menus.
- **To/CC/BCC fields** stack vertically.
- **Subject line** is a full-width input.
- Editor area expands to fill available space.
- **Bottom toolbar** with frequently used actions: Attach, Template, Send.

**Mobile Compose Layout:**
```
+----------------------------+
| [Back]  New Email  [Send]  |
+----------------------------+
| To: [token] [token] [+]   |
+----------------------------+
| Subject: ____________      |
+----------------------------+
|                            |
| [Rich text editor]         |
|                            |
|                            |
|                            |
+----------------------------+
| [Attach] [Template] [...]  |
+----------------------------+
```

### 6.2 Thread View on Mobile

**Patterns:**
- **Single-column layout** with stacked message cards.
- Newest message expanded at the bottom.
- Older messages collapsed with sender + snippet visible.
- **Pull-to-refresh** to check for new messages.
- **Sticky reply bar** at the bottom of the screen.

### 6.3 Swipe Actions

**Industry Standard (Gmail, Outlook):**
| Swipe | Action | Visual |
|-------|--------|--------|
| Swipe right | Archive / Mark as read | Green background + Archive icon |
| Swipe left | Delete / Snooze | Red background + Trash icon |

**F-CORE CRM Context:**
| Swipe | Action | Visual |
|-------|--------|--------|
| Swipe right | Log to CRM / Associate | Cyan background + Link icon |
| Swipe left | Archive | Gray background + Archive icon |

### 6.4 Touch-Friendly Tracking Indicators

**Mobile Adaptations:**
- Tracking status icons: minimum **44x44px** touch target.
- Status badges displayed as **pills** below the email subject.
- Tap on tracking pill to expand tracking details.
- Use **horizontal scroll** for multiple tracking events on small screens.

**Mobile Tracking Display:**
```
+----------------------------+
| Proposal Q1                |
| To: john@acme.com          |
| [Sent] [Opened 3x] [1 Click] |
+----------------------------+
```

### 6.5 Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Mobile | < 640px | Single column, full-screen modals, stacked fields |
| Tablet | 640px - 1024px | Two-column when space allows, side panel for thread |
| Desktop | > 1024px | Full compose modal, side-by-side thread + detail |

---

## 7. Accessibility

### 7.1 ARIA Roles for Email Compose

**Compose Modal:**
```html
<div role="dialog"
     aria-modal="true"
     aria-labelledby="compose-title"
     aria-describedby="compose-description">
  <h2 id="compose-title">Compose Email</h2>
  <p id="compose-description" class="sr-only">
    Create and send a new email to your contacts
  </p>
  <!-- ... compose form ... -->
</div>
```

**Rich Text Editor:**
```html
<div role="toolbar" aria-label="Text formatting">
  <button aria-label="Bold" aria-pressed="false">B</button>
  <button aria-label="Italic" aria-pressed="false">I</button>
  <button aria-label="Underline" aria-pressed="false">U</button>
  <!-- ... -->
</div>
<div role="textbox"
     aria-multiline="true"
     aria-label="Email body"
     contenteditable="true">
</div>
```

**Recipient Autocomplete:**
```html
<div role="combobox" aria-expanded="true" aria-haspopup="listbox">
  <input type="text"
         aria-label="To recipients"
         aria-autocomplete="list"
         aria-controls="recipient-listbox" />
  <ul id="recipient-listbox" role="listbox">
    <li role="option" aria-selected="false">John Smith (john@acme.com)</li>
    <li role="option" aria-selected="false">Johnny Lee (jlee@beta.io)</li>
  </ul>
</div>
```

### 7.2 Keyboard Navigation

**Compose Modal:**
| Key | Action |
|-----|--------|
| `Tab` | Move to next field (To -> CC -> BCC -> Subject -> Body -> Toolbar) |
| `Shift+Tab` | Move to previous field |
| `Escape` | Close modal (with unsaved changes confirmation) |
| `Cmd/Ctrl+Enter` | Send email |
| `Cmd/Ctrl+S` | Save draft |
| `Cmd/Ctrl+B` | Bold |
| `Cmd/Ctrl+I` | Italic |
| `Cmd/Ctrl+U` | Underline |
| `Cmd/Ctrl+K` | Insert link |
| `Cmd/Ctrl+Shift+7` | Ordered list |
| `Cmd/Ctrl+Shift+8` | Unordered list |

**Thread View:**
| Key | Action |
|-----|--------|
| `j` / `k` or `ArrowDown` / `ArrowUp` | Navigate between messages |
| `Enter` or `Space` | Expand/collapse current message |
| `r` | Reply to current message |
| `f` | Forward current message |
| `a` | Reply all |
| `e` | Archive |
| `Escape` | Return to email list |

**Autocomplete (To/CC/BCC):**
| Key | Action |
|-----|--------|
| `ArrowDown` / `ArrowUp` | Navigate autocomplete suggestions |
| `Enter` | Select highlighted suggestion |
| `Backspace` (on empty input) | Remove last recipient chip |
| `Escape` | Close autocomplete dropdown |
| `,` or `Tab` | Commit current text as recipient |

### 7.3 Screen Reader Support for Tracking Status

**Live Regions for Real-Time Updates:**
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Dynamically updated when tracking status changes -->
  Email "Proposal Q1" was opened by John Smith at 2:30 PM
</div>
```

**Tracking Status Announcements:**
```html
<span role="status" aria-label="Email tracking status: Opened 5 times, last opened February 8 at 9:15 AM">
  <span class="tracking-icon" aria-hidden="true"><!-- eye icon --></span>
  <span class="sr-only">Opened 5 times</span>
  <span aria-hidden="true">5x</span>
</span>
```

**Email Card Accessibility:**
```html
<article aria-label="Email from John Smith, subject: Proposal Q1, sent February 7, status: opened 5 times">
  <!-- visible card content -->
</article>
```

### 7.4 Color Contrast for Status Indicators

**WCAG 2.1 AA Compliance (4.5:1 minimum contrast ratio):**

| Status | Foreground | Background | Contrast Ratio |
|--------|-----------|------------|---------------|
| Sent | `gray-600` (#4b5563) | `white` (#ffffff) | 7.2:1 |
| Delivered | `blue-700` (#1d4ed8) | `blue-50` (#eff6ff) | 8.1:1 |
| Opened | `cyan-800` (#155e75) | `cyan-50` (#ecfeff) | 9.3:1 |
| Clicked | `green-800` (#166534) | `green-50` (#f0fdf4) | 9.5:1 |
| Bounced | `amber-800` (#92400e) | `amber-50` (#fffbeb) | 7.8:1 |
| Failed | `red-800` (#991b1b) | `red-50` (#fef2f2) | 8.6:1 |

**Additional Requirements:**
- Never rely **solely on color** to convey status -- always include an icon and/or text label.
- Status icons should be at least **16x16px** and have visible strokes (not fill-only).
- Focus indicators: **3px solid outline** in `#d4aa00` (visible against both light and dark backgrounds).
- Ensure interactive elements have visible **focus-visible** styles matching the design system.

---

## 8. Wireframes (ASCII)

### 8.1 Email Compose Modal

```
+================================================================+
| [x]           Compose Email                     [Expand Icon]  |
+================================================================+
| To:   [John Smith x] [Sarah Lee x] [___________] [CC] [BCC]   |
+----------------------------------------------------------------+
| Subject: [Proposal for Q1 Partnership_________________________]|
+----------------------------------------------------------------+
| [B] [I] [U] [S] | [Align] | [UL] [OL] | [Link] [Img] | [...] |
+----------------------------------------------------------------+
|                                                                 |
| Hi {{first_name}},                                              |
|                                                                 |
| I wanted to follow up on our conversation yesterday about       |
| the Q1 partnership opportunity. Please find attached our        |
| proposal document.                                              |
|                                                                 |
| Looking forward to your feedback.                               |
|                                                                 |
| Best regards,                                                   |
| {{user.first_name}}                                             |
|                                                                 |
+----------------------------------------------------------------+
| [PDF] proposal-v2.pdf  1.2 MB                           [x]   |
+----------------------------------------------------------------+
| [Attach] [Templates] [Snippets]    Track: [x]                  |
|                                                                 |
|                    Draft saved 5s ago    +--Send--+--[v]--+     |
+================================================================+
```

### 8.2 Thread View in Timeline

```
+================================================================+
| ACTIVITY TIMELINE                                               |
| [All] [Emails*] [Calls] [Meetings] [Notes] [Tasks]             |
+================================================================+
|                                                                 |
| Feb 8, 2026                                                     |
|                                                                 |
| +------------------------------------------------------------+ |
| | [Mail] [Eye: Opened 5x]                     9:15 AM        | |
| | RE: Proposal for Q1 Partnership                             | |
| |------------------------------------------------------------| |
| | From: john@acme.com  To: me@fcore.com                      | |
| |------------------------------------------------------------| |
| | Thanks for the proposal. I've reviewed it with my team      | |
| | and we'd like to move forward. Can we schedule a call...    | |
| | [Show more]                                                  | |
| |------------------------------------------------------------| |
| | [Reply] [Reply All] [Forward] [...]                         | |
| +------------------------------------------------------------+ |
|                                                                 |
| Feb 7, 2026                                                     |
|                                                                 |
| +------------------------------------------------------------+ |
| | [Mail] [CheckCheck: Delivered]               2:00 PM        | |
| | Proposal for Q1 Partnership                                  | |
| |------------------------------------------------------------| |
| | [Collapsed] me@fcore.com -> john@acme.com                   | |
| | "Hi John, I wanted to follow up on..."      [Expand]        | |
| +------------------------------------------------------------+ |
|                                                                 |
| +------------------------------------------------------------+ |
| | [Phone] Call logged                          1:30 PM        | |
| | Duration: 15 min | Outcome: Connected                      | |
| +------------------------------------------------------------+ |
|                                                                 |
+================================================================+
```

### 8.3 Tracking Status on Email Card

```
+================================================================+
| [Mail Icon]  Proposal for Q1 Partnership                        |
|                                           Sent Feb 7, 2:00 PM  |
+----------------------------------------------------------------+
| Status:                                                         |
|                                                                 |
| [Check]      Sent            Feb 7, 2:00 PM                    |
|    |                                                            |
| [CheckCheck] Delivered       Feb 7, 2:01 PM                    |
|    |                                                            |
| [Eye]        Opened (1st)    Feb 7, 2:30 PM                    |
|    |                                                            |
| [Click]      Clicked         Feb 7, 2:35 PM                    |
|    |         "View Proposal" link                               |
|    |                                                            |
| [Eye]        Opened (5th)    Feb 8, 9:15 AM                    |
|                                                                 |
+----------------------------------------------------------------+
| Total: 5 opens | 2 unique links clicked                         |
| [!] Open tracking approximation - see disclaimer               |
+================================================================+
```

### 8.4 Email List on Record Detail

```
+================================================================+
| JOHN SMITH                                    [Contact Record] |
| john@acme.com | Acme Corp | VP Sales                          |
+================================================================+
| [About] [Activity*] [Deals] [Tickets] [Files]                 |
+================================================================+
|                                                                 |
| Filter: [All v]  Status: [All v]  Sort: [Newest v]  [Compose] |
|                                                                 |
| +------------------------------------------------------------+ |
| | [Draft Badge]                                               | |
| | Follow-up on pricing discussion                 (Draft)    | |
| | Last edited: Feb 8, 10:00 AM              [Edit] [Delete]  | |
| +------------------------------------------------------------+ |
|                                                                 |
| +------------------------------------------------------------+ |
| | [Eye] Opened 5x                                             | |
| | RE: Proposal for Q1 Partnership          Feb 8, 9:15 AM    | |
| | john@acme.com -> me@fcore.com                               | |
| | "Thanks for the proposal. I've reviewed..."                 | |
| | [Contact] John Smith  [Deal] Q1 Partnership                 | |
| +------------------------------------------------------------+ |
|                                                                 |
| +------------------------------------------------------------+ |
| | [CheckCheck] Delivered                                      | |
| | Proposal for Q1 Partnership              Feb 7, 2:00 PM    | |
| | me@fcore.com -> john@acme.com                               | |
| | "Hi John, I wanted to follow up on..."                      | |
| | [Contact] John Smith  [Company] Acme Corp                   | |
| +------------------------------------------------------------+ |
|                                                                 |
| +------------------------------------------------------------+ |
| | [XCircle] Bounced                                           | |
| | Invoice December 2025                     Jan 15, 11:30 AM  | |
| | me@fcore.com -> old-john@acme.com                           | |
| | "Please find attached the invoice..."                       | |
| | Reason: Mailbox not found (hard bounce)                     | |
| +------------------------------------------------------------+ |
|                                                                 |
| [Load more emails...]                                           |
+================================================================+
```

### 8.5 Template Picker (Slide-in Panel)

```
+================================+===============================+
| Compose Email                  | Select Template        [x]   |
|                                |-------------------------------|
| To: [_________________]       | [Search templates...    ]     |
| Subject: [________________]   |-------------------------------|
|                                | Categories:                   |
| [Editor area - dimmed]         | [All*] [Sales] [Support]      |
|                                | [Onboarding] [Custom]         |
|                                |-------------------------------|
|                                | +---------------------------+ |
|                                | | Follow-up After Meeting   | |
|                                | | "Hi {{first_name}}, It    | |
|                                | | was great meeting..."     | |
|                                | | Used 42x | 2 days ago     | |
|                                | | [Preview] [Use Template]  | |
|                                | +---------------------------+ |
|                                | +---------------------------+ |
|                                | | Cold Outreach - SMB       | |
|                                | | "Hi {{first_name}}, I     | |
|                                | | came across {{company}}..." |
|                                | | Used 18x | 1 week ago     | |
|                                | | [Preview] [Use Template]  | |
|                                | +---------------------------+ |
+================================+===============================+
```

### 8.6 Mobile Compose View

```
+----------------------------+
| [<] New Email      [Send]  |
+----------------------------+
| To: [John Smith x] [+]    |
+----------------------------+
| CC: [________________]     |
+----------------------------+
| Subj: [_______________]    |
+----------------------------+
|                            |
| Hi John,                   |
|                            |
| I wanted to follow up on   |
| our conversation...        |
|                            |
|                            |
|                            |
|                            |
+----------------------------+
| [B][I][U] [Link] [...]    |
+----------------------------+
| [Attach] [Template] [Track]|
+----------------------------+
```

### 8.7 Mobile Email Card with Tracking

```
+----------------------------+
| Proposal Q1 Partnership    |
| Feb 7  -->  john@acme.com  |
+----------------------------+
| Hi John, I wanted to       |
| follow up on our...        |
+----------------------------+
| [Opened 5x] [Clicked 2]   |
| [Reply] [Forward] [...]    |
+----------------------------+
```

---

## 9. F-CORE Implementation Notes

### 9.1 Design System Alignment

All email tracking UI components must use the F-CORE Design System tokens:

| Token | Value | Usage in Email |
|-------|-------|----------------|
| `--color-primary` | `#0891b2` (cyan-600) | Tracked/opened status, links, CTA buttons |
| `--color-primary-light` | `#ecfeff` (cyan-50) | Merge field highlights, template variable chips |
| `--color-success` | `#00bda5` (teal-500) | Click tracking, delivery confirmed |
| `--color-warning` | `#f5c26b` (amber-400) | Soft bounce, warnings |
| `--color-error` | `#ef4444` (red-500) | Hard bounce, failed, spam report |
| `--color-text-primary` | `#111827` (gray-900) | Email body text, headings |
| `--color-text-secondary` | `#4b5563` (gray-600) | Metadata, timestamps |
| `--color-border` | `#e5e7eb` (gray-200) | Card borders, dividers |
| `--font-family` | Inter | All email UI text |

### 9.2 Component Hierarchy

```
EmailModule/
  components/
    compose/
      EmailComposeModal.tsx        // Main compose overlay
      RecipientField.tsx           // To/CC/BCC with autocomplete
      RecipientChip.tsx            // Individual recipient token
      SubjectInput.tsx             // Subject line input
      EmailEditor.tsx              // Rich text editor (TipTap)
      EditorToolbar.tsx            // Formatting toolbar
      AttachmentList.tsx           // File attachment manager
      AttachmentItem.tsx           // Single attachment display
      SendButton.tsx               // Split button (send + schedule)
      TrackingToggle.tsx           // Track opens/clicks checkbox
      DraftIndicator.tsx           // Auto-save status display
    thread/
      EmailThread.tsx              // Thread container
      EmailMessage.tsx             // Single message in thread
      EmailMessageHeader.tsx       // Sender, recipients, date
      EmailMessageBody.tsx         // Message content
      QuotedText.tsx               // Collapsible quoted text
      ThreadReplyBox.tsx           // Inline reply within thread
      ThreadActions.tsx            // Reply, Forward, More menu
    tracking/
      TrackingStatusBadge.tsx      // Status icon + label
      TrackingTimeline.tsx         // Detailed tracking events
      TrackingNotification.tsx     // Real-time toast notification
      OpenTrackingDetail.tsx       // Open count + details
      ClickTrackingDetail.tsx      // Click details per link
    templates/
      TemplatePicker.tsx           // Template browser panel
      TemplateCard.tsx             // Template preview card
      TemplatePreview.tsx          // Full template preview
      MergeFieldPicker.tsx         // Variable insertion dropdown
      MergeFieldChip.tsx           // Inline merge field display
      TemplateCategoryFilter.tsx   // Category tabs/filter
    list/
      EmailList.tsx                // Email list on record pages
      EmailCard.tsx                // Email summary card
      EmailFilters.tsx             // Direction, status filters
      AssociationBadge.tsx         // CRM record association
      EmailEmptyState.tsx          // No emails found state
```

### 9.3 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rich text editor | TipTap (ProseMirror) | React-first, extensible, accessible, TypeScript support |
| Email sending | Server-side via API route | Security (API keys not exposed), rate limiting |
| Tracking pixel | 1x1 transparent GIF | Industry standard, minimal bandwidth |
| Real-time notifications | WebSocket (Supabase Realtime) | Already in stack, low latency |
| Template storage | Database (templates table) | Shared across team, searchable, analytics |
| Draft persistence | Database + debounced save | Cross-device access, reliable |
| Merge field syntax | `{{entity.field}}` | Industry standard, easy to parse |

### 9.4 Data Model Considerations

**Key tables for email tracking:**
```
emails
  id, tenant_id, thread_id, direction (sent/received),
  from_email, to_emails[], cc_emails[], bcc_emails[],
  subject, body_html, body_text,
  status (draft/queued/sent/delivered/bounced/failed),
  tracking_enabled, template_id,
  sent_at, created_at, updated_at, deleted_at

email_tracking_events
  id, email_id, tenant_id,
  event_type (open/click/bounce/spam/unsubscribe),
  link_url (for click events),
  ip_address, user_agent, location_approx,
  occurred_at, created_at

email_templates
  id, tenant_id, name, category, subject, body_html,
  merge_fields[], is_shared, created_by,
  usage_count, last_used_at,
  created_at, updated_at, deleted_at

email_attachments
  id, email_id, file_name, file_size, mime_type,
  storage_url, created_at

email_associations
  id, email_id, entity_type (contact/company/deal),
  entity_id, created_at
```

### 9.5 Performance Considerations

- **Virtualized email list** for contacts with 100+ emails (use `react-window` or `@tanstack/virtual`).
- **Lazy-load email bodies** -- only fetch full HTML when a card is expanded.
- **Debounce autocomplete** search to 300ms to reduce API calls.
- **Optimistic UI** for send actions -- show "Sent" immediately, handle failures asynchronously.
- **Cache templates** client-side with SWR/React Query (invalidate on mutation).
- **Batch tracking events** -- aggregate multiple opens into a single timeline entry to reduce noise.

### 9.6 Privacy and Compliance

- **GDPR/CAN-SPAM:** Respect `email_opt_out` and `do_not_track` preferences on contact records.
- **Tracking consent:** Only track opens/clicks for contacts who have a lawful basis for data processing.
- **Unsubscribe:** Include unsubscribe link in all marketing/bulk emails.
- **Data retention:** Allow configurable retention periods for tracking data.
- **Transparency:** Show users when tracking is active and explain what data is collected.

---

## References

1. HubSpot Knowledge Base - Email Open and Click Tracking: https://knowledge.hubspot.com/connected-email/understand-hubspot-sales-email-open-and-click-tracking
2. HubSpot - Email Tracking Software: https://www.hubspot.com/products/sales/email-tracking
3. HubSpot - Analyze Email Delivery: https://knowledge.hubspot.com/marketing-email/analyze-email-delivery
4. Gmail Design History - Elizabeth Laraki: https://elizlaraki.substack.com/p/gmail-designed-to-be-joyfully-simple
5. Gmail Conversation View - Googally: https://www.googally.com/blog/gmail-conversation-view
6. TinyMCE - Custom CRM Rich Text Fields: https://www.tiny.cloud/blog/create-custom-crm-rich-text-fields/
7. Rich Text Editor Component Gallery: https://component.gallery/components/rich-text-editor/
8. NN/g - Status Trackers Design Guidelines: https://www.nngroup.com/articles/status-tracker-progress-update/
9. A11y Collective - Accessible Modals: https://www.a11y-collective.com/blog/modal-accessibility/
10. MDN - ARIA aria-modal: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-modal
11. Harvard - Accessible Modal Dialogs: https://accessibility.huit.harvard.edu/technique-accessible-modal-dialogs
12. Brevo Campaign Reports UX Case Study: https://medium.com/design-bootcamp/from-metrics-to-meaning-a-product-design-case-study-on-brevo-campaign-reports
13. Litmus - Accessible Emails Guide: https://www.litmus.com/blog/ultimate-guide-accessible-emails
14. Microsoft Dynamics 365 - Timeline Activities: https://learn.microsoft.com/en-us/dynamics365/sales/timeline-activities
15. Email Design Trends 2026 - Designmodo: https://designmodo.com/email-design-trends/
16. OnePageCRM - Contact Activity Timeline: https://help.onepagecrm.com/article/770-contact-activity-timeline
17. Streak CRM Features: https://www.streak.com/features
18. UX StackExchange - Email Thread Ordering: https://ux.stackexchange.com/questions/39670/how-should-email-threads-be-ordered
