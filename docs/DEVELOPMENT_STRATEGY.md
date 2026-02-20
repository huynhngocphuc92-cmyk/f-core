# F-CORE Development Strategy
> Version: 3.1
> Last Updated: 2026-02-14
> Purpose: Ke hoach su dung toan bo 18 MCP + 10 Plugins + 50+ Skills + 15+ Agents
> Status: API Routes + AI Assistant Phase 1 da trien khai, dang chuyen sang hardening va E2E expansion

---

## I. TONG QUAN HIEN TRANG

### Tien do: ~90% hoan thanh

| Hang muc | So luong | Status |
|----------|---------|--------|
| Database tables (Prisma) | 42 models | ✅ Done |
| Dashboard pages | 60+ pages | ✅ Done |
| Server Actions | 16 files | ✅ Done |
| API Routes | 75 route files | ✅ Done |
| Components | 100+ | ✅ Done |
| Unit Tests | 500+ tests / 59 files | ✅ Done |
| AI Assistant | Phase 1 | ✅ Done |
| E2E Tests | Baseline + critical flows | ✅ In progress |
| Stripe Integration | 0 | ❌ Chua bat dau |
| Redis Caching | 0 | ❌ Chua bat dau |

### Con thieu (~10%): Advanced Features

| Priority | Feature | Tools Chinh |
|----------|---------|-------------|
| P0 | **AI Assistant Phase 2 (agent workflows)** | Vercel AI SDK, OpenAI |
| P1 | Stripe Integration (Quotes/Billing) | `stripe` MCP |
| P1 | Redis Caching & Rate Limiting | `upstash` MCP |
| P2 | E2E Testing | `browser-use` MCP, Playwright |
| P2 | Interactive Charts | `antv-chart` MCP |
| P3 | Performance Optimization | Lighthouse, React profiling |
| P3 | Security Hardening | `security-reviewer` agent |
| P3 | Mobile Responsiveness | `ui-ux` MCP |

---

## II. TOAN BO CONG CU (88 tools) - MAPPING VAO CONG VIEC

### ═══════════════════════════════════════
### A. 18 MCP SERVERS
### ═══════════════════════════════════════

#### Group 1: DATABASE & BACKEND (Moi ngay)

| # | MCP | Cong viec cu the | Vi du |
|---|-----|-----------------|-------|
| 1 | `hubspot-db` | Query data, debug, verify | `SELECT * FROM contacts WHERE tenant_id = 'x'` |
| 2 | `supabase` | Migrations, edge functions, SQL | `apply_migration`, `execute_sql` |
| 3 | `filesystem` | Doc/ghi code | Read/write src/ files |

**Khi nao dung:**
```
hubspot-db → Khi can kiem tra data thuc, debug query, EXPLAIN ANALYZE
supabase   → Khi tao migration moi (AI tables), deploy edge functions
filesystem → Moi khi code (tu dong)
```

#### Group 2: AI & RESEARCH (Feature moi)

| # | MCP | Cong viec cu the | Vi du |
|---|-----|-----------------|-------|
| 4 | `tavily` | Search web, research features | `tavily_search("HubSpot ChatSpot features")` |
| 5 | `exa` | Code context, company research | `get_code_context("Vercel AI SDK useChat")` |
| 6 | `fetch` | Goi API, test endpoints | `fetch("https://api.openai.com/v1/models")` |
| 7 | `apify` | Scrape UI patterns | `search("hubspot.com CRM dashboard")` |

**Khi nao dung:**
```
tavily → Research truoc khi build feature moi
exa    → Tim code examples, SDK docs
fetch  → Test API endpoints, webhook delivery
apify  → Clone UI patterns tu competitors
```

#### Group 3: TICH HOP BEN NGOAI (Advanced Features)

| # | MCP | Cong viec cu the | Vi du |
|---|-----|-----------------|-------|
| 8 | `stripe` | Quotes, invoices, payments | `create_product`, `create_payment_link` |
| 9 | `upstash` | Redis cache, rate limit, queues | `redis_database_run_redis_commands` |
| 10 | `antv-chart` | Charts cho Reports | `generate_funnel_chart`, `generate_line_chart` |

