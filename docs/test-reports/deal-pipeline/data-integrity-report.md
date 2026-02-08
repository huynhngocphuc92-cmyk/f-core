# Deal Pipeline - Data Integrity Report

**Date:** 2026-02-08
**Tester:** Claude Opus 4 (Automated)
**Database:** PostgreSQL (via hubspot-db MCP)
**Schema:** Prisma ORM (PascalCase table names)

---

## Summary

| # | Check | Result |
|---|-------|--------|
| 1 | Tenant Isolation | PASS |
| 2 | Pipeline Integrity | PASS |
| 3 | Stage Order Consistency | PASS |
| 4 | Deal-Stage Foreign Key Integrity | PASS |
| 5 | Deal-Pipeline Foreign Key Integrity | PASS |
| 6 | Soft Delete Verification | PASS |
| 7 | DealContact and DealCompany Associations | PASS (with note) |
| 8 | Orphan Records Check | PASS |
| 9 | Amount Validation | PASS |

**Overall Result: 9/9 PASS**

---

## Detailed Findings

### 1. Tenant Isolation -- PASS

**Query:**
```sql
SELECT COUNT(*) as total, "tenantId"
FROM "Deal" WHERE "deletedAt" IS NULL
GROUP BY "tenantId";
```

**Result:**
| total | tenantId |
|-------|----------|
| 5 | 84d5dd22-9e29-425c-8ba0-1edfc255e236 |

**Verification:** All 5 active deals belong to the expected tenant `84d5dd22-9e29-425c-8ba0-1edfc255e236`. No cross-tenant data leakage detected.

---

### 2. Pipeline Integrity -- PASS

**Query:**
```sql
SELECT p.id, p.name, p."tenantId", COUNT(ps.id) as stage_count
FROM "Pipeline" p
LEFT JOIN "PipelineStage" ps ON ps."pipelineId" = p.id
GROUP BY p.id, p.name, p."tenantId";
```

**Result:**
| id | name | tenantId | stage_count |
|----|------|----------|-------------|
| default-pipeline | Sales Pipeline | 84d5dd22-9e29-425c-8ba0-1edfc255e236 | 7 |

**Verification:** One pipeline exists (`default-pipeline`), belongs to the correct tenant, and has exactly 7 stages as expected.

---

### 3. Stage Order Consistency -- PASS

**Query:**
```sql
SELECT id, name, "orderIndex", probability, color, "isClosed", "isWon"
FROM "PipelineStage"
WHERE "pipelineId" = 'default-pipeline'
ORDER BY "orderIndex";
```

**Result:**
| id | name | orderIndex | probability | color | isClosed | isWon |
|----|------|-----------|-------------|-------|----------|-------|
| stage-1 | Appointment Scheduled | 0 | 20 | #0891b2 | false | false |
| stage-2 | Qualified to Buy | 1 | 40 | #0ea5e9 | false | false |
| stage-3 | Presentation Scheduled | 2 | 60 | #22c55e | false | false |
| stage-4 | Decision Maker Bought-In | 3 | 80 | #eab308 | false | false |
| stage-5 | Contract Sent | 4 | 90 | #f97316 | false | false |
| stage-6 | Closed Won | 5 | 100 | #10b981 | true | true |
| stage-7 | Closed Lost | 6 | 0 | #ef4444 | true | false |

**Verification:**
- Stages are ordered 0-6 with no gaps.
- Probabilities match expected values: 20, 40, 60, 80, 90, 100, 0.
- Only `Closed Won` (stage-6) has `isWon = true` and `isClosed = true`.
- Only `Closed Lost` (stage-7) has `isClosed = true` and `isWon = false`.
- All open stages have `isClosed = false` and `isWon = false`.
- All stages have distinct color values assigned.

---

### 4. Deal-Stage Foreign Key Integrity -- PASS

**Query:**
```sql
SELECT d.id, d.name, d."stageId", ps.name as stage_name, ps."pipelineId"
FROM "Deal" d
LEFT JOIN "PipelineStage" ps ON d."stageId" = ps.id
WHERE d."deletedAt" IS NULL;
```

**Result:**
| deal_id | deal_name | stageId | stage_name | pipelineId |
|---------|-----------|---------|------------|------------|
| deal-1 | TechCorp Enterprise Deal | stage-3 | Presentation Scheduled | default-pipeline |
| deal-2 | StartupIO Starter Package | stage-2 | Qualified to Buy | default-pipeline |
| deal-3 | Enterprise Consulting Project | stage-4 | Decision Maker Bought-In | default-pipeline |
| deal-4 | Agency Marketing Suite | stage-1 | Appointment Scheduled | default-pipeline |
| deal-5 | New Business Opportunity | stage-5 | Contract Sent | default-pipeline |

**Verification:**
- All 5 deals have valid stage references (no NULL stage_name values).
- All stages belong to `default-pipeline`, which is the same pipeline each deal references.
- No cross-pipeline stage assignments detected (additional query confirmed 0 mismatches).

---

### 5. Deal-Pipeline Foreign Key Integrity -- PASS

