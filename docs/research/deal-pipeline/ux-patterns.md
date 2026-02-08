# Deal Pipeline Kanban Board - UX Patterns

> **Date**: 2026-02-08
> **Role**: UX Analyst
> **Feature**: Deal Pipeline Kanban Board
> **Design System Reference**: `docs/DESIGN_SYSTEM.md`
> **Schema Reference**: `prisma/schema.prisma` (Deal, Pipeline, PipelineStage)

---

## Research Sources

| Source | Key Insight |
|--------|-------------|
| HubSpot Knowledge Base - Board View | Customizable board cards, pipeline stage amounts, drag-to-move deals between stages |
| NN/g - Drag and Drop | Clear signifiers and feedback at all stages make DnD discoverable and easy to use |
| Pencil & Paper - DnD UX Patterns | Always provide a non-drag alternative; DnD is a "power user" interaction |
| WCAG 2.5.7 - Dragging Movements | Must provide single-pointer alternatives: context menus, move buttons, keyboard shortcuts |
| Marmelab - Kanban with React | `@hello-pangea/dnd` recommended for accessible, smooth drag interactions in React |
| Syncfusion Kanban Accessibility | ARIA roles: aria-label, aria-expanded, aria-selected, aria-grabbed for full AT support |
| LogRocket - DnD UI Design | Onboarding tooltip for discoverability; provide menu alternative on mobile |
| Pipedrive CRM | Compact deal cards with name, amount, contact, close date; drag-to-reorder within columns |
| React Aria - DnD | Keyboard + screen reader parity with mouse/touch; explicit drag affordance element |

---

## 1. Kanban Board Layout

### 1.1 Overall Structure

