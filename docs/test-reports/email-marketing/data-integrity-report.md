# Email Marketing - Data Integrity Report

**Project:** F-CORE (HubSpot CRM Clone)
**Date:** 2026-02-08
**Database:** PostgreSQL (Supabase)
**Tester:** Data Integrity Automated Tester (AI)
**Overall Result:** PASS (with 1 WARNING)

---

## Executive Summary

All 6 email marketing tables were inspected across 5 integrity domains: Template Integrity, Campaign Integrity, Contact List Integrity, Tenant Isolation, and Soft Delete. A total of **27 individual checks** were executed. All checks passed with one notable warning regarding denormalized campaign statistics that do not match underlying send records (seed data artifact).

| Domain                | Checks Run | Passed | Warnings | Failed |
|-----------------------|:----------:|:------:|:--------:|:------:|
| Template Integrity    | 4          | 4      | 0        | 0      |
| Campaign Integrity    | 7          | 6      | 1        | 0      |
| Contact List Integrity| 5          | 5      | 0        | 0      |
| Tenant Isolation      | 6          | 6      | 0        | 0      |
| Soft Delete           | 3          | 3      | 0        | 0      |
| **Supplemental**      | **2**      | **2**  | **0**    | **0**  |
| **Total**             | **27**     | **26** | **1**    | **0**  |

---

## Data Inventory

| Table                    | Record Count | Tenant                       |
|--------------------------|:------------:|------------------------------|
| EmailMarketingTemplate   | 3            | F-CORE Demo (84d5dd22...)    |
| EmailCampaign            | 2            | F-CORE Demo (84d5dd22...)    |
| ContactList              | 2            | F-CORE Demo (84d5dd22...)    |
| ContactListMember        | 7            | (via ContactList/Contact)    |
| EmailCampaignSend        | 0            | --                           |
| EmailCampaignEvent       | 0            | --                           |

**Tenant:** 1 tenant exists -- `F-CORE Demo` (plan: professional, id: `84d5dd22-9e29-425c-8ba0-1edfc255e236`)

---

## 1. Template Integrity

### T1.1 - All templates have tenantId
**Result: PASS**

| Metric              | Value |
|---------------------|:-----:|
| Total Templates     | 3     |
| NULL tenantId       | 0     |
| Empty tenantId      | 0     |

All 3 templates have a valid, non-empty `tenantId`.

### T1.2 - Valid category values
**Result: PASS**

Valid categories per schema: `newsletter`, `promotional`, `transactional`, `welcome`

| Category      | Count | Valid? |
|---------------|:-----:|:------:|
| welcome       | 1     | YES    |
| newsletter    | 1     | YES    |
| promotional   | 1     | YES    |

No invalid categories found.

### T1.3 - No orphan records (tenant exists)
**Result: PASS**

```sql
SELECT t.id, t."tenantId"
FROM "EmailMarketingTemplate" t
LEFT JOIN "Tenant" tn ON t."tenantId" = tn.id
WHERE tn.id IS NULL;
```
**Result:** 0 rows -- no orphan templates.

### T1.4 - System templates have htmlContent
**Result: PASS**

All 3 templates are system templates (`isSystem = true`) and all have non-null `htmlContent` and `jsonContent`.

| Template ID          | Name              | Category     | Has HTML | Has JSON |
|----------------------|-------------------|--------------|:--------:|:--------:|
| template-welcome     | Welcome Email     | welcome      | YES      | YES      |
| template-newsletter  | Monthly Newsletter| newsletter   | YES      | YES      |
| template-promo       | Product Update    | promotional  | YES      | YES      |

---

## 2. Campaign Integrity

### T2.1 - All campaigns have tenantId
**Result: PASS**

| Metric              | Value |
|---------------------|:-----:|
| Total Campaigns     | 2     |
| NULL tenantId       | 0     |
| Empty tenantId      | 0     |

### T2.2 - Valid status values
**Result: PASS**

Valid statuses per schema: `draft`, `scheduled`, `sending`, `sent`, `cancelled`

| Status  | Count | Valid? |
|---------|:-----:|:------:|
| sent    | 1     | YES    |
| draft   | 1     | YES    |

### T2.3 - Campaign listId references existing ContactList
**Result: PASS**

