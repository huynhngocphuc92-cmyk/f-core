# F-CORE MASTER PLAN
> Version: 1.0
> Project: F-CORE - HubSpot CRM Clone
> Created: 2026-02-04
> Status: ACTIVE

---

## I. TẦM NHÌN & MỤC TIÊU

### Vision
Xây dựng F-CORE thành một CRM platform hoàn chỉnh, clone 80% tính năng của HubSpot với UI/UX hiện đại, phù hợp cho thị trường Việt Nam và Đông Nam Á.

### Mục tiêu cụ thể

| Giai đoạn | Mục tiêu | Timeline |
|-----------|----------|----------|
| MVP | Core CRM (Contacts, Companies, Deals) | Sprint 1-3 |
| Phase 1 | Sales Hub hoàn chỉnh | Sprint 4-6 |
| Phase 2 | Marketing Hub cơ bản | Sprint 7-9 |
| Phase 3 | Service Hub | Sprint 10-12 |
| Phase 4 | Advanced Features | Sprint 13+ |

### Success Metrics
- [ ] 100% responsive trên mobile/desktop
- [ ] Page load < 2 seconds
- [ ] Lighthouse score > 90
- [ ] 0 critical security vulnerabilities

---

## II. KIẾN TRÚC HUBSPOT CẦN CLONE

### A. 6 Product Hubs

```
┌─────────────────────────────────────────────────────────────┐
│                        F-CORE CRM                           │
├──────────┬──────────┬──────────┬──────────┬────────┬───────┤
│ Marketing│  Sales   │ Service  │   CMS    │  Ops   │Commerce│
│   Hub    │   Hub    │   Hub    │   Hub    │  Hub   │  Hub   │
├──────────┴──────────┴──────────┴──────────┴────────┴───────┤
│                    CORE CRM DATABASE                        │
│         (Contacts, Companies, Deals, Activities)            │
└─────────────────────────────────────────────────────────────┘
```

### B. Core Objects Model

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CONTACTS   │────▶│  COMPANIES  │────▶│    DEALS    │
│             │     │             │     │             │
│ - name      │     │ - name      │     │ - name      │
│ - email     │     │ - domain    │     │ - amount    │
│ - phone     │     │ - industry  │     │ - stage     │
│ - lifecycle │     │ - size      │     │ - close_date│
│ - owner     │     │ - owner     │     │ - pipeline  │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    ┌───────▼───────┐
                    │  ACTIVITIES   │
                    │               │
                    │ - emails      │
                    │ - calls       │
                    │ - meetings    │
                    │ - notes       │
                    │ - tasks       │
                    └───────────────┘
```

### C. Feature Priority Matrix

| Feature | Priority | Complexity | Hub |
|---------|----------|------------|-----|
| Contact CRUD | P0 | Low | Core |
| Company CRUD | P0 | Low | Core |
| Deal Pipeline | P0 | Medium | Sales |
| Activity Timeline | P0 | Medium | Core |
| Property System | P1 | High | Core |
| Email Tracking | P1 | Medium | Sales |
| Meeting Scheduler | P1 | Medium | Sales |
| Workflow Automation | P2 | High | Ops |
| Email Marketing | P2 | High | Marketing |
| Ticketing System | P2 | Medium | Service |
| Form Builder | P3 | Medium | Marketing |
| Knowledge Base | P3 | Medium | Service |
| Custom Reports | P3 | High | Core |

---

## III. CHIẾN LƯỢC SỬ DỤNG MCP & SKILLS

### A. MCP Mapping theo Task

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ RESEARCH│───▶│  DESIGN  │───▶│   BUILD  │───▶│ DEPLOY │ │
│  └────┬────┘    └────┬─────┘    └────┬─────┘    └───┬────┘ │
│       │              │               │              │       │
│  ┌────▼────┐    ┌────▼─────┐    ┌────▼─────┐   ┌───▼────┐  │
│  │ tavily  │    │sequential│    │hubspot-db│   │ github │  │
│  │ fetch   │    │-thinking │    │filesystem│   │        │  │
│  │ memory  │    │ memory   │    │ fetch    │   │        │  │
│  └─────────┘    └──────────┘    └──────────┘   └────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### B. Chi tiết sử dụng từng MCP

#### 1. `tavily` - Web Research
```
WHEN: Cần research HubSpot features, best practices, UI patterns
HOW:  "Search HubSpot [feature] implementation"
USE:
  - Research competitor features
  - Find UI/UX patterns
  - Technical documentation
  - Best practices
```

#### 2. `hubspot-db` - Database Operations
```
WHEN: Design schema, query data, debug issues
HOW:  SQL queries trực tiếp
USE:
  - Design table structure
  - Test queries before coding
  - Seed test data
  - Debug data issues
  - EXPLAIN ANALYZE for optimization