```
Full Width (100% of content area, no max-width constraint)
┌──────────────────────────────────────────────────────────────────────┐
│ PIPELINE HEADER (sticky top, z-20)                                   │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Deals Pipeline  [Pipeline ▼] [Board|List] [Filter] [+ Add deal] │ │
│ │ ───────────────────────────────────────────────────────────────  │ │
│ │ Total: $300,000 across 8 deals  ·  Weighted: $187,500           │ │
│ └──────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│ BOARD BODY (horizontal scroll container)                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ QUALIFIED  │ │ PROPOSAL   │ │ NEGOTIATION│ │ CLOSED WON │        │
│ │ 3 · $45K   │ │ 2 · $120K  │ │ 1 · $50K   │ │ 2 · $85K   │        │
│ │ ───────────│ │ ───────────│ │ ───────────│ │ ───────────│        │
│ │ [Card]     │ │ [Card]     │ │ [Card]     │ │ [Card]     │        │
│ │ [Card]     │ │ [Card]     │ │            │ │ [Card]     │        │
│ │ [Card]     │ │            │ │            │ │            │        │
│ │            │ │            │ │            │ │            │        │
│ │ + Add deal │ │ + Add deal │ │ + Add deal │ │ + Add deal │        │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Dimension Specifications

| Element | Dimension | Tailwind |
|---------|-----------|----------|
| Board container | Full width, calc(100vh - header - pipeline-header) height | `w-full h-[calc(100vh-theme(spacing.32))]` |
| Column width | 280px fixed | `w-[280px] min-w-[280px]` |
| Column gap | 12px | `gap-3` |
| Column internal padding | 8px | `p-2` |
| Board horizontal padding | 16px left/right | `px-4` |
| Pipeline header height | 96px (2 rows) | `h-24` |

### 1.3 Scrolling Behavior

- **Horizontal**: The board body scrolls horizontally when columns exceed viewport width.
  - Use `overflow-x-auto` with `scroll-snap-type: x proximity` for desktop.
  - Show subtle horizontal scrollbar (custom styled, thin, rounded).
  - On hover over board edges, auto-scroll horizontally (optional enhancement).
- **Vertical**: Each column body scrolls independently.
  - Use `overflow-y-auto` on the column card container.
  - Column header and footer remain sticky within the column.

---

## 2. Deal Card Design

### 2.1 Compact Card Layout

```
┌──────────────────────────────────┐
│ [●] Enterprise License Renewal   │  <- priority dot + deal name
│ TechCorp Inc.                    │  <- primary company
│                                  │
│ $50,000          Dec 15, 2026    │  <- amount + close date
│ [John D. ○]        [Overdue!]   │  <- owner avatar + overdue badge
└──────────────────────────────────┘
```

### 2.2 Card Fields (in display order)

| Field | Source | Display | Typography |
|-------|--------|---------|------------|
| Priority indicator | `deal.priority` | Colored dot (left of name) | -- |
| Deal name | `deal.name` | Truncated to 1 line, ellipsis | `text-sm font-semibold text-gray-900` |
| Company name | `deal.companies[0].name` (primary) | Truncated to 1 line | `text-xs text-gray-500` |
| Amount | `deal.amount` | Formatted currency (e.g., $50,000) | `text-sm font-semibold text-gray-900` |
| Close date | `deal.closeDate` | Formatted date (e.g., Dec 15) | `text-xs text-gray-500` |
| Owner | `deal.owner` | Small avatar (20px) + initials | -- |
| Overdue indicator | Computed from `closeDate < today` | Red badge "Overdue" | `text-xs font-medium text-red-600 bg-red-50` |

### 2.3 Priority Dot Colors

| Priority | Color | Tailwind |
|----------|-------|----------|
| High | Red | `bg-red-500` |
| Medium | Yellow | `bg-amber-400` |
| Low | Blue | `bg-blue-400` |
| None | Gray | `bg-gray-300` |

### 2.4 Card Dimensions

| Property | Value | Tailwind |
|----------|-------|----------|
| Width | 100% of column (minus padding) | `w-full` |
| Min height | 88px | `min-h-[88px]` |
| Padding | 12px | `p-3` |
| Border radius | 8px | `rounded-lg` |
| Background | White | `bg-white` |
| Border | 1px solid gray-200 | `border border-gray-200` |
| Margin bottom | 8px | `mb-2` |
| Shadow | subtle | `shadow-sm` |

### 2.5 Card States

| State | Visual Treatment |
|-------|-----------------|
| **Default** | `bg-white border-gray-200 shadow-sm` |
| **Hover** | `bg-white border-gray-300 shadow-md` with smooth transition |
| **Focus** | `ring-2 ring-cyan-500 ring-offset-1` (keyboard focus) |
| **Dragging** | `opacity-90 shadow-xl rotate-[2deg] scale-[1.02]` (slight tilt for physicality) |
| **Drag ghost** | Semi-transparent clone follows cursor: `opacity-50` |
| **Selected** | `border-cyan-500 bg-cyan-50/30` |
| **Overdue** | Left border accent: `border-l-4 border-l-red-400` |

### 2.6 Card Interaction

- **Click**: Opens deal detail slide-in panel (right side).
- **Hover**: Shows subtle shadow increase; cursor changes to `grab`.
- **Right-click / Three-dot menu**: Context menu with: View, Edit, Move to Stage, Delete.
- **Drag**: Initiates drag-and-drop. See Section 4.

---

## 3. Stage Column Design

### 3.1 Column Structure

```
┌─────────────────────────────────────┐
│ COLUMN HEADER (sticky top)          │
│ ┌─────────────────────────────────┐ │
│ │ [●] Qualified  (3)    [$45,000] │ │
│ │ ─── 20% probability ────────── │ │
│ └─────────────────────────────────┘ │
│                                     │
│ COLUMN BODY (scrollable)            │
│ ┌─────────────────────────────────┐ │
│ │ [Deal Card 1]                   │ │
│ │ [Deal Card 2]                   │ │
│ │ [Deal Card 3]                   │ │
│ │                                 │ │
│ │    (scrollable area)            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ COLUMN FOOTER (sticky bottom)       │
│ ┌─────────────────────────────────┐ │
│ │ [+ Add deal]                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3.2 Column Header

| Element | Description | Style |
|---------|-------------|-------|
| Stage color dot | From `PipelineStage.color` | `w-2.5 h-2.5 rounded-full` |
| Stage name | `PipelineStage.name` | `text-sm font-semibold text-gray-700 uppercase tracking-wide` |
| Deal count | Number of deals in stage | `text-xs font-medium text-gray-400 ml-1` in parentheses |
| Total amount | Sum of deal amounts in stage | `text-xs font-semibold text-gray-600` right-aligned |
| Probability | `PipelineStage.probability` | `text-xs text-gray-400` second row |
| Header background | Subtle tint | `bg-gray-50` |
| Header padding | 12px horizontal, 10px vertical | `px-3 py-2.5` |
| Header border | Bottom border | `border-b border-gray-200` |

### 3.3 Column Body

| Property | Value |
|----------|-------|
| Background | `bg-gray-50/50` (very subtle to differentiate from cards) |
| Min height | `min-h-[200px]` (prevents columns from collapsing) |
| Padding | `p-2` |
| Scroll | `overflow-y-auto` with custom thin scrollbar |
| Max height | `calc(100vh - header - pipeline-header - column-header - column-footer)` |