**Workflow cu the:**
```
STRIPE (Quotes module):
  stripe.create_product → stripe.create_price → stripe.create_payment_link
  → hubspot-db (store refs) → UI (show payment link)

UPSTASH (Caching):
  API request → upstash.redis GET cache → if miss → hubspot-db query
  → upstash.redis SET cache → return response

ANTV (Reports):
  hubspot-db (aggregate query) → antv-chart.generate_* → embed in dashboard
```

#### Group 4: THIET KE & UI

| # | MCP | Cong viec cu the | Vi du |
|---|-----|-----------------|-------|
| 11 | `ui-ux` | Design tokens, patterns, guidelines | `search_all("chat interface dark")` |
| 12 | `figma-mcp` | Review Figma designs | `add_figma_file`, `view_node` |

**Khi nao dung:**
```
ui-ux     → Truoc khi code UI moi (tim patterns, colors, typography)
figma-mcp → Khi co Figma file can convert sang code
```

#### Group 5: REASONING & MEMORY

| # | MCP | Cong viec cu the | Vi du |
|---|-----|-----------------|-------|
| 13 | `sequential-thinking` | Phan tich phuc tap | Architecture decisions, debug |
| 14 | `thinking` | Deep reasoning #2 | Complex multi-step problems |
| 15 | `memory` | Luu context across sessions | `create_entities`, `search_nodes` |

**Khi nao dung:**
```
sequential-thinking → Thiet ke AI tool calling, complex business logic
thinking            → Debug issues phuc tap, architectural trade-offs
memory              → Luu architecture decisions, patterns da hoc
```

#### Group 6: DEVOPS & TESTING

| # | MCP | Cong viec cu the | Vi du |
|---|-----|-----------------|-------|
| 16 | `git` | Status, diff, commit, branch | `git_status`, `git_commit` |
| 17 | `github` | PR, issues, releases | `create_pull_request`, `list_issues` |
| 18 | `browser-use` | E2E testing, browser automation | `browser_task("test login flow")` |

**Khi nao dung:**
```
git        → Moi khi commit (tu dong qua hooks)
github     → Tao PR, review, manage releases
browser-use → E2E testing critical user flows
```

---

### ═══════════════════════════════════════
### B. 10 PLUGINS → 50+ SLASH COMMANDS
### ═══════════════════════════════════════

#### HOW TO USE: Moi plugin map vao 1 "vai tro" trong du an

---

#### Plugin 1: `sales` → THIET KE SALES HUB

**Ap dung cho AI Assistant:**
| Command | Ap dung |
|---------|---------|
| `/sales:pipeline-review` | Thiet ke AI tool `pipeline_summary` |
| `/sales:forecast` | Thiet ke AI tool `revenue_forecast` |
| `/sales:draft-outreach` | Thiet ke AI tool `draft_email` |
| `/sales:call-prep` | Template cho AI meeting prep feature |
| `/sales:daily-briefing` | AI daily summary feature |
| `/sales:account-research` | AI tool `get_contact` context enrichment |

**Vi du thuc te:**
```bash
# Khi build AI tool "pipeline_summary":
/sales:pipeline-review
# → Hieu cach analyze pipeline → Code AI tool tuong tu
```

---

#### Plugin 2: `product-management` → PLANNING & PRD

| Command | Khi nao dung |
|---------|-------------|
| `/product-management:feature-spec` | Viet PRD truoc moi feature lon |
| `/product-management:roadmap-management` | Cap nhat roadmap moi sprint |
| `/product-management:competitive-analysis` | So sanh F-CORE vs HubSpot |
| `/product-management:metrics-tracking` | Dinh nghia KPIs cho CRM |
| `/product-management:stakeholder-comms` | Viet status updates |

**Vi du thuc te:**
```bash
# Truoc khi build AI Assistant:
/product-management:feature-spec "AI Assistant for CRM"
# → PRD chi tiet → Lam input cho /plan
```

---

#### Plugin 3: `customer-support` → SERVICE HUB FEATURES

