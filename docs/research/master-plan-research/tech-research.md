# F-CORE Technical Research Report

> **Date**: 2026-02-07
> **Purpose**: Comprehensive technical research for building a HubSpot CRM clone with Next.js + Supabase
> **Status**: Complete

---

## Table of Contents

1. [HubSpot API & Data Model](#1-hubspot-api--data-model)
2. [HubSpot Property System](#2-hubspot-property-system)
3. [Database Schema Design for CRM](#3-database-schema-design-for-crm)
4. [Next.js CRM Architecture](#4-nextjs-crm-architecture)
5. [Supabase-Specific Patterns](#5-supabase-specific-patterns)
6. [Key Libraries & Tools](#6-key-libraries--tools)
7. [Performance Considerations](#7-performance-considerations)
8. [Security Considerations](#8-security-considerations)
9. [Recommended Architecture Summary](#9-recommended-architecture-summary)

---

## 1. HubSpot API & Data Model

### 1.1 CRM Object Types

HubSpot organizes all data around **objects**. Each object represents a type of business entity.

#### Standard Objects (Built-in)

| Object | Type ID | Purpose | Key Default Properties |
|--------|---------|---------|----------------------|
| Contacts | `0-1` | People/leads | `firstname`, `lastname`, `email`, `phone`, `lifecyclestage` |
| Companies | `0-2` | Organizations | `name`, `domain`, `industry`, `annualrevenue` |
| Deals | `0-3` | Sales opportunities | `dealname`, `amount`, `dealstage`, `pipeline`, `closedate` |
| Tickets | `0-5` | Support requests | `subject`, `hs_pipeline`, `hs_pipeline_stage`, `hs_ticket_priority` |
| Products | `0-7` | Product catalog | `name`, `description`, `price`, `hs_sku` |
| Line Items | `0-8` | Deal line items | Linked to products and deals |
| Quotes | `0-14` | Sales quotes | Linked to deals and line items |
| Leads | `0-136` | Pre-qualification | `hs_lead_name`, associated contact/company |

#### Activity/Engagement Objects

| Object | Type ID | Purpose |
|--------|---------|---------|
| Calls | `0-48` | Phone call records |
| Emails | `0-49` | Email communications |
| Meetings | `0-47` | Scheduled meetings |
| Notes | `0-46` | Free-form notes |
| Tasks | `0-27` | Action items |
| Communications | `0-18` | LinkedIn, SMS, WhatsApp messages |
| Postal Mail | `0-116` | Physical mail tracking |

#### Custom Objects (Enterprise)

- Type ID pattern: `2-XXX`
- Fully customizable with user-defined properties
- Support custom association cardinality
- Limited AI/reporting support as of 2025

### 1.2 Associations (Relationships)

HubSpot uses a flexible association system (v4 API) to link objects together.

#### Default Association Patterns

```
Contact -> Company:     Many-to-one (primary), Many-to-many (all)
Contact -> Deal:        Many-to-many
Deal -> Company:        Many-to-one (primary), Many-to-many (all)
Ticket -> Contact:      Many-to-one (primary)
Ticket -> Company:      Many-to-one
Deal -> Line Item:      One-to-many
Quote -> Deal:          Many-to-one
```

#### Association Features

- **Unlabeled associations**: Simple link between records (e.g., contact-to-company)
- **Default labeled associations**: System-defined labels (e.g., contact-to-primary company)
- **Custom labeled associations**: User-defined labels (e.g., "Decision Maker", "Technical Contact")
- **Association categories**: `HUBSPOT_DEFINED` or `USER_DEFINED`
- **Association type IDs**: Numeric identifiers for each association type

#### API Pattern for Associations

```json
{
  "associations": [
    {
      "to": { "id": 201 },
      "types": [
        {
          "associationCategory": "HUBSPOT_DEFINED",
          "associationTypeId": 16
        }
      ]
    }
  ]
}
```

### 1.3 Search API

The CRM Search API allows filtering, sorting, and searching across all objects.

#### Key Capabilities

- **Endpoint pattern**: `POST /crm/v3/objects/{objectType}/search`
- **Filter operators**: `EQ`, `NEQ`, `GT`, `GTE`, `LT`, `LTE`, `BETWEEN`, `IN`, `NOT_IN`, `HAS_PROPERTY`, `NOT_HAS_PROPERTY`, `CONTAINS_TOKEN`, `NOT_CONTAINS_TOKEN`
- **Filter groups**: Max 5 groups, 6 filters per group, 18 total filters
- **Sorting**: Single property sort, ascending/descending
- **Pagination**: Cursor-based with `after` parameter
- **Limits**: 200 results per page, 10,000 total results per query
- **Rate limit**: 5 requests/second/account

#### Search Request Example

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "annualrevenue",
          "operator": "GT",
          "value": "10000000"
        }
      ]
    }
  ],
  "sorts": [
    {
      "propertyName": "createdate",
      "direction": "DESCENDING"
    }
  ],
  "properties": ["name", "domain", "annualrevenue"],
  "limit": 50,
  "after": 0
}
```

### 1.4 Timeline / Engagements API

Activities are tracked on record timelines and include:

| Activity Type | Tracked Data |
|--------------|-------------|
| Calls | Duration, outcome, recording URL, body/notes |
| Emails | Subject, body, to/from/cc/bcc, thread ID, status |
| Meetings | Title, start/end time, attendees, location, body |
| Notes | Body content, attachments |
| Tasks | Subject, body, status, due date, priority, type |

#### Timeline Features

- Activities automatically associate with records
- Filter by activity type, date range, user
- Search within activity content (subject, body)
- Activity index pages for bulk management
- Recent activities (30-day limit on free plans)
- Expand/collapse all activities on a record

### 1.5 Pipeline API

Pipelines define the stages through which records progress.

#### Pipeline Structure

```json
{
  "pipelineId": "11348541",
  "label": "Sales Pipeline",
  "displayOrder": 0,
  "active": true,
  "stages": [
    {
      "stageId": "11348542",
      "label": "Appointment Scheduled",
      "displayOrder": 0,
      "metadata": {
        "isClosed": "false",
        "probability": "0.2"
      }
    },
    {
      "stageId": "11348543",
      "label": "Qualified to Buy",
      "displayOrder": 1,
      "metadata": {
        "isClosed": "false",
        "probability": "0.4"
      }
    }
  ]
}
```

#### Pipeline Features

- Multiple pipelines per object type (Pro/Enterprise)
- Each stage has: label, display order, probability (deals), open/closed status
- **Conditional stage properties**: Require specific data when entering a stage
- **Deal scoring**: AI-driven win prediction based on activities, amount, timing
- **Weighted forecasting**: Amount x Probability = Weighted amount
- **Approval processes**: Require approval before closing deals
- Supported objects: Deals, Tickets, Leads, Projects, custom objects

### 1.6 Owners / Users API

- **Owners**: Users who can be assigned to records
- **Teams**: Groups of users for organizational structure
- **Roles**: Permission sets controlling access to features
- **User permissions**: Granular control (view, edit, delete per object)
- **Team-level access**: "Team only" permissions for pipeline isolation
- **Shared access**: Additional users/teams can be granted record access

---

## 2. HubSpot Property System

### 2.1 Property Types and Field Types

Every property has a `type` (data type) and `fieldType` (UI representation).

| Type | Field Types | Description |
|------|------------|-------------|
| `string` | `text`, `textarea`, `phonenumber`, `html`, `file` | Text-based values |
| `number` | `number` | Numeric values (integer or decimal) |
| `date` | `date` | Date values (YYYY-MM-DD) |
| `datetime` | `date` | Date + time values |
| `enumeration` | `select`, `radio`, `checkbox`, `booleancheckbox` | Fixed option sets |
| `bool` | `booleancheckbox` | True/false values |
| `number` | `calculation_equation` | Computed values from formulas |

### 2.2 Property Groups

- Properties are organized into **groups** for UI organization
- Each group has a `name`, `label`, and `displayOrder`
- Default groups: Contact Information, Email Information, Social Media, etc.
- Custom groups can be created per object type
- Groups control how properties appear on record pages and forms

### 2.3 Calculated Properties

Calculation properties derive values from other properties on the same record:

| Calculation Type | Description | Example |
|-----------------|-------------|---------|
| **Time Between** | Duration between two date properties | Days between create and close |
| **Time Since** | Duration from a date to today | Days since last contact |
| **Custom Equation** | Free-form formula | `amount * quantity * (1 - discount)` |
| **Rollup** | Aggregate across associated records | Sum of all line item amounts |

#### Formula Capabilities

- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logic: `AND`, `OR`, `NOT`, `IF/THEN/ELSE`
- Functions: `min()`, `max()`, `count()`, `sum()`, `average()`
- Output types: Number, Boolean, String, Date, DateTime
- AI-generated formulas supported

### 2.4 Validation Rules

Property validation rules enforce data quality:

| Rule Type | Applies To | Example |
|-----------|-----------|---------|
| `ALPHANUMERIC` | Text fields | `NUMERIC_ONLY` for zip codes |
| `MIN_NUMBER` | Number fields | Minimum value of 1 |
| `MAX_NUMBER` | Number fields | Maximum value of 100 |
| `MIN_LENGTH` | Text fields | At least 3 characters |
| `MAX_LENGTH` | Text fields | No more than 255 characters |
| `REGEX` | Text fields | Custom pattern matching |
| `REQUIRED` | Any field | Must have a value |
| `UNIQUE` | Any field | No duplicate values |

#### Validation API (New in 2025)

```
GET /crm/v3/property-validations/{objectTypeId}
GET /crm/v3/property-validations/{objectTypeId}/{propertyName}
```

### 2.5 Property Limits

| Plan | Custom Properties per Object | Custom Objects |
|------|------------------------------|---------------|
| Free | 10 total across all objects | 0 |
| Starter | 1,000 per object | 0 |
| Professional | 1,000 per object | 10 |
| Enterprise | 1,000 per object | 10 |

### 2.6 Key Property Behaviors

- **Internal names are permanent** -- cannot be renamed after creation
- **Dropdown internal values are permanent** -- display labels are editable
- **Changing field type can invalidate existing data** -- export first
- **Score and Calculation types cannot be converted** to other types
- **Archived properties** are hidden from views but preserved
- **Sensitive data levels**: `non_sensitive`, `sensitive`, `highly_sensitive`

---

## 3. Database Schema Design for CRM

### 3.1 Flexible Property Storage: Approach Comparison

This is the most critical architectural decision for a CRM.

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **JSONB Column** | Flexible, fast reads, GIN indexing, simple queries | Weak type safety, no FK constraints on values, harder to validate | Rapid development, moderate scale |
| **EAV (Entity-Attribute-Value)** | Strong typing, per-field indexing, familiar relational | Complex JOINs, slow for wide reads, many tables | Legacy systems, extreme flexibility |
| **Hybrid (Fixed + JSONB)** | Best of both worlds, type safety for core fields, flexibility for custom | More complex migration story | **RECOMMENDED for F-CORE** |

### 3.2 Recommended Hybrid Schema

```sql
-- Core CRM table with fixed columns for standard properties
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Fixed standard properties (indexed, type-safe)
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  company_name VARCHAR(255),
  lifecycle_stage VARCHAR(50) DEFAULT 'subscriber',
  lead_status VARCHAR(50),
  owner_id UUID REFERENCES users(id),

  -- Flexible custom properties (JSONB)
  custom_properties JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,  -- Soft delete
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  UNIQUE(tenant_id, email)
);

-- Index strategies
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(tenant_id, email);
CREATE INDEX idx_contacts_owner ON contacts(tenant_id, owner_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(tenant_id, lifecycle_stage);
CREATE INDEX idx_contacts_created ON contacts(tenant_id, created_at DESC);
CREATE INDEX idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_custom_props ON contacts USING GIN(custom_properties);
```

### 3.3 Property Definition Table

```sql
-- Property definitions (schema for custom fields)
CREATE TABLE property_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  object_type VARCHAR(50) NOT NULL,  -- 'contact', 'company', 'deal', etc.

  -- Property identity
  internal_name VARCHAR(255) NOT NULL,  -- Immutable after creation
  label VARCHAR(255) NOT NULL,
  description TEXT,
  group_name VARCHAR(255) DEFAULT 'custom_properties',

  -- Type system
  property_type VARCHAR(50) NOT NULL,  -- 'string', 'number', 'date', 'enumeration', 'bool'
  field_type VARCHAR(50) NOT NULL,     -- 'text', 'textarea', 'select', 'checkbox', 'date', 'number'

  -- Options (for enumeration types)
  options JSONB DEFAULT '[]',
  -- Format: [{"label": "Option 1", "value": "opt1", "displayOrder": 0}]

  -- Validation
  is_required BOOLEAN DEFAULT FALSE,
  is_unique BOOLEAN DEFAULT FALSE,
  validation_rules JSONB DEFAULT '{}',
  -- Format: {"min": 0, "max": 100, "regex": "^[A-Z]+$"}

  -- Calculation (for calculated properties)
  calculation_formula TEXT,

  -- Display
  display_order INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT TRUE,

  -- System
  is_system BOOLEAN DEFAULT FALSE,  -- true for built-in properties
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, object_type, internal_name)
);
```

### 3.4 Association Tables

```sql
-- Generic association table for object-to-object links
CREATE TABLE associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- From side
  from_object_type VARCHAR(50) NOT NULL,
  from_object_id UUID NOT NULL,

  -- To side
  to_object_type VARCHAR(50) NOT NULL,
  to_object_id UUID NOT NULL,

  -- Association metadata
  association_type VARCHAR(100) NOT NULL DEFAULT 'default',
  label VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Prevent duplicates
  UNIQUE(tenant_id, from_object_type, from_object_id, to_object_type, to_object_id, association_type)
);

CREATE INDEX idx_assoc_from ON associations(tenant_id, from_object_type, from_object_id);
CREATE INDEX idx_assoc_to ON associations(tenant_id, to_object_type, to_object_id);
```

### 3.5 Pipeline & Stage Schema

```sql
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  object_type VARCHAR(50) NOT NULL,  -- 'deal', 'ticket', 'lead'
  label VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, object_type, label)
);

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,  -- For deal stages
  probability DECIMAL(3,2) DEFAULT 0.0,  -- 0.00 to 1.00

  -- Conditional properties required at this stage
  required_properties JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### 3.6 Activity / Timeline Schema

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Activity type
  activity_type VARCHAR(50) NOT NULL,  -- 'call', 'email', 'meeting', 'note', 'task'

  -- Common fields
  subject VARCHAR(500),
  body TEXT,
  owner_id UUID REFERENCES users(id),

  -- Type-specific data (JSONB for flexibility)
  metadata JSONB DEFAULT '{}',
  -- Call: {duration, outcome, recording_url, direction}
  -- Email: {from, to, cc, bcc, thread_id, status}
  -- Meeting: {start_time, end_time, location, attendees}
  -- Task: {due_date, priority, status, task_type}

  -- Timestamps
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_activities_tenant ON activities(tenant_id, activity_date DESC);
CREATE INDEX idx_activities_type ON activities(tenant_id, activity_type, activity_date DESC);
CREATE INDEX idx_activities_owner ON activities(tenant_id, owner_id, activity_date DESC);
```

### 3.7 Multi-Tenancy Pattern

**Recommendation: Row-Level Security (RLS) with `tenant_id` column**

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| Schema-per-tenant | Strong isolation, simple queries | Operational nightmare at scale, migration complexity | NOT recommended |
| Row-level with `tenant_id` | Scales well, simple ops, works with Supabase RLS | Requires discipline, index overhead | **RECOMMENDED** |
| Database-per-tenant | Maximum isolation | Extremely expensive, unmanageable | NOT recommended |

### 3.8 Soft Delete Pattern

```sql
-- Always use soft delete for CRM entities
-- Add to all entity tables:
deleted_at TIMESTAMPTZ,

