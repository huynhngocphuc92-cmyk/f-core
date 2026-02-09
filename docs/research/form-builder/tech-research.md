# Form Builder Feature - Technical Architecture Research

> **Project:** F-CORE (HubSpot CRM Clone)
> **Date:** 2026-02-09
> **Status:** Research Complete
> **Priority:** P3 (Marketing Hub - Lead Generation)
> **Stack:** Next.js 16, TypeScript Strict, Tailwind CSS v4, Prisma 7.x, PostgreSQL (Supabase)

---

## Table of Contents

1. [Database Schema Design](#1-database-schema-design)
2. [Drag-and-Drop Libraries](#2-drag-and-drop-libraries)
3. [Form Rendering Engine](#3-form-rendering-engine)
4. [Field Validation System](#4-field-validation-system)
5. [Conditional Logic Engine](#5-conditional-logic-engine)
6. [Embed & Share System](#6-embed--share-system)
7. [Submission Processing](#7-submission-processing)
8. [API Route Structure](#8-api-route-structure)
9. [Performance & Security](#9-performance--security)
10. [Dependencies & Installation](#10-dependencies--installation)

---

## 1. Database Schema Design

### Design Rationale

Form builder data is inherently semi-structured. The form definition (fields, validation rules, conditional logic) changes frequently per form and per tenant. JSONB is the correct choice for storing these dynamic configurations because:

- Form field schemas are opaque to most queries (rendered on client)
- Structure varies per form (different field types, different validation rules)
- JSONB supports subset operators (`@>` and `<@`) for filtering
- Avoids wide tables or EAV anti-patterns
- PostgreSQL GIN indexes on JSONB columns enable fast lookups

Fixed columns are used for attributes that are frequently queried, sorted, or filtered (status, tenantId, formId, timestamps).

### Full Prisma Schema

```prisma
// ============================================
// FORM BUILDER MODELS
// ============================================

model Form {
  id            String    @id @default(uuid())
  tenantId      String

  // Basic Info
  name          String
  description   String?   @db.Text
  slug          String?   // URL-friendly identifier for public access

  // Status
  status        String    @default("draft") // draft, published, archived

  // Configuration (JSONB)
  settings      Json      @default("{}")
  // settings shape:
  // {
  //   submitButtonText: string,
  //   successMessage: string,
  //   redirectUrl: string | null,
  //   notifyEmails: string[],
  //   autoResponder: { enabled: boolean, subject: string, body: string },
  //   captchaEnabled: boolean,
  //   captchaType: "recaptcha_v3" | "hcaptcha",
  //   honeypotEnabled: boolean,
  //   allowMultipleSubmissions: boolean,
  //   closeAfterDate: string | null,
  //   maxSubmissions: number | null,
  //   language: string,
  //   isMultiStep: boolean,
  //   steps: { id: string, title: string, description: string }[]
  // }

  // Theming (JSONB)
  theme         Json      @default("{}")
  // theme shape:
  // {
  //   fontFamily: string,
  //   primaryColor: string,
  //   backgroundColor: string,
  //   textColor: string,
  //   borderRadius: number,
  //   labelPosition: "top" | "left" | "inline",
  //   fieldSpacing: number,
  //   customCss: string
  // }

  // Ownership
  createdBy     String?
  updatedBy     String?

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  publishedAt   DateTime?

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  fields        FormField[]
  submissions   FormSubmission[]
  views         FormView[]

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([status])
  @@index([deletedAt])
  @@index([createdAt(sort: Desc)])
}

model FormField {
  id              String    @id @default(uuid())
  formId          String

  // Field Definition
  type            String    // text, email, phone, number, url, textarea,
                            // select, multiselect, radio, checkbox,
                            // date, datetime, file, hidden,
                            // heading, paragraph, divider, spacer
  name            String    // internal field name (snake_case, unique per form)
  label           String
  placeholder     String?
  helpText        String?
  defaultValue    String?

  // Layout
  displayOrder    Int       @default(0)
  width           String    @default("full") // full, half, third
  stepId          String?   // for multi-step forms, which step this belongs to

  // Validation (JSONB)
  required        Boolean   @default(false)
  validationRules Json      @default("[]")
  // validationRules shape:
  // [
  //   { type: "minLength", value: 3, message: "Must be at least 3 characters" },
  //   { type: "maxLength", value: 255, message: "Too long" },
  //   { type: "pattern", value: "^[A-Za-z]+$", message: "Letters only" },
  //   { type: "min", value: 0, message: "Must be positive" },
  //   { type: "max", value: 100, message: "Max 100" },
  //   { type: "email", message: "Invalid email" },
  //   { type: "url", message: "Invalid URL" },
  //   { type: "phone", message: "Invalid phone number" },
  //   { type: "fileMaxSize", value: 5242880, message: "Max 5MB" },
  //   { type: "fileTypes", value: ["image/png", "image/jpeg", "application/pdf"], message: "Invalid file type" }
  // ]

  // Options for select/radio/checkbox (JSONB)
  options         Json      @default("[]")
  // options shape:
  // [
  //   { value: "option1", label: "Option 1" },
  //   { value: "option2", label: "Option 2" }
  // ]

  // Conditional Logic (JSONB)
  conditionalLogic Json     @default("null")
  // conditionalLogic shape:
  // {
  //   action: "show" | "hide" | "require",
  //   logicType: "all" | "any",
  //   rules: [
  //     { field: "fieldName", operator: "equals", value: "someValue" }
  //   ]
  // }

  // Metadata
  properties      Json      @default("{}")
  // Field-type specific properties:
  //   text: { inputType: "text" | "password" }
  //   number: { step: number, prefix: string, suffix: string }
  //   select: { searchable: boolean }
  //   file: { maxFiles: number, accept: string }
  //   textarea: { rows: number }
  //   date: { minDate: string, maxDate: string, format: string }
  //   heading: { level: "h1" | "h2" | "h3" | "h4" }
  //   paragraph: { content: string }

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  form            Form      @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@unique([formId, name])
  @@index([formId])
  @@index([displayOrder])
}

model FormSubmission {
  id            String    @id @default(uuid())
  formId        String
  tenantId      String

  // Submission Data (JSONB - actual form responses)
  data          Json      @default("{}")
  // data shape:
  // {
  //   "field_name_1": "value1",
  //   "field_name_2": ["option1", "option2"],
  //   "field_name_3": 42
  // }

  // Contact Linking
  contactId     String?   // link to existing Contact, or auto-created Contact
  contactEmail  String?   // denormalized for quick lookup

  // Metadata
  metadata      Json      @default("{}")
  // metadata shape:
  // {
  //   ipAddress: string,
  //   userAgent: string,
  //   referrer: string,
  //   pageUrl: string,
  //   source: "embed" | "standalone" | "popup",
  //   duration: number,        // seconds to complete form
  //   captchaScore: number,
  //   utmSource: string,
  //   utmMedium: string,
  //   utmCampaign: string
  // }

  // Audit
  submittedAt   DateTime  @default(now())
  isSpam        Boolean   @default(false)
  isRead        Boolean   @default(false)

  // Relations
  form          Form      @relation(fields: [formId], references: [id])
  contact       Contact?  @relation("FormSubmissionContact", fields: [contactId], references: [id])

  @@index([formId])
  @@index([tenantId])
  @@index([contactId])
  @@index([contactEmail])
  @@index([submittedAt(sort: Desc)])
  @@index([isSpam])
}

model FormView {
  id            String    @id @default(uuid())
  formId        String
  tenantId      String

  // Analytics Data
  viewedAt      DateTime  @default(now())
  source        String?   // embed, standalone, popup
  referrer      String?
  pageUrl       String?

  // Session (for conversion tracking)
  sessionId     String?   // anonymous session identifier
  converted     Boolean   @default(false) // did this view result in a submission?

  // Relations
  form          Form      @relation(fields: [formId], references: [id])

  @@index([formId])
  @@index([tenantId])
  @@index([viewedAt(sort: Desc)])
  @@index([formId, converted])
}
```

### Required Changes to Existing Models

Add to `Tenant` model:
```prisma
model Tenant {
  // ... existing fields ...
  forms         Form[]
}
```

Add to `Contact` model:
```prisma
model Contact {
  // ... existing fields ...
  formSubmissions FormSubmission[] @relation("FormSubmissionContact")
}
```

### Index Strategy Notes

| Index | Purpose | Expected Query Pattern |
|-------|---------|----------------------|
| `Form(tenantId)` | Multi-tenant isolation | Every list query |
| `Form(status)` | Filter by draft/published/archived | Dashboard filtering |
| `Form(deletedAt)` | Soft delete filtering | All queries |
| `FormField(formId)` | Fetch fields for a form | Form load |
| `FormField(displayOrder)` | Sorted field rendering | Form render |
| `FormSubmission(formId)` | List submissions per form | Submission list |
| `FormSubmission(contactEmail)` | Lookup by email | Contact linking |
| `FormSubmission(submittedAt DESC)` | Recent submissions | Dashboard, list |
| `FormView(formId, converted)` | Conversion rate calculation | Analytics |

---

## 2. Drag-and-Drop Libraries

### Comparison Matrix

| Criteria | @dnd-kit/core | react-beautiful-dnd | @hello-pangea/dnd |
|----------|--------------|--------------------|--------------------|
| **Maintenance** | Active (last updated ~1 year ago, 16.5k stars) | **DEPRECATED** (Oct 2024, archived Apr 2025) | Active fork of rbd (3.8k stars) |
| **React 19 Support** | Yes (hooks-based) | No (class components internally) | Yes |
| **Bundle Size** | ~12KB gzipped (core) | ~30KB gzipped | ~30KB gzipped (same as rbd) |
| **Performance** | 60fps with hundreds of items, optimized re-renders | Good for small lists | Same as rbd |
| **Sortable Lists** | Yes via `@dnd-kit/sortable` | Yes (primary use case) | Yes |
| **Drag from Palette** | Yes (native support via `DndContext`, `useDraggable`, `useDroppable`) | Not designed for this | Not designed for this |
| **Grid Support** | Yes (multiple strategies) | No (lists only) | No (lists only) |
| **Keyboard/A11y** | Built-in sensors for keyboard, pointer, touch | Built-in | Built-in |
| **Custom Drag Preview** | `DragOverlay` component | Limited | Limited |
| **Multi-container** | Native support | Possible but complex | Same as rbd |
| **TypeScript** | Full TypeScript support | DefinitelyTyped | Full TypeScript support |
| **Collision Detection** | Pluggable algorithms (closest center, closest corners, rect intersection) | Fixed | Fixed |
| **Touch/Mobile** | Built-in touch sensor | Built-in | Built-in |
| **Tree-shakeable** | Yes (modular monorepo) | No | No |

### Recommendation: @dnd-kit/core + @dnd-kit/sortable

**Rationale:**

1. **Palette-to-Canvas pattern is a first-class use case.** The form builder requires dragging field types from a sidebar palette onto a canvas. `@dnd-kit` supports this natively through `useDraggable` (palette items) + `useDroppable` (canvas area) + `SortableContext` (reordering within canvas). The `@hello-pangea/dnd` library is designed specifically for list reordering and does not support cross-context drag from a static palette naturally.

2. **`react-beautiful-dnd` is deprecated.** Atlassian officially deprecated it in October 2024 and archived the repository in April 2025. Using it in a new project is not advisable.

3. **Performance.** The form builder canvas may contain 50+ fields. `@dnd-kit` maintains 60fps through virtualization-ready architecture and minimal re-renders. Its sensor-based abstraction means only the active draggable and its overlay re-render during drag.

4. **Modular architecture.** We only import what we need:
   - `@dnd-kit/core` (~7KB) for base DnD context
   - `@dnd-kit/sortable` (~3.5KB) for sortable lists
   - `@dnd-kit/utilities` (~1KB) for CSS transform helpers
   Total: ~12KB vs ~30KB for alternatives.

5. **Custom collision detection.** When dragging from the palette, we need custom logic to determine insertion position. `@dnd-kit` allows pluggable collision detection algorithms.

6. **Active community.** Multiple production form builders use `@dnd-kit` (evidenced by GitHub discussions with form builder implementations). A full Next.js form builder course exists using `@dnd-kit`.

### Implementation Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     DndContext                          │
│                  (onDragStart, onDragOver, onDragEnd)    │
│                                                         │
│  ┌──────────────┐          ┌──────────────────────────┐ │
│  │   Palette     │          │       Canvas             │ │
│  │  (Sidebar)    │          │    (SortableContext)     │ │
│  │               │          │                          │ │
│  │  useDraggable │  ──────> │  useSortable per field   │ │
│  │  per field    │  drag    │  useDroppable for canvas │ │
│  │  type         │          │                          │ │
│  │               │          │  ┌────────────────────┐  │ │
│  │  [Text]       │          │  │ SortableFieldItem  │  │ │
│  │  [Email]      │          │  │ SortableFieldItem  │  │ │
│  │  [Select]     │          │  │ SortableFieldItem  │  │ │
│  │  [Checkbox]   │          │  │ SortableFieldItem  │  │ │
│  │  ...          │          │  └────────────────────┘  │ │
│  └──────────────┘          └──────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │                  DragOverlay                        ││
│  │           (Custom drag preview component)           ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Key Implementation Patterns

**Palette Item (Draggable)**
```tsx
import { useDraggable } from '@dnd-kit/core';

function PaletteItem({ fieldType }: { fieldType: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${fieldType}`,
    data: { type: fieldType, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn('cursor-grab', isDragging && 'opacity-50')}
    >
      {/* Field type icon + label */}
    </div>
  );
}
```

**Canvas Sortable Item**
```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableFieldItem({ field }: { field: FormField }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FieldRenderer field={field} isBuilder />
    </div>
  );
}
```

**DndContext Handler**
```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;

  const isFromPalette = active.data.current?.fromPalette;

  if (isFromPalette) {
    // Add new field at the drop position
    const fieldType = active.data.current?.type;
    const overIndex = fields.findIndex((f) => f.id === over.id);
    addFieldAtIndex(fieldType, overIndex);
  } else {
    // Reorder existing fields
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex !== newIndex) {
      setFields(arrayMove(fields, oldIndex, newIndex));
    }
  }
}
```

### Packages to Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 3. Form Rendering Engine

### Architecture Overview

The rendering engine converts a JSON form schema into a live React form. It uses a **Field Type Registry** pattern to decouple field types from the rendering engine, allowing new field types to be added without modifying core code.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Form Schema    │────>│  Rendering Engine │────>│   React Form     │
│   (JSON/DB)      │     │  (Registry +      │     │   (react-hook-   │
│                  │     │   Zod Builder)    │     │    form + Zod)   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Field Type Registry

```typescript
// src/lib/form-builder/field-registry.ts

import { z } from 'zod';
import { ComponentType } from 'react';

// ── Type Definitions ──

export type FieldType =
  | 'text' | 'email' | 'phone' | 'number' | 'url'
  | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox'
  | 'date' | 'datetime' | 'file' | 'hidden'
  | 'heading' | 'paragraph' | 'divider' | 'spacer';

export interface FieldConfig {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  required: boolean;
  validationRules: ValidationRule[];
  options: FieldOption[];
  conditionalLogic: ConditionalLogic | null;
  properties: Record<string, unknown>;
  width: 'full' | 'half' | 'third';
  stepId?: string;
}

export interface ValidationRule {
  type: string;
  value?: unknown;
  message: string;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface ConditionalLogic {
  action: 'show' | 'hide' | 'require';
  logicType: 'all' | 'any';
  rules: ConditionalRule[];
}

export interface ConditionalRule {
  field: string;
  operator: ConditionalOperator;
  value: unknown;
}

export type ConditionalOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than'
  | 'is_empty' | 'is_not_empty'
  | 'starts_with' | 'ends_with';

// ── Field Component Interface ──

export interface FieldComponentProps {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
}

// ── Registry ──

interface FieldRegistryEntry {
  component: ComponentType<FieldComponentProps>;
  icon: string;                  // Lucide icon name
  label: string;                 // Display label in palette
  category: 'input' | 'choice' | 'layout' | 'advanced';
  isLayoutField: boolean;        // Does not capture data
  defaultConfig: Partial<FieldConfig>;
}

const registry = new Map<FieldType, FieldRegistryEntry>();

export function registerFieldType(
  type: FieldType,
  entry: FieldRegistryEntry
): void {
  registry.set(type, entry);
}

export function getFieldComponent(type: FieldType): ComponentType<FieldComponentProps> | null {
  return registry.get(type)?.component ?? null;
}

export function getFieldMeta(type: FieldType): Omit<FieldRegistryEntry, 'component'> | null {
  const entry = registry.get(type);
  if (!entry) return null;
  const { component: _, ...meta } = entry;
  return meta;
}

export function getAllFieldTypes(): Array<{ type: FieldType } & Omit<FieldRegistryEntry, 'component'>> {
  return Array.from(registry.entries()).map(([type, entry]) => {
    const { component: _, ...meta } = entry;
    return { type, ...meta };
  });
}
```

### Rendering Engine Component

```tsx
// src/lib/form-builder/FormRenderer.tsx
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useCallback } from 'react';
import { buildZodSchema } from './schema-builder';
import { evaluateConditionalLogic } from './conditional-engine';
import { getFieldComponent, FieldConfig } from './field-registry';

interface FormRendererProps {
  fields: FieldConfig[];
  settings: FormSettings;
  theme: FormTheme;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isMultiStep?: boolean;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export function FormRenderer({
  fields,
  settings,
  theme,
  onSubmit,
  isMultiStep = false,
  currentStep = 0,
  onStepChange,
}: FormRendererProps) {
  // Build Zod schema dynamically from field configs
  const schema = useMemo(() => buildZodSchema(fields), [fields]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(fields),
  });

  // Watch all values for conditional logic
  const watchedValues = watch();

  // Determine visible fields based on conditional logic
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.conditionalLogic) return true;
      return evaluateConditionalLogic(field.conditionalLogic, watchedValues);
    });
  }, [fields, watchedValues]);

  // Filter by step if multi-step
  const currentFields = isMultiStep
    ? visibleFields.filter((f) => f.stepId === settings.steps?.[currentStep]?.id)
    : visibleFields;

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={themeToStyle(theme)}>
      {currentFields.map((field) => {
        const Component = getFieldComponent(field.type);
        if (!Component) return null;

        // Layout fields (heading, paragraph, divider) don't need form control
        if (isLayoutField(field.type)) {
          return <Component key={field.id} field={field} value="" onChange={() => {}} onBlur={() => {}} />;
        }

        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <div className={fieldWidthClass(field.width)}>
                <Component
                  field={field}
                  value={formField.value}
                  onChange={formField.onChange}
                  onBlur={formField.onBlur}
                  error={errors[field.name]?.message as string}
                />
              </div>
            )}
          />
        );
      })}

      {/* Multi-step navigation */}
      {isMultiStep && (
        <div className="flex justify-between mt-4">
          {currentStep > 0 && (
            <button type="button" onClick={() => onStepChange?.(currentStep - 1)}>
              Previous
            </button>
          )}
          {currentStep < (settings.steps?.length ?? 1) - 1 ? (
            <button type="button" onClick={() => onStepChange?.(currentStep + 1)}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              {settings.submitButtonText ?? 'Submit'}
            </button>
          )}
        </div>
      )}

      {!isMultiStep && (
        <button type="submit" disabled={isSubmitting}>
          {settings.submitButtonText ?? 'Submit'}
        </button>
      )}
    </form>
  );
}
```

### Multi-Step Form State Management

For multi-step forms, use a combination of `react-hook-form` (retains all field values across steps) and local step state:

```tsx
// src/hooks/useMultiStepForm.ts