### 3.4 Column Footer

| Element | Description | Style |
|---------|-------------|-------|
| Add deal button | Text button with plus icon | `text-sm text-gray-400 hover:text-cyan-600 font-medium` |
| Padding | 8px | `p-2` |
| Border | Top border | `border-t border-gray-100` |
| Behavior | Click opens deal creation form pre-filled with this stage | -- |

### 3.5 Empty Column State

When a stage has zero deals:

```
┌─────────────────────────────────────┐
│ [●] Decision Maker  (0)      [$0]  │
│ ─── 60% probability ──────────────  │
├─────────────────────────────────────┤
│                                     │
│         No deals in this stage      │
│                                     │
│      Drag a deal here or click      │
│          "+ Add deal" below         │
│                                     │
├─────────────────────────────────────┤
│ [+ Add deal]                        │
└─────────────────────────────────────┘
```

- Empty text: `text-sm text-gray-400 text-center`
- Icon above text: Inbox or Layers icon, `w-8 h-8 text-gray-300`
- The column must still accept drops (highlighted on drag-over).

### 3.6 Closed/Won Columns

Stages where `isClosed: true` or `isWon: true` have special treatment:

| Stage Type | Visual Difference |
|------------|------------------|
| Closed Won | Header has green accent: `border-t-2 border-t-green-500` |
| Closed Lost | Header has red accent: `border-t-2 border-t-red-400` |
| Open stages | Standard `border-t-2` using `PipelineStage.color` |

---

## 4. Drag & Drop UX

### 4.1 Interaction Flow

```
START                    DRAG                     DROP
┌──────┐              ┌──────┐               ┌──────┐
│ User │ mousedown/   │ Card │  drag over     │ Card │
│ grabs│ touchstart   │ moves│  columns       │ lands│
│ card │ ──────────►  │ with │ ──────────►    │ in   │
│      │              │cursor│                │ new  │
│      │              │      │                │column│
└──────┘              └──────┘               └──────┘
   │                     │                      │
   ▼                     ▼                      ▼
 Card lifts          Drop zones             Stage updated
 with tilt          highlighted              API call
 effect             Column glows             Optimistic UI
```

### 4.2 Drag States

| Phase | Visual Feedback |
|-------|----------------|
| **Grab** | Cursor changes to `grabbing`. Card lifts with `shadow-xl`, slight `rotate-[2deg]` and `scale-[1.02]`. |
| **Drag** | A semi-transparent ghost (`opacity-50`) remains in the original position. The dragged card follows the cursor. Other cards animate to make room (`transition-transform duration-200`). |
| **Drag over valid target** | Target column gets a subtle blue highlight: `bg-cyan-50/40 border-2 border-dashed border-cyan-300`. The placeholder space appears where the card would land. |
| **Drag over invalid target** | No highlight change. Cursor shows `not-allowed` (if applicable). |
| **Drop** | Card animates into position (`transition-all duration-300 ease-out`). Column header updates (count + amount recalculated). |
| **Cancel** (Escape / drop outside) | Card animates back to original position. No state change. |

### 4.3 Drop Confirmation

For stage changes that have significant business impact, show an inline confirmation:

- **Regular stage moves** (e.g., Qualified -> Proposal): No confirmation needed. Update optimistically.
- **Moving to Closed Won**: Show a small popover near the card after drop:
  ```
  ┌────────────────────────────────┐
  │ Mark as Closed Won?            │
  │ This will set the deal as won. │
  │                                │
  │ Won amount: $50,000            │
  │ Close date: [Today ▼]          │
  │                                │
  │      [Cancel]  [Confirm Won]   │
  └────────────────────────────────┘
  ```
- **Moving to Closed Lost**: Similar popover asking for `closedReason`:
  ```
  ┌────────────────────────────────┐
  │ Mark as Closed Lost?           │
  │                                │
  │ Reason: [Select reason ▼]     │
  │  ○ Budget constraints          │
  │  ○ Went with competitor        │
  │  ○ No decision / timing        │
  │  ○ Other                       │
  │                                │
  │      [Cancel]  [Confirm Lost]  │
  └────────────────────────────────┘
  ```

### 4.4 Keyboard Accessibility (WCAG 2.5.7 Compliance)

Every drag-and-drop interaction MUST have a keyboard-accessible alternative:

