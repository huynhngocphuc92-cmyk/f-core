# F-CORE Development Strategy
> Version: 2.0
> Last Updated: 2026-02-11
> Purpose: Kế hoạch sử dụng toàn bộ 18 MCP + 10 Plugins + 50+ Skills + 15+ Agents

---

## I. TỔNG QUAN HIỆN TRẠNG

### Tiến độ: ~80% hoàn thành

| Hạng mục | Số lượng | Status |
|----------|---------|--------|
| Database tables (Prisma) | 33 models | ✅ Done |
| Dashboard pages | 55 pages | ✅ Done |
| Server Actions | 16 files | ✅ Done |
| API Routes | 29 files | ⚠️ Partial |
| Components | 100+ | ✅ Done |

### Còn thiếu (~20%): API Routes

| Priority | Module | Có UI | Có Actions | Thiếu API |
|----------|--------|-------|------------|-----------|
| P0 | Pipelines & Stages | ✅ | ✅ | ❌ |
| P1 | Properties, Emails, Meetings | ✅ | ✅ | ❌ |
| P2 | Tickets, Workflows, Email Marketing, Sequences, Quotes, Notifications | ✅ | ✅ | ❌ |
| P3 | Landing Pages, Chat, Webhooks | ✅ | ✅ | ❌ |

---

## II. TOÀN BỘ CÔNG CỤ (88 tools)

### A. 18 MCP Servers

| # | Server | Vai trò trong F-CORE | Pipeline |
|---|--------|---------------------|----------|
| 1 | `hubspot-db` | Query PostgreSQL, kiểm tra data, debug | P1, P3 |
| 2 | `filesystem` | Đọc/ghi code files | P1 |
| 3 | `github` | PR, issues, code review, releases | P5, P6 |
| 4 | `tavily` | Research features, best practices | P2, P4 |
| 5 | `memory` | Lưu context, decisions, patterns | P6 |
| 6 | `sequential-thinking` | Phân tích phức tạp, architecture | P1 |
| 7 | `fetch` | Gọi external APIs, test endpoints | P1, P4 |
| 8 | `antv-chart` | Tạo charts cho Reports module | P3 |
| 9 | `exa` | AI search, code context, company research | P2, P4 |
| 10 | `stripe` | Payment links, invoices, subscriptions | P4 |
| 11 | `upstash` | Redis caching, rate limiting, queues | P1, P4 |
| 12 | `supabase` | Migrations, SQL, edge functions | P1, P3 |
| 13 | `figma-mcp` | Review Figma designs, extract specs | P2 |
| 14 | `browser-use` | E2E testing, browser automation | P5 |
| 15 | `apify` | Scrape UI patterns từ competitors | P2 |
| 16 | `ui-ux` | Design tokens, UI patterns, guidelines | P2 |
| 17 | `git` | Status, diff, commit, branch | P5, P6 |
| 18 | `thinking` | Deep reasoning instance #2 | P1 |

### B. 10 Plugins → 50+ Slash Commands

#### Repo 1: `knowledge-work-plugins` (5 plugins)

**1. sales** — Thiết kế Sales Hub features
| Command | Áp dụng cho F-CORE |
|---------|-------------------|
| `/sales:account-research` | Research khách hàng mẫu cho demo data |
| `/sales:call-prep` | Template cho Meeting Scheduler feature |
| `/sales:pipeline-review` | Thiết kế Deal Pipeline analytics |
| `/sales:forecast` | Mô hình dự báo doanh thu cho Reports |
| `/sales:draft-outreach` | Template cho Email Sequences |
| `/sales:daily-briefing` | Dashboard Sales Daily view |
| `/sales:competitive-intelligence` | So sánh F-CORE vs HubSpot |
| `/sales:create-an-asset` | Tạo sales materials, landing pages |

**2. product-management** — Planning & PRD
| Command | Áp dụng cho F-CORE |
|---------|-------------------|
| `/product-management:feature-spec` | Viết PRD cho mỗi module mới |
| `/product-management:roadmap-management` | Quản lý Sprint roadmap |
| `/product-management:stakeholder-comms` | Viết status updates |
| `/product-management:metrics-tracking` | Định nghĩa KPIs cho CRM |
| `/product-management:user-research-synthesis` | Phân tích user feedback |
| `/product-management:competitive-analysis` | So sánh features vs HubSpot |

