# Email Marketing Research Summary

> **Date:** 2026-02-08
> **Feature:** Email Marketing (Item #9, P2, Marketing Hub)
> **Sources:** competitive-analysis.md, ux-patterns.md, tech-research.md

---

## Key Decisions

### 1. Email Editor Approach
**Decision:** Block-based template editor with TipTap rich text for MVP. Defer full drag-and-drop (Unlayer/GrapesJS) to future phase.

**Rationale:**
- Full D&D editors are complex (Unlayer adds ~500KB bundle, GrapesJS requires significant customization)
- TipTap provides rich text editing with React integration, zero bundle overhead for a headless editor
- Pre-built templates with editable sections covers 80% of use cases
- Competitive analysis shows all 5 platforms use D&D, but MVP can ship with block-based + rich text

### 2. Template Storage
**Decision:** JSON structure for template design data + compiled HTML output

- `jsonContent`: Block structure (sections, rows, content blocks with properties)
- `htmlContent`: Compiled HTML for sending (rendered server-side)
- Compatible with future D&D editor migration

### 3. Email Sending
**Decision:** Build API layer ready for ESP integration, but simulate sending for demo

- Schema designed for Resend/SendGrid/SES integration
- API routes accept send commands and create EmailSend records
- Webhook handler endpoint ready for ESP event callbacks
- Demo mode: mark emails as "sent" without actual delivery

### 4. Campaign Model
**Decision:** HubSpot-style campaign object tying together template + audience + schedule + analytics

- Status lifecycle: draft → scheduled → sending → sent → cancelled
- Denormalized stats on campaign for fast dashboard reads
- Per-recipient EmailSend records for individual tracking
- Event-sourced analytics (EmailEvent table)

### 5. Contact Lists
**Decision:** Static lists for MVP, dynamic segments deferred

- ContactList: named groups of contacts (many-to-many via ContactListMember)
- Lists used as campaign audience targets
- Filter-based dynamic segments in future phase

### 6. Analytics
**Decision:** Event-sourced model with denormalized counters

- EmailEvent table stores every open, click, bounce, unsubscribe
- Campaign-level counters (totalSent, totalOpened, etc.) updated from events
- Dashboard reads from denormalized counters, detail views query events

---

## Database Schema (6 new tables)

| Table | Purpose |
|-------|---------|
| EmailTemplate | Enhanced template with jsonContent, thumbnailUrl, category |
| EmailCampaign | Campaign with audience, schedule, denormalized stats |
| ContactList | Named contact groups |
| ContactListMember | Many-to-many contacts ↔ lists |
| EmailSend | Per-contact per-campaign send record |
| EmailEvent | Granular tracking events (open, click, bounce) |

### Compatibility with Email Tracking (Item #6)
The existing `EmailTemplate` from the email-tracking branch will be enhanced (not replaced):
- Add `jsonContent`, `thumbnailUrl`, `category` fields
- Add relation to `EmailCampaign`
- Existing `Email` model (1:1 tracking) remains for individual email tracking
- `EmailCampaign` is the new model for bulk sends

---

## UI Components (MVP)

| Page | Route | Description |
|------|-------|-------------|
| Campaign List | `/email-marketing` | Table with status tabs, search, create button |
| Create Campaign | `/email-marketing/campaigns/new` | Multi-step wizard |
| Campaign Detail | `/email-marketing/campaigns/[id]` | Analytics dashboard |
| Template Gallery | `/email-marketing/templates` | Grid of templates with preview |
| Template Editor | `/email-marketing/templates/[id]/edit` | Block editor with preview |
| Contact Lists | `/email-marketing/lists` | List management |

### UX Patterns
- Three-panel email editor (block palette, canvas, properties)
- Campaign creation wizard: Recipients → Content → Settings → Review → Send
- Analytics cards: Sent, Delivered, Opens, Clicks, Bounces, Unsubscribes
- Template gallery with category tabs and grid layout

---

## Implementation Scope

### MVP (This Sprint)
- [x] Prisma schema for 6 new tables
- [x] API routes: template CRUD, campaign CRUD, list CRUD, send endpoint
- [x] Campaign list page with status filters
- [x] Campaign creation wizard (3-step)
- [x] Template gallery with pre-built templates
- [x] Template editor (block-based with TipTap)
- [x] Campaign analytics page (basic metrics)
- [x] Contact list management
- [x] Sidebar navigation link
- [x] Seed data

### Deferred
- Full drag-and-drop email editor
- A/B testing
- Dynamic segments
- Real ESP integration (Resend/SendGrid)
- Send time optimization
- Revenue attribution

---

## Technology Stack Additions

```json
{
  "dependencies": {
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-link": "^2.x"
  }
}
```

No additional heavy dependencies for MVP. TipTap is lightweight and headless.
