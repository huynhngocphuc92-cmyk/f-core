# Technical Research: CRM Property/Custom Fields System

> Research Date: 2026-02-08
> Researcher: Tech Research Team
> Project: F-CORE (HubSpot CRM Clone)
> Status: Complete

---

## Table of Contents

1. [Architecture Decision: JSONB vs EAV](#1-architecture-decision-jsonb-vs-eav)
2. [Dynamic Form Generation](#2-dynamic-form-generation)
3. [Property Validation with Zod](#3-property-validation-with-zod)
4. [Type-Safe Dynamic Fields](#4-type-safe-dynamic-fields)
5. [Property History Tracking](#5-property-history-tracking)
6. [Prisma + JSONB Querying](#6-prisma--jsonb-querying)
7. [Property Rendering Components](#7-property-rendering-components)
8. [Performance Considerations](#8-performance-considerations)
9. [Recommended File Structure](#9-recommended-file-structure)
10. [API Endpoint Specifications](#10-api-endpoint-specifications)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Architecture Decision: JSONB vs EAV

### Recommendation: Keep JSONB (Current Approach)

F-CORE currently uses `properties Json @default("{}")` on Contact, Company, and Deal models. This is the correct choice. Here is the full trade-off analysis:

### JSONB Advantages (Why We Keep It)

| Factor | JSONB | EAV |
|--------|-------|-----|
| **Query Complexity** | Simple: single column access | Complex: requires N self-joins to reconstruct a record |
| **Read Performance** | Fast: single row fetch gets all properties | Slow: must aggregate many rows per entity |
| **Storage Size** | ~78MB per 1M entities (benchmark) | ~171MB per 1M entities (benchmark) |
| **Count Aggregation** | 0.8s (benchmark) | 2.6s (benchmark) |
| **Sort with Filter** | 0.6s (benchmark) | 3.5s (benchmark) |
| **Schema Flexibility** | No DDL needed for new properties | No DDL needed |
| **Single Row Fetch** | 1ms | 16ms |
| **Prisma Support** | Native `Json` type with path-based filtering | Requires custom queries and manual joins |

### JSONB Limitations (And Mitigations)

| Limitation | Mitigation |
|-----------|------------|
| No column-level type enforcement | Application-layer validation via Zod (see Section 3) |
| No foreign key constraints on values | Validate references at API layer |
| Key duplication per row (storage) | Acceptable for CRM scale (~5-25 custom fields per object type) |
| Full JSONB rewrite on partial update | Use `jsonb_set()` via raw SQL for surgical updates when needed |
| Limited GIN index selectivity for `->>`  | Create expression B-tree indexes on frequently-queried property keys |

### When EAV Would Be Considered (Not Applicable to F-CORE)

- When a single entity has 1000+ attributes (e.g., LDAP group memberships)
- When per-attribute relational constraints are critical
- When attribute-level access control is needed at the DB level

### Indexing Strategy for JSONB Properties

For frequently-filtered custom properties, create expression indexes:

```sql
-- Example: Index on a custom property "lead_source" within the JSONB column
CREATE INDEX idx_contacts_lead_source
  ON "Contact" ((properties->>'lead_source'))
  WHERE deleted_at IS NULL;

-- GIN index for containment queries (@>)
CREATE INDEX idx_contacts_properties_gin
  ON "Contact" USING GIN (properties jsonb_path_ops)
  WHERE deleted_at IS NULL;
```

**Decision: JSONB is the correct pattern for F-CORE's scale (tens of custom properties per object type, not thousands). No schema change needed.**

---

## 2. Dynamic Form Generation

### Architecture: Schema-Driven Form Renderer

The system generates forms at runtime from `PropertyDefinition` records. The flow is:

```
PropertyDefinition[] (DB) --> buildZodSchema() --> useForm() --> <PropertyField /> renderers
```

### Core Pattern: react-hook-form + Zod + Dynamic Schema

```typescript
// src/lib/properties/buildSchema.ts
import { z, ZodTypeAny } from 'zod';
import { PropertyDefinition } from '@/types/properties';

/**
 * Builds a Zod schema dynamically from an array of PropertyDefinitions.
 * Each PropertyDefinition maps to a Zod validator based on its fieldType.
 */
export function buildZodSchema(
  definitions: PropertyDefinition[]
): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const def of definitions) {
    let fieldSchema = buildFieldSchema(def);

    // Apply required/optional
    if (!def.isRequired) {
      fieldSchema = fieldSchema.optional().or(z.literal(''));
    }

    shape[def.name] = fieldSchema;
  }

  return z.object(shape);
}

function buildFieldSchema(def: PropertyDefinition): ZodTypeAny {
  switch (def.fieldType) {
    case 'text':
      return z.string().max(65535);

    case 'number':
      return z.coerce.number();

    case 'date':
    case 'datetime':
      return z.coerce.date();

    case 'email':
      return z.string().email('Invalid email format');

    case 'phone':
      return z.string().regex(
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/,
        'Invalid phone number'
      );

    case 'url':
      return z.string().url('Invalid URL format');

    case 'select':
      const options = (def.options as { value: string }[]) || [];
      const values = options.map(o => o.value);
      return z.enum(values as [string, ...string[]]);

    case 'multiselect':
      const msOptions = (def.options as { value: string }[]) || [];
      const msValues = msOptions.map(o => o.value);
      return z.array(z.enum(msValues as [string, ...string[]]));

    case 'checkbox':
      return z.coerce.boolean();

    default:
      return z.string();
  }
}
```

### Form Hook Integration

```typescript
// src/hooks/usePropertyForm.ts
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { buildZodSchema } from '@/lib/properties/buildSchema';
import { PropertyDefinition } from '@/types/properties';

export function usePropertyForm(
  definitions: PropertyDefinition[],
  initialValues: Record<string, unknown> = {}
): UseFormReturn {
  const schema = useMemo(
    () => buildZodSchema(definitions),
    [definitions]
  );

  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    for (const def of definitions) {
      values[def.name] = initialValues[def.name]
        ?? def.defaultValue
        ?? getEmptyValue(def.fieldType);
    }
    return values;
  }, [definitions, initialValues]);

  return useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur', // Validate on blur for performance
  });
}

function getEmptyValue(fieldType: string): unknown {
  switch (fieldType) {
    case 'number': return undefined;
    case 'checkbox': return false;
    case 'multiselect': return [];
    case 'date':
    case 'datetime': return undefined;
    default: return '';
  }
}
```

---

## 3. Property Validation with Zod

### Validation Rules by Field Type

| Field Type | Zod Validator | Validation Rules |
|-----------|--------------|------------------|
| `text` | `z.string()` | `.min(0).max(65535)`, custom `.regex()` if pattern defined |
| `number` | `z.coerce.number()` | `.min(min).max(max)`, `.int()` if integer-only |
| `date` | `z.coerce.date()` | Past/future constraints if configured |
| `datetime` | `z.coerce.date()` | Same as date, includes time component |
| `email` | `z.string().email()` | Built-in email regex |
| `phone` | `z.string().regex()` | International phone regex |
| `url` | `z.string().url()` | Built-in URL validation |
| `select` | `z.enum()` | Must match one of `options[].value` |
| `multiselect` | `z.array(z.enum())` | Each item must match `options[].value` |
| `checkbox` | `z.coerce.boolean()` | Coerces truthy/falsy values |

### Server-Side Validation (API Layer)

```typescript
// src/lib/properties/validateProperties.ts
import { z } from 'zod';
import { buildZodSchema } from './buildSchema';
import { PropertyDefinition } from '@/types/properties';

export type ValidationResult = {
  success: boolean;
  data?: Record<string, unknown>;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

/**
 * Validates property values against their definitions.
 * Used in API routes before writing to the database.
 */
export function validatePropertyValues(
  definitions: PropertyDefinition[],
  values: Record<string, unknown>
): ValidationResult {
  const schema = buildZodSchema(definitions);
  const result = schema.safeParse(values);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
```

### Extended Validation (Future Enhancement)

The `PropertyDefinition` model can be extended with a `validationRules Json?` column to support configurable validation:

```typescript
// Potential validationRules JSON structure
interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;       // custom regex
  patternMessage?: string; // error message for pattern
  unique?: boolean;       // unique within tenant
}
```

---

## 4. Type-Safe Dynamic Fields

### The Challenge

Dynamic properties stored as JSONB are inherently `Record<string, unknown>` at the TypeScript level. Full compile-time type safety is impossible because properties are user-defined. The goal is to maximize type safety at the boundaries.

### Pattern 1: Branded Types for Property Access

```typescript
// src/types/properties.ts

/** Supported field types as a union */
export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'email'
  | 'phone'
  | 'url';

/** The PropertyDefinition as loaded from DB */
export interface PropertyDefinition {
  id: string;
  tenantId: string;
  objectType: 'contact' | 'company' | 'deal';
  name: string;
  label: string;
  description?: string | null;
  fieldType: FieldType;
  options?: PropertyOption[] | null;
  isRequired: boolean;
  isReadonly: boolean;
  isSystem: boolean;
  groupName?: string | null;
  orderIndex: number;
  defaultValue?: string | null;
}

export interface PropertyOption {
  value: string;
  label: string;
}

/** Type map: fieldType -> TypeScript type of the stored value */
export type PropertyValueTypeMap = {
  text: string;
  number: number;
  date: string;       // ISO 8601 date string
  datetime: string;   // ISO 8601 datetime string
  select: string;
  multiselect: string[];
  checkbox: boolean;
  email: string;
  phone: string;
  url: string;
};

/** Generic property value accessor with runtime type guard */
export function getPropertyValue<T extends FieldType>(
  properties: Record<string, unknown>,
  name: string,
  fieldType: T
): PropertyValueTypeMap[T] | undefined {
  const value = properties[name];
  if (value === undefined || value === null) return undefined;

  // Runtime type checking
  switch (fieldType) {
    case 'number':
      return (typeof value === 'number' ? value : undefined) as PropertyValueTypeMap[T] | undefined;
    case 'checkbox':
      return (typeof value === 'boolean' ? value : undefined) as PropertyValueTypeMap[T] | undefined;
    case 'multiselect':
      return (Array.isArray(value) ? value : undefined) as PropertyValueTypeMap[T] | undefined;
    default:
      return (typeof value === 'string' ? value : undefined) as PropertyValueTypeMap[T] | undefined;
  }
}
```

### Pattern 2: Discriminated Union for Field Renderers

```typescript
// src/types/propertyField.ts

/** Discriminated union for property field data passed to renderers */
export type PropertyFieldData =
  | { fieldType: 'text'; value: string; definition: PropertyDefinition }
  | { fieldType: 'number'; value: number; definition: PropertyDefinition }
  | { fieldType: 'date'; value: string; definition: PropertyDefinition }
  | { fieldType: 'datetime'; value: string; definition: PropertyDefinition }
  | { fieldType: 'select'; value: string; options: PropertyOption[]; definition: PropertyDefinition }
  | { fieldType: 'multiselect'; value: string[]; options: PropertyOption[]; definition: PropertyDefinition }
  | { fieldType: 'checkbox'; value: boolean; definition: PropertyDefinition }
  | { fieldType: 'email'; value: string; definition: PropertyDefinition }
  | { fieldType: 'phone'; value: string; definition: PropertyDefinition }
  | { fieldType: 'url'; value: string; definition: PropertyDefinition };
```

### Pattern 3: Typed Property Helpers

```typescript
// src/lib/properties/helpers.ts

/** Safely set a property value with type checking */
export function setPropertyValue(
  properties: Record<string, unknown>,
  definition: PropertyDefinition,
  value: unknown
): Record<string, unknown> {
  return {
    ...properties,
    [definition.name]: coerceValue(definition.fieldType, value),
  };
}

function coerceValue(fieldType: FieldType, value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;

  switch (fieldType) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? null : num;
    case 'checkbox':
      return Boolean(value);
    case 'multiselect':
      return Array.isArray(value) ? value : [value];
    default:
      return String(value);
  }
}
```

---

## 5. Property History Tracking

### Recommendation: Application-Level Tracking with a `PropertyHistory` Table

For a CRM, property change history is a critical feature (HubSpot shows "Property History" on every record). There are three approaches:

| Approach | Pros | Cons |
|----------|------|------|
| **DB Triggers** | Automatic, cannot be bypassed | Hard to maintain, trigger logic is opaque, harder to include user context |
| **Application-Level** | Full control, easy to include user/source metadata | Can be bypassed if DB is accessed directly, slight overhead |
| **Event Sourcing** | Complete audit trail, replay capability | High complexity, overkill for CRM property tracking |

### Recommended: Application-Level with Dedicated Table

#### Schema Addition

```prisma
model PropertyHistory {
  id            String    @id @default(uuid())
  tenantId      String

  // What changed
  objectType    String    // contact, company, deal
  objectId      String    // ID of the Contact/Company/Deal
  propertyName  String    // e.g., "lead_source", "email"

  // Change details
  oldValue      String?   // Previous value (serialized as string)
  newValue      String?   // New value (serialized as string)
  source        String    @default("manual") // manual, api, import, workflow, integration

  // Who changed it
  userId        String?

  // When
  createdAt     DateTime  @default(now())

  @@index([tenantId, objectType, objectId])
  @@index([tenantId, objectType, objectId, propertyName])
  @@index([createdAt(sort: Desc)])
}
```

#### History Tracking Service

```typescript
// src/lib/properties/historyService.ts
import { prisma } from '@/lib/prisma';

interface PropertyChange {
  propertyName: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Detects changes between old and new property values,
 * and writes PropertyHistory records for each changed field.
 */
export async function trackPropertyChanges(params: {
  tenantId: string;
  objectType: 'contact' | 'company' | 'deal';
  objectId: string;
  oldProperties: Record<string, unknown>;
  newProperties: Record<string, unknown>;
  userId?: string;
  source?: string;
}): Promise<void> {
  const changes = detectChanges(params.oldProperties, params.newProperties);

  if (changes.length === 0) return;

  await prisma.propertyHistory.createMany({
    data: changes.map(change => ({
      tenantId: params.tenantId,
      objectType: params.objectType,
      objectId: params.objectId,
      propertyName: change.propertyName,
      oldValue: serializeValue(change.oldValue),
      newValue: serializeValue(change.newValue),
      userId: params.userId,
      source: params.source ?? 'manual',
    })),
  });
}

function detectChanges(
  oldProps: Record<string, unknown>,
  newProps: Record<string, unknown>
): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  for (const key of allKeys) {
    const oldVal = oldProps[key];
    const newVal = newProps[key];

    if (!deepEqual(oldVal, newVal)) {
      changes.push({
        propertyName: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changes;
}

function serializeValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
```

#### Tracking System Properties Too

For system/column-level properties (e.g., `email`, `firstName`, `ownerId`), track them using the same mechanism. Compare old and new column values before `prisma.contact.update()`:

```typescript
// src/lib/properties/trackSystemFields.ts

const TRACKED_CONTACT_FIELDS = [
  'email', 'firstName', 'lastName', 'phone', 'lifecycleStage',
  'leadStatus', 'ownerId', 'jobTitle', 'website',
] as const;

export function detectSystemFieldChanges(
  oldRecord: Record<string, unknown>,
  newData: Record<string, unknown>,
  trackedFields: readonly string[] = TRACKED_CONTACT_FIELDS
): PropertyChange[] {
  const changes: PropertyChange[] = [];

  for (const field of trackedFields) {
    if (field in newData && oldRecord[field] !== newData[field]) {
      changes.push({
        propertyName: field,
        oldValue: oldRecord[field],
        newValue: newData[field],
      });
    }
  }

  return changes;
}
```

---

## 6. Prisma + JSONB Querying

### What Prisma Supports

Prisma supports JSONB filtering on PostgreSQL using path-based queries (available since Prisma v4.0.0):

```typescript
// Filter contacts where properties->lead_source = "website"
const contacts = await prisma.contact.findMany({
  where: {
    tenantId: tenantId,
    deletedAt: null,
    properties: {
      path: ['lead_source'],
      equals: 'website',
    },
  },
});

// Filter with string_contains
const contacts = await prisma.contact.findMany({
  where: {
    properties: {
      path: ['company_size'],
      string_contains: '100',
    },
  },
});
```

### Supported JSONB Filter Operations in Prisma

| Operation | Prisma API | SQL Equivalent |
|-----------|-----------|---------------|
| Exact match | `{ path: ['key'], equals: value }` | `properties->>'key' = 'value'` |
| Contains string | `{ path: ['key'], string_contains: 'x' }` | `properties->>'key' LIKE '%x%'` |
| Starts with | `{ path: ['key'], string_starts_with: 'x' }` | `properties->>'key' LIKE 'x%'` |
| Ends with | `{ path: ['key'], string_ends_with: 'x' }` | `properties->>'key' LIKE '%x'` |
| Greater than | `{ path: ['key'], gt: value }` | Numeric comparison on extracted value |
| Less than | `{ path: ['key'], lt: value }` | Numeric comparison on extracted value |
| Array contains | `{ array_contains: [value] }` | `properties @> '[value]'` |
| Not equals | `{ path: ['key'], not: value }` | `properties->>'key' != 'value'` |

### Limitations and Workarounds

#### Limitation 1: Cannot Sort by JSONB Field in Prisma

Prisma does not support `orderBy` on JSONB path values.

**Workaround: Raw SQL for sorting**

```typescript
// src/lib/properties/queryHelpers.ts
import { Prisma } from '@prisma/client';

/**
 * Builds a raw SQL query for sorting contacts by a JSONB property value.
 */
export function buildSortedPropertyQuery(params: {
  tenantId: string;
  objectType: 'contact' | 'company' | 'deal';
  sortProperty: string;
  sortDirection: 'asc' | 'desc';
  limit: number;
  offset: number;
}): Prisma.Sql {
  const table = params.objectType === 'contact' ? '"Contact"'
    : params.objectType === 'company' ? '"Company"'
    : '"Deal"';

  return Prisma.sql`
    SELECT *
    FROM ${Prisma.raw(table)}
    WHERE "tenantId" = ${params.tenantId}
      AND "deletedAt" IS NULL
    ORDER BY properties->>${params.sortProperty} ${Prisma.raw(params.sortDirection.toUpperCase())}
    LIMIT ${params.limit}
    OFFSET ${params.offset}
  `;
}
```

#### Limitation 2: Cannot Filter on Object Keys in Arrays (PostgreSQL)

PostgreSQL connector in Prisma does not support filtering on key values within JSON arrays. For example, you cannot filter `WHERE properties->'tags' @> '["important"]'` using Prisma's typed API for array-of-objects.

**Workaround: Use `prisma.$queryRaw` for complex containment queries.**

#### Limitation 3: No Aggregation on JSONB Values

Cannot `GROUP BY` or `SUM` on JSONB-extracted values via Prisma.

**Workaround: Raw SQL with `CAST`.**

```sql
SELECT
  properties->>'industry' AS industry,
  COUNT(*) AS count
FROM "Company"
WHERE "tenantId" = $1
  AND "deletedAt" IS NULL
GROUP BY properties->>'industry'
ORDER BY count DESC;
```

### Recommended Query Architecture

```
+--------------------------+
|  Application Layer       |
+--------------------------+
| Simple JSONB Filters     |  --> Prisma typed API (path-based)
| Complex JSONB Queries    |  --> prisma.$queryRaw (raw SQL)
| Sort by JSONB            |  --> prisma.$queryRaw (raw SQL)
| Aggregate on JSONB       |  --> prisma.$queryRaw (raw SQL)
+--------------------------+
```

---

## 7. Property Rendering Components

### Component Architecture

A registry pattern maps each `fieldType` to a dedicated renderer component:

```
<PropertyFormSection>
  <PropertyGroup title="Contact Information">
    <PropertyField definition={def} />  --> dispatches to:
      |- <TextPropertyInput />
      |- <NumberPropertyInput />
      |- <DatePropertyInput />
      |- <SelectPropertyInput />
      |- <MultiSelectPropertyInput />
      |- <CheckboxPropertyInput />
      |- <EmailPropertyInput />
      |- <PhonePropertyInput />
      |- <UrlPropertyInput />
  </PropertyGroup>
</PropertyFormSection>
```

### Field Registry Pattern

```typescript
// src/components/properties/fieldRegistry.ts
import { lazy, ComponentType } from 'react';
import { FieldType } from '@/types/properties';

export interface PropertyInputProps {
  name: string;
  label: string;
  description?: string | null;
  isRequired: boolean;
  isReadonly: boolean;
  options?: { value: string; label: string }[];
  // react-hook-form control is accessed via useFormContext
}

/** Maps field types to their React input components */
const fieldRegistry: Record<FieldType, ComponentType<PropertyInputProps>> = {
  text: lazy(() => import('./inputs/TextPropertyInput')),
  number: lazy(() => import('./inputs/NumberPropertyInput')),
  date: lazy(() => import('./inputs/DatePropertyInput')),
  datetime: lazy(() => import('./inputs/DateTimePropertyInput')),
  select: lazy(() => import('./inputs/SelectPropertyInput')),
  multiselect: lazy(() => import('./inputs/MultiSelectPropertyInput')),
  checkbox: lazy(() => import('./inputs/CheckboxPropertyInput')),
  email: lazy(() => import('./inputs/EmailPropertyInput')),
  phone: lazy(() => import('./inputs/PhonePropertyInput')),
  url: lazy(() => import('./inputs/UrlPropertyInput')),
};

export function getFieldComponent(fieldType: FieldType): ComponentType<PropertyInputProps> {
  return fieldRegistry[fieldType] ?? fieldRegistry.text;
}
```

### Generic PropertyField Component

```typescript
// src/components/properties/PropertyField.tsx
'use client';

import { Suspense } from 'react';
import { useFormContext } from 'react-hook-form';
import { PropertyDefinition } from '@/types/properties';
import { getFieldComponent } from './fieldRegistry';

interface PropertyFieldProps {
  definition: PropertyDefinition;
}

export function PropertyField({ definition }: PropertyFieldProps) {
  const { formState: { errors } } = useFormContext();
  const FieldComponent = getFieldComponent(definition.fieldType);
  const error = errors[definition.name];

  return (
    <div className="space-y-1">
      <Suspense fallback={<div className="h-10 bg-gray-100 animate-pulse rounded" />}>
        <FieldComponent
          name={definition.name}
          label={definition.label}
          description={definition.description}
          isRequired={definition.isRequired}
          isReadonly={definition.isReadonly}
          options={definition.options as { value: string; label: string }[] | undefined}
        />
      </Suspense>
      {error && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}
```

### Example Input: TextPropertyInput

```typescript
// src/components/properties/inputs/TextPropertyInput.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { PropertyInputProps } from '../fieldRegistry';

export default function TextPropertyInput({
  name,
  label,
  description,
  isRequired,
  isReadonly,
}: PropertyInputProps) {
  const { register } = useFormContext();

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type="text"
        disabled={isReadonly}
        {...register(name)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                   text-sm shadow-sm focus:border-cyan-500 focus:ring-1
                   focus:ring-cyan-500 disabled:bg-gray-50 disabled:text-gray-500"
      />
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
```

### Example Input: SelectPropertyInput

```typescript
// src/components/properties/inputs/SelectPropertyInput.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { PropertyInputProps } from '../fieldRegistry';

export default function SelectPropertyInput({
  name,
  label,
  description,
  isRequired,
  isReadonly,
  options = [],
}: PropertyInputProps) {
  const { register } = useFormContext();

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        disabled={isReadonly}
        {...register(name)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                   text-sm shadow-sm focus:border-cyan-500 focus:ring-1
                   focus:ring-cyan-500 disabled:bg-gray-50"
      >
        <option value="">-- Select --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
```

### Display-Only Renderers (for detail views)

```typescript
// src/components/properties/PropertyValue.tsx
'use client';

import { PropertyDefinition } from '@/types/properties';

interface PropertyValueProps {
  definition: PropertyDefinition;
  value: unknown;
}

export function PropertyValue({ definition, value }: PropertyValueProps) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 italic">--</span>;
  }

  switch (definition.fieldType) {
    case 'email':
      return (
        <a href={`mailto:${value}`} className="text-cyan-600 hover:underline">
          {String(value)}
        </a>
      );

    case 'phone':
      return (
        <a href={`tel:${value}`} className="text-cyan-600 hover:underline">
          {String(value)}
        </a>
      );

    case 'url':
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-600 hover:underline"
        >
          {String(value)}
        </a>
      );

    case 'checkbox':
      return <span>{value ? 'Yes' : 'No'}</span>;

    case 'date':
      return <span>{new Date(String(value)).toLocaleDateString()}</span>;

    case 'datetime':
      return <span>{new Date(String(value)).toLocaleString()}</span>;

    case 'select': {
      const option = definition.options?.find(o => o.value === value);
      return <span>{option?.label ?? String(value)}</span>;
    }

    case 'multiselect': {
      const vals = Array.isArray(value) ? value : [];
      const labels = vals.map(v => {
        const opt = definition.options?.find(o => o.value === v);
        return opt?.label ?? String(v);
      });
      return <span>{labels.join(', ')}</span>;
    }

    case 'number':
      return <span>{Number(value).toLocaleString()}</span>;

    default:
      return <span>{String(value)}</span>;
  }
}
```

---

## 8. Performance Considerations

### Problem: Rendering 100+ Properties

HubSpot records can have 100+ properties. Naive rendering causes performance issues:
- DOM bloat from rendering all fields at once
- re-renders cascade through the form on every keystroke
- Initial render is slow

### Solution 1: Property Groups with Collapsible Sections

Group properties by `groupName` and only render the expanded group's fields:

```typescript
// src/components/properties/PropertyFormSection.tsx
'use client';

import { useState, useMemo } from 'react';
import { PropertyDefinition } from '@/types/properties';
import { PropertyField } from './PropertyField';

interface PropertyFormSectionProps {
  definitions: PropertyDefinition[];
}

export function PropertyFormSection({ definitions }: PropertyFormSectionProps) {
  const groups = useMemo(() => {
    const grouped = new Map<string, PropertyDefinition[]>();

    for (const def of definitions) {
      const group = def.groupName ?? 'Other';
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group)!.push(def);
    }

    // Sort within groups by orderIndex
    for (const [, defs] of grouped) {
      defs.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    return grouped;
  }, [definitions]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set([groups.keys().next().value]) // Expand first group
  );

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([groupName, defs]) => (
        <div key={groupName} className="border rounded-lg">
          <button
            type="button"
            onClick={() => toggleGroup(groupName)}
            className="w-full flex items-center justify-between px-4 py-3
                       text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>{groupName}</span>
            <span>{expandedGroups.has(groupName) ? '−' : '+'}</span>
          </button>

          {expandedGroups.has(groupName) && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {defs.map(def => (
                <PropertyField key={def.id} definition={def} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Solution 2: Debounced Auto-Save

For edit views (like HubSpot's sidebar property editor), auto-save on blur or after debounce instead of requiring a submit button:

```typescript
// src/hooks/useDebouncedSave.ts
import { useCallback, useRef } from 'react';

export function useDebouncedSave(
  saveFn: (data: Record<string, unknown>) => Promise<void>,
  delayMs: number = 800
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<Record<string, unknown> | null>(null);

  const save = useCallback((data: Record<string, unknown>) => {
    pendingRef.current = data;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (pendingRef.current) {
        try {
          await saveFn(pendingRef.current);
          pendingRef.current = null;
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, delayMs);
  }, [saveFn, delayMs]);

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (pendingRef.current) {
      await saveFn(pendingRef.current);
      pendingRef.current = null;
    }
  }, [saveFn]);

  return { save, flush };
}
```

### Solution 3: Isolate Re-Renders with react-hook-form

react-hook-form already isolates re-renders by default when using `register()`. Each input only re-renders when its own value changes, not when other fields change. This is a key reason to use react-hook-form over React state for forms with many fields.

Key practices:
- Use `mode: 'onBlur'` instead of `mode: 'onChange'` to avoid validation on every keystroke
- Avoid `watch()` on the entire form. Use `watch('specificField')` for conditional rendering
- Use `useFormContext()` in child components instead of prop-drilling `control`

### Solution 4: Virtual Scrolling (Extreme Case)

Only needed if a single group has 50+ visible fields (unlikely in practice). Use `@tanstack/react-virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Inside a property group component with many fields:
const rowVirtualizer = useVirtualizer({
  count: definitions.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 72, // Estimated field height in px
  overscan: 5,
});
```

### Performance Summary

| Technique | When to Use | Impact |
|-----------|------------|--------|
| Collapsible groups | Always (default) | Reduces initial DOM by ~80% |
| `mode: 'onBlur'` | Always | Eliminates per-keystroke validation |
| Debounced auto-save | Edit panels, sidebar editors | Reduces API calls by ~90% |
| `useFormContext()` | Always (multi-component forms) | Isolates re-renders |
| Lazy-loaded inputs | Always (via `fieldRegistry`) | Reduces initial JS bundle |
| Virtual scrolling | >50 visible fields in one group | Renders only visible fields |
| `React.memo` on field components | When profiling shows excess re-renders | Prevents unnecessary renders |

---

## 9. Recommended File Structure

```
src/
  types/
    properties.ts              # PropertyDefinition, FieldType, PropertyOption types

  lib/
    properties/
      buildSchema.ts            # Zod schema builder from PropertyDefinition[]
      validateProperties.ts     # Server-side property validation
      historyService.ts         # Property change tracking service
      trackSystemFields.ts      # System field change detection
      queryHelpers.ts           # Raw SQL helpers for JSONB sort/aggregate
      helpers.ts                # getPropertyValue, setPropertyValue, coerceValue

  hooks/
    usePropertyForm.ts          # Form hook with dynamic Zod schema
    usePropertyDefinitions.ts   # SWR/React Query hook to fetch definitions
    useDebouncedSave.ts         # Debounced auto-save hook

  components/
    properties/
      PropertyField.tsx          # Generic field dispatcher
      PropertyValue.tsx          # Read-only value display
      PropertyFormSection.tsx    # Grouped form with collapsible sections
      PropertyHistoryPanel.tsx   # Change history timeline
      fieldRegistry.ts           # FieldType -> Component mapping
      inputs/
        TextPropertyInput.tsx
        NumberPropertyInput.tsx
        DatePropertyInput.tsx
        DateTimePropertyInput.tsx
        SelectPropertyInput.tsx
        MultiSelectPropertyInput.tsx
        CheckboxPropertyInput.tsx
        EmailPropertyInput.tsx
        PhonePropertyInput.tsx
        UrlPropertyInput.tsx

  app/
    api/
      properties/
        route.ts                 # GET: list definitions, POST: create definition
        [id]/
          route.ts               # GET, PATCH, DELETE a single definition
      contacts/
        [id]/
          properties/
            route.ts             # PATCH: update contact properties (with history)
            history/
              route.ts           # GET: property change history
      companies/
        [id]/
          properties/
            route.ts
            history/
              route.ts
      deals/
        [id]/
          properties/
            route.ts
            history/
              route.ts
```

---

## 10. API Endpoint Specifications

### 10.1 Property Definitions CRUD

#### `GET /api/properties?objectType=contact`

Returns all property definitions for a given object type within the tenant.

```typescript
// Response
{
  data: PropertyDefinition[];
  groups: string[];             // Unique group names for UI
}
```

#### `POST /api/properties`

Create a new custom property definition.

```typescript
// Request body
{
  objectType: 'contact' | 'company' | 'deal';
  name: string;         // auto-generated from label if not provided
  label: string;
  description?: string;
  fieldType: FieldType;
  options?: { value: string; label: string }[];
  isRequired?: boolean;
  groupName?: string;
  orderIndex?: number;
  defaultValue?: string;
}

// Validation:
// - name must be unique per (tenantId, objectType)
// - name must be snake_case
// - isSystem defaults to false (users cannot create system properties)
// - options required if fieldType is 'select' or 'multiselect'
```

#### `PATCH /api/properties/:id`

Update a property definition. System properties cannot have their `name` or `fieldType` changed.

#### `DELETE /api/properties/:id`

Soft-delete a property definition. System properties (`isSystem: true`) cannot be deleted. When a property definition is deleted, existing JSONB values are NOT removed (orphaned data is acceptable and keeps history intact).

### 10.2 Record Property Updates

#### `PATCH /api/contacts/:id/properties`

Update custom property values on a contact record.

```typescript
// Request body
{
  properties: Record<string, unknown>;
  // e.g., { "lead_source": "website", "custom_score": 85 }
}

// Processing steps:
// 1. Fetch current contact (for old property values)
// 2. Fetch PropertyDefinitions for objectType='contact'
// 3. Validate incoming values against definitions (Zod)
// 4. Merge with existing properties (partial update)
// 5. Track changes in PropertyHistory
// 6. Update contact.properties via Prisma
// 7. Return updated contact

// Response
{
  data: Contact;
  changedProperties: string[]; // Names of properties that actually changed
}
```

### 10.3 Property History

#### `GET /api/contacts/:id/properties/history?property=lead_source&limit=50`

Retrieve property change history for a record.

```typescript
// Query params:
// - property: filter by property name (optional, returns all if omitted)
// - limit: max records (default 50)
// - offset: pagination offset

// Response
{
  data: Array<{
    id: string;
    propertyName: string;
    oldValue: string | null;
    newValue: string | null;
    source: string;
    userId: string | null;
    userName: string | null;  // joined from User table
    createdAt: string;
  }>;
  total: number;
}
```

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Sprint 2)

1. Add `PropertyHistory` model to Prisma schema
2. Create `/api/properties` CRUD endpoints
3. Implement `buildZodSchema()` and `validateProperties()`
4. Implement `historyService.ts`
5. Create basic `PropertyField` + input components

### Phase 2: Integration (Sprint 3)

1. Integrate property form into Contact detail page
2. Integrate property form into Company detail page
3. Integrate property form into Deal detail page
4. Add property history panel to record detail views
5. Implement debounced auto-save

### Phase 3: Polish (Sprint 4)

1. Property definition management UI (settings page)
2. Property group management (reorder, rename)
3. JSONB expression indexes for high-usage properties
4. Import/export property definitions
5. Conditional property visibility rules

---

## Trade-Off Analysis Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage** | JSONB column | 2x faster reads, 2x less storage vs EAV, simpler queries, matches HubSpot's mental model |
| **Validation** | Zod dynamic schema | Runtime validation, TypeScript inference, composable, works with react-hook-form |
| **Form Library** | react-hook-form | Isolates re-renders per field (critical for 100+ fields), minimal re-renders, Zod integration |
| **History Tracking** | Application-level table | Includes user context, source tracking, flexible query patterns |
| **Type Safety** | Branded types + runtime guards | Balance between compile-time safety and dynamic nature of custom properties |
| **Rendering** | Registry pattern + lazy loading | Extensible, code-split per field type, consistent interface |
| **Performance** | Collapsible groups + onBlur mode | Handles 100+ properties without virtual scrolling complexity |
| **JSONB Queries** | Prisma typed API + raw SQL fallback | Prisma for simple filters, raw SQL for sort/aggregate edge cases |

---

## References

- [PostgreSQL JSONB vs EAV Benchmarks](https://www.razsamuel.com/postgresql-jsonb-vs-eav-dynamic-data/)
- [Prisma Working with JSON Fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)
- [PostgreSQL JSON Types Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [react-hook-form Advanced Usage](https://react-hook-form.com/advanced-usage)
- [react-hook-form TypeScript Support](https://react-hook-form.com/ts)
- [Zod Dynamic Schema Generation](https://stackoverflow.com/questions/75984188/zod-how-to-dynamically-generate-a-schema)
- [HubSpot Properties API](https://developers.hubspot.com/docs/api-reference/crm-properties-v3/guide)
- [Heap.io: When to Avoid JSONB](https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema)
- [react-window Virtualization](https://www.syncfusion.com/blogs/post/render-large-datasets-in-react)
- [Epic React: Form Performance](https://www.epicreact.dev/improve-the-performance-of-your-react-forms)
