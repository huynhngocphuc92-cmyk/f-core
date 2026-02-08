# Email Tracking - Research Summary

> **Date:** 2026-02-08
> **Status:** SYNTHESIS COMPLETE
> **Sources:** competitive-analysis.md, ux-patterns.md, tech-research.md

---

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Dedicated Email model (not extending Activity) | Activity model only has 4 email fields; Email needs 20+ unique fields, dedicated indexes, high-volume event tracking |
| 2 | 4 new Prisma models: Email, EmailEvent, EmailTemplate, EmailAttachment | Clean separation of concerns; append-only events; tenant-scoped templates |
| 3 | Log-only MVP (no SMTP sending) | Reduces scope ~60%; matches HubSpot "Log Email"; no third-party email provider needed |
| 4 | Tiptap for rich text editor | ProseMirror-based; best extension system for merge tags; React 19 + Next.js compatible; MIT |
| 5 | nanoid for tracking IDs | 40% shorter than UUID; URL-safe; ~2^126 bits collision resistance |
| 6 | Supabase Realtime for notifications | Already in stack; zero infrastructure cost; Postgres Changes on EmailEvent table |
| 7 | 1x1 transparent GIF tracking pixel | Industry standard (HubSpot, Pipedrive, Zoho all use same approach) |
| 8 | Link rewriting for click tracking | Redirect endpoint with 302; path-based tracking IDs (not query-only) for iOS 18 compatibility |
| 9 | Cursor-based pagination | O(1) performance at scale; email tables grow to millions of rows |
| 10 | RFC 2822 threading with threadId | Industry standard; compatible with external email clients |

## Competitive Insights

- **HubSpot** leads with free-tier open/click tracking - F-CORE should match this
- **Salesforce** EAC is enterprise-grade but complex - overkill for MVP
- **Pipedrive** has cleanest UX for sales-focused email tracking
- **Zoho** SalesInbox (CRM-aware email client) is a future differentiator opportunity

## Architecture Overview

```
Email Compose (Tiptap) → API Route → Generate trackingId (nanoid)
                                    → Inject tracking pixel (1x1 GIF)
                                    → Rewrite links (redirect URLs)
                                    → Store Email + Activity record
                                    → Log SENT event

Tracking Pixel Load → /api/tracking/open/[trackingId] → Log OPENED event
                                                      → Update denormalized counters
                                                      → Supabase Realtime → Toast notification

Link Click → /api/tracking/click/[trackingId] → Log CLICKED event
                                              → 302 redirect to original URL
```

## Database Schema (4 new models)

1. **Email** - Core email record with tracking metadata, threading, CRM associations, denormalized counters
2. **EmailEvent** - Append-only tracking log (SENT, OPENED, CLICKED, BOUNCED, etc.)
3. **EmailTemplate** - Tenant-scoped templates with merge field support (`{{contact.firstName}}`)
4. **EmailAttachment** - File metadata with Supabase Storage URLs

## UX Patterns

- **Compose**: Centered modal (720px max), expandable to full-screen
- **Thread view**: Reverse chronological on record pages; chronological in dedicated view
- **Tracking status**: Lucide icons with color-coded badges (Eye=cyan for opened, MousePointerClick=green for clicked)
- **Notifications**: Toast (top-right, 5s auto-dismiss) + activity feed badge
- **Mobile**: Full-screen compose modal, stacked fields, 44px touch targets
- **Templates**: Slide-in picker panel with categories, search, preview

## MVP Scope (This Sprint)

### Include
- Email compose modal with Tiptap rich text editor
- Email CRUD API routes (create, list, get, update draft, soft delete)
- Tracking pixel endpoint (open tracking)
- Click tracking endpoint (link redirect)
- EmailEvent logging with 60-second deduplication
- Email list on contact/company/deal record pages
- Tracking status badges (sent, delivered, opened, clicked, bounced)
- Email templates CRUD
- Merge field support (`{{contact.firstName}}`)
- Thread view (group by threadId)

### Exclude (Future Phases)
- SMTP sending (Phase 2)
- Gmail/Outlook sync (Phase 3)
- Email sequences/automation (Phase 3)
- SalesInbox-style CRM email client (Phase 4)
- AI email drafting (Phase 4)
- Custom tracking domains (Phase 4)

## Technical Dependencies

| Package | Purpose |
|---------|---------|
| `nanoid` | Tracking ID generation |
| `@tiptap/react` + extensions | Rich text editor |
| `isomorphic-dompurify` | HTML sanitization |
| `zod` | Input validation (already installed) |
| `@supabase/supabase-js` | Realtime notifications (already installed) |

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Apple MPP inflating open rates | Classify as OPENED_MACHINE; emphasize click metrics |
| Gmail tracking warnings | Keep pixel minimal; use custom tracking domain (future) |
| Open redirect via click tracking | Validate destination URLs; block internal/localhost |
| EmailEvent table growth | Deduplication; denormalized counters; future partitioning |
| XSS via email HTML | DOMPurify sanitization with allowlist |
