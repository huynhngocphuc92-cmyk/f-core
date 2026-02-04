# KẾ HOẠCH SỬ DỤNG MCP SERVERS
> Dự án: F-CORE (HubSpot Clone)
> Ngày cập nhật: 2026-02-04
> Status: ✅ ĐÃ CẤU HÌNH

---

## I. TỔNG QUAN MCP SERVERS

### A. Trạng thái hiện tại (ĐÃ CẤU HÌNH)

| MCP Server | Trạng thái | Package | Mục đích |
|------------|------------|---------|----------|
| `hubspot-db` | ✅ Active | @modelcontextprotocol/server-postgres | PostgreSQL queries |
| `filesystem` | ✅ Active | @modelcontextprotocol/server-filesystem | File operations |
| `github` | ⚠️ Need auth | @modelcontextprotocol/server-github | PR, issues |
| `tavily` | ✅ Active | @tavily/mcp-server | Web search |
| `memory` | ✅ Active | @modelcontextprotocol/server-memory | Persistent memory |
| `sequential-thinking` | ✅ Active | @modelcontextprotocol/server-sequential-thinking | Complex reasoning |
| `fetch` | ✅ Active | @modelcontextprotocol/server-fetch | HTTP requests |

### B. Config Files

- **Project config:** `/Users/chong/hubspot-demo/.mcp.json`
- **Global config:** `/Users/chong/.mcp.json`

---

## II. KẾ HOẠCH SỬ DỤNG THEO PHASE

### 🔬 PHASE 1: RESEARCH & PLANNING

#### MCP cần dùng:
| MCP | Mục đích | Ưu tiên |
|-----|----------|---------|
| `tavily` | Web search, competitor research | ⭐⭐⭐ Cao |
| `sequential-thinking` | Phân tích complex requirements | ⭐⭐ Trung bình |

#### Workflows:

**1.1 Research HubSpot Features**
```
Input: "HubSpot CRM features"
     ↓
[tavily] Search web for HubSpot documentation
     ↓
[thinking] Analyze and categorize features
     ↓
Output: Feature list prioritized
```

**1.2 Competitor Analysis**
```
Input: "Compare HubSpot vs Salesforce"
     ↓
[tavily] Search comparison articles
     ↓
[thinking] Create comparison matrix
     ↓
Output: Competitive analysis document
```

#### Ví dụ sử dụng:
```
Tôi: "Research các tính năng Contact Management của HubSpot"
AI: Sử dụng tavily MCP để search → Tổng hợp kết quả
```

---

### 🎨 PHASE 2: DESIGN & UI/UX

#### MCP cần dùng:
| MCP | Mục đích | Ưu tiên |
|-----|----------|---------|
| `figma-mcp` | Lấy designs từ Figma | ⭐⭐⭐ Cao |
| `filesystem` | Đọc/ghi component files | ⭐⭐⭐ Cao |

#### Workflows:

**2.1 Import Figma Design**
```
Input: Figma file URL
     ↓
[figma-mcp] Extract design tokens, components
     ↓
[filesystem] Create component files
     ↓
Output: React components matching Figma
```

**2.2 Create Design System**
```
Input: Brand guidelines
     ↓
[figma-mcp] Extract colors, typography
     ↓
[filesystem] Update tailwind.config.ts
     ↓
Output: Configured design tokens
```

#### Ví dụ sử dụng:
```
Tôi: "Import design từ Figma file này: https://figma.com/..."
AI: Sử dụng figma-mcp để extract → Tạo components
```

---

### 🗄️ PHASE 3: DATABASE & BACKEND

#### MCP cần dùng:
| MCP | Mục đích | Ưu tiên |
|-----|----------|---------|
| `hubspot-db` | PostgreSQL queries, schema | ⭐⭐⭐ Cao |
| `supabase` | Supabase operations, Auth | ⭐⭐⭐ Cao |
| `filesystem` | Prisma schema, migrations | ⭐⭐ Trung bình |

#### Workflows:

**3.1 Design Database Schema**
```
Input: Feature requirements
     ↓
[thinking] Design normalized schema
     ↓
[hubspot-db] Check existing tables
     ↓
[filesystem] Write Prisma schema
     ↓
Output: prisma/schema.prisma
```

**3.2 Seed Test Data**
```
Input: Data requirements
     ↓
[hubspot-db] INSERT test records
     ↓
[hubspot-db] Verify with SELECT
     ↓
Output: Test data in database
```

**3.3 Debug Query Performance**
```
Input: Slow query report
     ↓
[hubspot-db] EXPLAIN ANALYZE query
     ↓
[thinking] Analyze execution plan
     ↓
[hubspot-db] Add indexes
     ↓
Output: Optimized queries
```

#### Ví dụ sử dụng:
```sql
-- Kiểm tra contacts
SELECT * FROM contacts WHERE tenant_id = 'xxx' LIMIT 10;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM deals WHERE status = 'won';

-- Check foreign keys
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';
```

---

### 💻 PHASE 4: FRONTEND DEVELOPMENT

#### MCP cần dùng:
| MCP | Mục đích | Ưu tiên |
|-----|----------|---------|
| `filesystem` | Component CRUD | ⭐⭐⭐ Cao |
| `context` | Reduce token usage | ⭐⭐ Trung bình |

#### Workflows:

**4.1 Create New Component**
```
Input: Component requirements
     ↓
[filesystem] Check existing components
     ↓
[filesystem] Create new component file
     ↓
[filesystem] Update barrel exports
     ↓
Output: New component ready
```

