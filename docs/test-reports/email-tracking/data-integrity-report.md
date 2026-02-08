# Email Tracking - Data Integrity Test Report

**Project:** F-CORE (HubSpot Clone)
**Feature:** Email Tracking
**Database:** PostgreSQL (`postgresql://localhost:5432/hubspot_clone`)
**Test Date:** 2026-02-08
**Tester:** Automated (Claude Opus 4)
**Overall Result:** FAIL (2 critical issues found)

---

## Summary

| Category | Tests | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
| 1. Schema Verification | 5 | 5 | 0 | PASS |
| 2. Seed Data Verification | 7 | 7 | 0 | PASS |
| 3. Tenant Isolation | 2 | 2 | 0 | PASS |
| 4. Soft Delete Verification | 3 | 3 | 0 | PASS |
| 5. Referential Integrity | 5 | 5 | 0 | PASS |
| 6. Denormalized Counter Accuracy | 2 | 0 | 2 | **FAIL** |
| **Total** | **24** | **22** | **2** | **FAIL** |

---

## 1. Schema Verification

### 1.1 Email Table Exists

**Result:** PASS

All 35 columns present:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | text | NO | - |
| `tenantId` | text | NO | - |
| `trackingId` | text | NO | - |
| `messageId` | text | YES | - |
| `threadId` | text | YES | - |
| `inReplyTo` | text | YES | - |
| `references` | text | YES | - |
| `fromEmail` | text | NO | - |
| `fromName` | text | YES | - |
| `toRecipients` | jsonb | NO | - |
| `ccRecipients` | jsonb | YES | - |
| `bccRecipients` | jsonb | YES | - |
| `subject` | text | YES | - |
| `bodyHtml` | text | YES | - |
| `bodyText` | text | YES | - |
| `bodyOriginal` | text | YES | - |
| `status` | text | NO | `'draft'` |
| `direction` | text | NO | `'outbound'` |
| `sentAt` | timestamp | YES | - |
| `scheduledAt` | timestamp | YES | - |
| `openCount` | integer | NO | `0` |
| `clickCount` | integer | NO | `0` |
| `replyCount` | integer | NO | `0` |
| `firstOpenedAt` | timestamp | YES | - |
| `lastOpenedAt` | timestamp | YES | - |
| `firstClickedAt` | timestamp | YES | - |
| `templateId` | text | YES | - |
| `contactId` | text | YES | - |
| `companyId` | text | YES | - |
| `dealId` | text | YES | - |
| `ownerId` | text | YES | - |
| `metadata` | jsonb | NO | `'{}'` |
| `createdAt` | timestamp | NO | `CURRENT_TIMESTAMP` |
| `updatedAt` | timestamp | NO | - |
| `deletedAt` | timestamp | YES | - |

### 1.2 EmailEvent Table Exists

**Result:** PASS

All 11 columns present:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | text | NO | - |
| `emailId` | text | NO | - |
| `eventType` | text | NO | - |
| `linkUrl` | text | YES | - |
| `linkId` | text | YES | - |
| `ipAddress` | text | YES | - |
| `userAgent` | text | YES | - |
| `country` | text | YES | - |
| `city` | text | YES | - |
| `metadata` | jsonb | NO | `'{}'` |
| `createdAt` | timestamp | NO | `CURRENT_TIMESTAMP` |

### 1.3 EmailTemplate Table Exists

**Result:** PASS

All 15 columns present:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | text | NO | - |
| `tenantId` | text | NO | - |
| `name` | text | NO | - |
| `subject` | text | YES | - |
| `bodyHtml` | text | YES | - |
| `bodyText` | text | YES | - |
| `category` | text | YES | - |
| `isShared` | boolean | NO | `false` |
| `isActive` | boolean | NO | `true` |
| `useCount` | integer | NO | `0` |
| `lastUsedAt` | timestamp | YES | - |
| `createdById` | text | YES | - |
| `createdAt` | timestamp | NO | `CURRENT_TIMESTAMP` |
| `updatedAt` | timestamp | NO | - |
| `deletedAt` | timestamp | YES | - |

### 1.4 EmailAttachment Table Exists

**Result:** PASS

All 7 columns present:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | text | NO | - |
| `emailId` | text | NO | - |
| `fileName` | text | NO | - |
| `fileSize` | integer | NO | - |
| `mimeType` | text | NO | - |
| `storageUrl` | text | NO | - |
| `createdAt` | timestamp | NO | `CURRENT_TIMESTAMP` |