import { useState, useCallback } from 'react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

export function useMultiStepForm(steps: Step[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  }, [steps.length]);

  const nextStep = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep.id));
    goToStep(currentStepIndex + 1);
  }, [currentStepIndex, currentStep.id, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStepIndex - 1);
  }, [currentStepIndex, goToStep]);

  return {
    currentStep,
    currentStepIndex,
    steps,
    isFirstStep,
    isLastStep,
    progress,
    completedSteps,
    goToStep,
    nextStep,
    prevStep,
  };
}
```

---

## 4. Field Validation System

### Dynamic Zod Schema Builder

The core challenge: build a Zod schema at runtime from a JSON field configuration array. Each field's validation rules are mapped to Zod methods.

```typescript
// src/lib/form-builder/schema-builder.ts

import { z, ZodTypeAny } from 'zod';
import { FieldConfig, ValidationRule } from './field-registry';

/**
 * Builds a complete Zod schema from an array of field configurations.
 * Used both client-side (react-hook-form resolver) and server-side (submission validation).
 */
export function buildZodSchema(fields: FieldConfig[]): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    // Skip layout fields (headings, paragraphs, dividers, spacers)
    if (isLayoutField(field.type)) continue;

    let fieldSchema = buildFieldBaseSchema(field);
    fieldSchema = applyValidationRules(fieldSchema, field.validationRules);

    // Handle required vs optional
    if (!field.required) {
      fieldSchema = fieldSchema.optional().or(z.literal(''));
    }

    shape[field.name] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Creates the base Zod type for a field based on its type.
 */