| Interaction | Keyboard Alternative |
|-------------|---------------------|
| Drag card to new stage | Focus card -> press Enter or Space -> context menu shows "Move to..." -> select stage |
| Reorder within stage | Focus card -> press Enter or Space -> Arrow Up/Down -> Enter to confirm |
| Open card detail | Focus card -> press Enter |

**Implementation requirements:**
1. Each deal card has `tabIndex={0}` and `role="button"`.
2. Card has an explicit drag handle with `aria-label="Drag to reorder"`.
3. A "Move to..." option in the card's context menu (three-dot button) serves as the single-pointer alternative.
4. Screen reader announcements via `aria-live="assertive"` region:
   - On grab: "Grabbed [Deal Name]. Current position: stage [Stage Name], position [N] of [Total]."
   - On move: "Moved to stage [Stage Name], position [N] of [Total]."
   - On drop: "[Deal Name] dropped in [Stage Name] at position [N]."
   - On cancel: "Movement cancelled. [Deal Name] returned to [Original Stage]."

### 4.5 Touch / Mobile Support

- **Long press** (300ms) initiates drag on touch devices.
- During drag on mobile, a slight haptic vibration (if available via `navigator.vibrate(10)`) confirms grab.
- Drop zones are enlarged on mobile (column takes full width; see Section 7).
- Provide "Move to..." in the card action menu as primary mobile interaction.

### 4.6 Recommended Library

**Primary**: `@hello-pangea/dnd` (successor to `react-beautiful-dnd`)
- Built-in keyboard and screen reader support.
- Smooth animations out of the box.
- Well-tested for kanban use cases.
- Provides `DragDropContext`, `Droppable`, and `Draggable` primitives.

**Alternative**: `@dnd-kit/core` + `@dnd-kit/sortable`
- More flexible, handles complex nested scenarios.
- Requires more manual accessibility wiring.
- Better performance for very large lists (100+ cards per column).

---

## 5. Deal Form (Slide-in Panel)

### 5.1 Panel Layout