**3. customer-support** — Thiết kế Service Hub
| Command | Áp dụng cho F-CORE |
|---------|-------------------|
| `/customer-support:ticket-triage` | Logic phân loại tickets |
| `/customer-support:response-drafting` | Template responses cho chat |
| `/customer-support:escalation` | Workflow escalation rules |
| `/customer-support:knowledge-management` | Knowledge Base structure |
| `/customer-support:customer-research` | Search across KB articles |

**4. marketing** — Thiết kế Marketing Hub
| Command | Áp dụng cho F-CORE |
|---------|-------------------|
| `/marketing:campaign-planning` | Campaign management feature |
| `/marketing:content-creation` | Email template builder |
| `/marketing:seo-audit` | SEO features cho Landing Pages |
| `/marketing:brand-voice` | Brand consistency cho CMS |
| `/marketing:competitive-analysis` | Marketing feature comparison |
| `/marketing:performance-analytics` | Marketing reports & dashboards |
| `/marketing:email-sequence` | Email drip campaigns |

**5. data** — Analytics & Reporting
| Command | Áp dụng cho F-CORE |
|---------|-------------------|
| `/data:analyze` | Phân tích CRM data patterns |
| `/data:build-dashboard` | Interactive HTML dashboards |
| `/data:create-viz` | Charts cho Reports module |
| `/data:explore-data` | Profile database tables |
| `/data:validate` | QA trước khi ship analytics |
| `/data:sql-queries` | Optimize complex CRM queries |
| `/data:statistical-analysis` | Trend analysis cho forecasting |

#### Repo 2: `claude-plugins-official` (5 plugins)

**6. code-review** — Code quality
| Agent | Khi nào dùng |
|-------|-------------|
| `code-review:code-review` | Sau mỗi PR, trước merge |

**7. feature-dev** — Feature development
| Agent | Khi nào dùng |
|-------|-------------|
| `feature-dev:code-architect` | Thiết kế architecture cho feature mới |
| `feature-dev:code-explorer` | Phân tích codebase patterns |
| `feature-dev:code-reviewer` | Review implementation |

**8. frontend-design** — UI development
| Agent | Khi nào dùng |
|-------|-------------|
| `frontend-design:frontend-design` | Tạo UI components chất lượng cao |

**9. security-guidance** — Security
| Skill | Khi nào dùng |
|-------|-------------|
| Security review | Trước mỗi commit có auth/API changes |

**10. pr-review-toolkit** — PR quality gates
| Agent | Khi nào dùng |
|-------|-------------|
| `pr-review-toolkit:code-reviewer` | Review code adherence |
| `pr-review-toolkit:comment-analyzer` | Kiểm tra comments accuracy |
| `pr-review-toolkit:pr-test-analyzer` | Test coverage check |
| `pr-review-toolkit:silent-failure-hunter` | Tìm silent errors |
| `pr-review-toolkit:type-design-analyzer` | Review type design |

### C. 15+ Built-in Skills

| Skill | Vai trò | Pipeline |
|-------|---------|----------|
| `/plan` | Lập kế hoạch implementation | P1 |
| `/tdd` | Test-driven development | P1, P5 |
| `/code-review` | Quick code review | P5 |
| `/build-fix` | Sửa build errors | P6 |
| `/verify` | Verify implementation | P5 |
| `/e2e` | E2E tests với Playwright | P5 |
| `/checkpoint` | Save progress checkpoint | P6 |
| `/learn` | Extract reusable patterns | P6 |
| `/refactor-clean` | Dead code cleanup | P6 |
| `/test-coverage` | Check test coverage | P5 |
| `/update-docs` | Update documentation | P6 |
| `/implement-design` | Figma → production code | P2 |
| `/ux-researcher-designer` | UX research & design | P2 |
| `/tailwind-design-system` | Design system | P2 |
| `/research` | AI-powered research | P2, P4 |

