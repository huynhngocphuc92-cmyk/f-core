# CLAUDE.md - F-CORE Project Rules

## CRITICAL RULES

### 1. NO SCREENSHOTS OR IMAGES
- **NEVER** take screenshots or work with image files
- **NEVER** read, analyze, or process image files (PNG, JPG, GIF, etc.)
- This rule exists to prevent context limit issues
- Use text-based descriptions instead of visual references

### 2. MCP Servers Configured (18 servers)

#### Group A: Core (trong `.mcp.json`)
| # | Server | Chức năng | Status |
|---|--------|-----------|--------|
| 1 | `hubspot-db` | PostgreSQL database queries | ✅ Active |
| 2 | `filesystem` | File operations trong project | ✅ Active |
| 3 | `github` | GitHub API (PR, issues) | ✅ Active |
| 4 | `tavily` | Web search, research, crawl | ✅ Active |
| 5 | `memory` | Persistent knowledge graph | ✅ Active |
| 6 | `sequential-thinking` | Complex reasoning (instance 1) | ✅ Active |
| 7 | `fetch` | HTTP requests (uvx) | ✅ Active |
| 8 | `antv-chart` | Chart & data visualization | ✅ Active |
| 9 | `exa` | Exa AI web search & code context | ✅ Active |
| 10 | `stripe` | Stripe payments (test mode) | ✅ Active |
| 11 | `upstash` | Upstash Redis & QStash | ✅ Active |

#### Group B: Extended (trong Claude Code local config)
| # | Server | Chức năng | Status |
|---|--------|-----------|--------|
| 12 | `supabase` | Supabase project management & SQL | ⚠️ Partial |
| 13 | `figma-mcp` | Figma design files & comments | ✅ Active |
| 14 | `browser-use` | Cloud browser automation (HTTP) | ✅ Active |
| 15 | `apify` | Web scraping (RAG browser) | ✅ Active |
| 16 | `ui-ux` | UI/UX design system search | ✅ Active |
| 17 | `git` | Git operations (status, diff, commit) | ✅ Active |
| 18 | `thinking` | Complex reasoning (instance 2) | ✅ Active |

#### Known Issues
- **`supabase`** (⚠️): Tools có parameter riêng hoạt động OK (`search_docs`, `execute_sql`, `list_tables`, `apply_migration`). Tools không có parameter (`list_projects`, `list_organizations`) bị lỗi do Claude Code inject `reason` param mà Supabase Zod strict reject. Chờ Supabase MCP update fix.

**Config files:**
- `.mcp.json` (project root) - Group A
- `~/.claude.json` (Claude Code local) - Group B
**GitHub account:** huynhngocphuc92-cmyk

### 3. Plugins Installed (2 plugins)
| Plugin | Version | Chức năng |
|--------|---------|-----------|
| `sales@knowledge-work-plugins` | 1.0.0 | Sales CRM, pipeline, call prep |
| `product-management@knowledge-work-plugins` | 1.0.0 | Product specs, roadmaps, user research |

**Slash Commands:**
- `/sales:call-prep` - Chuẩn bị cuộc gọi sales
- `/sales:pipeline` - Quản lý sales pipeline
- `/product:spec` - Viết product specification
- `/product:roadmap` - Lập product roadmap

---

## MCP USAGE STRATEGY

### Phase 1: Research & Planning
| Task | MCP to use |
|------|------------|
| Tìm hiểu requirements | `tavily` + `exa` + `sequential-thinking` |
| Research UI/UX patterns | `tavily` + `ui-ux` + `fetch` |
| Lưu context quan trọng | `memory` |
| Web scraping & data extraction | `apify` |
| Company/competitor research | `exa` (company_research) |

### Phase 2: Design & Architecture
| Task | MCP to use |
|------|------------|
| Lên kế hoạch phức tạp | `sequential-thinking` + `thinking` |
| Thiết kế database schema | `hubspot-db` + `supabase` |
| Quản lý files | `filesystem` |
| Design system & UI tokens | `ui-ux` |
| Figma design review | `figma-mcp` |
| Data visualization | `antv-chart` |

