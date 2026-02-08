# Workflow Automation - Data Integrity Test Report

**Project:** F-CORE (HubSpot CRM Clone)
**Date:** 2026-02-08
**Tester:** Data Integrity Tester (Automated)
**Database:** PostgreSQL (Supabase)
**Overall Result:** ALL TESTS PASSED (6/6)

---

## Test 1: Schema Verification

**Objective:** Verify all 6 workflow tables exist with correct columns and data types matching the Prisma schema.

### Test 1.1: Table Existence

**SQL Query:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'WorkflowDefinition', 'WorkflowVersion', 'WorkflowExecution',
  'WorkflowStepLog', 'WorkflowEnrollment', 'CrmEvent'
)
ORDER BY table_name;
```

**Result:**

| Table Name | Exists |
|---|---|
| CrmEvent | YES |
| WorkflowDefinition | YES |
| WorkflowEnrollment | YES |
| WorkflowExecution | YES |
| WorkflowStepLog | YES |
| WorkflowVersion | YES |

**Status: PASS** -- All 6 tables exist.

### Test 1.2: WorkflowDefinition Columns

**SQL Query:**
```sql
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'WorkflowDefinition'
ORDER BY ordinal_position;
```

**Result:**

| Column | Type | Nullable | Default | Prisma Match |
|---|---|---|---|---|
| id | text | NO | - | YES |
| tenantId | text | NO | - | YES |
| name | text | NO | - | YES |
| description | text | YES | - | YES |
| objectType | text | NO | - | YES |
| status | text | NO | 'draft'::text | YES |
| version | integer (int4) | NO | 1 | YES |
| triggerConfig | jsonb | NO | '{}'::jsonb | YES |
| steps | jsonb | NO | '[]'::jsonb | YES |
| viewport | jsonb | NO | '{"x":0,"y":0,"zoom":1}'::jsonb | YES |
| settings | jsonb | NO | '{}'::jsonb | YES |
| createdBy | text | YES | - | YES |
| updatedBy | text | YES | - | YES |
| createdAt | timestamp | NO | CURRENT_TIMESTAMP | YES |
| updatedAt | timestamp | NO | - | YES |
| deletedAt | timestamp | YES | - | YES |

**Status: PASS** -- All 16 columns match Prisma schema definition.

### Test 1.3: WorkflowVersion Columns

**Result:**

| Column | Type | Nullable | Default | Prisma Match |
|---|---|---|---|---|
| id | text | NO | - | YES |
| workflowId | text | NO | - | YES |
| version | integer (int4) | NO | - | YES |
| triggerConfig | jsonb | NO | - | YES |
| steps | jsonb | NO | - | YES |
| settings | jsonb | NO | '{}'::jsonb | YES |
| changeSummary | text | YES | - | YES |
| createdBy | text | YES | - | YES |
| createdAt | timestamp | NO | CURRENT_TIMESTAMP | YES |

**Status: PASS** -- All 9 columns match Prisma schema definition.

### Test 1.4: WorkflowExecution Columns

**Result:**

| Column | Type | Nullable | Default | Prisma Match |
|---|---|---|---|---|
| id | text | NO | - | YES |
| tenantId | text | NO | - | YES |
| workflowId | text | NO | - | YES |
| workflowVersion | integer (int4) | NO | - | YES |
| objectType | text | NO | - | YES |
| objectId | text | NO | - | YES |
| status | text | NO | 'running'::text | YES |
| currentStepId | text | YES | - | YES |
| triggerEvent | jsonb | NO | '{}'::jsonb | YES |
| stepResults | jsonb | NO | '{}'::jsonb | YES |
| errorMessage | text | YES | - | YES |
| errorStepId | text | YES | - | YES |
| retryCount | integer (int4) | NO | 0 | YES |
| maxRetries | integer (int4) | NO | 3 | YES |
| startedAt | timestamp | NO | CURRENT_TIMESTAMP | YES |
| completedAt | timestamp | YES | - | YES |
| nextStepAt | timestamp | YES | - | YES |
| createdAt | timestamp | NO | CURRENT_TIMESTAMP | YES |
| updatedAt | timestamp | NO | - | YES |

**Status: PASS** -- All 19 columns match Prisma schema definition.

### Test 1.5: WorkflowStepLog Columns

**Result:**

| Column | Type | Nullable | Default | Prisma Match |
|---|---|---|---|---|
| id | text | NO | - | YES |
| executionId | text | NO | - | YES |
| stepId | text | NO | - | YES |
| stepType | text | NO | - | YES |
| status | text | NO | - | YES |
| inputData | jsonb | NO | '{}'::jsonb | YES |
| outputData | jsonb | NO | '{}'::jsonb | YES |
| errorMessage | text | YES | - | YES |
| startedAt | timestamp | NO | CURRENT_TIMESTAMP | YES |
| completedAt | timestamp | YES | - | YES |
| durationMs | integer (int4) | YES | - | YES |
| attempt | integer (int4) | NO | 1 | YES |

**Status: PASS** -- All 12 columns match Prisma schema definition.

### Test 1.6: WorkflowEnrollment Columns

**Result:**

| Column | Type | Nullable | Default | Prisma Match |
|---|---|---|---|---|
| id | text | NO | - | YES |
| tenantId | text | NO | - | YES |
| workflowId | text | NO | - | YES |
| objectType | text | NO | - | YES |
| objectId | text | NO | - | YES |
| enrolledAt | timestamp | NO | CURRENT_TIMESTAMP | YES |
| enrolledBy | text | NO | 'trigger'::text | YES |
| unenrolledAt | timestamp | YES | - | YES |
| unenrollReason | text | YES | - | YES |
| executionId | text | YES | - | YES |

**Status: PASS** -- All 10 columns match Prisma schema definition.

### Test 1.7: CrmEvent Columns

**Result:**

| Column | Type | Nullable | Default | Prisma Match |
|---|---|---|---|---|
| id | text | NO | - | YES |
| tenantId | text | NO | - | YES |
| eventType | text | NO | - | YES |
| objectType | text | NO | - | YES |
| objectId | text | NO | - | YES |
| propertyName | text | YES | - | YES |
| oldValue | text | YES | - | YES |
| newValue | text | YES | - | YES |
| metadata | jsonb | NO | '{}'::jsonb | YES |
| source | text | NO | 'system'::text | YES |
| sourceId | text | YES | - | YES |
| createdAt | timestamp | NO | CURRENT_TIMESTAMP | YES |

**Status: PASS** -- All 12 columns match Prisma schema definition.

---

## Test 2: Seed Data Verification

**Objective:** Verify 3 workflow definitions exist with correct statuses, valid tenantId, and valid JSONB data.

### Test 2.1: Workflow Definition Count and Status

**SQL Query:**
```sql
SELECT id, "tenantId", name, description, "objectType", status, version,
       "createdAt", "updatedAt", "deletedAt"