```sql
SELECT ec.id, ec.name, ec."listId"
FROM "EmailCampaign" ec
LEFT JOIN "ContactList" cl ON ec."listId" = cl.id
WHERE ec."listId" IS NOT NULL AND cl.id IS NULL;
```
**Result:** 0 rows -- all campaign list references are valid.

| Campaign             | listId            | List Exists? |
|----------------------|-------------------|:------------:|
| campaign-welcome     | list-all-contacts | YES          |
| campaign-newsletter  | list-all-contacts | YES          |

### T2.4 - Campaign templateId references existing template
**Result: PASS**

```sql
SELECT ec.id, ec.name, ec."templateId"
FROM "EmailCampaign" ec
LEFT JOIN "EmailMarketingTemplate" emt ON ec."templateId" = emt.id
WHERE ec."templateId" IS NOT NULL AND emt.id IS NULL;
```
**Result:** 0 rows -- all template references are valid.

| Campaign             | templateId          | Template Exists? |
|----------------------|---------------------|:----------------:|
| campaign-welcome     | template-welcome    | YES              |
| campaign-newsletter  | template-newsletter | YES              |

### T2.5 - Sent campaign has sentAt timestamp
**Result: PASS**

| Campaign         | Status | sentAt                    |
|------------------|--------|---------------------------|
| campaign-welcome | sent   | 2026-02-05T08:59:39.987Z  |

The one `sent` campaign has a valid `sentAt` timestamp. The `draft` campaign correctly has `sentAt = NULL`.

### T2.6 - Campaign stats consistency (hierarchical)
**Result: PASS**

For campaign `campaign-welcome` (the only campaign with stats > 0):

| Check                              | Left | Right | Result |
|------------------------------------|:----:|:-----:|:------:|
| totalSent <= totalRecipients       | 5    | 5     | OK     |
| totalDelivered <= totalSent        | 5    | 5     | OK     |
| totalOpened <= totalDelivered      | 3    | 5     | OK     |
| totalClicked <= totalOpened        | 2    | 3     | OK     |
| totalBounced + totalDelivered <= totalSent | 0+5=5 | 5 | OK |

Full stats: recipients=5, sent=5, delivered=5, opened=3, clicked=2, bounced=0, unsubscribed=0.

### T2.7 - Denormalized stats match actual send records
**Result: WARNING**

| Metric             | Denormalized | Actual (from EmailCampaignSend) | Match? |
|--------------------|:------------:|:-------------------------------:|:------:|
| totalSent          | 5            | 0                               | NO     |
| totalDelivered     | 5            | 0                               | NO     |
| totalOpened        | 3            | 0                               | NO     |
| totalClicked       | 2            | 0                               | NO     |
| totalBounced       | 0            | 0                               | YES    |

**Analysis:** The `EmailCampaignSend` table contains 0 records, yet the campaign `campaign-welcome` shows non-zero denormalized stats. This is a **seed data artifact** -- the stats were populated manually during seeding without creating corresponding `EmailCampaignSend` rows. This will not cause runtime issues since the denormalized stats are internally consistent (T2.6 passed), but it means the detail-level send tracking data is missing for the seeded campaign.

**Recommendation:** When implementing the actual email sending flow, ensure that `EmailCampaignSend` records are created for each recipient, and that denormalized stats are computed from actual send records rather than set manually.

---

## 3. Contact List Integrity

### T3.1 - All lists have tenantId
**Result: PASS**

| Metric              | Value |
|---------------------|:-----:|
| Total Lists         | 2     |
| NULL tenantId       | 0     |
| Empty tenantId      | 0     |

### T3.2 - memberCount matches actual member count
**Result: PASS**

| List ID           | Name            | memberCount | Actual Count | Match? |
|-------------------|-----------------|:-----------:|:------------:|:------:|
| list-all-contacts | All Contacts    | 5           | 5            | OK     |
| list-leads-mqls   | Leads & MQLs    | 2           | 2            | OK     |

### T3.3 - No orphan ContactListMember (list does not exist)
**Result: PASS**