-- Create partial index for active records only
CREATE INDEX idx_contacts_active ON contacts(tenant_id, created_at)
  WHERE deleted_at IS NULL;

-- Default query pattern: always filter soft deletes
SELECT * FROM contacts
WHERE tenant_id = $1 AND deleted_at IS NULL;
```

### 3.9 Audit Logging

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,

  -- What changed
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

  -- Change data (JSONB)
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],

  -- Who/when
  user_id UUID,
  user_email VARCHAR(255),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month for performance
-- CREATE TABLE audit_log_2026_02 PARTITION OF audit_log
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE INDEX idx_audit_table ON audit_log(tenant_id, table_name, created_at DESC);
CREATE INDEX idx_audit_record ON audit_log(tenant_id, table_name, record_id);
CREATE INDEX idx_audit_user ON audit_log(tenant_id, user_id, created_at DESC);

-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, table_name, record_id, operation, new_data, user_id, created_at)
    VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW),
            current_setting('app.current_user_id', true)::UUID, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tenant_id, table_name, record_id, operation, old_data, new_data,
                           changed_fields, user_id, created_at)
    VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
            ARRAY(SELECT key FROM jsonb_each(to_jsonb(OLD)) AS o(key, value)
                  FULL OUTER JOIN jsonb_each(to_jsonb(NEW)) AS n(key, value) USING (key)
                  WHERE o.value IS DISTINCT FROM n.value),
            current_setting('app.current_user_id', true)::UUID, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tenant_id, table_name, record_id, operation, old_data, user_id, created_at)
    VALUES (OLD.tenant_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD),
            current_setting('app.current_user_id', true)::UUID, NOW());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Next.js CRM Architecture

### 4.1 App Router Architecture

**Recommendation: App Router (not Pages Router)** -- required for Server Components, streaming, layouts.

#### Directory Structure

```
src/
  app/                          # Routing layer ONLY
    (auth)/                     # Auth route group
      login/page.tsx
      signup/page.tsx
      layout.tsx
    (dashboard)/                # Dashboard route group
      layout.tsx                # Shared dashboard layout (sidebar, header)
      contacts/
        page.tsx                # Contact list (Server Component)
        [id]/
          page.tsx              # Contact detail (Server Component)
          @sidebar/default.tsx  # Parallel route for sidebar
        new/page.tsx            # Create contact form
      companies/
        page.tsx
        [id]/page.tsx
      deals/
        page.tsx                # Deal list view
        board/page.tsx          # Kanban board view
        [id]/page.tsx
      tickets/
        page.tsx
        [id]/page.tsx
      settings/
        page.tsx
        properties/page.tsx
        pipelines/page.tsx
        users/page.tsx
      loading.tsx               # Shared loading state
      error.tsx                 # Shared error boundary
    api/                        # API routes (if needed beyond Server Actions)
      contacts/route.ts
      companies/route.ts
      deals/route.ts
    layout.tsx                  # Root layout
    page.tsx                    # Landing page

  components/                   # Shared UI components
    ui/                         # shadcn/ui base components
    layout/                     # Layout components (Sidebar, Header)
    contacts/                   # Contact-specific components
    deals/                      # Deal-specific components
    common/                     # Shared CRM components (PropertyField, Timeline)

  lib/                          # Utilities and configurations
    supabase/
      client.ts                 # Browser Supabase client
      server.ts                 # Server Supabase client
      middleware.ts             # Auth middleware helpers
    validations/                # Zod schemas
    utils.ts                    # General utilities

  hooks/                        # Custom React hooks
  types/                        # TypeScript type definitions
  actions/                      # Server Actions