function buildFieldBaseSchema(field: FieldConfig): ZodTypeAny {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'hidden':
      return z.string();

    case 'email':
      return z.string().email(
        findRuleMessage(field.validationRules, 'email') ?? 'Invalid email address'
      );

    case 'phone':
      return z.string().regex(
        /^\+?[1-9]\d{1,14}$/,
        findRuleMessage(field.validationRules, 'phone') ?? 'Invalid phone number'
      );

    case 'url':
      return z.string().url(
        findRuleMessage(field.validationRules, 'url') ?? 'Invalid URL'
      );

    case 'number':
      return z.coerce.number({
        invalid_type_error: 'Must be a number',
      });

    case 'date':
    case 'datetime':
      return z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: 'Invalid date' }
      );

    case 'select':
    case 'radio':
      return z.string();

    case 'multiselect':
      return z.array(z.string());

    case 'checkbox':
      if (field.options.length > 0) {
        // Checkbox group (multiple values)
        return z.array(z.string());
      }
      // Single checkbox (boolean)
      return z.boolean();

    case 'file':
      // File validation happens separately (Supabase Storage)
      return z.any();

    default:
      return z.string();
  }
}

/**
 * Applies validation rules from the field config to the Zod schema.
 */
function applyValidationRules(schema: ZodTypeAny, rules: ValidationRule[]): ZodTypeAny {
  let result = schema;

  for (const rule of rules) {
    switch (rule.type) {
      case 'minLength':
        if (result instanceof z.ZodString) {
          result = result.min(rule.value as number, rule.message);
        }
        break;

      case 'maxLength':
        if (result instanceof z.ZodString) {
          result = result.max(rule.value as number, rule.message);
        }
        break;

      case 'pattern':
        if (result instanceof z.ZodString) {
          result = result.regex(new RegExp(rule.value as string), rule.message);
        }
        break;

      case 'min':
        if (result instanceof z.ZodNumber) {
          result = result.min(rule.value as number, rule.message);
        }
        break;

      case 'max':
        if (result instanceof z.ZodNumber) {
          result = result.max(rule.value as number, rule.message);
        }
        break;

      // email, url, phone are handled in buildFieldBaseSchema
      // fileMaxSize and fileTypes are handled server-side
    }
  }

  return result;
}