| Command | Ap dung |
|---------|---------|
| `/customer-support:ticket-triage` | Logic AI tool phan loai tickets |
| `/customer-support:response-drafting` | AI auto-draft ticket responses |
| `/customer-support:knowledge-management` | AI tool search KB articles |
| `/customer-support:escalation` | Workflow escalation logic |

**Vi du thuc te:**
```bash
# Khi build AI tool "search_kb":
/customer-support:knowledge-management
# → Hieu cach structure KB → Code AI tool search
```

---

#### Plugin 4: `marketing` → MARKETING HUB FEATURES

| Command | Ap dung |
|---------|---------|
| `/marketing:campaign-planning` | AI tool campaign analysis |
| `/marketing:email-sequence` | AI tool draft email sequences |
| `/marketing:seo-audit` | AI tool analyze landing pages |
| `/marketing:content-creation` | AI tool draft marketing content |
| `/marketing:performance-analytics` | Reports dashboard design |

---

#### Plugin 5: `data` → ANALYTICS & REPORTING

| Command | Ap dung | MCP kem theo |
|---------|---------|-------------|
| `/data:explore-data` | Profile CRM data tables | `hubspot-db` |
| `/data:analyze` | Phan tich CRM data patterns | `hubspot-db` |
| `/data:build-dashboard` | Interactive HTML dashboards | `antv-chart` |
| `/data:create-viz` | Charts cho Reports module | `antv-chart` |
| `/data:sql-queries` | Optimize complex CRM queries | `hubspot-db` |
| `/data:validate` | QA truoc khi ship analytics | `hubspot-db` |
| `/data:statistical-analysis` | Trend analysis cho forecasting | `hubspot-db` |

**Vi du thuc te:**
```bash
# Build Revenue Dashboard:
/data:explore-data    # Profile deals table
# → hubspot-db: SELECT stage, SUM(amount) FROM deals GROUP BY stage
# → antv-chart: generate_funnel_chart(data)
# → /data:build-dashboard (embed chart vao page)
```

---

#### Plugin 6: `code-review` → CODE QUALITY

| Command | Khi nao |
|---------|---------|
| `/code-review:code-review` | Sau moi PR, truoc merge |

---

#### Plugin 7: `feature-dev` → FEATURE DEVELOPMENT

| Agent | Khi nao |
|-------|---------|
| `feature-dev:code-architect` | Thiet ke architecture cho AI Assistant |
| `feature-dev:code-explorer` | Phan tich codebase patterns truoc khi code |
| `feature-dev:code-reviewer` | Review implementation |

**Vi du thuc te:**
```bash
# Truoc khi code AI Assistant:
# 1. feature-dev:code-explorer → Scan existing patterns
# 2. feature-dev:code-architect → Design AI module architecture
# 3. Code...
# 4. feature-dev:code-reviewer → Review
```

---

#### Plugin 8: `frontend-design` → UI DEVELOPMENT

| Agent | Khi nao |
|-------|---------|
| `frontend-design:frontend-design` | Tao AI chat interface, new UI components |

**Vi du thuc te:**
```bash
# Build AI Chat UI:
# ui-ux MCP: search_all("chat interface CRM")
# → frontend-design agent: Create chat components
# → /tailwind-design-system: Apply F-CORE tokens
```

---

#### Plugin 9: `pr-review-toolkit` → PR QUALITY GATES

| Agent | Chuc nang | Khi nao |
|-------|-----------|---------|
| `code-reviewer` | Review code adherence | Moi PR |
| `comment-analyzer` | Kiem tra comments accuracy | PR co nhieu comments |
| `pr-test-analyzer` | Test coverage check | PR co code moi |
| `silent-failure-hunter` | Tim silent errors | PR co try-catch |
| `type-design-analyzer` | Review type design | PR co types moi |

**CHAY SONG SONG 5 agents cho moi PR lon:**
```bash
# Parallel review:
Task(pr-review-toolkit:code-reviewer)      # ──┐
Task(pr-review-toolkit:comment-analyzer)    # ──┤ Song song
Task(pr-review-toolkit:pr-test-analyzer)    # ──┤
Task(pr-review-toolkit:silent-failure-hunter)# ──┤
Task(pr-review-toolkit:type-design-analyzer) # ──┘
```

