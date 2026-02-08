# Companies Page - Implementation Plan

> **Feature**: Companies Page (P0 CRUD)
> **Phase**: Team 2 - Execution
> **Based on**: docs/research/companies-page/research-summary.md

---

## Files to Create

| # | File | Purpose | Reference |
|---|------|---------|-----------|
| 1 | `src/app/api/companies/[id]/route.ts` | GET, PATCH, DELETE individual company | `src/app/api/contacts/[id]/route.ts` |
| 2 | `src/components/companies/CompaniesTable.tsx` | Main data table with search, filters, sort, pagination, bulk actions | `src/components/contacts/ContactsTable.tsx` |
| 3 | `src/components/companies/CompanyForm.tsx` | Slide-in create/edit form with validation | Research summary Section 8 |
| 4 | `src/app/(dashboard)/companies/page.tsx` | Page wrapper | `src/app/(dashboard)/contacts/page.tsx` |

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/api/companies/route.ts` | Add industry/type/size filters, phone search, tenantId enforcement, Zod validation on POST |

## Implementation Order

1. API [id] route (no dependencies)
2. Enhance existing API list route (no dependencies)
3. CompaniesTable component (depends on API)
4. CompanyForm component (depends on API)
5. Page wrapper (depends on CompaniesTable)

## API Contract

### GET /api/companies
- Query params: page, limit, search, industry, type, size
- Search: name, domain, phone
- Response: `{ data: Company[], pagination: { page, limit, total, totalPages } }`
- Must filter by tenantId and deletedAt IS NULL

### POST /api/companies
- Body: Zod validated (name required, all other fields optional)
- Response: `{ data: Company }` (201)
- Must set tenantId = "demo-tenant"

### GET /api/companies/[id]
- Includes: owner, contacts (via junction), deals (via junction), activities (last 20)
- Response: Company with relations (200) or error (404)

### PATCH /api/companies/[id]
- Body: Partial fields
- Response: Updated Company (200)

### DELETE /api/companies/[id]
- Soft delete: set deletedAt = new Date()
- Response: `{ success: true }` (200)

## Component Specifications

### CompaniesTable
- Self-contained (no props, manages own state)
- Columns: Checkbox, Name+Domain, Phone, City/Country, Industry (badge), Contacts count, Deals count, Owner, Actions menu
- Filters: Industry dropdown, Company Type dropdown
- Sort: name, industry, city, createdAt (client-side)
- Pagination: 50 per page
- Bulk: select all, bulk delete
- Export: CSV
- Empty/Loading/Error states
- Create button opens CompanyForm slide-in

### CompanyForm
- Slide-in panel (right side)
- Props: isOpen, onClose, onSuccess, company? (for edit mode)
- Sections: Basic Info (name*, domain), Company Details (industry, type, size, revenue), Contact Info (phone, website, linkedin), Address (address, city, state, country, postal)
- Validation: name required
- Submit creates via POST /api/companies
