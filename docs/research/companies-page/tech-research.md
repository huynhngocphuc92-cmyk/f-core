# Companies Page - Technical Research Report

> **Date**: 2026-02-07
> **Author**: Tech Researcher (AI Agent)
> **Purpose**: Complete implementation blueprint for the Companies Page feature
> **Status**: Complete

---

## Table of Contents

1. [Existing Code Inventory](#1-existing-code-inventory)
2. [Files to Create (New)](#2-files-to-create-new)
3. [Files to Modify (Existing)](#3-files-to-modify-existing)
4. [Component Architecture](#4-component-architecture)
5. [API Specification](#5-api-specification)
6. [Reuse Strategy](#6-reuse-strategy)
7. [Data Model Deep Dive](#7-data-model-deep-dive)
8. [Validation Schemas](#8-validation-schemas)
9. [Implementation Order](#9-implementation-order)

---

## 1. Existing Code Inventory

### 1.1 Database Model (COMPLETE)

**File**: `prisma/schema.prisma` (lines 115-168)

The `Company` model is fully defined with all fields:

| Field | Type | Nullable | Default | Purpose |
|-------|------|----------|---------|---------|
| `id` | String (UUID) | No | `uuid()` | Primary key |
| `tenantId` | String | No | - | Multi-tenant isolation |
| `name` | String | No | - | Company name (required) |
| `domain` | String | Yes | - | Website domain |
| `description` | String | Yes | - | Company description |
| `logoUrl` | String | Yes | - | Company logo URL |
| `industry` | String | Yes | - | Industry classification |
| `type` | String | Yes | - | prospect/partner/reseller/vendor/other |
| `size` | String | Yes | - | Employee count range |
| `annualRevenue` | Decimal(15,2) | Yes | - | Revenue |
| `phone` | String | Yes | - | Phone number |
| `website` | String | Yes | - | Website URL |
| `linkedinUrl` | String | Yes | - | LinkedIn profile |
| `address` | String | Yes | - | Street address |
| `city` | String | Yes | - | City |
| `state` | String | Yes | - | State/Province |
| `country` | String | Yes | - | Country |
| `postalCode` | String | Yes | - | Postal code |
| `ownerId` | String | Yes | - | FK to User (owner) |
| `lifecycleStage` | String | Yes | - | Lifecycle stage |
| `properties` | Json | No | `{}` | JSONB for custom props |
| `createdAt` | DateTime | No | `now()` | Created timestamp |
| `updatedAt` | DateTime | No | `@updatedAt` | Updated timestamp |
| `deletedAt` | DateTime | Yes | - | Soft delete marker |
| `createdBy` | String | Yes | - | Creator ID |
| `updatedBy` | String | Yes | - | Last updater ID |

**Relations**:
- `tenant` -> Tenant (many-to-one)
- `owner` -> User (many-to-one via `CompanyOwner`)
- `contacts` -> ContactCompany[] (many-to-many through junction)
- `deals` -> DealCompany[] (many-to-many through junction)
- `activities` -> Activity[] (one-to-many)

**Indexes**:
- `@@index([tenantId])`
- `@@index([domain])`
- `@@index([ownerId])`
- `@@index([deletedAt])`

### 1.2 API Routes (PARTIAL)

**File**: `src/app/api/companies/route.ts` (EXISTS - 87 lines)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/companies` | EXISTS | Pagination, search (name/domain), includes owner + _count |
| POST | `/api/companies` | EXISTS | Creates company, requires `name`, uses `tenantId` fallback |
| GET | `/api/companies/[id]` | MISSING | Individual company fetch |
| PATCH | `/api/companies/[id]` | MISSING | Update company |
| DELETE | `/api/companies/[id]` | MISSING | Soft delete company |

**Existing GET response shape**:
```typescript
{
  data: Company[], // includes owner: { id, name, email }, _count: { contacts, deals }
  pagination: { page: number, limit: number, total: number, totalPages: number }
}
```

**Existing POST** accepts all Company fields in body. No Zod validation (manual check for `body.name` only).

### 1.3 UI Components (NONE)

- **No** `src/components/companies/` directory exists
- **No** `src/app/(dashboard)/companies/` directory exists
- The Sidebar (`AppSidebar.tsx` line 27) already has a "Companies" nav link pointing to `/companies`

### 1.4 Seed Data (EXISTS)

**File**: `prisma/seed.ts` (lines 114-134)

4 sample companies seeded:
1. TechCorp Inc (techcorp.com, Technology, 51-200)
2. StartupIO (startup.io, Software, 11-50)
3. Enterprise Solutions (enterprise.com, Consulting, 201-500)
4. Creative Agency (agency.co, Marketing, 1-10)

### 1.5 What's Missing (Gap Analysis)

| Component | Status | Priority |
|-----------|--------|----------|
| `/api/companies/[id]/route.ts` | MISSING | P0 |
| `(dashboard)/companies/page.tsx` | MISSING | P0 |
| `CompaniesTable.tsx` | MISSING | P0 |
| `CompanyForm.tsx` | MISSING | P0 |
| `(dashboard)/companies/[id]/page.tsx` | MISSING | P1 |
| `CompanyDetail.tsx` | MISSING | P1 |
| `CompanyCard.tsx` | MISSING | P2 |
| Industry/Type filter on existing GET API | MISSING | P1 |
| Zod validation on POST | MISSING | P1 |
| Sort parameter on GET API | MISSING | P1 |

---

## 2. Files to Create (New)

### 2.1 Complete File List

```
# API Routes
src/app/api/companies/[id]/route.ts           # GET, PATCH, DELETE for individual company

# Pages
src/app/(dashboard)/companies/page.tsx         # Company list page (simple wrapper)
src/app/(dashboard)/companies/[id]/page.tsx    # Company detail page (simple wrapper)

# Components
src/components/companies/CompaniesTable.tsx     # Company table (main list component)
src/components/companies/CompanyForm.tsx        # Create/Edit form (modal or slide panel)
src/components/companies/CompanyDetail.tsx      # Detail view component
src/components/companies/CompanyCard.tsx        # Compact card (for associations in Contact/Deal detail)
```

**Total**: 7 new files

### 2.2 File Sizes (Estimated)

| File | Est. Lines | Complexity |
|------|-----------|------------|
| `[id]/route.ts` | ~120 | Low (copy from contacts pattern) |
| `companies/page.tsx` | ~5 | Trivial (wrapper) |
| `companies/[id]/page.tsx` | ~5 | Trivial (wrapper) |
| `CompaniesTable.tsx` | ~500 | High (core table component) |
| `CompanyForm.tsx` | ~250 | Medium (form with validation) |
| `CompanyDetail.tsx` | ~300 | Medium (detail view with tabs) |
| `CompanyCard.tsx` | ~80 | Low (simple card) |

---

## 3. Files to Modify (Existing)

### 3.1 Required Modifications

| File | Change | Reason |
|------|--------|--------|
| `src/app/api/companies/route.ts` | Add `industry`, `type`, `size` filter params; add `sort` and `sortOrder` params; add Zod validation for POST | Complete the API feature set |
| `prisma/seed.ts` | Add more diverse company data (10-15 companies with varied industries, types, sizes, revenues) | Better demo data for table testing |

### 3.2 Optional Modifications (Phase 2)

| File | Change | Reason |
|------|--------|--------|
| `src/components/dashboard/AppSidebar.tsx` | Add badge count for companies | Consistency with contacts badge |
| `src/app/(dashboard)/contacts/page.tsx` | N/A - no changes needed | Already standalone |

---

## 4. Component Architecture

### 4.1 CompaniesTable (Primary Component)

**Reference**: Follows `ContactsTable.tsx` pattern exactly (513 lines)

#### Props Interface

```typescript
// No props - self-contained component with internal state
// (Same pattern as ContactsTable which takes no props)
export function CompaniesTable() { ... }
```

#### Type Definitions

```typescript
type Company = {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  type: string | null;
  size: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  _count: { contacts: number; deals: number };
  createdAt: string;
};

type SortField = "name" | "industry" | "city" | "createdAt";
type SortOrder = "asc" | "desc";
```

#### Column Definitions

| # | Column | Sortable | Filterable | Width | Content |
|---|--------|----------|------------|-------|---------|
| 0 | Checkbox | No | No | w-12 | Bulk select |
| 1 | Name | Yes | Via search | auto | Company name + domain + avatar (first letter) |
| 2 | Phone | No | No | auto | Phone number |
| 3 | City/Country | No | No | auto | `{city}, {country}` |
| 4 | Industry | Yes | Yes (dropdown) | auto | Industry badge |
| 5 | Associated Contacts | No | No | auto | `_count.contacts` number |
| 6 | Associated Deals | No | No | auto | `_count.deals` number |
| 7 | Owner | No | No | auto | Owner name |
| 8 | Actions | No | No | w-12 | MoreHorizontal menu |

#### State Management

```typescript
// Data
const [companies, setCompanies] = useState<Company[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Filters & Search
const [searchQuery, setSearchQuery] = useState("");
const [selectedIndustry, setSelectedIndustry] = useState<string>("");
const [selectedType, setSelectedType] = useState<string>("");
const [showFilters, setShowFilters] = useState(false);

// Pagination
const [page, setPage] = useState(1);
const [limit] = useState(50);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(0);

// Sorting
const [sortField, setSortField] = useState<SortField>("createdAt");
const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

// Bulk selection
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

#### API Integration

```typescript
const fetchCompanies = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(searchQuery && { search: searchQuery }),
      ...(selectedIndustry && { industry: selectedIndustry }),
      ...(selectedType && { type: selectedType }),
    });

    const response = await fetch(`/api/companies?${params}`);
    if (!response.ok) throw new Error("Failed to fetch companies");

    const data = await response.json();

    // Client-side sorting (matches ContactsTable pattern)
    let sortedCompanies = data.data;
    if (sortField) {
      sortedCompanies = [...sortedCompanies].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    setCompanies(sortedCompanies);
    setTotal(data.pagination.total);
    setTotalPages(data.pagination.totalPages);
  } catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setLoading(false);
  }
}, [page, limit, searchQuery, selectedIndustry, selectedType, sortField, sortOrder]);
```

#### Key Features (Matching ContactsTable)

1. **Search bar** - searches name and domain
2. **Filter panel** - industry dropdown, company type dropdown
3. **Sortable columns** - name, industry, city, createdAt
4. **Bulk actions** - select all, bulk delete
5. **CSV export** - export visible companies
6. **Pagination** - page navigation with count
7. **Loading/Error/Empty states** - all three handled
8. **Row click** - navigates to `/companies/{id}`

#### Constants (Hoisted Outside Component)

```typescript
const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "software", label: "Software" },
  { value: "consulting", label: "Consulting" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

const COMPANY_TYPES = [
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
  { value: "reseller", label: "Reseller" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1001-5000", label: "1001-5000" },
  { value: "5001+", label: "5001+" },
];
```

### 4.2 CompanyForm Component

```typescript
interface CompanyFormProps {
  company?: Company;           // If editing, pass existing company
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface CompanyFormData {
  name: string;                // Required
  domain?: string;
  description?: string;
  industry?: string;
  type?: string;
  size?: string;
  annualRevenue?: number;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerId?: string;
}
```

**Form sections**:
1. Basic Information (name, domain, description)
2. Company Details (industry, type, size, annualRevenue)
3. Contact Info (phone, website, linkedinUrl)
4. Address (address, city, state, country, postalCode)

### 4.3 CompanyDetail Component

```typescript
interface CompanyDetailProps {
  companyId: string;
}
```

**Sections**:
1. Header (name, domain, logo, actions: Edit, Delete)
2. About (left panel): description, industry, type, size, revenue, address
3. Associated Contacts (right/tab): list from ContactCompany join
4. Associated Deals (right/tab): list from DealCompany join
5. Activity Timeline (bottom): recent activities

### 4.4 CompanyCard Component

```typescript
interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    domain?: string | null;
    industry?: string | null;
  };
  onClick?: () => void;
}
```

Simple card showing name, domain, industry. Used in Contact detail and Deal detail pages for displaying associated companies.

---

## 5. API Specification

### 5.1 GET /api/companies (Existing - Needs Enhancement)

**Current**: Supports `page`, `limit`, `search`.
**Enhancement needed**: Add `industry`, `type`, `size`, `sort`, `sortOrder` params.

```
GET /api/companies?page=1&limit=50&search=tech&industry=technology&type=prospect&sort=name&sortOrder=asc
```

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |
| `search` | string | "" | Search name/domain (case-insensitive contains) |
| `industry` | string | - | Filter by industry |
| `type` | string | - | Filter by company type |
| `size` | string | - | Filter by company size |
| `sort` | string | "createdAt" | Sort field |
| `sortOrder` | string | "desc" | Sort direction (asc/desc) |

**Response (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "TechCorp Inc",
      "domain": "techcorp.com",
      "industry": "Technology",
      "type": "prospect",
      "size": "51-200",
      "phone": "+1-555-0200",
      "city": "San Francisco",
      "country": "US",
      "owner": { "id": "uuid", "name": "Admin User", "email": "admin@f-core.com" },
      "_count": { "contacts": 3, "deals": 2 },
      "createdAt": "2026-02-07T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 4,
    "totalPages": 1
  }
}
```

**Error Response (500)**:
```json
{ "error": "Failed to fetch companies" }
```

### 5.2 POST /api/companies (Existing - Needs Zod Validation)

```
POST /api/companies
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "New Company",           // Required
  "domain": "newcompany.com",      // Optional
  "description": "...",            // Optional
  "industry": "Technology",        // Optional
  "type": "prospect",              // Optional
  "size": "11-50",                 // Optional
  "annualRevenue": 1000000,        // Optional
  "phone": "+1-555-0200",          // Optional
  "website": "https://newco.com",  // Optional
  "linkedinUrl": "...",            // Optional
  "address": "123 Main St",       // Optional
  "city": "San Francisco",        // Optional
  "state": "CA",                   // Optional
  "country": "US",                 // Optional
  "postalCode": "94105",           // Optional
  "ownerId": "uuid"               // Optional
}
```

**Zod Validation Schema** (TO ADD):
```typescript
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  domain: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  type: z.enum(["prospect", "partner", "reseller", "vendor", "other"]).optional().nullable(),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001+"]).optional().nullable(),
  annualRevenue: z.number().positive().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
  linkedinUrl: z.string().url().max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  properties: z.record(z.unknown()).optional().default({}),
});
```

**Response (201)**: Created company object
**Error (400)**: `{ "error": "Company name is required" }` or Zod validation errors
**Error (500)**: `{ "error": "Failed to create company" }`

### 5.3 GET /api/companies/[id] (NEW)

```
GET /api/companies/{id}
```

**Response (200)**:
```json
{
  "id": "uuid",
  "name": "TechCorp Inc",
  "domain": "techcorp.com",
  "description": "...",
  "industry": "Technology",
  "type": "prospect",
  "size": "51-200",
  "annualRevenue": "1000000.00",
  "phone": "+1-555-0200",
  "website": "https://techcorp.com",
  "linkedinUrl": "...",
  "address": "...",
  "city": "San Francisco",
  "state": "CA",
  "country": "US",
  "postalCode": "94105",
  "owner": { "id": "uuid", "name": "Admin User", "email": "admin@f-core.com" },
  "contacts": [
    {
      "contactId": "uuid",
      "companyId": "uuid",
      "isPrimary": true,
      "role": "employee",
      "contact": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@techcorp.com"
      }
    }
  ],
  "deals": [
    {
      "dealId": "uuid",
      "companyId": "uuid",
      "isPrimary": true,
      "deal": {
        "id": "uuid",
        "name": "TechCorp Enterprise Deal",
        "amount": "50000.00"
      }
    }
  ],
  "activities": [
    {
      "id": "uuid",
      "type": "note",
      "subject": "Initial contact",
      "body": "...",
      "createdAt": "2026-02-07T00:00:00.000Z"
    }
  ],
  "createdAt": "2026-02-07T00:00:00.000Z",
  "updatedAt": "2026-02-07T00:00:00.000Z"
}
```

**Prisma include pattern** (from contacts `[id]/route.ts` pattern):
```typescript
const company = await prisma.company.findUnique({
  where: { id, deletedAt: null },
  include: {
    owner: { select: { id: true, name: true, email: true } },
    contacts: {
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      },
    },
    deals: {
      include: {
        deal: {
          select: { id: true, name: true, amount: true, closeDate: true }
        }
      },
    },
    activities: {
      orderBy: { createdAt: "desc" },
      take: 20,
    },
  },
});
```

**Error (404)**: `{ "error": "Company not found" }`
**Error (500)**: `{ "error": "Failed to fetch company" }`

### 5.4 PATCH /api/companies/[id] (NEW)

```
PATCH /api/companies/{id}
Content-Type: application/json
```

**Request Body** (partial update - all fields optional):
```json
{
  "name": "Updated Name",
  "industry": "Software",
  "annualRevenue": 2000000
}
```

**Zod Validation Schema**:
```typescript
const updateCompanySchema = createCompanySchema.partial();
// All fields become optional for PATCH
```

**Implementation Pattern** (from contacts `[id]/route.ts`):
```typescript
const company = await prisma.company.update({
  where: { id },
  data: {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.domain !== undefined && { domain: body.domain }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.industry !== undefined && { industry: body.industry }),
    ...(body.type !== undefined && { type: body.type }),
    ...(body.size !== undefined && { size: body.size }),
    ...(body.annualRevenue !== undefined && { annualRevenue: body.annualRevenue }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.website !== undefined && { website: body.website }),
    ...(body.linkedinUrl !== undefined && { linkedinUrl: body.linkedinUrl }),
    ...(body.address !== undefined && { address: body.address }),
    ...(body.city !== undefined && { city: body.city }),
    ...(body.state !== undefined && { state: body.state }),
    ...(body.country !== undefined && { country: body.country }),
    ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
    ...(body.ownerId !== undefined && { ownerId: body.ownerId }),
    ...(body.lifecycleStage !== undefined && { lifecycleStage: body.lifecycleStage }),
    ...(body.properties !== undefined && { properties: body.properties }),
    updatedBy: body.updatedBy,
  },
  include: {
    owner: { select: { id: true, name: true, email: true } },
  },
});
```

**Response (200)**: Updated company object
**Error (500)**: `{ "error": "Failed to update company" }`

### 5.5 DELETE /api/companies/[id] (NEW)

```
DELETE /api/companies/{id}
```

**Implementation** (soft delete, matches contacts pattern):
```typescript
await prisma.company.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

**Response (200)**: `{ "success": true }`
**Error (500)**: `{ "error": "Failed to delete company" }`

---

## 6. Reuse Strategy

### 6.1 Direct Copy (Adapt field names only)

| Source | Target | Changes Needed |
|--------|--------|----------------|
| `ContactsTable.tsx` structure | `CompaniesTable.tsx` | Replace Contact type with Company type, change columns, change filter options, change API endpoint |
| `contacts/page.tsx` | `companies/page.tsx` | Change import from ContactsTable to CompaniesTable |
| `api/contacts/[id]/route.ts` | `api/companies/[id]/route.ts` | Change `prisma.contact` to `prisma.company`, adapt field spread in PATCH, change include relations |
| `api/contacts/route.ts` patterns | `api/companies/route.ts` enhancements | Add industry/type/size filters following existing search pattern |

### 6.2 Pattern Reuse Map

```
ContactsTable.tsx                    CompaniesTable.tsx
├── Type definitions          ->     Adapt for Company fields
├── LIFECYCLE_STAGES const    ->     INDUSTRIES + COMPANY_TYPES consts
├── useState hooks            ->     Same pattern, different filter names
├── fetchContacts()           ->     fetchCompanies() (same structure)
├── handleSort()              ->     Identical logic
├── handleSelectAll/One()     ->     Identical logic
├── handleBulkDelete()        ->     Identical logic (change endpoint)
├── handleExport()            ->     Adapt CSV headers/fields
├── clearFilters()            ->     Same logic, different state vars
├── SortIcon component        ->     Identical
├── getLifecycleColor()       ->     getIndustryColor() (similar)
├── Page Header               ->     Change title "Companies", count
├── Bulk Actions Bar          ->     Identical
├── Filters Bar               ->     Change filter options
├── Table columns             ->     Change to Company columns
├── Pagination                ->     Identical
└── Loading/Error/Empty       ->     Change text strings
```

### 6.3 Shared Utilities

From `src/lib/utils.ts`:
- `cn()` - Tailwind class merging (already used project-wide)

Lucide icons needed (already imported in project):
- `Building2` - Company icon
- `Plus`, `Search`, `Filter`, `Download`, `MoreHorizontal` - Action icons (same as contacts)
- `ChevronLeft`, `ChevronRight` - Pagination (same as contacts)
- `Trash2`, `X` - Bulk actions (same as contacts)
- `ArrowUpDown`, `ArrowUp`, `ArrowDown` - Sort icons (same as contacts)
- `Globe` - Domain/website icon (new for companies)
- `Phone` - Phone icon (new for companies)
- `MapPin` - Location icon (new for companies)
- `Users` - Associated contacts count icon (new)
- `Handshake` or `CircleDollarSign` - Associated deals count icon (new)

### 6.4 Design System Tokens Used

From `docs/DESIGN_SYSTEM.md`:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0891b2` / `cyan-600` | Buttons, links, active states |
| Primary Hover | `#0ea5e9` / `sky-500` | Hover states |
| Text Primary | `#111827` / `gray-900` | Headings |
| Text Secondary | `#4b5563` / `gray-600` | Body text |
| Border | `#e5e7eb` / `gray-200` | Table borders |
| Background | `#f9fafb` / `gray-50` | Page background |
| Card | `rounded-2xl bg-white p-6 border border-gray-100 shadow-sm` | Company cards |
| Badge | `rounded-full bg-cyan-100 px-4 py-1.5 text-sm text-cyan-700` | Industry badges |

---

## 7. Data Model Deep Dive

### 7.1 Association Tables

**ContactCompany** (many-to-many):
```
contactId   String    (composite PK)
companyId   String    (composite PK)
isPrimary   Boolean   @default(false)
role        String?   // employee, owner, decision_maker
createdAt   DateTime  @default(now())
```

**DealCompany** (many-to-many):
```
dealId      String    (composite PK)
companyId   String    (composite PK)
isPrimary   Boolean   @default(false)
createdAt   DateTime  @default(now())
```

### 7.2 Key Queries

**List companies with counts**:
```sql
SELECT c.*,
  (SELECT COUNT(*) FROM "ContactCompany" WHERE "companyId" = c.id) as contact_count,
  (SELECT COUNT(*) FROM "DealCompany" WHERE "companyId" = c.id) as deal_count
FROM "Company" c
WHERE c."deletedAt" IS NULL
ORDER BY c."createdAt" DESC
LIMIT 50 OFFSET 0;
```

**Search companies**:
```sql
SELECT * FROM "Company"
WHERE "deletedAt" IS NULL
  AND (name ILIKE '%search%' OR domain ILIKE '%search%')
```

### 7.3 Multi-tenancy Enforcement

CRITICAL: Every query MUST include `tenantId` filter.

Currently, the existing `GET /api/companies` does NOT enforce `tenantId`. This needs to be addressed:

```typescript
// Current (MISSING tenant check):
const where = { deletedAt: null, ... };

// Should be:
const where = { deletedAt: null, tenantId: currentTenantId, ... };
```

> **NOTE**: Until authentication is implemented, we use a fallback tenantId. But the query structure must be tenant-aware from day one.

---

## 8. Validation Schemas

### 8.1 Zod Schemas for API

```typescript
// src/lib/validations/company.ts (new file, optional)

import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  domain: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  type: z
    .enum(["prospect", "partner", "reseller", "vendor", "other"])
    .optional()
    .nullable(),
  size: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001+"])
    .optional()
    .nullable(),
  annualRevenue: z.number().positive().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  linkedinUrl: z.string().max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  lifecycleStage: z.string().optional().nullable(),
  properties: z.record(z.unknown()).optional().default({}),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
```

### 8.2 Client-side Form Validation

Same Zod schemas can be used client-side if needed. For now, basic HTML5 validation (required, maxlength) is sufficient for CompanyForm, matching the ContactsTable approach.

---

## 9. Implementation Order

### Phase 1: API Layer (Backend First)

1. **Create** `src/app/api/companies/[id]/route.ts` - GET, PATCH, DELETE
2. **Enhance** `src/app/api/companies/route.ts` - Add industry/type/size filters

### Phase 2: Core UI (Main Table)

3. **Create** `src/components/companies/CompaniesTable.tsx`
4. **Create** `src/app/(dashboard)/companies/page.tsx` (wrapper)

### Phase 3: CRUD UI (Forms & Detail)

5. **Create** `src/components/companies/CompanyForm.tsx`
6. **Create** `src/components/companies/CompanyDetail.tsx`
7. **Create** `src/app/(dashboard)/companies/[id]/page.tsx` (wrapper)

### Phase 4: Polish

8. **Create** `src/components/companies/CompanyCard.tsx`
9. **Enhance** `prisma/seed.ts` - More diverse seed data
10. **Optional**: Add Zod validation to API routes

### Dependency Graph

```
[API: companies/[id]/route.ts]  -->  [CompanyDetail.tsx]  -->  [companies/[id]/page.tsx]
                                         |
[API: companies/route.ts]  ---------->  [CompaniesTable.tsx]  -->  [companies/page.tsx]
                                         |
                                    [CompanyForm.tsx]
                                         |
                                    [CompanyCard.tsx] (standalone, no deps)
```

---

## Appendix A: File Reference Summary

### Existing Files Read

| File | Lines | Key Takeaway |
|------|-------|-------------|
| `prisma/schema.prisma` | 409 | Company model complete (lines 115-168), all relations defined |
| `src/app/api/companies/route.ts` | 87 | GET (paginated) + POST exist, need filters + validation |
| `src/app/api/contacts/[id]/route.ts` | 114 | Pattern to copy for companies [id] route |
| `src/app/api/contacts/route.ts` | 113 | Pattern for enhanced GET with filters |
| `src/components/contacts/ContactsTable.tsx` | 513 | Primary pattern to replicate for CompaniesTable |
| `src/app/(dashboard)/contacts/page.tsx` | 5 | Minimal wrapper pattern |
| `src/app/(dashboard)/layout.tsx` | 16 | Uses AppSidebar, `ml-64` main content |
| `src/components/dashboard/AppSidebar.tsx` | 172 | Companies link exists at `/companies` (line 27) |
| `src/components/layout/Sidebar.tsx` | 470 | Alternative sidebar (CVA-based, design system) |
| `src/lib/prisma.ts` | 25 | PrismaClient singleton with pg adapter |
| `src/lib/utils.ts` | 23 | `cn()` utility for Tailwind classes |
| `prisma/seed.ts` | 194 | 4 sample companies seeded |
| `docs/DESIGN_SYSTEM.md` | 254 | Brand colors, typography, component patterns |
| `docs/REACT_BEST_PRACTICES.md` | 458 | Component patterns, hooks, file organization |

### New Files to Create

| File | Est. Lines | Priority |
|------|-----------|----------|
| `src/app/api/companies/[id]/route.ts` | ~120 | P0 |
| `src/app/(dashboard)/companies/page.tsx` | ~5 | P0 |
| `src/components/companies/CompaniesTable.tsx` | ~500 | P0 |
| `src/components/companies/CompanyForm.tsx` | ~250 | P0 |
| `src/app/(dashboard)/companies/[id]/page.tsx` | ~5 | P1 |
| `src/components/companies/CompanyDetail.tsx` | ~300 | P1 |
| `src/components/companies/CompanyCard.tsx` | ~80 | P2 |

### Existing Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/app/api/companies/route.ts` | Add filters + Zod | P1 |
| `prisma/seed.ts` | More company seed data | P2 |

---

*End of Technical Research Report*