### D. 15+ Task Agents

| Agent | Chức năng | Auto-trigger |
|-------|-----------|-------------|
| `planner` | Implementation planning | Complex features |
| `architect` | System design decisions | Architecture changes |
| `tdd-guide` | TDD methodology | New features, bug fixes |
| `code-reviewer` | Deep code review | After writing code |
| `security-reviewer` | Security audit | Before commits |
| `database-reviewer` | DB query/schema review | Schema changes |
| `build-error-resolver` | Fix build errors | Build failures |
| `e2e-runner` | Playwright E2E tests | Critical user flows |
| `refactor-cleaner` | Dead code removal | Maintenance |
| `doc-updater` | Documentation updates | After features |

---

## III. 6 WORKFLOW PIPELINES

### Pipeline 1: Feature Development (Core Engine)

```
Trigger: Yêu cầu feature mới hoặc API route
Who: Developer (chính)

┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   /plan      │───▶│   /tdd       │───▶│  /build-fix  │
│   planner    │    │   tdd-guide  │    │  build-error │
│   agent      │    │   agent      │    │  -resolver   │
└──────┬──────┘    └──────┬───────┘    └──────┬───────┘
       │                  │                   │
  MCP Used:          MCP Used:           MCP Used:
  sequential-        hubspot-db          filesystem
  thinking,          filesystem          git
  memory             supabase
```

**Áp dụng cụ thể cho 20% còn lại:**

| Task | Tools Chain |
|------|------------|
| P0: Pipelines API | `/plan` → `hubspot-db` (check schema) → `/tdd` → code → `/verify` |
| P1: Properties API | `/plan` → `feature-dev:code-explorer` → `/tdd` → code → `/verify` |
| P1: Emails API | `/plan` → `exa` (research email patterns) → `/tdd` → code |
| P1: Meetings API | `/plan` → `tavily` (calendar integrations) → `/tdd` → code |
| P2: Tickets API | `/customer-support:ticket-triage` → `/plan` → `/tdd` → code |
| P2: Workflows API | `/plan` → `sequential-thinking` (complex logic) → `/tdd` → code |
| P2: Sequences API | `/sales:draft-outreach` → `/plan` → `/tdd` → code |
| P2: Quotes API | `stripe` (pricing) → `/plan` → `/tdd` → code |
| P3: Chat API | `upstash` (real-time queues) → `/plan` → `/tdd` → code |
| P3: Webhooks API | `/plan` → `fetch` (test webhooks) → `/tdd` → code |

---

### Pipeline 2: UI/UX Design → Code

```
Trigger: Cần page/component mới hoặc redesign
Who: Designer + Developer

┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│  /research   │───▶│ /ux-researcher│───▶│/implement-     │
│  tavily, exa │    │  -designer    │    │ design         │
│  apify       │    │  figma-mcp    │    │ frontend-design│
└──────┬───────┘    └──────┬────────┘    └──────┬─────────┘
       │                   │                    │
  MCP Used:           MCP Used:            MCP Used:
  tavily, exa         figma-mcp            ui-ux
  apify               ui-ux               filesystem
```

**Áp dụng cụ thể:**

| Task | Tools Chain |
|------|------------|
| Clone HubSpot UI | `apify` (scrape) → `ui-ux` (tokens) → `/implement-design` |
| Redesign dashboard | `figma-mcp` (review) → `/ux-researcher-designer` → `/frontend-design` |
| New component | `ui-ux` (search patterns) → `/tailwind-design-system` → code |
| Mobile responsive | `/research` (mobile CRM patterns) → `/implement-design` |

---

### Pipeline 3: Data & Analytics

```
Trigger: Reports, dashboards, charts, metrics
Who: Data analyst role

┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│/data:explore  │───▶│ /data:analyze │───▶│ /data:build-   │
│ -data         │    │ /data:sql-    │    │  dashboard     │
│ hubspot-db    │    │  queries      │    │ antv-chart     │
└──────┬────────┘    └──────┬────────┘    └──────┬─────────┘
       │                    │                    │
  MCP Used:            MCP Used:            MCP Used:
  hubspot-db           hubspot-db           antv-chart
  supabase             supabase             filesystem
```

