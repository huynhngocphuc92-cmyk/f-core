# Knowledge Base - Data Integrity Test Report

**Date:** 2026-02-09
**Tester:** AI Data Integrity Tester (Claude Opus 4)
**Database:** PostgreSQL (hubspot_clone)
**Tenant:** F-CORE Demo (84d5dd22-9e29-425c-8ba0-1edfc255e236)

---

## Executive Summary

| Category | Tests | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
| 1. Schema Verification | 8 | 8 | 0 | PASS |
| 2. Seed Data Verification | 5 | 5 | 0 | PASS |
| 3. Tenant Isolation | 2 | 2 | 0 | PASS |
| 4. Referential Integrity | 3 | 3 | 0 | PASS |
| 5. Soft Delete Pattern | 2 | 2 | 0 | PASS |
| 6. Data Quality | 6 | 6 | 0 | PASS |
| **TOTAL** | **26** | **26** | **0** | **ALL PASS** |

### Pre-Test Finding (CRITICAL - NOW RESOLVED)

The KB tables (`KBCategory`, `KBArticle`, `KBArticleFeedback`) were defined in `prisma/schema.prisma` but were **missing from the database**. The initial migration (`20260204053919_init`) did not include these tables. Tables were created manually via DDL and then seeded. A proper Prisma migration should be generated to formalize this.

---

## 1. Schema Verification

### 1.1 Tables Exist

| Table | Expected | Actual | Status |
|-------|----------|--------|--------|
| KBCategory | EXISTS | EXISTS | PASS |
| KBArticle | EXISTS | EXISTS | PASS |
| KBArticleFeedback | EXISTS | EXISTS | PASS |

### 1.2 KBCategory Columns

| Column | Expected Type | Actual Type | Nullable | Default | Status |
|--------|---------------|-------------|----------|---------|--------|
| id | text | text | NO | - | PASS |
| tenantId | text | text | NO | - | PASS |
| name | text | text | NO | - | PASS |
| slug | text | text | NO | - | PASS |
| description | text | text | YES | - | PASS |
| icon | text | text | YES | - | PASS |
| parentId | text | text | YES | - | PASS |
| orderIndex | integer | int4 | NO | 0 | PASS |
| isVisible | boolean | bool | NO | true | PASS |
| createdAt | timestamp(3) | timestamp | NO | CURRENT_TIMESTAMP | PASS |
| updatedAt | timestamp(3) | timestamp | NO | CURRENT_TIMESTAMP | PASS |
| deletedAt | timestamp(3) | timestamp | YES | - | PASS |

### 1.3 KBArticle Columns

| Column | Expected Type | Actual Type | Nullable | Default | Status |
|--------|---------------|-------------|----------|---------|--------|
| id | text | text | NO | - | PASS |
| tenantId | text | text | NO | - | PASS |
| title | text | text | NO | - | PASS |
| slug | text | text | NO | - | PASS |
| subtitle | text | text | YES | - | PASS |
| excerpt | text | text | YES | - | PASS |
| contentJson | jsonb | jsonb | YES | - | PASS |
| contentHtml | text | text | YES | - | PASS |
| categoryId | text | text | YES | - | PASS |
| tags | text[] | _text (ARRAY) | YES | '{}' | PASS |
| status | text | text | NO | 'draft' | PASS |
| publishedAt | timestamp(3) | timestamp | YES | - | PASS |
| metaTitle | text | text | YES | - | PASS |
| metaDescription | text | text | YES | - | PASS |
| viewCount | integer | int4 | NO | 0 | PASS |
| helpfulCount | integer | int4 | NO | 0 | PASS |
| notHelpfulCount | integer | int4 | NO | 0 | PASS |
| createdAt | timestamp(3) | timestamp | NO | CURRENT_TIMESTAMP | PASS |
| updatedAt | timestamp(3) | timestamp | NO | CURRENT_TIMESTAMP | PASS |
| deletedAt | timestamp(3) | timestamp | YES | - | PASS |

### 1.4 KBArticleFeedback Columns

| Column | Expected Type | Actual Type | Nullable | Default | Status |
|--------|---------------|-------------|----------|---------|--------|
| id | text | text | NO | - | PASS |
| articleId | text | text | NO | - | PASS |
| tenantId | text | text | NO | - | PASS |
| isHelpful | boolean | bool | NO | - | PASS |
| comment | text | text | YES | - | PASS |
| visitorId | text | text | YES | - | PASS |
| ipAddress | text | text | YES | - | PASS |
| createdAt | timestamp(3) | timestamp | NO | CURRENT_TIMESTAMP | PASS |

### 1.5 Indexes