```

#### 3. `filesystem` - File Operations
```
WHEN: Create/read/update project files
HOW:  Read/write file operations
USE:
  - Create new components
  - Update existing code
  - Read project structure
  - Manage configuration
```

#### 4. `github` - Version Control & Collaboration
```
WHEN: Code review, PR management, releases
HOW:  GitHub API operations
USE:
  - Create branches
  - Open PRs
  - Review code
  - Manage issues
  - Create releases
```

#### 5. `memory` - Persistent Knowledge
```
WHEN: Store important context across sessions
HOW:  Key-value storage
USE:
  - Store architecture decisions
  - Remember user preferences
  - Cache research findings
  - Track progress
```

#### 6. `sequential-thinking` - Complex Analysis
```
WHEN: Complex problem solving, architecture decisions
HOW:  Step-by-step reasoning
USE:
  - Design system architecture
  - Debug complex issues
  - Plan feature implementation
  - Analyze trade-offs
```

#### 7. `fetch` - External API Calls
```
WHEN: Call external APIs, fetch resources
HOW:  HTTP requests
USE:
  - Fetch API documentation
  - Test external integrations
  - Download resources
```

### C. Skills Mapping

| Task | Skill | Command |
|------|-------|---------|
| Clone UI từ website | apify-ultimate-scraper | `/apify-ultimate-scraper` |
| Browser automation | browser-use | `/browser-use` |
| Convert design → code | implement-design | `/implement-design` |
| Research topics | research | `/research "topic"` |
| UX design | ux-researcher-designer | `/ux-researcher-designer` |
| Design system | tailwind-design-system | Tự động áp dụng |
| React optimization | vercel-react-best-practices | Tự động áp dụng |

### D. Workflow Combinations

#### Workflow 1: Clone HubSpot Feature
```
1. /research "HubSpot [feature] UI UX"
   → Understand feature requirements

2. /apify-ultimate-scraper
   → Scrape UI patterns from HubSpot

3. /ux-researcher-designer
   → Adapt design for F-CORE

4. sequential-thinking MCP
   → Plan implementation

5. hubspot-db MCP
   → Design database schema

6. /implement-design
   → Convert to React components

7. github MCP
   → Create PR for review
```

#### Workflow 2: Build New Feature
```
1. tavily MCP
   → Research best practices

2. memory MCP
   → Store requirements

3. sequential-thinking MCP
   → Design architecture

4. hubspot-db MCP
   → Create schema/migrations

5. filesystem MCP
   → Implement code

6. github MCP
   → Deploy
```

#### Workflow 3: Debug & Fix
```
1. hubspot-db MCP
   → Query data, check state

2. sequential-thinking MCP
   → Analyze issue

3. filesystem MCP
   → Fix code

4. hubspot-db MCP
   → Verify fix

5. github MCP
   → Commit & PR