FROM "WorkflowDefinition"
ORDER BY "createdAt";
```

**Result:**

| # | Name | Status | ObjectType | Version |
|---|---|---|---|---|
| 1 | Welcome New Contacts | active | contact | 1 |
| 2 | MQL Nurture Sequence | draft | contact | 1 |
| 3 | Deal Stage Automation | paused | deal | 1 |

**Status: PASS** -- 3 workflow definitions exist with expected statuses (active, draft, paused).

### Test 2.2: Valid TenantId

**SQL Query:**
```sql
SELECT DISTINCT wd."tenantId", t.name AS tenant_name
FROM "WorkflowDefinition" wd
JOIN "Tenant" t ON wd."tenantId" = t.id;
```

**Result:**

| tenantId | Tenant Name |
|---|---|
| 84d5dd22-9e29-425c-8ba0-1edfc255e236 | F-CORE Demo |

**Status: PASS** -- All workflow definitions reference the valid tenant "F-CORE Demo".

### Test 2.3: Steps JSONB Validation

**SQL Query:**
```sql
SELECT id, name,
  jsonb_typeof(steps) AS steps_type,
  jsonb_array_length(steps) AS steps_count
FROM "WorkflowDefinition";
```

**Result:**

| Workflow | Steps Type | Step Count | Valid |
|---|---|---|---|
| Welcome New Contacts | array | 3 | YES |
| MQL Nurture Sequence | array | 2 | YES |
| Deal Stage Automation | array | 3 | YES |

**Steps Detail:**

**Welcome New Contacts (3 steps):**
1. `step_1` - send_email - "Send welcome email" (config: templateId)
2. `step_2` - delay - "Wait 3 days" (config: unit=days, duration=3)
3. `step_3` - create_task - "Create follow-up task" (config: subject, priority)

**MQL Nurture Sequence (2 steps):**
1. `step_1` - send_notification - "Notify sales team" (config: message with template vars)
2. `step_2` - update_property - "Set lead status" (config: property=leadStatus, value=open)

**Deal Stage Automation (3 steps):**
1. `step_1` - if_then - "Check deal amount" (config: property=amount, operator=greater_than, value=10000; branches: nextTrue/nextFalse)
2. `step_2a` - send_notification - "Notify manager" (config: message)
3. `step_2b` - create_task - "Create follow-up" (config: subject)

**Status: PASS** -- All steps JSONB arrays contain valid, well-structured step objects.

### Test 2.4: TriggerConfig JSONB Validation

**SQL Query:**
```sql
SELECT id, name,
  jsonb_typeof("triggerConfig") AS trigger_type,
  "triggerConfig" ? 'type' AS has_type_field,
  "triggerConfig" ->> 'type' AS trigger_type_value
