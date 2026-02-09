# Form Builder - UX Patterns Research

> Date: 2026-02-09
> Feature: Form Builder (Marketing Hub)
> Sources: HubSpot, Typeform, JotForm, SurveyJS, Feathery, Cognito Forms, Designlab, QuestionScout

---

## 1. Builder Interface Layout

### Three-Panel Layout (Industry Standard)
All major form builders use a three-panel layout:

| Panel | Position | Content |
|-------|----------|---------|
| **Field Palette** | Left sidebar | Draggable field type icons/cards |
| **Builder Canvas** | Center (main area) | Drop zone with live field arrangement |
| **Properties Panel** | Right sidebar | Selected field configuration |

**HubSpot Layout:**
- Left: Field types grouped by category (Common, Contact Info, Company, Custom)
- Center: Canvas with drag handles on each field, click to select
- Right: Field properties (label, placeholder, required, help text, conditional logic)
- Top: Form name, undo/redo, preview button, publish button

**Key UX Principles:**
- Single-click to select a field (opens properties on right)
- Double-click to edit field label inline
- Drag handle appears on hover (left edge of field)
- Blue border/highlight on selected field
- Dashed border for drop zone indicator

### Responsive Builder Considerations
- On tablet: collapse left sidebar to icon-only mode, properties as bottom sheet
- On mobile: show simplified list view instead of builder (view-only)
- Builder is primarily a desktop experience (1024px+ screens)

---

## 2. Drag-and-Drop Interaction Patterns

### Palette to Canvas (Add New Field)
1. User drags a field type from the palette
2. Canvas shows a drop indicator (blue dashed line between existing fields)
3. Field "snaps" into position on drop
4. New field appears with default configuration
5. Properties panel auto-opens for the new field

### Canvas Reordering (Sort Fields)
1. Hover over a field shows drag handle (6-dot grip icon)
2. Drag begins: field becomes semi-transparent, placeholder shows where it will land
3. Drop indicators appear between other fields
4. On drop: smooth animation to new position

### Keyboard Accessibility
- Tab to navigate between fields
- Arrow keys to reorder selected field
- Enter/Space to open properties
- Delete/Backspace to remove field
- Ctrl+Z / Ctrl+Y for undo/redo