**Áp dụng cụ thể:**

| Task | Tools Chain |
|------|------------|
| Deal Forecast chart | `hubspot-db` → `/data:analyze` → `antv-chart` (line_chart) |
| Sales Pipeline report | `hubspot-db` → `/data:sql-queries` → `antv-chart` (funnel) |
| Contact analytics | `hubspot-db` → `/data:statistical-analysis` → `antv-chart` (pie) |
| Revenue dashboard | `/data:build-dashboard` → `antv-chart` (dual_axes) |
| Activity heatmap | `hubspot-db` → `/data:create-viz` → embed in page |

---

### Pipeline 4: Business Logic (Sales + Marketing + Support)

```
Trigger: Business-specific features
Who: Product + Developer

┌──────────────────┐    ┌───────────────────┐    ┌─────────────┐
│ /sales:*         │───▶│ /marketing:*      │───▶│ Build with  │
│ /customer-       │    │ stripe            │    │ upstash     │
│  support:*       │    │ exa               │    │ fetch       │
└──────┬───────────┘    └──────┬────────────┘    └──────┬──────┘
       │                       │                        │
  Plugins:                Plugins:                 MCP Used:
  sales                   marketing               stripe
  customer-support        data                    upstash
  product-management                              fetch
```

**Áp dụng cụ thể:**

| Feature | Tools Chain |
|---------|------------|
| Deal Pipeline logic | `/sales:pipeline-review` → `hubspot-db` → code |
| Email Sequences | `/sales:draft-outreach` → `/marketing:email-sequence` → code |
| Ticket routing | `/customer-support:ticket-triage` → `sequential-thinking` → code |
| Campaign mgmt | `/marketing:campaign-planning` → code |
| Quotes/Invoicing | `stripe` (products, prices) → `hubspot-db` → code |
| Chat real-time | `upstash` (Redis pub/sub) → code |
| Webhook delivery | `upstash` (QStash) → `fetch` (test) → code |
| KB search | `/customer-support:knowledge-management` → `exa` → code |
| SEO for Landing Pages | `/marketing:seo-audit` → code |
| Sales Forecast | `/sales:forecast` → `/data:analyze` → `antv-chart` |

---

### Pipeline 5: Quality & Security (Gate)

```
Trigger: Trước mỗi commit/PR (BẮT BUỘC)
Who: Automated + Reviewer

┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│ /code-review │───▶│ /security-    │───▶│ pr-review-     │
│ code-reviewer│    │  review       │    │  toolkit       │
│ agent        │    │ security-     │    │ (5 agents)     │
│              │    │  reviewer     │    │                │
└──────┬───────┘    └──────┬────────┘    └──────┬─────────┘
       │                   │                    │
       ▼                   ▼                    ▼
  /test-coverage      /e2e (Playwright)    /verify
  tdd-guide           browser-use          database-reviewer
```

**Quality Gates (mỗi PR phải pass):**

| Gate | Tool | Tiêu chuẩn |
|------|------|-----------|
| Code Quality | `code-review:code-review` | No CRITICAL/HIGH issues |
| Security | `security-reviewer` agent | No OWASP top 10 |
| Type Safety | `pr-review-toolkit:type-design-analyzer` | Strong invariants |
| Silent Errors | `pr-review-toolkit:silent-failure-hunter` | No swallowed errors |
| Test Coverage | `/test-coverage` | > 80% |
| E2E | `/e2e` + `browser-use` | Critical flows pass |
| DB Review | `database-reviewer` agent | Queries optimized |
| Comments | `pr-review-toolkit:comment-analyzer` | Accurate comments |

---

### Pipeline 6: DevOps & Maintenance

```
Trigger: Build errors, refactoring, documentation, releases
Who: DevOps + Developer

┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│ /build-fix   │───▶│ /refactor-    │───▶│ /update-docs   │
│ build-error- │    │  clean        │    │ doc-updater    │
│ resolver     │    │ refactor-     │    │ /checkpoint    │
│              │    │  cleaner      │    │ /learn         │
└──────┬───────┘    └──────┬────────┘    └──────┬─────────┘
       │                   │                    │
  MCP Used:           MCP Used:            MCP Used:
  git                 filesystem           github (PR)
  filesystem          git                  memory
```