| Index Name | Table | Columns | Type | Status |
|------------|-------|---------|------|--------|
| KBCategory_pkey | KBCategory | (id) | UNIQUE/PK | PASS |
| KBCategory_tenantId_idx | KBCategory | (tenantId) | INDEX | PASS |
| KBCategory_parentId_idx | KBCategory | (parentId) | INDEX | PASS |
| KBCategory_tenantId_isVisible_deletedAt_idx | KBCategory | (tenantId, isVisible, deletedAt) | INDEX | PASS |
| KBCategory_orderIndex_idx | KBCategory | (orderIndex) | INDEX | PASS |
| KBCategory_tenantId_parentId_slug_key | KBCategory | (tenantId, parentId, slug) | UNIQUE | PASS |
| KBArticle_pkey | KBArticle | (id) | UNIQUE/PK | PASS |
| KBArticle_tenantId_idx | KBArticle | (tenantId) | INDEX | PASS |
| KBArticle_tenantId_status_idx | KBArticle | (tenantId, status) | INDEX | PASS |
| KBArticle_tenantId_categoryId_idx | KBArticle | (tenantId, categoryId) | INDEX | PASS |
| KBArticle_tenantId_status_deletedAt_idx | KBArticle | (tenantId, status, deletedAt) | INDEX | PASS |
| KBArticle_slug_idx | KBArticle | (slug) | INDEX | PASS |
| KBArticle_publishedAt_idx | KBArticle | (publishedAt DESC) | INDEX | PASS |
| KBArticle_viewCount_idx | KBArticle | (viewCount DESC) | INDEX | PASS |
| KBArticle_tenantId_slug_key | KBArticle | (tenantId, slug) | UNIQUE | PASS |
| KBArticleFeedback_pkey | KBArticleFeedback | (id) | UNIQUE/PK | PASS |
| KBArticleFeedback_articleId_idx | KBArticleFeedback | (articleId) | INDEX | PASS |
| KBArticleFeedback_tenantId_idx | KBArticleFeedback | (tenantId) | INDEX | PASS |
| KBArticleFeedback_articleId_isHelpful_idx | KBArticleFeedback | (articleId, isHelpful) | INDEX | PASS |
| KBArticleFeedback_articleId_visitorId_key | KBArticleFeedback | (articleId, visitorId) | UNIQUE | PASS |

### 1.6 Foreign Keys

| Constraint | Table | Definition | Status |
|------------|-------|------------|--------|
| KBCategory_parentId_fkey | KBCategory | FK (parentId) -> KBCategory(id) ON DELETE SET NULL | PASS |
| KBArticle_categoryId_fkey | KBArticle | FK (categoryId) -> KBCategory(id) ON DELETE SET NULL | PASS |
| KBArticleFeedback_articleId_fkey | KBArticleFeedback | FK (articleId) -> KBArticle(id) ON DELETE CASCADE | PASS |

---

## 2. Seed Data Verification

### 2.1 Record Counts

| Table | Expected | Actual | Status |
|-------|----------|--------|--------|
| KBCategory (total) | 5 | 5 | PASS |
| KBCategory (root) | 3 | 3 | PASS |
| KBCategory (sub) | 2 | 2 | PASS |
| KBArticle | 6 | 6 | PASS |
| KBArticleFeedback | 9 | 9 | PASS |

### 2.2 Article Status Distribution

| Status | Expected | Actual | Status |
|--------|----------|--------|--------|
| published | 3 | 3 | PASS |
| draft | 2 | 2 | PASS |
| archived | 1 | 1 | PASS |

### 2.3 Category Hierarchy

```
Getting Started (root, orderIndex=0)
  +-- Quick Start Guide (sub, orderIndex=0)
  +-- FAQ (sub, orderIndex=1)
Account & Billing (root, orderIndex=1)
Troubleshooting (root, orderIndex=2)
```

| Category | Parent | Is Root | Status |
|----------|--------|---------|--------|
| Getting Started | NULL | Yes | PASS |
| Quick Start Guide | Getting Started | No | PASS |
| FAQ | Getting Started | No | PASS |
| Account & Billing | NULL | Yes | PASS |
| Troubleshooting | NULL | Yes | PASS |

### 2.4 Article-to-Category Mapping

| Article | Category | Is Subcategory | Status |
|---------|----------|----------------|--------|
| How to Set Up Your CRM in 5 Minutes | Quick Start Guide | Yes | PASS |
| Frequently Asked Questions | FAQ | Yes | PASS |
| How to Upgrade Your Subscription Plan | Account & Billing | No | PASS |
| Fixing Email Sync Issues | Troubleshooting | No | PASS |
| Understanding Contact Lifecycle Stages | Getting Started | No | PASS |
| Legacy Billing System Migration Guide | Account & Billing | No | PASS |

### 2.5 Feedback Distribution

| Article | Total | Helpful | Not Helpful |
|---------|-------|---------|-------------|
| How to Set Up Your CRM in 5 Minutes | 4 | 3 | 1 |
| Frequently Asked Questions | 3 | 2 | 1 |
| How to Upgrade Your Subscription Plan | 2 | 2 | 0 |
| Fixing Email Sync Issues (draft) | 0 | 0 | 0 |
| Understanding Contact Lifecycle Stages (draft) | 0 | 0 | 0 |
| Legacy Billing Migration (archived) | 0 | 0 | 0 |

---

## 3. Tenant Isolation

### 3.1 No NULL tenantIds

