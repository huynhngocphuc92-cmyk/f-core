# Ticketing System - Data Integrity Report

**Date:** 2026-02-09
**Tester:** QA Automated (Claude Opus 4)
**Database:** PostgreSQL (Supabase)
**Tenant:** `84d5dd22-9e29-425c-8ba0-1edfc255e236`

---

## Summary

| # | Check | Result | Status |
|---|-------|--------|--------|
| 1 | Ticket Counter | PASS | PASS |
| 2 | Ticket Number Uniqueness | PASS | PASS |
| 3 | Foreign Key Integrity | PASS | PASS |
| 4 | SLA Policies | PASS | PASS |
| 5 | Pipeline Stages | PASS | PASS |
| 6 | Tenant Isolation | PASS | PASS |
| 7 | Soft Delete | PASS | PASS |
| 8 | Orphan Check | PASS | PASS |
| 9 | Stage Type Consistency | PASS | PASS |

**Overall Result: 9/9 PASSED -- ALL CHECKS GREEN**

---

## Detailed Results

### 1. Ticket Counter Verification

**Query:** `SELECT * FROM "TicketCounter"`

| tenantId | lastNumber |
|----------|------------|
| `84d5dd22-9e29-425c-8ba0-1edfc255e236` | 6 |

**Validation:**
- Actual ticket count: **6**
- Max ticketNumber in Ticket table: **6**
- TicketCounter.lastNumber: **6**
- **Result: PASS** -- lastNumber matches actual ticket count and max ticketNumber.

---

### 2. Ticket Number Uniqueness

**Query:** `SELECT "tenantId", "ticketNumber", COUNT(*) FROM "Ticket" GROUP BY "tenantId", "ticketNumber" HAVING COUNT(*) > 1`

**Result:** Empty result set -- no duplicates found.

**Ticket numbers present:** 1, 2, 3, 4, 5, 6 (sequential, no gaps)

- **Result: PASS** -- All ticketNumbers are unique per tenant.

---

### 3. Foreign Key Integrity

#### 3a. Pipeline Reference (Ticket -> TicketPipeline)
**Query:** Tickets with invalid pipelineId
**Result:** Empty -- all 6 tickets reference valid pipeline `ticket-pipeline-default`
- **Result: PASS**

#### 3b. Stage Reference (Ticket -> TicketPipelineStage)
**Query:** Tickets with invalid stageId
**Result:** Empty -- all 6 tickets reference valid stages
- **Result: PASS**

#### 3c. Contact Reference (Ticket -> Contact)
**Query:** Tickets with invalid contactId (where contactId IS NOT NULL)
**Result:** Empty -- all non-null contactId values reference valid contacts
- **Result: PASS**

#### 3d. Company Reference (Ticket -> Company)
**Query:** Tickets with invalid companyId (where companyId IS NOT NULL)
**Result:** Empty -- all non-null companyId values reference valid companies
- **Result: PASS**

**FK Summary Table:**

| Ticket # | Title | pipelineId | stageId | contactId | companyId |
|----------|-------|-----------|---------|-----------|-----------|
| 1 | Cannot login to dashboard | ticket-pipeline-default | ticket-stage-3 | contact-john@example.com | company-techcorp.com |
| 2 | Feature request: Export to CSV | ticket-pipeline-default | ticket-stage-1 | contact-jane@techcorp.com | company-techcorp.com |
| 3 | Billing discrepancy on last invoice | ticket-pipeline-default | ticket-stage-2 | contact-alice@enterprise.com | company-enterprise.com |
| 4 | How to set up email integration? | ticket-pipeline-default | ticket-stage-4 | contact-bob@startup.io | company-startup.io |
| 5 | API rate limiting errors | ticket-pipeline-default | ticket-stage-3 | contact-charlie@agency.co | company-agency.co |
| 6 | Onboarding assistance needed | ticket-pipeline-default | ticket-stage-5 | contact-jane@techcorp.com | NULL |

Note: Ticket #6 has `companyId = NULL`, which is allowed (nullable foreign key).

---

### 4. SLA Policies

**Query:** `SELECT * FROM "TicketSLAPolicy" ORDER BY priority`

