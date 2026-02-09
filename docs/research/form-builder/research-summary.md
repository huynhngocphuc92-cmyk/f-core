# Form Builder - Research Summary

> Date: 2026-02-09
> Feature: Form Builder (Marketing Hub, Item #11)
> Gate: Research Quality Gate 1

---

## Research Artifacts

| Document | Lines | Status |
|----------|-------|--------|
| `competitive-analysis.md` | 805 | Complete |
| `ux-patterns.md` | 280+ | Complete |
| `tech-research.md` | 2,174 | Complete |

---

## Key Decisions

### 1. Architecture
- **DnD Library:** `@dnd-kit/core` + `@dnd-kit/sortable` (12KB, React hooks-based, only actively maintained option)
- **Form State:** `react-hook-form` + `@hookform/resolvers` (minimal re-renders, `watch()` for conditional logic)
- **Validation:** Dynamic Zod schema generation (client+server reuse)
- **Data Storage:** JSONB columns for dynamic form data (settings, theme, field config, submission data)

### 2. Database Schema
- 4 new models: `Form`, `FormField`, `FormSubmission`, `FormView`
- Multi-tenant with `tenantId`, soft delete with `deletedAt`
- JSONB for flexible config: `settings`, `theme`, `validationRules`, `conditionalLogic`, `options`, `submissionData`
- Relations to existing `Contact` model for auto-creation on submission

### 3. UI/UX
- Three-panel builder layout (palette, canvas, properties) - industry standard
- Conditional logic via dropdown-based rule builder (10 operators, AND/OR support)
- Multi-step forms with progress bar and per-step validation
- Three embed modes: inline iframe, popup JavaScript snippet, direct link
- WCAG 2.1 AA accessibility compliance

### 4. Security & Anti-Spam
- Multi-layer: reCAPTCHA v3 + honeypot + rate limiting (10/min/IP)
- Input sanitization (HTML stripping)
- Origin validation for embedded forms (CSRF defense)
- File uploads direct to Supabase Storage

### 5. Field Types (17 total)
- **Input:** text, email, phone, number, url, textarea, date
- **Choice:** dropdown, multi-select, radio, checkbox
- **Special:** file upload, hidden
- **Layout:** heading, paragraph, divider, spacer

### 6. API Routes (10 endpoints)
- CRUD: `GET/POST /api/forms`, `GET/PATCH/DELETE /api/forms/[id]`
- Actions: `/publish`, `/duplicate`
- Fields: `PUT /api/forms/[id]/fields` (batch update)
- Public: `POST /api/forms/[id]/submissions` (no auth, rate-limited)
- Analytics: `GET /api/forms/[id]/analytics`
- Embed: `GET /api/forms/[id]/embed`

### 7. New Dependencies
```
@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
react-hook-form, @hookform/resolvers
react-google-recaptcha-v3
```

---

## Scope Definition for Implementation

### Phase 1 (This Sprint - Must Have)
- [x] Form CRUD (create, edit, delete, list)
- [x] Drag-and-drop builder with field palette
- [x] 10 field types (text, email, phone, number, textarea, dropdown, radio, checkbox, date, hidden)
- [x] Field properties editing
- [x] Form preview (desktop/mobile)
- [x] Public form rendering & submission
- [x] Submission storage and list view
- [x] Basic form analytics (views, submissions, conversion rate)
- [x] Form publish/unpublish
- [x] Contact auto-creation from email field

### Phase 2 (Future)
- [ ] Multi-step forms
- [ ] Conditional logic engine
- [ ] File upload field
- [ ] Embed code generation
- [ ] Auto-responder emails
- [ ] Webhook dispatch
- [ ] CAPTCHA integration
- [ ] Form templates
- [ ] Submission export (CSV)

---

## Gate 1 Checklist

- [x] competitive-analysis.md exists with >= 3 competitor references (HubSpot, JotForm, Typeform, SurveyJS, Cognito, Feathery)
- [x] ux-patterns.md has user flow descriptions (12 sections covering builder, DnD, fields, properties, conditional logic, multi-step, preview, settings, submissions, analytics, accessibility, design alignment)
- [x] tech-research.md has recommended approach (2,174 lines with complete schema, API routes, code samples, security patterns)
- [x] research-summary.md synthesizes all findings
- [x] Key decisions documented

**Gate 1 Verdict: PASS**