**Routine tasks:**

| Task | Tools Chain | Frequency |
|------|------------|-----------|
| Build fails | `/build-fix` → `build-error-resolver` | On error |
| Dead code | `/refactor-clean` → `refactor-cleaner` agent | Weekly |
| Update docs | `/update-docs` → `doc-updater` agent | After features |
| Save patterns | `/learn` → `memory` (knowledge graph) | After milestones |
| Checkpoint | `/checkpoint` → `git` commit | Daily |
| Release | `github` (create PR) → `pr-review-toolkit` → merge | Per sprint |

---

## IV. ÁP DỤNG CHO 20% CÒN LẠI

### Sprint tiếp theo: Hoàn thành API Routes

#### Batch 1: P0 - Pipelines & Stages API
```
1. /plan "Pipelines & Stages REST API"
2. hubspot-db → SELECT * FROM pipelines, pipeline_stages (check schema)
3. feature-dev:code-explorer → Scan existing server actions
4. /tdd → Write tests first
5. Code: src/app/api/pipelines/route.ts
6. Code: src/app/api/pipelines/[id]/stages/route.ts
7. /code-review → Review
8. /verify → Test endpoints
```

#### Batch 2: P1 - Properties, Emails, Meetings API
```
1. /plan "Properties + Emails + Meetings API" (3 modules)
2. hubspot-db → Check schema for each
3. /sales:call-prep → Understand meeting workflow
4. /tdd → Tests for all 3
5. Code: 3 API route files
6. /code-review + security-reviewer → Review
```

#### Batch 3: P2 - Tickets, Workflows, Sequences, Quotes, Notifications
```
1. /customer-support:ticket-triage → Ticket API design
2. /sales:draft-outreach → Sequence API design
3. stripe → Quote/Invoice API design
4. /plan → Combined implementation plan
5. /tdd → Tests
6. Code: 6 API route files
7. pr-review-toolkit → Full PR review (5 agents parallel)
```

#### Batch 4: P3 - Landing Pages, Chat, Webhooks
```
1. /marketing:campaign-planning → Landing page API design
2. upstash → Chat real-time + Webhook delivery design
3. /plan → Implementation plan
4. /tdd → Tests
5. Code: 3 API route files
6. /verify + /e2e → End-to-end verification
```

---

## V. CAPABILITIES MỚI (Chưa khai thác)

### 1. Stripe Integration → Quotes & Billing
```
Hiện tại: Quotes module chỉ có UI
Kế hoạch:
  stripe.create_product → Tạo sản phẩm
  stripe.create_price → Định giá
  stripe.create_payment_link → Link thanh toán
  stripe.create_invoice → Tạo hóa đơn

Workflow:
  Quote created in F-CORE → stripe.create_invoice → Send to customer
```

### 2. Upstash Redis → Caching & Real-time
```
Hiện tại: Chưa sử dụng
Kế hoạch:
  - Cache frequently accessed data (contacts list, pipeline stages)
  - Rate limiting cho API routes
  - QStash cho webhook delivery (reliable, retry)
  - Real-time chat messages (Redis pub/sub)

Workflow:
  API request → Check Redis cache → If miss → Query DB → Cache result
  Webhook event → QStash publish → Reliable delivery with retries
```

### 3. AntV Charts → Interactive Reports
```
Hiện tại: Static charts
Kế hoạch:
  - Deal pipeline funnel chart
  - Revenue trend line chart
  - Contact source pie chart
  - Activity timeline area chart
  - Sales forecast dual axes chart

Workflow:
  hubspot-db (query) → antv-chart (generate) → Embed in dashboard
```

### 4. Memory Graph → Cross-session Intelligence
```
Hiện tại: Empty graph
Kế hoạch:
  - Store architecture decisions
  - Remember code patterns used
  - Track feature dependencies
  - Cache research findings

Workflow:
  After each milestone → memory.create_entities → Persist learnings
```