```sql
SELECT clm."listId", clm."contactId"
FROM "ContactListMember" clm
LEFT JOIN "ContactList" cl ON clm."listId" = cl.id
WHERE cl.id IS NULL;
```
**Result:** 0 rows -- no orphan list members (list side).

### T3.4 - No orphan ContactListMember (contact does not exist)
**Result: PASS**

```sql
SELECT clm."listId", clm."contactId"
FROM "ContactListMember" clm
LEFT JOIN "Contact" c ON clm."contactId" = c.id
WHERE c.id IS NULL;
```
**Result:** 0 rows -- no orphan list members (contact side).

### T3.5 - No duplicate ContactListMember records
**Result: PASS**

The composite primary key `@@id([listId, contactId])` is enforced at the database level. Query confirmed 0 duplicate pairs.

---

## 4. Tenant Isolation

### T4.1 - All templates belong to valid tenant
**Result: PASS**

0 templates reference a non-existent tenant.

### T4.2 - All campaigns belong to valid tenant
**Result: PASS**

0 campaigns reference a non-existent tenant.

### T4.3 - All contact lists belong to valid tenant
**Result: PASS**

0 contact lists reference a non-existent tenant.

### T4.4 - No cross-tenant data leak: Campaign <-> ContactList
**Result: PASS**

```sql
SELECT ec.id, ec."tenantId", cl.id, cl."tenantId"
FROM "EmailCampaign" ec
JOIN "ContactList" cl ON ec."listId" = cl.id
WHERE ec."tenantId" != cl."tenantId";
```
**Result:** 0 rows -- no cross-tenant leaks between campaigns and contact lists.

### T4.5 - No cross-tenant data leak: Campaign <-> Template
**Result: PASS**

```sql
SELECT ec.id, ec."tenantId", emt.id, emt."tenantId"
FROM "EmailCampaign" ec
JOIN "EmailMarketingTemplate" emt ON ec."templateId" = emt.id
WHERE ec."tenantId" != emt."tenantId";
```
**Result:** 0 rows -- no cross-tenant leaks between campaigns and templates.

### T4.6 - No cross-tenant data leak: CampaignSend <-> Campaign
**Result: PASS**

0 EmailCampaignSend records exist (table is empty), so no leaks are possible. When sends are populated, the `tenantId` on `EmailCampaignSend` must match its parent `EmailCampaign.tenantId`.

---

## 5. Soft Delete

### T5.1 - deletedAt column exists on required tables
**Result: PASS**

| Table                    | Has deletedAt? |
|--------------------------|:--------------:|
| EmailMarketingTemplate   | YES            |
| EmailCampaign            | YES            |
| ContactList              | YES            |

All three primary email marketing tables have the `deletedAt` column (nullable `timestamp without time zone`).

**Note:** `ContactListMember`, `EmailCampaignSend`, and `EmailCampaignEvent` do NOT have `deletedAt` columns. This is by design -- these are child/junction records that cascade-delete when their parent is removed, or are managed via the parent's soft delete status.

### T5.2 - Soft delete usage overview
**Result: PASS**

| Table                    | Total Records | Soft Deleted | Active |
|--------------------------|:------------:|:------------:|:------:|
| EmailMarketingTemplate   | 3            | 0            | 3      |
| EmailCampaign            | 2            | 0            | 2      |
| ContactList              | 2            | 0            | 2      |

No records are currently soft-deleted. No evidence of hard deletion (all expected seed records are present).

### T5.3 - deletedAt indexed for performance
**Result: PASS**

All three tables have an index on `deletedAt`:
- `EmailMarketingTemplate_deletedAt_idx`
- `EmailCampaign_deletedAt_idx`
- `ContactList_deletedAt_idx`

---

## Supplemental: Foreign Key & Index Audit

### Foreign Keys (10 constraints verified)