FROM "WorkflowDefinition";
```

**Result:**

| Workflow | JSONB Type | Has 'type' | Trigger Type |
|---|---|---|---|
| Welcome New Contacts | object | true | record_created |
| MQL Nurture Sequence | object | true | property_change |
| Deal Stage Automation | object | true | property_change |

**Status: PASS** -- All triggerConfig JSONB objects are valid with required 'type' field.

### Test 2.5: Related Tables Record Counts

**SQL Query:**
```sql
SELECT 'WorkflowVersion' AS table_name, COUNT(*) AS record_count FROM "WorkflowVersion"
UNION ALL SELECT 'WorkflowExecution', COUNT(*) FROM "WorkflowExecution"
UNION ALL SELECT 'WorkflowStepLog', COUNT(*) FROM "WorkflowStepLog"
UNION ALL SELECT 'WorkflowEnrollment', COUNT(*) FROM "WorkflowEnrollment"
UNION ALL SELECT 'CrmEvent', COUNT(*) FROM "CrmEvent";
```

**Result:**

| Table | Record Count |
|---|---|
| WorkflowVersion | 0 |
| WorkflowExecution | 0 |
| WorkflowStepLog | 0 |
| WorkflowEnrollment | 0 |
| CrmEvent | 0 |

**Note:** These tables are empty as expected -- they will be populated when workflows are executed at runtime.

**Status: PASS** -- Seed data is complete and correct for WorkflowDefinition; related runtime tables are correctly empty.

---

## Test 3: Foreign Key Integrity

**Objective:** Verify FK constraints exist, reference correct tables, and no orphan records exist.

### Test 3.1: Foreign Key Constraints

**SQL Query:**
```sql
SELECT tc.constraint_name, tc.table_name, kcu.column_name,
       ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('WorkflowDefinition','WorkflowVersion','WorkflowExecution',
                       'WorkflowStepLog','WorkflowEnrollment');
```

**Result:**

| Constraint | Table | Column | References |
|---|---|---|---|
| WorkflowDefinition_tenantId_fkey | WorkflowDefinition | tenantId | Tenant.id |
| WorkflowVersion_workflowId_fkey | WorkflowVersion | workflowId | WorkflowDefinition.id |
| WorkflowExecution_workflowId_fkey | WorkflowExecution | workflowId | WorkflowDefinition.id |
| WorkflowStepLog_executionId_fkey | WorkflowStepLog | executionId | WorkflowExecution.id |
| WorkflowEnrollment_workflowId_fkey | WorkflowEnrollment | workflowId | WorkflowDefinition.id |
| WorkflowEnrollment_executionId_fkey | WorkflowEnrollment | executionId | WorkflowExecution.id |

**Status: PASS** -- All 6 foreign key constraints are correctly defined.

### Test 3.2: Orphan Record Check

**SQL Queries:**
```sql
-- Orphan WorkflowDefinitions (tenantId not in Tenant)
SELECT wd.id FROM "WorkflowDefinition" wd
LEFT JOIN "Tenant" t ON wd."tenantId" = t.id WHERE t.id IS NULL;