### Visual Feedback
| State | Visual Treatment |
|-------|-----------------|
| Hover (palette item) | Light background highlight, cursor: grab |
| Dragging | Semi-transparent original, "ghost" follows cursor |
| Over drop zone | Blue dashed insertion line, zone highlights |
| Invalid drop | Red border on drop zone |
| Just dropped | Brief pulse animation on new field |
| Selected | Cyan border (#0891b2), properties panel open |

---

## 3. Field Type Categories

### Common Fields (always shown first)
| Type | Icon | Default Label | Notes |
|------|------|---------------|-------|
| Text | `Type` | "Text Field" | Single line, most common |
| Email | `Mail` | "Email" | Built-in email validation |
| Number | `Hash` | "Number" | Min/max, step support |
| Phone | `Phone` | "Phone" | Format masking optional |
| Textarea | `AlignLeft` | "Message" | Multi-line, resizable |
| Dropdown | `ChevronDown` | "Select" | Single select |
| Checkbox | `CheckSquare` | "Checkbox" | Multi-select group |
| Radio | `Circle` | "Radio" | Single choice |
| Date | `Calendar` | "Date" | Date picker |

### Advanced Fields
| Type | Icon | Default Label | Notes |
|------|------|---------------|-------|
| File Upload | `Upload` | "File Upload" | Max size, type restrictions |
| URL | `Link` | "Website" | URL validation |
| Multi-select | `List` | "Multi Select" | Tags/checkboxes style |
| Hidden | `EyeOff` | "Hidden Field" | Pre-filled, not visible |

### Layout Elements (non-input)
| Type | Icon | Notes |
|------|------|-------|
| Heading | `Heading` | H2/H3/H4 text for sections |
| Paragraph | `FileText` | Instructional text |
| Divider | `Minus` | Horizontal line separator |
| Spacer | `Space` | Vertical spacing block |

---

## 4. Field Properties Panel

### Universal Properties (all field types)
| Property | Type | Default | Notes |
|----------|------|---------|-------|
| Label | text input | Field type name | Editable inline or in panel |
| Placeholder | text input | "" | Helper text inside input |
| Help Text | text input | "" | Small text below field |
| Required | toggle | false | Asterisk on label when true |
| Hidden | toggle | false | Field exists but not visible |
| Width | select | "full" | full, half, third |
| CSS Class | text input | "" | Custom styling (advanced) |

### Type-Specific Properties
- **Text:** min/max length, pattern (regex)
- **Number:** min, max, step, decimal places
- **Email:** allow multiple (toggle)
- **Phone:** format, country code
- **Dropdown/Radio:** options list (add/remove/reorder), default value
- **Checkbox:** options list, min/max selections
- **File Upload:** max size (MB), allowed types (e.g., .pdf,.jpg), max files
- **Date:** min/max date, date format
- **Textarea:** rows, max characters, character counter

### Validation Section
- Show as collapsible section in properties
- Visual rule builder: "If [condition] then show [error message]"
- Error message customization per validation rule
- Live preview of validation in canvas

---

## 5. Conditional Logic UX

### When to Show Conditional Logic
- As a collapsible section at bottom of field properties
- Icon indicator (magic wand) on fields that have conditions
- Visual line/connection on canvas between trigger and dependent fields

### Condition Builder UI Pattern
```
Show this field:
  ┌─ When ────────────────────────────────────────┐
  │ [Field Dropdown ▼] [Operator ▼] [Value Input]│
  │ First Name         equals       "John"        │
  │                                                │
  │ [+ Add condition]                              │
  │                                                │
  │ Match: (ALL conditions) ▼                      │
  │         ○ ALL conditions (AND)                 │
  │         ○ ANY condition (OR)                   │
  └────────────────────────────────────────────────┘
```

### Supported Operators
| Operator | Applies To | Label |
|----------|-----------|-------|
| equals | all | "is equal to" |
| not_equals | all | "is not equal to" |
| contains | text | "contains" |
| not_contains | text | "does not contain" |
| starts_with | text | "starts with" |
| ends_with | text | "ends with" |
| greater_than | number, date | "is greater than" |
| less_than | number, date | "is less than" |
| is_empty | all | "is empty" |
| is_not_empty | all | "is not empty" |

### Actions
- **Show/Hide:** Default action - show field when condition met
- **Require:** Make field required when condition met
- **Skip to step:** In multi-step forms, jump to a specific step

### Visual Indicators
- Fields with conditions show a small "lightning bolt" icon
- In canvas, dotted lines connect dependent fields
- Warning if circular dependency detected
- Grayed out fields in preview when condition not met

---

## 6. Multi-Step Forms

### Step Navigation
- Progress bar at top (numbered steps or percentage)
- Step titles editable
- "Next" / "Previous" / "Submit" buttons
- Validation per step before allowing "Next"

### Step Configuration
- Drag fields between steps
- Add/remove steps via toolbar
- Step completion requirements (all required fields filled)
- Optional: conditional step skipping

### UX Best Practices
- Start with easiest questions, progress to harder ones
- Group related fields in same step
- Show step count (e.g., "Step 2 of 4")
- Allow going back without losing data
- Milestone submission: save partial data at key steps

---

## 7. Form Preview & Testing

### Preview Modes
| Mode | Description |
|------|-------------|
| **Desktop** | Full-width preview (default) |
| **Tablet** | 768px container |
| **Mobile** | 375px container |

### Preview Features
- Live data entry (test validation)
- Conditional logic triggers in real-time
- Reset button to clear test data
- Toggle between form view and thank-you page

---

## 8. Form Settings UX

### General Tab
- Form name and description
- Language / locale
- Status (draft / published / archived)

### Submission Tab
- Thank you message (text or redirect URL)
- Notification emails (comma-separated)
- Auto-responder toggle + subject/body
- CAPTCHA toggle (reCAPTCHA v3 / hCaptcha)

### Design Tab
- Theme selector (minimal, branded, card-style)
- Submit button text and color
- Background color
- Font family override
- Custom CSS (advanced, collapsible)

### Embed Tab
- Inline embed code (iframe)
- Popup embed code (JavaScript snippet)
- Direct link (shareable URL)
- QR code for direct link
- Preview of embed appearance

---

## 9. Submission Management UX

### Submissions List
- Table view with columns: Date, Contact name, Email, Key fields
- Filter by date range, spam status
- Search across submission data
- Export to CSV
- Bulk actions (delete, mark as spam)

### Submission Detail
- Key-value display of all submitted fields
- Contact card if linked to CRM contact
- Metadata: submitted at, IP, referrer, UTM params
- Actions: create contact, delete, mark spam

---

## 10. Form Analytics Dashboard

### Key Metrics
| Metric | Visualization | Position |
|--------|---------------|----------|
| Total Views | Large number | Top row |
| Total Submissions | Large number | Top row |
| Conversion Rate | Percentage with trend | Top row |
| Submissions Over Time | Line chart | Main area |

### Secondary Metrics
- Top referrers (where form views come from)
- Average completion time
- Field drop-off rates (which fields cause abandonment)
- Spam vs legitimate submissions ratio

---

## 11. Accessibility Requirements

### WCAG 2.1 AA Compliance
- All form fields must have visible labels (not just placeholders)
- Error messages must be programmatically associated with fields (aria-describedby)
- Focus order must follow visual order
- Color is not the only indicator of state (use icons + color for errors)
- Drag-and-drop must have keyboard alternative
- Form must work with screen readers

### Builder Accessibility
- Palette items navigable via keyboard
- Field reordering via keyboard shortcuts
- Properties panel accessible via tab navigation
- Live region announcements for drag operations

---

## 12. F-CORE Design System Alignment

### Colors
- Primary actions (save, publish): `#0891b2` (cyan-600)
- Hover states: `#0ea5e9` (sky-500)
- Success (published, submitted): `teal-500`
- Error (validation, required): `red-500`
- Warning (unsaved changes): `amber-400`
- Selected field border: `#0891b2` with `ring-2 ring-cyan-100`

### Form Field Styling
```tsx
// Input in builder canvas
className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"

// Selected field wrapper in canvas
className="relative border-2 border-[#0891b2] rounded-lg p-2 bg-white shadow-sm"

// Drag handle
className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab"
```

### Typography
- Form labels: `text-sm font-medium text-gray-900`
- Help text: `text-xs text-gray-400`
- Error messages: `text-xs text-red-500`
- Step titles: `text-xl font-semibold text-gray-900`

---

## Summary of Key UX Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Builder layout | 3-panel (palette, canvas, properties) | Industry standard, proven by HubSpot/JotForm/Typeform |
| DnD interaction | Palette drag + sortable canvas | Most intuitive for non-technical users |
| Conditional logic UI | Rule builder with dropdowns | Simpler than code-based; sufficient for 95% of use cases |
| Field properties | Right sidebar panel | Keeps canvas visible while editing |
| Multi-step | Top progress bar + Next/Prev buttons | Standard pattern, reduces cognitive load |
| Preview | Side-by-side or modal with device toggle | Real-time validation testing |
| Embed | 3 options (inline, popup, link) | Covers all integration scenarios |
| Accessibility | WCAG 2.1 AA | Legal requirement and good UX |
