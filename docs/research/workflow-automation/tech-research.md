# Workflow Automation Engine - Technical Research

> **Project:** F-CORE (HubSpot CRM Clone)
> **Stack:** Next.js 16 + TypeScript + Prisma 7.x + PostgreSQL/Supabase + Tailwind CSS v4
> **Date:** 2026-02-08
> **Status:** Research Complete - Ready for Architecture Decision

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Workflow Engine Architecture Patterns](#2-workflow-engine-architecture-patterns)
3. [Job Queue & Execution - Technology Comparison](#3-job-queue--execution---technology-comparison)
4. [Database Schema Design](#4-database-schema-design)
5. [Trigger System Architecture](#5-trigger-system-architecture)
6. [Action Execution Patterns](#6-action-execution-patterns)
7. [Next.js Integration Strategy](#7-nextjs-integration-strategy)
8. [Performance & Scalability](#8-performance--scalability)
9. [Libraries & Dependencies](#9-libraries--dependencies)
10. [Recommended Architecture for F-CORE MVP](#10-recommended-architecture-for-f-core-mvp)

---

## 1. Executive Summary

This document researches the technical architecture for building a workflow automation engine similar to HubSpot's Workflows feature within F-CORE. The engine must support:

- **Trigger-based enrollment** (property changes, form submissions, schedule-based)
- **Multi-step action sequences** (send email, update property, create task, delay/wait)
- **Conditional branching** (if/then logic based on CRM data)
- **Parallel and sequential execution**
- **Audit trail and execution history**
- **Visual workflow builder UI**

### Key Decision: PostgreSQL-Native Approach

After thorough research, the recommended approach is a **PostgreSQL-native workflow engine** using:

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Job Queue | **Supabase Queues (pgmq)** | Native to our stack, zero infrastructure |
| Scheduling | **pg_cron** | Built into Supabase, handles scheduled triggers |
| State Machine | **Custom FSM with Zod** | Lightweight, type-safe, no heavy deps |
| Visual Builder | **React Flow (@xyflow/react)** | Industry standard for workflow UIs |
| Realtime Events | **Supabase Realtime + DB triggers** | Already in our stack |
| Workflow Definition | **JSONB in PostgreSQL** | Flexible, queryable, versionable |

This avoids adding Redis, Temporal clusters, or third-party SaaS dependencies.

---

## 2. Workflow Engine Architecture Patterns

### 2.1 State Machine (FSM) Pattern

A Finite State Machine models workflows as a series of states connected by transitions triggered by events.

**Concept:**
```
[Idle] --trigger--> [Running] --action_complete--> [Next Step] --all_done--> [Completed]
                         |                              |
                    error/timeout                  condition_false
                         |                              |
                         v                              v
                    [Failed]                      [Branch B]
```

**XState Example (for reference - NOT recommended for backend):**

```typescript
import { createMachine } from 'xstate';

const workflowMachine = createMachine({
  id: 'workflow',
  initial: 'idle',
  context: {
    currentStep: 0,
    enrolledRecord: null,
    executionLog: [],
  },
  states: {
    idle: {
      on: { TRIGGER: 'evaluating' }
    },
    evaluating: {
      on: {
        CONDITION_MET: 'executing',
        CONDITION_NOT_MET: 'skipped'
      }
    },
    executing: {
      on: {
        STEP_COMPLETE: [
          { target: 'executing', cond: 'hasMoreSteps' },
          { target: 'completed' }
        ],
        STEP_FAILED: 'retrying',
        DELAY_REQUIRED: 'waiting'
      }
    },
    waiting: {
      on: { RESUME: 'executing' }
    },
    retrying: {
      on: {
        RETRY_SUCCESS: 'executing',
        MAX_RETRIES: 'failed'
      }
    },
    completed: { type: 'final' },
    failed: { type: 'final' },
    skipped: { type: 'final' }
  }
});
```

**Assessment for F-CORE:**
- XState adds ~15KB to bundle, great for frontend visualization
- For backend workflow execution, a **custom lightweight FSM** is better (simpler, no dependency)
- XState's value is in the **visualizer** and **type-safe state definitions**

### 2.2 DAG (Directed Acyclic Graph) Execution Model

A DAG represents workflow steps as nodes and their dependencies as directed edges. This is the dominant pattern for workflow engines (Airflow, Temporal, Windmill).

**Core Algorithm:**

```typescript
// Simplified DAG executor
interface WorkflowNode {
  id: string;
  type: 'action' | 'condition' | 'delay' | 'branch';
  config: Record<string, unknown>;
  dependencies: string[];  // IDs of nodes that must complete first
}

interface WorkflowDAG {
  nodes: WorkflowNode[];
  edges: Array<{ from: string; to: string; condition?: string }>;
}

class DAGExecutor {
  private completed = new Set<string>();
  private failed = new Set<string>();

  // Kahn's algorithm for topological sort
  getReadyNodes(dag: WorkflowDAG): WorkflowNode[] {
    return dag.nodes.filter(node => {
      if (this.completed.has(node.id) || this.failed.has(node.id)) return false;
      return node.dependencies.every(dep => this.completed.has(dep));
    });
  }

  async execute(dag: WorkflowDAG): Promise<void> {
    let readyNodes = this.getReadyNodes(dag);

    while (readyNodes.length > 0) {
      // Execute independent nodes in parallel
      await Promise.allSettled(
        readyNodes.map(node => this.executeNode(node))
      );
      readyNodes = this.getReadyNodes(dag);
    }
  }

  private async executeNode(node: WorkflowNode): Promise<void> {
    try {
      await this.runAction(node);
      this.completed.add(node.id);
    } catch (error) {
      this.failed.add(node.id);
      throw error;
    }
  }
}
```

**Assessment for F-CORE:**
- DAG is the right model for HubSpot-style workflows
- Simple linear workflows are a special case of DAG (single path)
- Branching (if/then) creates forks in the DAG
- Parallel branches rejoin at merge points

### 2.3 Event-Driven Architecture with PostgreSQL

```
[CRM Event] --> [PostgreSQL Trigger] --> [NOTIFY channel]
                                              |
                                              v
                                    [Event Processor]
                                              |
                                    [Evaluate Workflow Triggers]
                                              |
                               [Enqueue Workflow Execution Jobs]
                                              |
                                    [Worker Processes Jobs]
```

**PostgreSQL LISTEN/NOTIFY Pattern:**

```sql
-- Create trigger function for property changes
CREATE OR REPLACE FUNCTION notify_property_change()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
BEGIN
  -- Build change object comparing OLD and NEW
  changes := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', NEW.id,
    'tenant_id', NEW."tenantId",
    'old_values', to_jsonb(OLD),
    'new_values', to_jsonb(NEW),
    'changed_at', now()
  );

  -- Send notification
  PERFORM pg_notify('crm_entity_changed', changes::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to CRM tables
CREATE TRIGGER contact_changes
  AFTER UPDATE ON "Contact"
  FOR EACH ROW
  EXECUTE FUNCTION notify_property_change();
```

---

## 3. Job Queue & Execution - Technology Comparison

### Comparison Matrix

| Feature | pg-boss | Supabase Queues (pgmq) | Inngest | Trigger.dev | Temporal | BullMQ |
|---------|---------|----------------------|---------|-------------|----------|--------|
| **Infrastructure** | PostgreSQL only | PostgreSQL only | Cloud SaaS | Cloud + Self-host | Self-host cluster | Redis required |
| **Serverless Compatible** | Partial (needs supervisor) | Yes | Yes (HTTP-based) | Yes | No | No |
| **Next.js Integration** | Manual | Native Supabase SDK | First-class | First-class | Moderate | Manual |
| **Delayed/Scheduled Jobs** | Yes | Via pg_cron | Yes (built-in) | Yes | Yes | Yes |
| **Retry Logic** | Yes | Manual | Yes (automatic) | Yes (automatic) | Yes | Yes |
| **Observability** | Basic logs | Dashboard | Full dashboard | Full dashboard | Full dashboard | Bull Board |
| **Cost** | Free (OSS) | Free (Supabase) | Free tier, then $25+/mo | Free tier, then $25+/mo | Free (self-host) | Free + Redis hosting |
| **Complexity** | Low | Low | Medium | Medium | High | Medium |
| **Long-running Jobs** | Yes | Yes | Yes (up to days) | Yes (no timeouts) | Yes (unlimited) | Yes |
| **Durable Execution** | No | No | Yes | Yes | Yes | No |
| **Fits Our Stack** | Good | **Excellent** | Good | Good | Poor | Poor |

### 3.1 Supabase Queues (pgmq) - RECOMMENDED for MVP

Supabase Queues is built on the `pgmq` extension, providing a native PostgreSQL message queue with exactly-once delivery.

**Why it fits F-CORE:**
- Already part of our Supabase infrastructure
- Zero additional services to deploy
- Transactional consistency with our CRM data
- Messages are durable (stored in PostgreSQL)
- Supports visibility timeout (prevents double processing)

**Usage Example:**

```typescript
// Send a workflow execution job to the queue
import { createClient } from '@supabase/supabase-js';

const queues = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'pgmq_public' }
});

// Enqueue a workflow execution
async function enqueueWorkflowExecution(
  workflowId: string,
  enrolledRecordId: string,
  triggerEvent: Record<string, unknown>
) {
  const { data, error } = await queues.rpc('send', {
    queue_name: 'workflow_executions',
    message: {
      workflow_id: workflowId,
      record_id: enrolledRecordId,
      trigger_event: triggerEvent,
      enqueued_at: new Date().toISOString(),
    },
  });
  return data; // Returns message ID
}

// Process workflow jobs (consumer)
async function processWorkflowJobs() {
  const { data: messages } = await queues.rpc('read', {
    queue_name: 'workflow_executions',
    visibility_timeout: 300, // 5 minutes
    qty: 5, // Process up to 5 jobs at once
  });

  for (const msg of messages ?? []) {
    try {
      await executeWorkflow(msg.message);
      // Mark as processed
      await queues.rpc('delete', {
        queue_name: 'workflow_executions',
        msg_id: msg.msg_id,
      });
    } catch (error) {
      // Message becomes visible again after timeout for retry
      console.error('Workflow execution failed:', error);
    }
  }
}
```

### 3.2 pg-boss - Strong Alternative

pg-boss is a mature PostgreSQL-native job queue for Node.js with built-in scheduling, retries, and job management.

**Strengths:**
- Battle-tested (used by hey.com processing millions of jobs/day)
- Built-in retry logic with exponential backoff
- Job scheduling (cron syntax)
- Dead letter queues
- Job throttling and rate limiting

**Serverless Limitation:**
pg-boss requires a persistent Node.js process for its supervisor. In serverless (Vercel), it can be used with `{ noSupervisor: true }` for enqueuing/dequeuing, with a separate maintenance process.

```typescript
import PgBoss from 'pg-boss';

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  noSupervisor: true, // For serverless
});

// Enqueue
await boss.send('workflow-execute', {
  workflowId: 'wf_123',
  recordId: 'contact_456',
  triggerData: { property: 'lifecycleStage', newValue: 'mql' }
});

// Consume (in a worker process)
await boss.work('workflow-execute', async (job) => {
  const { workflowId, recordId, triggerData } = job.data;
  await executeWorkflow(workflowId, recordId, triggerData);
});
```

### 3.3 Inngest - Best DX, Higher Cost

Inngest is a serverless workflow engine with the best developer experience for Next.js applications.

**Strengths:**
- Durable execution (survives crashes)
- Built-in step functions with automatic retry
- Event-driven (perfect for CRM events)
- `step.waitForEvent()` for human-in-the-loop workflows
- Full observability dashboard
- MCP integration for AI-assisted development

**When to choose Inngest:**
- If budget allows SaaS costs ($25+/mo for production)
- If you need complex multi-day workflows (email drip campaigns)
- If you want minimal custom infrastructure code

```typescript
// Inngest workflow example
import { inngest } from '@/lib/inngest';

export const onContactUpdated = inngest.createFunction(
  { id: 'contact-property-change-workflow' },
  { event: 'crm/contact.updated' },
  async ({ event, step }) => {
    // Step 1: Check enrollment criteria
    const shouldEnroll = await step.run('check-criteria', async () => {
      return event.data.changes.lifecycleStage === 'mql';
    });

    if (!shouldEnroll) return { status: 'skipped' };

    // Step 2: Send notification email
    await step.run('send-email', async () => {
      await sendEmail(event.data.contactId, 'mql_welcome');
    });

    // Step 3: Wait 3 days
    await step.sleep('wait-3-days', '3d');

    // Step 4: Create follow-up task
    await step.run('create-task', async () => {
      await createTask({
        contactId: event.data.contactId,
        type: 'follow_up',
        subject: 'Follow up with new MQL',
      });
    });

    return { status: 'completed' };
  }
);
```

### 3.4 Trigger.dev - Good for Compute-Heavy Tasks

Trigger.dev v3 runs your code on dedicated infrastructure, eliminating serverless timeouts.

**Key Differentiator:**
- No timeout limits (code runs as long as needed)
- Atomic versioning (deploys don't affect running jobs)
- Can install system packages (ffmpeg, Puppeteer)
- Good Supabase integration (database triggers -> Edge Functions -> tasks)

**Best for:** Video processing, heavy data imports, long-running AI tasks.
**Less ideal for:** Simple CRM workflow automation (overkill).

### 3.5 Temporal.io - Enterprise Grade, High Complexity

**Assessment:**
- Most powerful and reliable option
- Designed for mission-critical, long-running workflows
- Requires a dedicated Temporal cluster (2+ services)
- Steep learning curve (deterministic code requirement)
- Overkill for CRM workflow MVP

**Skip for MVP.** Consider for enterprise tier if workflows become mission-critical.

### 3.6 Decision Matrix

| Criteria | Weight | pgmq | pg-boss | Inngest | Trigger.dev |
|----------|--------|------|---------|---------|-------------|
| Stack fit (Supabase) | 25% | 10 | 7 | 7 | 7 |
| Zero infrastructure | 20% | 10 | 8 | 6 | 5 |
| Serverless compat | 15% | 9 | 6 | 10 | 9 |
| Developer experience | 15% | 7 | 7 | 10 | 9 |
| Observability | 10% | 6 | 5 | 10 | 9 |
| Cost | 10% | 10 | 10 | 5 | 5 |
| Scalability | 5% | 7 | 7 | 9 | 9 |
| **Weighted Score** | | **8.75** | **7.15** | **7.65** | **7.15** |

**Winner: Supabase Queues (pgmq)** for MVP, with potential upgrade path to Inngest for advanced features.

---

## 4. Database Schema Design

### 4.1 Workflow Definition Storage

The recommended approach uses a **hybrid model**: core metadata in normalized columns, workflow logic as JSONB.

```sql
-- ============================================
-- WORKFLOW DEFINITION
-- ============================================
CREATE TABLE workflow_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES "Tenant"(id),

  -- Metadata
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  object_type     VARCHAR(50) NOT NULL,  -- 'contact', 'company', 'deal'
  status          VARCHAR(20) DEFAULT 'draft',  -- draft, active, paused, archived
  version         INT DEFAULT 1,

  -- Trigger Configuration (JSONB for flexibility)
  trigger_config  JSONB NOT NULL DEFAULT '{}',
  /*
    Example trigger_config:
    {
      "type": "property_change",
      "objectType": "contact",
      "property": "lifecycleStage",
      "operator": "equals",
      "value": "mql",
      "re_enrollment": false
    }
  */

  -- Workflow Steps/Actions (JSONB DAG)
  steps           JSONB NOT NULL DEFAULT '[]',
  /*
    Example steps:
    [
      {
        "id": "step_1",
        "type": "send_email",
        "name": "Send welcome email",
        "config": { "templateId": "tpl_123" },
        "position": { "x": 250, "y": 100 },
        "next": ["step_2"]
      },
      {
        "id": "step_2",
        "type": "delay",
        "name": "Wait 3 days",
        "config": { "duration": 259200, "unit": "seconds" },
        "next": ["step_3"]
      },
      {
        "id": "step_3",
        "type": "if_then",
        "name": "Check email opened",
        "config": {
          "condition": {
            "property": "last_email_opened",
            "operator": "is_true"
          }
        },
        "next_true": ["step_4a"],
        "next_false": ["step_4b"]
      }
    ]
  */

  -- React Flow viewport state
  viewport        JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',

  -- Settings
  settings        JSONB DEFAULT '{}',
  /*
    {
      "enrollment_type": "once" | "multiple",
      "suppression_lists": [],
      "goal_criteria": {...},
      "notifications": { "on_error": true }
    }
  */

  -- Audit
  created_by      UUID REFERENCES "User"(id),
  updated_by      UUID REFERENCES "User"(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id)
);

CREATE INDEX idx_wf_tenant ON workflow_definitions(tenant_id);
CREATE INDEX idx_wf_status ON workflow_definitions(status);
CREATE INDEX idx_wf_object_type ON workflow_definitions(object_type);
CREATE INDEX idx_wf_trigger ON workflow_definitions USING GIN(trigger_config);
CREATE INDEX idx_wf_deleted ON workflow_definitions(deleted_at);


-- ============================================
-- WORKFLOW VERSION HISTORY
-- ============================================
CREATE TABLE workflow_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES workflow_definitions(id),
  version         INT NOT NULL,

  -- Snapshot of the workflow at this version
  trigger_config  JSONB NOT NULL,
  steps           JSONB NOT NULL,
  settings        JSONB NOT NULL DEFAULT '{}',

  -- Change metadata
  change_summary  TEXT,
  created_by      UUID REFERENCES "User"(id),
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(workflow_id, version)
);

CREATE INDEX idx_wfv_workflow ON workflow_versions(workflow_id);


-- ============================================
-- WORKFLOW EXECUTION (Run Instance)
-- ============================================
CREATE TABLE workflow_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  workflow_id     UUID NOT NULL REFERENCES workflow_definitions(id),
  workflow_version INT NOT NULL,

  -- Enrolled record
  object_type     VARCHAR(50) NOT NULL,
  object_id       UUID NOT NULL,

  -- Execution state
  status          VARCHAR(20) DEFAULT 'running',
  -- running, waiting, completed, failed, cancelled, timed_out
  current_step_id VARCHAR(100),

  -- Trigger context
  trigger_event   JSONB DEFAULT '{}',

  -- Step results accumulator
  step_results    JSONB DEFAULT '{}',
  /*
    {
      "step_1": { "status": "completed", "result": {...}, "completed_at": "..." },
      "step_2": { "status": "waiting", "resume_at": "..." }
    }
  */

  -- Error tracking
  error_message   TEXT,
  error_step_id   VARCHAR(100),
  retry_count     INT DEFAULT 0,
  max_retries     INT DEFAULT 3,

  -- Timing
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  next_step_at    TIMESTAMPTZ,  -- For delayed steps

  -- Audit
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wfe_tenant ON workflow_executions(tenant_id);
CREATE INDEX idx_wfe_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_wfe_status ON workflow_executions(status);
CREATE INDEX idx_wfe_object ON workflow_executions(object_type, object_id);
CREATE INDEX idx_wfe_next_step ON workflow_executions(next_step_at) WHERE status = 'waiting';
CREATE INDEX idx_wfe_created ON workflow_executions(created_at DESC);


-- ============================================
-- WORKFLOW STEP EXECUTION LOG
-- ============================================
CREATE TABLE workflow_step_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id    UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id         VARCHAR(100) NOT NULL,
  step_type       VARCHAR(50) NOT NULL,

  -- Execution details
  status          VARCHAR(20) NOT NULL,  -- started, completed, failed, skipped
  input_data      JSONB DEFAULT '{}',
  output_data     JSONB DEFAULT '{}',
  error_message   TEXT,

  -- Timing
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,

  -- For retries
  attempt         INT DEFAULT 1
);

CREATE INDEX idx_wfsl_execution ON workflow_step_logs(execution_id);
CREATE INDEX idx_wfsl_step ON workflow_step_logs(step_id);
CREATE INDEX idx_wfsl_status ON workflow_step_logs(status);


-- ============================================
-- WORKFLOW ENROLLMENT HISTORY
-- ============================================
CREATE TABLE workflow_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  workflow_id     UUID NOT NULL REFERENCES workflow_definitions(id),
  object_type     VARCHAR(50) NOT NULL,
  object_id       UUID NOT NULL,

  -- Enrollment details
  enrolled_at     TIMESTAMPTZ DEFAULT now(),
  enrolled_by     VARCHAR(50) DEFAULT 'trigger',  -- trigger, manual, api
  unenrolled_at   TIMESTAMPTZ,
  unenroll_reason VARCHAR(100),  -- completed, manual, goal_met, suppressed

  execution_id    UUID REFERENCES workflow_executions(id),

  CONSTRAINT unique_active_enrollment
    UNIQUE(workflow_id, object_id) -- Prevent duplicate active enrollments
);

CREATE INDEX idx_wfen_tenant ON workflow_enrollments(tenant_id);
CREATE INDEX idx_wfen_workflow ON workflow_enrollments(workflow_id);
CREATE INDEX idx_wfen_object ON workflow_enrollments(object_id);


-- ============================================
-- CRM EVENT LOG (for trigger evaluation)
-- ============================================
CREATE TABLE crm_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,

  -- Event details
  event_type      VARCHAR(50) NOT NULL,
  -- property_change, record_created, record_deleted,
  -- form_submission, email_opened, deal_stage_changed
  object_type     VARCHAR(50) NOT NULL,
  object_id       UUID NOT NULL,

  -- Change data
  property_name   VARCHAR(255),
  old_value       TEXT,
  new_value       TEXT,
  metadata        JSONB DEFAULT '{}',

  -- Source
  source          VARCHAR(50) DEFAULT 'system',  -- system, api, import, workflow
  source_id       VARCHAR(255),  -- e.g., workflow_id that caused the change

  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crmev_tenant ON crm_events(tenant_id);
CREATE INDEX idx_crmev_type ON crm_events(event_type);
CREATE INDEX idx_crmev_object ON crm_events(object_type, object_id);
CREATE INDEX idx_crmev_property ON crm_events(property_name);
CREATE INDEX idx_crmev_created ON crm_events(created_at DESC);

-- Partition by month for performance (optional, for scale)
-- CREATE TABLE crm_events (...) PARTITION BY RANGE (created_at);
```

### 4.2 Prisma Schema (for Prisma 7.x integration)

```prisma
// Workflow models to add to schema.prisma

model WorkflowDefinition {
  id            String    @id @default(uuid())
  tenantId      String
  name          String
  description   String?
  objectType    String    // contact, company, deal
  status        String    @default("draft")
  version       Int       @default(1)

  triggerConfig Json      @default("{}")
  steps         Json      @default("[]")
  viewport      Json      @default("{\"x\": 0, \"y\": 0, \"zoom\": 1}")
  settings      Json      @default("{}")

  createdBy     String?
  updatedBy     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  versions      WorkflowVersion[]
  executions    WorkflowExecution[]
  enrollments   WorkflowEnrollment[]

  @@index([tenantId])
  @@index([status])
  @@index([objectType])
  @@index([deletedAt])
  @@map("workflow_definitions")
}

model WorkflowVersion {
  id            String    @id @default(uuid())
  workflowId    String
  version       Int

  triggerConfig Json
  steps         Json
  settings      Json      @default("{}")
  changeSummary String?
  createdBy     String?
  createdAt     DateTime  @default(now())

  workflow      WorkflowDefinition @relation(fields: [workflowId], references: [id])

  @@unique([workflowId, version])
  @@index([workflowId])
  @@map("workflow_versions")
}

model WorkflowExecution {
  id              String    @id @default(uuid())
  tenantId        String
  workflowId      String
  workflowVersion Int

  objectType      String
  objectId        String

  status          String    @default("running")
  currentStepId   String?
  triggerEvent    Json      @default("{}")
  stepResults     Json      @default("{}")

  errorMessage    String?
  errorStepId     String?
  retryCount      Int       @default(0)
  maxRetries      Int       @default(3)

  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  nextStepAt      DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  workflow        WorkflowDefinition @relation(fields: [workflowId], references: [id])
  stepLogs        WorkflowStepLog[]
  enrollment      WorkflowEnrollment?

  @@index([tenantId])
  @@index([workflowId])
  @@index([status])
  @@index([objectType, objectId])
  @@map("workflow_executions")
}

model WorkflowStepLog {
  id            String    @id @default(uuid())
  executionId   String
  stepId        String
  stepType      String

  status        String    // started, completed, failed, skipped
  inputData     Json      @default("{}")
  outputData    Json      @default("{}")
  errorMessage  String?

  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  durationMs    Int?
  attempt       Int       @default(1)

  execution     WorkflowExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@index([executionId])
  @@index([stepId])
  @@map("workflow_step_logs")
}

model WorkflowEnrollment {
  id            String    @id @default(uuid())
  tenantId      String
  workflowId    String
  objectType    String
  objectId      String

  enrolledAt    DateTime  @default(now())
  enrolledBy    String    @default("trigger")
  unenrolledAt  DateTime?
  unenrollReason String?

  executionId   String?   @unique

  workflow      WorkflowDefinition @relation(fields: [workflowId], references: [id])
  execution     WorkflowExecution? @relation(fields: [executionId], references: [id])

  @@unique([workflowId, objectId])
  @@index([tenantId])
  @@index([workflowId])
  @@index([objectId])
  @@map("workflow_enrollments")
}

model CrmEvent {
  id            String    @id @default(uuid())
  tenantId      String

  eventType     String
  objectType    String
  objectId      String

  propertyName  String?
  oldValue      String?
  newValue      String?
  metadata      Json      @default("{}")

  source        String    @default("system")
  sourceId      String?

  createdAt     DateTime  @default(now())

  @@index([tenantId])
  @@index([eventType])
  @@index([objectType, objectId])
  @@index([propertyName])
  @@index([createdAt(sort: Desc)])
  @@map("crm_events")
}
```

### 4.3 Why Hybrid (Normalized + JSONB) is Best

| Approach | Pros | Cons |
|----------|------|------|
| **Fully Normalized** | Strong referential integrity, SQL joins | Extremely complex schema, rigid, slow schema changes |
| **Fully JSON** | Maximum flexibility, easy to evolve | Hard to query, no referential integrity, index limitations |
| **Hybrid (Recommended)** | Best of both worlds | Slightly more complex queries |

The hybrid approach keeps **metadata** (name, status, tenant_id, timestamps) in columns for fast filtering, while **workflow logic** (steps, triggers, conditions) lives in JSONB for flexibility.

PostgreSQL JSONB features that make this work:
- GIN indexes on JSONB columns for containment queries
- `jsonb_path_query()` for complex JSON navigation
- `@>` operator for containment checks
- Full ACID compliance on JSONB updates

---

## 5. Trigger System Architecture

### 5.1 Trigger Types (Mirroring HubSpot)

| Trigger Type | Implementation | Example |
|-------------|----------------|---------|
| **Property Change** | PostgreSQL trigger -> NOTIFY | Contact lifecycle stage changed to MQL |
| **Record Created** | PostgreSQL trigger on INSERT | New contact created |
| **Form Submission** | API endpoint event | Form XYZ submitted |
| **Deal Stage Change** | PostgreSQL trigger + check | Deal moved to "Proposal" |
| **Email Event** | Webhook from email provider | Email opened/clicked |
| **Schedule-Based** | pg_cron | Every Monday at 9 AM |
| **Manual** | API endpoint | User manually enrolls records |
| **Date Property** | pg_cron + query | 7 days before close date |

### 5.2 Property Change Detection

```typescript
// Database trigger approach (recommended)
// This PostgreSQL function fires on any CRM entity update

// SQL: Create the trigger
const createPropertyChangeTrigger = `
CREATE OR REPLACE FUNCTION track_property_changes()
RETURNS TRIGGER AS $$
DECLARE
  col_name TEXT;
  old_val TEXT;
  new_val TEXT;
  changes JSONB := '[]'::jsonb;
BEGIN
  -- Compare each column for changes
  FOR col_name IN
    SELECT column_name FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
    AND table_schema = TG_TABLE_SCHEMA
  LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col_name, col_name)
      INTO old_val, new_val USING OLD, NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      changes := changes || jsonb_build_object(
        'property', col_name,
        'oldValue', old_val,
        'newValue', new_val
      );

      -- Insert into CRM events log
      INSERT INTO crm_events (
        tenant_id, event_type, object_type, object_id,
        property_name, old_value, new_value
      ) VALUES (
        NEW."tenantId", 'property_change', TG_TABLE_NAME,
        NEW.id, col_name, old_val, new_val
      );
    END IF;
  END LOOP;

  -- Notify workflow engine if changes detected
  IF jsonb_array_length(changes) > 0 THEN
    PERFORM pg_notify('workflow_trigger', jsonb_build_object(
      'event_type', 'property_change',
      'object_type', TG_TABLE_NAME,
      'object_id', NEW.id,
      'tenant_id', NEW."tenantId",
      'changes', changes
    )::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;
```

### 5.3 Scheduled Triggers with pg_cron

```sql
-- Schedule a cron job to check for date-based triggers
SELECT cron.schedule(
  'check-date-triggers',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-app.com/api/workflows/check-date-triggers',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Or use Supabase Edge Functions
SELECT cron.schedule(
  'workflow-maintenance',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/workflow-maintenance',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### 5.4 Supabase Realtime for Live Monitoring

```typescript
// Listen for real-time workflow execution updates
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to workflow execution status changes
const channel = supabase
  .channel('workflow-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'workflow_executions',
      filter: `tenant_id=eq.${tenantId}`,
    },
    (payload) => {
      console.log('Execution updated:', payload.new);
      // Update UI in real-time
    }
  )
  .subscribe();
```

---

## 6. Action Execution Patterns

### 6.1 Action Types

```typescript
// Type definitions for workflow actions
type WorkflowActionType =
  | 'send_email'
  | 'send_internal_notification'
  | 'create_task'
  | 'update_property'
  | 'delay'
  | 'if_then'
  | 'webhook'
  | 'enroll_in_workflow'
  | 'unenroll_from_workflow'
  | 'set_owner'
  | 'create_deal'
  | 'copy_property'
  | 'math_operation';

interface WorkflowStep {
  id: string;
  type: WorkflowActionType;
  name: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };  // For React Flow
  next?: string[];           // Next step IDs (linear flow)
  nextTrue?: string[];       // For if/then branches
  nextFalse?: string[];      // For if/then branches
}
```

### 6.2 Sequential vs. Parallel Execution

```typescript
// Workflow execution engine
class WorkflowEngine {
  async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<StepResult> {
    const handler = this.getHandler(step.type);

    // Log step start
    const logEntry = await this.logStepStart(execution.id, step);

    try {
      const result = await handler.execute(step.config, {
        execution,
        previousResults: execution.stepResults,
        record: await this.getRecord(execution.objectType, execution.objectId),
      });

      // Log success
      await this.logStepComplete(logEntry.id, result);

      // Determine next steps
      return this.resolveNextSteps(step, result);
    } catch (error) {
      await this.handleStepError(execution, step, logEntry.id, error);
      throw error;
    }
  }

  private resolveNextSteps(
    step: WorkflowStep,
    result: StepResult
  ): StepResult {
    if (step.type === 'if_then') {
      return {
        ...result,
        nextSteps: result.conditionMet ? step.nextTrue : step.nextFalse,
      };
    }

    if (step.type === 'delay') {
      return {
        ...result,
        delayUntil: new Date(Date.now() + step.config.duration * 1000),
        nextSteps: step.next,
      };
    }

    return { ...result, nextSteps: step.next };
  }
}
```

### 6.3 Delay/Wait Implementation

```typescript
// Delays are implemented as scheduled queue messages
async function handleDelay(
  execution: WorkflowExecution,
  step: WorkflowStep
): Promise<void> {
  const resumeAt = new Date(Date.now() + step.config.duration * 1000);

  // Update execution status
  await prisma.workflowExecution.update({
    where: { id: execution.id },
    data: {
      status: 'waiting',
      currentStepId: step.id,
      nextStepAt: resumeAt,
    },
  });

  // Schedule resume job via pg_cron or Supabase Queue with delay
  // Option A: Using Supabase Queues with visibility timeout
  await queues.rpc('send', {
    queue_name: 'workflow_resume',
    message: {
      execution_id: execution.id,
      step_id: step.id,
      resume_at: resumeAt.toISOString(),
    },
    delay: step.config.duration, // Delay in seconds
  });
}

// Cron job to process delayed workflows (fallback)
// Runs every minute via pg_cron
async function processDelayedWorkflows() {
  const readyExecutions = await prisma.workflowExecution.findMany({
    where: {
      status: 'waiting',
      nextStepAt: { lte: new Date() },
    },
    take: 50,
  });

  for (const execution of readyExecutions) {
    await enqueueWorkflowResume(execution.id);
  }
}
```

### 6.4 Error Handling and Retry Strategy

```typescript
// Retry configuration per action type
const RETRY_CONFIG: Record<WorkflowActionType, RetryConfig> = {
  send_email: { maxRetries: 3, backoff: 'exponential', initialDelay: 5000 },
  webhook: { maxRetries: 5, backoff: 'exponential', initialDelay: 1000 },
  update_property: { maxRetries: 2, backoff: 'fixed', initialDelay: 1000 },
  create_task: { maxRetries: 2, backoff: 'fixed', initialDelay: 1000 },
  delay: { maxRetries: 0, backoff: 'none', initialDelay: 0 },
  if_then: { maxRetries: 1, backoff: 'fixed', initialDelay: 500 },
};

async function executeWithRetry(
  step: WorkflowStep,
  context: ExecutionContext,
  config: RetryConfig
): Promise<StepResult> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await executeAction(step, context);
    } catch (error) {
      lastError = error as Error;

      if (attempt <= config.maxRetries) {
        const delay = calculateBackoff(config, attempt);
        await sleep(delay);

        // Log retry attempt
        await prisma.workflowStepLog.create({
          data: {
            executionId: context.execution.id,
            stepId: step.id,
            stepType: step.type,
            status: 'retrying',
            attempt,
            errorMessage: lastError.message,
          },
        });
      }
    }
  }

  throw lastError!;
}

function calculateBackoff(config: RetryConfig, attempt: number): number {
  switch (config.backoff) {
    case 'exponential':
      return config.initialDelay * Math.pow(2, attempt - 1);
    case 'fixed':
      return config.initialDelay;
    default:
      return 0;
  }
}
```

### 6.5 Idempotency Patterns

```typescript
// Ensure workflow actions are idempotent
async function executeActionIdempotently(
  executionId: string,
  stepId: string,
  attempt: number,
  action: () => Promise<unknown>
): Promise<unknown> {
  // Generate deterministic idempotency key
  const idempotencyKey = `wf:${executionId}:${stepId}:${attempt}`;

  // Check if already executed
  const existing = await prisma.workflowStepLog.findFirst({
    where: {
      executionId,
      stepId,
      attempt,
      status: 'completed',
    },
  });

  if (existing) {
    return existing.outputData;
  }

  // Execute with idempotency key passed to external services
  return action();
}
```

---

## 7. Next.js Integration Strategy

### 7.1 API Routes as Action Handlers

```typescript
// src/app/api/workflows/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow/engine';
import { validateTenantAccess } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { workflowId, recordId, triggerEvent } = await request.json();

  const tenantId = await validateTenantAccess(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const engine = new WorkflowEngine();

  try {
    const execution = await engine.startExecution({
      tenantId,
      workflowId,
      recordId,
      triggerEvent,
    });

    return NextResponse.json({ executionId: execution.id, status: 'started' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    );
  }
}
```

### 7.2 Server Actions for Workflow Management

```typescript
// src/app/(dashboard)/workflows/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { workflowDefinitionSchema } from '@/lib/workflow/schemas';

export async function createWorkflow(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  const data = workflowDefinitionSchema.parse({
    name: formData.get('name'),
    objectType: formData.get('objectType'),
    description: formData.get('description'),
  });

  const workflow = await prisma.workflowDefinition.create({
    data: {
      ...data,
      tenantId: session.user.tenantId,
      createdBy: session.user.id,
    },
  });

  return workflow;
}

export async function updateWorkflowSteps(
  workflowId: string,
  steps: unknown[],
  viewport: { x: number; y: number; zoom: number }
) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  // Validate steps with Zod
  const validatedSteps = workflowStepsSchema.parse(steps);

  // Save version before update
  const current = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
  });

  if (current) {
    await prisma.workflowVersion.create({
      data: {
        workflowId,
        version: current.version,
        triggerConfig: current.triggerConfig as any,
        steps: current.steps as any,
        settings: current.settings as any,
        createdBy: session.user.id,
      },
    });
  }

  // Update workflow
  return prisma.workflowDefinition.update({
    where: { id: workflowId },
    data: {
      steps: validatedSteps as any,
      viewport: viewport as any,
      version: { increment: 1 },
      updatedBy: session.user.id,
    },
  });
}

export async function activateWorkflow(workflowId: string) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  return prisma.workflowDefinition.update({
    where: {
      id: workflowId,
      tenantId: session.user.tenantId,
    },
    data: { status: 'active' },
  });
}
```

### 7.3 Supabase Edge Functions as Event Processors

```typescript
// supabase/functions/workflow-trigger-processor/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js';

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const event = await req.json();

  // Find matching active workflows
  const { data: workflows } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('tenant_id', event.tenant_id)
    .eq('status', 'active')
    .eq('object_type', event.object_type);

  for (const workflow of workflows ?? []) {
    const triggerConfig = workflow.trigger_config;

    if (evaluateTrigger(triggerConfig, event)) {
      // Enqueue workflow execution
      const queues = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { db: { schema: 'pgmq_public' } }
      );

      await queues.rpc('send', {
        queue_name: 'workflow_executions',
        message: {
          workflow_id: workflow.id,
          record_id: event.object_id,
          trigger_event: event,
        },
      });
    }
  }

  return new Response(JSON.stringify({ processed: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function evaluateTrigger(
  config: TriggerConfig,
  event: CrmEvent
): boolean {
  switch (config.type) {
    case 'property_change':
      return event.changes?.some(
        (c: any) =>
          c.property === config.property &&
          evaluateCondition(c.newValue, config.operator, config.value)
      );
    case 'record_created':
      return event.event_type === 'record_created';
    default:
      return false;
  }
}
```

### 7.4 Architecture Diagram

```
                    +-----------------+
                    |   React Flow    |
                    | Visual Builder  |
                    +--------+--------+
                             |
                    +--------v--------+
                    |   Next.js App   |
                    | Server Actions  |
                    | API Routes      |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v------+  +---v---+  +-------v--------+
     | Prisma ORM    |  | Zod   |  | Supabase SDK   |
     | (Read/Write)  |  | Valid  |  | (Realtime/Queue)|
     +--------+------+  +-------+  +-------+--------+
              |                             |
     +--------v-----------------------------v--------+
     |              PostgreSQL / Supabase             |
     |                                                |
     | +------------------+  +---------------------+  |
     | | CRM Tables       |  | Workflow Tables     |  |
     | | Contact, Company |  | Definitions         |  |
     | | Deal, Activity   |  | Executions          |  |
     | +--------+---------+  | Step Logs           |  |
     |          |             | CRM Events          |  |
     |  +-------v---------+  +----------+----------+  |
     |  | DB Triggers     |             |              |
     |  | NOTIFY channel  |  +----------v----------+  |
     |  +-------+---------+  | pgmq (Queues)       |  |
     |          |             | workflow_executions  |  |
     |  +-------v---------+  | workflow_resume      |  |
     |  | pg_cron         |  +----------+----------+  |
     |  | Schedule-based  |             |              |
     |  +-----------------+  +----------v----------+  |
     |                       | Edge Functions       |  |
     |                       | (Action Executors)   |  |
     |                       +---------------------+  |
     +------------------------------------------------+
```

---

## 8. Performance & Scalability

### 8.1 Rate Limiting

```typescript
// Rate limit workflow executions per tenant
const RATE_LIMITS = {
  free: { maxExecutionsPerHour: 100, maxActiveWorkflows: 5 },
  starter: { maxExecutionsPerHour: 1000, maxActiveWorkflows: 20 },
  professional: { maxExecutionsPerHour: 10000, maxActiveWorkflows: 100 },
  enterprise: { maxExecutionsPerHour: 100000, maxActiveWorkflows: 500 },
};

async function checkRateLimit(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  const limits = RATE_LIMITS[tenant!.plan as keyof typeof RATE_LIMITS];

  const recentCount = await prisma.workflowExecution.count({
    where: {
      tenantId,
      startedAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
    },
  });

  return recentCount < limits.maxExecutionsPerHour;
}
```

### 8.2 Batch Processing for Bulk Enrollments

```typescript
// Process enrollments in batches to avoid overwhelming the queue
async function bulkEnrollRecords(
  workflowId: string,
  recordIds: string[],
  batchSize: number = 50
): Promise<void> {
  for (let i = 0; i < recordIds.length; i += batchSize) {
    const batch = recordIds.slice(i, i + batchSize);

    // Enqueue batch
    const messages = batch.map(recordId => ({
      workflow_id: workflowId,
      record_id: recordId,
      trigger_event: { type: 'manual_enrollment' },
    }));

    // Send batch to queue
    for (const msg of messages) {
      await queues.rpc('send', {
        queue_name: 'workflow_executions',
        message: msg,
      });
    }

    // Small delay between batches to prevent queue flooding
    await sleep(100);
  }
}
```

### 8.3 Caching Workflow Definitions

```typescript
// Cache active workflow definitions in memory
// (Next.js server-side, refreshed on changes)

import { unstable_cache } from 'next/cache';

const getActiveWorkflows = unstable_cache(
  async (tenantId: string, objectType: string) => {
    return prisma.workflowDefinition.findMany({
      where: {
        tenantId,
        objectType,
        status: 'active',
        deletedAt: null,
      },
    });
  },
  ['active-workflows'],
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ['workflows'],
  }
);

// Invalidate cache when workflow is updated
import { revalidateTag } from 'next/cache';

export async function onWorkflowUpdated() {
  revalidateTag('workflows');
}
```

### 8.4 Execution History Pagination

```typescript
// Cursor-based pagination for execution history
async function getExecutionHistory(
  workflowId: string,
  cursor?: string,
  limit: number = 25
) {
  return prisma.workflowExecution.findMany({
    where: { workflowId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // Fetch one extra to check if there's more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    include: {
      stepLogs: {
        orderBy: { startedAt: 'asc' },
      },
    },
  });
}
```

---

## 9. Libraries & Dependencies

### 9.1 Recommended Dependencies

```json
{
  "dependencies": {
    // Visual Workflow Builder
    "@xyflow/react": "^12.x",          // React Flow for visual editor

    // Validation
    "zod": "^3.x",                      // Workflow definition validation

    // Date/Time (for delay calculations)
    "date-fns": "^3.x",                // Lightweight date utilities

    // Already in stack
    "@prisma/client": "^7.x",          // Database ORM
    "@supabase/supabase-js": "^2.x",   // Supabase client (queues, realtime)
  },
  "devDependencies": {
    // Testing
    "vitest": "^2.x",                  // Test runner
  }
}
```

### 9.2 React Flow (@xyflow/react) - Visual Builder

React Flow is the industry standard for building interactive node-based editors in React. It is used by Vercel's Workflow Builder, Stripe, and many other production applications.

**Key features for F-CORE:**
- Drag-and-drop nodes
- Custom node components (action steps, conditions, delays)
- Edge routing with labels
- Minimap and zoom controls
- Undo/redo with state management
- Export/import as JSON
- Mobile responsive

**Example: Custom Workflow Node**

```tsx
// src/components/workflow/nodes/ActionNode.tsx
import { Handle, Position, NodeProps } from '@xyflow/react';

interface ActionNodeData {
  label: string;
  type: WorkflowActionType;
  icon: React.ReactNode;
  config: Record<string, unknown>;
}

export function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  return (
    <div className={cn(
      'px-4 py-3 rounded-lg border-2 bg-white shadow-sm min-w-[200px]',
      selected ? 'border-cyan-500' : 'border-gray-200',
    )}>
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-cyan-50 text-cyan-600">
          {data.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{data.label}</p>
          <p className="text-xs text-gray-500">{data.type}</p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Example: Workflow Builder Page**

```tsx
// src/app/(dashboard)/workflows/[id]/builder/page.tsx
'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ActionNode } from '@/components/workflow/nodes/ActionNode';
import { ConditionNode } from '@/components/workflow/nodes/ConditionNode';
import { DelayNode } from '@/components/workflow/nodes/DelayNode';
import { TriggerNode } from '@/components/workflow/nodes/TriggerNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};

export default function WorkflowBuilderPage({
  params
}: {
  params: { id: string }
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div className="h-[calc(100vh-64px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### 9.3 Zod Schemas for Workflow Validation

```typescript
// src/lib/workflow/schemas.ts
import { z } from 'zod';

// Trigger configuration schema
export const triggerConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('property_change'),
    objectType: z.enum(['contact', 'company', 'deal']),
    property: z.string().min(1),
    operator: z.enum(['equals', 'not_equals', 'contains', 'is_known', 'is_unknown',
                       'greater_than', 'less_than']),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    reEnrollment: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('record_created'),
    objectType: z.enum(['contact', 'company', 'deal']),
  }),
  z.object({
    type: z.literal('form_submission'),
    formId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('schedule'),
    cron: z.string(),  // Cron expression
    timezone: z.string().default('UTC'),
  }),
  z.object({
    type: z.literal('manual'),
  }),
]);

// Step configuration schema
export const workflowStepSchema = z.object({
  id: z.string(),
  type: z.enum([
    'send_email', 'send_internal_notification', 'create_task',
    'update_property', 'delay', 'if_then', 'webhook',
    'enroll_in_workflow', 'unenroll_from_workflow',
    'set_owner', 'create_deal', 'copy_property', 'math_operation',
  ]),
  name: z.string().min(1).max(255),
  config: z.record(z.unknown()),
  position: z.object({ x: z.number(), y: z.number() }),
  next: z.array(z.string()).optional(),
  nextTrue: z.array(z.string()).optional(),
  nextFalse: z.array(z.string()).optional(),
});

export const workflowStepsSchema = z.array(workflowStepSchema);

// Full workflow definition schema
export const workflowDefinitionSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  objectType: z.enum(['contact', 'company', 'deal']),
  triggerConfig: triggerConfigSchema.optional(),
  steps: workflowStepsSchema.default([]),
  settings: z.object({
    enrollmentType: z.enum(['once', 'multiple']).default('once'),
    suppressionLists: z.array(z.string()).default([]),
    goalCriteria: z.record(z.unknown()).optional(),
    notifications: z.object({
      onError: z.boolean().default(true),
      onComplete: z.boolean().default(false),
    }).default({}),
  }).default({}),
});
```

---

## 10. Recommended Architecture for F-CORE MVP

### 10.1 MVP Scope (Sprint N - Workflows)

| Feature | Priority | Complexity |
|---------|----------|------------|
| Workflow CRUD (create, read, update, delete) | P0 | Low |
| Visual workflow builder (React Flow) | P0 | Medium |
| Property change triggers | P0 | Medium |
| Basic actions (update property, create task, send notification) | P0 | Medium |
| Delay/wait steps | P1 | Medium |
| If/then branching | P1 | Medium |
| Execution history & logs | P1 | Low |
| Send email action | P1 | Medium |
| Manual enrollment | P2 | Low |
| Schedule-based triggers | P2 | Low |
| Webhook action | P2 | Low |
| Bulk enrollment | P2 | Medium |
| Workflow version history | P3 | Low |
| Goal-based unenrollment | P3 | Medium |

### 10.2 Recommended Tech Stack

```
+------------------------------------------------------+
|  FRONTEND                                            |
|  React Flow (@xyflow/react) - Visual Builder         |
|  Zod - Client-side validation                        |
|  Zustand/React Context - Builder state management    |
+------------------------------------------------------+
         |
+------------------------------------------------------+
|  BACKEND (Next.js)                                   |
|  Server Actions - Workflow CRUD                      |
|  API Routes - Workflow execution endpoints           |
|  Prisma 7.x - Database access                       |
+------------------------------------------------------+
         |
+------------------------------------------------------+
|  EXECUTION ENGINE                                    |
|  Custom DAG executor (TypeScript)                    |
|  Supabase Queues (pgmq) - Job processing             |
|  pg_cron - Scheduled triggers & delay processing     |
|  PostgreSQL triggers - Property change detection     |
+------------------------------------------------------+
         |
+------------------------------------------------------+
|  DATA LAYER (PostgreSQL / Supabase)                  |
|  workflow_definitions - JSONB workflow storage        |
|  workflow_executions - Runtime state                  |
|  workflow_step_logs - Audit trail                     |
|  crm_events - Event sourcing for triggers            |
|  Supabase Realtime - Live execution monitoring       |
+------------------------------------------------------+
```

### 10.3 Implementation Phases

**Phase 1: Foundation (Week 1-2)**
1. Add Prisma models for workflow tables
2. Create migration and seed data
3. Build workflow CRUD API routes & Server Actions
4. Set up Supabase Queues (pgmq)

**Phase 2: Visual Builder (Week 2-3)**
1. Install and configure React Flow
2. Build custom node components (Trigger, Action, Condition, Delay)
3. Implement drag-and-drop step palette
4. Add workflow save/load with JSONB storage
5. Build step configuration panels

**Phase 3: Execution Engine (Week 3-4)**
1. Build DAG executor with step resolution
2. Implement action handlers (update_property, create_task, send_notification)
3. Add PostgreSQL triggers for property change detection
4. Build CRM event logging
5. Implement trigger evaluation engine

**Phase 4: Advanced Features (Week 4-5)**
1. Delay/wait step implementation with pg_cron
2. If/then branching with condition evaluation
3. Execution history UI with real-time updates
4. Retry logic and error handling
5. Rate limiting per tenant plan

### 10.4 File Structure

```
src/
  lib/
    workflow/
      engine.ts                 # Core DAG execution engine
      trigger-evaluator.ts      # Evaluate trigger conditions
      action-handlers/
        index.ts                # Action handler registry
        update-property.ts      # Update CRM property
        create-task.ts          # Create activity/task
        send-email.ts           # Send email action
        send-notification.ts    # Internal notification
        delay.ts                # Delay/wait handler
        webhook.ts              # HTTP webhook action
      schemas.ts                # Zod validation schemas
      types.ts                  # TypeScript types
      constants.ts              # Action types, status enums
  app/
    (dashboard)/
      workflows/
        page.tsx                # Workflow list page
        [id]/
          page.tsx              # Workflow detail/edit page
          builder/
            page.tsx            # Visual workflow builder
        actions.ts              # Server Actions
    api/
      workflows/
        route.ts                # Workflow CRUD
        [id]/
          route.ts              # Single workflow operations
          execute/
            route.ts            # Manual execution trigger
        process/
          route.ts              # Queue consumer endpoint
        triggers/
          check/
            route.ts            # Check date-based triggers
  components/
    workflow/
      WorkflowBuilder.tsx       # Main builder component
      WorkflowCanvas.tsx        # React Flow canvas
      StepPalette.tsx           # Drag-and-drop step sidebar
      StepConfigPanel.tsx       # Step configuration form
      ExecutionHistory.tsx      # Execution log viewer
      nodes/
        TriggerNode.tsx
        ActionNode.tsx
        ConditionNode.tsx
        DelayNode.tsx
        BranchMergeNode.tsx
```

### 10.5 Upgrade Path

| When | Upgrade To | Why |
|------|-----------|-----|
| > 10K executions/hour | Add pg-boss for better queue management | Better retry, throttling |
| Need multi-day workflows | Add Inngest | Durable execution, step.sleep for days |
| Enterprise customers | Evaluate Temporal | Mission-critical reliability |
| Complex AI workflows | Add Trigger.dev | No timeouts, system packages |

---

## Appendix A: Reference Projects

| Project | URL | Notes |
|---------|-----|-------|
| Vercel Workflow Builder | Open-source Next.js template | Production-ready visual builder |
| shadcn-next-workflows | github.com/nobruf/shadcn-next-workflows | React Flow + Next.js + shadcn/ui |
| JAWE (Just Another Workflow Engine) | github.com/alfonsograziano/jawe | TypeScript DAG engine (educational) |
| dag-workflow | github.com/NoteProtocol/dag-workflow | DAG task scheduling in TypeScript |
| React Flow Pro Templates | reactflow.dev/ui/templates/workflow-editor | Commercial workflow editor template |

## Appendix B: HubSpot Workflow Feature Parity

| HubSpot Feature | F-CORE MVP | F-CORE v2 |
|----------------|------------|-----------|
| Contact-based workflows | Yes | Yes |
| Company-based workflows | Yes | Yes |
| Deal-based workflows | Yes | Yes |
| Property change triggers | Yes | Yes |
| Form submission triggers | No | Yes |
| Schedule-based triggers | No | Yes |
| If/then branches | Yes | Yes |
| Delay steps | Yes | Yes |
| Send email | Yes | Yes |
| Update property | Yes | Yes |
| Create task | Yes | Yes |
| Send notification | Yes | Yes |
| Webhook action | No | Yes |
| Goal criteria | No | Yes |
| Suppression lists | No | Yes |
| A/B testing in workflows | No | v3 |
| Workflow templates | No | Yes |
| Enrollment history | Yes | Yes |
| Re-enrollment | No | Yes |

---

*Research completed: 2026-02-08*
*Next step: Architecture Decision Record (ADR) and Sprint planning*
