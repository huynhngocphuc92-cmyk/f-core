# Email Tracking - Implementation Plan

## Execution Order

### 1. Database (Sequential - must be first)
- Add 4 new Prisma models: Email, EmailEvent, EmailTemplate, EmailAttachment
- Add relation fields to existing models (User, Tenant, Contact, Company, Deal, Activity)
- Run Prisma migration
- Update seed.ts with sample emails

### 2. Backend API Routes (Sequential after DB)
- `POST/GET /api/emails` - Create/list emails
- `GET/PATCH/DELETE /api/emails/[id]` - Email CRUD
- `GET /api/tracking/open/[trackingId]/route.ts` - Tracking pixel (public, no auth)
- `GET /api/tracking/click/[trackingId]/route.ts` - Click redirect (public, no auth)
- `POST/GET /api/email-templates` - Template CRUD
- `GET/PATCH/DELETE /api/email-templates/[id]` - Template CRUD

### 3. Frontend Components (Parallel with some backend)
- EmailComposeModal - Modal with Tiptap rich text editor
- EmailList - Email list for record pages
- EmailCard - Individual email card with tracking status
- EmailDetail - Expanded email view with tracking timeline
- TrackingStatusBadge - Status icon + label component
- EmailTemplateManager - Template CRUD UI

### 4. Pages
- `/emails` dashboard page - List all emails with filters
- Update sidebar with Emails navigation item

### 5. Integration
- Wire compose modal to API
- Connect tracking status to EmailEvent data
- Add email list to contact/company/deal pages (future, when detail pages exist)

## Dependencies to Install
- `nanoid` - Tracking ID generation
- `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link` + `@tiptap/extension-placeholder` - Rich text editor
- `isomorphic-dompurify` - HTML sanitization