```
┌────────────────────────────────────────────┐
│ ┌────────────────────────────────────────┐ │
│ │ [X]        Create Deal                 │ │ <- Header (sticky)
│ ├────────────────────────────────────────┤ │
│ │                                        │ │
│ │ SECTION 1: Deal Information            │ │ <- Scrollable body
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Deal Name *                        │ │ │
│ │ │ [                               ]  │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Pipeline *                         │ │ │
│ │ │ [Sales Pipeline           ▼]       │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Stage *                            │ │ │
│ │ │ [Qualified               ▼]       │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │                                        │ │
│ │ SECTION 2: Deal Details                │ │
│ │ ┌───────────────┐ ┌────────────────┐  │ │
│ │ │ Amount        │ │ Currency       │  │ │
│ │ │ [$         ]  │ │ [USD ▼]        │  │ │
│ │ └───────────────┘ └────────────────┘  │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Close Date                         │ │ │
│ │ │ [Select date           📅]         │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Deal Type                          │ │ │
│ │ │ [New Business          ▼]          │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Priority                           │ │ │
│ │ │ ○ Low  ○ Medium  ○ High           │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │                                        │ │
│ │ SECTION 3: Associations                │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Contact                            │ │ │
│ │ │ [Search contacts...         🔍]    │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Company                            │ │ │
│ │ │ [Search companies...        🔍]    │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │                                        │ │
│ │ SECTION 4: Additional Info             │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Owner                              │ │ │
│ │ │ [Select owner            ▼]        │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────┐ │ │
│ │ │ Description                        │ │ │
│ │ │ [                               ]  │ │ │
│ │ │ [                               ]  │ │ │
│ │ └────────────────────────────────────┘ │ │
│ │                                        │ │
│ ├────────────────────────────────────────┤ │
│ │        [Cancel]  [Create Deal]         │ │ <- Footer (sticky)
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

### 5.2 Panel Dimensions

| Property | Value | Tailwind |
|----------|-------|----------|
| Width | 512px | `w-[512px]` |
| Position | Fixed right, full height | `fixed right-0 top-0 h-full` |
| Z-index | 50 (Modal level) | `z-50` |
| Background | White | `bg-white` |
| Shadow | Large left shadow | `shadow-2xl` |
| Overlay | Semi-transparent backdrop | `bg-black/30` on overlay div |
| Animation | Slide in from right | `translate-x-full -> translate-x-0`, `transition-transform duration-300` |

### 5.3 Form Fields

#### Section 1: Deal Information (Required)

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Deal Name | text | **Yes** | Min 1 char, max 255 | -- |
| Pipeline | select | **Yes** | Must select pipeline | Default pipeline (`isDefault: true`) |
| Stage | select | **Yes** | Must select stage | First stage of selected pipeline |

**Note**: When pipeline changes, stage dropdown reloads with that pipeline's stages and auto-selects the first one.

#### Section 2: Deal Details

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Amount | currency input | No | Positive number, 2 decimal places max | -- |
| Currency | select | No | ISO 4217 codes | "USD" |
| Close Date | date picker | No | Must be today or future for new deals | -- |
| Deal Type | select | No | "New Business" or "Existing Business" | "New Business" |
| Priority | radio group | No | Low, Medium, High | "Medium" |

**Currency input behavior**:
- Shows currency symbol prefix (e.g., "$").
- Format on blur: 50000 -> $50,000.00.
- Accept numeric input only; strip commas on parse.

#### Section 3: Associations

| Field | Type | Required | Behavior |
|-------|------|----------|----------|
| Contact | search-autocomplete | No | Search by name/email, shows avatar + name + email in dropdown. Multiple selection allowed. Creates `DealContact` records. |
| Company | search-autocomplete | No | Search by name/domain, shows name + domain in dropdown. Multiple selection allowed. Creates `DealCompany` records. First company auto-set as `isPrimary: true`. |

#### Section 4: Additional Info

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Owner | select (users) | No | Current logged-in user |
| Description | textarea | No | -- |

### 5.4 Form Validation Rules

```
Zod Schema:
{
  name: z.string().min(1, "Deal name is required").max(255),
  pipelineId: z.string().uuid("Select a pipeline"),
  stageId: z.string().uuid("Select a stage"),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  closeDate: z.date().optional(),
  dealType: z.enum(["newbusiness", "existingbusiness"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  ownerId: z.string().uuid().optional(),
  description: z.string().max(5000).optional(),
  contactIds: z.array(z.string().uuid()).optional(),
  companyIds: z.array(z.string().uuid()).optional(),
}
```

### 5.5 Submit Behavior

- **Endpoint**: `POST /api/deals` (create) or `PUT /api/deals/[id]` (edit).
- **On success**: Close panel, optimistically add card to correct stage column, show success toast: "Deal created successfully".
- **On error**: Show inline error messages per field. Top-level error banner if server error.
- **Loading state**: Submit button shows spinner + "Creating..." text, form inputs disabled.
- **Pre-fill on stage click**: If opened via column footer "+ Add deal", pre-select that column's pipeline and stage.

---

## 6. Pipeline Header

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Row 1: Title + Actions                                               │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ [Deals]  [Sales Pipeline ▼]    [🔍] [Filter ▼] [Board|List] [+ Add deal] │
│ └────────────────────────────────────────────────────────────────┘   │
│ Row 2: Summary Bar                                                   │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ 8 deals · $300,000 total · $187,500 weighted pipeline                │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Component Specifications

#### Pipeline Selector

| Property | Spec |
|----------|------|
| Type | Dropdown select |
| Data | `Pipeline[]` where `isActive: true` for current tenant |
| Display | Pipeline name |
| Default | Pipeline where `isDefault: true` |
| Behavior | On change, reload board with selected pipeline's stages and deals |
| Style | `text-lg font-semibold text-gray-900` with dropdown chevron |

#### View Toggle (Board / List)

| Property | Spec |
|----------|------|
| Type | Segmented control (two buttons) |
| Options | Board (grid icon), List (list icon) |
| Default | Board |
| Style | `border border-gray-200 rounded-lg` with active state `bg-gray-100 text-gray-900` |
| Icons | `LayoutGrid` (Board), `List` (List) from Lucide |
| Behavior | Board shows kanban; List shows table view (future feature, can be disabled initially) |

#### Search

| Property | Spec |
|----------|------|
| Type | Expandable search input |
| Behavior | Click magnifying glass icon to expand input. Type to filter deals across all stages by name, company, or contact. |
| Style | `w-8 h-8` icon button, expands to `w-64` input field |
| Debounce | 300ms debounce on input |

#### Filters Dropdown

| Filter | Type | Options |
|--------|------|---------|
| Owner | Multi-select | Team members (Users list) |
| Amount range | Dual range slider or min/max inputs | Custom range |
| Close date | Date range picker | This week, This month, This quarter, Custom |
| Priority | Multi-select checkboxes | High, Medium, Low |
| Deal type | Select | New Business, Existing Business |

**Filter display**: Active filters show as removable chips/badges below the header bar:
```
[Owner: John D. ×] [Amount: $10K - $50K ×] [Close: This month ×]  [Clear all]
```

#### Add Deal Button

| Property | Spec |
|----------|------|
| Type | Primary button |
| Label | "+ Add deal" |
| Style | F-CORE primary button: `bg-[#0891b2] text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-[#0ea5e9]` |
| Behavior | Opens Deal Form slide-in panel (Section 5) |

#### Summary Bar

| Metric | Calculation | Format |
|--------|-------------|--------|
| Deal count | Total deals in current pipeline (excluding deleted) | "8 deals" |
| Total value | Sum of all `deal.amount` in pipeline | "$300,000 total" |
| Weighted value | Sum of (`deal.amount` * `stage.probability` / 100) for all deals | "$187,500 weighted" |

- Style: `text-sm text-gray-500`
- Separator: ` · ` (middle dot)

---

## 7. Responsive Behavior

### 7.1 Breakpoint Strategy

| Breakpoint | Layout | Column Display |
|------------|--------|----------------|
| **Desktop** (>=1280px) | Full kanban board, horizontal scroll | All columns visible, scroll if >4-5 columns |
| **Laptop** (>=1024px) | Full kanban board, horizontal scroll | 3-4 columns visible |
| **Tablet** (>=768px) | Condensed board or 2-3 columns visible | Horizontal scroll with scroll-snap |
| **Mobile** (<768px) | Single column with stage tabs | One stage visible at a time |

### 7.2 Desktop (>=1280px)

- All columns rendered side by side.
- Horizontal scroll if columns exceed viewport.
- Pipeline header spans full width.
- Filters in a horizontal bar.

### 7.3 Tablet (768px - 1279px)

- Columns are 260px wide (slightly narrower).
- 2-3 columns visible; horizontal scroll for the rest.
- Pipeline header condenses: summary bar moves to a tooltip or collapses.
- Filters collapse into a single "Filters" dropdown button.

### 7.4 Mobile (<768px)

Replace the kanban board with a **tabbed column view**:

```
┌──────────────────────────────────┐
│ Deals Pipeline   [+ Add] [⋯]    │
├──────────────────────────────────┤
│ [Qualified] [Proposal] [Nego.] ▶│  <- Horizontal scrollable tabs
├──────────────────────────────────┤
│ Qualified (3) · $45,000          │  <- Active tab header
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Deal Card 1                  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Deal Card 2                  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Deal Card 3                  │ │
│ └──────────────────────────────┘ │
│                                  │
│ [+ Add deal to Qualified]        │
└──────────────────────────────────┘
```

- Tabs: horizontal scrollable bar with stage names.
- Active tab shows a count badge and underline indicator.
- Stage tab style: `text-sm font-medium` with active `border-b-2 border-cyan-600 text-cyan-700`.
- Cards are full-width, stacked vertically.
- Drag-and-drop is replaced by "Move to..." context menu action (WCAG 2.5.7 compliant).
- Swipe left/right to switch between stages (optional progressive enhancement).

### 7.5 Deal Form Responsive

| Breakpoint | Panel Width |
|------------|-------------|
| Desktop | 512px fixed right |
| Tablet | 420px fixed right |
| Mobile | Full screen overlay (100vw, 100vh) |

On mobile, the form becomes a full-screen modal with a back arrow in the header.

---

## 8. States

### 8.1 Loading State

**Skeleton board** (initial load):

```
┌──────────────────────────────────────────────────────────────────┐
│ [████████]   [████████ ▼]          [████] [████] [████████████] │
│ [████████████████████████████████████████████████]                │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│ [█████████]  │ [█████████]  │ [█████████]  │ [█████████]         │
│ [██ · ████]  │ [██ · ████]  │ [██ · ████]  │ [██ · ████]         │
│ ───────────  │ ───────────  │ ───────────  │ ───────────         │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐       │
│ │ ████████ │ │ │ ████████ │ │ │          │ │ │ ████████ │       │
│ │ ██████   │ │ │ ██████   │ │ │          │ │ │ ██████   │       │
│ │ ████ ██  │ │ │ ████ ██  │ │ │          │ │ │ ████ ██  │       │
│ └──────────┘ │ └──────────┘ │ │          │ │ └──────────┘       │
│ ┌──────────┐ │              │ │          │ │                     │
│ │ ████████ │ │              │ │          │ │                     │
│ │ ██████   │ │              │ │          │ │                     │
│ └──────────┘ │              │ │          │ │                     │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
```

- Skeleton columns: 4 columns with `animate-pulse` placeholder cards.
- Column headers: skeleton bars for name and amount.
- Card skeletons: 3 rows of varying-width bars simulating name, company, and amount.
- Use consistent heights with actual cards to prevent layout shift.

### 8.2 Empty Pipeline State

When a pipeline has zero deals across all stages:

```
┌──────────────────────────────────────────────────────────────────┐
│ Pipeline header (normal)                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    [  Illustration  ]                             │
│                  (abstract pipeline icon)                         │
│                                                                  │
│              Your pipeline is empty                              │
│                                                                  │
│     Start by creating your first deal to track                   │
│     your sales opportunities.                                    │
│                                                                  │
│               [+ Create your first deal]                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Illustration: `Layers` or `Target` icon from Lucide, `w-16 h-16 text-gray-300`.
- Heading: `text-xl font-semibold text-gray-700`.
- Description: `text-sm text-gray-500 max-w-md mx-auto text-center`.
- CTA: F-CORE primary button.

### 8.3 Empty Stage State

Covered in Section 3.5 above. Key elements:
- Subtle text: "No deals in this stage"
- Sub-text: "Drag a deal here or click + Add deal below"
- Still renders as a valid drop zone with dashed border on drag-over.

### 8.4 Error State

**API error loading pipeline/deals**:

```
┌──────────────────────────────────────────────────────────────────┐
│ Pipeline header (normal)                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐       │
│  │ [!] Failed to load deals. Please try again.           │       │
│  │                                     [Retry]           │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Error banner: `bg-red-50 border border-red-200 rounded-lg p-4`
- Icon: `AlertCircle` from Lucide, `text-red-500`
- Text: `text-sm text-red-700`
- Retry button: `text-sm font-medium text-red-700 hover:text-red-800 underline`

**Drag-and-drop update error (optimistic rollback)**:

- If the API call to update deal stage fails after an optimistic move:
  1. Revert the card to its original column (animate back).
  2. Show toast notification: "Failed to move deal. Please try again." with error styling.
  3. Toast: `bg-red-50 border-red-200 text-red-700`, auto-dismiss after 5 seconds.

### 8.5 Drag-Over State (on column)

When a deal card is being dragged over a column:

| Visual Element | Style |
|----------------|-------|
| Column background | `bg-cyan-50/30` transition |
| Column border | `border-2 border-dashed border-cyan-300` |
| Placeholder slot | A faded outline where the card would land: `border-2 border-dashed border-gray-300 rounded-lg h-[88px] bg-gray-50` |

---

## 9. Micro-Interactions & Animations

### 9.1 Card Animations

| Animation | Trigger | CSS/Spec |
|-----------|---------|----------|
| Card appear | New deal created | `animate-in slide-in-from-top-2 fade-in duration-300` |
| Card remove | Deal deleted | `animate-out fade-out-50 slide-out-to-right-2 duration-200` |
| Card reorder | Drag within column | `transition-transform duration-200 ease-out` |
| Card move between columns | Drop in new column | `transition-all duration-300 ease-out` |
| Card hover lift | Mouse enter | `shadow-sm -> shadow-md, translateY(-1px), duration-150` |

### 9.2 Column Animations

| Animation | Trigger | CSS/Spec |
|-----------|---------|----------|
| Header counter update | Deal added/removed | Number transition with brief `scale-110` pulse |
| Amount update | Deal moved/amount changed | Smooth number interpolation |
| Drag-over highlight | Card enters column | `transition-colors duration-150` |

### 9.3 Panel Animations

| Animation | Trigger | CSS/Spec |
|-----------|---------|----------|
| Panel open | Click "+ Add deal" | `translate-x-full -> translate-x-0, duration-300, ease-out` |
| Panel close | Click close/cancel/submit | `translate-x-0 -> translate-x-full, duration-200, ease-in` |
| Overlay appear | Panel opens | `opacity-0 -> opacity-100, duration-200` |
| Overlay disappear | Panel closes | `opacity-100 -> opacity-0, duration-150` |

---

## 10. Data Flow & API Integration

### 10.1 API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pipelines` | GET | List pipelines for current tenant |
| `/api/pipelines/[id]` | GET | Get pipeline with stages |
| `/api/pipelines/[id]/deals` | GET | Get all deals in pipeline, grouped by stage |
| `/api/deals` | POST | Create new deal |
| `/api/deals/[id]` | GET | Get deal detail |
| `/api/deals/[id]` | PUT | Update deal (including stage changes) |
| `/api/deals/[id]` | DELETE | Soft-delete deal |
| `/api/deals/[id]/stage` | PATCH | Quick stage update (optimized for drag-and-drop) |

### 10.2 Stage Move API (Optimistic Update Pattern)

```
1. User drops card in new column
2. CLIENT: Immediately update local state (optimistic)
3. CLIENT: PATCH /api/deals/[id]/stage { stageId, orderIndex }
4. SERVER: Validate, update deal.stageId, set deal.probability = stage.probability
5. SERVER: Return updated deal
6. CLIENT (success): Confirm local state matches
7. CLIENT (error): Rollback to previous state, show error toast
```

### 10.3 Query Parameters for Pipeline Deals

```
GET /api/pipelines/[id]/deals?
  ownerId=uuid            // Filter by owner
  minAmount=10000         // Min deal amount
  maxAmount=50000         // Max deal amount
  closeDateStart=2026-01-01  // Close date range start
  closeDateEnd=2026-03-31    // Close date range end
  priority=high,medium    // Priority filter (comma-separated)
  dealType=newbusiness    // Deal type filter
  search=enterprise       // Search term (name, company, contact)
  sortBy=amount           // Sort within stages: amount, closeDate, createdAt
  sortOrder=desc          // asc or desc
```

All endpoints enforce `WHERE tenant_id = ?` and `WHERE deleted_at IS NULL`.

---

## 11. Accessibility Checklist

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | Tab through cards, Enter to open, Arrow keys within context menus |
| Drag alternative | "Move to..." in context menu; stage selector in card detail |
| Screen reader | `aria-label` on all interactive elements; live region for drag announcements |
| Focus management | Focus returns to trigger element when panel closes; focus trapped in modal/panel |
| Color contrast | All text meets 4.5:1 ratio (AA); priority dots have text labels for screen readers |
| Focus visible | `ring-2 ring-cyan-500 ring-offset-1` on all focusable elements |
| ARIA roles | `role="listbox"` on columns, `role="option"` on cards, `aria-grabbed` on draggable |
| Mobile touch targets | All interactive elements minimum 44x44px tap area |
| Reduced motion | Respect `prefers-reduced-motion: reduce` -- disable drag animation, use instant transitions |

---

## 12. Component Hierarchy

```
<DealsPage>
  <PipelineHeader>
    <PipelineSelector />
    <ViewToggle />
    <SearchInput />
    <FilterDropdown />
    <AddDealButton />
    <SummaryBar />
    <ActiveFilters />
  </PipelineHeader>

  <KanbanBoard>                           -- DragDropContext
    <StageColumn stage={stage}>            -- Droppable
      <ColumnHeader />
      <ColumnBody>
        <DealCard deal={deal} />           -- Draggable
        <DealCard deal={deal} />
        <DropPlaceholder />
      </ColumnBody>
      <ColumnFooter />
    </StageColumn>
    ...
  </KanbanBoard>

  <DealFormPanel>                          -- Slide-in panel
    <DealForm />
  </DealFormPanel>

  <DealDetailPanel>                        -- Slide-in panel (view/edit)
    <DealDetail />
  </DealDetailPanel>

  <StageChangeConfirmation />              -- Popover for Closed Won/Lost
  <ToastNotifications />
</DealsPage>
```

---

## 13. Design Tokens Summary (F-CORE Specific)

All design tokens reference `docs/DESIGN_SYSTEM.md`.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0891b2` / `cyan-600` | Add deal button, active tab, focus ring |
| Primary Hover | `#0ea5e9` / `sky-500` | Button hover, link hover |
| Primary Light | `#ecfeff` / `cyan-50` | Drag-over highlight, selected card |
| Success | `#00bda5` / `teal-500` | Closed Won stage accent |
| Error | `#ef4444` / `red-500` | Closed Lost accent, overdue badge, error states |
| Warning | `#f5c26b` / `amber-400` | Medium priority dot |
| Text Primary | `#111827` / `gray-900` | Deal name, headings |
| Text Secondary | `#4b5563` / `gray-600` | Company name, descriptions |
| Text Muted | `#9ca3af` / `gray-400` | Placeholder, empty state text |
| Border | `#e5e7eb` / `gray-200` | Card borders, column separators |
| Background | `#f9fafb` / `gray-50` | Column body background |
| Card Background | `#ffffff` / `white` | Deal cards |
| Font | Inter | All text |
| Card Radius | `rounded-lg` (8px) | Deal cards |
| Panel Radius | `rounded-l-xl` (12px) | Slide-in panel left corners |

---

*This document serves as the single source of truth for the Deal Pipeline Kanban Board UX. All implementation should reference these patterns to ensure consistency with the F-CORE design system.*
