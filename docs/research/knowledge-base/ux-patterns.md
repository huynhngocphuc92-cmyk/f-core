# Knowledge Base Feature -- UX Patterns Analysis

> **Project:** F-CORE (HubSpot CRM Clone)
> **Feature:** Knowledge Base / Help Center
> **Date:** 2026-02-09
> **Status:** Research Complete
> **Reference Platforms:** HubSpot Knowledge Base, Zendesk Guide, Intercom Articles, Notion, Confluence, KnowledgeOwl

---

## Table of Contents

1. [Article Editor UX](#1-article-editor-ux)
2. [Category Navigation](#2-category-navigation)
3. [Search Experience](#3-search-experience)
4. [Reader Experience](#4-reader-experience)
5. [Admin Dashboard](#5-admin-dashboard)
6. [Content Organization](#6-content-organization)
7. [SEO & Sharing](#7-seo--sharing)
8. [Responsive Design](#8-responsive-design)
9. [Accessibility](#9-accessibility)

---

## 1. Article Editor UX

### 1.1 Best Practices and Common Patterns

#### Editor Architecture: Block-Based vs. Traditional WYSIWYG

Modern knowledge base editors have converged on a **block-based editing model** (popularized by Notion and WordPress Gutenberg). In this model, content is broken into discrete blocks -- paragraphs, headings, images, code blocks, callouts, tables -- each independently manageable and reorderable.

**Recommended approach for F-CORE:** A hybrid editor that combines block-based structure with inline WYSIWYG formatting. Use a framework like **Tiptap** (built on ProseMirror) or **BlockNote** for the React/Next.js stack.

Key editor frameworks to consider:
- **Tiptap:** Headless, highly extensible, React-friendly, collaborative editing support
- **BlockNote:** Block-based, React-native, built on Tiptap/ProseMirror
- **Lexical (Meta):** High scalability, rich plugin support, modern architecture
- **Editor.js:** Block-based with JSON output, good for structured content

#### Rich Text Toolbar Patterns

**Floating/Inline Toolbar:**
- Appears contextually when text is selected
- Contains formatting options: bold, italic, underline, strikethrough, code, link
- Disappears when selection is cleared
- Reduces visual clutter compared to fixed toolbars

**Fixed Top Toolbar:**
- Persistent toolbar at top of editor area
- Contains block-level controls: heading levels, lists, alignment, block type selector
- Groups related actions: Text formatting | Insert | Alignment | Block type

**Slash Command Menu:**
- Triggered by typing `/` at the start of a line or empty block
- Shows a searchable list of block types: heading, image, code, callout, table, divider, video
- Keyboard-navigable with arrow keys and Enter to select
- Pattern used by Notion, Confluence, and many modern editors

#### Content Block Types for Knowledge Base

Essential blocks:
- **Text/Paragraph:** Default block with inline formatting
- **Headings:** H2, H3, H4 (H1 reserved for article title)
- **Ordered/Unordered Lists:** With nesting support
- **Code Block:** Syntax highlighting with language selector
- **Image/Media:** Upload, URL embed, drag-and-drop, with alt text and caption fields
- **Callout/Alert:** Info, warning, success, error variants with icon + colored background
- **Table:** Basic table with row/column add/remove
- **Divider/Separator:** Horizontal rule
- **Video Embed:** YouTube, Vimeo, Loom embeds via URL paste
- **Accordion/Collapsible:** FAQ-style expandable sections
- **Internal Link/Article Reference:** Link to other KB articles

#### Media Embedding Patterns

- **Drag and drop:** Files dragged into the editor auto-upload and create media blocks
- **Paste from clipboard:** Screenshots pasted directly create image blocks
- **URL paste detection:** Pasting a YouTube/Vimeo URL auto-converts to an embedded player
- **Media library:** Access to previously uploaded images and files
- **Image editing:** Basic resize, alignment (left, center, full-width), alt text, caption

#### Auto-Save and Version History

- Auto-save every 30 seconds or on significant changes
- Show "Saved" / "Saving..." / "Unsaved changes" indicator in header
- Version history panel accessible from article settings
- Compare versions with diff view
- Restore previous versions with confirmation

### 1.2 Do's and Don'ts

**Do:**
- Provide a distraction-free writing mode (hide sidebar, full-width editor)
- Support keyboard shortcuts for all common formatting (Cmd+B, Cmd+I, Cmd+K for link)
- Show a live word count and estimated reading time
- Support markdown shortcuts (## for H2, ** for bold, - for list)
- Auto-generate a URL slug from the title
- Allow copy/paste from Google Docs and Word with formatting preserved
- Provide undo/redo with Cmd+Z / Cmd+Shift+Z

**Don't:**
- Don't show all formatting options at once -- use progressive disclosure
- Don't allow H1 in the editor body (article title serves as H1)
- Don't auto-play embedded videos in the editor
- Don't strip formatting on paste without offering a "paste as plain text" option
- Don't use a separate preview mode -- WYSIWYG should be the default
- Don't require saving before previewing the article

### 1.3 User Flow: Creating an Article

```
1. User clicks "Create Article" button
2. Empty editor loads with:
   - Title field (auto-focused, large font)
   - Subtitle field (optional, smaller font)
   - Body area with placeholder "Start writing or type / for commands"
3. User types title -> URL slug auto-generates
4. User writes body content using:
   - Inline toolbar (select text -> format)
   - Slash commands (type / -> select block type)
   - Drag-and-drop (media files -> image blocks)
5. User configures settings via right panel:
   - Category & Subcategory (dropdown)
   - Tags (tag input with autocomplete)
   - Meta description (auto-generated from first paragraph, editable)
   - URL slug (auto-generated, editable)
   - Visibility (public / private / restricted)
   - Language (if multi-language)
6. User can:
   - "Save as Draft" -> article saved, not published
   - "Publish" -> article goes live
   - "Schedule" -> set future publish date
7. Success confirmation with link to view published article
```

### 1.4 Key Interaction Patterns

- **Floating toolbar:** Appears 200ms after text selection, positioned above selection
- **Block handle:** Hover over left edge of any block to reveal drag handle + block menu (duplicate, delete, move up/down, convert to different type)
- **Slash menu:** Searchable, keyboard-navigable, closes on Escape or click outside
- **Link insertion:** Cmd+K opens inline link popover with URL input and search for internal articles
- **Image upload:** Progress indicator during upload, skeleton placeholder until loaded
- **Table:** Tab to navigate cells, Enter for new row, toolbar for row/column operations

---

## 2. Category Navigation

### 2.1 Best Practices and Common Patterns

#### Hierarchy Structure

Knowledge bases typically use a **two-level hierarchy**: Categories and Subcategories. HubSpot specifically supports Categories > Subcategories > Articles. Zendesk supports Categories > Sections > Articles with up to five nested section levels on Enterprise plans.

**Recommended hierarchy for F-CORE:**
```
Knowledge Base
  |-- Category (e.g., "Getting Started")
  |     |-- Subcategory (e.g., "Account Setup")
  |     |     |-- Article
  |     |     |-- Article
  |     |-- Subcategory (e.g., "First Steps")
  |           |-- Article
  |-- Category (e.g., "Billing")
        |-- Article (directly in category, no subcategory needed)
```

Limit nesting to **2 levels maximum** for public-facing knowledge bases. Deeper nesting increases cognitive load and makes navigation confusing. Research shows users prefer broader, shallower hierarchies over narrow, deep ones.

#### Sidebar Navigation

- **Collapsible tree view:** Categories expand/collapse to show subcategories and articles
- **Current location highlighted:** Active article and its parent categories visually distinct
- **Sticky sidebar:** Navigation stays visible while scrolling article content
- **Category icons:** Each category can have an icon (from a library) for visual recognition
- **Article count badge:** Show number of articles per category/subcategory

#### Breadcrumbs

Breadcrumb navigation is essential for knowledge bases with hierarchical content. It answers "Where am I?" and provides quick navigation to parent categories.

**Pattern:**
```
Home > Category Name > Subcategory Name > Article Title
```

Best practices:
- Use location-based breadcrumbs (based on hierarchy, not path)
- Always keep "Home" visible as the first item
- Use `>` or `/` as separator (most recognized)
- Current page (last item) should be non-clickable and visually distinct (bold or different color)
- On mobile, truncate middle items with ellipsis `...` and show only Home and current parent
- Breadcrumbs should use semantic HTML: `<nav aria-label="Breadcrumb">` with `<ol>`

#### Drag-and-Drop Reordering (Admin)

For admin users managing categories:
- Drag handle icon on the left of each category/subcategory/article
- Visual drop indicator (line between items shows where item will land)
- Drag constraints: articles can be moved between subcategories, subcategories within categories
- Undo action available after reorder completes
- Changes save automatically after drag completes

### 2.2 Do's and Don'ts

**Do:**
- Limit category depth to 2 levels (Category > Subcategory)
- Use clear, descriptive category labels that match user mental models
- Show breadcrumbs on every article page
- Display the current location in the sidebar navigation
- Allow categories to have both a description and an icon
- Order categories manually (by importance) rather than alphabetically by default
- Show empty state messages for categories with no articles

**Don't:**
- Don't create more than 10-12 top-level categories (cognitive overload per Miller's Law: 7 +/- 2)
- Don't use vague category names like "General" or "Miscellaneous"
- Don't hide the navigation on article pages
- Don't require users to go back to the home page to navigate to a different category
- Don't nest deeper than 2 levels for public-facing content
- Don't use path-based breadcrumbs (confusing for knowledge base content)

### 2.3 User Flow: Navigating Categories

```
1. User lands on Knowledge Base home page
2. Sees grid/list of top-level categories with:
   - Category icon
   - Category name
   - Brief description
   - Article count
3. User clicks a category
4. Category page shows:
   - Category title and description
   - Breadcrumb: Home > Category Name
   - List of subcategories (if any) with article counts
   - Articles directly in this category (if any)
5. User clicks a subcategory
6. Subcategory page shows:
   - Breadcrumb: Home > Category > Subcategory
   - List of articles in this subcategory
7. User clicks an article
8. Article page shows:
   - Breadcrumb: Home > Category > Subcategory > Article Title
   - Sidebar navigation with current location highlighted
   - Article content
```

### 2.4 Key Interaction Patterns

- **Category card hover:** Subtle elevation/shadow change on hover
- **Expand/collapse animation:** Smooth 200ms transition for tree nodes
- **Breadcrumb truncation:** On mobile, show `Home > ... > Current Parent > Article`
- **Active state in sidebar:** Background highlight + bold text for current article
- **Category page layout:** Grid of subcategory cards (3-column on desktop, 1-column on mobile)

---

## 3. Search Experience

### 3.1 Best Practices and Common Patterns

#### Search Architecture: Three Models of Finding

Based on UX research, knowledge base search fits primarily two models:

1. **Quick Search (Known-item):** User knows what they need, types specific keywords. Optimize for speed, autocomplete, and direct results.
2. **Discovery Search (Exploratory):** User has a problem but does not know the exact terms. Optimize for suggestions, related content, and category filtering.

#### Search Box Design

- **Prominent placement:** Centered on the knowledge base home page, large and inviting
- **Placeholder text:** Descriptive, e.g., "Search for articles, guides, and help topics..."
- **Search icon:** Magnifying glass on the left side of the input
- **Keyboard shortcut:** Cmd+K or `/` to focus search from anywhere
- **Minimum width:** 400px on desktop for comfortable typing

#### Instant Search / Autocomplete

As users type, show real-time results in a dropdown:

```
+--------------------------------------------------+
| Search: "how to set up em..."                    |
+--------------------------------------------------+
| SUGGESTED ARTICLES                               |
|  > How to Set Up Email Forwarding      [Emails]  |
|  > How to Set Up Email Templates       [Emails]  |
|  > Setting Up Email Notifications    [Settings]  |
+--------------------------------------------------+
| CATEGORIES                                       |
|  > Email Configuration (12 articles)             |
+--------------------------------------------------+
| [See all results for "how to set up em..."]      |
+--------------------------------------------------+
```

Key principles:
- Begin showing results after 2-3 characters typed
- Debounce input by 200-300ms to avoid excessive API calls
- Highlight the matched text in results (bold the user's query within result titles)
- Show category/section labels next to each result for context
- Limit dropdown to 5-7 results with a "See all results" link
- Support keyboard navigation (arrow keys, Enter to select, Escape to close)
- Show recent searches when the search box is focused with an empty query

#### Search Results Page

Full search results page layout:
- **Query display:** Show the search query with result count: `12 results for "email setup"`
- **Result cards:** Title (linked), excerpt with highlighted query terms, category label, date
- **Snippet highlighting:** Bold the matching terms within the excerpt
- **Filtering:** Filter by category, date range, content type
- **Sorting:** Relevance (default), newest, most viewed
- **Pagination:** Load more button or infinite scroll (prefer load more for accessibility)

#### "No Results" State

This is a critical UX moment. A bad "no results" state causes users to abandon the knowledge base entirely.

**Pattern:**
```
+--------------------------------------------------+
|  No results found for "foobar widget"            |
|                                                  |
|  Try:                                            |
|  - Using different keywords                      |
|  - Checking for typos                            |
|  - Browsing categories below                     |
|                                                  |
|  POPULAR ARTICLES                                |
|  > Getting Started Guide                         |
|  > Account Setup                                 |
|  > Contact Support                               |
|                                                  |
|  [Browse all categories]  [Contact Support]      |
+--------------------------------------------------+
```

#### Fuzzy Search and Typo Tolerance

- Handle common misspellings with fuzzy matching
- Use synonym matching (e.g., "invoice" = "bill" = "receipt")
- Provide "Did you mean...?" suggestions for possible corrections
- NLP-based intent understanding for natural language queries

### 3.2 Do's and Don'ts

**Do:**
- Make search the most prominent element on the KB home page
- Show instant results as users type (within 200ms)
- Highlight matching terms in search results
- Provide helpful "no results" states with alternative suggestions
- Support Cmd+K or a keyboard shortcut to trigger search
- Track search queries for analytics (identify content gaps)
- Implement fuzzy search with typo tolerance
- Show recent searches when the search box is empty and focused
- Preserve search query when navigating back from an article

**Don't:**
- Don't require users to press Enter before showing any results
- Don't show an empty dropdown while results are loading (use skeleton/spinner)
- Don't redirect to a separate page for every search (use instant search first)
- Don't show raw technical error messages when search fails
- Don't limit search to exact keyword matches only
- Don't hide the search bar on article pages
- Don't show more than 7 instant results in the dropdown (cognitive overload)

### 3.3 User Flow: Searching for an Article

```
1. User focuses search bar (click or Cmd+K)
2. If empty: show recent searches and popular articles
3. User types query
4. After 2-3 characters: show instant results dropdown
   - Results update as user types (debounced 200ms)
   - Matching text highlighted in results
   - Each result shows: title, category label, brief excerpt
5a. User clicks a result -> navigate directly to article
5b. User presses Enter -> navigate to full search results page
6. Full results page shows:
   - Result count and query
   - Filter sidebar (categories, date)
   - Result cards with highlighted snippets
7. If no results: show suggestions, popular articles, and contact support link
```

### 3.4 Key Interaction Patterns

- **Search focus:** Slight expansion animation, border color change to brand color
- **Typing feedback:** Subtle loading spinner in the search field while fetching results
- **Result hover:** Background highlight on hover, cursor pointer
- **Keyboard navigation:** Arrow keys to navigate results, Enter to select, Escape to close dropdown
- **Query persistence:** Clicking back from an article returns to search results with query intact
- **Mobile search:** Full-screen search overlay with large input and results below

---

## 4. Reader Experience

### 4.1 Best Practices and Common Patterns

#### Article Layout

The reading experience is the core of any knowledge base. Layout should prioritize **readability and scannability**.

**Three-Column Layout (Desktop):**
```
+------------------------------------------------------------+
| Breadcrumb: Home > Category > Subcategory > Article        |
+----------+-----------------------------+-------------------+
| Sidebar  |     Article Content         | Table of Contents |
| Nav      |                             | (sticky)          |
| (tree)   |  # Article Title            |                   |
|          |  Last updated: Jan 15, 2026 | - Section 1       |
| [active] |  Reading time: 5 min        | - Section 2       |
|          |                             |   - Subsection    |
|          |  ## Section 1               | - Section 3       |
|          |  Content here...            |                   |
|          |                             |                   |
|          |  ## Section 2               |                   |
|          |  Content here...            |                   |
|          |                             |                   |
|          |  ---                        |                   |
|          |  Was this article helpful?  |                   |
|          |  [Yes] [No]                 |                   |
|          |                             |                   |
|          |  Related Articles           |                   |
|          |  - Article 1                |                   |
|          |  - Article 2                |                   |
+----------+-----------------------------+-------------------+
```

**Two-Column Layout (Alternative):**
```
+------------------------------------------------------------+
| Breadcrumb                                                 |
+-----------------------------+------------------------------+
|     Article Content         | Table of Contents (sticky)   |
|                             |                              |
+-----------------------------+------------------------------+
```

#### Table of Contents (ToC)

Auto-generated from H2 and H3 headings in the article. Essential for long articles.

- **Sticky positioning:** ToC stays visible as user scrolls the article
- **Active section highlighting:** Current section highlighted as user scrolls (scroll spy)
- **Smooth scroll:** Clicking a ToC item smoothly scrolls to that section
- **Collapse threshold:** Only show ToC if article has 3+ headings
- **Progress indicator:** Optional reading progress bar at the top of the page

#### Article Metadata

Displayed near the title:
- **Last updated date:** More important than creation date for knowledge base content
- **Estimated reading time:** Based on word count (average 200-250 words/minute)
- **Author/Contributor:** Optional, with avatar
- **Category/Tags:** Linked labels for navigation
- **Version indicator:** "Updated for v2.5" (if product-versioned)

#### Helpful/Not Helpful Feedback

The binary feedback mechanism is the industry standard for knowledge base articles (preferred over 5-star ratings for documentation).

**Pattern:**
```
+--------------------------------------------------+
|  Was this article helpful?                       |
|                                                  |
|  [ Thumbs Up - Yes ]    [ Thumbs Down - No ]    |
|                                                  |
+--------------------------------------------------+

After clicking "No":
+--------------------------------------------------+
|  Thanks for your feedback.                       |
|  What could we improve?                          |
|                                                  |
|  [ ] Missing information                         |
|  [ ] Incorrect information                       |
|  [ ] Hard to understand                          |
|  [ ] Outdated content                            |
|  [ ] Other                                       |
|                                                  |
|  [Optional comment: _______________]             |
|                                                  |
|  [Submit]                                        |
+--------------------------------------------------+

After clicking "Yes":
+--------------------------------------------------+
|  Great! Thanks for your feedback.                |
+--------------------------------------------------+
```

Key considerations:
- Use "helpful" / "not helpful" wording (softer than "good" / "bad")
- After "No" click, show a brief follow-up form with checkboxes and optional comment
- After "Yes" click, show simple thank you message
- Store feedback for analytics and content improvement
- Avoid requiring login to provide feedback (friction kills response rates)
- Position at the bottom of the article, before "Related Articles"

#### Related Articles

Show 3-5 related articles at the bottom of each article page:
- Based on: same category, shared tags, content similarity
- Display as: card list with title, brief description, and category label
- Help users discover more content without returning to navigation
- Label section clearly: "Related Articles" or "You might also find helpful"

#### Print-Friendly View

- Provide a "Print" button/icon in the article toolbar
- Print stylesheet: remove navigation, sidebar, ToC, feedback widget
- Include article title, URL, and print date in header/footer
- Ensure code blocks and tables render properly in print
- Use `@media print` CSS rules

### 4.2 Do's and Don'ts

**Do:**
- Use a comfortable reading width (max 700-800px for body text)
- Set body text to 16-18px with 1.6-1.8 line height
- Auto-generate Table of Contents from headings
- Show "Last updated" date prominently (builds trust)
- Implement scroll spy for Table of Contents
- Add a binary helpful/not helpful feedback mechanism
- Show related articles at the bottom
- Support print-friendly layout
- Add anchor links to each heading (click to copy link)

**Don't:**
- Don't make body text full-width on large screens (hard to read)
- Don't use tiny text (below 14px for body)
- Don't hide the Table of Contents behind a toggle on desktop
- Don't use 5-star ratings for KB articles (binary is better for documentation)
- Don't require login to read public KB articles
- Don't show ads or unrelated promotions on article pages
- Don't auto-collapse sections (users expect to see full content)
- Don't put feedback at the very top (users haven't read the article yet)

### 4.3 User Flow: Reading an Article

```
1. User arrives at article (via search, navigation, or direct link)
2. Page loads with:
   - Breadcrumb at top
   - Article title, subtitle, metadata (date, reading time)
   - Table of Contents (right sidebar, sticky)
   - Full article content
   - Sidebar navigation (left, showing category tree)
3. User reads/scrolls article:
   - ToC highlights current section (scroll spy)
   - Progress bar (optional) shows reading progress
4. User clicks ToC item -> smooth scroll to section
5. User reaches bottom:
   - "Was this article helpful?" prompt
   - User clicks Yes/No -> feedback recorded
   - Related articles shown
6. User can:
   - Navigate to related article
   - Use breadcrumb to go up
   - Use sidebar to navigate to different article
   - Print the article
   - Copy link to specific section (heading anchor)
```

### 4.4 Key Interaction Patterns

- **Scroll spy:** Intersection Observer API tracks which heading is in viewport, updates ToC
- **Heading anchor:** Hover over heading shows a link icon; clicking copies direct link to clipboard
- **Smooth scrolling:** `scroll-behavior: smooth` with offset for fixed header
- **Feedback animation:** Thumbs up/down buttons have subtle scale animation on click
- **Image lightbox:** Clicking an image opens full-size view in a modal
- **Code block copy:** "Copy" button in top-right corner of code blocks

---

## 5. Admin Dashboard

### 5.1 Best Practices and Common Patterns

#### Article List Management

The admin dashboard is where content creators and managers work with articles. The primary view is a **data table** of all articles.

**Article List Table Columns:**
| Column | Description |
|--------|-------------|
| Title | Article title (linked to editor) |
| Status | Draft, In Review, Published, Archived (with color badge) |
| Category | Category > Subcategory display |
| Author | Creator's name/avatar |
| Last Updated | Relative time (e.g., "2 hours ago") |
| Views | Total page views |
| Helpful % | Percentage of positive feedback |
| Actions | Edit, Preview, Archive, Delete dropdown |

#### Status Workflow

Articles should follow a clear lifecycle:

```
  Draft --> In Review --> Published --> Archived
    ^          |              |
    |          v              |
    +---- Rejected            |
    |                         |
    +-------- Edit -----------+
```

Status definitions:
- **Draft:** Work in progress, not visible to readers
- **In Review:** Ready for editorial review (optional workflow)
- **Published:** Live and visible to readers
- **Archived:** Removed from public view but preserved in system (soft delete)

#### Bulk Actions

When multiple articles are selected via checkboxes:
- **Publish:** Change status of selected articles to Published
- **Archive:** Move selected articles to Archived status
- **Move to Category:** Reassign selected articles to a different category
- **Change Author:** Reassign to a different content owner
- **Export:** Download selected articles as CSV/PDF
- **Delete:** Soft delete (move to trash)

Pattern:
```
+------------------------------------------------------------+
| [ ] Select All  |  3 articles selected                     |
|                 |  [Publish] [Archive] [Move] [Delete]     |
+------------------------------------------------------------+
```

Bulk action bar should appear at the top of the table when 1+ items are selected.

#### Filtering and Sorting

**Filter options:**
- Status: All, Draft, In Review, Published, Archived
- Category: Dropdown with all categories
- Author: Dropdown with team members
- Date range: Created/Updated within date range
- Tags: Filter by specific tags

**Sort options:**
- Last updated (default, newest first)
- Title (A-Z, Z-A)
- Views (most/least)
- Helpful rating (highest/lowest)
- Created date

Filters should persist across sessions (saved in URL query params or localStorage).

#### Analytics Overview

Dashboard should provide at-a-glance metrics:

**Key Metrics Cards (top of dashboard):**
- Total Published Articles
- Total Views (this period)
- Average Helpful Rating (%)
- Top Search Queries with No Results (content gaps)

**Charts/Visualizations:**
- Article views over time (line chart)
- Top 10 most-viewed articles (bar chart)
- Feedback distribution: helpful vs. not helpful (donut chart)
- Articles by status (stacked bar: draft, published, archived)
- Search queries leading to 0 results (table -- identifies content gaps)

**Per-Article Analytics (in article detail):**
- Page views over time
- Helpful/Not helpful count and ratio
- Average time on page
- Referral sources (search, direct link, category navigation)
- Related search queries that led to this article

### 5.2 Do's and Don'ts

**Do:**
- Show article status with color-coded badges (green=published, yellow=draft, gray=archived)
- Provide quick inline actions (edit, preview, archive) without navigating away
- Show content gap analysis (searches with no results)
- Allow bulk operations for efficient content management
- Display key metrics at the top of the dashboard
- Include a "quick create" button always visible in the header
- Persist filter and sort preferences
- Show "last updated by" to track who made changes

**Don't:**
- Don't hard delete articles -- always use soft delete (archive/trash)
- Don't show too many columns by default (progressive disclosure -- let users customize)
- Don't require navigating to a separate page to change article status
- Don't show analytics without date range controls
- Don't hide the search function on the admin dashboard
- Don't make bulk actions destructive without confirmation
- Don't load all articles at once (paginate or virtualize for performance)

### 5.3 User Flow: Managing Articles

```
1. Admin navigates to Knowledge Base > Articles
2. Dashboard shows:
   - Metrics cards at top (total articles, views, rating)
   - Filter bar (status, category, author, date)
   - Article list table with sortable columns
3. Admin filters by status "Draft":
   - Table updates to show only drafts
   - URL updates with filter params (shareable)
4. Admin selects 3 articles via checkboxes:
   - Bulk action bar appears at top
   - Options: Publish, Archive, Move to Category
5. Admin clicks "Publish":
   - Confirmation dialog: "Publish 3 articles?"
   - On confirm: articles published, success toast notification
   - Status badges update to green "Published"
6. Admin clicks article title to edit:
   - Opens article editor
   - "Back to Articles" link in header
```

### 5.4 Key Interaction Patterns

- **Status badge click:** Quick status change via dropdown (Draft -> Published)
- **Inline preview:** Hover over article title shows preview tooltip with excerpt
- **Drag-to-reorder:** Within category management view, drag articles to change order
- **Toast notifications:** Success/error feedback for bulk actions
- **Confirmation dialogs:** For destructive actions (archive, delete) with clear messaging
- **Keyboard shortcuts:** `n` for new article, `/` for search, arrow keys for table navigation

---

## 6. Content Organization

### 6.1 Best Practices and Common Patterns

#### Categories vs. Tags: When to Use Each

**Categories** provide **hierarchical, exclusive classification**:
- Each article belongs to exactly one category (and optionally one subcategory)
- Categories define the primary navigation structure
- Categories are visible to readers in navigation and breadcrumbs
- Think of categories as "shelves in a library"

**Tags** provide **flat, non-exclusive classification**:
- An article can have multiple tags
- Tags are used primarily for search improvement and content grouping
- Tags may or may not be visible to readers (HubSpot keeps them invisible, used only for search)
- Think of tags as "sticky notes on books"

**F-CORE Recommendation:**
```
Category (hierarchical, exclusive, visible in nav)
  |-- Subcategory (one level deep)
        |-- Article
              |-- Tags (flat, multiple per article, used for search)
```

#### Nested Categories

Best practices for nesting:
- **Maximum 2 levels:** Category > Subcategory (keep it flat)
- **Maximum 10-12 top-level categories:** Align with Miller's Law (7 +/- 2 items for comfortable scanning)
- **Minimum 3 articles per category:** Don't create categories for single articles
- **Naming convention:** Use task-oriented labels ("Getting Started", "Managing Contacts") not object-oriented labels ("Contacts Module", "Settings Panel")
- **Mutual exclusivity:** Each article should naturally fit in one category. If it fits in multiple, consider restructuring or using tags for cross-referencing.

#### Article Ordering Within Categories

Three ordering strategies:
1. **Manual ordering (recommended for featured content):** Admin manually sets article order via drag-and-drop. Best for "Getting Started" and onboarding sequences.
2. **Alphabetical (default fallback):** Simple and predictable. Good for reference-style categories.
3. **Popularity-based:** Order by most viewed. Good for FAQ categories. Can be combined with manual pinning.

**F-CORE Recommendation:** Default to manual ordering with alphabetical as fallback. Allow admins to "pin" articles to the top of any category.

#### Content Taxonomy Design

Recommended category structure for a CRM knowledge base:

```
Getting Started
  |-- Account Setup
  |-- First Steps
  |-- Quick Start Guides

Contacts & Companies
  |-- Managing Contacts
  |-- Managing Companies
  |-- Import & Export
  |-- Properties & Fields

Sales & Deals
  |-- Pipeline Management
  |-- Deal Tracking
  |-- Quotes & Proposals

Email & Communication
  |-- Email Templates
  |-- Email Tracking
  |-- Conversations

Automation & Workflows
  |-- Workflow Basics
  |-- Triggers & Actions
  |-- Templates

Reporting & Analytics
  |-- Dashboard Setup
  |-- Custom Reports
  |-- Data Export

Integrations
  |-- Native Integrations
  |-- API & Webhooks
  |-- Third-Party Apps

Account & Billing
  |-- User Management
  |-- Billing & Subscriptions
  |-- Security & Privacy
```

### 6.2 Do's and Don'ts

**Do:**
- Use categories for navigation structure, tags for search enhancement
- Keep category hierarchy to 2 levels maximum
- Name categories using task-oriented, user-friendly language
- Allow manual ordering of articles within categories
- Use tags to enable cross-referencing between categories
- Review and consolidate categories quarterly
- Show article count per category/subcategory

**Don't:**
- Don't create empty categories (minimum 3 articles)
- Don't let tag lists grow unbounded (maintain a controlled taxonomy)
- Don't use both categories AND tags for the same organizational purpose
- Don't change category structure frequently (breaks bookmarks and muscle memory)
- Don't name categories after internal team names or product codenames
- Don't nest categories more than 2 levels deep

### 6.3 User Flow: Organizing Content (Admin)

```
1. Admin navigates to Knowledge Base > Categories
2. Sees category tree with:
   - Category name, icon, description
   - Subcategories (expandable)
   - Article count per category/subcategory
3. Admin creates new category:
   - Modal: Name, Description, Icon (from library or custom), Display settings
4. Admin reorders categories:
   - Drag-and-drop to change order
   - Changes auto-save
5. Admin creates subcategory:
   - Click "+ Subcategory" within a category
   - Modal: Name, Description
6. Admin moves articles between categories:
   - Via article editor: change category dropdown
   - Via bulk action: select articles > "Move to Category"
   - Via drag-and-drop in category management view
```

---

## 7. SEO & Sharing

### 7.1 Best Practices and Common Patterns

#### URL Slug Patterns

Knowledge base URLs should be clean, descriptive, and hierarchical.

**Recommended URL structure:**
```
/knowledge-base/{category-slug}/{article-slug}

Examples:
/knowledge-base/getting-started/account-setup
/knowledge-base/contacts/import-contacts-csv
/knowledge-base/billing/upgrade-subscription
```

URL best practices:
- Use lowercase letters only
- Use hyphens (-) as word separators (not underscores)
- Keep URLs short but descriptive (3-5 words for the slug)
- Include primary keyword in the slug
- Auto-generate from article title, allow manual editing
- Avoid including IDs or dates in URLs (not user-friendly)
- Use canonical URLs to prevent duplicate content issues
- Implement 301 redirects when slugs change

**Important HubSpot behavior to note:** HubSpot does NOT automatically update article URLs when articles are moved between categories. URL changes must be made manually in the article editor. F-CORE should handle this more gracefully -- offer to update the URL when category changes, with an automatic 301 redirect from the old URL.

#### Meta Descriptions

- Auto-generate from the first 150-160 characters of the article body
- Allow manual override in article settings
- Include primary keywords naturally
- Write as a clear summary that helps searchers decide if the article answers their question
- Display in article settings panel with character count and preview

#### Open Graph Tags

Every article page should include Open Graph meta tags for rich social media previews:

```html
<meta property="og:title" content="How to Import Contacts from CSV" />
<meta property="og:description" content="Learn how to import your contacts..." />
<meta property="og:image" content="https://example.com/og/import-contacts.png" />
<meta property="og:url" content="https://example.com/knowledge-base/contacts/import-contacts-csv" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="F-CORE Help Center" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="How to Import Contacts from CSV" />
<meta name="twitter:description" content="Learn how to import your contacts..." />
<meta name="twitter:image" content="https://example.com/og/import-contacts.png" />
```

OG image best practices:
- Recommended size: 1200x630 pixels
- Include article title text on the image for visual clarity
- Use consistent branding (logo, colors) across all OG images
- Auto-generate OG images using a template (article title + category + brand)

#### Social Sharing

Provide share buttons on article pages:
- Copy link (with confirmation toast)
- Share to Twitter/X
- Share to LinkedIn
- Share to Facebook
- Email link

Position: Near the article title or at the bottom, before the feedback section. Keep it subtle -- knowledge base articles are utilitarian, not viral content.

#### Structured Data (Schema.org)

Add structured data for rich search results:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Import Contacts from CSV",
  "description": "Learn how to import your contacts...",
  "datePublished": "2026-01-15",
  "dateModified": "2026-02-01",
  "author": {
    "@type": "Organization",
    "name": "F-CORE"
  },
  "publisher": {
    "@type": "Organization",
    "name": "F-CORE",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
```

Also consider `FAQPage` schema for FAQ-style articles.

### 7.2 Do's and Don'ts

**Do:**
- Auto-generate URL slugs from article titles
- Allow manual slug editing with validation (lowercase, hyphens only)
- Implement 301 redirects when URLs change
- Include OG tags on every article page
- Auto-generate meta descriptions with manual override option
- Add structured data (Schema.org Article type)
- Provide a simple "Copy link" button on each article
- Include canonical URLs to prevent duplicate content

**Don't:**
- Don't include IDs, dates, or category IDs in URLs
- Don't change URLs without setting up redirects
- Don't use the same generic OG image for all articles
- Don't forget Twitter Card tags (many users share via Twitter)
- Don't make sharing buttons the most prominent element (distracting)
- Don't use URL-encoded characters in slugs (keep them clean)

### 7.3 Key Interaction Patterns

- **URL slug preview:** Show live preview of full URL as user types the slug
- **Copy link:** Click -> immediate copy to clipboard -> toast: "Link copied!"
- **OG preview:** In article settings, show a preview of how the article will appear when shared on social media
- **SEO score indicator:** Optional traffic-light indicator showing SEO completeness (title length, meta description, heading structure, image alt text)

---

## 8. Responsive Design

### 8.1 Best Practices and Common Patterns

#### Mobile Reading Experience

With 56%+ of internet traffic coming from mobile devices, mobile optimization is non-negotiable.

**Breakpoints:**
- Mobile: 0-767px
- Tablet: 768-1023px
- Desktop: 1024px+

**Mobile article layout:**
```
+------------------------+
| [Menu] [Search] [Logo] |
+------------------------+
| Breadcrumb: Home > ... |
+------------------------+
| # Article Title        |
| Updated: Jan 15, 2026  |
| Reading time: 5 min    |
+------------------------+
| [Table of Contents v]  |  <- Collapsible
+------------------------+
| Article content        |
| ...                    |
| ...                    |
+------------------------+
| Was this helpful?      |
| [Yes] [No]             |
+------------------------+
| Related Articles       |
+------------------------+
```

Key mobile adaptations:
- **Sidebar navigation:** Collapses into a hamburger menu or bottom sheet
- **Table of Contents:** Collapsible section at top of article (not sticky sidebar)
- **Images:** Full-width, lazy-loaded, with lightbox on tap
- **Tables:** Horizontal scroll wrapper for wide tables
- **Code blocks:** Horizontal scroll with reduced font size
- **Touch targets:** Minimum 44x44px for all interactive elements
- **Text size:** Minimum 16px for body text (prevents iOS zoom on focus)

#### Mobile Navigation

- **Hamburger menu:** Contains category tree navigation
- **Bottom navigation bar:** Optional, for key actions (Home, Search, Categories)
- **Full-screen search:** Search overlay takes full screen on mobile
- **Breadcrumbs:** Truncated to show only `Home > ... > Current Page`
- **Back button:** Clear "Back to [Category]" link at top of article

#### Mobile Knowledge Base Home

```
+------------------------+
| [Menu]  F-CORE Help    |
+------------------------+
|                        |
| How can we help you?   |
|                        |
| [Search...          ]  |
|                        |
+------------------------+
| Popular Articles       |
| > Getting Started      |
| > Import Contacts      |
| > Reset Password       |
+------------------------+
| Browse Categories      |
|                        |
| [Getting Started    ]  |
| [Contacts           ]  |
| [Sales & Deals      ]  |
| [Billing            ]  |
+------------------------+
```

Categories displayed as a vertical list (stacked cards) instead of a grid on mobile.

#### Mobile Editor Considerations

Mobile editing is secondary to desktop editing for knowledge base content, but should be supported for quick fixes.

- **Simplified toolbar:** Only essential formatting (bold, italic, link, list)
- **Full slash command support:** Slash menu works well on mobile (vertical list)
- **No drag-and-drop:** Replace with move up/down buttons for block reordering
- **Large touch targets:** All toolbar buttons minimum 44x44px
- **Auto-save critical:** Users may switch apps or lose connection
- **Quick edit mode:** Allow fixing typos and minor edits, not full article creation

### 8.2 Do's and Don'ts

**Do:**
- Design mobile-first, then enhance for desktop
- Use 16px minimum font size for body text on mobile
- Make all touch targets at least 44x44px
- Collapse sidebar navigation into a hamburger menu on mobile
- Make tables horizontally scrollable on small screens
- Lazy-load images for performance on mobile networks
- Support offline reading for previously visited articles (service worker caching)
- Test on real devices, not just browser resize

**Don't:**
- Don't shrink the desktop layout to fit mobile (redesign for mobile context)
- Don't use hover states as the only interaction method
- Don't show the full Table of Contents expanded by default on mobile
- Don't rely on drag-and-drop as the only reordering mechanism
- Don't use fixed-width elements that cause horizontal scrolling
- Don't show desktop-style multi-column layouts on mobile
- Don't use font sizes below 14px on mobile

### 8.3 Key Interaction Patterns

- **Pull-to-refresh:** On category and article list pages
- **Swipe navigation:** Optional swipe between articles in same category
- **Bottom sheet:** Category navigation slides up from bottom
- **Floating action button:** Quick access to search or "back to top"
- **Scroll-based header:** Header collapses/minimizes on scroll down, reappears on scroll up

---

## 9. Accessibility

### 9.1 Best Practices and Common Patterns

#### ARIA Landmarks

Every knowledge base page should have proper landmark regions:

```html
<body>
  <header role="banner">
    <!-- Logo, main navigation -->
    <nav aria-label="Main navigation">...</nav>
  </header>

  <div role="search" aria-label="Knowledge base search">
    <input type="search" aria-label="Search articles" />
  </div>

  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/kb/category">Category</a></li>
      <li aria-current="page">Article Title</li>
    </ol>
  </nav>

  <nav aria-label="Category navigation">
    <!-- Sidebar category tree -->
  </nav>

  <main id="main-content" role="main">
    <article>
      <!-- Article content -->
    </article>
  </main>

  <aside aria-label="Table of contents">
    <!-- Table of contents -->
  </aside>

  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
</body>
```

Key landmark principles:
- Use HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) as they have implicit ARIA roles
- Label multiple `<nav>` elements with unique `aria-label` values
- Only one `<main>` element per page
- Use `aria-current="page"` for the current breadcrumb item

#### Keyboard Navigation

All interactive elements must be keyboard accessible:

**Global keyboard shortcuts:**
- `Cmd/Ctrl + K`: Open search
- `Tab`: Navigate between interactive elements
- `Escape`: Close modals, dropdowns, search overlay

**Article page navigation:**
- `Tab` cycles through: search, navigation links, ToC links, article links, feedback buttons
- Skip navigation link: First focusable element should be "Skip to main content"
- Focus visible: All focused elements must have a visible focus indicator (2px solid outline)

**Rich Text Editor keyboard support:**
- `Cmd/Ctrl + B`: Bold
- `Cmd/Ctrl + I`: Italic
- `Cmd/Ctrl + K`: Insert link
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Tab`: Indent list items
- `Shift + Tab`: Outdent list items
- `Enter`: New paragraph/block
- `Shift + Enter`: Line break within block
- `/` at start of line: Open slash command menu
- `Arrow keys`: Navigate slash menu and autocomplete results
- `Escape`: Close slash menu

**Category tree navigation (sidebar):**
- `Arrow Down/Up`: Move between items
- `Arrow Right`: Expand collapsed category
- `Arrow Left`: Collapse expanded category
- `Enter/Space`: Select/activate item
- `Home/End`: Jump to first/last item

#### Screen Reader Support for Rich Text Editors

This is one of the most challenging accessibility areas. Key requirements:

- Editor content area must have `role="textbox"` and `aria-multiline="true"`
- Use `aria-label` to identify the editor: `aria-label="Article body editor"`
- Toolbar buttons must have `aria-label` or visible text labels
- Toggle buttons (bold, italic) must use `aria-pressed` to indicate state
- Block type changes should be announced via `aria-live` region
- Images in editor must have alt text fields (enforce during publish)
- Tables in editor must have proper `<th>` and `<caption>` elements

**Screen reader announcements:**
- On format change: "Bold applied" / "Bold removed"
- On block type change: "Changed to Heading 2"
- On image insert: "Image uploaded: [filename]"
- On save: "Article saved"
- On publish: "Article published"

#### Color Contrast and Visual Design

- All text must meet WCAG 2.1 AA contrast ratios:
  - Normal text: 4.5:1 minimum contrast ratio
  - Large text (18px+ or 14px+ bold): 3:1 minimum
  - UI components and graphical objects: 3:1 minimum
- Don't rely on color alone to convey meaning (add icons/text to status badges)
- Support high contrast mode
- Code blocks: Ensure syntax highlighting colors meet contrast requirements

#### Focus Management

- After page load, focus should move to the article title (or a meaningful heading)
- After search submission, focus should move to the first result
- Modal dialogs: Focus traps (Tab cycles within modal only)
- After closing a modal, focus returns to the element that triggered it
- Toast notifications: Use `role="status"` or `aria-live="polite"`

#### Content Accessibility

- All images must have descriptive `alt` text
- Videos must have captions/transcripts
- Links must have descriptive text (not "click here")
- Headings must follow a logical hierarchy (no skipping levels)
- Lists must use proper `<ol>`, `<ul>`, `<li>` markup
- Tables must have `<th>` elements with `scope` attributes
- Language attribute set on the `<html>` element

### 9.2 Do's and Don'ts

**Do:**
- Use semantic HTML elements as the foundation
- Provide a "Skip to main content" link as the first focusable element
- Label all ARIA landmarks uniquely when there are multiples of the same type
- Ensure all interactive elements are keyboard accessible
- Maintain visible focus indicators (never `outline: none` without an alternative)
- Test with screen readers (VoiceOver, NVDA, JAWS)
- Enforce alt text for images before publishing articles
- Support `prefers-reduced-motion` media query
- Use `aria-live` regions for dynamic content updates
- Provide text alternatives for all non-text content

**Don't:**
- Don't use `div` or `span` for interactive elements (use `<button>`, `<a>`, `<input>`)
- Don't remove focus outlines without providing visible alternatives
- Don't rely on color alone to convey information
- Don't use auto-playing media without user control
- Don't trap keyboard focus without an escape mechanism
- Don't use `aria-hidden="true"` on visible content
- Don't skip heading levels (H1 -> H3 without H2)
- Don't make placeholder text the only label for inputs
- Don't use custom keyboard shortcuts that conflict with screen reader commands
- Don't assume all users can use a mouse or touch screen

### 9.3 WCAG 2.1 Compliance Checklist for Knowledge Base

| Criterion | Level | Knowledge Base Application |
|-----------|-------|---------------------------|
| 1.1.1 Non-text Content | A | Alt text for all images in articles |
| 1.3.1 Info and Relationships | A | Semantic headings, lists, tables, landmarks |
| 1.3.5 Identify Input Purpose | AA | Search field with `autocomplete` attribute |
| 1.4.1 Use of Color | A | Status badges use icons + text, not just color |
| 1.4.3 Contrast (Minimum) | AA | All text meets 4.5:1 ratio |
| 1.4.4 Resize Text | AA | Content readable at 200% zoom |
| 1.4.10 Reflow | AA | Content works at 320px width without horizontal scroll |
| 2.1.1 Keyboard | A | All functions accessible via keyboard |
| 2.1.2 No Keyboard Trap | A | Users can navigate away from all components |
| 2.4.1 Bypass Blocks | A | Skip navigation link provided |
| 2.4.2 Page Titled | A | Descriptive page titles for all pages |
| 2.4.3 Focus Order | A | Logical tab order through page |
| 2.4.4 Link Purpose | A | Descriptive link text throughout |
| 2.4.6 Headings and Labels | AA | Descriptive headings and form labels |
| 2.4.7 Focus Visible | AA | Visible focus indicators on all elements |
| 3.1.1 Language of Page | A | `lang` attribute on html element |
| 3.2.1 On Focus | A | No unexpected context changes on focus |
| 3.3.1 Error Identification | A | Clear error messages in search and forms |
| 4.1.2 Name, Role, Value | A | ARIA attributes on custom widgets |

### 9.4 Key Interaction Patterns

- **Skip link:** Hidden link becomes visible on Tab focus, jumps to `<main>` content
- **Focus ring:** 2px solid outline in brand color, visible on all focused elements
- **Screen reader only text:** `.sr-only` class for visually hidden but screen-reader-accessible text
- **Live regions:** Search results count announced via `aria-live="polite"` region
- **Error announcements:** Form validation errors announced via `aria-live="assertive"`
- **Reduced motion:** Disable animations when `prefers-reduced-motion: reduce` is active

---

## Appendix A: Competitive Analysis Summary

### HubSpot Knowledge Base
- Categories and subcategories with icons
- Tags for search improvement (invisible to readers)
- Rich text editor with inline formatting
- AI-powered article recommendations
- Built-in analytics (views, helpful ratings)
- Multi-language support
- URL customization per article
- Integration with chatbot and customer agent

### Zendesk Guide
- Categories > Sections > Articles (up to 5 levels on Enterprise)
- Rich text and markdown editors
- Community forums integration
- Content cues (AI recommendations for content gaps)
- Customizable themes with Handlebars templates
- Robust API for custom integrations

### Intercom Articles
- Clean, minimal article editor
- Multilingual content support
- In-app help center widget
- Article reactions (5 emoji options)
- Messenger integration
- AI-powered search suggestions

### Notion (as Internal KB)
- Block-based editor (industry-leading UX)
- Nested pages (unlimited depth)
- Database views for article management
- Real-time collaboration
- Slash commands for block insertion
- Limited public sharing and SEO capabilities

### Confluence
- Rich editor with macros (expandable sections, code blocks, diagrams)
- Spaces > Pages > Child Pages hierarchy
- Powerful search with content type filters
- Labels (tags) for cross-referencing
- Page tree navigation
- Version history with diff view

---

## Appendix B: Recommended Technology Stack

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| Rich Text Editor | Tiptap (or BlockNote) | Headless, React-friendly, extensible, block-based |
| Search Engine | Postgres full-text search + trigram index | Sufficient for initial MVP; upgrade to Meilisearch/Algolia later |
| URL Slugs | `slugify` library | Consistent, SEO-friendly slug generation |
| OG Image Generation | `@vercel/og` or Satori | Dynamic OG images from article metadata |
| Table of Contents | Auto-generated from headings via remark/rehype | Consistent, automatic, zero maintenance |
| Syntax Highlighting | Shiki or Prism.js | Code block highlighting in articles |
| Analytics | PostHog or custom events | Article views, search queries, feedback tracking |

---

## Appendix C: User Research Questions

Before building, validate these assumptions with user research:

1. How do users currently find answers? (Search-first vs. browse-first)
2. What is the expected article depth? (Quick answers vs. in-depth guides)
3. Do users need multi-language support from day one?
4. Will internal employees also use the KB, or is it customer-only?
5. What existing content needs to be migrated?
6. How often does content change? (Determines the importance of versioning)
7. Do users prefer step-by-step tutorials or reference documentation?
8. Is video content a priority, or primarily text-based?
9. What devices do users primarily access the help center from?
10. Are there compliance requirements (GDPR, HIPAA) affecting content access?

---

*Document compiled from analysis of industry leaders (HubSpot, Zendesk, Intercom, Notion, Confluence), UX research publications (Baymard Institute, Nielsen Norman Group, UX Planet, UX Collective), W3C accessibility guidelines (WCAG 2.1, WAI-ARIA), and current best practices in knowledge base design.*