```

### 4.2 Server vs. Client Component Strategy

| Component Type | Render On | Use For |
|---------------|-----------|---------|
| **Server Component** (default) | Server | Data fetching, SEO pages, layouts, list views, record detail pages |
| **Client Component** (`"use client"`) | Client | Forms, drag-and-drop (Kanban), interactive tables (sorting/filtering), modals, real-time features |

#### Key Principles

1. **Layouts stay as Server Components** -- avoid `"use client"` in layouts
2. **Push `"use client"` to leaf components** -- wrap only interactive parts
3. **Server Components fetch data** -- pass data down as props to client components
4. **Use Suspense boundaries** for streaming and loading states

#### Example: Contact List Page

```tsx
// app/(dashboard)/contacts/page.tsx -- SERVER COMPONENT
import { createClient } from '@/lib/supabase/server';
import { ContactsTable } from '@/components/contacts/ContactsTable';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = Number(params.page) || 1;
  const pageSize = 25;

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (params.q) {
    query = query.or(
      `first_name.ilike.%${params.q}%,last_name.ilike.%${params.q}%,email.ilike.%${params.q}%`
    );
  }

  const { data: contacts, count } = await query;

  return (
    <div>
      <h1>Contacts</h1>
      {/* ContactsTable is a client component for interactivity */}
      <ContactsTable
        contacts={contacts ?? []}
        totalCount={count ?? 0}
        currentPage={page}
        pageSize={pageSize}
      />
    </div>
  );
}
```

### 4.3 Data Fetching Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Server Component fetch** | Initial page load, SEO content | Direct Supabase query in component |
| **Server Actions** | Form submissions, mutations | `"use server"` functions with `revalidatePath()` |
| **React Query (TanStack Query)** | Client-side caching, real-time updates | `useQuery` with Supabase client |
| **SWR** | Lightweight client-side fetching | Alternative to React Query |
| **Supabase Realtime** | Live updates (deal movements, notifications) | `supabase.channel().on()` |

#### Server Action Example

```tsx
// actions/contacts.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { contactSchema } from '@/lib/validations/contact';

