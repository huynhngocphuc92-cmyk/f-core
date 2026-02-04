# CLAUDE.md - F-CORE Project Rules

## CRITICAL RULES

### 1. NO SCREENSHOTS OR IMAGES
- **NEVER** take screenshots or work with image files
- **NEVER** read, analyze, or process image files (PNG, JPG, GIF, etc.)
- This rule exists to prevent context limit issues
- Use text-based descriptions instead of visual references

### 2. MCP Servers Available (9 servers)
| Server | Chức năng | Type |
|--------|-----------|------|
| `figma-mcp` | Figma design access | stdio |
| `tavily` | Web search | stdio |
| `apify` | Web scraping (RAG web browser) | stdio |
| `browser-use` | Browser automation cloud | HTTP |
| `ui-ux` | UI/UX design (colors, typography, Tailwind, Shadcn) | stdio |
| `context` | Code context, memory, ~75% token reduction | stdio |
| `supabase` | Database operations (PostgreSQL) | stdio |
| `git` | Git operations | stdio |
| `thinking` | Sequential thinking/complex reasoning | stdio |

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
| Tìm hiểu requirements | `tavily` + `thinking` |
| Research UI/UX patterns | `tavily` + `ui-ux` |
| Phân tích design từ Figma | `figma-mcp` |
| Scrape competitor websites | `apify` + `browser-use` |

### Phase 2: Design & Architecture
| Task | MCP to use |
|------|------------|
| Lên kế hoạch phức tạp | `thinking` (sequential reasoning) |
| Thiết kế UI components | `ui-ux` + `figma-mcp` |
| Thiết kế database schema | `supabase` |
| Quản lý code context | `context` |

### Phase 3: Development
| Task | MCP to use |
|------|------------|
| CRUD operations | `supabase` |
| Styling với Tailwind/Shadcn | `ui-ux` |
| Giữ context khi code dài | `context` |
| Git commit/branch | `git` |

### Phase 4: Testing & Automation
| Task | MCP to use |
|------|------------|
| E2E testing | `browser-use` |
| Automated workflows | `browser-use` + `apify` |
| Debug complex issues | `thinking` |

---

## WORKFLOW COMBINATIONS

### 1. Clone UI từ website
```
apify (scrape) → ui-ux (analyze) → figma-mcp (compare) → code
```

### 2. Build feature mới
```
thinking (plan) → supabase (schema) → ui-ux (design) → git (commit)
```

### 3. Research & Implement
```
tavily (search) → context (store) → thinking (analyze) → implement
```

### 4. Full-stack development
```
figma-mcp (design) → ui-ux (tokens) → supabase (backend) → git (version)
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
| `docs/DEVELOPMENT_STRATEGY.md` | Chiến lược sử dụng Skills & MCP | Đầu mỗi phiên |
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