function findRuleMessage(rules: ValidationRule[], type: string): string | undefined {
  return rules.find((r) => r.type === type)?.message;
}

function isLayoutField(type: string): boolean {
  return ['heading', 'paragraph', 'divider', 'spacer'].includes(type);
}
```

### Built-in Validators Reference

| Validator | Zod Method | Field Types | Example Config |
|-----------|-----------|-------------|----------------|
| `required` | Field-level (not in rules array) | All input fields | `{ required: true }` |
| `email` | `z.string().email()` | email | Auto-applied |
| `phone` | `z.string().regex()` | phone | Auto-applied |
| `url` | `z.string().url()` | url | Auto-applied |
| `minLength` | `z.string().min()` | text, textarea, email | `{ type: "minLength", value: 3, message: "..." }` |
| `maxLength` | `z.string().max()` | text, textarea, email | `{ type: "maxLength", value: 100, message: "..." }` |
| `pattern` | `z.string().regex()` | text | `{ type: "pattern", value: "^[A-Z]", message: "..." }` |
| `min` | `z.number().min()` | number | `{ type: "min", value: 0, message: "..." }` |
| `max` | `z.number().max()` | number | `{ type: "max", value: 999, message: "..." }` |
| `fileMaxSize` | Server-side check | file | `{ type: "fileMaxSize", value: 5242880, message: "..." }` |
| `fileTypes` | Server-side check | file | `{ type: "fileTypes", value: ["image/*"], message: "..." }` |

### Server-Side Re-Validation

Every submission is re-validated server-side using the same `buildZodSchema` function. The API route fetches the form's field definitions from the database, rebuilds the schema, and validates:

```typescript
// In API route: POST /api/forms/[id]/submissions
const form = await prisma.form.findUnique({
  where: { id: formId, tenantId },
  include: { fields: { orderBy: { displayOrder: 'asc' } } },
});

const fields = form.fields.map(mapPrismaFieldToConfig);
const schema = buildZodSchema(fields);
const result = schema.safeParse(submissionData);

if (!result.success) {
  return NextResponse.json(
    { error: 'Validation failed', details: result.error.flatten() },
    { status: 422 }
  );
}
```

---

## 5. Conditional Logic Engine

### Rule Structure

```typescript
// src/lib/form-builder/conditional-engine.ts

export interface ConditionalLogic {
  action: 'show' | 'hide' | 'require' | 'skip_to_step';
  logicType: 'all' | 'any'; // AND / OR
  rules: ConditionalRule[];
  targetStepId?: string; // for skip_to_step action
}

export interface ConditionalRule {
  field: string;          // name of the field to evaluate
  operator: ConditionalOperator;
  value: unknown;         // expected value to compare against
}

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equals'
  | 'less_than_or_equals'
  | 'is_empty'
  | 'is_not_empty'
  | 'starts_with'
  | 'ends_with';
```

### Evaluation Engine

```typescript
/**
 * Evaluates whether a field should be visible/required based on its conditional logic.
 * Returns true if the field should be shown (for 'show' action)
 * or hidden (for 'hide' action).
 */
export function evaluateConditionalLogic(
  logic: ConditionalLogic,
  formValues: Record<string, unknown>
): boolean {
  const { action, logicType, rules } = logic;

  if (rules.length === 0) return true;

  const evaluateRule = (rule: ConditionalRule): boolean => {
    const fieldValue = formValues[rule.field];
    return evaluateOperator(rule.operator, fieldValue, rule.value);
  };

  const rulesResult = logicType === 'all'
    ? rules.every(evaluateRule)
    : rules.some(evaluateRule);

  // For 'show': show when rules match, hide when they don't
  // For 'hide': hide when rules match, show when they don't
  switch (action) {
    case 'show':
      return rulesResult;
    case 'hide':
      return !rulesResult;
    case 'require':
      return rulesResult; // Field visibility unchanged, but required state changes
    case 'skip_to_step':
      return rulesResult;
    default:
      return true;
  }
}

/**
 * Evaluates a single operator comparison.
 */
function evaluateOperator(
  operator: ConditionalOperator,
  fieldValue: unknown,
  compareValue: unknown
): boolean {
  switch (operator) {
    case 'equals':
      return normalizeValue(fieldValue) === normalizeValue(compareValue);

    case 'not_equals':
      return normalizeValue(fieldValue) !== normalizeValue(compareValue);

    case 'contains':
      return String(fieldValue ?? '').toLowerCase()
        .includes(String(compareValue ?? '').toLowerCase());

    case 'not_contains':
      return !String(fieldValue ?? '').toLowerCase()
        .includes(String(compareValue ?? '').toLowerCase());

    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);

    case 'less_than':
      return Number(fieldValue) < Number(compareValue);

    case 'greater_than_or_equals':
      return Number(fieldValue) >= Number(compareValue);

    case 'less_than_or_equals':
      return Number(fieldValue) <= Number(compareValue);

    case 'is_empty':
      return isEmpty(fieldValue);

    case 'is_not_empty':
      return !isEmpty(fieldValue);

    case 'starts_with':
      return String(fieldValue ?? '').toLowerCase()
        .startsWith(String(compareValue ?? '').toLowerCase());

    case 'ends_with':
      return String(fieldValue ?? '').toLowerCase()
        .endsWith(String(compareValue ?? '').toLowerCase());

    default:
      return false;
  }
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return JSON.stringify(value.sort());
  return String(value).toLowerCase().trim();
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
```

### Reactive Evaluation in Form Renderer

The conditional logic engine integrates with `react-hook-form`'s `watch()` to re-evaluate on every field change:

```tsx
// Inside FormRenderer component
const watchedValues = watch();