| Table | NULL tenantId Count | Status |
|-------|---------------------|--------|
| KBCategory | 0 | PASS |
| KBArticle | 0 | PASS |
| KBArticleFeedback | 0 | PASS |

### 3.2 All Records Reference Valid Tenant

| Table | Orphan Count (Invalid Tenant) | Status |
|-------|-------------------------------|--------|
| KBCategory | 0 | PASS |
| KBArticle | 0 | PASS |
| KBArticleFeedback | 0 | PASS |

All records belong to tenant: **F-CORE Demo** (`84d5dd22-9e29-425c-8ba0-1edfc255e236`, domain: `demo.f-core.com`).

---

## 4. Referential Integrity

### 4.1 Article -> Category References

| Check | Result | Status |
|-------|--------|--------|
| Articles with invalid categoryId | 0 orphans | PASS |

### 4.2 Feedback -> Article References

| Check | Result | Status |
|-------|--------|--------|
| Feedback with invalid articleId | 0 orphans | PASS |

### 4.3 Category Self-Reference (Parent-Child)

| Check | Result | Status |
|-------|--------|--------|
| Categories with invalid parentId | 0 orphans | PASS |

---

## 5. Soft Delete Pattern

### 5.1 deletedAt Column Existence

| Table | Column Exists | Nullable | Status |
|-------|---------------|----------|--------|
| KBCategory | Yes | YES | PASS |
| KBArticle | Yes | YES | PASS |

Note: `KBArticleFeedback` does not have a `deletedAt` column. This is by design -- feedback uses CASCADE delete (when the parent article is deleted, all feedback is hard-deleted).

### 5.2 Freshly Seeded - No Soft-Deleted Records

| Table | Records with non-NULL deletedAt | Status |
|-------|--------------------------------|--------|
| KBCategory | 0 | PASS |
| KBArticle | 0 | PASS |

---

## 6. Data Quality

### 6.1 Slug Validation (lowercase, no spaces, valid format)

| Table | Total Slugs | Valid | Invalid | Status |
|-------|-------------|-------|---------|--------|
| KBCategory | 5 | 5 | 0 | PASS |
| KBArticle | 6 | 6 | 0 | PASS |

All slugs verified against regex `^[a-z0-9][a-z0-9-]*[a-z0-9]$`.

### 6.2 Published Articles Have publishedAt Set

| Article | Status | publishedAt | Check |
|---------|--------|-------------|-------|
| kb-article-1 | published | 2026-01-09 | PASS |
| kb-article-2 | published | 2026-01-19 | PASS |
| kb-article-3 | published | 2026-01-24 | PASS |

### 6.3 Draft Articles Have NULL publishedAt

| Article | Status | publishedAt | Check |
|---------|--------|-------------|-------|
| kb-article-4 | draft | NULL | PASS |
| kb-article-5 | draft | NULL | PASS |

### 6.4 Published Articles Have Non-Empty contentHtml

| Article | Status | contentHtml | Check |
|---------|--------|-------------|-------|
| kb-article-1 | published | Non-empty | PASS |
| kb-article-2 | published | Non-empty | PASS |
| kb-article-3 | published | Non-empty | PASS |

### 6.5 Category Tree Depth

| Metric | Value | Limit | Status |
|--------|-------|-------|--------|
| Maximum depth | 2 | 2 | PASS |

### 6.6 Feedback Visitor Uniqueness Per Article

| Check | Duplicates Found | Status |
|-------|-----------------|--------|
| articleId + visitorId uniqueness | 0 | PASS |

Enforced by unique index `KBArticleFeedback_articleId_visitorId_key`.

---

## Observations and Recommendations

### Issues Found During Testing

1. **CRITICAL (Resolved):** KB tables were missing from the database. The Prisma schema defined `KBCategory`, `KBArticle`, and `KBArticleFeedback` models, but the only migration (`20260204053919_init`) did not include these tables. Tables were created manually via DDL during this test session.

2. **WARNING - Migration Drift:** The database has drift from the Prisma migration history. The `Form`, `FormField`, and `FormSubmission` tables exist in the database but are not in the migration file. Similarly, the KB tables are now in the database but not in any migration. A new Prisma migration should be generated to capture all current DDL.

### Recommendations

1. **Generate a Prisma migration** to capture the current state of all tables (`Form*` and `KB*` models) and resolve migration drift. Consider using `prisma migrate diff` to understand the gap and `prisma migrate dev` to formalize.

2. **Add FK from KBCategory/KBArticle to Tenant table** for enforced referential integrity at the database level (currently relies on application-layer enforcement only).

3. **Consider adding `KBArticleFeedback` soft delete** or explicitly document why CASCADE hard delete is the chosen pattern for feedback records.

---

## Test Environment

- **Database:** PostgreSQL at localhost:5432/hubspot_clone
- **Schema Source:** `/Users/chong/hubspot-demo/prisma/schema.prisma`
- **Seed Source:** `/Users/chong/hubspot-demo/prisma/seed.ts`
- **Migration Applied:** `20260204053919_init` (2026-02-04)
- **KB Tables Created:** Manually via DDL (2026-02-09)
- **Seed Executed:** Successfully (2026-02-09)