```

---

## IV. CHIẾN LƯỢC CLONE HUBSPOT

### A. UI/UX Clone Strategy

#### 1. Design System Extraction

**HubSpot Design Tokens → F-CORE Tokens**

| HubSpot | F-CORE | Variable |
|---------|--------|----------|
| Orange #ff4800 | Ocean Blue #0891b2 | --color-primary |
| Navy #33475b | Gray #111827 | --color-text |
| White #ffffff | White #ffffff | --color-bg |

**Typography Mapping**
```css
/* HubSpot → F-CORE */
HubSpot Sans → Inter
H1: 40px/600 → 48px/700
H2: 32px/600 → 36px/700
Body: 16px/400 → 16px/400
```

#### 2. Component Clone Priority

| Component | HubSpot Reference | Priority |
|-----------|-------------------|----------|
| DataTable | contacts/companies list | P0 |
| Pipeline Board | deals pipeline | P0 |
| Record Card | contact detail | P0 |
| Activity Timeline | engagement feed | P0 |
| Property Editor | inline editing | P1 |
| Filter Panel | advanced filters | P1 |
| Form Builder | forms tool | P2 |
| Dashboard Widget | reporting | P2 |

#### 3. Page Layout Patterns

**List View Layout**
```
┌────────────────────────────────────────────────────┐
│ Header: Title + Actions (Create, Import, Export)   │
├────────────────────────────────────────────────────┤
│ Filters: Quick filters + Advanced filters button   │
├────────────────────────────────────────────────────┤
│ Table/Board View                                   │
│ - Columns: Checkbox, Avatar, Name, Email, ...      │
│ - Actions: Hover actions, Bulk actions             │
│ - Pagination: Infinite scroll or paginated         │
├────────────────────────────────────────────────────┤
│ Footer: Record count, Pagination controls          │
└────────────────────────────────────────────────────┘
```

**Detail View Layout**
```
┌────────────────────────────────────────────────────┐
│ Header: Back + Name + Actions (Edit, Delete, ...)  │
├──────────────┬─────────────────────┬───────────────┤
│ Left Panel   │   Center Panel      │ Right Panel   │
│              │                     │               │
│ - Avatar     │ - Activity Timeline │ - Associations│
│ - Properties │ - Emails            │ - Companies   │
│ - Lifecycle  │ - Calls             │ - Deals       │
│ - Owner      │ - Meetings          │ - Tickets     │
│              │ - Notes             │               │
│              │ - Tasks             │               │
└──────────────┴─────────────────────┴───────────────┘
```

**Pipeline Board Layout**
```
┌────────────────────────────────────────────────────┐
│ Header: Pipeline selector + View options + Actions │
├────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ Stage 1 │ │ Stage 2 │ │ Stage 3 │ │ Stage 4 │   │
│ │ $50K    │ │ $120K   │ │ $80K    │ │ $200K   │   │
│ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤   │
│ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │   │
│ │ │Deal1│ │ │ │Deal3│ │ │ │Deal5│ │ │ │Deal7│ │   │
│ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │   │
│ │ ┌─────┐ │ │ ┌─────┐ │ │         │ │         │   │
│ │ │Deal2│ │ │ │Deal4│ │ │         │ │         │   │
│ │ └─────┘ │ │ └─────┘ │ │         │ │         │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└────────────────────────────────────────────────────┘
```

### B. Feature Clone Strategy

#### Phase 1: Core CRM (MVP)

**1.1 Contacts Module**
```
Features to clone:
├── Contact List View
│   ├── Table with sortable columns
│   ├── Quick search
│   ├── Advanced filters
│   ├── Bulk actions
│   └── Export to CSV
├── Contact Detail View
│   ├── Property editing
│   ├── Activity timeline
│   ├── Associations panel
│   └── Owner assignment
└── Contact Create/Edit
    ├── Form with validation
    ├── Duplicate detection
    └── Auto-save draft
```

**1.2 Companies Module**
```
Features to clone:
├── Company List View
│   ├── Table/Card view toggle
│   ├── Domain-based search
│   └── Industry filters
├── Company Detail View
│   ├── Company properties
│   ├── Associated contacts
│   ├── Associated deals
│   └── Activity feed
└── Company Create/Edit
    ├── Domain lookup
    ├── Auto-fill from domain
    └── Logo upload
```

**1.3 Deals Module**
```
Features to clone:
├── Pipeline Board View
│   ├── Drag-drop cards
│   ├── Stage totals
│   ├── Multiple pipelines
│   └── Win probability
├── Deal List View
│   ├── Table with amount sorting
│   ├── Close date filters
│   └── Owner filters
├── Deal Detail View
│   ├── Deal properties
│   ├── Stage history
│   ├── Associated records
│   └── Activity timeline
└── Pipeline Settings
    ├── Stage configuration
    ├── Deal properties
    └── Automation triggers
```

#### Phase 2: Sales Hub

**2.1 Activities**
```
├── Email tracking
├── Call logging
├── Meeting scheduler
├── Task management
└── Notes
```

**2.2 Sales Tools**
```
├── Email templates
├── Sequences (follow-up automation)
├── Documents sharing
└── Quotes
```

#### Phase 3: Marketing Hub

**3.1 Lead Generation**
```
├── Form builder
├── Landing pages
├── Pop-ups
└── Live chat
```

**3.2 Email Marketing**
```
├── Email editor
├── Campaign management
├── A/B testing
└── Analytics
```

#### Phase 4: Service Hub

**4.1 Ticketing**
```
├── Ticket management
├── SLA tracking
├── Routing rules
└── Ticket views
```

**4.2 Knowledge Base**
```
├── Article editor
├── Categories
├── Search
└── Analytics
```

---

## V. DATABASE SCHEMA STRATEGY

### A. Core Tables

```sql
-- Multi-tenancy: Mọi table đều có tenant_id
-- Soft delete: Mọi table đều có deleted_at
-- Audit: created_at, updated_at, created_by, updated_by

-- Core Objects
CREATE TABLE contacts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    lifecycle_stage VARCHAR(50),
    lead_status VARCHAR(50),
    owner_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    properties JSONB DEFAULT '{}'
);

CREATE TABLE companies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    size VARCHAR(50),
    owner_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    properties JSONB DEFAULT '{}'
);

CREATE TABLE deals (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2),
    stage_id UUID,
    pipeline_id UUID,
    close_date DATE,
    owner_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    properties JSONB DEFAULT '{}'
);

-- Associations
CREATE TABLE contact_company (
    contact_id UUID,
    company_id UUID,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (contact_id, company_id)
);

CREATE TABLE deal_contact (
    deal_id UUID,
    contact_id UUID,
    role VARCHAR(50),
    PRIMARY KEY (deal_id, contact_id)
);

-- Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(50), -- email, call, meeting, note, task
    subject VARCHAR(255),
    body TEXT,
    contact_id UUID,
    company_id UUID,
    deal_id UUID,
    owner_id UUID,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline Configuration
CREATE TABLE pipelines (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY,
    pipeline_id UUID,
    name VARCHAR(100),
    order_index INTEGER,
    probability INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### B. Indexes Strategy

```sql
-- Performance indexes
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(lifecycle_stage);

CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_companies_domain ON companies(domain);

CREATE INDEX idx_deals_tenant ON deals(tenant_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_close_date ON deals(close_date);

CREATE INDEX idx_activities_tenant ON activities(tenant_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
```

---

## VI. SPRINT ROADMAP

### Sprint 1: Foundation (Week 1-2)
```
□ Setup Prisma schema với core tables
□ Setup Supabase Auth
□ Create base layout (Sidebar, Header)
□ Setup API routes structure
□ Create shared UI components
```

### Sprint 2: Contacts Module (Week 3-4)
```
□ Contact list view với table
□ Contact detail view
□ Contact create/edit forms
□ Activity timeline component
□ Search và filters
```

### Sprint 3: Companies & Associations (Week 5-6)
```
□ Company list/detail views
□ Company create/edit
□ Contact-Company associations
□ Association management UI
```

### Sprint 4: Deals & Pipeline (Week 7-8)
```
□ Pipeline board (Kanban)
□ Deal cards với drag-drop
□ Deal detail view
□ Pipeline settings
□ Stage management
```

### Sprint 5: Activities & Timeline (Week 9-10)
```
□ Activity types (email, call, meeting, note, task)
□ Activity logging UI
□ Timeline improvements
□ Task management
□ Notifications
```

### Sprint 6: Dashboard & Reports (Week 11-12)
```
□ Dashboard layout
□ Key metrics widgets
□ Deal forecast
□ Activity reports
□ Export functionality
```

---

## VII. AUTOMATION STRATEGY

### A. MCP-Powered Automation

```
1. Auto-research khi bắt đầu feature mới:
   tavily → research best practices → memory → store

2. Auto-schema design:
   sequential-thinking → analyze requirements → hubspot-db → create tables

3. Auto-component generation:
   implement-design → parse requirements → filesystem → create component

4. Auto-PR creation:
   filesystem → detect changes → github → create PR với description
```

### B. Development Automation Scripts

```bash
# scripts/new-feature.sh
# Tự động tạo structure cho feature mới

#!/bin/bash
FEATURE=$1

mkdir -p src/app/$FEATURE
mkdir -p src/components/features/$FEATURE
mkdir -p src/hooks/use$FEATURE
mkdir -p src/types/$FEATURE

echo "Created structure for $FEATURE"
```

---

## VIII. QUALITY ASSURANCE

### A. Code Quality Gates

| Check | Tool | Threshold |
|-------|------|-----------|
| TypeScript | tsc --strict | 0 errors |
| Lint | ESLint | 0 errors |
| Format | Prettier | Auto-fix |
| Build | next build | Success |
| Tests | Jest/Vitest | 80% coverage |

### B. Performance Gates

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTI | < 3.5s |
| Bundle Size | < 200KB initial |

### C. Security Gates

| Check | Requirement |
|-------|-------------|
| SQL Injection | Parameterized queries only |
| XSS | Sanitize all user input |
| CSRF | Token validation |
| Auth | JWT + refresh tokens |
| Multi-tenancy | tenant_id on ALL queries |

---

## IX. MONITORING & ITERATION

### A. Success Tracking

```
Weekly Review:
├── Features completed vs planned
├── Bug count and severity
├── Performance metrics
├── User feedback (when applicable)
└── Technical debt added/resolved

Monthly Review:
├── Sprint velocity
├── Feature coverage vs HubSpot
├── Architecture health
└── Team productivity
```

### B. Iteration Process

```
1. Demo feature → gather feedback
2. Compare with HubSpot → identify gaps
3. Prioritize improvements → update backlog
4. Implement → test → deploy
5. Repeat
```

---

## X. NEXT IMMEDIATE ACTIONS

### Today
- [ ] Finalize database schema
- [ ] Setup Prisma with initial migration
- [ ] Create base layout components

### This Week
- [ ] Complete Contacts list view
- [ ] Implement basic CRUD operations
- [ ] Setup authentication flow

### This Sprint
- [ ] Full Contacts module
- [ ] Activity timeline
- [ ] Basic search and filters

---

*Master Plan này sẽ được cập nhật sau mỗi sprint review.*
*Tham chiếu: docs/DEVELOPMENT_STRATEGY.md, docs/MCP_USAGE_PLAN.md*