---

#### Plugin 10: `frontend-design` (duplicate, da liet ke o #8)

---

### ═══════════════════════════════════════
### C. 15+ BUILT-IN SKILLS
### ═══════════════════════════════════════

| Skill | Vai tro | Khi nao dung |
|-------|---------|-------------|
| `/plan` | Lap ke hoach implementation | DAU MOI FEATURE |
| `/tdd` | Test-driven development | Code features moi |
| `/code-review` | Quick code review | Sau khi code |
| `/build-fix` | Fix build errors | Khi build fail |
| `/verify` | Verify implementation | Sau khi code xong |
| `/e2e` | E2E tests Playwright | Critical user flows |
| `/checkpoint` | Save progress | Cuoi moi phien |
| `/learn` | Extract patterns | Sau milestones |
| `/refactor-clean` | Dead code cleanup | Dinh ky |
| `/test-coverage` | Check coverage | Truoc PR |
| `/update-docs` | Update docs | Sau features |
| `/implement-design` | Figma → code | Khi co design |
| `/ux-researcher-designer` | UX research | Truoc UI moi |
| `/tailwind-design-system` | Design system | Code UI |
| `/research` | AI research | Tim hieu topics |

---

### ═══════════════════════════════════════
### D. 15+ TASK AGENTS
### ═══════════════════════════════════════

| Agent | Khi nao tu dong trigger |
|-------|----------------------|
| `planner` | Feature requests phuc tap |
| `architect` | Architectural decisions |
| `tdd-guide` | New features, bug fixes |
| `code-reviewer` | Sau khi viet code |
| `security-reviewer` | Truoc commits co auth/API |
| `database-reviewer` | Schema changes |
| `build-error-resolver` | Build failures |
| `e2e-runner` | Critical user flows |
| `refactor-cleaner` | Code maintenance |
| `doc-updater` | Documentation |
| `go-reviewer` | N/A (TypeScript project) |
| `python-reviewer` | N/A (TypeScript project) |
| `go-build-resolver` | N/A |

---

## III. 7 WORKFLOW PIPELINES CHO GIAI DOAN MOI

### ═══════════════════════════════════════
### Pipeline 1: AI ASSISTANT DEVELOPMENT
### ═══════════════════════════════════════

```
Trigger: Build F-CORE Copilot
Duration: Phase 1-4 (xem AI_ASSISTANT_PLAN.md)

RESEARCH:
  exa.get_code_context("Vercel AI SDK useChat streaming")
  tavily.search("HubSpot ChatSpot AI CRM features 2026")
  /research "AI assistant CRM best practices"

DESIGN:
  /product-management:feature-spec "AI CRM Assistant"
  feature-dev:code-architect → Design AI module
  sequential-thinking → Tool calling architecture
  ui-ux.search_all("AI chat interface SaaS")

BUILD:
  Phase 1 (Foundation):
    supabase.apply_migration → AIConversation + AIMessage tables
    /tdd → Write tests first
    Code: /api/ai/chat (streaming), /api/ai/conversations CRUD
    Code: AI chat UI components
    /build-fix → Fix any issues

  Phase 2 (CRM Tools):
    hubspot-db → Query patterns for each tool
    /sales:pipeline-review → Pipeline tool logic
    /sales:forecast → Forecast tool logic
    /customer-support:knowledge-management → KB search tool
    Code: 13 AI tools with tenant_id scoping

  Phase 3 (Advanced):
    /marketing:email-sequence → Email drafting tool
    /data:analyze → Revenue analytics tool
    antv-chart → Inline chart generation in chat
    memory → Store conversation patterns

REVIEW:
  code-reviewer + security-reviewer (parallel)
  pr-review-toolkit: 5 agents (parallel)
  /e2e → Test AI chat flow
```

---

### ═══════════════════════════════════════
### Pipeline 2: STRIPE INTEGRATION
### ═══════════════════════════════════════