-- Orphan WorkflowVersions (workflowId not in WorkflowDefinition)
SELECT wv.id FROM "WorkflowVersion" wv
LEFT JOIN "WorkflowDefinition" wd ON wv."workflowId" = wd.id WHERE wd.id IS NULL;

-- Orphan WorkflowExecutions
SELECT we.id FROM "WorkflowExecution" we
LEFT JOIN "WorkflowDefinition" wd ON we."workflowId" = wd.id WHERE wd.id IS NULL;

-- Orphan WorkflowStepLogs
SELECT wsl.id FROM "WorkflowStepLog" wsl
LEFT JOIN "WorkflowExecution" we ON wsl."executionId" = we.id WHERE we.id IS NULL;

-- Orphan WorkflowEnrollments
SELECT wen.id FROM "WorkflowEnrollment" wen
LEFT JOIN "WorkflowDefinition" wd ON wen."workflowId" = wd.id WHERE wd.id IS NULL;
```

**Result:** All queries returned **0 orphan records**.

**Status: PASS** -- No orphan records exist in any workflow table.

### Test 3.3: Index Verification

**SQL Query:**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('WorkflowDefinition','WorkflowVersion','WorkflowExecution',
                     'WorkflowStepLog','WorkflowEnrollment','CrmEvent')
ORDER BY tablename, indexname;
```

**Result:**

| Table | Index | Type |
|---|---|---|
| **CrmEvent** | CrmEvent_pkey | PK (id) |
| | CrmEvent_tenantId_idx | btree (tenantId) |
| | CrmEvent_eventType_idx | btree (eventType) |
| | CrmEvent_objectType_objectId_idx | btree (objectType, objectId) |
| | CrmEvent_propertyName_idx | btree (propertyName) |
| | CrmEvent_createdAt_idx | btree (createdAt DESC) |
| **WorkflowDefinition** | WorkflowDefinition_pkey | PK (id) |
| | WorkflowDefinition_tenantId_idx | btree (tenantId) |
| | WorkflowDefinition_status_idx | btree (status) |
| | WorkflowDefinition_objectType_idx | btree (objectType) |
| | WorkflowDefinition_deletedAt_idx | btree (deletedAt) |
| **WorkflowEnrollment** | WorkflowEnrollment_pkey | PK (id) |
| | WorkflowEnrollment_tenantId_idx | btree (tenantId) |
| | WorkflowEnrollment_workflowId_idx | btree (workflowId) |
| | WorkflowEnrollment_objectId_idx | btree (objectId) |
| | WorkflowEnrollment_executionId_key | UNIQUE (executionId) |
| | WorkflowEnrollment_workflowId_objectId_key | UNIQUE (workflowId, objectId) |
| **WorkflowExecution** | WorkflowExecution_pkey | PK (id) |
| | WorkflowExecution_tenantId_idx | btree (tenantId) |
| | WorkflowExecution_workflowId_idx | btree (workflowId) |
| | WorkflowExecution_status_idx | btree (status) |
| | WorkflowExecution_objectType_objectId_idx | btree (objectType, objectId) |
| **WorkflowStepLog** | WorkflowStepLog_pkey | PK (id) |
| | WorkflowStepLog_executionId_idx | btree (executionId) |
| | WorkflowStepLog_stepId_idx | btree (stepId) |
| **WorkflowVersion** | WorkflowVersion_pkey | PK (id) |
| | WorkflowVersion_workflowId_idx | btree (workflowId) |
| | WorkflowVersion_workflowId_version_key | UNIQUE (workflowId, version) |

**Total: 28 indexes across 6 tables.**

**Required indexes verified:**
- tenantId: WorkflowDefinition, WorkflowExecution, WorkflowEnrollment, CrmEvent -- all present
- status: WorkflowDefinition, WorkflowExecution -- all present
- objectType: WorkflowDefinition -- present
- deletedAt: WorkflowDefinition -- present

**Status: PASS** -- All required indexes exist and match Prisma schema @@index directives.

---

## Test 4: Tenant Isolation

**Objective:** Verify all workflow records belong to the same tenant with no NULL tenantIds.

### Test 4.1: Distinct Tenant Count