// Re-evaluate which fields are visible and which are conditionally required
const processedFields = useMemo(() => {
  return fields.map((field) => {
    if (!field.conditionalLogic) return { ...field, isVisible: true };

    const logic = field.conditionalLogic;
    const result = evaluateConditionalLogic(logic, watchedValues);

    if (logic.action === 'require') {
      return { ...field, isVisible: true, required: result };
    }

    return { ...field, isVisible: result };
  });
}, [fields, watchedValues]);
```

### Performance Consideration

`watch()` with no arguments causes re-renders on every field change. For forms with many fields, optimize by:

1. Using `watch(fieldNamesUsedInConditions)` to subscribe only to fields referenced in conditional rules
2. Memoizing the set of field names used in conditions
3. Debouncing re-evaluation for complex rule sets

```typescript
// Extract all field names referenced in conditional rules
const conditionDependencies = useMemo(() => {
  const deps = new Set<string>();
  fields.forEach((field) => {
    field.conditionalLogic?.rules.forEach((rule) => {
      deps.add(rule.field);
    });
  });
  return Array.from(deps);
}, [fields]);

// Only watch fields that are referenced in conditions
const watchedValues = watch(conditionDependencies);
```

---

## 6. Embed & Share System

### Three Embed Modes

#### 6.1 Standalone Page (Public Route)

**Route:** `/forms/[formId]` (no authentication required)

This is the simplest embed mode. A public Next.js page that fetches the form definition and renders it.

```
src/app/forms/[formId]/page.tsx    ← Public page (no layout auth)
```

```tsx
// src/app/forms/[formId]/page.tsx
// This is a Server Component that fetches form data

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { FormRenderer } from '@/lib/form-builder/FormRenderer';
import { FormSubmitHandler } from './FormSubmitHandler';

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      status: 'published',
      deletedAt: null,
    },
    include: {
      fields: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!form) return notFound();

  // Record view (fire-and-forget)
  trackFormView(formId, form.tenantId);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <FormSubmitHandler form={form} />
      </div>
    </div>
  );
}
```

#### 6.2 Inline Embed (iframe + postMessage)

Generate an iframe embed code that site owners paste into their pages. Communication between iframe and parent uses `postMessage`.

**Embed Code Generator:**
```typescript
// src/lib/form-builder/embed.ts

export function generateInlineEmbedCode(formId: string, baseUrl: string): string {
  return `<!-- F-CORE Form Embed -->
<div id="fcore-form-${formId}"></div>
<script>
(function() {
  var container = document.getElementById('fcore-form-${formId}');
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/forms/${formId}?embed=inline';
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('title', 'F-CORE Form');
  container.appendChild(iframe);

  // Auto-resize iframe based on content height
  window.addEventListener('message', function(event) {
    if (event.origin !== '${baseUrl}') return;
    var data = event.data;
    if (data.type === 'fcore-form-resize' && data.formId === '${formId}') {
      iframe.style.height = data.height + 'px';
    }
    if (data.type === 'fcore-form-submitted' && data.formId === '${formId}') {
      // Custom callback for submission
      if (typeof window.onFCoreFormSubmit === 'function') {
        window.onFCoreFormSubmit(data);
      }
    }
  });
})();
</script>
<!-- End F-CORE Form Embed -->`;
}
```

**Inside the form (iframe side), post messages to parent:**
```typescript
// In the public form page, when embed=inline query param is present:

// Notify parent of height changes
useEffect(() => {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      window.parent.postMessage({
        type: 'fcore-form-resize',
        formId,
        height: entry.contentRect.height,
      }, '*');
    }
  });
  observer.observe(document.body);
  return () => observer.disconnect();
}, [formId]);

// Notify parent on submission
function onSubmitSuccess() {
  window.parent.postMessage({
    type: 'fcore-form-submitted',
    formId,
  }, '*');
}
```

#### 6.3 Popup / Slide-in (JavaScript Snippet)

A lightweight JavaScript widget that loads the form in a modal overlay.

```typescript
export function generatePopupEmbedCode(
  formId: string,
  baseUrl: string,
  trigger: 'button' | 'time' | 'scroll' | 'exit_intent'
): string {
  return `<!-- F-CORE Popup Form -->
<script>
(function() {
  var FORM_ID = '${formId}';
  var BASE_URL = '${baseUrl}';
  var TRIGGER = '${trigger}';

  function showForm() {
    var overlay = document.createElement('div');
    overlay.id = 'fcore-overlay-' + FORM_ID;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:white;border-radius:12px;width:90%;max-width:600px;max-height:90vh;overflow:auto;position:relative;';

    var close = document.createElement('button');
    close.innerHTML = '&times;';
    close.style.cssText = 'position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;z-index:1;';
    close.onclick = function() { overlay.remove(); };

    var iframe = document.createElement('iframe');
    iframe.src = BASE_URL + '/forms/' + FORM_ID + '?embed=popup';
    iframe.style.cssText = 'width:100%;height:500px;border:none;';

    modal.appendChild(close);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Auto-resize
    window.addEventListener('message', function(e) {
      if (e.data.type === 'fcore-form-resize' && e.data.formId === FORM_ID) {
        iframe.style.height = Math.min(e.data.height, window.innerHeight * 0.8) + 'px';
      }
    });

    overlay.onclick = function(e) {
      if (e.target === overlay) overlay.remove();
    };
  }

  // Trigger logic
  if (TRIGGER === 'button') {
    // Attach to elements with data-fcore-form attribute
    document.querySelectorAll('[data-fcore-form="' + FORM_ID + '"]').forEach(function(el) {
      el.addEventListener('click', showForm);
    });
  } else if (TRIGGER === 'time') {
    setTimeout(showForm, 5000);
  } else if (TRIGGER === 'scroll') {
    var triggered = false;
    window.addEventListener('scroll', function() {
      if (!triggered && window.scrollY > document.body.scrollHeight * 0.5) {
        triggered = true;
        showForm();
      }
    });
  } else if (TRIGGER === 'exit_intent') {
    document.addEventListener('mouseout', function(e) {
      if (e.clientY < 5) showForm();
    }, { once: true });
  }
})();
</script>
<!-- End F-CORE Popup Form -->`;
}
```

#### 6.4 Share Link

Simple shareable URL pointing to the standalone page:

```
https://app.fcore.io/forms/{formId}
```

Optionally with UTM parameters for tracking:
```
https://app.fcore.io/forms/{formId}?utm_source=email&utm_campaign=newsletter
```

---

## 7. Submission Processing

### Processing Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Receive     │────>│   Validate   │────>│   Process    │────>│   Store &    │
│   Submission  │     │   & Sanitize │     │   Business   │     │   Notify     │
│               │     │              │     │   Logic      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
      │                     │                     │                    │
  Rate limit           Zod schema           Contact link         Save to DB
  CAPTCHA check        Honeypot check       Auto-create          Send emails
  CORS check           File validation      Contact              Webhook dispatch
                       Sanitize HTML        Set lifecycle         Mark view
                                                                 as converted
```

