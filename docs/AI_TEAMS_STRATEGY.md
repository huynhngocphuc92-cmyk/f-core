# AI Teams Orchestration Strategy
> Version: 1.0
> Project: F-CORE (HubSpot CRM Clone)
> Created: 2026-02-07
> Purpose: 3-Team AI workflow for structured feature development

---

## I. ARCHITECTURE OVERVIEW

```
                    USER (Feature Request)
                           |
                           v
              +----------------------------+
              |       ORCHESTRATOR         |
              |   (Main Claude Session)    |
              |   - TaskCreate/Update      |
              |   - Gate evaluation        |
              |   - Loop control           |
              +------------+---------------+
                           |
         +-----------------+-----------------+
         v                 v                 v
  +-----------+     +-----------+     +-----------+
  |  TEAM 1   |     |  TEAM 2   |     |  TEAM 3   |
  |  RESEARCH | --> | EXECUTION | --> |  TESTING  |
  |           |     |           |     |           |
  | Lead +    |     | Tech Lead |     | QA Lead + |
  | 3 Analysts|     | + 4 Eng   |     | 3 Testers |
  +-----------+     +-----+-----+     +-----+-----+
                          |                 |
                          +--- FIX LOOP ----+
                          (max 3 cycles)
```

### Flow Summary
1. **User** submits feature request
2. **Orchestrator** creates task plan with dependencies
3. **Team 1** researches → produces `docs/research/{feature}/`
4. **Gate 1** validates research completeness
5. **Team 2** builds → produces source code + `docs/plans/{feature}/`
6. **Gate 2** validates code quality (build, lint, security)
7. **Team 3** tests → produces `docs/test-reports/{feature}/`
8. **Gate 3** validates final quality
9. If Gate 3 fails → **Fix Loop** (max 3 cycles)
10. If Gate 3 passes → **Git Commit & PR**

---

## II. TEAM DEFINITIONS

### Team 1 - Research Team

| Role | Agent Type | Tools | Responsibilities |
|------|-----------|-------|-----------------|
| **Research Director** (Lead) | Task(Plan) | sequential-thinking, memory | Split tasks, synthesize findings, write research-summary.md |
| **Competitive Analyst** | Task(Explore) | tavily, apify-ultimate-scraper | Analyze HubSpot, Salesforce, Pipedrive UI/features |
| **UX Analyst** | Task(general-purpose) | ux-researcher-designer, tavily | User flows, interaction patterns, wireframes |
| **Tech Researcher** | Task(Explore) | tavily, sequential-thinking | Architecture options, libraries, performance patterns |

**Execution**: Competitive + UX + Tech researchers run in **parallel** (3 Task calls in 1 message). Research Director synthesizes after all complete.

**Outputs** (`docs/research/{feature-name}/`):

| File | Content |
|------|---------|
| `competitive-analysis.md` | 3+ competitor feature comparisons, screenshots descriptions, key differentiators |
| `ux-patterns.md` | User flows, interaction patterns, accessibility considerations |
| `tech-research.md` | Recommended approach, libraries, architecture patterns |
| `research-summary.md` | Synthesized findings, key decisions, recommended direction |

---

### Team 2 - Execution Team

| Role | Agent Type | Tools | Responsibilities |
|------|-----------|-------|-----------------|
| **Tech Lead** | Task(Plan) | sequential-thinking, filesystem | Read research, create implementation-plan.md |
| **Database Engineer** | Task(Bash) | hubspot-db, filesystem | Prisma schema, migrations, seed data |
| **Backend Developer** | Task(general-purpose) | filesystem, hubspot-db | API routes, Zod validation, tenant_id checks |
| **Frontend Developer** | Task(general-purpose) | implement-design, filesystem | React components, pages, hooks |
| **UI/UX Designer** | Task(general-purpose) | tailwind-design-system, vercel-react-best-practices | Design system compliance, responsive polish |

**Execution Order** (sequential with parallel where possible):
1. Tech Lead creates `implementation-plan.md` (sequential)
2. Database Engineer updates schema & runs migrations (sequential)
3. Backend Developer + Frontend Developer work in **parallel** (after schema ready)
4. UI/UX Designer polishes (after frontend components exist)

**Outputs**:
- Source code in `src/`
- `docs/plans/{feature-name}/implementation-plan.md`

---

### Team 3 - Testing Team

| Role | Agent Type | Tools | Responsibilities |
|------|-----------|-------|-----------------|
| **QA Lead** | Task(Plan) | sequential-thinking, filesystem | Test plan, synthesize results, write test-summary.md |
| **E2E Tester** | Task(general-purpose) | browser-use | CRUD flows, responsive testing, error states |
| **Data Tester** | Task(general-purpose) | hubspot-db | Data integrity, tenant isolation, soft delete verification |
| **Code Reviewer** | Task(Explore) | filesystem (read-only) | TypeScript strictness, security review, design system compliance |