**4.2 Large Refactoring**
```
Input: Refactoring scope
     ↓
[context] Store current codebase context
     ↓
[filesystem] Read affected files
     ↓
[filesystem] Apply changes
     ↓
[context] Update context
     ↓
Output: Refactored code
```

---

### ✅ PHASE 5: TESTING & QA

#### MCP cần dùng:
| MCP | Mục đích | Ưu tiên |
|-----|----------|---------|
| `hubspot-db` | Verify data integrity | ⭐⭐⭐ Cao |
| `github` | PR reviews, CI status | ⭐⭐ Trung bình |

#### Workflows:

**5.1 Data Integrity Check**
```
Input: Entity to verify
     ↓
[hubspot-db] Check orphan records
     ↓
[hubspot-db] Verify foreign keys
     ↓
[hubspot-db] Check constraints
     ↓
Output: Data quality report
```

**5.2 Pre-PR Verification**
```
Input: Branch to review
     ↓
[github] Get diff
     ↓
[hubspot-db] Verify migrations
     ↓
[github] Create PR
     ↓
Output: PR ready for review
```

---

### 🚀 PHASE 6: DEPLOYMENT

#### MCP cần dùng:
| MCP | Mục đích | Ưu tiên |
|-----|----------|---------|
| `github` | PR, releases | ⭐⭐⭐ Cao |
| `supabase` | Production DB | ⭐⭐⭐ Cao |

#### Workflows:

**6.1 Release Process**
```
Input: Version to release
     ↓
[github] Create release branch
     ↓
[github] Generate changelog
     ↓
[github] Create release tag
     ↓
[supabase] Run migrations
     ↓
Output: Production deployed
```

---

## III. MCP COMMAND REFERENCE

### hubspot-db (PostgreSQL)

```sql
-- Kiểm tra structure
\dt                              -- List tables
\d contacts                      -- Describe table

-- CRUD operations
SELECT * FROM contacts LIMIT 10;
INSERT INTO contacts (name, email, tenant_id) VALUES ('John', 'john@example.com', 'tenant1');
UPDATE contacts SET name = 'Jane' WHERE id = 1;
DELETE FROM contacts WHERE id = 1;  -- Avoid! Use soft delete

-- Analysis
EXPLAIN ANALYZE SELECT * FROM deals WHERE amount > 10000;

-- Maintenance
VACUUM ANALYZE contacts;
```

### filesystem

```
-- Read files
read /Users/chong/hubspot-demo/src/components/ui/button.tsx

-- Write files
write /Users/chong/hubspot-demo/src/components/ui/card.tsx [content]

-- List directory
ls /Users/chong/hubspot-demo/src/components/
```

### github

```
-- Repository info
get_repo owner/repo

-- Pull requests
list_prs owner/repo
create_pr owner/repo --title "feat: Add contacts" --body "..."

-- Issues
list_issues owner/repo
create_issue owner/repo --title "Bug: ..." --body "..."
```

### tavily (Web Search)

```
-- Search
search "HubSpot CRM API documentation"
search "React best practices 2024"

-- With filters
search "Next.js 14 server actions" --include_domains "nextjs.org,vercel.com"
```

### supabase

```
-- Auth
create_user email password
sign_in email password

-- Database
query "SELECT * FROM contacts"
insert contacts {name: "John", email: "john@test.com"}

-- Storage
upload bucket/path file
download bucket/path
```

---

## IV. PRIORITY SETUP

### Bước 1: Thiết lập ngay (Critical)

1. **Start PostgreSQL**
   ```bash
   # Kiểm tra PostgreSQL đang chạy
   pg_isready -h localhost -p 5432

   # Nếu chưa, start:
   brew services start postgresql@14
   ```

2. **Tạo database**
   ```bash
   createdb hubspot_clone
   ```

### Bước 2: Thiết lập sớm (High Priority)

1. **GitHub Token**
   - Vào https://github.com/settings/tokens
   - Generate new token (classic)
   - Scopes: repo, workflow
   - Cập nhật vào `.mcp.json`

2. **Supabase Project**
   - Tạo project tại https://supabase.com
   - Copy URL và anon key
   - Cập nhật vào `.mcp.json`

### Bước 3: Thiết lập sau (Medium Priority)

1. **Tavily** (đã có API key trong .env)
2. **Figma** (khi cần import designs)
3. **Context MCP** (khi codebase lớn)

---

## V. TROUBLESHOOTING

### MCP không kết nối được

```bash
# Check MCP server status
npx -y @modelcontextprotocol/server-postgres --help

# Test database connection
psql postgresql://postgres:123456@localhost:5432/hubspot_clone -c "SELECT 1"

# Check logs
tail -f ~/.claude/logs/mcp.log
```

### Database connection refused

```bash
# Check PostgreSQL running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@14
```

### GitHub token invalid

```bash
# Test token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

---

## VI. NEXT ACTIONS

1. [ ] Start PostgreSQL và tạo database `hubspot_clone`
2. [ ] Tạo GitHub Personal Access Token và cập nhật `.mcp.json`
3. [ ] Tạo Supabase project cho production
4. [ ] Cài đặt Tavily MCP với API key từ `.env`
5. [ ] Test từng MCP server hoạt động

---

*Kế hoạch này sẽ được cập nhật khi có thêm MCP servers mới.*