```
Trigger: Quotes & Billing module
MCP chinh: stripe

WORKFLOW:
  1. stripe.list_products → Check existing
  2. stripe.search_stripe_documentation("invoicing Node.js")
  3. /plan "Stripe integration for Quotes"

  4. stripe.create_product → CRM Products
  5. stripe.create_price → Pricing tiers
  6. stripe.create_customer → Sync contacts
  7. stripe.create_invoice → From quotes
  8. stripe.create_payment_link → Share with contacts

  9. hubspot-db → Store Stripe refs in CRM
  10. /tdd → Test integration
  11. /verify → End-to-end check

MAPPING vao F-CORE:
  Quote "Accepted" → stripe.create_invoice → Send to customer
  Contact created → stripe.create_customer → Link accounts
  Product in Quote → stripe.create_product + create_price
```

---

### ═══════════════════════════════════════
### Pipeline 3: REDIS CACHING (UPSTASH)
### ═══════════════════════════════════════

```
Trigger: Performance optimization
MCP chinh: upstash

WORKFLOW:
  1. upstash.redis_database_create_new("f-core-cache", "us-east-1")
  2. /plan "Redis caching strategy"

  3. CACHE LAYER:
     upstash.redis_database_run_redis_commands([
       ["SET", "contacts:tenant-1:list", JSON.stringify(data), "EX", "300"],
       ["GET", "contacts:tenant-1:list"]
     ])

  4. RATE LIMITING:
     upstash.redis_database_run_redis_commands([
       ["INCR", "rate:user-1:ai-chat"],
       ["EXPIRE", "rate:user-1:ai-chat", "3600"]
     ])

  5. WEBHOOK QUEUES:
     upstash.qstash_publish_message({
       destination: "https://app.f-core.com/api/webhooks/deliver",
       body: JSON.stringify(webhookPayload),
       retries: 3
     })

  6. AI RATE CONTROL:
     upstash.qstash_publish_message({
       destination: "/api/ai/chat",
       flow_control: { key: "ai-chat", rate: 10, period: "1m" }
     })

AP DUNG:
  /api/contacts GET → Redis cache (5 min TTL)
  /api/deals GET    → Redis cache (5 min TTL)
  /api/ai/chat POST → Rate limit (100/hour/user)
  Webhook events    → QStash queue (reliable delivery)
```

---

### ═══════════════════════════════════════
### Pipeline 4: INTERACTIVE REPORTS
### ═══════════════════════════════════════

```
Trigger: Reports & Dashboard module
MCP chinh: antv-chart + hubspot-db

WORKFLOW:
  1. hubspot-db → Aggregate queries
  2. /data:explore-data → Profile data shape
  3. /data:sql-queries → Optimize queries

  4. CHARTS:
     antv-chart.generate_funnel_chart    → Deal pipeline
     antv-chart.generate_line_chart      → Revenue trend
     antv-chart.generate_pie_chart       → Contact sources
     antv-chart.generate_column_chart    → Monthly deals
     antv-chart.generate_dual_axes_chart → Revenue vs Deals
     antv-chart.generate_area_chart      → Activity over time
     antv-chart.generate_radar_chart     → Sales rep performance

  5. /data:build-dashboard → Interactive HTML dashboard
  6. /data:validate → QA before shipping

VI DU:
  hubspot-db: "SELECT stage, COUNT(*), SUM(amount) FROM deals GROUP BY stage"
  → antv-chart.generate_funnel_chart({
      data: [
        { category: "Qualification", value: 45000 },
        { category: "Proposal", value: 120000 },
        { category: "Negotiation", value: 80000 },
        { category: "Closed Won", value: 200000 }
      ],
      title: "Deal Pipeline"
    })
```

---

### ═══════════════════════════════════════
### Pipeline 5: E2E TESTING
### ═══════════════════════════════════════

