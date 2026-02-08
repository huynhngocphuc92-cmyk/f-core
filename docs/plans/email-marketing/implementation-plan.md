# Email Marketing - Implementation Plan

## Database Schema

### New Tables (add to prisma/schema.prisma)

```prisma
// Enhanced email template with block editor support
model EmailMarketingTemplate {
  id            String    @id @default(uuid())
  tenantId      String

  name          String
  subject       String?
  previewText   String?

  // Content: JSON for editor blocks, HTML for compiled output
  jsonContent   Json?     // Block structure for editor
  htmlContent   String?   @db.Text

  // Organization
  category      String?   // newsletter, promotional, transactional, welcome
  thumbnailUrl  String?
  isSystem      Boolean   @default(false) // Pre-built templates
  isActive      Boolean   @default(true)

  // Usage
  useCount      Int       @default(0)
  lastUsedAt    DateTime?

  // Audit
  createdBy     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  campaigns     EmailCampaign[]

  @@index([tenantId])
  @@index([category])
  @@index([deletedAt])
}

model EmailCampaign {
  id            String    @id @default(uuid())
  tenantId      String

  name          String
  description   String?

  // Content
  templateId    String?
  subject       String
  previewText   String?
  fromName      String
  fromEmail     String
  replyTo       String?

  // Audience
  listId        String?

  // Status: draft, scheduled, sending, sent, cancelled
  status        String    @default("draft")

  // Scheduling
  scheduledAt   DateTime?
  sentAt        DateTime?
  completedAt   DateTime?
  cancelledAt   DateTime?

  // Denormalized Stats
  totalRecipients   Int   @default(0)
  totalSent         Int   @default(0)
  totalDelivered    Int   @default(0)
  totalOpened       Int   @default(0)
  totalClicked      Int   @default(0)
  totalBounced      Int   @default(0)
  totalUnsubscribed Int   @default(0)

  // A/B Testing (future)
  isAbTest      Boolean   @default(false)
  abTestConfig  Json?

  // Metadata
  metadata      Json      @default("{}")

  // Audit
  createdBy     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  template      EmailMarketingTemplate? @relation(fields: [templateId], references: [id])
  list          ContactList?   @relation(fields: [listId], references: [id])
  sends         EmailCampaignSend[]

  @@index([tenantId])
  @@index([status])
  @@index([scheduledAt])
  @@index([deletedAt])
}

model ContactList {
  id            String    @id @default(uuid())
  tenantId      String

  name          String
  description   String?
  type          String    @default("static") // static, dynamic
  filterConfig  Json?     // For dynamic lists

  // Stats
  memberCount   Int       @default(0)

  // Audit
  createdBy     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  members       ContactListMember[]
  campaigns     EmailCampaign[]

  @@index([tenantId])
  @@index([deletedAt])
}

model ContactListMember {
  listId        String
  contactId     String
  addedAt       DateTime  @default(now())

  list          ContactList @relation(fields: [listId], references: [id], onDelete: Cascade)
  contact       Contact     @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@id([listId, contactId])
}

model EmailCampaignSend {
  id            String    @id @default(uuid())
  tenantId      String

  campaignId    String
  contactId     String
  toEmail       String
  toName        String?

  // Status: queued, sent, delivered, opened, clicked, bounced, failed
  status        String    @default("queued")

  // ESP Tracking
  espMessageId  String?

  // Timestamps
  queuedAt      DateTime  @default(now())
  sentAt        DateTime?
  deliveredAt   DateTime?
  firstOpenedAt DateTime?
  firstClickedAt DateTime?
  bouncedAt     DateTime?
  failedAt      DateTime?

  // Error
  failureReason String?
  bounceType    String?   // hard, soft

  metadata      Json      @default("{}")

  // Relations
  campaign      EmailCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  contact       Contact       @relation(fields: [contactId], references: [id])
  events        EmailCampaignEvent[]

  @@unique([campaignId, contactId])
  @@index([tenantId])
  @@index([campaignId])
  @@index([contactId])
  @@index([status])
}

model EmailCampaignEvent {
  id            String    @id @default(uuid())

  sendId        String
  campaignId    String    // Denormalized
  contactId     String    // Denormalized

  eventType     String    // sent, delivered, opened, clicked, bounced, unsubscribed, complained
  linkUrl       String?   @db.Text  // For click events
  ipAddress     String?
  userAgent     String?   @db.Text
  metadata      Json      @default("{}")

  createdAt     DateTime  @default(now())

  // Relations
  send          EmailCampaignSend @relation(fields: [sendId], references: [id], onDelete: Cascade)

  @@index([sendId])
  @@index([campaignId])
  @@index([eventType])
  @@index([createdAt(sort: Desc)])
}
```

### Tenant Relations to Add
Add to existing Tenant model:
```prisma
emailTemplates    EmailMarketingTemplate[]
emailCampaigns    EmailCampaign[]
contactLists      ContactList[]
```

Add to existing Contact model:
```prisma
listMemberships   ContactListMember[]
campaignSends     EmailCampaignSend[]
```

## API Routes

```
src/app/api/email-marketing/
├── templates/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE
├── campaigns/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PUT, PATCH (status), DELETE
│       └── send/
│           └── route.ts      # POST (trigger send)
├── lists/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE
│       └── members/
│           └── route.ts      # GET, POST, DELETE members
└── analytics/
    └── route.ts              # GET campaign analytics
```

## Frontend Pages

```
src/app/(dashboard)/email-marketing/
├── page.tsx                           # Campaign list
├── campaigns/
│   ├── new/
│   │   └── page.tsx                   # Campaign creation wizard
│   └── [id]/
│       └── page.tsx                   # Campaign detail/analytics
├── templates/
│   ├── page.tsx                       # Template gallery
│   └── [id]/
│       └── edit/
│           └── page.tsx               # Template editor
└── lists/
    └── page.tsx                       # Contact list management
```

## Components

```
src/components/email-marketing/
├── CampaignStatusBadge.tsx            # Status badge (draft/scheduled/sent)
├── CampaignStatsCards.tsx             # Analytics cards
├── TemplateCard.tsx                    # Template preview card
├── TemplateEditor.tsx                  # TipTap-based editor
└── CampaignWizard.tsx                 # Multi-step creation wizard
```

## Seed Data

3 templates:
1. "Welcome Email" (welcome category, system template)
2. "Monthly Newsletter" (newsletter category, system template)
3. "Product Update" (promotional category, system template)

2 contact lists:
1. "All Contacts" (all 5 seed contacts)
2. "Leads & MQLs" (filtered by lifecycle stage)

2 campaigns:
1. "Welcome Series - Feb 2026" (sent, using Welcome template)
2. "February Newsletter" (draft, using Newsletter template)

## Execution Order

1. **Database**: Add schema, push to DB, seed data
2. **Backend**: API routes (templates → campaigns → lists → analytics)
3. **Frontend**: Pages (campaign list → template gallery → campaign wizard → analytics → template editor → lists)
4. **Integration**: Sidebar link, build verification