### 5. Data Plugin → Advanced Analytics
```
Hiện tại: Basic reports
Kế hoạch:
  /data:build-dashboard → Interactive sales dashboard
  /data:statistical-analysis → Trend analysis
  /data:sql-queries → Optimized report queries
```

---

## VI. DAILY WORKFLOW

### Bắt đầu phiên làm việc
```bash
# 1. Check context
bd ready                              # Xem issues sẵn sàng
bd list --status=in_progress          # Xem đang làm gì

# 2. Chọn task và bắt đầu
bd update <id> --status=in_progress   # Claim task
/plan "Task description"              # Lập kế hoạch
```

### Trong khi code
```bash
# Feature development
/tdd                                  # TDD workflow
hubspot-db → query                    # Check data
/build-fix                            # Nếu build lỗi

# UI development
/implement-design                     # Design → Code
/tailwind-design-system               # Design tokens
```

### Trước khi commit
```bash
# Quality gates (chạy parallel)
/code-review                          # Code review
/security-review                      # Security check
/test-coverage                        # Coverage check
/verify                               # Final verification
```

### Kết thúc phiên
```bash
# Close & sync
bd close <id>                         # Close completed tasks
/checkpoint                           # Save checkpoint
/learn                                # Extract patterns
bd sync                               # Sync with git
git push                              # Push to remote
```

---

## VII. TOOL SELECTION MATRIX

### Tôi cần... → Dùng tool nào?

| Tôi cần... | Tool/Skill | MCP |
|------------|-----------|-----|
| Viết PRD cho feature | `/product-management:feature-spec` | - |
| Research cách HubSpot làm | `/research` | `tavily`, `exa` |
| Clone UI từ website | `/apify-ultimate-scraper` | `apify` |
| Thiết kế UX flow | `/ux-researcher-designer` | `ui-ux` |
| Convert Figma → code | `/implement-design` | `figma-mcp` |
| Tạo component đẹp | `/frontend-design` | `ui-ux` |
| Check database schema | - | `hubspot-db` |
| Viết API route mới | `/plan` → `/tdd` | `hubspot-db` |
| Tạo chart/báo cáo | `/data:create-viz` | `antv-chart` |
| Build dashboard | `/data:build-dashboard` | `antv-chart`, `hubspot-db` |
| Tích hợp thanh toán | - | `stripe` |
| Thêm caching | - | `upstash` |
| E2E testing | `/e2e` | `browser-use` |
| Security audit | `/security-review` | - |
| Code review | `/code-review` | - |
| PR review đầy đủ | `/pr-review-toolkit:review-pr` | `github` |
| Fix build errors | `/build-fix` | - |
| Dọn dead code | `/refactor-clean` | - |
| Update docs | `/update-docs` | - |
| Lưu kiến thức | `/learn` | `memory` |
| So sánh với đối thủ | `/product-management:competitive-analysis` | `exa` |
| Thiết kế campaign | `/marketing:campaign-planning` | - |
| Triage tickets | `/customer-support:ticket-triage` | - |
| Sales forecast | `/sales:forecast` | `hubspot-db` |
| SEO audit | `/marketing:seo-audit` | `tavily` |
| SQL optimization | `/data:sql-queries` | `hubspot-db` |
| Git operations | `/checkpoint` | `git` |

---

## VIII. PARALLEL EXECUTION STRATEGY

### Khi nào chạy song song?

```
✅ SONG SONG (không phụ thuộc nhau):
- code-reviewer + security-reviewer + database-reviewer
- tavily search + exa search + apify scrape
- Multiple API route files cùng lúc
- pr-review-toolkit: 5 agents cùng lúc

❌ TUẦN TỰ (có phụ thuộc):
- /plan → /tdd → code → /verify
- hubspot-db (check) → code → hubspot-db (verify)
- /build-fix → /code-review → git commit
```

---

*Tài liệu v2.0 - Cập nhật 2026-02-11. Mapping đầy đủ 88 tools vào F-CORE project.*