**Execution**: E2E + Data + Code Review run in **parallel**. QA Lead synthesizes.

**Outputs** (`docs/test-reports/{feature-name}/`):

| File | Content |
|------|---------|
| `e2e-report.md` | Test cases, pass/fail results, error screenshots descriptions |
| `data-integrity-report.md` | Orphan record check, tenant isolation, soft delete verification |
| `code-review.md` | TypeScript issues, security concerns, design compliance |
| `test-summary.md` | Overall verdict (PASS/FAIL), bug list, recommendations |

---

## III. QUALITY GATES

### Gate 1: Research Completeness

**Evaluator**: Orchestrator reads all 4 research files

| Criteria | How to Check |
|----------|-------------|
| `competitive-analysis.md` exists with >= 3 competitor references | Read file, count competitors |
| `ux-patterns.md` has user flow descriptions | Read file, verify flow diagrams/descriptions |
| `tech-research.md` has recommended approach | Read file, verify recommendation section |
| `research-summary.md` synthesizes all findings | Read file, verify cross-references |
| Key decisions stored in Memory MCP | Check memory for feature entity |

**If FAIL**: Orchestrator identifies gaps and sends back to specific researcher.

---

### Gate 2: Code Quality

**Evaluator**: Orchestrator runs automated checks

| Criteria | Command / Method |
|----------|-----------------|
| TypeScript compiles | `npx tsc --noEmit` |
| Next.js builds | `npx next build` |
| No ESLint errors | `npx eslint src/ --ext .ts,.tsx` |
| Every API route has `tenant_id` check | Grep for routes without tenant_id |
| Soft delete pattern used (no hard DELETE) | Grep for DELETE without `deleted_at` |
| Components use design tokens from DESIGN_SYSTEM.md | Code review check |

**If FAIL**: Orchestrator identifies failures and sends back to specific developer.

---

### Gate 3: Final QA

**Evaluator**: Orchestrator reads all 4 test report files

| Criteria | How to Check |
|----------|-------------|
| E2E report: all critical flows pass | Read `e2e-report.md` |
| Data integrity: zero orphan records, tenant isolation OK | Read `data-integrity-report.md` |
| Code review: zero critical issues | Read `code-review.md` |
| `test-summary.md` verdict = PASS | Read file, check verdict |
| Zero open bugs | Check `docs/bugs/{feature}/` |

**If FAIL**: Triggers Fix Loop.

---

## IV. FIX LOOP MECHANISM

```
Gate 3 FAIL
    |
    v
QA Lead creates bug reports --> docs/bugs/{feature}/bug-{NNN}.md
    |
    v
Orchestrator increments fix_cycle_count (max = 3)
    |
    v
Tech Lead reads bugs --> assigns to specialist
    |
    v
Specialist fixes --> updates bug status: open --> fixed
    |
    v
QA Lead re-tests ONLY the fixed bugs
    |
    v
Pass? --> Gate 3 PASS --> Git Commit & PR
Fail? --> Loop again (max 3 times)
After 3 fails? --> Report to user for manual resolution
```

### Bug Report Template (`docs/bugs/{feature}/bug-{NNN}.md`)

```markdown
# BUG-{NNN}: {Title}

**Status**: open | fixed | verified | wont-fix
**Severity**: critical | major | minor
**Found by**: E2E Tester | Data Tester | Code Reviewer
**Assigned to**: Database Engineer | Backend Developer | Frontend Developer | UI/UX Designer
**Fix Cycle**: 1 | 2 | 3

## Description
{What is wrong}

## Steps to Reproduce
1. ...
2. ...

## Expected Behavior
{What should happen}

## Actual Behavior
{What actually happens}

## Fix Applied
{Description of fix, files changed}
```

### Fix Cycle Log (`docs/bugs/{feature}/fix-cycle-log.md`)

```markdown
# Fix Cycle Log: {Feature Name}

## Cycle 1
- Bugs found: N
- Bugs fixed: N
- Remaining: N

## Cycle 2
- Bugs found: N
- Bugs fixed: N
- Remaining: N

## Cycle 3
- Bugs found: N
- Bugs fixed: N
- Remaining: N
- Escalated to user: [list]
```

---

## V. ARTIFACT STRUCTURE