export async function createContact(formData: FormData) {
  const supabase = await createClient();

  const raw = Object.fromEntries(formData.entries());
  const validated = contactSchema.parse(raw);

  const { data, error } = await supabase
    .from('contacts')
    .insert(validated)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/contacts');
  return data;
}
```

### 4.4 Authentication Pattern

```tsx
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}
```

### 4.5 Real-time Updates

```tsx
// Client component for real-time deal board updates
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeDeals(onDealChange: (payload: any) => void) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        (payload) => onDealChange(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onDealChange]);
}
```

---

## 5. Supabase-Specific Patterns

### 5.1 Row Level Security (RLS) for Multi-Tenancy

```sql
-- Enable RLS on all CRM tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Organization-based multi-tenancy
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_members (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',  -- 'owner', 'admin', 'member', 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- RLS Policy: Users can only see their organization's data
CREATE POLICY "tenant_isolation" ON contacts
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Performance: Index columns used in RLS policies
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
```

#### RLS Best Practices

1. **Enable RLS from day one** -- never leave it for later
2. **Use `(SELECT auth.uid())` form** -- helps Postgres treat as stable for query plan
3. **Index all columns used in policies** -- critical for performance
4. **Use custom JWT claims** for tenant_id to avoid subqueries
5. **Test with different users** via Supabase dashboard
6. **Combine RLS with backend API checks** for complex apps

### 5.2 Supabase Auth Integration

Use `@supabase/ssr` package (NOT legacy `auth-helpers`):

```tsx
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Called from Server Component */ }
        },
      },
    }
  );
}
```

### 5.3 Supabase Storage

```tsx
// File upload for CRM attachments
const { data, error } = await supabase.storage
  .from('crm-attachments')
  .upload(`${tenantId}/${recordId}/${fileName}`, file);