```
Trigger: Critical user flows
MCP chinh: browser-use
Skill chinh: /e2e

CRITICAL FLOWS TO TEST:
  1. Login → Dashboard → View contacts
  2. Create contact → Add to company → Create deal
  3. Deal pipeline → Drag to stage → Update amount
  4. AI Assistant → Ask question → Get CRM data
  5. Create quote → Add line items → Send

WORKFLOW:
  /e2e "Test contact creation flow"
  → Playwright test generated
  → browser-use.browser_task("Navigate to /contacts, click New, fill form, submit")
  → Verify: Contact appears in list

  /e2e "Test AI chat flow"
  → browser-use.browser_task("Open AI assistant, type 'show pipeline', verify response")
```

---

### ═══════════════════════════════════════
### Pipeline 6: QUALITY & SECURITY (Gate)
### ═══════════════════════════════════════

```
Trigger: Truoc moi PR (BAT BUOC)

PARALLEL REVIEW (5 agents cung luc):
  ┌─ code-reviewer           → Code quality
  ├─ security-reviewer       → OWASP, tenant isolation
  ├─ database-reviewer       → Query optimization
  ├─ silent-failure-hunter   → Error handling
  └─ type-design-analyzer    → Type safety

THEN SEQUENTIAL:
  /test-coverage → Check > 80%
  /e2e → Critical paths
  /verify → Final check

SECURITY CHECKLIST (cho AI features):
  security-reviewer → Check:
    - tenant_id on ALL AI queries
    - Rate limiting on AI endpoints
    - Input sanitization (prompt injection)
    - No PII leaks to LLM
    - Audit logging for AI actions
```

---

### ═══════════════════════════════════════
### Pipeline 7: DEVOPS & MAINTENANCE
### ═══════════════════════════════════════

```
Trigger: Build errors, cleanup, docs, releases

BUILD FAILS:
  /build-fix → build-error-resolver agent → Fix → Verify

WEEKLY CLEANUP:
  /refactor-clean → refactor-cleaner agent → Remove dead code

DOCS UPDATE:
  /update-docs → doc-updater agent → Update README, CHANGELOG

PATTERN EXTRACTION:
  /learn → memory.create_entities → Persist patterns

RELEASE:
  git.git_status → git.git_commit → github.create_pull_request
  → pr-review-toolkit (5 agents) → github.merge_pull_request
```

---

## IV. TOOL SELECTION MATRIX (CAP NHAT)

### "Toi can..." → Dung tool nao?

| Toi can... | Skill/Command | MCP | Agent |
|------------|-------------|-----|-------|
| **AI ASSISTANT** | | | |
| Research AI SDK | `/research` | `exa`, `tavily` | - |
| Design AI architecture | `/plan` | `sequential-thinking` | `architect` |
| Build AI chat API | `/tdd` | `hubspot-db` | `tdd-guide` |
| Build AI chat UI | `/frontend-design` | `ui-ux` | `frontend-design` |
| AI tool calling logic | - | `hubspot-db`, `thinking` | - |
| **STRIPE** | | | |
| Setup products/prices | - | `stripe` | - |
| Create invoices | - | `stripe` | - |
| Payment links | - | `stripe` | - |
| Stripe docs | - | `stripe` (search_docs) | - |
| **CACHING** | | | |
| Setup Redis | - | `upstash` | - |
| Cache API responses | - | `upstash` | - |
| Rate limiting | - | `upstash` | - |
| Webhook queues | - | `upstash` (qstash) | - |
| **REPORTS** | | | |
| Pipeline funnel | `/data:analyze` | `antv-chart`, `hubspot-db` | - |
| Revenue trends | `/data:create-viz` | `antv-chart`, `hubspot-db` | - |
| Interactive dashboard | `/data:build-dashboard` | `antv-chart` | - |
| SQL optimization | `/data:sql-queries` | `hubspot-db` | `database-reviewer` |
| **TESTING** | | | |
| Unit tests | `/tdd` | - | `tdd-guide` |
| E2E tests | `/e2e` | `browser-use` | `e2e-runner` |
| Test coverage | `/test-coverage` | - | - |
| **QUALITY** | | | |
| Code review | `/code-review` | - | `code-reviewer` |
| Security audit | `/security-review` | - | `security-reviewer` |
| PR review (full) | `/pr-review-toolkit:review-pr` | `github` | 5 agents |
| Dead code cleanup | `/refactor-clean` | - | `refactor-cleaner` |
| **DESIGN** | | | |
| UI patterns | `/ux-researcher-designer` | `ui-ux` | - |
| Design system | `/tailwind-design-system` | `ui-ux` | - |
| Figma to code | `/implement-design` | `figma-mcp` | - |
| Clone competitor UI | `/apify-ultimate-scraper` | `apify` | - |
| **BUSINESS** | | | |
| Sales pipeline logic | `/sales:pipeline-review` | `hubspot-db` | - |
| Revenue forecast | `/sales:forecast` | `hubspot-db` | - |
| Email templates | `/marketing:content-creation` | - | - |
| Ticket triage | `/customer-support:ticket-triage` | - | - |
| Campaign planning | `/marketing:campaign-planning` | - | - |
| Feature PRD | `/product-management:feature-spec` | - | - |
| Competitive analysis | `/product-management:competitive-analysis` | `exa` | - |