### Submission Handler

```typescript
// src/app/api/forms/[id]/submissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildZodSchema } from '@/lib/form-builder/schema-builder';
import { rateLimit } from '@/lib/rate-limit';
import { verifyCaptcha } from '@/lib/captcha';
import { sanitizeSubmissionData } from '@/lib/form-builder/sanitize';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: formId } = await params;

  // 1. Rate limiting (10 submissions per minute per IP)
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rateLimitResult = await rateLimit(`form-submit:${formId}:${ip}`, 10, 60);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  // 2. Fetch form with fields
  const form = await prisma.form.findFirst({
    where: { id: formId, status: 'published', deletedAt: null },
    include: { fields: { orderBy: { displayOrder: 'asc' } } },
  });

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  const body = await req.json();

  // 3. CAPTCHA verification (if enabled)
  const settings = form.settings as FormSettings;
  if (settings.captchaEnabled) {
    const captchaValid = await verifyCaptcha(body._captchaToken, settings.captchaType);
    if (!captchaValid.success) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }

  // 4. Honeypot check (if enabled)
  if (settings.honeypotEnabled && body._hp_field) {
    // Bot detected - silently accept but mark as spam
    await prisma.formSubmission.create({
      data: {
        formId,
        tenantId: form.tenantId,
        data: body,
        isSpam: true,
        metadata: { ipAddress: ip, userAgent: req.headers.get('user-agent') },
      },
    });
    // Return success to the bot (don't reveal detection)
    return NextResponse.json({ success: true });
  }

  // 5. Server-side validation
  const fieldConfigs = form.fields.map(mapPrismaFieldToConfig);
  const schema = buildZodSchema(fieldConfigs);
  const validationResult = schema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.flatten() },
      { status: 422 }
    );
  }

  // 6. Sanitize data
  const sanitizedData = sanitizeSubmissionData(validationResult.data);

  // 7. Contact linking/creation
  let contactId: string | null = null;
  let contactEmail: string | null = null;
  const emailField = fieldConfigs.find((f) => f.type === 'email');
  if (emailField) {
    contactEmail = sanitizedData[emailField.name] as string;
    if (contactEmail) {
      contactId = await findOrCreateContact(form.tenantId, contactEmail, sanitizedData, fieldConfigs);
    }
  }

  // 8. Store submission
  const submission = await prisma.formSubmission.create({
    data: {
      formId,
      tenantId: form.tenantId,
      data: sanitizedData,
      contactId,
      contactEmail,
      metadata: {
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') ?? '',
        referrer: req.headers.get('referer') ?? '',
        source: body._source ?? 'standalone',
        captchaScore: body._captchaScore,
        utmSource: body._utmSource,
        utmMedium: body._utmMedium,
        utmCampaign: body._utmCampaign,
      },
    },
  });

  // 9. Mark view as converted (if sessionId provided)
  if (body._sessionId) {
    await prisma.formView.updateMany({
      where: { formId, sessionId: body._sessionId, converted: false },
      data: { converted: true },
    });
  }

  // 10. Async: Send notifications (non-blocking)
  processNotifications(form, submission, sanitizedData).catch(console.error);

  // 11. Async: Dispatch webhooks (non-blocking)
  dispatchWebhooks(form, submission, sanitizedData).catch(console.error);

  return NextResponse.json({
    success: true,
    submissionId: submission.id,
    message: settings.successMessage ?? 'Thank you for your submission!',
    redirectUrl: settings.redirectUrl,
  });
}
```

### Contact Auto-Creation Logic

```typescript
async function findOrCreateContact(
  tenantId: string,
  email: string,
  data: Record<string, unknown>,
  fields: FieldConfig[]
): Promise<string> {
  // Check if contact exists
  const existing = await prisma.contact.findFirst({
    where: { tenantId, email, deletedAt: null },
  });

  if (existing) {
    // Update lifecycle stage if subscriber
    if (existing.lifecycleStage === 'subscriber') {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { lifecycleStage: 'lead', updatedAt: new Date() },
      });
    }
    return existing.id;
  }

  // Auto-create contact from form data
  const firstNameField = fields.find((f) =>
    f.name === 'first_name' || f.name === 'firstName' || f.name === 'firstname'
  );
  const lastNameField = fields.find((f) =>
    f.name === 'last_name' || f.name === 'lastName' || f.name === 'lastname'
  );
  const phoneField = fields.find((f) => f.type === 'phone');
  const companyField = fields.find((f) =>
    f.name === 'company' || f.name === 'company_name'
  );

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      email,
      firstName: firstNameField ? String(data[firstNameField.name] ?? '') : null,
      lastName: lastNameField ? String(data[lastNameField.name] ?? '') : null,
      phone: phoneField ? String(data[phoneField.name] ?? '') : null,
      lifecycleStage: 'lead',
      leadStatus: 'new',
      properties: {
        source: 'form_submission',
        ...(companyField ? { company: data[companyField.name] } : {}),
      },
    },
  });

  return contact.id;
}
```

### Notification Processing

```typescript
async function processNotifications(
  form: FormWithFields,
  submission: FormSubmission,
  data: Record<string, unknown>
): Promise<void> {
  const settings = form.settings as FormSettings;

  // 1. Notify form owner / configured emails
  if (settings.notifyEmails?.length > 0) {
    await sendEmail({
      to: settings.notifyEmails,
      subject: `New submission: ${form.name}`,
      template: 'form-submission-notification',
      data: {
        formName: form.name,
        submissionId: submission.id,
        submittedAt: submission.submittedAt,
        fields: formatSubmissionForEmail(form.fields, data),
      },
    });
  }

  // 2. Auto-responder to submitter
  if (settings.autoResponder?.enabled) {
    const emailField = form.fields.find((f) => f.type === 'email');
    const submitterEmail = emailField ? data[emailField.name] : null;

    if (submitterEmail && typeof submitterEmail === 'string') {
      await sendEmail({
        to: [submitterEmail],
        subject: settings.autoResponder.subject,
        html: settings.autoResponder.body,
      });
    }
  }
}
```

### Webhook Dispatch

```typescript
async function dispatchWebhooks(
  form: FormWithFields,
  submission: FormSubmission,
  data: Record<string, unknown>
): Promise<void> {
  // Future: fetch configured webhooks for this form
  // const webhooks = await prisma.formWebhook.findMany({
  //   where: { formId: form.id, isActive: true },
  // });
  //
  // for (const webhook of webhooks) {
  //   await fetch(webhook.url, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'X-Webhook-Secret': webhook.secret,
  //     },
  //     body: JSON.stringify({
  //       event: 'form.submitted',
  //       formId: form.id,
  //       submissionId: submission.id,
  //       data,
  //       submittedAt: submission.submittedAt,
  //     }),
  //   });
  // }
}
```

---

## 8. API Route Structure

### Complete Route Map