// Storage RLS policies
CREATE POLICY "Users upload to their org folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'crm-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::TEXT FROM org_members
      WHERE user_id = (SELECT auth.uid())
    )
  );
```

### 5.4 Database Functions for Computed Fields

```sql
-- Trigger to auto-update weighted_amount on deals
CREATE OR REPLACE FUNCTION update_deal_weighted_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.weighted_amount := COALESCE(NEW.amount, 0) * COALESCE(
    (SELECT probability FROM pipeline_stages WHERE id = NEW.stage_id), 0
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_weighted_amount
  BEFORE INSERT OR UPDATE OF amount, stage_id ON deals
  FOR EACH ROW EXECUTE FUNCTION update_deal_weighted_amount();
```

### 5.5 Full-Text Search

```sql
-- Add search vector column
ALTER TABLE contacts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(first_name, '') || ' ' ||
      COALESCE(last_name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(phone, '') || ' ' ||
      COALESCE(company_name, '')
    )
  ) STORED;

CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vector);

-- Query
SELECT * FROM contacts
WHERE tenant_id = $1
  AND deleted_at IS NULL
  AND search_vector @@ plainto_tsquery('english', $2)
ORDER BY ts_rank(search_vector, plainto_tsquery('english', $2)) DESC;
```

### 5.6 Edge Functions

Use for background tasks that should not block the UI:

- Sending notification emails
- Webhook processing
- Data enrichment (company info lookup)
- Report generation
- Scheduled tasks (deal stage aging alerts)

```typescript
// supabase/functions/enrich-company/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  const { companyDomain } = await req.json();

  // Call external API for company data
  const enriched = await fetch(`https://api.clearbit.com/v2/companies/find?domain=${companyDomain}`);
  const data = await enriched.json();

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Note**: Edge Function cold starts are 200-400ms. Implement warming strategies for latency-sensitive endpoints.

---

## 6. Key Libraries & Tools

### 6.1 UI Component Library

| Library | Recommendation | Rationale |
|---------|---------------|-----------|
| **shadcn/ui** | **PRIMARY CHOICE** | Copy-paste ownership, Radix UI primitives, Tailwind CSS, most popular in 2025-2026, massive community |
| Radix UI | Foundation (via shadcn) | Headless accessible primitives |
| Kibo UI | Supplementary | Specialized components via shadcn registry |

shadcn/ui advantages for CRM:
- Full code ownership (no dependency lock-in)
- Accessible by default (Radix primitives)
- Easy to customize for CRM-specific patterns
- Excellent dark mode support
- Active community with frequent updates

### 6.2 Data Table

| Library | Stars | Bundle Size | Recommendation |
|---------|-------|-------------|----------------|
| **TanStack Table v8** | 26k+ | ~15KB | **PRIMARY CHOICE** |
| AG Grid | Enterprise | ~300KB | Overkill for MVP |
| MUI DataGrid | Part of MUI | ~200KB | Wrong ecosystem |

TanStack Table features for CRM:
- Headless (works with shadcn/ui)
- Column sorting, filtering, grouping
- Row selection (bulk actions)
- Column pinning, resizing, reordering
- Pagination (client and server)
- Row expansion
- Full TypeScript support
- Virtual scrolling integration with TanStack Virtual

### 6.3 Kanban / Drag-and-Drop

| Library | Stars | Status | Recommendation |
|---------|-------|--------|----------------|
| **dnd-kit** | 13k+ | Active | **PRIMARY CHOICE** |
| react-beautiful-dnd | 33k+ | Deprecated (Atlassian) | NOT recommended |
| @hello-pangea/dnd | 8k+ | Fork of rbd | Backup option |
| pragmatic-drag-and-drop | ~5k | New (Atlassian) | Consider for future |

dnd-kit advantages:
- Modern, accessible, performant
- Touch support, keyboard support
- Works with Next.js App Router
- Sortable, droppable, multiple containers
- Excellent for Kanban board implementation
- No deprecated dependencies

### 6.4 Form Management

| Library | Downloads | Recommendation |
|---------|-----------|----------------|
| **React Hook Form** | 8.1M/week | **PRIMARY CHOICE** |
| TanStack Form | 115k/week | Rising alternative |
| Formik | 2.9M/week | Legacy, declining |

React Hook Form + Zod integration:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  lifecycleStage: z.enum(['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer']),
});

type ContactForm = z.infer<typeof contactSchema>;
```

### 6.5 Date Handling

| Library | Recommendation | Rationale |
|---------|---------------|-----------|
| **date-fns** | **PRIMARY CHOICE** | Tree-shakable, immutable, comprehensive |
| dayjs | Alternative | Lighter but less tree-shakable |
| Luxon | Too heavy | Moment.js successor, large bundle |

### 6.6 Charts & Reporting

| Library | Stars | Best For | Recommendation |
|---------|-------|----------|----------------|
| **Recharts** | 24k+ | Standard charts | **PRIMARY CHOICE** |
| Chart.js (react-chartjs-2) | 65k+ | Simple charts | Backup |
| Nivo | 13k+ | Advanced dataviz | For complex reports |
| Tremor | 16k+ | Dashboard components | Consider for dashboards |

Recharts advantages for CRM dashboards:
- Built on D3.js, React-native
- Responsive, composable
- Good TypeScript support
- Works well with shadcn/ui styling
- Chart types: Line, Bar, Area, Pie, Radar, Funnel, Treemap

### 6.7 State Management

| Library | Use Case | Recommendation |
|---------|----------|----------------|
| **TanStack Query** | Server state (API caching) | **REQUIRED** |
| **Zustand** | Client-side global state | **PRIMARY CHOICE** |
| Jotai | Atomic state (fine-grained) | Alternative to Zustand |
| React Context | Simple shared state | Built-in, for theme/auth |

#### Architecture

```
Server State (API data) -> TanStack Query
  - Contacts list, deal data, pipeline config
  - Automatic caching, refetching, optimistic updates