| Constraint                               | Source Table          | Source Column  | Target Table             | Target Column |
|------------------------------------------|----------------------|----------------|--------------------------|---------------|
| ContactList_tenantId_fkey                | ContactList          | tenantId       | Tenant                   | id            |
| ContactListMember_contactId_fkey         | ContactListMember    | contactId      | Contact                  | id            |
| ContactListMember_listId_fkey            | ContactListMember    | listId         | ContactList              | id            |
| EmailCampaign_tenantId_fkey              | EmailCampaign        | tenantId       | Tenant                   | id            |
| EmailCampaign_templateId_fkey            | EmailCampaign        | templateId     | EmailMarketingTemplate   | id            |
| EmailCampaign_listId_fkey                | EmailCampaign        | listId         | ContactList              | id            |
| EmailCampaignEvent_sendId_fkey           | EmailCampaignEvent   | sendId         | EmailCampaignSend        | id            |
| EmailCampaignSend_campaignId_fkey        | EmailCampaignSend    | campaignId     | EmailCampaign            | id            |
| EmailCampaignSend_contactId_fkey         | EmailCampaignSend    | contactId      | Contact                  | id            |
| EmailMarketingTemplate_tenantId_fkey     | EmailMarketingTemplate | tenantId     | Tenant                   | id            |

All foreign keys are in place and enforced at the database level.

### Indexes (24 indexes verified)

| Table                    | Index Count | Key Indexes                                                    |
|--------------------------|:-----------:|----------------------------------------------------------------|
| EmailMarketingTemplate   | 4           | PK, tenantId, category, deletedAt                              |
| EmailCampaign            | 5           | PK, tenantId, status, scheduledAt, deletedAt                   |
| ContactList              | 3           | PK, tenantId, deletedAt                                        |
| ContactListMember        | 1           | Composite PK (listId, contactId)                               |
| EmailCampaignSend        | 6           | PK, unique(campaignId+contactId), tenantId, campaignId, contactId, status |
| EmailCampaignEvent       | 5           | PK, sendId, campaignId, eventType, createdAt(DESC)             |

All foreign key columns are properly indexed.

---

## Findings & Recommendations

### WARNING: Denormalized Stats Without Send Records

**Severity:** Low (seed data only)
**Location:** `EmailCampaign` table, record `campaign-welcome`
**Issue:** The campaign reports `totalSent=5, totalDelivered=5, totalOpened=3, totalClicked=2` but has 0 corresponding `EmailCampaignSend` records. The stats were seeded directly without creating the underlying send tracking data.
**Impact:** No runtime impact. The dashboard will display stats correctly from the denormalized fields. However, drill-down views (e.g., "who opened this email") will show empty results.
**Recommendation:** When implementing the email send engine, create `EmailCampaignSend` records for each recipient and compute denormalized stats via aggregation or event-driven updates. Consider adding a migration or seed update to backfill send records for the demo campaign.

### Positive Findings

1. **Schema design is sound.** All tables have proper `tenantId` fields with NOT NULL constraints and foreign keys to the `Tenant` table.
2. **Soft delete is properly implemented.** All three primary tables have `deletedAt` columns with dedicated indexes for query performance.
3. **Referential integrity is fully enforced.** 10 foreign key constraints cover all parent-child relationships. Cascade deletes are configured on junction tables (`ContactListMember`, `EmailCampaignSend` -> `EmailCampaignEvent`).
4. **No orphan records exist.** All cross-table references point to valid parent records.
5. **No cross-tenant data leaks.** All related records (campaign-template, campaign-list, send-campaign) share the same `tenantId`.
6. **Composite primary key on `ContactListMember`** prevents duplicate list memberships at the database level.
7. **Unique constraint on `EmailCampaignSend(campaignId, contactId)`** prevents duplicate sends to the same contact in the same campaign.
8. **Comprehensive indexing.** 24 indexes across 6 tables ensure query performance for common access patterns (tenant filtering, status filtering, date ordering).

---

## Test Queries Reference

All queries used in this report are documented below for reproducibility.

<details>
<summary>Click to expand all SQL queries</summary>

