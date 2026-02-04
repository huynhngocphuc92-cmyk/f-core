# CLAUDE.md - HubSpot Demo Project Rules

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

### 3. Skills Available
- `apify-ultimate-scraper`: Web scraping
- `browser-use`: Browser automation
- `implement-design`: Design implementation
- `research`: Research tasks
- `ux-researcher-designer`: UX research and design

## Project Structure
- Next.js project with TypeScript
- Tailwind CSS for styling
- Located at `/Users/chong/hubspot-demo`