```
src/app/api/forms/
├── route.ts                          GET (list forms), POST (create form)
├── [id]/
│   ├── route.ts                      GET (detail), PATCH (update), DELETE (soft delete)
│   ├── publish/
│   │   └── route.ts                  POST (publish form)
│   ├── duplicate/
│   │   └── route.ts                  POST (duplicate form)
│   ├── fields/
│   │   └── route.ts                  PUT (batch update fields - full replacement)
│   ├── submissions/
│   │   └── route.ts                  GET (list submissions), POST (submit - PUBLIC)
│   ├── analytics/
│   │   └── route.ts                  GET (view/submission/conversion stats)
│   └── embed/
│       └── route.ts                  GET (generate embed codes)

src/app/forms/
├── [formId]/
│   └── page.tsx                      Public form page (standalone)
```

### Endpoint Details

#### `GET /api/forms`
- **Auth:** Required (tenant-scoped)
- **Query Params:** `status`, `search`, `page`, `limit`, `sortBy`, `sortOrder`
- **Response:** Paginated list of forms with submission counts
- **Notes:** `WHERE tenantId = ? AND deletedAt IS NULL`

#### `POST /api/forms`
- **Auth:** Required
- **Body:** `{ name, description?, settings?, theme? }`
- **Validation:** Zod schema for form creation
- **Response:** Created form object
- **Notes:** Auto-generates slug from name

#### `GET /api/forms/[id]`
- **Auth:** Required
- **Response:** Full form with all fields, submission count, view count
- **Notes:** `WHERE id = ? AND tenantId = ? AND deletedAt IS NULL`

#### `PATCH /api/forms/[id]`
- **Auth:** Required
- **Body:** Partial form update (name, description, settings, theme, status)
- **Validation:** Zod partial schema
- **Notes:** Cannot change status to 'published' via PATCH (use /publish)

#### `DELETE /api/forms/[id]`
- **Auth:** Required
- **Notes:** Soft delete (`deletedAt = NOW()`)

#### `POST /api/forms/[id]/publish`
- **Auth:** Required
- **Validation:** Form must have at least 1 non-layout field
- **Notes:** Sets `status = 'published'`, `publishedAt = NOW()`

#### `PUT /api/forms/[id]/fields`
- **Auth:** Required
- **Body:** `{ fields: FieldConfig[] }` - Full field replacement
- **Notes:** Uses transaction to delete existing fields and insert new ones (preserves atomic updates). Alternative: use a diff-based approach for better performance on large forms.

#### `GET /api/forms/[id]/submissions`
- **Auth:** Required (tenant-scoped)
- **Query Params:** `page`, `limit`, `isSpam`, `startDate`, `endDate`, `search`
- **Response:** Paginated submissions with contact info

#### `POST /api/forms/[id]/submissions`
- **Auth:** NOT required (public endpoint)
- **Rate Limit:** 10 per minute per IP
- **CAPTCHA:** Optional (based on form settings)
- **CORS:** Allow configured origins
- **Notes:** See Submission Processing section for full pipeline

#### `GET /api/forms/[id]/analytics`
- **Auth:** Required
- **Response:**
```json
{
  "totalViews": 1250,
  "totalSubmissions": 87,
  "conversionRate": 6.96,
  "submissionsOverTime": [
    { "date": "2026-02-01", "count": 12 },
    { "date": "2026-02-02", "count": 8 }
  ],
  "viewsOverTime": [...],
  "topReferrers": [...],
  "averageCompletionTime": 45,
  "spamCount": 3,
  "fieldDropoff": [
    { "fieldName": "email", "completionRate": 95 },
    { "fieldName": "phone", "completionRate": 72 }
  ]
}
```

#### `GET /api/forms/[id]/embed`
- **Auth:** Required
- **Query Params:** `type` (inline | popup | link), `trigger` (for popup)
- **Response:** Generated embed code string

---

## 9. Performance & Security

### 9.1 CAPTCHA Integration

**Recommendation: reCAPTCHA v3** (with hCaptcha as fallback option)

**Rationale:**
- reCAPTCHA v3 is invisible (no user friction, no puzzles)
- Score-based (0.0 to 1.0) allows nuanced spam detection
- Free for up to 10,000 assessments/month (then $8/month for 100k)
- hCaptcha is the privacy-first alternative (better GDPR compliance)
- Both should be configurable per form via settings

**Implementation:**

```typescript
// src/lib/captcha.ts

interface CaptchaResult {
  success: boolean;
  score?: number;
  errorCodes?: string[];
}

export async function verifyCaptcha(
  token: string | undefined,
  type: 'recaptcha_v3' | 'hcaptcha' = 'recaptcha_v3'
): Promise<CaptchaResult> {
  if (!token) {
    return { success: false, errorCodes: ['missing-token'] };
  }

  if (type === 'recaptcha_v3') {
    return verifyRecaptchaV3(token);
  } else {
    return verifyHCaptcha(token);
  }
}

async function verifyRecaptchaV3(token: string): Promise<CaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('RECAPTCHA_SECRET_KEY not configured');

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`,
  });

  const data = await response.json();
  return {
    success: data.success && data.score >= 0.5,
    score: data.score,
    errorCodes: data['error-codes'],
  };
}

async function verifyHCaptcha(token: string): Promise<CaptchaResult> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('HCAPTCHA_SECRET_KEY not configured');

  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`,
  });

  const data = await response.json();
  return {
    success: data.success,
    errorCodes: data['error-codes'],
  };
}
```

**Client-side (reCAPTCHA v3 provider):**

```tsx
// src/components/providers/RecaptchaProvider.tsx
'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return <>{children}</>;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
```

### 9.2 Rate Limiting

Use an in-memory rate limiter with sliding window for the public submission endpoint. For production, use Redis (Supabase provides Redis via Upstash integration).

```typescript
// src/lib/rate-limit.ts

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, resetAt: now + windowSeconds * 1000 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
```

**Note:** In production, replace with Redis-based rate limiting (e.g., `@upstash/ratelimit`) for multi-instance deployments:

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 9.3 CSRF Protection for Embedded Forms

For forms embedded in iframes on third-party sites, traditional CSRF tokens do not work (the parent page cannot access the iframe's cookies). Instead, use:

1. **Origin/Referer validation:** Check the request's Origin header against allowed domains configured in form settings.
2. **CORS headers:** Restrict which origins can submit to the form.
3. **CAPTCHA:** Acts as a secondary CSRF defense.

```typescript
// In the submission API route:
function validateOrigin(req: NextRequest, allowedOrigins: string[]): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // Allow direct access (standalone page)
  return allowedOrigins.some((allowed) =>
    origin === allowed || origin.endsWith('.' + allowed)
  );
}
```

### 9.4 Honeypot Field

A hidden field that bots will fill but humans will not see. Added to every form when `honeypotEnabled` is true.

```tsx
// In FormRenderer - invisible to users via CSS
{settings.honeypotEnabled && (
  <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
    <label htmlFor="_hp_field">Leave this empty</label>
    <input
      type="text"
      id="_hp_field"
      name="_hp_field"
      tabIndex={-1}
      autoComplete="off"
      onChange={(e) => setHoneypotValue(e.target.value)}
    />
  </div>
)}
```

### 9.5 File Upload Handling

Files are uploaded directly to Supabase Storage, not through the form submission API. This avoids large payloads and allows progress tracking.

```typescript
// src/lib/form-builder/file-upload.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadFormFile(
  formId: string,
  fieldName: string,
  file: File
): Promise<{ url: string; path: string }> {
  // Validate file size and type on client (server validates too)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `form-uploads/${formId}/${fieldName}/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from('form-files')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('form-files')
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}
```

### 9.6 Input Sanitization

```typescript
// src/lib/form-builder/sanitize.ts

