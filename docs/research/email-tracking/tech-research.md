# Email Tracking - Technical Research Document

> **Project:** F-CORE (HubSpot CRM Clone)
> **Author:** Technical Research (AI-Assisted)
> **Date:** 2026-02-08
> **Status:** RESEARCH COMPLETE
> **Priority:** P1 (Sales Hub Feature)
> **Sprint Target:** Sprint 5 - Activities & Timeline

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Email Tracking Architecture](#2-email-tracking-architecture)
3. [Database Schema Design](#3-database-schema-design)
4. [Prisma Schema Proposal](#4-prisma-schema-proposal)
5. [API Route Design](#5-api-route-design)
6. [Email Sending Strategy](#6-email-sending-strategy)
7. [Rich Text Editor Selection](#7-rich-text-editor-selection)
8. [Real-time Notifications](#8-real-time-notifications)
9. [Performance Considerations](#9-performance-considerations)
10. [Privacy & Compliance](#10-privacy--compliance)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Decision Log](#12-decision-log)

---

## 1. Executive Summary

This document provides a comprehensive technical analysis for implementing email tracking within the F-CORE CRM platform. Email tracking is classified as a P1 feature in the Sales Hub, directly following the Core CRM (P0) work completed in Sprints 1-3.

### Key Decisions (TL;DR)

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Schema approach | Dedicated `Email` model + keep Activity for timeline | Separation of concerns; email has too many unique fields |
| Tracking pixel | 1x1 transparent GIF served from Next.js API route | Industry standard; simple to implement |
| Click tracking | Redirect endpoint with tracking ID | Same as HubSpot's approach |
| Tracking ID format | `nanoid` (21 chars, URL-safe) | Shorter URLs, faster generation, similar collision probability to UUID |
| Rich text editor | **Tiptap** (based on ProseMirror) | Best balance of extensibility, React integration, email HTML output |
| Real-time notifications | Supabase Realtime (Postgres Changes) | Already in tech stack; zero additional infrastructure |
| MVP approach | Log-only (no SMTP sending) | Matches HubSpot's "log email" feature; reduces complexity |
| Email threads | `threadId` field with RFC 2822 `In-Reply-To` / `References` header storage | Standard email threading protocol |

---

## 2. Email Tracking Architecture

### 2.1 How Email Tracking Works (Industry Standard)

```
                                    F-CORE Server
                                   +-----------------+
                                   |                 |
   Sender composes email           |  1. Generate    |
   in F-CORE CRM        --------->|     trackingId   |
                                   |  2. Inject pixel |
                                   |  3. Rewrite URLs |
                                   |  4. Store email  |
                                   +---------+-------+
                                             |
                                             v
                                   +-----------------+
                                   |  Email Client   |
                                   |  (Recipient)    |
                                   +---------+-------+
                                             |
                          +------------------+------------------+
                          |                                     |
                          v                                     v
                +-----------------+                   +-----------------+
                | Open Tracking   |                   | Click Tracking  |
                | (Pixel Load)    |                   | (Link Redirect) |
                +---------+-------+                   +---------+-------+
                          |                                     |
                          v                                     v
                +-----------------+                   +-----------------+
                | GET /api/       |                   | GET /api/       |
                | tracking/open/  |                   | tracking/click/ |
                | [trackingId]    |                   | [trackingId]    |
                +---------+-------+                   +---------+-------+
                          |                                     |
                          +------------------+------------------+
                                             |
                                             v
                                   +-----------------+
                                   | Log EmailEvent  |
                                   | Notify sender   |
                                   | (Realtime)      |
                                   +-----------------+
```

### 2.2 Tracking Pixel Implementation

The tracking pixel is a 1x1 transparent GIF image embedded in the email HTML body. When the recipient's email client loads images, it requests this pixel from our server, allowing us to record the open event.

**Implementation details:**

```typescript
// /api/tracking/open/[trackingId]/route.ts

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  // Extract metadata from request
  const ip = request.headers.get('x-forwarded-for') || request.ip;
  const userAgent = request.headers.get('user-agent') || '';

  // Fire-and-forget: Log the open event asynchronously
  // Do NOT await this to keep response fast
  logEmailEvent({
    trackingId,
    eventType: 'OPENED',
    ip,
    userAgent,
    timestamp: new Date(),
  }).catch(console.error);

  // Return the transparent GIF with anti-caching headers
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
```

**Key implementation notes:**

- The GIF is exactly 43 bytes (minimal transparent 1x1 GIF)
- Anti-caching headers prevent the email client from caching the image, ensuring each open fires a request
- Event logging is fire-and-forget to keep response latency under 50ms
- The tracking pixel is injected into the email body HTML just before the closing `</body>` tag

**Pixel injection into email HTML:**

```typescript
function injectTrackingPixel(htmlBody: string, trackingId: string): string {
  const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/open/${trackingId}`;
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none;visibility:hidden;width:1px;height:1px;opacity:0;" alt="" />`;

  // Insert before </body> if present, otherwise append
  if (htmlBody.includes('</body>')) {
    return htmlBody.replace('</body>', `${pixelHtml}</body>`);
  }
  return htmlBody + pixelHtml;
}
```

### 2.3 Link Click Tracking

Every link in the email body is rewritten to pass through a redirect endpoint. This allows us to record the click before redirecting the user to the actual destination.

**URL rewriting:**

```typescript
function rewriteLinksForTracking(
  htmlBody: string,
  emailId: string,
  trackingId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Match all href attributes in anchor tags
  return htmlBody.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, originalUrl) => {
      // Encode the original URL
      const encodedUrl = encodeURIComponent(originalUrl);
      const clickUrl = `${baseUrl}/api/tracking/click/${trackingId}?url=${encodedUrl}&lid=${nanoid(10)}`;
      return `href="${clickUrl}"`;
    }
  );
}
```

**Click tracking endpoint:**

```typescript
// /api/tracking/click/[trackingId]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const destinationUrl = searchParams.get('url');
  const linkId = searchParams.get('lid');

  if (!destinationUrl) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const decodedUrl = decodeURIComponent(destinationUrl);

  // Validate URL to prevent open redirect attacks
  try {
    new URL(decodedUrl);
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Fire-and-forget: Log click event
  logEmailEvent({
    trackingId,
    eventType: 'CLICKED',
    linkId,
    linkUrl: decodedUrl,
    ip: request.headers.get('x-forwarded-for') || request.ip,
    userAgent: request.headers.get('user-agent') || '',
    timestamp: new Date(),
  }).catch(console.error);

  // 302 redirect to the original URL
  return NextResponse.redirect(decodedUrl, { status: 302 });
}
```

### 2.4 Open Tracking Accuracy and Limitations

Based on extensive research into current email client behavior (as of early 2026), these are the critical accuracy considerations:

| Factor | Impact | Mitigation |
|--------|--------|------------|
| **Apple Mail Privacy Protection (MPP)** | Pre-loads all images including tracking pixels; ~50-65% of email users affected; inflates open rates | Filter by user-agent; flag as "machine open" vs "human open"; focus on click metrics |
| **Gmail image proxy** | Caches images through `googleusercontent.com` proxy; single IP for all Gmail users | Cannot determine Gmail user location from IP; open count may be slightly off |
| **Google open tracking warnings** | Gmail (since Aug 2024) shows warning banners for tracking pixels; may increase spam reports | Use custom tracking domain (not generic); ensure pixel is small |
| **Image blocking** | Some email clients block images by default (Outlook desktop, some corporate clients) | Infer open from click events; store "open inferred from click" events |
| **Bot/security scanner pre-fetching** | Enterprise email security tools (Barracuda, Mimecast) pre-fetch links and images | Check user-agent for known bot signatures; debounce rapid opens; flag suspicious patterns |
| **Email forwarding** | Forwarded emails contain the same tracking pixel; creates false opens attributed to original recipient | Cannot fully solve; document as known limitation |
| **iOS 18 Link Tracking Protection** | Strips UTM parameters and known tracking query strings from links | Use path-based tracking IDs instead of query-parameter-only tracking |

**Recommended accuracy strategy for F-CORE:**

1. **Track all events** but classify them:
   - `OPENED` - Standard open event
   - `OPENED_MACHINE` - Suspected machine/bot open (Apple MPP, security scanners)
   - `OPENED_INFERRED` - Open inferred from a click event
2. **Display "reliable open rate"** to users that excludes machine opens
3. **Emphasize click tracking** as the more reliable engagement metric
4. **Store raw data** so analytics can be recalculated as classification logic improves

### 2.5 IP Geolocation for Opens

For open events, the requesting IP address can provide approximate location data.

**Approach:**

- Use a lightweight IP geolocation library (e.g., `geoip-lite` for Node.js, or MaxMind GeoLite2 database)
- Extract country and city-level data only (not precise coordinates)
- Store in the `EmailEvent.metadata` JSONB field
- Do NOT store precise GPS coordinates (privacy concern)

**Limitations:**

- Gmail proxy IPs resolve to Google data centers, not user location
- Apple MPP proxy IPs resolve to Apple relay servers
- VPN users will show VPN exit node locations
- Accuracy: Country-level is ~95% reliable; city-level is ~60-70% reliable

**Implementation note:** For MVP, skip IP geolocation. Add it as a Phase 2 enhancement. The IP address is stored in event metadata, so geolocation can be retroactively applied.

---

## 3. Database Schema Design

### 3.1 Schema Design Decision: Dedicated Email Model vs. Extended Activity

**Analysis of the existing Activity model:**

The current `Activity` model in `prisma/schema.prisma` already has email-specific fields:
- `emailTo`, `emailCc`, `emailBcc`, `emailStatus`

However, a full email tracking implementation requires significantly more data:

| Requirement | Activity Model Sufficient? | Notes |
|-------------|--------------------------|-------|
| Basic email storage (to, from, cc, bcc, subject, body) | Partially | `emailTo` is a single String; need arrays for multiple recipients |
| Email threading (thread_id, in_reply_to, references) | No | No threading fields exist |
| Tracking events (opens, clicks) with timestamps | No | Would need a child table regardless |
| Email templates | No | Separate concern entirely |
| Email sequences/automation state | No | Separate concern entirely |
| Multiple attachments | No | No attachment support |
| Email-specific metadata (message_id, headers) | Partially | Could use `metadata` JSONB, but messy |
| Rich query patterns (search by recipient, date range, status) | Poorly | Current indexes are general-purpose |

**Decision: Create a dedicated `Email` model AND keep Activity for timeline display.**

**Rationale:**

1. **Separation of concerns:** Email has enough unique fields and query patterns to warrant its own model
2. **Timeline integration:** When an email is created, we also create an `Activity` record of type `email` that links to the `Email` record. This keeps the unified timeline working.
3. **Query performance:** Dedicated indexes on email-specific fields (recipients, thread_id, status)
4. **Scalability:** Email events (opens/clicks) are high-volume append-only data; keeping them in their own table prevents bloating the Activity table
5. **This mirrors HubSpot's architecture:** HubSpot stores emails as "engagements" (their equivalent of Activities) but with a dedicated email metadata structure

### 3.2 Entity Relationship Diagram

```
                    +------------------+
                    |     Tenant       |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v-------+ +---v---+ +--------v--------+
     |    Contact      | | User  | |    Company       |
     +--------+--------+ +---+---+ +--------+--------+
              |               |              |
              |    +----------+----------+   |
              |    |                      |   |
              +--->+       Email          +<--+
              |    |                      |   |
              |    +---+------+-----------+   |
              |        |      |               |
              |        |      v               |
              |        |  +---+------------+  |
              |        |  | EmailEvent     |  |
              |        |  | (opens/clicks) |  |
              |        |  +----------------+  |
              |        |                      |
              |        v                      |
              |  +-----+----------+           |
              |  | EmailTemplate  |           |
              |  +----------------+           |
              |                               |
              +-----> Activity (timeline) <---+
                     (type='email',
                      emailId reference)
```

### 3.3 EmailTracking Events Table Design

The `EmailEvent` table is designed as a high-volume, append-only log. Key design principles:

1. **Append-only:** Events are never updated or deleted
2. **Partitioning-ready:** `createdAt` column supports future time-based partitioning
3. **Minimal columns:** Keep the row small; use JSONB `metadata` for variable data
4. **Composite indexes:** Optimized for common query patterns (events by email, events by type+date)

**Event types:**

| Event Type | Trigger | Data Captured |
|------------|---------|--------------|
| `SENT` | Email is sent/logged | Timestamp |
| `DELIVERED` | SMTP confirmation (future) | Timestamp, SMTP response |
| `OPENED` | Tracking pixel loaded | IP, user-agent, geo |
| `OPENED_MACHINE` | Suspected bot/MPP open | IP, user-agent |
| `OPENED_INFERRED` | Inferred from click | Linked click event |
| `CLICKED` | Tracking link clicked | Link URL, IP, user-agent |
| `REPLIED` | Reply detected (future) | Reply email reference |
| `BOUNCED` | SMTP bounce (future) | Bounce type, reason |
| `UNSUBSCRIBED` | Unsubscribe link clicked | Timestamp |
| `SPAM_REPORTED` | Marked as spam (future) | Timestamp |

### 3.4 Email Thread/Conversation Grouping

Email threading follows RFC 2822 standards using three key headers:

- **`Message-ID`**: Unique identifier for each email (e.g., `<abc123@fcore.app>`)
- **`In-Reply-To`**: The `Message-ID` of the email being replied to
- **`References`**: Space-separated list of all `Message-ID` values in the thread chain

**Threading strategy for F-CORE:**

```
Thread: "Q4 Sales Proposal"
  |
  +-- Email 1: Message-ID: <001@fcore.app>
  |             In-Reply-To: null
  |             References: null
  |             threadId: "thread_abc123"
  |
  +-- Email 2: Message-ID: <002@fcore.app>
  |             In-Reply-To: <001@fcore.app>
  |             References: <001@fcore.app>
  |             threadId: "thread_abc123"
  |
  +-- Email 3: Message-ID: <003@fcore.app>
                In-Reply-To: <002@fcore.app>
                References: <001@fcore.app> <002@fcore.app>
                threadId: "thread_abc123"
```

**Implementation:**

- Generate `threadId` on the first email of a conversation
- When replying, copy the `threadId` from the parent email
- When importing/syncing external emails, use `In-Reply-To` and `References` headers to reconstruct threads
- Store all three header values for maximum compatibility

### 3.5 Email Template Storage

Templates are tenant-scoped and support variable interpolation.

**Template variables use double-brace syntax:**

```
Subject: Following up on {{deal.name}}, {{contact.firstName}}

Hi {{contact.firstName}},

I wanted to follow up on our conversation about {{deal.name}}.
Best regards,
{{sender.name}}
```

**Supported variable categories:**

- `contact.*` - Contact properties (firstName, lastName, email, jobTitle, etc.)
- `company.*` - Company properties (name, domain, industry, etc.)
- `deal.*` - Deal properties (name, amount, closeDate, stageName, etc.)
- `sender.*` - Current user properties (name, email, etc.)
- `today` - Current date
- `custom.*` - Custom properties defined via PropertyDefinition

---

## 4. Prisma Schema Proposal

### 4.1 New Models

```prisma
// ============================================
// EMAIL TRACKING SYSTEM
// ============================================

model Email {
  id              String    @id @default(uuid())
  tenantId        String

  // Email Identity
  trackingId      String    @unique  // nanoid, used in tracking pixel/links
  messageId       String?   @unique  // RFC 2822 Message-ID header
  threadId        String?             // Groups emails in same conversation

  // Threading (RFC 2822)
  inReplyTo       String?             // Message-ID of parent email
  references      String?  @db.Text   // Space-separated Message-IDs of thread chain

  // Sender & Recipients
  fromEmail       String              // Sender email address
  fromName        String?             // Sender display name
  toRecipients    Json                // Array: [{email, name}]
  ccRecipients    Json?               // Array: [{email, name}]
  bccRecipients   Json?               // Array: [{email, name}]

  // Content
  subject         String?
  bodyHtml        String?  @db.Text   // Rich HTML body (with tracking injected)
  bodyText        String?  @db.Text   // Plain text fallback
  bodyOriginal    String?  @db.Text   // Original HTML before tracking injection

  // Status & Tracking
  status          String   @default("draft")  // draft, scheduled, sent, delivered, bounced, failed
  direction       String   @default("outbound") // inbound, outbound
  sentAt          DateTime?
  scheduledAt     DateTime?

  // Tracking Metrics (denormalized for performance)
  openCount       Int      @default(0)
  clickCount      Int      @default(0)
  replyCount      Int      @default(0)
  firstOpenedAt   DateTime?
  lastOpenedAt    DateTime?
  firstClickedAt  DateTime?

  // Template Reference
  templateId      String?

  // CRM Associations
  contactId       String?
  companyId       String?
  dealId          String?
  ownerId         String?   // User who sent the email
  activityId      String?   @unique  // Link back to Activity for timeline

  // Metadata (headers, SMTP response, etc.)
  metadata        Json     @default("{}")

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  // Relations
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  contact         Contact?      @relation(fields: [contactId], references: [id])
  company         Company?      @relation(fields: [companyId], references: [id])
  deal            Deal?         @relation(fields: [dealId], references: [id])
  owner           User?         @relation(fields: [ownerId], references: [id])
  template        EmailTemplate? @relation(fields: [templateId], references: [id])
  events          EmailEvent[]
  attachments     EmailAttachment[]

  // Indexes
  @@index([tenantId])
  @@index([trackingId])
  @@index([threadId])
  @@index([contactId])
  @@index([companyId])
  @@index([dealId])
  @@index([ownerId])
  @@index([status])
  @@index([sentAt(sort: Desc)])
  @@index([deletedAt])
  @@index([tenantId, contactId, sentAt(sort: Desc)])
}

model EmailEvent {
  id              String    @id @default(uuid())

  // Event Data
  emailId         String
  eventType       String    // SENT, DELIVERED, OPENED, OPENED_MACHINE, OPENED_INFERRED, CLICKED, REPLIED, BOUNCED, UNSUBSCRIBED, SPAM_REPORTED

  // Click-specific
  linkUrl         String?   @db.Text
  linkId          String?   // Identifier for the specific link clicked

  // Request Metadata
  ipAddress       String?
  userAgent       String?   @db.Text

  // Geolocation (derived from IP)
  country         String?
  city            String?

  // Metadata (flexible storage for additional data)
  metadata        Json      @default("{}")

  // Timestamp (append-only, no updatedAt)
  createdAt       DateTime  @default(now())

  // Relations
  email           Email     @relation(fields: [emailId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([emailId])
  @@index([eventType])
  @@index([emailId, eventType])
  @@index([createdAt(sort: Desc)])
  @@index([emailId, createdAt(sort: Desc)])
}

model EmailTemplate {
  id              String    @id @default(uuid())
  tenantId        String

  // Template Content
  name            String
  subject         String?
  bodyHtml        String?   @db.Text
  bodyText        String?   @db.Text

  // Organization
  category        String?   // sales, marketing, support, follow-up
  isShared        Boolean   @default(false)  // Shared across team or personal
  isActive        Boolean   @default(true)

  // Usage Stats (denormalized)
  useCount        Int       @default(0)
  lastUsedAt      DateTime?

  // Owner
  createdById     String?

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  // Relations
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  createdBy       User?     @relation("EmailTemplateCreator", fields: [createdById], references: [id])
  emails          Email[]

  // Indexes
  @@index([tenantId])
  @@index([tenantId, category])
  @@index([tenantId, isShared])
  @@index([createdById])
  @@index([deletedAt])
}

model EmailAttachment {
  id              String    @id @default(uuid())

  emailId         String
  fileName        String
  fileSize        Int       // bytes
  mimeType        String
  storageUrl      String    // URL in Supabase Storage or S3

  createdAt       DateTime  @default(now())

  // Relations
  email           Email     @relation(fields: [emailId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([emailId])
}
```

### 4.2 Required Changes to Existing Models

The following relations need to be added to existing models:

```prisma
// Add to User model:
  emailsSent      Email[]
  emailTemplates  EmailTemplate[] @relation("EmailTemplateCreator")

// Add to Tenant model:
  emails          Email[]
  emailTemplates  EmailTemplate[]

// Add to Contact model:
  emails          Email[]

// Add to Company model:
  emails          Email[]

// Add to Deal model:
  emails          Email[]

// Add to Activity model (optional, for linking):
  emailRef        Email?
```

### 4.3 Index Strategy Rationale

| Index | Query Pattern | Expected Frequency |
|-------|--------------|-------------------|
| `Email(tenantId)` | All email queries must filter by tenant | Every query |
| `Email(trackingId)` | Tracking pixel/click endpoint lookup | Every open/click event |
| `Email(threadId)` | Load conversation thread | Thread view |
| `Email(contactId)` | Emails for a contact detail page | Contact view |
| `Email(tenantId, contactId, sentAt DESC)` | Contact's email timeline | Contact view |
| `EmailEvent(emailId)` | All events for an email | Email detail view |
| `EmailEvent(emailId, eventType)` | Count opens/clicks for an email | Analytics |
| `EmailEvent(emailId, createdAt DESC)` | Recent events for an email | Activity feed |
| `EmailEvent(createdAt DESC)` | Global event stream for notifications | Real-time feed |

---

## 5. API Route Design

### 5.1 API Endpoints

```
/api/emails
  POST   /api/emails                        - Send/log a new email
  GET    /api/emails                        - List emails (with filters)
  GET    /api/emails/[id]                   - Get email detail
  PATCH  /api/emails/[id]                   - Update email (draft only)
  DELETE /api/emails/[id]                   - Soft delete email

/api/emails/[id]/events
  GET    /api/emails/[id]/events            - List tracking events for email

/api/emails/threads/[threadId]
  GET    /api/emails/threads/[threadId]     - Get all emails in a thread

/api/tracking (public, no auth required)
  GET    /api/tracking/open/[trackingId]    - Tracking pixel endpoint
  GET    /api/tracking/click/[trackingId]   - Click redirect endpoint

/api/email-templates
  POST   /api/email-templates               - Create template
  GET    /api/email-templates               - List templates
  GET    /api/email-templates/[id]          - Get template detail
  PATCH  /api/email-templates/[id]          - Update template
  DELETE /api/email-templates/[id]          - Soft delete template
```

### 5.2 Endpoint Details

#### POST /api/emails - Send/Log Email

```typescript
// Request Body
interface CreateEmailRequest {
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  subject: string;
  bodyHtml: string;
  bodyText?: string;

  // CRM associations
  contactId?: string;
  companyId?: string;
  dealId?: string;

  // Options
  templateId?: string;
  trackOpens?: boolean;    // default: true
  trackClicks?: boolean;   // default: true
  scheduledAt?: string;    // ISO 8601 datetime for scheduled send
  isDraft?: boolean;       // default: false
}

// Response: 201 Created
interface CreateEmailResponse {
  id: string;
  trackingId: string;
  status: 'draft' | 'sent' | 'scheduled';
  sentAt: string | null;
  // ... full email object
}
```

**Server-side processing pipeline:**

```
1. Validate input (Zod schema)
2. Verify tenant_id authorization
3. Sanitize HTML body (DOMPurify)
4. Generate trackingId (nanoid)
5. Generate messageId (RFC 2822 format)
6. Determine threadId (from parent email if reply, or generate new)
7. If trackOpens: inject tracking pixel into bodyHtml
8. If trackClicks: rewrite links in bodyHtml
9. Store original bodyHtml in bodyOriginal
10. Save Email record to database
11. Create Activity record (type='email') for timeline
12. Log SENT event to EmailEvent
13. Return response
```

#### GET /api/emails - List Emails

```typescript
// Query Parameters
interface ListEmailsQuery {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  threadId?: string;
  status?: 'draft' | 'sent' | 'delivered' | 'bounced';
  direction?: 'inbound' | 'outbound';
  search?: string;        // Search in subject, recipients
  page?: number;           // default: 1
  pageSize?: number;       // default: 20, max: 100
  sortBy?: 'sentAt' | 'createdAt' | 'subject';
  sortOrder?: 'asc' | 'desc';
}

// Response: 200 OK
interface ListEmailsResponse {
  data: EmailSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET /api/tracking/open/[trackingId] - Tracking Pixel

- **Authentication:** None (must be publicly accessible)
- **Rate limiting:** High limit (1000 req/min per tracking ID)
- **Response:** 1x1 transparent GIF with no-cache headers
- **Side effect:** Creates `EmailEvent` record asynchronously
- **Bot detection:** Check user-agent against known bot patterns; classify as `OPENED_MACHINE` if match

#### GET /api/tracking/click/[trackingId] - Click Redirect

- **Authentication:** None (must be publicly accessible)
- **Rate limiting:** High limit (1000 req/min per tracking ID)
- **Response:** 302 redirect to destination URL
- **Side effect:** Creates `EmailEvent` record asynchronously; also creates `OPENED_INFERRED` event if no prior open recorded
- **Security:** Validate destination URL to prevent open redirect attacks

### 5.3 Input Validation (Zod Schemas)

```typescript
import { z } from 'zod';

const EmailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const CreateEmailSchema = z.object({
  to: z.array(EmailRecipientSchema).min(1).max(50),
  cc: z.array(EmailRecipientSchema).max(50).optional(),
  bcc: z.array(EmailRecipientSchema).max(50).optional(),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1).max(500_000), // 500KB max
  bodyText: z.string().max(200_000).optional(),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
  isDraft: z.boolean().default(false),
});
```

### 5.4 Multi-tenancy Enforcement

Every API endpoint MUST enforce tenant isolation:

```typescript
// Middleware pattern for all email endpoints
async function withTenantEmail(
  request: NextRequest,
  handler: (tenantId: string, userId: string) => Promise<Response>
) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(session.tenantId, session.userId);
}

// Usage in route handler
export async function GET(request: NextRequest) {
  return withTenantEmail(request, async (tenantId, userId) => {
    const emails = await prisma.email.findMany({
      where: {
        tenantId,         // ALWAYS filter by tenantId
        deletedAt: null,  // ALWAYS exclude soft-deleted
      },
      // ...
    });
    return NextResponse.json({ data: emails });
  });
}
```

---

## 6. Email Sending Strategy

### 6.1 MVP Approach: Log-Only

For the MVP, F-CORE will **not** send emails via SMTP. Instead, emails are **logged** into the CRM, mirroring HubSpot's "Log Email" functionality where sales reps record emails they've already sent through their email client (Gmail, Outlook).

**Why log-only for MVP:**

1. **Reduced complexity:** No need for SMTP configuration, email deliverability management, or bounce handling
2. **Matches real-world usage:** Many CRM users simply log emails they've sent externally
3. **No third-party dependency:** No need for SendGrid, Resend, or other email service providers
4. **Testing simplicity:** Can develop and test the full tracking UI without an email pipeline

**Future phases (post-MVP):**

| Phase | Capability | Provider Options |
|-------|-----------|-----------------|
| Phase 2 | SMTP sending via API | Resend, SendGrid, AWS SES |
| Phase 3 | Email sync (Gmail/Outlook) | Google Workspace API, Microsoft Graph API |
| Phase 4 | Bulk email campaigns | Dedicated email infrastructure |

### 6.2 Tracking ID Generation

**Decision: Use `nanoid` over UUID for tracking IDs.**

| Property | UUID v4 | nanoid (default) |
|----------|---------|-----------------|
| Length | 36 chars (with hyphens) | 21 chars |
| Character set | Hex (0-9, a-f) | A-Za-z0-9_- (URL-safe) |
| Collision probability | ~2^122 random bits | ~2^126 random bits |
| Generation speed | ~1.5M ops/sec | ~2.5M ops/sec |
| URL-safe | Needs encoding | Yes, natively |

**Implementation:**

```typescript
import { nanoid } from 'nanoid';

// For tracking IDs (used in URLs)
const trackingId = nanoid();      // e.g., "V1StGXR8_Z5jdHi6B-myT"

// For link IDs (shorter, used as sub-identifiers)
const linkId = nanoid(10);        // e.g., "IRFa-VaY2b"

// For Message-ID header (RFC 2822 format)
const messageId = `<${nanoid()}@fcore.app>`;
```

**Note:** The primary `id` field on the Email model still uses UUID (via Prisma `@default(uuid())`) for consistency with the rest of the schema. The `trackingId` field uses nanoid specifically for URL-facing identifiers.

### 6.3 Email Body HTML Sanitization

User-generated HTML must be sanitized to prevent XSS attacks, especially since email content may be displayed in the CRM UI.

**Recommended library: `isomorphic-dompurify`**

```typescript
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'a', 'b', 'blockquote', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 'span',
  'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
];

const ALLOWED_ATTRS = [
  'href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height',
  'target', 'rel', 'align', 'valign', 'bgcolor', 'border', 'cellpadding',
  'cellspacing', 'colspan', 'rowspan',
];

function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // Allow target="_blank" on links
  });
}
```

---

## 7. Rich Text Editor Selection

### 7.1 Requirements for F-CORE Email Composer

1. **Email-compatible HTML output** (inline styles, table-based layout support)
2. **Template variable insertion** (`{{contact.firstName}}` etc.)
3. **React 19 compatibility** with Next.js App Router
4. **TypeScript support** (strict mode)
5. **Extensibility** for custom features (merge tags, signature insertion)
6. **Reasonable bundle size** (< 100KB gzipped for the editor)
7. **Active maintenance** and community

### 7.2 Comparison Matrix

| Feature | Tiptap | Lexical | Slate.js | Quill |
|---------|--------|---------|----------|-------|
| **Based on** | ProseMirror | Custom (Meta) | Custom | Delta format |
| **React support** | Excellent (first-class) | Excellent (React-first) | Good (React wrapper) | Via react-quill wrapper |
| **TypeScript** | Full | Full | Full | Partial (via DefinitelyTyped) |
| **Bundle size** (core) | ~45KB gzipped | ~22KB gzipped | ~55KB gzipped | ~43KB gzipped |
| **Email HTML output** | Good (with extensions) | Requires custom | Requires custom | Good (built-in) |
| **Extension system** | Excellent (plug-and-play) | Good (plugin-based) | Good (plugin-based) | Limited |
| **Documentation** | Excellent | Improving (was weak) | Good | Good |
| **Community** | Large (32k GitHub stars) | Growing (Meta-backed) | Mature | Mature but stagnant |
| **Collaboration** | Yes (paid + Yjs free) | Yes (via Liveblocks/Yjs) | Limited | Limited |
| **Template variables** | Easy via custom nodes | Possible via custom nodes | Possible via custom elements | Difficult |
| **Headless (server-side)** | Yes (via ProseMirror) | Yes (`@lexical/headless`) | No | No |
| **Learning curve** | Moderate | Steep | Steep | Low |
| **License** | MIT | MIT | MIT | BSD |
| **Maintenance (2025-2026)** | Very active | Very active | Active | Slowing |

### 7.3 Recommendation: Tiptap

**Tiptap is the recommended rich text editor for F-CORE.** Here is the reasoning:

**Strengths for this project:**

1. **ProseMirror foundation:** Battle-tested content editing engine used by The New York Times, Atlassian, and others
2. **Extension architecture:** Custom merge tag insertion (for `{{contact.firstName}}`) is straightforward with a custom Tiptap node
3. **Email HTML output:** The `getHTML()` method produces clean HTML that works in email clients; can be enhanced with custom serializers for email-specific HTML
4. **React integration:** First-class hooks (`useEditor`, `EditorContent`) that work with React 19 and Next.js App Router
5. **Tree-shakable:** Only import the extensions you need; keeps bundle size manageable
6. **Active ecosystem:** Bubble menu, floating menu, and toolbar components available out of the box

**Example integration for F-CORE:**

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { MergeTagExtension } from './extensions/merge-tag';

export function EmailComposer({
  initialContent = '',
  onSend,
}: {
  initialContent?: string;
  onSend: (html: string, text: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your email...' }),
      Image,
      MergeTagExtension,
    ],
    content: initialContent,
    immediatelyRender: false, // Required for Next.js SSR
  });

  const handleSend = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const text = editor.getText();
    onSend(html, text);
  };

  return (
    <div>
      <EmailToolbar editor={editor} />
      <EditorContent editor={editor} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

**Why NOT the alternatives:**

- **Lexical:** Performance is excellent and it is React-first, but documentation is still catching up. Building custom email-specific features requires more boilerplate. Good second choice if Tiptap licensing becomes a concern.
- **Slate.js:** Powerful but requires building almost everything from scratch. The learning curve is steep and development velocity would be slower.
- **Quill:** Easy to start with but hard to customize deeply. The `react-quill` wrapper has SSR issues with Next.js. Less actively maintained.

### 7.4 Template Variable Interpolation

Template variables follow a `{{object.field}}` syntax and are rendered in the editor as styled inline chips.

```typescript
// Custom Tiptap extension for merge tags
import { Node, mergeAttributes } from '@tiptap/core';

export const MergeTagExtension = Node.create({
  name: 'mergeTag',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      label: { default: '' },    // e.g., "First Name"
      variable: { default: '' }, // e.g., "contact.firstName"
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-tag]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(
      { 'data-merge-tag': HTMLAttributes.variable },
      { class: 'merge-tag-chip' },
    ), `{{${HTMLAttributes.variable}}}`];
  },
});
```

**Server-side interpolation before sending:**

```typescript
function interpolateTemplate(
  html: string,
  context: {
    contact?: Record<string, string>;
    company?: Record<string, string>;
    deal?: Record<string, string>;
    sender?: Record<string, string>;
  }
): string {
  return html.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, field) => {
    const source = context[obj as keyof typeof context];
    return source?.[field] || match; // Keep original if no value
  });
}
```

---

## 8. Real-time Notifications

### 8.1 Strategy Comparison

| Approach | Latency | Complexity | Infrastructure | Best For |
|----------|---------|-----------|---------------|----------|
| **Polling** | 5-30 seconds | Low | None | MVP, low frequency events |
| **Server-Sent Events (SSE)** | < 1 second | Medium | Stateful connections | One-directional updates |
| **WebSocket** | < 100ms | High | WebSocket server | Bi-directional communication |
| **Supabase Realtime** | < 1 second | Low | Already included | Postgres-triggered events |

### 8.2 Recommendation: Supabase Realtime

Since F-CORE already uses Supabase as its database provider, Supabase Realtime is the natural choice. It provides:

1. **Zero additional infrastructure:** Realtime is included with every Supabase project
2. **Postgres Changes:** Automatically broadcasts when rows are inserted into the `EmailEvent` table
3. **Row Level Security:** Tenant isolation is enforced by existing RLS policies
4. **Client library integration:** `@supabase/supabase-js` already in the project

**Implementation:**

```typescript
// Hook: useEmailTrackingEvents.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface EmailTrackingEvent {
  id: string;
  emailId: string;
  eventType: string;
  createdAt: string;
}

export function useEmailTrackingEvents(emailId: string) {
  const [events, setEvents] = useState<EmailTrackingEvent[]>([]);

  useEffect(() => {
    // Subscribe to new events for this email
    const channel = supabase
      .channel(`email-events-${emailId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'EmailEvent',
          filter: `emailId=eq.${emailId}`,
        },
        (payload) => {
          setEvents((prev) => [payload.new as EmailTrackingEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [emailId]);

  return events;
}
```

**Notification types for email tracking:**

| Event | Notification | Delivery |
|-------|-------------|----------|
| Email opened | Toast: "John Doe opened your email: Re: Q4 Proposal" | Real-time push |
| Link clicked | Toast: "John Doe clicked a link in your email" | Real-time push |
| Email bounced | Alert: "Email to john@example.com bounced" | Real-time push + in-app alert |
| Email replied | Toast: "John Doe replied to your email" | Real-time push |

### 8.3 Notification UI Pattern

```
+--------------------------------------------------+
|  [Mail icon] John Doe opened your email           |
|  "Re: Q4 Sales Proposal"                          |
|  2 minutes ago                              [View] |
+--------------------------------------------------+
```

Use the toast notification pattern from the F-CORE design system:
- Position: Top-right
- Duration: 5 seconds auto-dismiss
- Actions: "View" links to the email detail page
- Stacking: Latest on top, max 3 visible

---

## 9. Performance Considerations

### 9.1 Email List Pagination

**Strategy: Cursor-based pagination for large email lists.**

```typescript
// Cursor-based pagination using sentAt + id
const emails = await prisma.email.findMany({
  where: {
    tenantId,
    deletedAt: null,
    ...(cursor && {
      OR: [
        { sentAt: { lt: cursor.sentAt } },
        {
          sentAt: cursor.sentAt,
          id: { lt: cursor.id },
        },
      ],
    }),
  },
  orderBy: [
    { sentAt: 'desc' },
    { id: 'desc' },
  ],
  take: pageSize + 1, // Fetch one extra to determine hasNextPage
});
```

**Why cursor-based over offset-based:**
- Offset pagination (`OFFSET 10000`) becomes slow on large tables
- Cursor pagination is O(1) regardless of page number
- Uses the existing `(tenantId, contactId, sentAt DESC)` composite index

### 9.2 Thread Loading Strategy

**Approach: Lazy loading with initial batch.**

1. **First load:** Fetch latest 5 emails in the thread
2. **"Load more" button:** Fetch next 5 emails
3. **Full thread expansion:** Fetch all remaining emails

```typescript
// Thread loading
const threadEmails = await prisma.email.findMany({
  where: {
    tenantId,
    threadId,
    deletedAt: null,
  },
  orderBy: { sentAt: 'desc' },
  take: 5,  // Initial batch
  include: {
    events: {
      where: { eventType: { in: ['OPENED', 'CLICKED'] } },
      select: { eventType: true, createdAt: true },
      take: 10,
    },
  },
});
```

### 9.3 EmailEvent Table Growth Management

The `EmailEvent` table is the highest-volume table in the email system. A single email can generate hundreds of events (especially with tracking pixels being loaded by multiple devices/proxies).

**Mitigation strategies:**

1. **Deduplication at write time:** Within a 60-second window, deduplicate opens from the same IP + user-agent combination
2. **Denormalized counters:** `openCount`, `clickCount`, `firstOpenedAt` on the `Email` record avoid frequent aggregation queries
3. **Archival policy:** Events older than 12 months can be archived to cold storage
4. **Future: Table partitioning:** Partition `EmailEvent` by `createdAt` (monthly partitions) when table exceeds 10M rows

**Deduplication logic:**

```typescript
async function logEmailEvent(event: {
  trackingId: string;
  eventType: string;
  ip?: string;
  userAgent?: string;
}) {
  // Find the email by trackingId
  const email = await prisma.email.findUnique({
    where: { trackingId: event.trackingId },
  });
  if (!email) return;

  // Deduplication: Check for recent identical event
  if (event.eventType === 'OPENED') {
    const recentOpen = await prisma.emailEvent.findFirst({
      where: {
        emailId: email.id,
        eventType: 'OPENED',
        ipAddress: event.ip,
        createdAt: { gte: new Date(Date.now() - 60_000) }, // 60-second window
      },
    });
    if (recentOpen) return; // Skip duplicate
  }

  // Insert event
  await prisma.emailEvent.create({
    data: {
      emailId: email.id,
      eventType: event.eventType,
      ipAddress: event.ip,
      userAgent: event.userAgent,
    },
  });

  // Update denormalized counters on Email
  if (event.eventType === 'OPENED' || event.eventType === 'OPENED_INFERRED') {
    await prisma.email.update({
      where: { id: email.id },
      data: {
        openCount: { increment: 1 },
        lastOpenedAt: new Date(),
        ...(!email.firstOpenedAt && { firstOpenedAt: new Date() }),
      },
    });
  } else if (event.eventType === 'CLICKED') {
    await prisma.email.update({
      where: { id: email.id },
      data: {
        clickCount: { increment: 1 },
        ...(!email.firstClickedAt && { firstClickedAt: new Date() }),
      },
    });
  }
}
```

### 9.4 Image/Attachment Handling

**Strategy: Supabase Storage with signed URLs.**

- Attachments uploaded to Supabase Storage in a tenant-scoped bucket
- Signed URLs generated on-demand (1-hour expiry)
- Maximum attachment size: 25MB per file, 50MB total per email
- Supported MIME types: PDF, images, Office documents, text files

```typescript
// Attachment upload
const bucket = `tenant-${tenantId}-emails`;
const path = `${emailId}/${fileName}`;

const { data, error } = await supabase.storage
  .from(bucket)
  .upload(path, file, {
    contentType: mimeType,
    upsert: false,
  });
```

### 9.5 Search Indexing for Email Content

**MVP approach: PostgreSQL full-text search.**

```sql
-- Add tsvector column and index (via Prisma migration)
ALTER TABLE "Email" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("subject", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("bodyText", '')), 'B')
  ) STORED;

CREATE INDEX idx_email_search ON "Email" USING GIN ("searchVector");
```

**Search query:**

```sql
SELECT * FROM "Email"
WHERE "tenantId" = $1
  AND "deletedAt" IS NULL
  AND "searchVector" @@ plainto_tsquery('english', $2)
ORDER BY ts_rank("searchVector", plainto_tsquery('english', $2)) DESC
LIMIT 20;
```

**Future enhancement:** If search performance degrades at scale, migrate to a dedicated search engine (Meilisearch, Typesense, or Elasticsearch).

---

## 10. Privacy & Compliance

### 10.1 Regulatory Landscape (as of 2026)

| Regulation | Jurisdiction | Email Tracking Impact |
|-----------|-------------|----------------------|
| **GDPR** | EU/EEA | Requires consent for tracking; must provide opt-out; data subject access requests |
| **CCPA/CPRA** | California, USA | Consumer right to know about tracking; right to delete |
| **CAN-SPAM** | USA | Must include unsubscribe link; accurate header info |
| **CASL** | Canada | Express consent required for commercial emails |
| **Apple MPP** | Apple devices | Pre-loads tracking pixels; renders open tracking unreliable for ~50-65% of users |
| **Google Tracking Warnings** | Gmail | Shows warning banners for emails with tracking pixels (since Aug 2024) |

### 10.2 Privacy-Respecting Implementation

1. **Data minimization:** Only collect IP, user-agent, timestamp. Do NOT fingerprint browsers.
2. **Configurable tracking:** Per-email `trackOpens`/`trackClicks` boolean flags
3. **Tenant-level settings:** Allow tenants to disable tracking globally
4. **Data retention:** Auto-delete `EmailEvent` records older than configurable period (default: 24 months)
5. **User-facing transparency:** Show tracking status on emails ("This email has tracking enabled")
6. **GDPR data export:** Include email tracking data in data subject access requests

### 10.3 Open Redirect Prevention

The click tracking endpoint must validate destination URLs to prevent open redirect attacks:

```typescript
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Block redirects to local/internal addresses
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) return false;
    // Block known malicious patterns
    if (parsed.hostname.endsWith('.internal') || parsed.hostname.endsWith('.local')) return false;
    return true;
  } catch {
    return false;
  }
}
```

---

## 11. Implementation Roadmap

### Phase 1: Core Email Logging (Sprint 5, Week 1)

- [ ] Create Prisma migration for Email, EmailEvent, EmailTemplate, EmailAttachment models
- [ ] Implement POST /api/emails (create/log email)
- [ ] Implement GET /api/emails (list with pagination)
- [ ] Implement GET /api/emails/[id] (detail view)
- [ ] Implement PATCH /api/emails/[id] (update draft)
- [ ] Implement DELETE /api/emails/[id] (soft delete)
- [ ] Add Email relation to Activity model for timeline display
- [ ] Input validation with Zod schemas

### Phase 2: Tracking System (Sprint 5, Week 2)

- [ ] Implement tracking pixel endpoint (GET /api/tracking/open/[trackingId])
- [ ] Implement click redirect endpoint (GET /api/tracking/click/[trackingId])
- [ ] Tracking pixel injection into email HTML
- [ ] Link rewriting for click tracking
- [ ] EmailEvent logging with deduplication
- [ ] Denormalized counter updates on Email record
- [ ] Bot/machine open detection logic

### Phase 3: Email Composer UI (Sprint 5, Week 2)

- [ ] Install and configure Tiptap with required extensions
- [ ] Build EmailComposer component with toolbar
- [ ] Implement merge tag extension for template variables
- [ ] Build email template CRUD UI
- [ ] Template variable interpolation engine
- [ ] HTML sanitization with isomorphic-dompurify

### Phase 4: Real-time & Notifications (Sprint 5, Week 3)

- [ ] Set up Supabase Realtime subscription for EmailEvent table
- [ ] Build useEmailTrackingEvents hook
- [ ] Implement toast notification component for tracking events
- [ ] Email detail view with live event timeline
- [ ] Thread view for conversation grouping

### Phase 5: Polish & Performance (Sprint 5, Week 3-4)

- [ ] PostgreSQL full-text search for emails
- [ ] Cursor-based pagination optimization
- [ ] Attachment upload via Supabase Storage
- [ ] Email thread view UI
- [ ] Mobile-responsive email list and detail views
- [ ] Integration tests for tracking endpoints
- [ ] Security audit (open redirect, XSS, tenant isolation)

---

## 12. Decision Log

| # | Decision | Date | Rationale | Alternatives Considered |
|---|----------|------|-----------|------------------------|
| 1 | Dedicated Email model (not extending Activity) | 2026-02-08 | Email has 20+ unique fields; Activity model would become bloated; email-specific indexes needed; HubSpot uses separate engagement types | Extended Activity with JSONB metadata |
| 2 | nanoid for tracking IDs | 2026-02-08 | 40% shorter than UUID; URL-safe without encoding; faster generation; similar collision probability (~2^126 bits) | UUID v4, CUID |
| 3 | Tiptap for rich text editor | 2026-02-08 | ProseMirror foundation is battle-tested; best extension system for custom merge tags; good email HTML output; React 19 compatible; MIT license | Lexical (steep learning curve), Slate.js (too low-level), Quill (SSR issues) |
| 4 | Supabase Realtime for notifications | 2026-02-08 | Already in tech stack; zero infrastructure cost; Postgres Changes feature perfectly matches our use case | SSE (more custom code), Polling (higher latency), Pusher/Ably (additional cost) |
| 5 | Log-only MVP (no SMTP) | 2026-02-08 | Reduces scope by ~60%; matches HubSpot's "Log Email" feature which is used by most sales reps; SMTP can be added in Phase 2 | Full SMTP sending with Resend/SendGrid |
| 6 | Cursor-based pagination | 2026-02-08 | O(1) performance regardless of page number; email tables can grow to millions of rows; offset pagination degrades at scale | Offset-based pagination |
| 7 | PostgreSQL full-text search (not external search engine) | 2026-02-08 | Simpler architecture; no additional infrastructure; good enough for initial scale; built-in tsvector + GIN index support | Meilisearch, Typesense, Elasticsearch |
| 8 | Denormalized counters on Email record | 2026-02-08 | Avoids COUNT(*) queries on EmailEvent for every email list render; updated atomically on event insert | Computed views, materialized views |
| 9 | 60-second deduplication window for opens | 2026-02-08 | Balances accuracy (catches rapid proxy re-requests) vs legitimate multiple opens (user switching devices) | No dedup (inflated counts), longer windows (may miss legitimate re-opens) |
| 10 | RFC 2822 threading with threadId | 2026-02-08 | Industry standard; compatible with external email clients; enables conversation view; threadId provides fast grouping without parsing References header | Custom threading logic, no threading |

---

## References

- [HubSpot: Sales Email Open and Click Tracking](https://knowledge.hubspot.com/connected-email/understand-hubspot-sales-email-open-and-click-tracking)
- [Apple Mail Privacy Protection Impact (Twilio)](https://www.twilio.com/en-us/blog/insights/apple-mail-privacy-protection)
- [Email Tracking and Privacy Regulations 2025](https://postboxservices.com/blogs/post/preparing-for-changes-in-email-tracking-and-privacy-regulations-in-2025)
- [Tiptap Rich Text Editor Documentation](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Supabase Realtime Getting Started](https://supabase.com/docs/guides/realtime/getting_started)
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [Rich Text Editor Comparison 2025 (Liveblocks)](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025)
- [nanoid vs UUID Comparison](https://www.wisp.blog/blog/uuid-vs-cuid-vs-nanoid-choosing-the-right-id-generator-for-your-application)
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Building Real-time Notifications with Supabase and Next.js](https://makerkit.dev/blog/tutorials/real-time-notifications-supabase-nextjs)

---

*This document should be reviewed and updated as implementation proceeds. All code samples are illustrative and should be adapted to the actual F-CORE codebase conventions.*
