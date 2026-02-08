# Property System - Research Summary

> Date: 2026-02-08
> Feature: Property System (Item #5)
> Sources: competitive-analysis.md, ux-patterns.md, tech-research.md

---

## Key Decisions

### 1. Storage Pattern: JSONB (Keep Current)
- Contact, Company, Deal already have `properties Json @default("{}")`
- JSONB is 2x faster reads, 2x less storage vs EAV
- PropertyDefinition model already exists in Prisma schema
- **No schema migration needed** for core storage

### 2. Field Types (MVP - 10 types)
All 10 types already defined in PropertyDefinition.fieldType:
- **text** - Single-line text input
- **number** - Numeric input
- **date** - Date picker
- **datetime** - Date + time picker
- **select** - Dropdown select (options in JSON)
- **multiselect** - Multi-select checkboxes
- **checkbox** - Boolean toggle
- **email** - Email input with mailto link
- **phone** - Phone input with tel link
- **url** - URL input with external link

### 3. Property Groups
- Use existing `groupName` field on PropertyDefinition
- Default groups: "About", "Contact Information", "Web Analytics", "Deal Information"
- Collapsible sections in property editor sidebar
- Defer dedicated PropertyGroup model to later sprint

### 4. UI Patterns
- **Property Editor Sidebar** - Left panel on record detail pages, grouped properties, hover-to-reveal edit button
- **Property Settings Page** - Admin page at /settings/properties with table of all definitions, create/edit form
- **Dynamic Form Rendering** - Schema-driven from PropertyDefinition, type-specific input components

### 5. API Design (HubSpot-style REST)
- `GET /api/properties?objectType=contact` - List definitions
- `POST /api/properties` - Create definition
- `PATCH /api/properties/[id]` - Update definition
- `DELETE /api/properties/[id]` - Delete definition (soft, non-system only)

## Scope for This Sprint

### In Scope
1. PropertyDefinition CRUD API with tenant isolation
2. Property settings admin page (/settings/properties)
3. Create/edit property definition form
4. Property editor sidebar component (reusable)
5. Dynamic field renderer for all 10 types
6. Seed data for default system properties
7. Navigation: Add "Settings" gear icon in sidebar

### Out of Scope (Future)
- Property history tracking
- Conditional properties
- Property permissions (field-level security)
- Formula/calculated fields
- Property import/export
- Record detail pages (contacts/[id], companies/[id], deals/[id])

## Implementation Priority
1. API routes for PropertyDefinition CRUD
2. Seed default properties for contacts, companies, deals
3. Property settings admin page with table + create/edit form
4. PropertyField renderer component (10 field types)
5. PropertyEditor sidebar component
6. Add Settings nav to AppSidebar