Client State (UI state) -> Zustand
  - Sidebar open/close
  - Selected filters
  - Active modal
  - Kanban column order

Simple Shared State -> React Context
  - Current user / auth
  - Theme (light/dark)
  - Tenant context
```

### 6.8 Rich Text Editor

| Library | Stars | Recommendation |
|---------|-------|----------------|
| **Tiptap** | 30k+ | **PRIMARY CHOICE** |
| Plate | 12k+ | shadcn-native alternative |
| Lexical | 20k+ | Meta's editor, lower-level |

Tiptap advantages:
- Headless, works with any UI framework
- Excellent shadcn/ui integration (community components available)
- Extensions: mentions, links, images, tables, code blocks
- Collaboration-ready (Y.js integration)
- Perfect for email drafts, note-taking, ticket descriptions

### 6.9 Notifications / Toasts

| Library | Recommendation |
|---------|----------------|
| **Sonner** | **PRIMARY CHOICE** -- elegant, lightweight, shadcn integration |

### 6.10 Animations

| Library | Recommendation |
|---------|----------------|
| **Framer Motion** (now `motion`) | For complex animations, page transitions |
| CSS transitions | For simple hover/focus effects |

### 6.11 Complete Recommended Stack

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",

    "tailwindcss": "^4.0.0",
    "@radix-ui/react-*": "latest",

    "@tanstack/react-table": "^8.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-virtual": "^3.0.0",

    "@dnd-kit/core": "latest",
    "@dnd-kit/sortable": "latest",

    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "latest",
    "zod": "^3.0.0",

    "zustand": "^5.0.0",
    "date-fns": "^4.0.0",
    "recharts": "^2.0.0",

    "@tiptap/react": "latest",
    "@tiptap/starter-kit": "latest",

    "sonner": "latest",
    "motion": "latest",
    "lucide-react": "latest",

    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

---

## 7. Performance Considerations

### 7.1 Pagination Strategy

| Strategy | When to Use | Performance |
|----------|-------------|-------------|
| **Cursor-based** | Default for all lists | O(1) -- constant regardless of page depth |
| Offset-based | Simple admin views, small datasets | Degrades at high offsets |
| Keyset pagination | Alternative cursor approach | O(1) with composite keys |

**Recommendation**: Cursor-based pagination for all CRM object lists.

```sql
-- Cursor-based pagination (17x faster than offset at depth)
SELECT * FROM contacts
WHERE tenant_id = $1
  AND deleted_at IS NULL
  AND (created_at, id) < ($cursor_date, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 25;
```

```tsx
// Supabase cursor pagination
const { data } = await supabase
  .from('contacts')
  .select('*')
  .is('deleted_at', null)
  .lt('created_at', cursorDate)
  .order('created_at', { ascending: false })
  .limit(25);
```

### 7.2 Virtual Scrolling

Use TanStack Virtual for lists with 100+ items:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function ContactList({ contacts }: { contacts: Contact[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Row height
    overscan: 10,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ContactRow contact={contacts[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 7.3 Optimistic Updates

Critical for drag-and-drop (Kanban board) and inline editing:

```tsx
// Using TanStack Query optimistic updates
const mutation = useMutation({
  mutationFn: updateDealStage,
  onMutate: async (newDeal) => {
    await queryClient.cancelQueries({ queryKey: ['deals'] });
    const previousDeals = queryClient.getQueryData(['deals']);

    // Optimistically update
    queryClient.setQueryData(['deals'], (old: Deal[]) =>
      old.map(d => d.id === newDeal.id ? { ...d, ...newDeal } : d)
    );

    return { previousDeals };
  },
  onError: (err, newDeal, context) => {
    // Rollback on error
    queryClient.setQueryData(['deals'], context?.previousDeals);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
  },
});
```

### 7.4 Debounced Search

```tsx
import { useDeferredValue, useState } from 'react';

function ContactSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);

  // Use deferredSearch for API calls -- React handles debouncing
  const { data } = useQuery({
    queryKey: ['contacts', 'search', deferredSearch],
    queryFn: () => searchContacts(deferredSearch),
    enabled: deferredSearch.length >= 2,
  });

  return <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
}
```

### 7.5 Caching Strategy

| Layer | Tool | TTL | Use Case |
|-------|------|-----|----------|
| **Client cache** | TanStack Query | 5 min (staleTime) | API response caching |
| **Next.js cache** | `unstable_cache` / fetch cache | Varies | Server component data |
| **Database** | PostgreSQL query cache | Automatic | Query plan caching |
| **CDN** | Vercel Edge | Static assets | Static assets, images |

```tsx
// TanStack Query caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes garbage collection
      refetchOnWindowFocus: false,     // Don't refetch on tab switch
      retry: 2,                        // Retry failed requests twice
    },
  },
});
```

### 7.6 Image / Avatar Optimization

```tsx
// Use Next.js Image component for avatars
import Image from 'next/image';

function Avatar({ src, name }: { src?: string; name: string }) {
  if (!src) {
    // Generate initials avatar
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs">{initials}</div>;
  }
  return <Image src={src} alt={name} width={32} height={32} className="rounded-full" />;
}
```

### 7.7 Bundle Size Management

- Use dynamic imports for heavy components (charts, rich text editor, kanban)
- Tree-shake unused shadcn/ui components (only import what you use)
- Use `next/dynamic` with `ssr: false` for client-only components
- Monitor with `@next/bundle-analyzer`

```tsx
import dynamic from 'next/dynamic';