| Priority | Name | First Response (min) | Next Response (min) | Resolution (min) | Active |
|----------|------|---------------------|---------------------|-------------------|--------|
| urgent | Urgent Support | 30 | 30 | 240 | true |
| high | High Priority | 60 | 120 | 480 | true |
| medium | Medium Priority | 240 | 480 | 1440 | true |
| low | Low Priority | 480 | 1440 | 4320 | true |

**Validation:**
- Expected: 4 SLA policies (one per priority level: urgent, high, medium, low)
- Found: **4 SLA policies**
- All priorities covered: urgent, high, medium, low
- All policies active: true
- All in same tenant: `84d5dd22-9e29-425c-8ba0-1edfc255e236`
- Business hours: 09:00-17:00, Mon-Fri, Asia/Ho_Chi_Minh timezone
- **Result: PASS** -- Exactly 4 SLA policies, one per priority level.

---

### 5. Pipeline Stages

**Query:** `SELECT * FROM "TicketPipelineStage" ORDER BY "displayOrder"`

| displayOrder | Name | Type | Color |
|-------------|------|------|-------|
| 0 | New | open | #3B82F6 (blue) |
| 1 | Waiting on contact | waiting | #F59E0B (amber) |
| 2 | Waiting on us | in_progress | #8B5CF6 (purple) |
| 3 | Resolved | resolved | #10B981 (green) |
| 4 | Closed | closed | #6B7280 (gray) |

**Validation:**
- Expected: 5 stages with types: open, waiting, in_progress, resolved, closed
- Found: **5 stages**
- All expected types present: open, waiting, in_progress, resolved, closed
- Display order is sequential: 0, 1, 2, 3, 4
- All stages belong to pipeline: `ticket-pipeline-default`
- **Result: PASS** -- 5 stages with correct types and sequential ordering.

---

### 6. Tenant Isolation

**Query:** `SELECT DISTINCT "tenantId" FROM "Ticket"`

| tenantId |
|----------|
| `84d5dd22-9e29-425c-8ba0-1edfc255e236` |

**Cross-table tenant check:**
- Tickets: 1 tenant
- SLA Policies: 1 tenant (same)
- TicketCounter: 1 tenant (same)

- **Result: PASS** -- All tickets belong to a single tenant. No cross-tenant data leakage.

---

### 7. Soft Delete Verification

**Query:** `SELECT id, "ticketNumber", "deletedAt" FROM "Ticket" WHERE "deletedAt" IS NOT NULL`

**Result:** Empty -- no tickets have been soft-deleted.

| Ticket # | deletedAt |
|----------|-----------|
| 1 | NULL |
| 2 | NULL |
| 3 | NULL |
| 4 | NULL |
| 5 | NULL |
| 6 | NULL |

- **Result: PASS** -- No tickets are soft-deleted (as expected for seed data).

---

### 8. Orphan Check

#### 8a. TicketComment orphans
**Query:** Comments referencing non-existent tickets
**Result:** Empty -- no orphaned comments
- Total comments: **3**
- **Result: PASS**

#### 8b. TicketActivity orphans
**Query:** Activities referencing non-existent tickets
**Result:** Empty -- no orphaned activities
- Total activities: **4**
- **Result: PASS**

---

### 9. Stage Type Consistency (Status vs Stage Type)

**Query:** Ticket status compared to its assigned stage type

| Ticket # | Status | Stage Type | Stage Name | Match |
|----------|--------|------------|------------|-------|
| 1 | in_progress | in_progress | Waiting on us | YES |
| 2 | open | open | New | YES |
| 3 | waiting | waiting | Waiting on contact | YES |
| 4 | resolved | resolved | Resolved | YES |
| 5 | in_progress | in_progress | Waiting on us | YES |
| 6 | closed | closed | Closed | YES |

**Validation:**
- All 6 tickets have status matching their stage type
- No mismatches detected
- **Result: PASS** -- All ticket statuses are consistent with their pipeline stage types.

---

## Data Summary

| Entity | Count |
|--------|-------|
| Tickets | 6 |
| Pipeline Stages | 5 |
| SLA Policies | 4 |
| Comments | 3 |
| Activities | 4 |
| Pipelines | 1 (default) |
| Tenants | 1 |

---

## Conclusion

All 9 data integrity checks passed successfully. The ticketing system's seed data is consistent, properly referenced, and maintains full referential integrity across all related tables. No orphaned records, no duplicate ticket numbers, no cross-tenant leakage, and all status/stage mappings are correct.
