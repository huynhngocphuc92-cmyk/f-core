# F-CORE Development Strategy
> Version: 1.0
> Last Updated: 2026-02-04
> Purpose: Hướng dẫn sử dụng Skills & MCP để phát triển dự án

---

## I. TỔNG QUAN DỰ ÁN

### Mục tiêu
Xây dựng F-CORE - một CRM platform clone HubSpot với các tính năng:
- Contact & Company Management
- Deal Pipeline
- Marketing Automation
- Sales Hub
- Service Hub
- Reporting & Analytics

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes, Prisma ORM |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| Theme | Ocean Blue (#0891b2) |

---

## II. CÔNG CỤ SẴN CÓ

### A. MCP Servers

| Server | Chức năng | Khi nào dùng |
|--------|-----------|--------------|
| `hubspot-db` | PostgreSQL queries | Kiểm tra data, debug queries, seed data |
| `filesystem` | File operations | Đọc/ghi files trong project |
| `github` | GitHub API | PR, issues, code review (cần config token) |

### B. Skills

| Skill | Chức năng | Khi nào dùng |
|-------|-----------|--------------|
| `apify-ultimate-scraper` | Web scraping | Clone UI từ websites, lấy data mẫu |
| `browser-use` | Browser automation | E2E testing, automated workflows |
| `implement-design` | Design to code | Convert Figma/mockup thành React components |
| `research` | Web research | Tìm hiểu best practices, competitor analysis |
| `ux-researcher-designer` | UX patterns | Thiết kế user flows, wireframes |

### C. Plugins

| Plugin | Skills | Khi nào dùng |
|--------|--------|--------------|
| `sales` | call-prep, pipeline, forecast | Thiết kế Sales Hub features |
| `product-management` | spec, roadmap, research | Planning, PRD, feature specs |

---

## III. CHIẾN LƯỢC THEO PHASE

### Phase 1: Research & Planning (Nghiên cứu)

**Mục tiêu:** Hiểu rõ requirements, competitor, best practices

**Workflow:**
```
research (Tavily) → Phân tích → Document
     ↓
apify-ultimate-scraper → Clone UI patterns
     ↓
product-management:spec → Viết PRD
```

**Cách dùng:**
1. `/research` - Tìm hiểu HubSpot features, CRM best practices
2. `/apify-ultimate-scraper` - Scrape UI patterns từ HubSpot, Salesforce
3. `/product-management:write-spec` - Viết feature specification

**Output:** PRD, Feature specs, UI references

---

### Phase 2: Design & UI/UX

**Mục tiêu:** Thiết kế UI/UX nhất quán

**Workflow:**
```
ux-researcher-designer → User flows, wireframes
     ↓
implement-design → React components
     ↓
Tailwind Design System → Consistent styling
```

**Cách dùng:**
1. `/ux-researcher-designer` - Thiết kế user journeys, wireframes
2. `/implement-design` - Convert designs thành code
3. Tham chiếu `docs/DESIGN_SYSTEM.md` cho styling

**Output:** Component library, Design tokens, User flows

---

### Phase 3: Database & Backend

**Mục tiêu:** Xây dựng data layer solid

**Workflow:**
```
hubspot-db (MCP) → Schema design
     ↓
Prisma migrations → Type-safe queries
     ↓
API Routes → RESTful endpoints
```

**Cách dùng:**
1. `hubspot-db` MCP để inspect existing data
2. Prisma schema cho type safety
3. Supabase cho realtime features

**Rules:**
- Mọi entity phải có `tenant_id` (multi-tenancy)
- Soft delete với `deleted_at` timestamp
- Audit logs cho sensitive operations

**Output:** Prisma schema, API endpoints, Migrations

---

### Phase 4: Frontend Development

**Mục tiêu:** Build UI components và pages

**Workflow:**
```
Existing components → Check trước khi tạo mới
     ↓
implement-design → New components
     ↓
React Best Practices → Optimize
```

**Cách dùng:**
1. Check `src/components/` trước khi tạo component mới
2. `/implement-design` cho complex UIs
3. Tham chiếu `docs/REACT_BEST_PRACTICES.md`

**Rules:**
- TypeScript strict mode
- Server Components by default, Client only khi cần
- Responsive design (mobile-first)

**Output:** Pages, Components, Hooks

---

### Phase 5: Testing & QA

**Mục tiêu:** Đảm bảo chất lượng

**Workflow:**
```
browser-use → E2E tests
     ↓
Manual testing → Edge cases
     ↓
Performance audit → Optimize
```

**Cách dùng:**
1. `/browser-use` cho automated E2E testing
2. Lighthouse cho performance
3. Security audit cho vulnerabilities

**Output:** Test suites, Bug fixes, Performance improvements

---

### Phase 6: Deployment

**Mục tiêu:** Ship to production

**Workflow:**
```
github (MCP) → PR & Review
     ↓
Vercel → Deploy
     ↓
Monitoring → Track issues
```

---

## IV. DECISION MATRIX

### Khi nào dùng Skill nào?

| Tình huống | Skill/MCP | Lý do |
|------------|-----------|-------|
| Cần clone UI từ website | `apify-ultimate-scraper` | Scrape HTML/CSS patterns |
| Cần research feature | `research` | Tìm best practices |
| Cần design UX flow | `ux-researcher-designer` | User-centered design |
| Cần convert design → code | `implement-design` | Accurate implementation |
| Cần test flows | `browser-use` | Automated testing |
| Cần check database | `hubspot-db` MCP | SQL queries |
| Cần write PRD | `product-management:write-spec` | Structured specs |
| Cần plan roadmap | `product-management:roadmap-update` | Prioritization |

---

## V. COMMON WORKFLOWS

### A. Thêm Feature Mới

```
1. /product-management:write-spec     → Define requirements
2. /ux-researcher-designer            → Design UX
3. hubspot-db MCP                     → Design schema
4. /implement-design                  → Build UI
5. /browser-use                       → Test
```

### B. Clone UI từ Competitor

```
1. /research                          → Understand feature
2. /apify-ultimate-scraper            → Scrape UI patterns
3. /implement-design                  → Convert to React
4. Tailwind styling                   → Apply F-CORE theme
```

### C. Debug Issue

```
1. hubspot-db MCP                     → Check data
2. Read logs                          → Identify error
3. Fix code                           → Implement solution
4. /browser-use                       → Verify fix
```

### D. Performance Optimization

```
1. Lighthouse audit                   → Identify issues
2. /research                          → Best practices
3. Implement fixes                    → Code changes
4. Re-audit                           → Verify improvements
```

---

## VI. QUALITY GATES

Mỗi feature phải pass:

- [ ] TypeScript: No errors
- [ ] Build: Successful
- [ ] Responsive: Mobile + Desktop
- [ ] Security: No OWASP top 10 vulnerabilities
- [ ] Performance: Lighthouse > 90
- [ ] Accessibility: WCAG 2.1 AA

---

## VII. FILE STRUCTURE

```
/Users/chong/hubspot-demo/
├── docs/
│   ├── DEVELOPMENT_STRATEGY.md  ← This file
│   ├── DESIGN_SYSTEM.md         ← UI tokens, colors, typography
│   └── REACT_BEST_PRACTICES.md  ← React patterns
├── src/
│   ├── app/                     ← Next.js pages
│   ├── components/
│   │   ├── ui/                  ← Reusable UI components
│   │   ├── layout/              ← Header, Footer, Sidebar
│   │   └── sections/            ← Page sections
│   ├── lib/                     ← Utilities, helpers
│   ├── hooks/                   ← Custom React hooks
│   └── types/                   ← TypeScript types
├── prisma/                      ← Database schema
└── .env                         ← Environment variables
```

---

## VIII. QUICK REFERENCE

### Slash Commands

```bash
# Research & Planning
/research "HubSpot deal pipeline features"
/product-management:write-spec "Contact management module"

# Design
/ux-researcher-designer "Design contact detail page"
/implement-design "Convert Figma to React"

# Testing
/browser-use "Test login flow"

# Sales Features
/sales:pipeline-review
/sales:call-prep "Meeting with client X"
```

### MCP Usage

```sql
-- Check contacts
SELECT * FROM contacts WHERE tenant_id = 'xxx' LIMIT 10;

-- Analyze deals
SELECT status, COUNT(*) FROM deals GROUP BY status;
```

---

## IX. NEXT STEPS (ROADMAP)

### Sprint 1: Core CRM
- [ ] Contact Management (CRUD)
- [ ] Company Management (CRUD)
- [ ] Basic Dashboard

### Sprint 2: Sales Hub
- [ ] Deal Pipeline
- [ ] Activities & Tasks
- [ ] Notes & Timeline

### Sprint 3: Marketing Hub
- [ ] Email Templates
- [ ] Forms & Landing Pages
- [ ] Basic Automation

### Sprint 4: Analytics
- [ ] Reports & Dashboards
- [ ] Custom Properties
- [ ] Data Export

---

## X. AI TEAMS WORKFLOW

> Full details: `docs/AI_TEAMS_STRATEGY.md`

### Overview

Every feature is built by 3 specialized AI teams in sequence:

```
Team 1 (Research) → Gate 1 → Team 2 (Execution) → Gate 2 → Team 3 (Testing) → Gate 3 → PR
                                                                    |                |
                                                                    +-- Fix Loop ----+
                                                                    (max 3 cycles)
```

### Team Summary

| Team | Roles | Parallel? | Output |
|------|-------|-----------|--------|
| **Research** | Director + 3 Analysts | 3 analysts parallel | `docs/research/{feature}/` |
| **Execution** | Tech Lead + 4 Engineers | Backend + Frontend parallel | Source code + `docs/plans/{feature}/` |
| **Testing** | QA Lead + 3 Testers | 3 testers parallel | `docs/test-reports/{feature}/` |

### Quality Gates

| Gate | Checks | Automated? |
|------|--------|-----------|
| **Gate 1** | Research files complete, 3+ competitors, flows documented | Manual read |
| **Gate 2** | `tsc --noEmit`, `next build`, ESLint, tenant_id, soft delete | Automated commands |
| **Gate 3** | E2E pass, data integrity, code review, zero bugs | Manual read |

### How to Start a Feature

```
1. User: "Build {feature name}"
2. Orchestrator creates ~17 tasks with dependencies (see AI_TEAMS_STRATEGY.md Section VII)
3. Fire Team 1 (3 parallel research Task agents)
4. Evaluate Gate 1
5. Fire Team 2 (sequential: Plan → DB → Backend||Frontend → Polish)
6. Evaluate Gate 2
7. Fire Team 3 (3 parallel testing Task agents)
8. Evaluate Gate 3
9. If pass → git commit & PR
10. If fail → Fix Loop (max 3 cycles)
```

### Fix Loop
- QA writes bug reports to `docs/bugs/{feature}/`
- Tech Lead assigns fixes to appropriate specialist
- QA re-tests only fixed bugs
- Max 3 cycles, then escalate to user

### Session Resume
```
1. memory.open_nodes(["feature:{name}"]) → get state
2. TaskList → get pending tasks
3. Read docs/ artifacts → understand progress
4. Continue from next_step
```

---

*Tài liệu này được tự động tham chiếu trong mọi phiên làm việc.*