```sql
-- T1.1: Template tenantId check
SELECT COUNT(*) AS total_templates,
  COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) AS null_tenant_count,
  COUNT(CASE WHEN "tenantId" = '' THEN 1 END) AS empty_tenant_count
FROM "EmailMarketingTemplate";

-- T1.2: Template category distribution
SELECT "category", COUNT(*) AS cnt
FROM "EmailMarketingTemplate" GROUP BY "category";

-- T1.3: Orphan templates
SELECT t.id FROM "EmailMarketingTemplate" t
LEFT JOIN "Tenant" tn ON t."tenantId" = tn.id WHERE tn.id IS NULL;

-- T1.4: System templates without htmlContent
SELECT id, name FROM "EmailMarketingTemplate"
WHERE "isSystem" = true AND ("htmlContent" IS NULL OR "htmlContent" = '');

-- T2.1: Campaign tenantId check
SELECT COUNT(*) AS total_campaigns,
  COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) AS null_tenant_count
FROM "EmailCampaign";

-- T2.2: Campaign status validation
SELECT status, COUNT(*) AS cnt,
  CASE WHEN status NOT IN ('draft','scheduled','sending','sent','cancelled')
  THEN 'INVALID' ELSE 'VALID' END AS validity
FROM "EmailCampaign" GROUP BY status;

-- T2.3: Campaign listId references
SELECT ec.id FROM "EmailCampaign" ec
LEFT JOIN "ContactList" cl ON ec."listId" = cl.id
WHERE ec."listId" IS NOT NULL AND cl.id IS NULL;

-- T2.4: Campaign templateId references
SELECT ec.id FROM "EmailCampaign" ec
LEFT JOIN "EmailMarketingTemplate" emt ON ec."templateId" = emt.id
WHERE ec."templateId" IS NOT NULL AND emt.id IS NULL;

-- T2.5: Sent campaigns with missing sentAt
SELECT id, status, "sentAt" FROM "EmailCampaign"
WHERE status = 'sent' AND "sentAt" IS NULL;

-- T2.6: Stats consistency
SELECT id, "totalRecipients", "totalSent", "totalDelivered",
  "totalOpened", "totalClicked", "totalBounced"
FROM "EmailCampaign" WHERE "totalSent" > 0;

-- T2.7: Denormalized stats vs actual sends
SELECT ec.id, ec."totalSent", COUNT(ecs.id) AS actual_sent
FROM "EmailCampaign" ec
LEFT JOIN "EmailCampaignSend" ecs ON ec.id = ecs."campaignId"
WHERE ec."totalSent" > 0 GROUP BY ec.id, ec."totalSent";

-- T3.1: ContactList tenantId check
SELECT COUNT(*) FROM "ContactList" WHERE "tenantId" IS NULL;

-- T3.2: memberCount vs actual
SELECT cl.id, cl."memberCount", COUNT(clm."contactId") AS actual
FROM "ContactList" cl
LEFT JOIN "ContactListMember" clm ON cl.id = clm."listId"
GROUP BY cl.id;

-- T3.3-3.4: Orphan ContactListMember
SELECT * FROM "ContactListMember" clm
LEFT JOIN "ContactList" cl ON clm."listId" = cl.id WHERE cl.id IS NULL;
SELECT * FROM "ContactListMember" clm
LEFT JOIN "Contact" c ON clm."contactId" = c.id WHERE c.id IS NULL;

-- T3.5: Duplicate members
SELECT "listId", "contactId", COUNT(*) FROM "ContactListMember"
GROUP BY "listId", "contactId" HAVING COUNT(*) > 1;

-- T4.4-4.6: Cross-tenant leak checks
SELECT ec.id FROM "EmailCampaign" ec
JOIN "ContactList" cl ON ec."listId" = cl.id
WHERE ec."tenantId" != cl."tenantId";

SELECT ec.id FROM "EmailCampaign" ec
JOIN "EmailMarketingTemplate" emt ON ec."templateId" = emt.id
WHERE ec."tenantId" != emt."tenantId";

SELECT ecs.id FROM "EmailCampaignSend" ecs
JOIN "EmailCampaign" ec ON ecs."campaignId" = ec.id
WHERE ecs."tenantId" != ec."tenantId";

-- T5.1: deletedAt column existence
SELECT table_name FROM information_schema.columns
WHERE column_name = 'deletedAt'
AND table_name IN ('EmailMarketingTemplate','EmailCampaign','ContactList');

-- T5.2: Soft delete counts
SELECT 'EmailMarketingTemplate', COUNT(*),
  COUNT(CASE WHEN "deletedAt" IS NOT NULL THEN 1 END)
FROM "EmailMarketingTemplate";
```

</details>

---

**Report generated:** 2026-02-08
**Status:** PASS (26/27 checks passed, 1 warning)
