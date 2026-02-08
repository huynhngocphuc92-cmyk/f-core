# CRM Property/Custom Fields System - Competitive Analysis

> **Research Date**: 2026-02-08
> **Analyst**: Competitive Analyst, F-CORE Research Team
> **Platforms Analyzed**: HubSpot, Salesforce, Pipedrive, Zoho CRM
> **Purpose**: Inform F-CORE property system architecture and implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Property Types Matrix](#2-property-types-matrix)
3. [Property Groups & Organization](#3-property-groups--organization)
4. [Property Settings & Admin UI](#4-property-settings--admin-ui)
5. [Inline Property Editing](#5-inline-property-editing)
6. [Property API Comparison](#6-property-api-comparison)
7. [Default/System Properties](#7-defaultsystem-properties)
8. [Property History & Audit Trail](#8-property-history--audit-trail)
9. [Conditional Properties & Dependencies](#9-conditional-properties--dependencies)
10. [Property Permissions & Security](#10-property-permissions--security)
11. [Key Differentiators per Platform](#11-key-differentiators-per-platform)
12. [Feature Comparison Summary](#12-feature-comparison-summary)
13. [Recommendations for F-CORE](#13-recommendations-for-f-core)

---

## 1. Executive Summary

CRM property/custom field systems are a foundational feature that directly impacts user adoption, data quality, and platform extensibility. After analyzing HubSpot, Salesforce, Pipedrive, and Zoho CRM, we find that:

- **Salesforce** leads in raw field type count (25+), enterprise features (field audit trail up to 10 years), and granular security (field-level security per profile/permission set). However, its complexity creates a steep learning curve.
- **HubSpot** offers the best balance of power and usability, with a clean property editor, AI-assisted property creation (Breeze), property change events, and comprehensive API. Its conditional logic system (controlling/dependent properties) is intuitive.
- **Pipedrive** keeps things simple with 16 field types, a straightforward API (v2 released Dec 2025), and custom field grouping. It lacks advanced features like formula fields, field history tracking, and field-level security.
- **Zoho CRM** provides strong customization with 21+ field types, layout rules for conditional display, subforms, picklist history tracking, and field-level security at the profile level. Its formula and rollup summary fields are competitive with Salesforce.

**F-CORE should target HubSpot's usability and feature set as the baseline, while selectively adopting Salesforce's enterprise-grade capabilities (field history, field-level security) and Zoho's layout rules.**

---

## 2. Property Types Matrix

### Complete Field Type Comparison

| Field Type Category | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| **Text (short)** | Single-line text | Text (255 char) | varchar (255 char) | Single Line (255 char) |
| **Text (long)** | Multi-line text | Long Text Area (131k) | text (65k char) | Multi-Line / Text Area (32k) |
| **Rich Text** | Rich text | Rich Text Area (131k) | -- | -- |
| **Number (integer)** | Number | Number | double | Integer / Number |
| **Number (decimal)** | Number | Number (with decimal) | double | Decimal / Double |
| **Currency** | Number (currency fmt) | Currency | monetary | Currency |
| **Percentage** | Number (percentage fmt) | Percent | -- | Percent |
| **Date** | Date picker | Date | date | Date |
| **Date & Time** | Date and time | Date/Time | -- | Date/Time |
| **Time** | -- | Time | time | -- |
| **Time Range** | -- | -- | timerange | -- |
| **Date Range** | -- | -- | daterange | -- |
| **Dropdown Select** | Dropdown select | Picklist | enum | Pick List |
| **Multi-select** | Multiple checkboxes | Multi-Select Picklist | set | Multi-Select Pick List |
| **Radio Select** | Radio select | Radio (via picklist) | -- | Radio Button |
| **Checkbox (boolean)** | Single checkbox | Checkbox | -- | Checkbox |
| **Email** | -- (stored in contact) | Email | -- | Email |
| **Phone** | Phone number | Phone | phone | Phone |
| **URL** | URL | URL | -- | Website / URL |
| **File / Attachment** | File | -- (Attachments object) | -- | File Upload (1-5 files) |
| **Image** | -- | -- | -- | Image Upload (up to 10) |
| **Address** | -- (composite fields) | -- (composite) | address | -- (composite fields) |
| **Lookup / Relation** | -- (via associations) | Lookup | org / people / user | Lookup / Multi-Select Lookup |
| **User / Owner** | HubSpot user | Lookup (User) | user | User |
| **Formula** | Calculation | Formula | -- | Formula |
| **Rollup Summary** | Rollup (Pro+) | Roll-Up Summary | -- | Rollup Summary |
| **Auto-Number** | -- | Auto Number | -- | Auto Number |
| **Score** | Score | -- (via formula) | -- | -- |
| **Encrypted Text** | -- | Encrypted Text | -- | -- |
| **Geolocation** | -- | Geolocation | -- | -- |
| **Auto-complete Text** | -- | -- | varchar_auto | -- |
| **Big Integer** | -- | -- | -- | BigInt (18 digits) |
| **Subform** | -- | -- | -- | Subform |
| **Record Image** | -- | -- | -- | Record Image |

### Field Type Count Summary

| Platform | Native Field Types | Custom Field Limit per Object |
|---|---|---|
| **HubSpot** | ~15 types | 1,000 (Free: 10, Starter: 1,000, Pro/Ent: 1,000) |
| **Salesforce** | ~25+ types | 500-900 (depending on edition) |
| **Pipedrive** | 16 types | Varies by plan |
| **Zoho CRM** | ~21 types | 10 (Standard) to 500 (Ultimate) per module |

---

## 3. Property Groups & Organization

### HubSpot

- **Property Groups**: Used to categorize related properties. Groups appear only in property settings (not on records).
- **Default Groups**: `Contact Information`, `Contact Activity`, `Email Information`, `Conversion Information`, `Social Media Information`, `Deal Information`, `Company Information`, etc.
- **Custom Groups**: Admins can create, rename, and delete custom groups.
- **Group Management**: Via `Settings > Properties > Groups tab`. Can bulk-add properties to groups.
- **On Records**: Properties are organized into **record sidebars** (sections), which are independent from property groups.
- **API**: Property groups have their own API endpoints (`/crm/v3/properties/{objectType}/groups`).

### Salesforce

- **Page Layouts**: Fields are organized into **sections** within page layouts. Each section has a label and can be 1 or 2 columns.
- **Dynamic Forms**: In Lightning Experience, fields can be placed anywhere on the record page via the Lightning App Builder, independent of page layouts.
- **Record Types**: Different record types can have different page layouts, showing different field sets.
- **Field Sections**: Logically group fields (e.g., "Contact Information", "Address Information", "System Information").
- **Compact Layouts**: Define which fields appear in the record highlight panel.

### Pipedrive

- **Custom Field Groups**: Fields can be organized into named groups. Available via `Settings > Company > Data fields`.
- **Group Display**: Groups appear in the detail view of records.
- **Reordering**: Fields can be reordered via drag-and-drop within and across groups.
- **No Page Layouts**: Pipedrive has a simpler model -- all fields are shown to all users (with visibility settings).

### Zoho CRM

- **Sections**: Fields are organized into sections within module layouts. Sections can be added, renamed, and reordered.
- **Layouts**: Each module can have multiple layouts (e.g., "Standard Layout", custom layouts for different business processes).
- **Drag & Drop Editor**: Layout editor supports drag-and-drop field placement into sections.
- **Unused Items**: Removed fields go to an "Unused Items" section and can be re-added later.
- **Subforms**: Zoho uniquely supports subforms within layouts, allowing tabular data entry on a single record.

### Comparison

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| Property Groups / Sections | Groups (settings only) + Sidebar sections (records) | Page Layout Sections + Dynamic Forms | Custom Field Groups | Sections in Layouts |
| Multiple Layouts per Object | Via board/pipeline views | Yes (Record Types) | No | Yes |
| Drag & Drop Reordering | Yes (sidebar) | Yes (page layout editor) | Yes | Yes |
| Group-level API | Yes | Yes (via Metadata API) | No | Yes |
| Custom Groups/Sections | Yes | Yes | Yes | Yes |

---

## 4. Property Settings & Admin UI

### HubSpot - Admin UI Flow

1. **Navigation**: `Settings > Data Management > Properties`
2. **Object Selector**: Dropdown to filter by object type (Contact, Company, Deal, Ticket, Custom Objects)
3. **Properties Table**: Searchable, sortable table with columns: Property name, Group, Field type, Created by, Used in (forms, workflows, reports)
4. **Filters**: Filter by group, field type, brand, access, sensitivity, creator
5. **Property Editor** (slide-out panel):
   - **Details**: Label, internal name, description, object, group
   - **Field Type**: Type selector with sub-options (e.g., number formatting as currency/percentage)
   - **Rules**: Required, unique, show in search, validation
   - **Conditional Logic**: Set controlling/dependent property relationships
   - **Sensitive Data**: Mark as Sensitive or Highly Sensitive (Enterprise)
   - **Manage Access**: Field-level permissions (Enterprise)
6. **Breeze AI Creation**: Natural language property creation -- describe the field and HubSpot creates it
7. **Archival**: Properties are archived (soft delete) for 90 days before permanent deletion
8. **Clone**: Existing properties can be cloned with modifications
9. **Export**: Property history can be exported per property

### Salesforce - Admin UI Flow

1. **Navigation**: `Setup > Object Manager > [Object] > Fields & Relationships`
2. **Fields List**: Table showing field label, API name, type, controlling field, indexed status
3. **New Field Wizard** (multi-step):
   - Step 1: Select data type
   - Step 2: Field label, name, length, description, help text
   - Step 3: Field-Level Security (set visibility per profile)
   - Step 4: Add to page layouts
4. **Page Layout Editor**: Drag-and-drop editor for organizing fields into sections
5. **Lightning App Builder**: Visual builder for Dynamic Forms (field sections placed anywhere)
6. **Field Dependencies**: Set up controlling/dependent picklist relationships
7. **Field History Tracking**: Enable per object, select up to 20 fields (200 with Shield)

### Pipedrive - Admin UI Flow

1. **Navigation**: `Settings > Company > Data fields`
2. **Entity Tabs**: Tabs for Deal, Person, Organization, Product, etc.
3. **Field List**: Simple list showing field name, type, and group
4. **Add Field Dialog**: Name + field type selector (16 types)
5. **Field Options**: Edit name, reorder, set as required/important, add to add-new dialog
6. **Important Fields**: Mark fields as important for specific pipelines/stages
7. **Quality Rules**: Required fields and important field indicators
8. **Direct Creation**: Fields can also be created from the record detail view

### Zoho CRM - Admin UI Flow

1. **Navigation**: `Setup > Customization > Modules and Fields`
2. **Module Selection**: Choose module, then layout
3. **Layout Editor**: Visual drag-and-drop editor
   - Left panel: Available field types to drag onto the layout
   - Center: Layout preview with sections
   - Field coloring: Black text = standard fields, brown/sepia = custom fields
4. **Field Properties**: Click field > Edit Properties for detailed configuration
5. **Validation Rules**: Per-field validation configuration
6. **Layout Rules**: Conditional show/hide rules for fields and sections
7. **Field Permissions**: Per-profile field access control (hide or read-only)

---

## 5. Inline Property Editing

### HubSpot

- **Record Detail Page**: Properties displayed in a left sidebar with sections. Click on any property value to edit inline.
- **Board View**: Deal/ticket cards show key properties; click to edit.
- **Table/List View**: Click on cell values to edit inline (index pages).
- **Sidebar Customization**: Admins can customize which properties appear in the sidebar, their order, and which are visible by default.
- **Record Pages**: Customizable with tabs, cards, and sections (up to 10 custom tabs).
- **Bulk Edit**: Select multiple records on index pages to bulk-update property values.

### Salesforce

- **Record Detail Page**: Fields displayed in sections. Click pencil icon to edit individual fields or click "Edit" for full edit mode.
- **Dynamic Forms**: In Lightning, fields can be individually placed with inline editing.
- **List Views**: Inline editing supported (with restrictions for certain field types like formula, auto-number, rollup summary).
- **Reports**: Inline editing in reports (enabled via setup).
- **Compact Layout**: Key fields shown in the record highlight panel.
- **Limitations**: Formula fields, rollup summaries, auto-numbers, and system fields cannot be inline-edited.

### Pipedrive

- **Detail View**: Custom fields appear in the "DETAILS" section. Click to edit any field value.
- **List View**: Column-based editing with gear icon to select visible columns.
- **Add New Dialog**: Fields marked "Show in add new dialog" appear when creating records.
- **Pipeline View**: Deal cards show selected fields; click to edit.

### Zoho CRM

- **Record Detail Page**: Fields organized in sections. Click to edit inline.
- **Canvas View**: Fully customizable record display with drag-and-drop design.
- **List View**: Inline editing in list/table views.
- **Kanban View**: Card-based view with editable fields.
- **Business Card View**: Customizable card layout for quick data entry.

### Comparison

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| Inline Edit on Record | Yes | Yes | Yes | Yes |
| Inline Edit in List View | Yes | Yes (with limitations) | Yes | Yes |
| Inline Edit in Reports | No (view only) | Yes | No | Limited |
| Bulk Property Edit | Yes | Yes (Data Loader) | Limited | Yes |
| Custom Record Layout | Yes (sidebar + tabs) | Yes (Dynamic Forms) | Limited (groups) | Yes (Canvas + Layouts) |
| Mobile Inline Edit | Yes | Yes | Yes | Yes |

---

## 6. Property API Comparison

### HubSpot (CRM Properties API v3)

**Base URL**: `/crm/v3/properties/{objectType}`

| Endpoint | Method | Description |
|---|---|---|
| `/crm/v3/properties/{objectType}` | GET | List all properties for an object |
| `/crm/v3/properties/{objectType}` | POST | Create a property |
| `/crm/v3/properties/{objectType}/{propertyName}` | GET | Get a single property |
| `/crm/v3/properties/{objectType}/{propertyName}` | PATCH | Update a property |
| `/crm/v3/properties/{objectType}/{propertyName}` | DELETE | Archive a property |
| `/crm/v3/properties/{objectType}/batch/create` | POST | Batch create properties |
| `/crm/v3/properties/{objectType}/batch/read` | POST | Batch read properties |
| `/crm/v3/properties/{objectType}/batch/archive` | POST | Batch archive properties |
| `/crm/v3/properties/{objectType}/groups` | GET | List all property groups |
| `/crm/v3/properties/{objectType}/groups` | POST | Create a property group |
| `/crm/v3/properties/{objectType}/groups/{groupName}` | PATCH | Update a group |
| `/crm/v3/properties/{objectType}/groups/{groupName}` | DELETE | Delete a group |

**Key Features**:
- Batch operations for create, read, and archive
- Separate group management endpoints
- Sensitive data support via `dataSensitivity` parameter
- Supports all CRM objects including custom objects
- Property values updated via Object APIs (PATCH `/crm/v3/objects/{objectType}/{recordId}`)

### Salesforce (Metadata API + REST API)

| Approach | Description |
|---|---|
| **Metadata API** | Deploy/retrieve field definitions via XML metadata. Used for CI/CD and org management. |
| **REST API** | `GET /services/data/v{version}/sobjects/{objectName}/describe/` returns all fields and their metadata. |
| **Tooling API** | `GET /services/data/v{version}/tooling/sobjects/CustomField/` for field management. |
| **Setup UI API** | Limited programmatic access to setup operations. |

**Key Features**:
- Field metadata includes: label, API name, type, length, picklist values, default value, validation rules, field-level security
- Field CRUD via Metadata API deployments
- No direct REST endpoints for field creation (unlike HubSpot)
- Field history accessible via `{Object}History` related objects

### Pipedrive (Fields API v1 + v2)

**v2 API (Released Dec 2025)**:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v2/dealFields` | GET/POST | List/Create deal fields |
| `/api/v2/dealFields/{field_code}` | GET/PATCH/DELETE | Get/Update/Delete a deal field |
| `/api/v2/dealFields/{field_code}/options` | POST/PATCH/DELETE | Manage field options |
| `/api/v2/personFields` | GET/POST | List/Create person fields |
| `/api/v2/organizationFields` | GET/POST | List/Create organization fields |
| `/api/v2/productFields` | GET/POST | List/Create product fields |
| `/api/v2/activityFields` | GET | List activity fields (read-only) |

**Key Features**:
- Separate endpoints per entity type (deal, person, organization, product)
- Full CRUD for custom fields
- Bulk options management for enum and set field types
- Field codes are hash-based keys (e.g., `ffk9s9`)
- Monetary fields have companion `_currency` fields

### Zoho CRM (Fields API v8)

| Endpoint | Method | Description |
|---|---|---|
| `/settings/fields?module={module}` | POST | Create custom fields |
| `/settings/fields?module={module}` | GET | List all fields for a module |
| `/settings/fields/{field_id}?module={module}` | PATCH | Update a field |
| `/settings/fields/{field_id}?module={module}` | DELETE | Delete a field |
| `/settings/layouts?module={module}` | GET | Get layouts |
| `/settings/fields?module={module}&type=unused` | GET | Get unused fields |

**Key Features**:
- Max 5 fields per API call for creation
- Supports all 21+ field types via API
- Layout association for fields
- Tooltip configuration (static text or info icon)
- HIPAA compliance and privacy flags per field
- Filterable flag per field type

### API Comparison

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| RESTful Field CRUD | Yes | Via Metadata/Tooling API | Yes | Yes |
| Batch Operations | Yes (create, read, archive) | Via Metadata API | No | Yes (up to 5) |
| Group/Section API | Yes | Via Metadata API | No | Yes (Layouts API) |
| Field Options API | Via property definition | Via Metadata API | Yes (dedicated) | Via field definition |
| Webhook for Field Changes | Yes (property change events) | Yes (Platform Events) | Yes (webhooks) | Yes (notifications) |
| Rate Limiting | 100 calls/10s (OAuth) | Based on edition | 80 calls/2s | 500/day - 25k/day |

---

## 7. Default/System Properties

### HubSpot Default Contact Properties (Key Examples)

| Group | Properties |
|---|---|
| **Contact Information** | First name, Last name, Email, Phone, Job title, Lifecycle stage, Lead status, Owner |
| **Contact Activity** | Last activity date, Last contacted, Last engagement date, Number of times contacted, Number of sessions, Page views |
| **Email Information** | Email bounce, Email confirmed, Marketing emails opened, Marketing emails clicked |
| **Conversion Information** | First conversion date, First conversion, Recent conversion date, Recent conversion, Number of form submissions |
| **Social Media** | LinkedIn URL, Facebook profile, Twitter handle |

**System Fields (Cannot be Deleted)**: Record ID, Create date, Last modified date, Owner, Object ID, Merged contacts, Pipeline, Deal stage, Lifecycle stage

### Salesforce Default Fields (Per Object)

| Object | Key Standard Fields |
|---|---|
| **Contact** | Name, Account, Email, Phone, Mailing Address, Title, Department, Owner, Created Date, Last Modified Date |
| **Account** | Name, Industry, Type, Website, Phone, Employees, Annual Revenue, Owner, Rating |
| **Opportunity** | Name, Amount, Close Date, Stage, Probability, Type, Lead Source, Owner |
| **Lead** | Name, Company, Email, Phone, Status, Rating, Lead Source, Owner |

**System Fields**: Id, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById, SystemModstamp, IsDeleted, RecordTypeId

### Pipedrive Default Fields

| Entity | Key Default Fields |
|---|---|
| **Person** | Name, Phone, Email, Organization, Owner, Label, Visible to |
| **Organization** | Name, Address, Label, Owner, Visible to |
| **Deal** | Title, Value, Currency, Pipeline, Stage, Owner, Expected close date, Probability, Label, Visible to |

**System Fields**: ID, Creator, Created, Updated, Active, Deleted, Close time, Won time, Lost time

### Zoho CRM Default Fields

| Module | Key Standard Fields |
|---|---|
| **Contacts** | Name, Account Name, Email, Phone, Mailing Address, Title, Department, Owner, Source |
| **Accounts** | Name, Website, Phone, Industry, Type, Employees, Annual Revenue, Owner, Rating |
| **Deals** | Name, Amount, Closing Date, Stage, Probability, Type, Lead Source, Owner, Account |
| **Leads** | Name, Company, Email, Phone, Lead Status, Rating, Lead Source, Owner |

**System Fields**: Record ID, Created By, Created Time, Modified By, Modified Time, Record Owner

---

## 8. Property History & Audit Trail

### HubSpot

- **Property History**: Available for all properties on all objects. Tracks old value, new value, timestamp, and source.
- **Access**: On a record detail page, hover over a property and click "View history" to see the change log.
- **Export**: Property history can be exported per property across all records.
- **Sources Tracked**: Manual update, API, import, workflow, form submission, integration, calculated, etc.
- **Property Change Events**: Can create events that fire when specific property values change. Used in lists, workflows, and reporting.
- **Audit Log**: Enterprise accounts have a centralized audit log for admin-level changes (not record-level property changes).
- **Retention**: Property history is retained indefinitely.
- **Limitations**: Cannot directly report on property history values in the standard report builder (must export).

### Salesforce

- **Field History Tracking**: Must be enabled per object and per field. Tracks old value, new value, who changed it, and when.
- **Standard Limit**: 20 fields per object.
- **Shield / Field Audit Trail**: Up to 200 fields per object, retention up to 10 years, stored in `FieldHistoryArchive` big object.
- **History Related List**: Changes appear on the record's history related list (e.g., Account History, Contact History).
- **Programmatic Access**: Query `{Object}History` objects via SOQL, or `FieldHistoryArchive` for audit trail data.
- **Unsupported Field Types**: Formula fields, rollup summaries, auto-number fields, and system fields cannot be tracked.
- **Setup Audit Trail**: Separate system for tracking metadata/configuration changes (6 months standard, extendable).

### Pipedrive

- **Change Log**: Pipedrive tracks changes on entities but does **not** provide per-field history tracking.
- **Activity Log**: Records who made changes and when, but without old/new value comparison.
- **Changelog API**: `GET /persons/{id}/changelog`, `GET /deals/{id}/changelog` -- returns entity-level change events.
- **Limitations**: No field-level audit trail. No configurable field history tracking.

### Zoho CRM

- **Picklist History Tracking**: Can enable history tracking for **one picklist field per module**. Tracks value changes with timestamp and who changed it.
- **Audit Log**: Tracks record-level actions (create, update, delete, export) with user and timestamp.
- **Field Update History**: Visible as a related list on records for tracked fields.
- **Limitations**: History tracking is limited to picklist fields only (not all field types). One picklist per module.
- **Timeline**: Records show a timeline of activities and changes.

### Comparison

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| Per-Field History Tracking | Yes (all fields) | Yes (20-200 fields) | No | Limited (1 picklist/module) |
| Old/New Value Stored | Yes | Yes | No | Yes (picklist only) |
| Change Source Tracking | Yes | Yes | Partial | Yes |
| History Retention | Indefinite | 18 months (10 years w/ Shield) | N/A | N/A |
| Export History | Yes | Yes (reports/API) | No | Limited |
| Programmatic Access | API (limited) | Full API (SOQL) | Changelog API | API |
| Property Change Events | Yes | Yes (Platform Events) | No | No |

---

## 9. Conditional Properties & Dependencies

### HubSpot

- **Conditional Logic for Enumeration Properties**: Set a "controlling" property and a "dependent" property. When the controlling property has a specific value, the dependent property is shown (and optionally required).
- **Scope**: Works on dropdown select, multiple checkboxes, single checkbox, and radio select properties.
- **Available On**: Record creation forms, record editing, playbooks, mobile app, HubSpot Sales extension.
- **Limitation**: Only enumeration (enum) properties can be controlling properties. Logic does not apply in workflows.
- **Conditional Option Filtering**: Limit the available options of a dependent property based on the controlling property value. E.g., Department = "Engineering" limits Role options to engineering-related roles.
- **Form Dependent Fields**: In forms, dependent fields can show/hide based on visitor responses (separate from CRM conditional logic).

### Salesforce

- **Dependent Picklists**: A controlling picklist/checkbox determines which values are available in a dependent picklist.
- **Dynamic Forms**: In Lightning, field visibility can be controlled by record values or user attributes using visibility rules.
- **Page Layout Rules**: Record types assign different page layouts (with different field sets) based on record type selection.
- **Validation Rules**: Complex formula-based validation can enforce field requirements conditionally.
- **Record Types**: Different record types can have entirely different page layouts, including different fields.

### Pipedrive

- **Important Fields**: Mark fields as important for specific pipelines and stages. Fields show a reminder if empty, but are not hidden/shown conditionally.
- **Required Fields**: Fields can be marked as required, but this is not conditional.
- **No Conditional Logic**: Pipedrive does **not** support conditional show/hide of fields based on other field values.

### Zoho CRM

- **Layout Rules**: Powerful conditional logic system. Rules can:
  - Show/hide fields based on other field values
  - Show/hide entire sections based on criteria
  - Make fields mandatory conditionally
  - Apply across different conditions and criteria
- **Scope**: Works on record create/edit forms within modules.
- **Multiple Conditions**: Rules support AND/OR conditions with multiple criteria.
- **Field Dependencies**: Picklist-to-picklist dependencies (similar to Salesforce dependent picklists).
- **Validation Rules**: Per-field validation rules with conditional triggers.

### Comparison

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| Conditional Show/Hide Fields | Yes (enum only) | Yes (Dynamic Forms) | No | Yes (Layout Rules) |
| Conditional Required | Yes | Yes (Validation Rules) | No | Yes |
| Dependent Picklist Options | Yes | Yes | No | Yes |
| Section Show/Hide | No | Yes (Dynamic Forms) | No | Yes |
| Multiple Condition Logic | Basic (one trigger) | Advanced (formula) | No | Yes (AND/OR) |
| Non-Enum Triggering | No | Yes (any field) | No | Yes |
| Form-Level Conditionals | Yes | Yes | No | Yes |

---

## 10. Property Permissions & Security

### HubSpot

- **Field-Level Permissions** (Enterprise): Restrict view and edit access to specific properties per user or team.
- **Sensitive Data Properties** (Enterprise): Mark properties as Sensitive or Highly Sensitive. Adds application-layer encryption.
- **HIPAA Compliance**: Sensitive data properties support HIPAA PHI storage.
- **Access Levels**: "Everyone can view/edit", "Super admins only", custom team/user permissions.
- **Immutable Sensitivity**: Once a property is marked as sensitive, the sensitivity level cannot be changed.
- **API Access**: Requires additional OAuth scopes (`sensitive.read`, `sensitive.write`) for sensitive data.
- **Audit Log**: Track who accessed or modified sensitive data properties.
- **Limitation**: Workflows do not enforce field-level permissions.

### Salesforce

- **Field-Level Security (FLS)**: Control read and edit access to individual fields per profile or permission set.
- **Permission Sets**: Granular field access can be assigned via permission sets (more flexible than profiles).
- **Encrypted Fields**: Shield Platform Encryption adds transparent encryption at rest for specific fields.
- **Classic Encryption**: Encrypted Text field type (128-char, mask-style display).
- **Field Audit Trail**: Shield add-on for extended tracking (200 fields/object, 10-year retention).
- **Object-Level + Field-Level**: Security is layered -- object-level CRUD, then field-level read/edit.
- **Validation Rules**: Can enforce business rules on field values.
- **Setup**: FLS configured during field creation wizard or via Profile/Permission Set settings.

### Pipedrive

- **Visibility Groups**: Control which users/teams can see records (not individual fields).
- **Permission Sets**: Control what actions users can perform (create, edit, delete) but not field-level.
- **No Field-Level Security**: Cannot restrict access to specific fields.
- **SSO/2FA**: Authentication security, but not field-level.

### Zoho CRM

- **Field-Level Security**: Per-profile control over field visibility (hide or read-only).
- **Profile-Based**: Field permissions are set at the profile level and apply across all layouts.
- **Record-Level Access**: Sharing rules, role hierarchy, and territory management.
- **Data Encryption**: Encryption at rest and in transit. Fields can be marked for encryption.
- **HIPAA/GDPR**: Compliance features including data subject rights and field-level privacy marking.
- **Audit Trail**: Record-level audit logging of who did what.

### Comparison

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| Field-Level Security | Yes (Enterprise) | Yes (all editions) | No | Yes (Paid editions) |
| Per-User/Team Access | Yes | Yes (via Permission Sets) | No | Via Profiles |
| Per-Profile Access | No (team-based) | Yes | No | Yes |
| Field Encryption | Yes (Sensitive Data) | Yes (Shield Encryption) | No | Yes |
| HIPAA Support | Yes (Enterprise) | Yes (Shield) | No | Yes |
| API Scope Restrictions | Yes | Yes | No | Yes |
| Audit of Field Access | Yes | Yes | No | Yes |

---

## 11. Key Differentiators per Platform

### HubSpot

1. **Breeze AI Property Creation**: Create properties using natural language descriptions -- unique in the industry.
2. **Universal Property History**: Every property change is tracked automatically, no configuration needed.
3. **Property Change Events**: Fire events when property values change, usable in workflows and reporting.
4. **Sensitive Data Framework**: Enterprise-grade sensitive/highly sensitive property classification with application-layer encryption.
5. **Clean Admin UI**: Intuitive property editor with progressive disclosure, filters, and search.
6. **Archival System**: Properties are archived (soft deleted) for 90 days before permanent deletion.
7. **Default Property Values** (Jan 2026): Admins can set default values that auto-apply on record creation.

### Salesforce

1. **Field Type Breadth**: 25+ field types including Geolocation, Encrypted Text, Auto-Number, and Rich Text.
2. **Field Audit Trail**: Up to 200 fields per object with 10-year retention (with Shield).
3. **Dynamic Forms**: Place individual fields anywhere on a record page with visibility rules.
4. **Record Types + Page Layouts**: Different field sets for different business processes on the same object.
5. **Formula Fields**: Powerful cross-object formula calculations with extensive function library.
6. **Roll-Up Summary Fields**: Aggregate child record data on parent records.
7. **Validation Rules**: Complex formula-based field validation.
8. **Metadata API**: Full programmatic control over field definitions for CI/CD pipelines.

### Pipedrive

1. **Simplicity**: 16 field types covering essential use cases without overwhelming users.
2. **Important Fields**: Pipeline/stage-specific field importance markers.
3. **Quick Field Creation**: Create fields directly from record detail views.
4. **Monetary Field Type**: Dedicated field type with automatic currency companion field.
5. **Address Field Type**: Structured address capture with geocoding potential.
6. **Fields API v2**: Modern, clean REST API for field management (Dec 2025).

### Zoho CRM

1. **Layout Rules**: Most flexible conditional logic system -- show/hide fields/sections based on any field value.
2. **Subforms**: Tabular data entry within records (e.g., line items, stakeholders).
3. **Image Upload Fields**: Gallery-style image display on records.
4. **Multi-Select Lookup**: Many-to-many relationships via lookup fields.
5. **Blueprint Integration**: Fields can be mandatory at specific process stages.
6. **Canvas View**: Fully customizable record display designed via drag-and-drop canvas.
7. **Picklist History Tracking**: Track changes to picklist values over time.

---

## 12. Feature Comparison Summary

### Comprehensive Feature Matrix

| Feature | HubSpot | Salesforce | Pipedrive | Zoho CRM |
|---|---|---|---|---|
| **Field Types** | ~15 | 25+ | 16 | 21+ |
| **Custom Field Limit** | Up to 1,000/object | Up to 900/object | Varies | Up to 500/module |
| **Property Groups** | Yes | Yes (Page Layout Sections) | Yes | Yes (Sections) |
| **Multiple Layouts** | Partial | Yes (Record Types) | No | Yes |
| **AI-Assisted Creation** | Yes (Breeze) | No | No | No |
| **Formula/Calculated** | Yes | Yes | No | Yes |
| **Rollup Fields** | Yes (Pro+) | Yes | No | Yes |
| **Auto-Number** | No | Yes | No | Yes |
| **Score Fields** | Yes | Via Formula | No | No |
| **File Upload Field** | Yes | Via Attachments | No | Yes |
| **Image Upload Field** | No | No | No | Yes |
| **Subforms** | No | No | No | Yes |
| **Conditional Logic** | Yes (enum only) | Yes (any field) | No | Yes (any field) |
| **Dependent Picklists** | Yes | Yes | No | Yes |
| **Field History** | All fields auto | 20-200 fields (config) | No | 1 picklist/module |
| **Property Change Events** | Yes | Yes (Platform Events) | No | No |
| **Field-Level Security** | Enterprise | All editions | No | Paid editions |
| **Sensitive Data** | Enterprise | Shield | No | Yes |
| **HIPAA Support** | Enterprise | Shield | No | Yes |
| **Field-Level Encryption** | Yes | Yes | No | Yes |
| **Inline Editing** | Yes | Yes | Yes | Yes |
| **Bulk Edit** | Yes | Yes | Limited | Yes |
| **Property Cloning** | Yes | No (must recreate) | No | No |
| **Soft Delete/Archive** | Yes (90 days) | No (hard delete) | No (hard delete) | No (to Unused Items) |
| **Export History** | Yes | Yes | No | Limited |
| **REST API for Fields** | Yes (full CRUD) | Metadata/Tooling API | Yes (full CRUD) | Yes (full CRUD) |
| **Batch API Operations** | Yes | Via Metadata API | No | Yes (up to 5) |
| **Webhook on Change** | Yes | Yes | Yes | Yes |

---

## 13. Recommendations for F-CORE

### 13.1 Priority 1 - Core Property System (Sprint Target)

**Data Model**:
```
PropertyDefinition
  - id (UUID)
  - tenant_id (UUID, required -- multi-tenancy)
  - object_type (enum: contact, company, deal, ticket, custom_object)
  - name (internal API name, immutable after creation)
  - label (display name, editable)
  - description (optional)
  - group_id (FK to PropertyGroup)
  - field_type (enum)
  - type (enum: string, number, date, datetime, enumeration, bool)
  - options (JSONB -- for dropdown/multiselect values with label + internal value)
  - default_value (text, nullable)
  - is_required (boolean)
  - is_unique (boolean)
  - is_system (boolean -- cannot be deleted)
  - is_archived (boolean -- soft delete)
  - archived_at (timestamp, nullable)
  - display_order (integer)
  - validation_rules (JSONB)
  - created_by (UUID)
  - created_at (timestamp)
  - updated_at (timestamp)
  - deleted_at (timestamp, nullable -- soft delete per CLAUDE.md rules)

PropertyGroup
  - id (UUID)
  - tenant_id (UUID)
  - object_type (enum)
  - name (text)
  - display_order (integer)
  - is_system (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
  - deleted_at (timestamp, nullable)
```

### 13.2 Field Types to Implement (Phase 1)

Based on competitive analysis, prioritize these field types for initial release:

| Priority | Field Type | Internal Type | Notes |
|---|---|---|---|
| P0 | Single-line text | `string` | Max 255 chars |
| P0 | Multi-line text | `text` | Max 65k chars |
| P0 | Number | `number` | With decimal, currency, percentage formatting |
| P0 | Date | `date` | YYYY-MM-DD |
| P0 | Date & Time | `datetime` | ISO 8601 |
| P0 | Dropdown select | `enumeration` | Single selection with options |
| P0 | Multiple checkboxes | `enumeration` | Multi-select with options |
| P0 | Single checkbox | `boolean` | True/false |
| P1 | Phone number | `string` | With phone formatting |
| P1 | Email | `string` | With email validation |
| P1 | URL | `string` | With URL validation |
| P1 | Radio select | `enumeration` | Single selection displayed as radio |
| P1 | User/Owner | `reference` | FK to users table |
| P2 | Calculation | `calculated` | Formula-based (follow HubSpot syntax) |
| P2 | Score | `number` | Weighted scoring with criteria |
| P2 | File | `file` | File upload attachment |
| P3 | Rollup | `calculated` | Aggregate from associated records |

### 13.3 Property Groups Strategy

Follow HubSpot's approach:
- **Default Groups**: Create sensible default groups per object (e.g., "Contact Information", "Company Details", "Deal Information")
- **Custom Groups**: Allow admins to create, rename, reorder, and delete groups
- **Separation of Concerns**: Groups organize properties in settings; record sidebars organize display
- **API**: Provide full CRUD API for groups

### 13.4 Property History Implementation

Adopt a hybrid approach inspired by HubSpot (automatic for all) and Salesforce (detailed tracking):

```
PropertyValueHistory
  - id (UUID)
  - tenant_id (UUID)
  - record_id (UUID)
  - object_type (enum)
  - property_id (FK to PropertyDefinition)
  - old_value (text, nullable)
  - new_value (text, nullable)
  - source (enum: manual, api, import, workflow, form, integration, calculated)
  - changed_by (UUID, nullable -- user who made the change)
  - changed_at (timestamp)
```

- Track all property changes automatically (like HubSpot)
- Include change source tracking
- Display history on record detail pages (hover/click to view)
- Provide export capability per property

### 13.5 Conditional Logic (Phase 2)

Start with HubSpot's model, evolve toward Zoho's:
- **Phase 2a**: Dependent picklist options (controlling property limits dependent options)
- **Phase 2b**: Conditional show/hide for any field based on enumeration values
- **Phase 2c**: Conditional required fields
- **Phase 2d**: Section-level show/hide (Zoho-style layout rules)

### 13.6 Property Permissions (Phase 2)

Follow HubSpot's team-based model:
- **View/Edit Permissions**: Per-property, assignable to teams or individual users
- **Sensitive Data Flag**: Mark properties as sensitive for additional encryption
- **Default**: All properties visible to all users unless restricted
- **API Enforcement**: Property permissions enforced at the API layer

### 13.7 Admin UI Design Guidelines

Based on competitive analysis, the property settings UI should:

1. **Settings > Data Management > Properties** navigation pattern (HubSpot-style)
2. **Object Type Selector** dropdown at the top
3. **Searchable, sortable table** of properties with columns: Name, Group, Type, Created by, Used in
4. **Filter bar** for group, field type, creator
5. **Slide-out Property Editor** with tabs: Details, Rules, Conditional Logic, Permissions
6. **Groups Tab** for managing property groups
7. **Archive/Restore** flow with 90-day retention (not hard delete)
8. **Inline creation** from record detail pages (Pipedrive-style convenience)
9. **Drag-and-drop reordering** within groups

### 13.8 API Design

Follow HubSpot's clean REST pattern:

```
GET    /api/v1/properties/{objectType}           -- List all properties
POST   /api/v1/properties/{objectType}           -- Create property
GET    /api/v1/properties/{objectType}/{name}    -- Get property
PATCH  /api/v1/properties/{objectType}/{name}    -- Update property
DELETE /api/v1/properties/{objectType}/{name}    -- Archive property

GET    /api/v1/properties/{objectType}/groups       -- List groups
POST   /api/v1/properties/{objectType}/groups       -- Create group
PATCH  /api/v1/properties/{objectType}/groups/{name} -- Update group
DELETE /api/v1/properties/{objectType}/groups/{name} -- Delete group

POST   /api/v1/properties/{objectType}/batch/create  -- Batch create
POST   /api/v1/properties/{objectType}/batch/read    -- Batch read
POST   /api/v1/properties/{objectType}/batch/archive -- Batch archive
```

### 13.9 Technology Considerations

- **Schema**: Use a `property_definitions` table (EAV-adjacent pattern) rather than dynamic column generation
- **Values Storage**: Store property values in a JSONB column on each record, or use a dedicated `property_values` table for flexibility
- **Validation**: Server-side validation using Zod schemas generated from property definitions
- **Search**: Index frequently-filtered custom properties for performance
- **Caching**: Cache property definitions (they change infrequently) at the tenant level
- **Multi-tenancy**: Every query MUST include `tenant_id` (per CLAUDE.md rules)

---

## Appendix A: Sources

- HubSpot Knowledge Base: Properties documentation (knowledge.hubspot.com/properties/)
- HubSpot Developer Docs: CRM Properties API v3 (developers.hubspot.com/docs/api-reference/crm-properties-v3/)
- HubSpot Community: Product updates (Jan 2026, Nov 2025, Aug 2025)
- Salesforce Help: Custom Field Types (help.salesforce.com)
- Salesforce Trailhead: Custom Field Creation Guide
- Salesforce Developer Docs: Field Types, Field History Tracking
- Salesforce Shield: Field Audit Trail documentation
- Pipedrive Developer Docs: Fields API v1/v2 (developers.pipedrive.com)
- Pipedrive Developer Changelog: Fields API v2 announcement (Dec 2025)
- Pipedrive readme.io: Custom Fields documentation
- Zoho CRM Help: Types of Fields, Custom Fields, Layout Rules
- Zoho CRM Developer Docs: Fields API v8
- Zoho CRM Resources: Field Customization, Field-Level Security
- Various third-party analysis articles and tutorials