```
docs/
├── research/                  <-- Team 1 output
│   └── {feature-name}/
│       ├── competitive-analysis.md
│       ├── ux-patterns.md
│       ├── tech-research.md
│       └── research-summary.md
├── plans/                     <-- Team 2 plans
│   └── {feature-name}/
│       └── implementation-plan.md
├── test-reports/              <-- Team 3 output
│   └── {feature-name}/
│       ├── e2e-report.md
│       ├── data-integrity-report.md
│       ├── code-review.md
│       └── test-summary.md
├── bugs/                      <-- Bug tracking
│   └── {feature-name}/
│       ├── bug-001.md
│       └── fix-cycle-log.md
├── AI_TEAMS_STRATEGY.md       <-- This file
├── MASTER_PLAN.md
├── DEVELOPMENT_STRATEGY.md
├── DESIGN_SYSTEM.md
└── REACT_BEST_PRACTICES.md
```

---

## VI. COMMUNICATION PROTOCOL

| Channel | Purpose | When |
|---------|---------|------|
| **Filesystem** (`docs/`) | Handoff artifacts between teams | Every phase transition |
| **Memory MCP** | Persist decisions, state, context | Across sessions |
| **TaskCreate/Update** | Track progress, dependencies | Every task start/end |

### Memory MCP Schema

```
Entity: "feature:{name}"
Type: "feature-state"
Observations:
  - "phase: research | execution | testing | done"
  - "last_completed: {task description}"
  - "next_step: {what to do next}"
  - "fix_cycle: 0 | 1 | 2 | 3"
  - "gate1: pending | pass | fail"
  - "gate2: pending | pass | fail"
  - "gate3: pending | pass | fail"
```

---

## VII. TASK TRACKING TEMPLATE

When a feature request is received, the Orchestrator creates these tasks:

```
[Research] Competitive Analysis             <-- Team 1 (parallel)
[Research] UX Patterns Analysis             <-- Team 1 (parallel)
[Research] Technical Research               <-- Team 1 (parallel)
[Research] Research Synthesis               <-- Team 1 (after above 3)
[Gate 1]   Research Quality Gate            <-- blockedBy: Research Synthesis
[Exec]     Implementation Plan              <-- blockedBy: Gate 1
[Exec]     Database Schema Update           <-- blockedBy: Implementation Plan
[Exec]     Backend API Routes               <-- blockedBy: Database Schema
[Exec]     Frontend Components              <-- blockedBy: Database Schema (parallel with Backend)
[Exec]     Integration & Polish             <-- blockedBy: Backend + Frontend
[Gate 2]   Code Quality Gate                <-- blockedBy: Integration
[Test]     E2E Testing                      <-- blockedBy: Gate 2 (parallel)
[Test]     Data Integrity Testing           <-- blockedBy: Gate 2 (parallel)
[Test]     Code Review                      <-- blockedBy: Gate 2 (parallel)
[Test]     Test Synthesis                   <-- blockedBy: 3 test tasks
[Gate 3]   Final Quality Gate               <-- blockedBy: Test Synthesis
[Done]     Git Commit & Create PR           <-- blockedBy: Gate 3
```

---

## VIII. GIT WORKFLOW

```
main
  └── feature/{feature-name}
       ├── commit: "research({feature}): Add competitive and UX analysis"    (after Gate 1)
       ├── commit: "feat({feature}): Add database schema and migrations"     (after DB)
       ├── commit: "feat({feature}): Add API routes and validation"          (after Backend)
       ├── commit: "feat({feature}): Add UI components and pages"            (after Frontend)
       ├── commit: "fix({feature}): Resolve BUG-001, BUG-002"               (fix loop)
       └── PR: "feat: {Feature Name}"                                        (after Gate 3)
```

### Commit Convention
- `research({feature}):` - Research artifacts
- `feat({feature}):` - New feature code
- `fix({feature}):` - Bug fixes during fix loop
- `test({feature}):` - Test artifacts
- `docs({feature}):` - Documentation updates

---

## IX. ORCHESTRATOR PROMPTS

### Starting a Feature

```
When the user requests a feature:

1. Create Memory entity: "feature:{name}" with phase="research"
2. Create all tasks from Section VII template with proper dependencies
3. Fire Team 1 (3 parallel research agents)
4. Wait for all 3 to complete
5. Fire Research Director to synthesize
6. Evaluate Gate 1
7. If pass: proceed to Team 2
8. If fail: identify gaps, retry specific researcher
```

### Team 1 Launch (3 parallel Task calls)

```
Message with 3 Task tool calls:

Task 1 (Competitive Analyst):
  subagent_type: general-purpose
  prompt: "Research {feature} implementations in HubSpot, Salesforce, and Pipedrive.
           Compare UI patterns, user flows, and feature sets.
           Write findings to docs/research/{feature}/competitive-analysis.md"

Task 2 (UX Analyst):
  subagent_type: general-purpose
  prompt: "Research UX patterns for CRM {feature}.
           Document user flows, interaction patterns, accessibility.
           Write findings to docs/research/{feature}/ux-patterns.md"

Task 3 (Tech Researcher):
  subagent_type: general-purpose
  prompt: "Research technical implementation approaches for {feature}.
           Evaluate Next.js patterns, libraries, architecture options.
           Write findings to docs/research/{feature}/tech-research.md"
```

