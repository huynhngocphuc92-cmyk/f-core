# UX Patterns: CRM Property / Custom Fields System

> Research Document for F-CORE
> Date: 2026-02-08
> Status: Complete
> Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4

---

## Table of Contents

1. [Property Editor Sidebar (Record Detail Page)](#1-property-editor-sidebar)
2. [Inline Editing Patterns](#2-inline-editing-patterns)
3. [Property Management Admin UI](#3-property-management-admin-ui)
4. [Property Group Management](#4-property-group-management)
5. [Dynamic Form Generation](#5-dynamic-form-generation)
6. [Empty States for Properties](#6-empty-states-for-properties)
7. [Mobile Responsiveness](#7-mobile-responsiveness)
8. [Accessibility (ARIA Patterns)](#8-accessibility)
9. [Component Interaction Flows](#9-component-interaction-flows)
10. [Implementation Recommendations](#10-implementation-recommendations)

---

## 1. Property Editor Sidebar

### 1.1 Overview

The property editor sidebar is the left-hand panel on a CRM record detail page
(Contact, Company, Deal). It displays grouped property fields that users can
view and edit. HubSpot calls this the "About this [record]" card.

**Key characteristics observed across HubSpot, Salesforce, Freshsales, Zoho:**

- Fixed-width left sidebar (280-340px) on desktop
- Properties organized into collapsible groups
- "About this contact" as the primary group, always expanded
- Inline editing with autosave (HubSpot 2025 update)
- Users can personalize which properties they see
- "View all properties" link at bottom opens full property sheet

### 1.2 Layout Wireframe

```
+------------------------------------------------------------------+
| RECORD DETAIL PAGE                                               |
+------------------------------------------------------------------+
|                                                                  |
| +-- LEFT SIDEBAR (300px) --+  +-- MAIN CONTENT -----------+     |
| |                          |  |                            |     |
| | +-- RECORD HEADER -----+ |  | [Overview] [Activity] ... |     |
| | | Avatar  John Smith    | |  |                            |     |
| | | john@acme.com         | |  | +-- ACTIVITY TIMELINE --+ |     |
| | | [Email] [Call] [Task] | |  | |                        | |     |
| | +----------------------+ |  | | * Email sent 2h ago    | |     |
| |                          |  | | * Call logged 1d ago   | |     |
| | +-- ABOUT THIS CONTACT-+ |  | | * Note added 3d ago   | |     |
| | | [Actions v]            | |  | |                        | |     |
| | |                        | |  | +------------------------+ |     |
| | | Email                  | |  |                            |     |
| | | john@acme.com    [pen] | |  +----------------------------+     |
| | |                        | |                                     |
| | | Phone                  | |  +-- RIGHT SIDEBAR ----------+     |
| | | +1 (555) 123-..  [pen] | |  |                            |     |
| | |                        | |  | +-- COMPANIES -----------+ |     |
| | | Lifecycle Stage        | |  | | Acme Corp              | |     |
| | | [Lead          v]      | |  | +------------------------+ |     |
| | |                        | |  |                            |     |
| | | Lead Status            | |  | +-- DEALS ---------------+ |     |
| | | [Qualified     v]      | |  | | Website Redesign $50K  | |     |
| | |                        | |  | +------------------------+ |     |
| | | Job Title              | |  |                            |     |
| | | --                [pen] | |  +----------------------------+     |
| | |                        | |                                     |
| | | [View all properties]  | |                                     |
| | +----------------------+ |                                       |
| |                          |                                       |
| | v COMMUNICATION (3) ---- |                                       |
| |   (collapsed)            |                                       |
| |                          |                                       |
| | v SOCIAL MEDIA (2) ----- |                                       |
| |   (collapsed)            |                                       |
| |                          |                                       |
| +--------------------------+                                       |
+------------------------------------------------------------------+
```

### 1.3 Property Group Section (Expanded)

```
+-----------------------------------+
| v ABOUT THIS CONTACT       [...]  |  <-- Chevron + group name + actions menu
+-----------------------------------+
|                                   |
|  Email                            |  <-- Label (text-xs, gray-500)
|  john@company.com           [pen] |  <-- Value + edit icon on hover
|  ............................      |  <-- Subtle separator (border-b)
|                                   |
|  Phone                            |
|  +1 (555) 123-4567         [pen] |
|  ............................      |
|                                   |
|  Lifecycle Stage                  |
|  [ Lead                     v ]   |  <-- Dropdown always visible
|  ............................      |
|                                   |
|  Owner                            |
|  [avatar] Sarah J.          [x]   |  <-- User picker with avatar
|  ............................      |
|                                   |
|  Job Title                        |
|  --                         [pen] |  <-- Empty value shown as "--"
|                                   |
+-----------------------------------+
|  [+ View all properties]         |  <-- Link to full property list
+-----------------------------------+
```

### 1.4 Property Group Section (Collapsed)

```
+-----------------------------------+
| > COMMUNICATION INFO         (3)  |  <-- Right chevron + count badge
+-----------------------------------+
```

### 1.5 Design Tokens (F-CORE Mapping)

| Element              | Tailwind Classes                                         |
|----------------------|----------------------------------------------------------|
| Sidebar container    | `w-[300px] border-r border-gray-200 bg-white overflow-y-auto` |
| Group header         | `flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50` |
| Group title          | `text-xs font-semibold text-gray-500 uppercase tracking-wide` |
| Property label       | `text-xs text-gray-500 mb-0.5`                           |
| Property value       | `text-sm text-gray-900`                                  |
| Empty value          | `text-sm text-gray-400 italic` or `text-sm text-gray-400` showing "--" |
| Edit icon            | `w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity` |
| Separator            | `border-b border-gray-100`                               |
| Section padding      | `px-4 py-2`                                              |

---

## 2. Inline Editing Patterns

### 2.1 Pattern Comparison

| Pattern                   | When to Use                           | Pros                        | Cons                      |
|---------------------------|---------------------------------------|-----------------------------|---------------------------|
| **Click-to-edit**         | Text, number, URL, email fields       | Clean read view, low noise  | Requires click to start   |
| **Hover-to-reveal-edit**  | Most field types on record sidebar    | Discoverable, low clutter   | Not discoverable on touch |
| **Always-editable**       | Dropdowns, checkboxes, owner pickers  | Fastest interaction         | Noisier visual            |
| **Pencil-icon toggle**    | High-stakes or complex fields         | Explicit, prevents accidental edits | Extra click          |

### 2.2 Recommended Pattern: Hover-to-Reveal with Autosave

HubSpot migrated to autosave in 2025, removing the explicit "Save" button from
property edits on the record sidebar. This is the recommended pattern for F-CORE.

**Interaction flow:**

```
READ STATE                    HOVER STATE                   EDIT STATE
+---------------------+      +---------------------+       +---------------------+
| Email               |      | Email               |       | Email               |
| john@company.com    |  ->  | john@company.com [P]|  ->   | [john@company.com ] |
|                     |      |         pencil icon  |       |  text input focused |
+---------------------+      +---------------------+       +---------------------+
                                                                     |
                                                            on blur / Enter
                                                                     |
                                                                     v
                                                            +---------------------+
                                                            | Email               |
                                                            | john@company.com [v]|
                                                            |       checkmark     |
                                                            +---------------------+
                                                            (brief success flash,
                                                             then back to READ)
```

### 2.3 Field Type Rendering in Edit Mode

```
TEXT / EMAIL / URL / PHONE
+------------------------------------------+
| Label                                    |
| +--------------------------------------+ |
| | value text here                    | | |  <-- Standard text input
| +--------------------------------------+ |
+------------------------------------------+

TEXTAREA / LONG TEXT
+------------------------------------------+
| Label                                    |
| +--------------------------------------+ |
| | Multi-line text content              | |
| | that spans multiple rows             | |  <-- Auto-growing textarea
| |                                      | |
| +--------------------------------------+ |
+------------------------------------------+

NUMBER / CURRENCY
+------------------------------------------+
| Label                                    |
| +--------------------------------------+ |
| | $ |  50,000.00                     | | |  <-- Prefix + formatted number
| +--------------------------------------+ |
+------------------------------------------+

SELECT / DROPDOWN
+------------------------------------------+
| Label                                    |
| +--------------------------------------+ |
| | Selected Option                   [v]| |  <-- Always-visible dropdown
| +--------------------------------------+ |
|   | Option A                           | |
|   | Option B  (selected)           [x] | |  <-- Dropdown menu open
|   | Option C                           | |
|   +------------------------------------+ |
+------------------------------------------+

MULTI-SELECT
+------------------------------------------+
| Label                                    |
| +--------------------------------------+ |
| | [Tag A] [Tag B] [+]                | | |  <-- Tags with add button
| +--------------------------------------+ |
|   [ ] Option C                           |
|   [x] Option A                           |  <-- Checkbox list popover
|   [x] Option B                           |
|   [ ] Option D                           |
+------------------------------------------+

DATE / DATETIME
+------------------------------------------+
| Label                                    |
| +--------------------------------------+ |
| | 2026-02-08                      [cal]| |  <-- Date with calendar icon
| +--------------------------------------+ |
|   +----------------------------------+   |
|   |  < February 2026 >              |   |
|   | Su Mo Tu We Th Fr Sa            |   |  <-- Calendar popover
|   |                    1             |   |
|   |  2  3  4  5  6  7 [8]           |   |
|   |  9 10 11 12 13 14 15            |   |
|   +----------------------------------+   |
+------------------------------------------+

CHECKBOX / BOOLEAN
+------------------------------------------+
| Label                                    |
| [x] Yes / [ ] No                        |  <-- Toggle or checkbox, always editable
+------------------------------------------+

USER / OWNER PICKER
+------------------------------------------+
| Label                                    |
| +--------------------------------------+ |
| | [avatar] Sarah Johnson           [x] | |  <-- Avatar + name + clear
| +--------------------------------------+ |
|   Search users...                        |
|   +------------------------------------+ |
|   | [av] Sarah Johnson                 | |
|   | [av] Mike Chen                     | |  <-- User search dropdown
|   | [av] Lisa Wang                     | |
|   +------------------------------------+ |
+------------------------------------------+
```

### 2.4 Autosave Feedback States

```
SAVING:         [value]  (spinner)    <-- Tiny spinner next to field
SAVED:          [value]  (checkmark)  <-- Green check, fades after 2s
ERROR:          [value]  (!)          <-- Red exclamation, tooltip with message
                         "Failed to save. Click to retry."
```

---

## 3. Property Management Admin UI

### 3.1 Overview

The admin settings page where admins create, edit, delete, and organize custom
properties. Located at Settings > Data Management > Properties (HubSpot pattern).

### 3.2 Admin Properties Page Layout

```
+------------------------------------------------------------------+
| SETTINGS                                                         |
+------------------------------------------------------------------+
| +-- SETTINGS SIDEBAR ----+ +-- MAIN CONTENT ----------------+   |
| |                        | |                                  |   |
| | Data Management        | | PROPERTIES                      |   |
| |   > Properties    <--  | |                                  |   |
| |   > Objects            | | +------------------------------+ |   |
| |   > Import/Export      | | | Select an object:             | |   |
| |                        | | | [Contact properties     v]    | |   |
| | Account                | | +------------------------------+ |   |
| |   > Users              | |                                  |   |
| |   > Branding           | | +-- FILTER BAR ---------------+ |   |
| |                        | | | [Search properties...]       | |   |
| +------------------------+ | | [Group v] [Type v] [All v]   | |   |
|                            | +------------------------------+ |   |
|                            |                                  |   |
|                            | [+ Create property]     [Manage groups] |
|                            |                                  |   |
|                            | +-- PROPERTIES TABLE ----------+ |   |
|                            | |                                | |   |
|                            | | [ ] Name/Label    Type  Group | |   |
|                            | | ----------------------------- | |   |
|                            | | [ ] First Name    Text  About | |   |
|                            | |     firstname  (system)       | |   |
|                            | |                                | |   |
|                            | | [ ] Email         Email About | |   |
|                            | |     email      (system)       | |   |
|                            | |                                | |   |
|                            | | [ ] Lead Score    Number CRM  | |   |
|                            | |     lead_score   (custom)     | |   |
|                            | |                                | |   |
|                            | | [ ] Preferred..   Select CRM  | |   |
|                            | |     preferred_c  (custom)     | |   |
|                            | |                                | |   |
|                            | +------------------------------+ |   |
|                            |                                  |   |
|                            | Showing 1-25 of 142 properties   |   |
|                            | [< 1 2 3 4 5 6 >]               |   |
|                            +----------------------------------+   |
+------------------------------------------------------------------+
```

### 3.3 Property Table Row Detail

```
+----------------------------------------------------------------+
| [ ] | [icon] First Name        | Single-line text | About this |
|     |        firstname          | (system)         | contact    |
|     |        Used in 3 forms, 2 workflows        | [... menu]  |
+----------------------------------------------------------------+
      ^         ^                   ^                  ^
  checkbox   icon by type      field type +         kebab menu:
  for bulk   + label/name      system/custom        - Edit
  actions                      badge                - Clone
                                                    - Archive
                                                    - Delete (if custom)
```

### 3.4 Create / Edit Property Wizard (Slide-over Panel)

```
+------------------------------------------------------------------+
|                                   +-- SLIDE-OVER PANEL (480px) -+ |
|                                   |                              | |
|   (dimmed background)             | CREATE PROPERTY          [X] | |
|                                   |                              | |
|                                   | STEP 1 OF 3: Basic Info      | |
|                                   | ========================     | |
|                                   |                              | |
|                                   | Object type *                | |
|                                   | [Contact              v]    | |
|                                   |                              | |
|                                   | Group *                      | |
|                                   | [Contact information  v]    | |
|                                   |                              | |
|                                   | Label *                      | |
|                                   | [                        ]   | |
|                                   |                              | |
|                                   | Internal name                | |
|                                   | [auto_generated_from_label]  | |
|                                   | (auto-generated, editable    | |
|                                   |  before first save)          | |
|                                   |                              | |
|                                   | Description                  | |
|                                   | [                        ]   | |
|                                   | [                        ]   | |
|                                   |                              | |
|                                   | [Cancel]       [Next >]      | |
|                                   +------------------------------+ |
+------------------------------------------------------------------+

STEP 2 OF 3: Field Type
=========================

  Field type *
  +----------------------------------+
  | FIELD TYPE PICKER                |
  |                                  |
  | TEXT                             |
  |   [Aa] Single-line text          |
  |   [=]  Multi-line text           |
  |                                  |
  | NUMBER                           |
  |   [#]  Number                    |
  |   [$]  Currency                  |
  |                                  |
  | DATE                             |
  |   [cal] Date picker              |
  |   [cal] Date & time              |
  |                                  |
  | SELECTION                        |
  |   [v]  Dropdown select           |
  |   [v]  Radio select              |
  |   [xx] Multiple checkboxes       |
  |                                  |
  | OTHER                            |
  |   [x]  Single checkbox           |
  |   [@]  Email                     |
  |   [#]  Phone number              |
  |   [->] URL                       |
  |   [U]  User (owner)              |
  +----------------------------------+


STEP 2B: Options Editor (for select/multiselect types)
======================================================

  Options *
  +--------------------------------------+
  | [drag] [Option A label    ] [x]      |
  | [drag] [Option B label    ] [x]      |
  | [drag] [Option C label    ] [x]      |
  |                                      |
  | [+ Add an option]                    |
  +--------------------------------------+

  ^ drag handle    ^ label input    ^ remove


STEP 3 OF 3: Rules
====================

  [ ] Required field
  [ ] Show in forms
  [ ] Read-only (admin only)

  Default value
  [                        ]

  [Cancel]       [Create property]
```

### 3.5 Property Type Picker Icons

| Field Type          | Icon  | Description                              |
|---------------------|-------|------------------------------------------|
| Single-line text    | `Aa`  | `Type` (lucide)                          |
| Multi-line text     | `AlignLeft` | `AlignLeft` (lucide)               |
| Number              | `Hash` | `Hash` (lucide)                         |
| Currency            | `DollarSign` | `DollarSign` (lucide)             |
| Date                | `Calendar` | `Calendar` (lucide)                 |
| Date & time         | `CalendarClock` | `CalendarClock` (lucide)       |
| Dropdown select     | `ChevronDown` | `ChevronDown` (lucide)          |
| Radio select        | `CircleDot` | `CircleDot` (lucide)              |
| Multiple checkboxes | `CheckSquare` | `CheckSquare` (lucide)          |
| Single checkbox     | `ToggleLeft` | `ToggleLeft` (lucide)            |
| Email               | `Mail` | `Mail` (lucide)                         |
| Phone               | `Phone` | `Phone` (lucide)                       |
| URL                 | `Link` | `Link` (lucide)                         |
| User/Owner          | `User` | `User` (lucide)                         |

---

## 4. Property Group Management

### 4.1 Overview

Property groups organize properties into logical sections on the record sidebar.
HubSpot defaults include: "Contact information", "Email information",
"Web analytics", "Conversion information", "Social media".

### 4.2 Group Management Modal

```
+------------------------------------------+
| MANAGE GROUPS                        [X] |
+------------------------------------------+
|                                          |
| Object: Contact                          |
|                                          |
| +--------------------------------------+ |
| | [drag] Contact information      [...] | |  <-- drag handle + kebab
| |        8 properties                   | |
| +--------------------------------------+ |
| | [drag] Communication info       [...] | |
| |        3 properties                   | |
| +--------------------------------------+ |
| | [drag] Social media             [...] | |
| |        4 properties                   | |
| +--------------------------------------+ |
| | [drag] Custom group             [...] | |
| |        2 properties                   | |
| +--------------------------------------+ |
|                                          |
| [+ Create new group]                    |
|                                          |
|          [Cancel]         [Save order]   |
+------------------------------------------+

Kebab menu options:
  - Rename group
  - Delete group (moves properties to "Other")
```

### 4.3 Group CRUD Operations

**Create Group:**
```
+----------------------------+
| CREATE GROUP           [X] |
+----------------------------+
| Group name *               |
| [                      ]   |
|                            |
| Object type                |
| [Contact            v]     |
|                            |
| [Cancel]   [Create group]  |
+----------------------------+
```

**Assign Property to Group:**
- On the property create/edit wizard (Step 1), a "Group" dropdown allows
  assignment
- Drag-and-drop between groups is a power-user feature (optional for MVP)

### 4.4 Data Model Mapping

From the existing `PropertyDefinition` model:

```
groupName   String?   // Maps to group name
orderIndex  Int       // Controls sort order within group
```

Groups themselves are not a separate table but are derived from unique
`groupName` values. For advanced group management (custom order, descriptions),
consider a `PropertyGroup` model:

```prisma
model PropertyGroup {
  id          String  @id @default(uuid())
  tenantId    String
  objectType  String  // contact, company, deal
  name        String  // internal name
  label       String  // display label
  orderIndex  Int     @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, objectType, name])
  @@index([tenantId, objectType])
}
```

---

## 5. Dynamic Form Generation

### 5.1 Architecture: Schema-Driven Forms

The property definitions stored in the `PropertyDefinition` table act as a
schema that drives form rendering at runtime. When property definitions change,
the UI adapts automatically.

```
+-------------------+       +--------------------+       +------------------+
| PropertyDefinition|  -->  | PropertyFormEngine |  -->  | Rendered Form    |
| (DB Schema)       |       | (React Component)  |       | (Dynamic Fields) |
+-------------------+       +--------------------+       +------------------+
       |                            |                           |
  fieldType: "text"         maps to <TextInput>          <input type="text">
  fieldType: "select"       maps to <SelectInput>        <select>...</select>
  fieldType: "date"         maps to <DatePicker>         <DatePicker />
  fieldType: "checkbox"     maps to <Checkbox>           <input type="checkbox">
  ...                       ...                          ...
```

### 5.2 Component Registry Pattern

```typescript
// Field type to component mapping
const FIELD_COMPONENTS: Record<string, React.ComponentType<FieldProps>> = {
  text:         TextInput,
  textarea:     TextareaInput,
  number:       NumberInput,
  currency:     CurrencyInput,
  email:        EmailInput,
  phone:        PhoneInput,
  url:          UrlInput,
  date:         DateInput,
  datetime:     DateTimeInput,
  select:       SelectInput,
  multiselect:  MultiSelectInput,
  checkbox:     CheckboxInput,
  user:         UserPicker,
};

// Dynamic renderer
function PropertyField({ definition, value, onChange }: Props) {
  const Component = FIELD_COMPONENTS[definition.fieldType];
  if (!Component) return null;

  return (
    <Component
      label={definition.label}
      name={definition.name}
      value={value}
      onChange={onChange}
      options={definition.options}
      required={definition.isRequired}
      readonly={definition.isReadonly}
      placeholder={definition.description}
    />
  );
}
```

### 5.3 Form Generation Flow

```
1. FETCH DEFINITIONS                    2. GROUP & SORT
   GET /api/properties                     definitions
     ?objectType=contact                     .filter(d => !d.isHidden)
     &tenantId=xxx                           .sort((a,b) => a.orderIndex - b.orderIndex)
                                             .groupBy(d => d.groupName)
         |                                        |
         v                                        v
3. FETCH CURRENT VALUES                 4. RENDER GROUPED FORM
   GET /api/contacts/:id                   groups.map(group => (
     -> contact.properties                   <PropertyGroup label={group.name}>
                                               {group.fields.map(def => (
                                                 <PropertyField
                                                   definition={def}
                                                   value={values[def.name]}
                                                   onChange={handleChange}
                                                 />
                                               ))}
                                             </PropertyGroup>
                                           ))
```

### 5.4 Handling Definition Changes

| Change Type                 | Impact                                      | Handling Strategy                        |
|-----------------------------|---------------------------------------------|------------------------------------------|
| New property added          | Appears in form, value is null              | Show with empty state                    |
| Property deleted            | Field disappears, data orphaned             | Soft-delete definition, hide from UI     |
| Property type changed       | Existing data may be incompatible           | Block type change if data exists, or migrate |
| Options changed (select)    | Existing values may not match new options   | Keep old values, show as "unknown" badge |
| Property moved to new group | Appears under new group header              | Re-renders automatically                 |
| Property reordered          | Position changes in form                    | Re-renders automatically                 |

---

## 6. Empty States for Properties

### 6.1 Individual Property Empty Values

How to display a property with no value set:

```
PATTERN A: Dash placeholder (HubSpot default)
+------------------------------------------+
| Job Title                                |
| --                                 [pen] |
+------------------------------------------+

PATTERN B: Add-value prompt
+------------------------------------------+
| Job Title                                |
| + Add job title                    [pen] |
+------------------------------------------+

PATTERN C: Gray placeholder text
+------------------------------------------+
| Job Title                                |
| Not specified                      [pen] |
+------------------------------------------+
```

**Recommendation for F-CORE:** Use Pattern A (dash "--") for the sidebar read
view. It is the most compact and matches HubSpot conventions. On hover, show
a subtle "Click to add" tooltip.

### 6.2 Empty Property Group

When all properties in a group have no values:

```
+-----------------------------------+
| v SOCIAL MEDIA              [...] |
+-----------------------------------+
|                                   |
|  LinkedIn URL                     |
|  --                               |
|                                   |
|  Twitter Handle                   |
|  --                               |
|                                   |
+-----------------------------------+
```

Groups with all empty values should still render but can be collapsed by default
to reduce noise.

### 6.3 No Custom Properties Defined (Admin Page)

```
+--------------------------------------------------+
|                                                  |
|          (illustration: clipboard icon)          |
|                                                  |
|    No custom properties yet                      |
|                                                  |
|    Custom properties let you capture             |
|    information specific to your business.        |
|                                                  |
|    [+ Create your first property]                |
|                                                  |
+--------------------------------------------------+
```

### 6.4 Empty Search Results (Admin Property List)

```
+--------------------------------------------------+
|                                                  |
|    (illustration: search icon)                   |
|                                                  |
|    No properties match your search               |
|                                                  |
|    Try adjusting your filters or search terms.   |
|                                                  |
|    [Clear filters]                               |
|                                                  |
+--------------------------------------------------+
```

### 6.5 Empty State Design Tokens

| Element         | Tailwind Classes                                         |
|-----------------|----------------------------------------------------------|
| Container       | `flex flex-col items-center justify-center py-12 px-6`   |
| Icon            | `w-12 h-12 text-gray-300 mb-4`                          |
| Title           | `text-base font-medium text-gray-900 mb-1`              |
| Description     | `text-sm text-gray-500 text-center max-w-xs mb-4`       |
| CTA button      | `text-sm font-medium text-[#0891b2] hover:text-[#0ea5e9]` |

---

## 7. Mobile Responsiveness

### 7.1 Breakpoint Behavior

| Breakpoint      | Sidebar Behavior                               | Property Display          |
|-----------------|------------------------------------------------|---------------------------|
| Desktop (1024+) | Fixed left sidebar 300px                       | Full property editor      |
| Tablet (768-1023)| Collapsible sidebar, overlay on click         | Full property editor      |
| Mobile (<768)   | No sidebar. Properties in tab or accordion     | Stacked full-width fields |

### 7.2 Mobile Layout: Record Detail

On mobile, the three-column layout collapses into a tabbed single-column view:

```
MOBILE RECORD DETAIL
+-------------------------------+
| [<] John Smith           [...] |
+-------------------------------+
| [avatar]                       |
| John Smith                     |
| john@company.com               |
| [Email] [Call] [Task] [More]   |
+-------------------------------+
| [Overview] [Activity] [About] |  <-- Tab bar
+-------------------------------+

"About" Tab (replaces sidebar):
+-------------------------------+
| v ABOUT THIS CONTACT          |
| +--------------------------+  |
| | Email                    |  |
| | john@company.com    [>]  |  |
| +--------------------------+  |
| | Phone                    |  |
| | +1 (555) 123-456    [>]  |  |
| +--------------------------+  |
| | Lifecycle Stage          |  |
| | [Lead               v]   |  |
| +--------------------------+  |
| | Job Title                |  |
| | --               [+ Add] |  |
| +--------------------------+  |
|                               |
| v COMMUNICATION INFO     (3) |
|   (collapsed)                 |
+-------------------------------+
```

### 7.3 Mobile Edit Pattern

On mobile, tapping a property row opens a full-screen edit modal instead of
inline editing (the inline pattern does not work well on small screens):

```
MOBILE EDIT SCREEN
+-------------------------------+
| [Cancel]  Edit Email   [Save] |
+-------------------------------+
|                               |
| Email address                 |
| +---------------------------+ |
| | john@company.com          | |
| +---------------------------+ |
|                               |
|            (keyboard)         |
+-------------------------------+
```

### 7.4 Mobile Admin: Property Management

On mobile, the admin property table becomes a list/card layout:

```
+-------------------------------+
| Properties                    |
| [Contact properties     v]    |
+-------------------------------+
| [Search...]                   |
| [Filter v]                    |
+-------------------------------+
| +---------------------------+ |
| | First Name                | |
| | Text | About this contact | |
| | System property           | |
| +---------------------------+ |
| +---------------------------+ |
| | Email                     | |
| | Email | About this contact| |
| | System property           | |
| +---------------------------+ |
| +---------------------------+ |
| | Lead Score                | |
| | Number | CRM properties   | |
| | Custom property      [...] | |
| +---------------------------+ |
+-------------------------------+
| [+ Create property]          |
+-------------------------------+
```

### 7.5 Touch Targets

- Minimum touch target: 44x44px (WCAG 2.5.5 Target Size)
- Property rows: minimum height 48px
- Edit icons: minimum 44px tap area (even if visual icon is 20px)
- Spacing between interactive elements: minimum 8px

---

## 8. Accessibility

### 8.1 ARIA Patterns for Property Groups

```html
<!-- Collapsible property group -->
<div role="region" aria-labelledby="group-about-heading">
  <button
    id="group-about-heading"
    aria-expanded="true"
    aria-controls="group-about-content"
    class="..."
  >
    <span>About this contact</span>
    <ChevronIcon aria-hidden="true" />
  </button>
  <div
    id="group-about-content"
    role="group"
    aria-labelledby="group-about-heading"
  >
    <!-- Property fields go here -->
  </div>
</div>
```

### 8.2 ARIA for Inline Edit Fields

```html
<!-- Read mode -->
<div class="property-field" role="group" aria-label="Email address">
  <label id="email-label" class="text-xs text-gray-500">Email</label>
  <div
    role="button"
    tabindex="0"
    aria-label="Edit email address. Current value: john@company.com"
    aria-describedby="email-label"
    onClick={enterEditMode}
    onKeyDown={handleKeyDown}  <!-- Enter/Space to edit -->
  >
    john@company.com
  </div>
</div>

<!-- Edit mode -->
<div class="property-field" role="group" aria-label="Email address">
  <label id="email-label" for="email-input" class="text-xs text-gray-500">
    Email
  </label>
  <input
    id="email-input"
    type="email"
    value="john@company.com"
    aria-labelledby="email-label"
    aria-required="false"
    aria-invalid="false"
    autoFocus
    onBlur={saveAndExitEditMode}
    onKeyDown={handleKeyDown}  <!-- Enter to save, Escape to cancel -->
  />
</div>
```

### 8.3 Keyboard Navigation

| Key           | Action                                              |
|---------------|-----------------------------------------------------|
| `Tab`         | Move between property fields                        |
| `Enter/Space` | Enter edit mode on focused property                 |
| `Enter`       | Save current edit and move to next field             |
| `Escape`      | Cancel edit and revert to previous value             |
| `Tab` (in edit) | Save current edit and move to next field           |
| `Arrow Up/Down` | Navigate options in select/dropdown                |

### 8.4 Screen Reader Announcements

```typescript
// After successful save
announceToScreenReader("Email updated to john@newdomain.com");

// After error
announceToScreenReader("Error saving email. Invalid email format.");

// When entering edit mode
// Input auto-focus handles this via label association

// Group expand/collapse
// aria-expanded="true|false" handles this automatically
```

Use an `aria-live="polite"` region for save confirmations:

```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Dynamic save status announcements inserted here -->
</div>
```

### 8.5 Color Contrast Requirements

| Element                | Minimum Ratio | Our Colors                         | Status |
|------------------------|---------------|------------------------------------|--------|
| Property label text    | 4.5:1         | gray-500 (#6b7280) on white        | Pass   |
| Property value text    | 4.5:1         | gray-900 (#111827) on white        | Pass   |
| Empty value text       | 4.5:1         | gray-400 (#9ca3af) on white        | Fail*  |
| Primary action link    | 4.5:1         | cyan-600 (#0891b2) on white        | Pass   |
| Error text             | 4.5:1         | red-500 (#ef4444) on white         | Pass   |

*Note: gray-400 on white is 2.7:1. For empty values, use gray-500 (#6b7280) to
meet contrast requirements, or use "--" in gray-900 as HubSpot does.

---

## 9. Component Interaction Flows

### 9.1 Record Sidebar: View & Edit Property

```
User navigates to Contact record
         |
         v
Fetch PropertyDefinitions (for objectType="contact", tenantId)
Fetch Contact record (with properties JSONB)
         |
         v
Render sidebar with grouped properties
         |
         v
User hovers property row --> pencil icon appears
         |
         v
User clicks property or pencil icon
         |
         v
Field transforms to edit mode (input/select/datepicker)
         |
         +---> User types new value
         |
         v
User presses Enter / clicks away (onBlur)
         |
         +---> Validate input (client-side)
         |         |
         |     [Invalid] --> Show error, keep edit mode
         |         |
         |     [Valid] --> PATCH /api/contacts/:id
         |                  body: { properties: { [field.name]: newValue } }
         |                        |
         |                   [Success] --> Show checkmark, revert to read mode
         |                        |
         |                   [Error] --> Show error toast, keep edit mode
         |
         +---> User presses Escape --> Cancel, revert to read mode
```

### 9.2 Admin: Create Custom Property

```
Admin navigates to Settings > Properties
         |
         v
Selects object type (Contact/Company/Deal)
         |
         v
Clicks [+ Create property]
         |
         v
Slide-over panel opens
         |
         v
Step 1: Basic Info
  - Selects group
  - Enters label (auto-generates internal name)
  - Enters optional description
  - [Next >]
         |
         v
Step 2: Field Type
  - Selects field type from picker grid
  - If select/multiselect: configure options
    - Add/remove/reorder options
  - [Next >]
         |
         v
Step 3: Rules
  - Toggle required
  - Toggle show in forms
  - Set default value
  - [Create property]
         |
         v
POST /api/property-definitions
  body: { objectType, name, label, fieldType, ... }
         |
    [Success] --> Close panel, refresh list, show success toast
    [Error] --> Show error in panel, keep open
```

### 9.3 Admin: Reorder Properties

```
Admin clicks [...] on property row
         |
         v
Selects "Change order"
         |
         v
Table enters reorder mode:
  - Drag handles appear on left
  - Properties become draggable
         |
         v
Admin drags property to new position
         |
         v
PATCH /api/property-definitions/reorder
  body: { definitions: [{ id, orderIndex }, ...] }
         |
         v
[Save order] button appears --> click to confirm
```

### 9.4 Full Property Sheet

```
User clicks "View all properties" on sidebar
         |
         v
Full-page modal or slide-over opens
         |
         v
+--------------------------------------------------+
| ALL PROPERTIES                              [X]  |
+--------------------------------------------------+
| [Search properties...]                            |
+--------------------------------------------------+
| v ABOUT THIS CONTACT                              |
|   Email .............. john@company.com            |
|   Phone .............. +1 (555) 123-4567           |
|   First Name ......... John                        |
|   Last Name .......... Smith                       |
|   Lifecycle Stage .... Lead                        |
|   Lead Status ........ Qualified                   |
|   Job Title .......... VP Engineering              |
|   Department ......... --                          |
|                                                   |
| v COMMUNICATION INFO                              |
|   Preferred Method ... Email                       |
|   Time Zone .......... PST                         |
|   Language ........... English                     |
|                                                   |
| v SOCIAL MEDIA                                    |
|   LinkedIn ........... --                          |
|   Twitter ............ --                          |
+--------------------------------------------------+
```

All fields are editable inline in this view. The two-column layout
(label...value) maximizes density.

---

## 10. Implementation Recommendations

### 10.1 Component Architecture

```
src/components/properties/
  |
  +-- PropertySidebar.tsx          # Main sidebar container
  |     Fetches definitions + values, renders groups
  |
  +-- PropertyGroup.tsx            # Collapsible group with header
  |     Handles expand/collapse, group-level actions
  |
  +-- PropertyField.tsx            # Single property: read + edit mode
  |     Handles mode switching, autosave, validation
  |
  +-- PropertySheet.tsx            # Full property view (modal)
  |     All properties in scrollable two-column layout
  |
  +-- fields/                      # Field type components
  |     +-- TextInput.tsx
  |     +-- NumberInput.tsx
  |     +-- DateInput.tsx
  |     +-- SelectInput.tsx
  |     +-- MultiSelectInput.tsx
  |     +-- CheckboxInput.tsx
  |     +-- UserPicker.tsx
  |     +-- EmailInput.tsx
  |     +-- PhoneInput.tsx
  |     +-- UrlInput.tsx
  |     +-- CurrencyInput.tsx
  |     +-- index.ts               # Component registry
  |
  +-- admin/                       # Admin settings components
  |     +-- PropertyList.tsx        # Admin table of properties
  |     +-- PropertyCreateWizard.tsx # Multi-step create/edit
  |     +-- PropertyTypePicker.tsx  # Visual type selector grid
  |     +-- OptionsEditor.tsx       # Drag-reorder options for selects
  |     +-- GroupManager.tsx        # Manage groups modal
  |
  +-- hooks/
  |     +-- usePropertyDefinitions.ts  # SWR/React Query hook
  |     +-- usePropertyValues.ts       # Get/set property values
  |     +-- usePropertyAutosave.ts     # Debounced autosave logic
  |
  +-- utils/
        +-- fieldRegistry.ts       # Maps fieldType -> Component
        +-- validation.ts          # Per-type validation rules
        +-- formatters.ts          # Display formatting per type
```

### 10.2 Key Technical Decisions

| Decision                     | Recommendation                                       | Rationale                                  |
|------------------------------|------------------------------------------------------|--------------------------------------------|
| State management for edits   | Optimistic updates with rollback                     | Snappy UX, handles autosave well           |
| Autosave debounce            | 500ms debounce on text, immediate on select/checkbox | Balance between saves and UX speed         |
| Property definitions cache   | SWR/React Query with 5min stale time                 | Definitions change rarely                  |
| Property values storage      | JSONB `properties` column on each object             | Flexible, no schema migration needed       |
| Validation approach          | Zod schemas generated from PropertyDefinition        | Type-safe, composable                      |
| Drag-and-drop library        | @dnd-kit/sortable                                    | Accessible, React 19 compatible            |
| Date picker                  | date-fns + custom component or react-day-picker      | Lightweight, locale-aware                  |
| Mobile edit mode             | Full-screen modal (not inline)                       | Better touch UX                            |

### 10.3 API Endpoints

```
Property Definitions (Admin):
  GET    /api/property-definitions?objectType=contact
  POST   /api/property-definitions
  PATCH  /api/property-definitions/:id
  DELETE /api/property-definitions/:id      (soft delete)
  PATCH  /api/property-definitions/reorder  (batch update orderIndex)

Property Groups:
  GET    /api/property-groups?objectType=contact
  POST   /api/property-groups
  PATCH  /api/property-groups/:id
  DELETE /api/property-groups/:id
  PATCH  /api/property-groups/reorder

Property Values (on records):
  PATCH  /api/contacts/:id/properties
         body: { "field_name": "new_value" }
  GET    /api/contacts/:id
         -> includes properties: { field_name: value, ... }
```

All endpoints MUST include `WHERE tenant_id = ?` for multi-tenancy security.

### 10.4 Performance Considerations

- **Batch property updates**: Group multiple field saves into a single PATCH
  when the user rapidly edits multiple fields (300ms batch window)
- **Lazy load property groups**: Collapsed groups should not fetch/render their
  field components until expanded
- **Virtual scrolling**: If a record has 100+ properties, virtualize the
  "View all properties" sheet
- **Memoize field components**: Each `PropertyField` should be memoized to
  prevent re-renders when sibling fields change
- **Prefetch definitions**: Cache property definitions at the layout level since
  they are shared across all records of the same object type

### 10.5 Priority / Phased Implementation

**Phase 1 (MVP):**
- PropertyField component with read/edit modes for TEXT, SELECT, DATE, CHECKBOX
- PropertyGroup collapsible container
- PropertySidebar for contact detail page
- Basic autosave with debounce

**Phase 2:**
- All field types (number, currency, email, phone, url, multiselect, user)
- Admin PropertyList page with filters
- PropertyCreateWizard (3-step)
- Property type picker

**Phase 3:**
- Drag-and-drop reorder for properties and groups
- GroupManager modal
- Options editor for select fields
- Full property sheet modal
- Mobile-optimized views

**Phase 4:**
- Batch operations (bulk edit, bulk delete)
- Property usage tracking (which forms/workflows use this property)
- Property history/audit log
- Conditional property visibility rules

---

## Appendix A: Competitive Analysis Summary

| Feature                     | HubSpot        | Salesforce      | Freshsales    | Zoho CRM       |
|-----------------------------|----------------|-----------------|---------------|-----------------|
| Inline edit on sidebar      | Yes (autosave) | Yes (save btn)  | Yes           | Yes             |
| Collapsible property groups | Yes            | Yes             | Yes           | Yes             |
| Custom property creation    | Wizard panel   | Setup page      | Settings page | Settings page   |
| Drag-to-reorder             | Yes            | Limited         | No            | No              |
| Property type variety       | 15+ types      | 20+ types       | 12 types      | 14 types        |
| Mobile property edit        | Full-screen    | Full-screen     | Full-screen   | Inline          |
| Empty value display         | "--" dash      | Blank/clickable | Blank         | "--" dash       |
| User customization          | Per-user views | Page layouts    | Limited       | Per-user        |
| AI-powered fields           | Breeze (2025)  | Einstein        | Freddy AI     | Zia             |

## Appendix B: HubSpot Property Field Types Reference

Based on HubSpot's documentation, these are the supported field types:

| Category    | Field Type              | Internal Type    | Notes                              |
|-------------|-------------------------|------------------|------------------------------------|
| Text        | Single-line text        | `text`           | Max 65,536 chars                   |
| Text        | Multi-line text         | `textarea`       | No workflow value evaluation       |
| Number      | Number                  | `number`         | Decimal support                    |
| Number      | Calculation             | `calculation`    | Pro/Enterprise only                |
| Number      | Score                   | `score`          | Pro/Enterprise only                |
| Date        | Date picker             | `date`           | Date only                          |
| Date        | Date and time           | `datetime`       | Date + time, timezone aware        |
| Selection   | Dropdown select         | `select`         | Single value, max 5000 options     |
| Selection   | Radio select            | `radio`          | Single value, visible options      |
| Selection   | Multiple checkboxes     | `multiselect`    | Multiple values                    |
| Boolean     | Single checkbox         | `checkbox`       | Yes/No                             |
| Contact     | Email                   | `email`          | Email format validation            |
| Contact     | Phone number            | `phone`          | Phone format                       |
| Other       | URL                     | `url`            | URL format validation              |
| Other       | File                    | `file`           | File upload                        |
| Other       | HubSpot user            | `user`           | User/owner picker                  |
| Other       | Rich text               | `richtext`       | HTML content                       |

---

*End of Research Document*