### Phase 3: Development
| Task | MCP to use |
|------|------------|
| Database queries | `hubspot-db` |
| Supabase migrations & SQL | `supabase` |
| File operations | `filesystem` |
| Fetch external APIs | `fetch` |
| Store knowledge | `memory` |
| Git operations | `git` |
| Payment integration | `stripe` |
| Redis caching/queues | `upstash` |

### Phase 4: Testing & Deployment
| Task | MCP to use |
|------|------------|
| Check data integrity | `hubspot-db` |
| Create PR/issues | `github` |
| Debug complex issues | `sequential-thinking` + `thinking` |
| Browser E2E testing | `browser-use` |
| Git status/diff/commit | `git` |

---

## WORKFLOW COMBINATIONS

### 1. Research & Document
```
tavily/exa (search) → sequential-thinking (analyze) → memory (store) → implement
```

### 2. Build feature mới
```
sequential-thinking (plan) → hubspot-db (schema) → filesystem (code) → github (PR)
```

### 3. Debug database issues
```
hubspot-db (query) → sequential-thinking (analyze) → filesystem (fix) → hubspot-db (verify)
```

### 4. Fetch & Process external data
```
fetch (API call) → sequential-thinking (process) → hubspot-db (store) → memory (cache)
```

### 5. Design → Code pipeline
```
figma-mcp (review) → ui-ux (design tokens) → filesystem (implement) → browser-use (test)
```

### 6. Payment integration
```
stripe (setup products/prices) → hubspot-db (store refs) → filesystem (code) → stripe (verify)
```

### 7. Data visualization
```
hubspot-db (query data) → antv-chart (generate chart) → filesystem (embed)
```

### 8. Web scraping & analysis
```
apify (scrape) → sequential-thinking (analyze) → memory (store insights)
```

---

### 4. Skills Available (from everything-claude-code + built-in)

#### Development Skills
| Skill | Chức năng |
|-------|-----------|
| `coding-standards` | Coding standards cho TypeScript/React/Node.js |
| `backend-patterns` | Backend architecture, API design, DB optimization |
| `frontend-patterns` | React/Next.js patterns, state management |
| `postgres-patterns` | PostgreSQL query optimization, schema design |
| `security-review` | Security checklist, auth, OWASP patterns |
| `tdd-workflow` | Test-driven development, 80%+ coverage |
| `verification-loop` | Code verification & validation |
| `continuous-learning` | Auto-extract reusable patterns |
| `strategic-compact` | Smart context compaction |

#### Design & Research Skills
| Skill | Chức năng |
|-------|-----------|
| `implement-design` | Figma → production code |
| `ux-researcher-designer` | UX research, personas, journey maps |
| `tailwind-design-system` | Tailwind CSS design systems |
| `research` | AI-synthesized research with citations |

#### Automation Skills
| Skill | Chức năng |
|-------|-----------|
| `apify-ultimate-scraper` | Web scraping any platform |
| `browser-use` | Browser automation & testing |

#### Slash Commands (from everything-claude-code)
| Command | Chức năng |
|---------|-----------|
| `/plan` | Restate requirements, create step-by-step plan |
| `/tdd` | Test-driven development workflow |
| `/code-review` | Comprehensive code review |
| `/build-fix` | Build and fix errors |
| `/verify` | Verify implementation |
| `/e2e` | Generate & run E2E tests (Playwright) |
| `/checkpoint` | Save checkpoint |
| `/learn` | Extract reusable patterns |
| `/refactor-clean` | Refactor & clean code |
| `/test-coverage` | Check & improve test coverage |
| `/update-docs` | Update documentation |