### 1.5 All Indexes Created

**Result:** PASS

**Email table (14 indexes):**
| Index Name | Type | Columns |
|-----------|------|---------|
| `Email_pkey` | UNIQUE | `id` |
| `Email_trackingId_key` | UNIQUE | `trackingId` |
| `Email_messageId_key` | UNIQUE | `messageId` |
| `Email_tenantId_idx` | INDEX | `tenantId` |
| `Email_contactId_idx` | INDEX | `contactId` |
| `Email_companyId_idx` | INDEX | `companyId` |
| `Email_dealId_idx` | INDEX | `dealId` |
| `Email_ownerId_idx` | INDEX | `ownerId` |
| `Email_trackingId_idx` | INDEX | `trackingId` |
| `Email_threadId_idx` | INDEX | `threadId` |
| `Email_status_idx` | INDEX | `status` |
| `Email_sentAt_idx` | INDEX | `sentAt DESC` |
| `Email_deletedAt_idx` | INDEX | `deletedAt` |
| `Email_tenantId_contactId_sentAt_idx` | INDEX | `tenantId, contactId, sentAt DESC` |

**EmailEvent table (6 indexes):**
| Index Name | Type | Columns |
|-----------|------|---------|
| `EmailEvent_pkey` | UNIQUE | `id` |
| `EmailEvent_emailId_idx` | INDEX | `emailId` |
| `EmailEvent_eventType_idx` | INDEX | `eventType` |
| `EmailEvent_createdAt_idx` | INDEX | `createdAt DESC` |
| `EmailEvent_emailId_eventType_idx` | INDEX | `emailId, eventType` |
| `EmailEvent_emailId_createdAt_idx` | INDEX | `emailId, createdAt DESC` |

**EmailTemplate table (6 indexes):**
| Index Name | Type | Columns |
|-----------|------|---------|
| `EmailTemplate_pkey` | UNIQUE | `id` |
| `EmailTemplate_tenantId_idx` | INDEX | `tenantId` |
| `EmailTemplate_createdById_idx` | INDEX | `createdById` |
| `EmailTemplate_deletedAt_idx` | INDEX | `deletedAt` |
| `EmailTemplate_tenantId_category_idx` | INDEX | `tenantId, category` |
| `EmailTemplate_tenantId_isShared_idx` | INDEX | `tenantId, isShared` |

**EmailAttachment table (2 indexes):**
| Index Name | Type | Columns |
|-----------|------|---------|
| `EmailAttachment_pkey` | UNIQUE | `id` |
| `EmailAttachment_emailId_idx` | INDEX | `emailId` |

---

## 2. Seed Data Verification

### 2.1 Email Count (Expected: 5)

**Result:** PASS -- 5 emails found

| # | Subject | Status | Direction |
|---|---------|--------|-----------|
| 1 | Following up on our conversation | sent | outbound |
| 2 | TechCorp Enterprise Proposal | sent | outbound |
| 3 | StartupIO - Getting Started Guide | sent | outbound |
| 4 | Q4 Partnership Review | sent | outbound |
| 5 | Creative Campaign Brief - Draft | draft | outbound |

### 2.2 Sent Emails Have SENT Events

**Result:** PASS -- All 4 sent emails have corresponding SENT events

| Email Subject | Status | SENT Event |
|---------------|--------|------------|
| Following up on our conversation | sent | HAS_SENT_EVENT |
| TechCorp Enterprise Proposal | sent | HAS_SENT_EVENT |
| StartupIO - Getting Started Guide | sent | HAS_SENT_EVENT |
| Q4 Partnership Review | sent | HAS_SENT_EVENT |

Note: The draft email ("Creative Campaign Brief - Draft") correctly does NOT have a SENT event.

### 2.3 Emails with openCount > 0 Have OPENED Events

**Result:** PASS -- All 3 emails with openCount > 0 have at least one OPENED event

| Email Subject | openCount | OPENED Event |
|---------------|-----------|--------------|
| Following up on our conversation | 3 | HAS_OPENED_EVENT |
| TechCorp Enterprise Proposal | 7 | HAS_OPENED_EVENT |
| StartupIO - Getting Started Guide | 1 | HAS_OPENED_EVENT |

### 2.4 Emails with clickCount > 0 Have CLICKED Events

**Result:** PASS -- All 2 emails with clickCount > 0 have at least one CLICKED event

