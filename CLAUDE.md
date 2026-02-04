# CLAUDE.md - F-CORE Project Rules

## CRITICAL RULES

### 1. NO SCREENSHOTS OR IMAGES
- **NEVER** take screenshots or work with image files
- **NEVER** read, analyze, or process image files (PNG, JPG, GIF, etc.)
- This rule exists to prevent context limit issues
- Use text-based descriptions instead of visual references

### 2. MCP Servers Configured (7 servers)

| Server | Chức năng | Status |
|--------|-----------|--------|
| `hubspot-db` | PostgreSQL database queries | ✅ Active |
| `filesystem` | File operations trong project | ✅ Active |
| `github` | GitHub API (PR, issues) | ✅ Active |
| `tavily` | Web search, research | ✅ Active |
| `memory` | Persistent memory across sessions | ✅ Active |
| `sequential-thinking` | Complex reasoning | ✅ Active |
| `fetch` | HTTP requests | ✅ Active |

**Config file:** `~/.mcp.json` và `/Users/chong/hubspot-demo/.mcp.json`
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
| Tìm hiểu requirements | `tavily` + `sequential-thinking` |
| Research UI/UX patterns | `tavily` + `fetch` |
| Lưu context quan trọng | `memory` |

### Phase 2: Design & Architecture
| Task | MCP to use |
|------|------------|
| Lên kế hoạch phức tạp | `sequential-thinking` |
| Thiết kế database schema | `hubspot-db` |
| Quản lý files | `filesystem` |

### Phase 3: Development
| Task | MCP to use |
|------|------------|
| Database queries | `hubspot-db` |
| File operations | `filesystem` |
| Fetch external APIs | `fetch` |
| Store knowledge | `memory` |

### Phase 4: Testing & Deployment
| Task | MCP to use |
|------|------------|
| Check data integrity | `hubspot-db` |
| Create PR/issues | `github` |
| Debug complex issues | `sequential-thinking` |

---

## WORKFLOW COMBINATIONS

### 1. Research & Document
```
tavily (search) → sequential-thinking (analyze) → memory (store) → implement
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

---

### 4. Skills Available
- `apify-ultimate-scraper`: Web scraping
- `browser-use`: Browser automation
- `implement-design`: Design implementation
- `research`: Research tasks
- `ux-researcher-designer`: UX research and design
- `tailwind-design-system`: Build scalable design systems
- `vercel-react-best-practices`: React/Next.js performance optimization

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

---

## CURRENT SPRINT

> Sprint 1: Core CRM (Xem chi tiết tại `docs/DEVELOPMENT_STRATEGY.md` Section IX)
