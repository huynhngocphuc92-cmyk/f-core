# Email Marketing Module - Technical Research Document

> **Project:** F-CORE (HubSpot CRM Clone)
> **Module:** Email Marketing
> **Author:** Tech Research Agent
> **Date:** 2026-02-08
> **Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Prisma 7.x, PostgreSQL (Supabase)

---

## Table of Contents

1. [Email Editor Libraries](#1-email-editor-libraries)
2. [Email Rendering](#2-email-rendering)
3. [Email Sending Services](#3-email-sending-services)
4. [Tracking Implementation](#4-tracking-implementation)
5. [Database Schema Design](#5-database-schema-design)
6. [Queue & Batch Processing](#6-queue--batch-processing)
7. [Compliance](#7-compliance)
8. [Next.js Integration](#8-nextjs-integration)
9. [Recommended Architecture for F-CORE MVP](#9-recommended-architecture-for-f-core-mvp)

---

## 1. Email Editor Libraries

### 1.1 React Email (react.email)

**What it is:** A collection of high-quality, unstyled React components for building email templates. Created by the Resend team. Currently on version 4.x/5.0 (as of late 2025).

**Key Features:**
- React/TypeScript-native: write emails as JSX components
- Components: `<Html>`, `<Container>`, `<Button>`, `<Text>`, `<Image>`, `<Section>`, `<Column>`, `<Link>`, `<Heading>`, `<Markdown>`, `<CodeBlock>`, `<Font>`, `<Preview>`, etc.
- Built-in `render()` utility converts React components to HTML string
- Local dev server with hot reload for previewing emails
- Dark mode support built into components
- Cross-client tested: Gmail, Apple Mail, Outlook, Yahoo Mail, HEY, Superhuman
- Template upload to Resend with visual editor for non-technical team members

**Strengths:**
- Perfect TypeScript/React DX -- feels like writing normal React components
- Components handle all the table-based layout and inline CSS quirks behind the scenes
- Tiny bundle -- components are lightweight, no runtime overhead
- Free and open source (MIT license)
- Native integration with Resend, but works with any ESP (SendGrid, Postmark, AWS SES, Nodemailer)

**Weaknesses:**
- Code-first: no visual drag-and-drop editor for non-developers
- Requires developer involvement for template creation/editing
- Not suitable for end-user self-service email building
- Relatively new ecosystem (but rapidly maturing)

**Bundle Size:** ~15-30 KB for full component set (tree-shakeable)
**License:** MIT
**Learning Curve:** Low for React developers
**Customizability:** High (full code control)

---

### 1.2 MJML (Mailjet Markup Language)

**What it is:** An open-source markup language and framework that compiles to responsive, email-client-compatible HTML.

**Key Features:**
- Custom XML-like syntax: `<mj-section>`, `<mj-column>`, `<mj-button>`, etc.
- Compiles to table-based HTML with inline styles automatically
- Responsive by default -- mobile-first rendering
- CLI tool and Node.js API for server-side compilation
- Community plugins and extensions
- MJML Live Editor available online

**Strengths:**
- Mature and battle-tested (since 2015, by Mailjet/Sinch)
- Excellent email client compatibility
- Abstracts away all table/inline-CSS complexity
- Can be used server-side in Node.js (via `mjml` npm package)
- Large community and documentation

**Weaknesses:**
- Not React-native; separate templating language to learn
- No built-in visual drag-and-drop editor (code-first)
- Template syntax is XML-based, not JSX/TSX
- Requires a compilation step (MJML -> HTML)
- Does not directly integrate with React component paradigm

**Bundle Size:** ~200 KB (mjml npm package, server-side)
**License:** MIT
**Learning Curve:** Medium (new markup language, but well-documented)
**Customizability:** Medium-High (custom components possible but requires MJML plugin system)

---

### 1.3 Unlayer (react-email-editor)

**What it is:** An embeddable, white-label drag-and-drop email and page editor. Available as a React component (`react-email-editor`).

**Key Features:**
- Full drag-and-drop WYSIWYG editor
- React SDK component: `<EmailEditor />`
- Export to HTML and JSON (design data)
- Import from JSON to restore designs
- Custom blocks, tools, and merge tags
- Template library
- Responsive email output
- White-label customization (branding, colors, fonts)

**Strengths:**
- Best-in-class drag-and-drop experience for non-developers
- Easy React integration via npm package
- JSON-based design storage (perfect for DB persistence)
- Merge tags for personalization tokens
- Strong documentation and SDK

**Weaknesses:**
- **Freemium model**: Free tier is limited; enterprise features (custom blocks, collaboration, advanced design tools, removing branding) require paid plans
  - Launch: $250/month
  - Scale: $750/month
  - Optimize: $2,000/month
  - Enterprise: Custom
- The free open-source `react-email-editor` has limited features compared to the commercial Unlayer platform
- Adds significant bundle size to the frontend
- Vendor lock-in concern for the visual editor
- Generated HTML quality can vary

**Bundle Size:** ~500 KB+ (editor component)
**License:** MIT (open source wrapper), commercial for advanced features
**Learning Curve:** Low (drag-and-drop), Medium (SDK customization)
**Customizability:** High with paid tiers, limited on free tier

---

### 1.4 GrapesJS

**What it is:** A free, open-source web builder framework that can be used for building HTML templates including emails and newsletters.

**Key Features:**
- Full visual drag-and-drop HTML builder
- Plugin system: `grapesjs-preset-newsletter` for email-specific blocks
- `grapesjs-mjml` plugin for MJML-based email building
- Style Manager, Layer Manager, Asset Manager
- Canvas-based editing
- JSON import/export of designs
- No vendor lock-in (fully open source)

**Strengths:**
- Completely free and open source (BSD 3-Clause)
- Highly extensible plugin architecture
- Large community (25.5k GitHub stars)
- Can be customized to any level
- Newsletter preset provides email-specific components
- MJML plugin ensures email-compatible output

**Weaknesses:**
- Not React-native; requires wrapper/integration work
- Significant setup and configuration required
- UI is less polished than Unlayer out of the box
- No official React component (community wrappers exist)
- Learning curve for plugin development and customization
- Limited enterprise support (community-driven)

**Bundle Size:** ~400 KB+ (core + newsletter preset)
**License:** BSD 3-Clause
**Learning Curve:** High (setup and customization)
**Customizability:** Very High (full source access)

---

### 1.5 TipTap

**What it is:** A headless, framework-agnostic rich text editor built on ProseMirror. Extensible with a large extension ecosystem.

**Key Features:**
- Headless architecture: bring your own UI
- React integration via `@tiptap/react`
- Extension system: bold, italic, links, images, tables, etc.
- Collaborative editing support (via Yjs)
- JSON and HTML output
- TypeScript-first

**Strengths:**
- Excellent for rich text editing within React/Next.js
- Headless means complete UI control
- Great for simple, content-focused email composition
- Active community, well-maintained
- Free tier with paid cloud collaboration options

**Weaknesses:**
- **Not an email builder**: it is a rich text editor
- No email-specific components (no columns, responsive sections, email buttons)
- Output is standard HTML, not email-compatible HTML
- Would require significant custom work to produce email-safe markup
- No drag-and-drop block layout system

**Bundle Size:** ~100 KB (core + common extensions)
**License:** MIT
**Learning Curve:** Medium
**Customizability:** Very High (headless)

---

### 1.6 Comparison Matrix

| Criteria | React Email | MJML | Unlayer | GrapesJS | TipTap |
|----------|------------|------|---------|----------|--------|
| **Type** | Code components | Markup language | Drag-and-drop | Drag-and-drop | Rich text editor |
| **React Native** | Yes | No | Yes (wrapper) | No (wrapper) | Yes |
| **Visual Editor** | No (code only) | No (code only) | Yes (excellent) | Yes (good) | Partial |
| **Email Compatibility** | Excellent | Excellent | Good | Good (with MJML) | Poor |
| **Bundle Size** | ~20 KB | ~200 KB (server) | ~500 KB+ | ~400 KB+ | ~100 KB |
| **License** | MIT | MIT | MIT + Commercial | BSD 3-Clause | MIT |
| **Cost** | Free | Free | Free to $2k+/mo | Free | Free |
| **Non-dev Friendly** | No | No | Yes | Somewhat | Somewhat |
| **Dark Mode** | Built-in | Manual | Partial | Manual | N/A |
| **Learning Curve** | Low | Medium | Low | High | Medium |
| **Best For** | Developer-built templates | Server-side rendering | End-user email building | Custom builder platform | Simple text emails |

---

## 2. Email Rendering

### 2.1 HTML Email Compatibility Challenges

HTML email rendering is fundamentally different from web rendering. Key challenges include:

- **No JavaScript**: Email clients strip all JS. Everything must be static HTML/CSS.
- **Limited CSS support**: No Flexbox, no Grid, no CSS variables in most clients. Outlook uses the Word rendering engine (not a browser engine).
- **Client fragmentation**: Gmail, Outlook (desktop/web/mobile), Apple Mail, Yahoo, and dozens of others all render differently.

### 2.2 Inline CSS vs. Style Blocks

| Approach | Pros | Cons |
|----------|------|------|
| **Inline CSS** | Universal support; works in all clients | Verbose HTML; hard to maintain; no media queries |
| **`<style>` blocks** | Cleaner markup; supports media queries and pseudo-classes | Gmail web clips `<style>` tags in certain cases; Outlook partial support |
| **Hybrid (recommended)** | Inline for core styles + `<style>` for dark mode/media queries | Slightly more complex to generate |

**Recommendation:** Use a hybrid approach. All core styling (colors, padding, fonts) should be inlined. Dark mode overrides and responsive breakpoints go in embedded `<style>` blocks with `!important` declarations.

### 2.3 Table-Based vs. Div-Based Layouts

| Layout | Support | Notes |
|--------|---------|-------|
| **Table-based** | Universal (including Outlook) | The gold standard for email. Outlook desktop requires tables for layout. |
| **Div-based** | Partial (not Outlook desktop) | Works in Gmail, Apple Mail, Yahoo. Fails in Outlook desktop. |

**Recommendation:** Use table-based layouts for the email structure. React Email and MJML both abstract this away -- they output tables while letting developers write clean components/markup.

### 2.4 Dark Mode Support

Dark mode in email is complex because clients handle it differently:

| Email Client | Dark Mode Support | CSS Override Support |
|-------------|-------------------|---------------------|
| Apple Mail (iOS/macOS) | Yes (partial inversion) | Yes (`prefers-color-scheme`) |
| Gmail (iOS app) | Yes (full inversion) | Limited |
| Gmail (Android app) | Yes (full inversion) | Limited |
| Gmail (Web) | No | N/A |
| Outlook (iOS) | Yes (full inversion) | Limited |
| Outlook (Android) | Yes (partial inversion) | Some |
| Outlook 2019+ (Mac) | Yes (partial inversion) | Yes (`prefers-color-scheme`) |
| Outlook 2021 (Windows) | Yes (partial inversion) | Some (`[data-ogsc]` hack) |
| Windows Mail | Yes (full inversion) | No |

**Best practices:**
- Use `@media (prefers-color-scheme: dark)` in `<style>` blocks with `!important`
- Target Outlook-specific attributes: `[data-ogsc]` and `[data-ogsb]` selectors
- Use transparent PNGs for logos; provide light-on-dark and dark-on-light image variants
- Avoid pure black (`#000000`) or pure white (`#FFFFFF`); use soft grays
- React Email components handle dark mode automatically for supported clients

### 2.5 Image Hosting and CDN

- Images in emails must be hosted on an external, publicly accessible URL
- **Recommendation for F-CORE:**
  - Use Supabase Storage for image uploads
  - Serve through Supabase CDN or a custom CDN (Cloudflare, Vercel Blob)
  - Optimize images before upload (compress, resize to max 600px width for email)
  - Always include `alt` text for accessibility and image-blocked clients
  - Keep total email size under 100 KB (excluding images) for deliverability

---

## 3. Email Sending Services

### 3.1 Resend

**Overview:** Modern email API built by the creators of React Email. Designed for developer experience.

**Pricing (as of 2026):**
| Plan | Price | Emails/Month | Key Features |
|------|-------|-------------|--------------|
| Free | $0 | 3,000 | 100/day limit, 1 domain, 1-day retention |
| Pro | $20/mo | 50,000 | No daily limit, 10 domains, 7-day retention |
| Scale | $90/mo | 100,000 | Dedicated IP, 30 domains, 30-day retention |
| Enterprise | Custom | Custom | Custom features, SLA |
| Overage | $0.90/1k | -- | -- |

**Marketing Contacts:**
| Plan | Price | Contacts |
|------|-------|----------|
| Free | $0 | 1,000 |
| Pro | $20/mo | 10,000 |
| Scale | Custom | Custom |

**Strengths:**
- Native React Email integration (`react:` prop in send API)
- Excellent TypeScript SDK
- Webhooks for delivery, open, click, bounce, spam events
- Multi-region sending
- Managed dedicated IPs
- Audiences, contacts, and broadcast (marketing) emails built-in
- Unsubscribe topics
- Templates upload from React Email CLI

**Weaknesses:**
- Relatively new (less track record than SendGrid/SES)
- Fewer advanced features (no complex routing rules, IP pool management)
- Smaller scale track record
- Limited sending volume on lower tiers

**Webhook Events:** `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

---

### 3.2 SendGrid (Twilio)

**Overview:** Industry-leading email platform. Handles both transactional and marketing emails. Acquired by Twilio in 2019.

**Pricing (as of 2026):**
| Plan | Price | Emails/Month |
|------|-------|-------------|
| Free | $0 | 100/day (~3,000/mo) |
| Essentials | $19.95/mo | 50,000 |
| Pro | $89.95/mo | 100,000 (dedicated IP included) |
| Premier | Custom | Custom |

**Strengths:**
- Proven at massive scale (billions of emails monthly across customers)
- Comprehensive analytics dashboard
- Both SMTP relay and REST API
- Template editor for non-developers
- Event webhook for tracking
- Inbound email parsing
- IP whitelisting, dedicated IPs

**Weaknesses:**
- Documentation is sprawling and sometimes outdated
- Best deliverability features locked to expensive plans
- Support quality varies by plan
- Pricing gets confusing with add-ons
- Mixed sending (transactional + marketing on same IP) can hurt deliverability
- Developer experience is dated compared to Resend

---

### 3.3 Amazon SES

**Overview:** AWS's email service. Extremely cost-effective, infrastructure-grade.

**Pricing:**
| Volume | Cost |
|--------|------|
| 10,000 emails | $1 |
| 300,000 emails | $30 |
| 1,000,000 emails | $100 |
| EC2 users | 62,000 free/month |

**Strengths:**
- Cheapest option by far at scale
- Highly reliable AWS infrastructure
- Integrates with Lambda, S3, CloudWatch, SNS
- Supports both transactional and bulk email
- Dedicated IPs available
- DKIM, SPF, DMARC support

**Weaknesses:**
- Complex setup and configuration
- Difficult approval process (sandbox mode initially)
- Limited built-in features (no template editor, no analytics dashboard)
- Technical expertise required
- Paid support plans
- DIY deliverability management

---

### 3.4 Postmark

**Overview:** Focused on transactional email deliverability. Known for fast delivery and excellent reliability.

**Pricing:**
| Volume | Cost |
|--------|------|
| 10,000 emails | $15/mo |
| 300,000 emails | $245/mo |
| 1,000,000 emails | $695/mo |

**Strengths:**
- Best-in-class transactional email deliverability
- Extremely fast delivery (seconds, not minutes)
- Separate infrastructure for transactional vs. broadcast (Message Streams)
- Clean API and documentation
- Detailed delivery analytics
- 45-day data retention on all plans

**Weaknesses:**
- More expensive than SES
- Limited marketing features
- Focused primarily on transactional email
- Smaller ecosystem compared to SendGrid

---

### 3.5 Sending Service Comparison

| Criteria | Resend | SendGrid | Amazon SES | Postmark |
|----------|--------|----------|-----------|----------|
| **Best For** | Modern React apps | Enterprise / all-in-one | High volume, cost-sensitive | Transactional reliability |
| **DX Quality** | Excellent | Good | Poor | Good |
| **React Integration** | Native | SDK | SDK | SDK |
| **Free Tier** | 3,000/mo | 100/day | 62k (EC2) | 100 trial |
| **Cost at 100k/mo** | $90 | $89.95 | $10 | ~$110 |
| **Deliverability** | Good (improving) | Good | Good (DIY) | Excellent |
| **Webhooks** | Yes | Yes | Via SNS | Yes |
| **Marketing Email** | Yes (audiences) | Yes | Manual | Yes (Message Streams) |
| **Maturity** | New (2023+) | Mature (2009+) | Mature (2011+) | Mature (2010+) |

---

## 4. Tracking Implementation

### 4.1 Open Tracking

**Mechanism:** A 1x1 transparent pixel image is inserted into the email HTML. When the recipient's email client loads the image, the server logs the request with the recipient's ID and timestamp.

```html
<img src="https://track.f-core.com/o/{tracking_id}" width="1" height="1" style="display:none" alt="" />
```

**Privacy Concerns:**
- **Apple Mail Privacy Protection (MPP)**: Since iOS 15 (September 2021), Apple Mail pre-loads all remote content (including tracking pixels) in the background regardless of whether the user opens the email. This results in inflated open rates -- iCloud email addresses show near 75% open rates at peak MPP adoption.
- **Impact:** Open rate is no longer a reliable engagement metric for Apple Mail users (~55% of email client market share).
- **Recommendation:** Track opens for analytics but do NOT rely on them as the primary engagement signal. Use clicks as the primary indicator.

### 4.2 Click Tracking

**Mechanism:** All links in the email are rewritten to pass through a tracking redirect:

```
Original: https://f-core.com/pricing
Rewritten: https://track.f-core.com/c/{tracking_id}?url=https://f-core.com/pricing
```

The tracking server logs the click (contact ID, link URL, timestamp) and performs a 302 redirect to the original URL.

**Implementation considerations:**
- Link rewriting must preserve URL parameters and fragments
- HTTPS is required for all tracking URLs
- Bot click detection: some email security tools pre-click all links. Detect by:
  - Multiple URLs clicked within milliseconds of delivery
  - No subsequent page interaction after click
  - Known bot User-Agent strings
- Click tracking is the most reliable engagement signal post-MPP

### 4.3 Bounce Handling

**Types:**
- **Hard bounce:** Permanent delivery failure (invalid email, domain doesn't exist). Action: immediately suppress the address.
- **Soft bounce:** Temporary failure (mailbox full, server down). Action: retry 2-3 times, then suppress if persistent.

**Implementation via Webhooks:**
Most ESPs send bounce events via webhooks. The F-CORE system should:
1. Receive webhook at `/api/webhooks/email` (e.g., Resend webhook)
2. Parse the event payload (bounce type, reason, recipient)
3. Update the `EmailEvent` record
4. For hard bounces: set `Contact.emailStatus = 'bounced'` and add to suppression list
5. For soft bounces: log and retry

### 4.4 Unsubscribe Handling

**Two mechanisms required:**

1. **In-body unsubscribe link (CAN-SPAM requirement):**
   ```html
   <a href="https://app.f-core.com/unsubscribe/{token}">Unsubscribe</a>
   ```
   
2. **List-Unsubscribe header (RFC 8058 -- required by Gmail/Yahoo for bulk senders):**
   ```
   List-Unsubscribe: <https://app.f-core.com/api/unsubscribe/{token}>
   List-Unsubscribe-Post: List-Unsubscribe=One-Click
   ```
   
   This enables one-click unsubscribe directly in the email client UI (Gmail shows an "Unsubscribe" button in the header). The endpoint must:
   - Accept POST requests
   - Process immediately (no confirmation page required)
   - Both headers must be covered by DKIM signature
   - URL must use HTTPS

**Unsubscribe API endpoint flow:**
1. Validate the token (signed, non-expired)
2. Look up the contact and tenant
3. Record the unsubscribe in `EmailEvent` table
4. Update `ContactSubscription.status = 'unsubscribed'`
5. Add to suppression list
6. Return 200 OK (for one-click) or redirect to confirmation page (for in-body link)

---

## 5. Database Schema Design

### 5.1 Overview

The email marketing module requires several new tables that integrate with the existing F-CORE schema. All tables follow the existing conventions: UUID primary keys, `tenantId` for multi-tenancy, soft delete where appropriate, and proper indexing.

### 5.2 Proposed Prisma Models

```prisma
// ============================================
// EMAIL MARKETING MODULE
// ============================================

// Email Templates (reusable email designs)
model EmailTemplate {
  id          String    @id @default(uuid())
  tenantId    String
  
  name        String
  description String?
  subject     String?   // Default subject line
  
  // Editor content
  editorType  String    @default("react-email") // react-email, mjml, html
  designJson  Json?     // JSON design data (for visual editors like Unlayer)
  mjmlContent String?   @db.Text  // MJML source (if using MJML)
  htmlContent String?   @db.Text  // Compiled/final HTML
  textContent String?   @db.Text  // Plain text version
  
  // Template metadata
  category    String?   // marketing, transactional, notification
  thumbnailUrl String?  // Preview thumbnail
  
  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  createdBy   String?
  updatedBy   String?
  
  // Relations
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  campaigns   EmailCampaign[]
  
  @@index([tenantId])
  @@index([category])
  @@index([deletedAt])
}

// Email Campaigns
model EmailCampaign {
  id          String    @id @default(uuid())
  tenantId    String
  
  name        String
  description String?
  
  // Content
  templateId  String?
  subject     String    // Email subject line (supports merge tags)
  previewText String?   // Preview/preheader text
  fromName    String    // Sender display name
  fromEmail   String    // Sender email address
  replyTo     String?   // Reply-to email
  
  // Audience
  listId      String?   // Target contact list/segment
  
  // Status lifecycle
  status      String    @default("draft")
  // draft -> scheduled -> sending -> sent -> cancelled
  
  // Scheduling
  scheduledAt DateTime?
  sentAt      DateTime?
  completedAt DateTime?
  cancelledAt DateTime?
  
  // Stats (denormalized for quick access)
  totalRecipients Int   @default(0)
  totalSent       Int   @default(0)
  totalDelivered  Int   @default(0)
  totalOpened     Int   @default(0)
  totalClicked    Int   @default(0)
  totalBounced    Int   @default(0)
  totalUnsubscribed Int @default(0)
  totalComplaints   Int @default(0)
  
  // A/B Testing
  isAbTest      Boolean @default(false)
  abTestConfig  Json?   // { variants: [...], winnerCriteria, testDuration }
  
  // Metadata
  metadata    Json      @default("{}")
  
  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  createdBy   String?
  
  // Relations
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  template    EmailTemplate? @relation(fields: [templateId], references: [id])
  list        ContactList?   @relation(fields: [listId], references: [id])
  sends       EmailSend[]
  
  @@index([tenantId])
  @@index([status])
  @@index([scheduledAt])
  @@index([deletedAt])
}

// Individual email sends (one per contact per campaign)
model EmailSend {
  id          String    @id @default(uuid())
  tenantId    String
  
  campaignId  String
  contactId   String
  
  // Send details
  toEmail     String
  toName      String?
  
  // Status
  status      String    @default("queued")
  // queued -> sending -> sent -> delivered -> opened -> clicked
  // OR: queued -> sending -> failed
  // OR: queued -> sending -> sent -> bounced
  
  // ESP tracking
  espMessageId String?  // Message ID from the ESP (e.g., Resend message ID)
  
  // Timestamps
  queuedAt    DateTime  @default(now())
  sentAt      DateTime?
  deliveredAt DateTime?
  firstOpenedAt DateTime?
  firstClickedAt DateTime?
  bouncedAt   DateTime?
  failedAt    DateTime?
  
  // Error info
  failureReason String?
  bounceType    String? // hard, soft
  
  // Metadata
  metadata    Json      @default("{}")
  
  // Relations
  campaign    EmailCampaign @relation(fields: [campaignId], references: [id])
  contact     Contact       @relation(fields: [contactId], references: [id])
  events      EmailEvent[]
  
  @@unique([campaignId, contactId]) // One send per contact per campaign
  @@index([tenantId])
  @@index([campaignId])
  @@index([contactId])
  @@index([status])
  @@index([sentAt])
}

// Granular email events (opens, clicks, bounces, etc.)
model EmailEvent {
  id          String    @id @default(uuid())
  tenantId    String
  
  sendId      String
  campaignId  String    // Denormalized for faster queries
  contactId   String    // Denormalized for faster queries
  
  // Event details
  eventType   String    // sent, delivered, opened, clicked, bounced, 
                        // unsubscribed, complained, failed
  
  // Click-specific
  linkUrl     String?   // URL that was clicked
  linkTag     String?   // Optional tag for link grouping
  
  // Bounce-specific
  bounceType  String?   // hard, soft
  bounceCode  String?   // SMTP code
  
  // Context
  userAgent   String?
  ipAddress   String?
  deviceType  String?   // desktop, mobile, tablet
  
  // Timestamp
  occurredAt  DateTime  @default(now())
  
  // Relations
  send        EmailSend @relation(fields: [sendId], references: [id])
  
  @@index([tenantId])
  @@index([sendId])
  @@index([campaignId])
  @@index([contactId])
  @@index([eventType])
  @@index([occurredAt])
}

// Contact Lists / Segments
model ContactList {
  id          String    @id @default(uuid())
  tenantId    String
  
  name        String
  description String?
  
  // List type
  type        String    @default("static") // static, dynamic (segment)
  
  // Dynamic list filter (for segments)
  filterConfig Json?    // { conditions: [...], logic: "AND" | "OR" }
  
  // Stats
  contactCount Int      @default(0)
  
  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  createdBy   String?
  
  // Relations
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  members     ContactListMember[]
  campaigns   EmailCampaign[]
  
  @@index([tenantId])
  @@index([type])
  @@index([deletedAt])
}

// Contact-List membership (for static lists)
model ContactListMember {
  listId      String
  contactId   String
  
  addedAt     DateTime  @default(now())
  addedBy     String?
  
  // Subscription status for this list
  status      String    @default("active") // active, unsubscribed
  unsubscribedAt DateTime?
  
  list        ContactList @relation(fields: [listId], references: [id], onDelete: Cascade)
  contact     Contact     @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  @@id([listId, contactId])
  @@index([contactId])
  @@index([status])
}

// Contact subscription preferences
model ContactSubscription {
  id          String    @id @default(uuid())
  tenantId    String
  contactId   String
  
  // Subscription details
  channel     String    @default("email") // email, sms
  status      String    @default("subscribed") // subscribed, unsubscribed, bounced
  
  // Consent tracking (GDPR)
  consentSource   String?  // signup_form, import, api, manual
  consentDate     DateTime?
  consentIp       String?
  consentUserAgent String?
  
  // Unsubscribe tracking
  unsubscribedAt  DateTime?
  unsubscribeSource String? // one-click, link, manual, bounce
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  contact     Contact   @relation(fields: [contactId], references: [id])
  
  @@unique([tenantId, contactId, channel])
  @@index([tenantId])
  @@index([contactId])
  @@index([status])
}

// Email suppression list (hard bounces, complaints, global unsubscribes)
model EmailSuppression {
  id          String    @id @default(uuid())
  tenantId    String
  
  email       String
  reason      String    // hard_bounce, complaint, manual, global_unsubscribe
  
  // Source
  campaignId  String?
  
  createdAt   DateTime  @default(now())
  
  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
}
```

### 5.3 Required Changes to Existing Models

The following relations need to be added to existing models:

```prisma
// Add to Tenant model:
  emailTemplates  EmailTemplate[]
  emailCampaigns  EmailCampaign[]
  contactLists    ContactList[]

// Add to Contact model:
  emailSends        EmailSend[]
  listMemberships   ContactListMember[]
  subscriptions     ContactSubscription[]
```

### 5.4 Analytics Aggregation Strategy

For dashboard analytics, avoid querying the `EmailEvent` table directly for aggregate stats. Instead:

1. **Denormalized stats on `EmailCampaign`**: Update `totalSent`, `totalOpened`, etc. via webhook handlers. These give instant campaign-level stats.
2. **Materialized views or scheduled aggregation**: For time-series analytics (opens over time, clicks by hour), create a Supabase CRON job or Edge Function that periodically aggregates `EmailEvent` data into summary tables.
3. **Real-time updates**: Use Supabase Realtime subscriptions on `EmailCampaign` stat fields for live dashboard updates during active sends.

---

## 6. Queue & Batch Processing

### 6.1 Architecture Overview

Email campaigns can target thousands of contacts. Sending must be:
- Batched (not all at once, to respect ESP rate limits)
- Tracked (progress visible to user)
- Resilient (retry on failure)
- Rate-limited (respect ESP and ISP limits)

### 6.2 Queue System Options for Next.js

| System | Description | Pros | Cons |
|--------|------------|------|------|
| **BullMQ + Redis** | Node.js queue library backed by Redis | Battle-tested, advanced features (priority, delay, retry, concurrency), dashboard (Bull Board) | Requires Redis server (Upstash Redis or self-hosted) |
| **Inngest** | Durable functions for Next.js | Serverless-native, built for Next.js, step functions, cron, retries | External service dependency, pricing |
| **Upstash QStash** | Serverless HTTP-based queue | No Redis needed, pay-per-use, designed for serverless/edge | Less feature-rich than BullMQ, HTTP overhead |
| **pg-boss** | PostgreSQL-based job queue | No additional infrastructure (uses existing Supabase PG), simple | Less performant than Redis-based queues at scale |
| **Supabase Edge Functions + pg_cron** | Supabase-native approach | No external dependencies, tight integration | Limited orchestration, no built-in retry/backoff |

### 6.3 Recommended: Hybrid Approach

For F-CORE MVP, use a combination that avoids external dependencies:

**Option A (Simple - Supabase-native):**
1. Campaign sends are queued into the `EmailSend` table with `status = 'queued'`
2. A Supabase Edge Function (or Next.js API route triggered by cron) processes batches:
   - Fetch N queued records (e.g., 50 at a time)
   - Send via Resend batch API
   - Update status to `sent`
   - Wait, then process next batch
3. Rate limiting: 50 emails per batch, 1-second delay between batches = ~3,000/min

**Option B (Scalable - BullMQ):**
1. Campaign send trigger creates a BullMQ job per batch (e.g., 100 contacts per job)
2. Worker processes consume jobs, send via Resend, update DB
3. Redis (Upstash) provides reliable queue persistence
4. Bull Board UI for monitoring queue status

### 6.4 Batch Sending Flow

```
[User clicks "Send Campaign"]
       |
       v
[API Route: POST /api/campaigns/{id}/send]
       |
       v
[Validate campaign, resolve recipient list]
       |
       v
[Create EmailSend records for all recipients (status: queued)]
       |
       v
[Update campaign status: "sending"]
       |
       v
[Enqueue batch jobs (50-100 recipients per batch)]
       |
       v
[Worker/Edge Function processes each batch]
  |-- For each recipient:
  |   |-- Render personalized HTML (merge tags)
  |   |-- Call Resend API (or batch API)
  |   |-- Update EmailSend status
  |   |-- Log to EmailEvent
  |-- Rate limit: sleep between batches
       |
       v
[All batches complete -> Update campaign status: "sent"]
       |
       v
[Webhook events arrive asynchronously]
  |-- delivered, opened, clicked, bounced, etc.
  |-- Update EmailSend and EmailEvent tables
  |-- Update campaign aggregate stats
```

### 6.5 Retry Logic

- **Transient failures** (network timeout, rate limit 429): Retry with exponential backoff (1s, 2s, 4s, 8s, 16s). Max 5 retries.
- **Permanent failures** (invalid email, authentication error): Mark as failed immediately, no retry.
- **Partial batch failure**: Retry only the failed individual sends, not the entire batch.

---

## 7. Compliance

### 7.1 CAN-SPAM (United States)

**Requirements for commercial email:**

| Requirement | Implementation in F-CORE |
|-------------|-------------------------|
| Don't use false or misleading header info | Validate `fromEmail` matches verified domain |
| Don't use deceptive subject lines | Content policy / manual review |
| Identify the message as an ad | Optional; best practice for marketing emails |
| Include physical postal address | Required field in campaign settings; rendered in email footer |
| Include opt-out mechanism | Unsubscribe link in every marketing email footer |
| Honor opt-out requests within 10 business days | Process immediately via webhook/API (target: < 1 hour) |
| Monitor third-party compliance | N/A for MVP |

**Penalty:** Up to $51,744 per email violation (2026 adjusted).

### 7.2 GDPR (European Union)

**Requirements:**

| Requirement | Implementation in F-CORE |
|-------------|-------------------------|
| Lawful basis for processing (consent) | `ContactSubscription.consentSource`, `consentDate`, `consentIp` |
| Explicit opt-in (no pre-checked boxes) | Consent forms with clear language |
| Record of consent | `ContactSubscription` model stores full consent trail |
| Right to access | API endpoint to export contact's email data |
| Right to erasure ("right to be forgotten") | Soft delete + data anonymization flow |
| Right to data portability | Export contact data as JSON/CSV |
| Double opt-in flow | Optional: send confirmation email with verification link |
| Data Processing Agreement | Legal/admin requirement, not technical |

**Penalty:** Up to 20 million EUR or 4% of global annual revenue.

### 7.3 List-Unsubscribe Header (RFC 8058)

**Required by Gmail and Yahoo for bulk senders (5,000+ emails/day) since February 2024.**

**Implementation:**

```typescript
// When sending via Resend or any ESP, include these headers:
const headers = {
  'List-Unsubscribe': '<https://app.f-core.com/api/unsubscribe/{token}>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```

**Requirements:**
- URL must use HTTPS
- Must support HTTP POST (one-click unsubscribe)
- Both headers must be covered by DKIM signature
- Process unsubscribe immediately (no confirmation page for one-click)
- The DKIM signature must cover `List-Unsubscribe` and `List-Unsubscribe-Post` headers

**Note:** Most ESPs (Resend, SendGrid, Postmark) handle List-Unsubscribe headers automatically when you configure unsubscribe settings. For F-CORE, Resend's built-in unsubscribe topics feature handles this.

### 7.4 Double Opt-In Flow

```
[User submits signup form]
       |
       v
[Create Contact with status: "pending"]
[Create ContactSubscription with status: "pending_confirmation"]
       |
       v
[Send confirmation email with verification link]
[Link: https://app.f-core.com/confirm/{token}]
       |
       v
[User clicks verification link]
       |
       v
[API: Verify token, update ContactSubscription.status = "subscribed"]
[Update Contact.lifecycleStage = "subscriber"]
[Record consent: source, date, IP, user agent]
```

---

## 8. Next.js Integration

### 8.1 API Routes Structure

```
src/app/api/
  email/
    templates/
      route.ts                    # GET (list), POST (create)
      [id]/
        route.ts                  # GET, PUT, DELETE
        preview/
          route.ts                # POST (render preview HTML)
        duplicate/
          route.ts                # POST (duplicate template)
    
    campaigns/
      route.ts                    # GET (list), POST (create)
      [id]/
        route.ts                  # GET, PUT, DELETE
        send/
          route.ts                # POST (trigger send)
        schedule/
          route.ts                # POST (schedule send)
        cancel/
          route.ts                # POST (cancel scheduled/sending)
        stats/
          route.ts                # GET (campaign analytics)
        preview/
          route.ts                # POST (render preview with sample contact)
    
    lists/
      route.ts                    # GET (list), POST (create)
      [id]/
        route.ts                  # GET, PUT, DELETE
        members/
          route.ts                # GET (list members), POST (add members)
          [contactId]/
            route.ts              # DELETE (remove member)
    
    unsubscribe/
      [token]/
        route.ts                  # GET (show unsubscribe page), POST (process)
    
    webhooks/
      resend/
        route.ts                  # POST (Resend webhook handler)
    
    suppression/
      route.ts                    # GET (list), POST (add)
      [id]/
        route.ts                  # DELETE (remove from suppression)
```

### 8.2 Server-Side Email Rendering

React Email templates can be rendered server-side in Next.js API routes:

```typescript
// src/lib/email/render.ts
import { render } from '@react-email/components';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

export async function renderEmail(
  templateName: string, 
  props: Record<string, any>
): Promise<{ html: string; text: string }> {
  const templates: Record<string, React.FC<any>> = {
    welcome: WelcomeEmail,
    // ... register more templates
  };

  const Template = templates[templateName];
  if (!Template) throw new Error(`Template ${templateName} not found`);

  const html = await render(<Template {...props} />);
  const text = await render(<Template {...props} />, { plainText: true });

  return { html, text };
}
```

### 8.3 Real-Time Analytics with Supabase Realtime

```typescript
// Client-side: Subscribe to campaign stats updates
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to real-time updates on campaign stats
const channel = supabase
  .channel('campaign-stats')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'EmailCampaign',
      filter: `id=eq.${campaignId}`,
    },
    (payload) => {
      // Update dashboard with new stats
      setCampaignStats(payload.new);
    }
  )
  .subscribe();
```

### 8.4 File Structure Recommendation

```
src/
  app/
    (dashboard)/
      email/
        page.tsx                    # Email marketing overview/dashboard
        templates/
          page.tsx                  # Template list
          [id]/
            page.tsx                # Template editor
            preview/
              page.tsx              # Full preview page
        campaigns/
          page.tsx                  # Campaign list
          new/
            page.tsx                # Create campaign wizard
          [id]/
            page.tsx                # Campaign detail/analytics
            edit/
              page.tsx              # Edit campaign
        lists/
          page.tsx                  # Contact lists
          [id]/
            page.tsx                # List detail / members
        analytics/
          page.tsx                  # Email analytics dashboard
    
    api/
      email/
        ... (as described in 8.1)
  
  components/
    email/
      TemplateEditor.tsx            # Template editing component
      TemplatePreview.tsx           # Template preview renderer
      CampaignWizard.tsx            # Multi-step campaign creation
      CampaignStats.tsx             # Real-time campaign statistics
      EmailAnalyticsDashboard.tsx   # Analytics charts and tables
      ContactListSelector.tsx       # List/segment selector
      MergeTagInserter.tsx          # Merge tag dropdown
      UnsubscribeForm.tsx           # Public unsubscribe page component
  
  lib/
    email/
      render.ts                     # Email rendering utilities
      send.ts                       # Email sending service wrapper
      tracking.ts                   # Tracking pixel/link generation
      merge-tags.ts                 # Merge tag resolution
      suppression.ts                # Suppression list management
      compliance.ts                 # Compliance validation
  
  emails/                           # React Email templates directory
    WelcomeEmail.tsx
    NewsletterEmail.tsx
    TransactionalEmail.tsx
    components/                     # Shared email components
      Header.tsx
      Footer.tsx
      Button.tsx
      SocialLinks.tsx
```

---

## 9. Recommended Architecture for F-CORE MVP

### 9.1 Editor Choice: React Email + TipTap (Hybrid)

**Rationale:**

| Layer | Tool | Why |
|-------|------|-----|
| **Programmatic templates** | React Email | Native to our React/Next.js stack; excellent email client compatibility; TypeScript components; works with Resend natively |
| **User-facing simple editor** | TipTap (rich text) | For quick, simple email composition (like HubSpot's "simple" editor mode); headless, lightweight, React-native |
| **Future: Visual builder** | Unlayer or GrapesJS | Defer drag-and-drop visual editor to P2/P3. When needed, Unlayer is easier to integrate; GrapesJS is free but requires more work |

**MVP approach:**
- P0: Pre-built React Email templates with merge tag support (developer-managed)
- P1: TipTap-based simple editor for marketing team to write email body content
- P2: Evaluate Unlayer vs. GrapesJS for full drag-and-drop visual editor
- P3: Custom block builder with template marketplace

### 9.2 Sending Service: Resend

**Rationale:**
- Native React Email integration (pass JSX directly to `react:` prop)
- Built by the same team as React Email -- tightest integration possible
- Modern TypeScript SDK with excellent DX
- Built-in audiences, contacts, broadcast emails, and unsubscribe topics
- Webhooks for all email events
- Free tier (3,000/mo) is sufficient for development and early users
- Pro tier ($20/mo for 50k emails) is cost-effective for growth
- Marketing contacts feature aligns with F-CORE's CRM model

**Fallback strategy:** If Resend doesn't meet scale/deliverability requirements later:
- SendGrid for enterprise scale
- Amazon SES for cost optimization at very high volumes
- The React Email templates work with all of these (just swap the send function)

### 9.3 Schema Design: See Section 5

The schema is designed to:
- Store both template design data (JSON) and compiled HTML
- Track the full campaign lifecycle (draft -> scheduled -> sending -> sent)
- Record per-contact send status and individual events
- Support contact lists (static) and segments (dynamic, filter-based)
- Track consent and subscription preferences for GDPR compliance
- Maintain a suppression list for bounces and complaints
- Denormalize aggregate stats on campaigns for fast dashboard queries

### 9.4 Implementation Phases

#### Phase 0 (P0) -- Foundation (1-2 weeks)
- [ ] Add email marketing models to Prisma schema
- [ ] Run migration
- [ ] Create React Email template components (Welcome, Newsletter, Notification)
- [ ] Integrate Resend SDK
- [ ] API routes: `POST /api/email/send` (single transactional email)
- [ ] Webhook handler: `POST /api/webhooks/resend`
- [ ] Basic unsubscribe endpoint
- [ ] Contact subscription model

#### Phase 1 (P1) -- Campaigns (2-3 weeks)
- [ ] Email template CRUD (API + UI)
- [ ] Template preview and rendering
- [ ] Contact list CRUD (static lists)
- [ ] Campaign creation wizard (select template, audience, subject, sender)
- [ ] Batch sending pipeline (database-queue approach)
- [ ] Campaign analytics page (sent, delivered, opened, clicked, bounced)
- [ ] TipTap-based simple email body editor
- [ ] Merge tag support (`{{contact.firstName}}`, `{{company.name}}`, etc.)

#### Phase 2 (P2) -- Advanced Features (3-4 weeks)
- [ ] Dynamic segments (filter-based contact lists)
- [ ] Campaign scheduling (send at specific date/time)
- [ ] A/B testing (subject line, content variants)
- [ ] Real-time campaign progress (Supabase Realtime)
- [ ] Email analytics dashboard (time-series charts, device breakdown)
- [ ] Suppression list management UI
- [ ] Double opt-in flow
- [ ] GDPR consent management

#### Phase 3 (P3) -- Scale & Polish (4+ weeks)
- [ ] Visual drag-and-drop editor (Unlayer or GrapesJS integration)
- [ ] Template marketplace / gallery
- [ ] Automated email sequences (drip campaigns)
- [ ] Send time optimization
- [ ] Advanced analytics (revenue attribution, funnel analysis)
- [ ] BullMQ/Redis queue for high-volume sending
- [ ] Dedicated IP management
- [ ] Email deliverability monitoring dashboard

---

## Appendix A: Key NPM Packages

```json
{
  "dependencies": {
    "@react-email/components": "^0.5.x",
    "@react-email/render": "^1.4.x",
    "resend": "^4.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-link": "^2.x",
    "@tiptap/extension-image": "^2.x",
    "@tiptap/extension-placeholder": "^2.x"
  },
  "devDependencies": {
    "react-email": "^4.x"
  }
}
```

## Appendix B: Resend API Quick Reference

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send single email
await resend.emails.send({
  from: 'F-CORE <noreply@mail.f-core.com>',
  to: ['user@example.com'],
  subject: 'Welcome to F-CORE',
  react: <WelcomeEmail firstName="John" />,
  headers: {
    'List-Unsubscribe': '<https://app.f-core.com/api/unsubscribe/TOKEN>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
});

// Send batch (up to 100 per call)
await resend.batch.send([
  { from: '...', to: '...', subject: '...', react: <Template /> },
  { from: '...', to: '...', subject: '...', react: <Template /> },
]);

// Manage contacts/audiences
await resend.contacts.create({
  email: 'user@example.com',
  firstName: 'John',
  audienceId: 'aud_xxx',
});
```

## Appendix C: Webhook Payload Example (Resend)

```json
{
  "type": "email.delivered",
  "created_at": "2026-02-08T10:30:00.000Z",
  "data": {
    "email_id": "msg_xxx",
    "from": "noreply@mail.f-core.com",
    "to": ["user@example.com"],
    "subject": "Welcome to F-CORE",
    "created_at": "2026-02-08T10:29:55.000Z"
  }
}
```

## Appendix D: References

- [React Email Documentation](https://react.email/docs/introduction)
- [Resend Documentation](https://resend.com/docs)
- [MJML Documentation](https://mjml.io/documentation/)
- [Unlayer React Email Editor](https://github.com/unlayer/react-email-editor)
- [GrapesJS](https://grapesjs.com/) + [Newsletter Preset](https://github.com/GrapesJS/grapesjs-preset-newsletter)
- [TipTap Documentation](https://tiptap.dev/docs)
- [RFC 8058 - One-Click Unsubscribe](https://www.rfc-editor.org/rfc/rfc8058)
- [CAN-SPAM Act](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [GDPR Official Text](https://gdpr-info.eu/)
- [Apple Mail Privacy Protection](https://www.apple.com/legal/privacy/data/en/mail-privacy-protection/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