| Email Subject | clickCount | CLICKED Event |
|---------------|------------|---------------|
| Following up on our conversation | 1 | HAS_CLICKED_EVENT |
| TechCorp Enterprise Proposal | 3 | HAS_CLICKED_EVENT |

### 2.5 Email Templates Count (Expected: 3)

**Result:** PASS -- 3 templates found

| # | Name | Category | Shared | Active |
|---|------|----------|--------|--------|
| 1 | Follow-up After Meeting | follow-up | true | true |
| 2 | Initial Outreach | sales | true | true |
| 3 | Proposal Follow-up | sales | true | true |

### 2.6 trackingId Uniqueness

**Result:** PASS -- 0 duplicate trackingId values found

All 5 trackingId values are unique:
- `trk_demo_001`
- `trk_demo_002`
- `trk_demo_003`
- `trk_demo_004`
- `trk_demo_005`

### 2.7 messageId Uniqueness

**Result:** PASS -- 0 duplicate messageId values found

All 5 messageId values are unique:
- `<trk_demo_001@fcore.app>`
- `<trk_demo_002@fcore.app>`
- `<trk_demo_003@fcore.app>`
- `<trk_demo_004@fcore.app>`
- `<trk_demo_005@fcore.app>`

---

## 3. Tenant Isolation

### 3.1 All Emails Have Correct tenantId

**Result:** PASS

All 5 emails belong to tenant `84d5dd22-9e29-425c-8ba0-1edfc255e236` ("F-CORE Demo").
Only 1 distinct tenantId exists in the Email table.

### 3.2 No Orphan Emails (Without Valid Tenant)

**Result:** PASS

- 0 emails with invalid tenantId
- 0 email templates with invalid tenantId

All tenantId values reference a valid Tenant record.

---

## 4. Soft Delete Verification

### 4.1 Email Table Has deletedAt Column

**Result:** PASS

Column `deletedAt` exists with type `timestamp without time zone`, nullable `YES`.
An index `Email_deletedAt_idx` exists for efficient soft delete filtering.

### 4.2 EmailTemplate Table Has deletedAt Column

**Result:** PASS

Column `deletedAt` exists with type `timestamp without time zone`, nullable `YES`.
An index `EmailTemplate_deletedAt_idx` exists for efficient soft delete filtering.

### 4.3 No Seed Records Have deletedAt Set

**Result:** PASS

- 0 emails with non-null `deletedAt`
- 0 email templates with non-null `deletedAt`

All seed data is active (not soft-deleted).

---

## 5. Referential Integrity

### 5.1 Email.contactId References Valid Contacts

**Result:** PASS -- 0 orphan references found

All non-null `contactId` values reference valid Contact records.

### 5.2 Email.companyId References Valid Companies

**Result:** PASS -- 0 orphan references found

All non-null `companyId` values reference valid Company records.

### 5.3 Email.ownerId References Valid Users

**Result:** PASS -- 0 orphan references found

All non-null `ownerId` values reference valid User records.

### 5.4 EmailEvent.emailId References Valid Emails

**Result:** PASS -- 0 orphan references found

All 9 EmailEvent records reference valid Email records.

### 5.5 EmailTemplate.createdById References Valid Users

**Result:** PASS -- 0 orphan references found

All 3 EmailTemplate `createdById` values reference valid User records.

**Foreign Key Constraints Verified (10 constraints):**

| Constraint | Source Table | Column | Target Table | Target Column |
|-----------|-------------|--------|-------------|---------------|
| `Email_tenantId_fkey` | Email | tenantId | Tenant | id |
| `Email_contactId_fkey` | Email | contactId | Contact | id |
| `Email_companyId_fkey` | Email | companyId | Company | id |
| `Email_dealId_fkey` | Email | dealId | Deal | id |
| `Email_ownerId_fkey` | Email | ownerId | User | id |
| `Email_templateId_fkey` | Email | templateId | EmailTemplate | id |
| `EmailEvent_emailId_fkey` | EmailEvent | emailId | Email | id |
| `EmailAttachment_emailId_fkey` | EmailAttachment | emailId | Email | id |
| `EmailTemplate_tenantId_fkey` | EmailTemplate | tenantId | Tenant | id |
| `EmailTemplate_createdById_fkey` | EmailTemplate | createdById | User | id |

---

## 6. Denormalized Counter Accuracy

### 6.1 openCount vs Actual OPENED Events