---

## V. DAILY WORKFLOW (CAP NHAT)

### Bat dau phien
```bash
bd ready                              # Xem issues san sang
bd list --status=in_progress          # Xem dang lam gi

# Doc context
cat docs/AI_ASSISTANT_PLAN.md         # Ke hoach AI (neu dang build AI)
```

### Trong khi code
```bash
# Feature development
/plan "Feature description"           # Lap ke hoach
/tdd                                  # TDD workflow
hubspot-db → query                    # Check data
/build-fix                            # Neu build loi

# AI development
exa.get_code_context("...")           # Tim SDK docs
sequential-thinking                   # Design tool calling

# UI development
ui-ux.search_all("...")               # Tim patterns
/frontend-design                      # Build UI
```

### Truoc khi commit
```bash
# Quality gates (song song)
code-reviewer                         # ──┐
security-reviewer                     # ──┤ Parallel
database-reviewer                     # ──┘
/test-coverage                        # Check coverage
/verify                               # Final check
```

### Ket thuc phien
```bash
bd close <id>                         # Close tasks
/checkpoint                           # Save progress
/learn                                # Extract patterns
bd sync && git push                   # Push to remote
```

---

## VI. PARALLEL EXECUTION STRATEGY

### ✅ CHAY SONG SONG (khong phu thuoc):
```
- code-reviewer + security-reviewer + database-reviewer
- tavily search + exa search + apify scrape
- pr-review-toolkit: 5 agents cung luc
- Multiple test files
- stripe.list_products + upstash.redis_list + hubspot-db query
```

### ❌ CHAY TUAN TU (co phu thuoc):
```
- /plan → /tdd → code → /verify
- supabase.apply_migration → code API routes → run tests
- stripe.create_product → stripe.create_price → stripe.create_payment_link
- Research → Design → Build → Review
```

---

## VII. IMPLEMENTATION ORDER (NEXT STEPS)

### Sprint tiep theo:

| # | Task | Pipeline | Tools Chinh | Uu tien |
|---|------|----------|-------------|---------|
| 1 | AI Assistant Phase 1 | Pipeline 1 | `exa`, AI SDK, `supabase` | P0 |
| 2 | AI Assistant Phase 2 | Pipeline 1 | `hubspot-db`, tools | P0 |
| 3 | Stripe Integration | Pipeline 2 | `stripe` | P1 |
| 4 | Redis Caching | Pipeline 3 | `upstash` | P1 |
| 5 | Interactive Charts | Pipeline 4 | `antv-chart`, `hubspot-db` | P2 |
| 6 | E2E Tests | Pipeline 5 | `browser-use`, Playwright | P2 |
| 7 | Security Hardening | Pipeline 6 | `security-reviewer` | P3 |
| 8 | AI Assistant Phase 3-4 | Pipeline 1 | All | P3 |

---

*Version 3.0 - Cap nhat 2026-02-11. API routes 100% done, chuyen sang Advanced Features.*
*Tham chieu: docs/AI_ASSISTANT_PLAN.md, docs/MASTER_PLAN.md*