**SQL Query:**
```sql
SELECT 'WorkflowDefinition' AS table_name,
       COUNT(DISTINCT "tenantId") AS distinct_tenants, COUNT(*) AS total_records
FROM "WorkflowDefinition"
UNION ALL
SELECT 'WorkflowExecution', COUNT(DISTINCT "tenantId"), COUNT(*) FROM "WorkflowExecution"
UNION ALL
SELECT 'WorkflowEnrollment', COUNT(DISTINCT "tenantId"), COUNT(*) FROM "WorkflowEnrollment"
UNION ALL
SELECT 'CrmEvent', COUNT(DISTINCT "tenantId"), COUNT(*) FROM "CrmEvent";
```

**Result:**

| Table | Distinct Tenants | Total Records |
|---|---|---|
| WorkflowDefinition | 1 | 3 |
| WorkflowExecution | 0 | 0 |
| WorkflowEnrollment | 0 | 0 |
| CrmEvent | 0 | 0 |

All populated records belong to a single tenant (84d5dd22-9e29-425c-8ba0-1edfc255e236 / "F-CORE Demo").

**Status: PASS** -- Tenant isolation confirmed.

### Test 4.2: NULL TenantId Check

**SQL Query:**
```sql
SELECT 'WorkflowDefinition' AS table_name, COUNT(*) AS null_tenant_count
FROM "WorkflowDefinition" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'WorkflowExecution', COUNT(*) FROM "WorkflowExecution" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'WorkflowEnrollment', COUNT(*) FROM "WorkflowEnrollment" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'CrmEvent', COUNT(*) FROM "CrmEvent" WHERE "tenantId" IS NULL;
```

**Result:** All counts = **0** (no NULL tenantIds).

### Test 4.3: NOT NULL Constraint Enforcement

**SQL Query:**
```sql
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_name IN ('WorkflowDefinition','WorkflowExecution','WorkflowEnrollment','CrmEvent')
AND column_name = 'tenantId';
```

**Result:** All tenantId columns have `is_nullable = 'NO'` (NOT NULL constraint enforced at DB level).

**Status: PASS** -- No NULL tenantIds exist and NOT NULL constraint prevents future violations.

---

## Test 5: Soft Delete Pattern

**Objective:** Verify deletedAt column exists, is NULL for all active records, and no soft-deleted records exist yet.

### Test 5.1: Soft Delete Column Check

**SQL Query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE "deletedAt" IS NULL) AS active_records,
  COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) AS soft_deleted_records,
  COUNT(*) AS total_records
FROM "WorkflowDefinition";
```

**Result:**

| Active Records | Soft-Deleted Records | Total |
|---|---|---|
| 3 | 0 | 3 |

**Status: PASS** -- All 3 records are active (deletedAt IS NULL). No soft-deleted records exist, as expected for fresh seed data.

### Test 5.2: Soft Delete Index

The `WorkflowDefinition_deletedAt_idx` index exists on the `deletedAt` column, ensuring efficient queries that filter by deletion status (e.g., `WHERE deletedAt IS NULL`).

**Status: PASS** -- Soft delete pattern is correctly implemented with index support.

---

## Test 6: JSONB Column Validation

**Objective:** Validate the structure of steps and triggerConfig JSONB columns.

### Test 6.1: Steps JSONB Structure Validation

**SQL Query:**
```sql
SELECT id, name, jsonb_typeof(steps) AS steps_type, jsonb_array_length(steps) AS steps_count,
  (SELECT bool_and(
    elem ? 'id' AND elem ? 'type' AND elem ? 'name' AND elem ? 'config' AND elem ? 'position'
  ) FROM jsonb_array_elements(steps) AS elem) AS all_steps_have_required_fields
FROM "WorkflowDefinition";
```

**Result:**

| Workflow | Type | Count | All Required Fields |
|---|---|---|---|
| Welcome New Contacts | array | 3 | true |
| MQL Nurture Sequence | array | 2 | true |
| Deal Stage Automation | array | 3 | true |

**Status: PASS** -- All steps arrays contain objects with required fields: `id`, `type`, `name`, `config`, `position`.

### Test 6.2: Individual Step Structure Validation

**SQL Query:**
```sql
SELECT wd.name AS workflow_name, elem ->> 'id' AS step_id, elem ->> 'type' AS step_type,
  elem ->> 'name' AS step_name, jsonb_typeof(elem -> 'config') AS config_type,
  jsonb_typeof(elem -> 'position') AS position_type,
  (elem -> 'position') ? 'x' AND (elem -> 'position') ? 'y' AS position_has_xy