### Team 2 Launch (sequential then parallel)

```
Step 1 - Tech Lead (sequential):
  subagent_type: Plan
  prompt: "Read docs/research/{feature}/ research files.
           Create implementation-plan.md in docs/plans/{feature}/
           Define tasks for DB, Backend, Frontend, UI/UX."

Step 2 - Database Engineer (sequential):
  subagent_type: general-purpose
  prompt: "Read docs/plans/{feature}/implementation-plan.md.
           Update Prisma schema, create migration, seed data.
           Ensure tenant_id, soft delete, indexes."

Step 3 - Backend + Frontend (parallel):
  Task A (Backend):
    subagent_type: general-purpose
    prompt: "Read implementation plan. Build API routes with Zod validation.
             Ensure tenant_id on all queries. Use soft delete."

  Task B (Frontend):
    subagent_type: general-purpose
    prompt: "Read implementation plan. Build React components and pages.
             Follow DESIGN_SYSTEM.md tokens. Ensure responsive."

Step 4 - UI/UX Designer (sequential):
  subagent_type: general-purpose
  prompt: "Review frontend components. Ensure design system compliance.
           Polish responsive behavior. Fix spacing/typography."
```

### Team 3 Launch (3 parallel Task calls)

```
Task 1 (E2E Tester):
  subagent_type: general-purpose
  prompt: "Test {feature} CRUD flows, responsive behavior, error states.
           Write results to docs/test-reports/{feature}/e2e-report.md"

Task 2 (Data Tester):
  subagent_type: general-purpose
  prompt: "Using hubspot-db, verify data integrity for {feature}.
           Check tenant isolation, soft delete, orphan records.
           Write results to docs/test-reports/{feature}/data-integrity-report.md"

Task 3 (Code Reviewer):
  subagent_type: Explore
  prompt: "Review all code for {feature}. Check TypeScript strictness,
           security (OWASP), design system compliance.
           Write results to docs/test-reports/{feature}/code-review.md"
```

---

## X. SESSION RESUMPTION PROTOCOL

If a session breaks mid-feature:

1. **Memory MCP** stores: `"feature:{name}"` with phase, last_completed, next_step
2. **TaskList** shows which tasks are pending/in_progress/completed
3. **Filesystem** artifacts show what's been produced

### Resume Steps
```
1. mcp__memory__open_nodes(["feature:{name}"])
   → Get current phase and state

2. TaskList
   → Get pending tasks

3. Read existing artifacts in docs/research/, docs/plans/, docs/test-reports/
   → Understand what's done

4. Continue from next_step
```

---

## XI. OPTIMIZATION STRATEGIES

### 11.1 Parallel Research
Team 1 fires 3 tavily searches simultaneously in 1 message → 3x faster research.

### 11.2 Smart Fix Assignment
When QA finds bugs, auto-classify:
- Data/query bugs → Database Engineer
- API/validation bugs → Backend Developer
- UI/rendering bugs → Frontend Developer
- Style/responsive bugs → UI/UX Designer

### 11.3 Progressive Complexity
Start with simpler features to validate the workflow:
1. Companies Page (simple CRUD)
2. Contacts Page (CRUD + associations)
3. Deal Pipeline (complex - Kanban + drag-drop)

### 11.4 Metrics Tracking
After each feature, store in Memory MCP:
```
Entity: "metrics:{feature}"
Observations:
  - "bugs_found: N"
  - "bugs_fixed: N"
  - "fix_cycles: N"
  - "gate1_attempts: N"
  - "gate2_attempts: N"
  - "gate3_attempts: N"
```

---

## XII. QUICK REFERENCE

### Start Feature
```
User: "Build {feature}"
→ Orchestrator creates tasks
→ Team 1 (parallel research)
→ Gate 1
→ Team 2 (plan → DB → Backend||Frontend → Polish)
→ Gate 2
→ Team 3 (parallel testing)
→ Gate 3
→ PR
```

### Gate Fail Response
```
Gate 1 fail → Re-run specific researcher
Gate 2 fail → Re-run specific developer
Gate 3 fail → Fix Loop (max 3 cycles) → Escalate
```

### Key Commands
```
TaskList          → See all tasks and status
TaskGet(id)       → Get task details
TaskUpdate(id)    → Mark complete or update
memory.open_nodes → Resume feature state
```

---

*This strategy is referenced in CLAUDE.md and DEVELOPMENT_STRATEGY.md.*
*Update this document when the workflow evolves.*