const KanbanBoard = dynamic(
  () => import('@/components/deals/KanbanBoard'),
  { ssr: false, loading: () => <KanbanSkeleton /> }
);

const RichTextEditor = dynamic(
  () => import('@/components/common/RichTextEditor'),
  { ssr: false, loading: () => <TextareaSkeleton /> }
);
```

---

## 8. Security Considerations

### 8.1 OWASP Top 10 for CRM Applications

| Risk | Mitigation | Implementation |
|------|-----------|----------------|
| **Broken Access Control** (#1) | RLS + middleware auth + API checks | Supabase RLS policies, Next.js middleware |
| **Cryptographic Failures** | HTTPS everywhere, encrypt at rest | Supabase handles TLS, field-level encryption for PII |
| **Injection** | Parameterized queries, input validation | Supabase client (parameterized), Zod schemas |
| **Insecure Design** | Threat modeling, secure defaults | RLS enabled by default, principle of least privilege |
| **Security Misconfiguration** | Secure defaults, remove debug | Production env config, disable verbose errors |
| **Vulnerable Components** | Keep dependencies updated | `npm audit`, Dependabot |
| **Authentication Failures** | MFA, session management | Supabase Auth with MFA support |
| **Data Integrity Failures** | Verify data sources, validate imports | Zod validation on all inputs |
| **Security Logging Failures** | Comprehensive audit log | Audit trigger on all CRM tables |
| **SSRF** | Validate URLs, whitelist domains | Restrict outbound requests |

### 8.2 Input Validation with Zod

```tsx
import { z } from 'zod';

// Contact validation schema
export const contactSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(255, 'First name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Invalid characters'),
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(255, 'Last name too long'),
  email: z.string()
    .email('Invalid email address')
    .max(255),
  phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  lifecycle_stage: z.enum([
    'subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist'
  ]).default('subscriber'),
  custom_properties: z.record(z.unknown()).default({}),
});

// Deal validation schema
export const dealSchema = z.object({
  deal_name: z.string().min(1).max(500),
  amount: z.number().min(0).max(999999999).optional(),
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  close_date: z.string().datetime().optional(),
  owner_id: z.string().uuid().optional(),
});

// Validate in Server Action
export async function createContact(formData: FormData) {
  'use server';
  const raw = Object.fromEntries(formData.entries());
  const result = contactSchema.safeParse(raw);

  if (!result.success) {
    return { error: result.error.flatten() };
  }

  // Proceed with validated data
  const validated = result.data;
  // ...
}
```

### 8.3 CSRF Protection

Next.js App Router provides built-in CSRF protection via:

- **SameSite cookies**: `Lax` by default (Supabase auth cookies)
- **Server Actions**: Automatically validated by Next.js
- **Origin checking**: Verify `Origin` header on API routes

```tsx
// Additional CSRF protection for API routes
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];

  if (!origin || !allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Process request...
}
```

### 8.4 Rate Limiting

```tsx
// Simple rate limiter using in-memory store (use Redis in production)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
  analytics: true,
});

// In API route or middleware
const identifier = user.id || ip;
const { success, limit, remaining } = await ratelimit.limit(identifier);

if (!success) {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
    },
  });
}
```

### 8.5 RBAC Implementation

```sql
-- Role definitions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,  -- 'super_admin', 'admin', 'sales_manager', 'sales_rep', 'viewer'
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Permission structure
-- {
--   "contacts": { "view": true, "create": true, "edit": true, "delete": false },
--   "companies": { "view": true, "create": true, "edit": true, "delete": false },
--   "deals": { "view": true, "create": true, "edit": "own", "delete": false },
--   "settings": { "view": false, "manage": false },
--   "users": { "view": true, "invite": false, "manage": false }
-- }

-- Assign roles to org members
ALTER TABLE org_members ADD COLUMN role_id UUID REFERENCES roles(id);
```

```tsx
// Permission check utility
type Permission = 'view' | 'create' | 'edit' | 'delete' | 'manage';
type Resource = 'contacts' | 'companies' | 'deals' | 'tickets' | 'settings' | 'users';

export function hasPermission(
  userPermissions: Record<string, Record<string, boolean | string>>,
  resource: Resource,
  action: Permission,
  ownerId?: string,
  currentUserId?: string
): boolean {
  const resourcePerms = userPermissions[resource];
  if (!resourcePerms) return false;

  const perm = resourcePerms[action];
  if (perm === true) return true;
  if (perm === 'own' && ownerId === currentUserId) return true;
  return false;
}
```

### 8.6 API Key Management

- Store all secrets in environment variables (never in code)
- Use Supabase's service role key only in server-side code
- Never expose the service role key to the client
- Use the anon key (publishable key) for client-side operations
- Rotate keys periodically
- Use Supabase Edge Function secrets for third-party API keys

### 8.7 Data Encryption

| Data Type | Encryption | Method |
|-----------|-----------|--------|
| Data in transit | TLS 1.3 | Supabase provides by default |
| Data at rest | AES-256 | Supabase/PostgreSQL TDE |
| PII fields | Field-level | `pgcrypto` extension |
| Backups | Encrypted | Supabase handles |
| File uploads | Encrypted at rest | Supabase Storage |

```sql
-- Field-level encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt
UPDATE contacts SET ssn = pgp_sym_encrypt(ssn_plain, current_setting('app.encryption_key'))
WHERE id = $1;