**Result:** FAIL -- 2 mismatches found

| Email Subject | Stored openCount | Actual OPENED Events | Status |
|---------------|-----------------|---------------------|--------|
| Following up on our conversation | **3** | **1** | **MISMATCH** |
| TechCorp Enterprise Proposal | **7** | **1** | **MISMATCH** |
| StartupIO - Getting Started Guide | 1 | 1 | MATCH |
| Q4 Partnership Review | 0 | 0 | MATCH |
| Creative Campaign Brief - Draft | 0 | 0 | MATCH |

**Analysis:** The seed data sets `openCount` to values higher than the number of OPENED events actually inserted into the EmailEvent table. For "Following up on our conversation", `openCount = 3` but only 1 OPENED event exists. For "TechCorp Enterprise Proposal", `openCount = 7` but only 1 OPENED event exists.

### 6.2 clickCount vs Actual CLICKED Events

**Result:** FAIL -- 1 mismatch found

| Email Subject | Stored clickCount | Actual CLICKED Events | Status |
|---------------|------------------|----------------------|--------|
| Following up on our conversation | 1 | 1 | MATCH |
| TechCorp Enterprise Proposal | **3** | **1** | **MISMATCH** |
| StartupIO - Getting Started Guide | 0 | 0 | MATCH |
| Q4 Partnership Review | 0 | 0 | MATCH |
| Creative Campaign Brief - Draft | 0 | 0 | MATCH |

**Analysis:** For "TechCorp Enterprise Proposal", `clickCount = 3` but only 1 CLICKED event exists.

---

## Issues & Recommendations

### CRITICAL: Denormalized Counter Mismatch (Priority: HIGH)

**Issue:** The seed data inserts denormalized counter values (`openCount`, `clickCount`) on the Email records that do not match the number of corresponding events in the EmailEvent table.

**Impact:**
- Dashboard analytics will show inflated engagement metrics
- API responses will return inconsistent data (counter says 7 opens but event log shows 1)
- This could mask bugs in the production event-tracking pipeline if developers assume seed data is correct

**Root Cause:** The seed script likely sets `openCount`/`clickCount` to demonstrate varying engagement levels for the UI, but does not insert the matching number of OPENED/CLICKED events.

**Recommended Fix (Option A - Add Missing Events):**
Insert additional OPENED and CLICKED event rows into EmailEvent to match the counters:
- Email "Following up on our conversation": Add 2 more OPENED events (currently has 1, needs 3)
- Email "TechCorp Enterprise Proposal": Add 6 more OPENED events (currently has 1, needs 7) and 2 more CLICKED events (currently has 1, needs 3)

**Recommended Fix (Option B - Adjust Counters):**
Update the seed `openCount`/`clickCount` values to match the actual event records:
- "Following up on our conversation": Set `openCount = 1`
- "TechCorp Enterprise Proposal": Set `openCount = 1`, `clickCount = 1`

**Recommended Fix (Option C - Add Counter Reconciliation):**
Implement a database trigger or periodic job that recalculates counters from events:
```sql
UPDATE "Email" e SET
  "openCount" = (SELECT COUNT(*) FROM "EmailEvent" ee WHERE ee."emailId" = e.id AND ee."eventType" = 'OPENED'),
  "clickCount" = (SELECT COUNT(*) FROM "EmailEvent" ee WHERE ee."emailId" = e.id AND ee."eventType" = 'CLICKED');
```

---

## Data Summary

| Entity | Count |
|--------|-------|
| Emails | 5 |
| Email Events | 9 |
| Email Templates | 3 |
| Email Attachments | 0 |
| Tenant | 1 (`84d5dd22-9e29-425c-8ba0-1edfc255e236` - "F-CORE Demo") |
| Foreign Key Constraints | 10 |
| Indexes | 28 |

---

## Conclusion

The Email Tracking feature's database schema is well-designed with comprehensive indexing, proper foreign key constraints, soft delete support, and tenant isolation. Schema verification, referential integrity, tenant isolation, and soft delete checks all pass cleanly.

The only failing area is **denormalized counter accuracy**: the `openCount` and `clickCount` values stored on Email records do not match the actual count of corresponding events in the EmailEvent table. This is a **seed data consistency issue** that should be resolved before the feature goes to production to ensure developers and QA can trust the data for validation.

**Overall Verdict: FAIL** (22/24 tests passed, 2 counter accuracy tests failed)