/**
 * Sanitize submission data to prevent XSS and injection attacks.
 * Strips HTML tags from string values while preserving the data.
 */
export function sanitizeSubmissionData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip internal fields
    if (key.startsWith('_')) continue;

    if (typeof value === 'string') {
      sanitized[key] = stripHtmlTags(value.trim());
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((v) =>
        typeof v === 'string' ? stripHtmlTags(v.trim()) : v
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}
```

---

## 10. Dependencies & Installation

### New Dependencies Required

```bash
# Drag and Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Form Handling (likely already needed, check package.json)
npm install react-hook-form @hookform/resolvers zod

# CAPTCHA
npm install react-google-recaptcha-v3

# Rate Limiting (production)
npm install @upstash/ratelimit @upstash/redis

# Optional: Rich text for paragraph fields
# npm install @tiptap/react @tiptap/starter-kit
```

### Environment Variables Required

```env
# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Le...
RECAPTCHA_SECRET_KEY=6Le...

# hCaptcha (alternative)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=...
HCAPTCHA_SECRET_KEY=...

# Upstash Redis (production rate limiting)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### File Structure Plan

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── forms/
│   │       ├── page.tsx                   # Form list (dashboard)
│   │       ├── new/
│   │       │   └── page.tsx               # Create form
│   │       └── [id]/
│   │           ├── page.tsx               # Form detail/summary
│   │           ├── edit/
│   │           │   └── page.tsx           # Form builder (drag-drop editor)
│   │           ├── submissions/
│   │           │   └── page.tsx           # View submissions
│   │           ├── analytics/
│   │           │   └── page.tsx           # Analytics dashboard
│   │           └── settings/
│   │               └── page.tsx           # Form settings, embed codes
│   ├── forms/
│   │   └── [formId]/
│   │       └── page.tsx                   # Public form page (standalone)
│   └── api/
│       └── forms/
│           ├── route.ts                   # GET (list), POST (create)
│           └── [id]/
│               ├── route.ts              # GET, PATCH, DELETE
│               ├── publish/route.ts      # POST
│               ├── duplicate/route.ts    # POST
│               ├── fields/route.ts       # PUT (batch update)
│               ├── submissions/route.ts  # GET (list), POST (submit - public)
│               ├── analytics/route.ts    # GET
│               └── embed/route.ts        # GET
├── components/
│   └── form-builder/
│       ├── FormBuilder.tsx               # Main builder component (DnD context)
│       ├── BuilderCanvas.tsx             # Drop zone + sortable fields
│       ├── BuilderSidebar.tsx            # Field palette + properties panel
│       ├── FieldPalette.tsx              # Draggable field type items
│       ├── FieldProperties.tsx           # Selected field config editor
│       ├── FieldRenderer.tsx             # Renders a single field
│       ├── FormPreview.tsx               # Live preview panel
│       ├── FormRenderer.tsx              # Public form rendering engine
│       ├── ConditionalLogicEditor.tsx    # UI for configuring conditional rules
│       ├── EmbedCodeDialog.tsx           # Embed code generator dialog
│       ├── SubmissionTable.tsx           # Submissions data table
│       └── fields/                       # Individual field type components
│           ├── TextField.tsx
│           ├── EmailField.tsx
│           ├── PhoneField.tsx
│           ├── NumberField.tsx
│           ├── UrlField.tsx
│           ├── TextareaField.tsx
│           ├── SelectField.tsx
│           ├── MultiSelectField.tsx
│           ├── RadioField.tsx
│           ├── CheckboxField.tsx
│           ├── DateField.tsx
│           ├── FileField.tsx
│           ├── HiddenField.tsx
│           ├── HeadingField.tsx
│           ├── ParagraphField.tsx
│           ├── DividerField.tsx
│           └── SpacerField.tsx
├── lib/
│   └── form-builder/
│       ├── field-registry.ts             # Field type registry
│       ├── schema-builder.ts             # Dynamic Zod schema builder
│       ├── conditional-engine.ts         # Conditional logic evaluator
│       ├── embed.ts                      # Embed code generators
│       ├── sanitize.ts                   # Input sanitization
│       ├── file-upload.ts                # Supabase Storage upload
│       └── types.ts                      # Shared TypeScript types
├── hooks/
│   └── form-builder/
│       ├── useFormBuilder.ts             # Builder state management
│       ├── useMultiStepForm.ts           # Multi-step form logic
│       └── useFormAnalytics.ts           # Analytics data fetching
└── lib/
    ├── captcha.ts                        # CAPTCHA verification
    └── rate-limit.ts                     # Rate limiting
```

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **DnD Library** | `@dnd-kit/core` + `@dnd-kit/sortable` | Only actively maintained library supporting both palette-to-canvas drag AND sortable reordering. 12KB bundle, 60fps performance, full TypeScript support. |
| **Form State** | `react-hook-form` + `@hookform/resolvers` | Minimal re-renders, built-in `watch()` for conditional logic, `Controller` for custom components, `zodResolver` for validation. |
| **Validation** | Dynamic Zod schema generation | Same schema used client-side (react-hook-form resolver) and server-side (submission validation). Type-safe, composable, extensible. |
| **Conditional Logic** | Custom engine with reactive `watch()` | Lightweight evaluator (no external dependency). Supports AND/OR logic, 10 operators. Optimized by watching only condition-dependent fields. |
| **CAPTCHA** | reCAPTCHA v3 (primary), hCaptcha (alternative) | Invisible, score-based, configurable per form. hCaptcha for privacy-sensitive tenants. |
| **Spam Prevention** | Multi-layer: CAPTCHA + Honeypot + Rate Limiting | Defense in depth. Honeypot catches simple bots silently. Rate limiting prevents abuse. CAPTCHA handles sophisticated bots. |
| **File Upload** | Direct to Supabase Storage | Avoids large payloads through API routes. Client-side upload with progress. Server validates metadata. |
| **Form Data Storage** | JSONB for dynamic fields, columns for queryable fields | Best practice for form builders (validated by PostgreSQL community). Enables flexible schemas while maintaining query performance for status, dates, tenant filtering. |
| **Embed System** | iframe + postMessage + JavaScript snippet | Standard approach used by HubSpot, Typeform, JotForm. iframe provides sandboxing. postMessage enables cross-origin communication for auto-resize and submission callbacks. |

---

## References

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [react-hook-form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Prisma JSON Field Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [hCaptcha Documentation](https://docs.hcaptcha.com/)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [react-beautiful-dnd Deprecation Notice (Oct 2024)](https://github.com/atlassian/react-beautiful-dnd/issues/2672)
- [dnd-kit Form Builder Discussion](https://github.com/clauderic/dnd-kit/discussions/639)
- [HubSpot Form Embed Documentation](https://knowledge.hubspot.com/forms/how-can-i-share-a-hubspot-form-if-im-using-an-external-site)