**Query:**
```sql
SELECT d.id, d.name, d."pipelineId", p.name as pipeline_name
FROM "Deal" d
LEFT JOIN "Pipeline" p ON d."pipelineId" = p.id
WHERE d."deletedAt" IS NULL;
```

**Result:**
| deal_id | deal_name | pipelineId | pipeline_name |
|---------|-----------|------------|---------------|
| deal-1 | TechCorp Enterprise Deal | default-pipeline | Sales Pipeline |
| deal-2 | StartupIO Starter Package | default-pipeline | Sales Pipeline |
| deal-3 | Enterprise Consulting Project | default-pipeline | Sales Pipeline |
| deal-4 | Agency Marketing Suite | default-pipeline | Sales Pipeline |
| deal-5 | New Business Opportunity | default-pipeline | Sales Pipeline |

**Verification:** All 5 deals reference a valid pipeline (`default-pipeline` / "Sales Pipeline"). No NULL pipeline references found.

---

### 6. Soft Delete Verification -- PASS

**Query:**
```sql
SELECT COUNT(*) as deleted_count FROM "Deal" WHERE "deletedAt" IS NOT NULL;
SELECT COUNT(*) as active_count FROM "Deal" WHERE "deletedAt" IS NULL;
```

**Result:**
| Metric | Count |
|--------|-------|
| Deleted deals (soft) | 0 |
| Active deals | 5 |

**Verification:** The soft delete mechanism (`deletedAt` column) exists on the `Deal` table. Currently 0 deals are soft-deleted and 5 are active. The schema correctly implements soft delete via a nullable `DateTime` field.

---

### 7. DealContact and DealCompany Associations -- PASS (with note)

**Query:**
```sql
SELECT COUNT(*) as deal_contact_count FROM "DealContact";
SELECT COUNT(*) as deal_company_count FROM "DealCompany";
```

**Result:**
| Association Table | Count |
|-------------------|-------|
| DealContact | 0 |
| DealCompany | 0 |

**Verification:** Both association tables exist and are queryable. However, there are currently **zero associations** between deals and contacts/companies.

**Note:** This is not a data integrity failure -- it indicates that seed data did not populate these junction tables. When deal associations are implemented in the UI, this should be re-tested to confirm proper FK relationships.

---

### 8. Orphan Records Check -- PASS

**Query:**
```sql
SELECT d.id, d.name FROM "Deal" d
WHERE d."deletedAt" IS NULL
AND NOT EXISTS (SELECT 1 FROM "Pipeline" p WHERE p.id = d."pipelineId");
```

**Result:** Empty result set (0 rows).

**Additional Query -- Orphan stages check:**
```sql
SELECT d.id, d.name FROM "Deal" d
WHERE d."deletedAt" IS NULL
AND d."stageId" NOT IN (SELECT id FROM "PipelineStage");
```

**Result:** Empty result set (0 rows).

**Verification:** No orphan deals exist. All active deals reference valid pipelines and valid pipeline stages.

---

### 9. Amount Validation -- PASS

**Query:**
```sql
SELECT id, name, amount, currency FROM "Deal" WHERE "deletedAt" IS NULL;
```

**Result:**
| id | name | amount | currency |
|----|------|--------|----------|
| deal-1 | TechCorp Enterprise Deal | 50000.00 | USD |
| deal-2 | StartupIO Starter Package | 5000.00 | USD |
| deal-3 | Enterprise Consulting Project | 120000.00 | USD |
| deal-4 | Agency Marketing Suite | 15000.00 | USD |
| deal-5 | New Business Opportunity | 25000.00 | USD |

**Verification:**
- All amounts are positive values (no negative or zero amounts).
- No NULL amounts found.
- All currencies are `USD` (valid ISO 4217 code).
- Amounts use `Decimal(15,2)` precision as defined in the Prisma schema.
- Total pipeline value: $215,000.00.

---

## Deal Distribution by Stage

| Stage | Deal Count | Total Value |
|-------|-----------|-------------|
| Appointment Scheduled (stage-1) | 1 | $15,000.00 |
| Qualified to Buy (stage-2) | 1 | $5,000.00 |
| Presentation Scheduled (stage-3) | 1 | $50,000.00 |
| Decision Maker Bought-In (stage-4) | 1 | $120,000.00 |
| Contract Sent (stage-5) | 1 | $25,000.00 |
| Closed Won (stage-6) | 0 | $0.00 |
| Closed Lost (stage-7) | 0 | $0.00 |

---

## Recommendations

1. **Populate DealContact and DealCompany associations** -- The junction tables are empty. Once the Kanban board allows associating contacts/companies with deals, re-run check #7.
2. **Add application-level validation** -- Ensure the API layer validates that `amount >= 0` and `currency` is a valid ISO 4217 code before writes.
3. **Test soft delete in practice** -- Currently no soft-deleted records exist. Add integration tests that verify soft-deleted deals are excluded from Kanban board queries.
4. **Cross-pipeline stage validation** -- Add a database constraint or application-level check to ensure `Deal.stageId` always references a stage within `Deal.pipelineId`.

---

*Report generated automatically by Data Integrity Tester.*