-- Decrypt
SELECT pgp_sym_decrypt(ssn::bytea, current_setting('app.encryption_key')) as ssn
FROM contacts WHERE id = $1;
```

---

## 9. Recommended Architecture Summary

### 9.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | Next.js (App Router) | 16.x |
| **Language** | TypeScript (Strict) | 5.x |
| **UI Components** | shadcn/ui + Radix UI | Latest |
| **Styling** | Tailwind CSS | v4 |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth | `@supabase/ssr` |
| **Data Table** | TanStack Table | v8 |
| **Drag & Drop** | dnd-kit | Latest |
| **Forms** | React Hook Form + Zod | v7 / v3 |
| **Server State** | TanStack Query | v5 |
| **Client State** | Zustand | v5 |
| **Charts** | Recharts | v2 |
| **Rich Text** | Tiptap | Latest |
| **Date Handling** | date-fns | v4 |
| **Notifications** | Sonner | Latest |
| **Icons** | Lucide React | Latest |
| **Deployment** | Vercel | Latest |

### 9.2 Architecture Diagram (Text)

```
                            [Vercel Edge Network]
                                     |
                    [Next.js App Router (Edge/Node)]
                           /          |          \
                  [Server         [Server       [API Routes]
                 Components]      Actions]           |
                      |              |          [Rate Limiter]
                      v              v               |
              [Supabase Client - @supabase/ssr]      |
                           |                         |
                    [Supabase Auth]                   |
                           |                         |
              [PostgreSQL + RLS Policies]  <---------+
                    /      |      \
           [CRM Tables] [Audit Log] [Storage]
                    |        |          |
            [Realtime     [Edge      [CDN]
            Subscriptions] Functions]
```

### 9.3 Data Flow Summary

1. **Read Path**: Server Component -> Supabase Server Client -> PostgreSQL (RLS filtered) -> Render HTML -> Stream to Client
2. **Write Path**: Client Form -> Server Action -> Zod Validation -> Supabase Insert -> Audit Trigger -> Revalidate Path -> Re-render
3. **Real-time Path**: Database Change -> Supabase Realtime -> Client Subscription -> React State Update -> Re-render Component
4. **Search Path**: Client Input -> Debounce -> TanStack Query -> Supabase Full-Text Search -> Render Results

### 9.4 Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Property storage | Hybrid (fixed + JSONB) | Type safety for standard fields, flexibility for custom |
| Multi-tenancy | Row-level with RLS | Scales well, native Supabase support |
| Pagination | Cursor-based | Consistent O(1) performance at any depth |
| State management | TanStack Query + Zustand | Server vs client state separation |
| Soft delete | `deleted_at` column | Data preservation, audit compliance |
| Audit logging | Database triggers | Automatic, tamper-proof, no code changes needed |
| Auth strategy | Supabase Auth + SSR cookies | Secure, no client-side tokens, edge-compatible |
| API pattern | Server Actions + API routes | Server Actions for forms, API routes for external integrations |

### 9.5 Implementation Priority

| Phase | Features | Duration |
|-------|----------|----------|
| **Phase 1: Foundation** | Auth, tenants, RBAC, contacts CRUD, table view | 2-3 weeks |
| **Phase 2: Core CRM** | Companies, deals, pipelines, Kanban board | 2-3 weeks |
| **Phase 3: Activities** | Notes, tasks, timeline, email logging | 2 weeks |
| **Phase 4: Relationships** | Associations, linked records, custom properties | 2 weeks |
| **Phase 5: Search & Filter** | Full-text search, advanced filters, saved views | 1-2 weeks |
| **Phase 6: Reporting** | Dashboards, charts, deal forecasting | 2 weeks |
| **Phase 7: Polish** | Real-time updates, notifications, mobile responsive | 2 weeks |

---

## References

### HubSpot Documentation
- [CRM Object APIs](https://developers.hubspot.com/docs/guides/crm/using-object-apis)
- [Associations v4 API](https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide)
- [Properties API](https://developers.hubspot.com/docs/api-reference/crm-properties-v3/guide)
- [CRM Search API](https://developers.hubspot.com/docs/api-reference/search/guide)
- [Pipelines API](https://developers.hubspot.com/docs/api-reference/crm-pipelines-v3/guide)
- [Property Validation Rules](https://knowledge.hubspot.com/properties/set-validation-rules-for-properties)
- [Data Model Builder](https://knowledge.hubspot.com/data-management/use-the-data-model-builder)

### Database Architecture
- [Multi-Tenant CRM Schema Design: Typed Columns vs JSONB](https://www.rushikeshg.xyz/blog/multi-tenant-crm-schema)
- [Production-Ready Audit Logs in PostgreSQL](https://medium.com/@sehban.alam/lets-build-production-ready-audit-logs-in-postgresql)
- [Multi-tenant Architectures on PostgreSQL](https://mounick.medium.com/multi-tenant-architectures-on-postgresql-lessons-learned)

### Next.js Architecture
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Feature-Sliced Design with Next.js App Router](https://feature-sliced.design/blog/nextjs-app-router-guide)
- [Composition, Caching, and Architecture in Modern Next.js (Vercel)](https://www.youtube.com/watch?v=iRGc8KQDyQ8)

### Supabase
- [Supabase RLS Best Practices](https://www.rajeshdhiman.in/blog/supabase-rls-simplified-using-vs-with-check)
- [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices)
- [Supabase + Next.js Auth](https://hackceleration.com/supabase-review/)

### Security
- [OWASP Top 10 (2025)](https://www.mol-tech.us/blog/owasp-2025-updates-developer-guide)
- [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [RBAC Guide](https://buildwithfern.com/post/rbac-role-based-access-control-guide)
- [API Security Guide](https://www.aikido.dev/blog/api-security-guide)

### Performance
- [Cursor Pagination Deep Dive](https://www.milanjovanovic.tech/blog/understanding-cursor-pagination-and-why-its-so-fast-deep-dive)
- [Virtual Scrolling Guide](https://medium.com/@pddadson/mastering-virtualization-in-modern-web-development)

---

*Document generated by F-CORE Tech Research Agent on 2026-02-07*