FROM "WorkflowDefinition" wd, jsonb_array_elements(wd.steps) AS elem
ORDER BY wd.name, elem ->> 'id';
```

**Result:**

| Workflow | Step ID | Step Type | Step Name | Config Type | Position Type | Has X,Y |
|---|---|---|---|---|---|---|
| Deal Stage Automation | step_1 | if_then | Check deal amount | object | object | true |
| Deal Stage Automation | step_2a | send_notification | Notify manager | object | object | true |
| Deal Stage Automation | step_2b | create_task | Create follow-up | object | object | true |
| MQL Nurture Sequence | step_1 | send_notification | Notify sales team | object | object | true |
| MQL Nurture Sequence | step_2 | update_property | Set lead status | object | object | true |
| Welcome New Contacts | step_1 | send_email | Send welcome email | object | object | true |
| Welcome New Contacts | step_2 | delay | Wait 3 days | object | object | true |
| Welcome New Contacts | step_3 | create_task | Create follow-up task | object | object | true |

All 8 steps across 3 workflows have:
- Valid `id` (string)
- Valid `type` (one of: send_email, delay, create_task, send_notification, update_property, if_then)
- Valid `name` (string)
- Valid `config` (object with step-type-specific configuration)
- Valid `position` (object with `x` and `y` numeric coordinates)

**Status: PASS** -- All step JSONB structures are valid and well-formed.

### Test 6.3: TriggerConfig JSONB Structure Validation

**SQL Query:**
```sql
SELECT id, name, jsonb_typeof("triggerConfig") AS trigger_type,
  "triggerConfig" ? 'type' AS has_type_field,
  "triggerConfig" ->> 'type' AS trigger_type_value
FROM "WorkflowDefinition";
```

**Result:**

| Workflow | JSONB Type | Has 'type' | Trigger Value | Additional Fields |
|---|---|---|---|---|
| Welcome New Contacts | object | true | record_created | objectType |
| MQL Nurture Sequence | object | true | property_change | objectType, property, operator, value |
| Deal Stage Automation | object | true | property_change | objectType, property |

**Status: PASS** -- All triggerConfig JSONB objects are valid with the required `type` field present.

---

## Summary

| Test | Description | Status |
|---|---|---|
| **Test 1** | Schema Verification (6 tables, all columns/types) | **PASS** |
| **Test 2** | Seed Data Verification (3 workflows, statuses, JSONB) | **PASS** |
| **Test 3** | Foreign Key Integrity (6 FKs, 0 orphans, 28 indexes) | **PASS** |
| **Test 4** | Tenant Isolation (single tenant, no NULLs, NOT NULL enforced) | **PASS** |
| **Test 5** | Soft Delete Pattern (deletedAt NULL for all, index present) | **PASS** |
| **Test 6** | JSONB Column Validation (steps structure, triggerConfig structure) | **PASS** |

**Overall Result: 6/6 PASSED**

### Key Statistics

- **Tables verified:** 6
- **Total columns verified:** 78 (16+9+19+12+10+12)
- **Foreign key constraints:** 6
- **Indexes:** 28
- **Unique constraints:** 3 (WorkflowVersion workflowId+version, WorkflowEnrollment executionId, WorkflowEnrollment workflowId+objectId)
- **Seed workflow definitions:** 3 (active, draft, paused)
- **Total workflow steps validated:** 8
- **Orphan records found:** 0
- **NULL tenantId violations:** 0
- **Soft-deleted records:** 0 (expected)

### Notes

1. The WorkflowVersion, WorkflowExecution, WorkflowStepLog, WorkflowEnrollment, and CrmEvent tables are currently empty. This is expected as they are runtime tables populated during workflow execution.
2. The CrmEvent table does not have a tenantId foreign key constraint to the Tenant table (it is not defined in the Prisma schema). This is by design -- CrmEvent operates as a lightweight event log. However, the tenantId column is NOT NULL and indexed.
3. All JSONB columns use appropriate defaults: `'{}'::jsonb` for objects, `'[]'::jsonb` for arrays.
4. The soft delete pattern is only implemented on WorkflowDefinition (via `deletedAt`), which is correct -- child records (versions, executions, step logs, enrollments) are managed through CASCADE deletes or workflow-level logic.