### 5. Agents Available (from everything-claude-code)
| Agent | Chức năng |
|-------|-----------|
| `architect` | System architecture design |
| `planner` | Task planning & decomposition |
| `code-reviewer` | Deep code review |
| `security-reviewer` | Security audit |
| `database-reviewer` | Database review |
| `tdd-guide` | TDD guidance |
| `e2e-runner` | E2E test runner |
| `build-error-resolver` | Build error fixing |
| `refactor-cleaner` | Code refactoring |
| `doc-updater` | Documentation updates |

### 6. Additional Tools Installed
| Tool | Version | Chức năng |
|------|---------|-----------|
| `taskmaster-ai` | MCP Server | AI task management from PRDs, 36 tools |
| `beads` (bd) | v0.49.6 | Git-backed issue tracker with SessionStart/PreCompact hooks |

## Project Structure
- **Framework:** Next.js 16 with TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Brand:** F-CORE (Ocean Blue theme #0891b2)
- **Location:** `/Users/chong/hubspot-demo`

---

## MANDATORY REFERENCES

> **QUAN TRỌNG:** Luôn đọc các file sau trước khi bắt đầu phiên làm việc mới!

| File | Mục đích | Khi nào đọc |
|------|----------|-------------|
| `docs/MASTER_PLAN.md` | Kế hoạch tổng thể, roadmap, clone strategy | **ĐẦU MỖI PHIÊN** |
| `docs/DEVELOPMENT_STRATEGY.md` | Chiến lược sử dụng Skills & MCP | Đầu mỗi phiên |
| `docs/MCP_USAGE_PLAN.md` | Chi tiết sử dụng từng MCP | Khi cần MCP |
| `docs/DESIGN_SYSTEM.md` | Design tokens, colors, typography | Khi code UI |
| `docs/REACT_BEST_PRACTICES.md` | React patterns, performance | Khi code React |

---

## QUICK START (Mỗi phiên mới)

```bash
# 1. Đọc strategy
cat docs/DEVELOPMENT_STRATEGY.md

# 2. Check task hiện tại
# Xem Section IX trong DEVELOPMENT_STRATEGY.md

# 3. Chọn workflow phù hợp
# Xem Section V trong DEVELOPMENT_STRATEGY.md
```

---

## SKILL QUICK REFERENCE

| Cần làm gì | Dùng Skill/Command |
|------------|-------------------|
| Research feature | `/research "topic"` |
| Clone UI | `/apify-ultimate-scraper` |
| Design UX | `/ux-researcher-designer` |
| Convert design → code | `/implement-design` |
| E2E testing | `/browser-use` |
| Write PRD | `/product-management:write-spec` |
| Plan roadmap | `/product-management:roadmap-update` |
| Sales prep | `/sales:call-prep` |
| Tailwind design system | `/tailwind-design-system` |
| React best practices | `/vercel-react-best-practices` |

## MCP QUICK REFERENCE

| Cần làm gì | MCP + Tool |
|------------|-----------|
| Query PostgreSQL | `hubspot-db` → `query` |
| Search web | `tavily` → `tavily_search` / `exa` → `web_search_exa` |
| Tạo chart | `antv-chart` → `generate_*_chart` |
| Git operations | `git` → `git_status`, `git_diff`, `git_commit` |
| Stripe payments | `stripe` → `create_product`, `create_price`, `create_payment_link` |
| Redis cache | `upstash` → `redis_database_run_redis_commands` |
| Supabase SQL | `supabase` → `execute_sql`, `apply_migration` |
| Figma designs | `figma-mcp` → `add_figma_file`, `view_node` |
| Browser automation | `browser-use` → `browser_task` |
| UI/UX patterns | `ui-ux` → `search_all`, `get_design_system` |
| Web scraping | `apify` → `search` |
| Save knowledge | `memory` → `create_entities`, `search_nodes` |

---

## CURRENT SPRINT

> Sprint 1: Core CRM (Xem chi tiết tại `docs/DEVELOPMENT_STRATEGY.md` Section IX)
