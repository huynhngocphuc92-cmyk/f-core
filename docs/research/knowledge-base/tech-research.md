# Knowledge Base Feature - Technical Architecture Research

> **Project:** F-CORE (HubSpot CRM Clone)
> **Feature:** Knowledge Base (Service Hub)
> **Priority:** P3 (per MASTER_PLAN.md)
> **Stack:** Next.js 16, TypeScript (Strict), Prisma 7.x, PostgreSQL/Supabase, Tailwind CSS v4
> **Date:** 2026-02-09
> **Status:** RESEARCH COMPLETE

---

## Table of Contents

1. [Database Schema Design](#1-database-schema-design)
2. [Rich Text Editor Selection](#2-rich-text-editor-selection)
3. [Full-Text Search Implementation](#3-full-text-search-implementation)
4. [API Route Structure](#4-api-route-structure)
5. [SEO & Public Pages](#5-seo--public-pages)
6. [Content Storage Strategy](#6-content-storage-strategy)
7. [Performance & Caching](#7-performance--caching)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Database Schema Design

### 1.1 HubSpot Knowledge Base Model Analysis

HubSpot's Knowledge Base supports:
- **Categories** with nested subcategories (two levels deep)
- **Articles** with rich text, SEO metadata, publish workflow
- **Tags** for internal search enhancement (not visible to readers)
- **Feedback** (thumbs up/down per article)
- **Analytics** (view counts, search terms, engagement)
- **Multiple knowledge bases** per account (Enterprise only)
- **Access control** (public vs. private)

### 1.2 Prisma Schema Models

```prisma
// ============================================
// KNOWLEDGE BASE - Service Hub
// ============================================

model KBCategory {
  id            String    @id @default(uuid())
  tenantId      String

  // Content
  name          String
  slug          String
  description   String?   @db.Text
  icon          String?           // Lucide icon name or custom icon URL

  // Hierarchy (self-relation for nested categories)
  parentId      String?
  parent        KBCategory?       @relation("CategoryTree", fields: [parentId], references: [id], onDelete: SetNull)
  children      KBCategory[]      @relation("CategoryTree")

  // Display
  orderIndex    Int       @default(0)
  isVisible     Boolean   @default(true)

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  articles      KBArticle[]

  @@unique([tenantId, slug])
  @@unique([tenantId, parentId, slug])
  @@index([tenantId])
  @@index([parentId])
  @@index([tenantId, isVisible, deletedAt])
  @@index([orderIndex])
}

model KBArticle {
  id              String    @id @default(uuid())
  tenantId        String

  // Content
  title           String
  slug            String
  subtitle        String?           // HubSpot-style subtitle (H2)
  excerpt         String?   @db.Text // Auto-generated or manual summary
  contentJson     Json?             // Tiptap JSON (source of truth for editing)
  contentHtml     String?   @db.Text // Pre-rendered HTML (for display & SEO)

  // Categorization
  categoryId      String?
  tags            String[]  @default([]) // Internal tags for search improvement

  // Status & Workflow
  status          String    @default("draft") // draft, review, published, archived
  publishedAt     DateTime?
  publishedBy     String?

  // Authorship
  authorId        String?

  // SEO Metadata
  metaTitle       String?           // Override for <title> tag
  metaDescription String?   @db.Text // Meta description
  canonicalUrl    String?           // Canonical URL override
  noIndex         Boolean   @default(false) // robots noindex directive

  // Analytics
  viewCount       Int       @default(0)
  helpfulCount    Int       @default(0)    // Thumbs up
  notHelpfulCount Int       @default(0)    // Thumbs down

  // Access Control
  visibility      String    @default("public") // public, private, password
  password        String?

  // Full-Text Search (managed via raw SQL migration)
  // searchVector  Unsupported("tsvector")?

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?

  // Relations
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  category        KBCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  author          User?     @relation("KBArticleAuthor", fields: [authorId], references: [id], onDelete: SetNull)
  feedback        KBArticleFeedback[]

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, categoryId])
  @@index([tenantId, status, deletedAt])
  @@index([slug])
  @@index([publishedAt(sort: Desc)])
  @@index([viewCount(sort: Desc)])
  @@index([tags])                         // GIN index for array search
  // @@index([searchVector], type: Gin)   // Added via raw SQL migration
}

model KBArticleFeedback {
  id          String    @id @default(uuid())
  articleId   String
  tenantId    String

  // Feedback
  isHelpful   Boolean               // true = thumbs up, false = thumbs down
  comment     String?   @db.Text    // Optional written feedback

  // Visitor identification
  visitorId   String?               // Anonymous fingerprint or session ID
  contactId   String?               // Linked contact if authenticated
  ipAddress   String?               // For rate limiting

  // Audit
  createdAt   DateTime  @default(now())

  // Relations
  article     KBArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([articleId])
  @@index([tenantId])
  @@index([articleId, isHelpful])
  @@index([visitorId])
  @@unique([articleId, visitorId])   // One feedback per visitor per article
}
```

### 1.3 Required Additions to Existing Models

```prisma
// Add to existing Tenant model:
model Tenant {
  // ... existing fields ...
  kbCategories    KBCategory[]
  kbArticles      KBArticle[]
}

// Add to existing User model:
model User {
  // ... existing fields ...
  kbArticles      KBArticle[] @relation("KBArticleAuthor")
}
```

### 1.4 Raw SQL Migration for Full-Text Search

This migration must be applied AFTER the Prisma migration, as Prisma does not natively support `tsvector` columns:

```sql
-- Migration: add_kb_fulltext_search

-- 1. Add tsvector column to KBArticle
ALTER TABLE "KBArticle"
ADD COLUMN "search_vector" tsvector;

-- 2. Create GIN index for fast full-text search
CREATE INDEX "KBArticle_search_vector_idx"
ON "KBArticle" USING GIN("search_vector");

-- 3. Populate search_vector with weighted content
-- Title gets weight A (highest), subtitle weight B, tags weight C, content weight D
UPDATE "KBArticle" SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C') ||
  setweight(to_tsvector('english', coalesce(
    regexp_replace("contentHtml", '<[^>]*>', ' ', 'g'), ''
  )), 'D');

-- 4. Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION kb_article_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(
      regexp_replace(NEW."contentHtml", '<[^>]*>', ' ', 'g'), ''
    )), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
CREATE TRIGGER kb_article_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, subtitle, tags, "contentHtml"
ON "KBArticle"
FOR EACH ROW
EXECUTE FUNCTION kb_article_search_vector_update();

-- 6. Create trigram extension for fuzzy/autocomplete search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 7. Create trigram index on title for autocomplete suggestions
CREATE INDEX "KBArticle_title_trgm_idx"
ON "KBArticle" USING GIN (title gin_trgm_ops);
```

### 1.5 Entity Relationship Diagram

```
Tenant (1) ───────── (*) KBCategory
                          │
                          │ parentId (self-relation)
                          ├── KBCategory (children)
                          │
                          └──── (*) KBArticle
                                    │
                                    ├── author ──── User
                                    │
                                    └── (*) KBArticleFeedback
                                              │
                                              └── visitorId (anonymous)
                                                  contactId (authenticated)
```

---

## 2. Rich Text Editor Selection

### 2.1 Comparison Matrix

| Criteria | Tiptap | Lexical (Meta) | BlockNote | Plate (Slate) |
|----------|--------|----------------|-----------|---------------|
| **Architecture** | ProseMirror-based | Custom engine | ProseMirror + Tiptap | Slate-based |
| **React Integration** | Excellent | Excellent (React-first) | React-only | React-only |
| **TypeScript Support** | Good | Excellent | Good | Excellent |
| **Bundle Size (core)** | ~45KB gzipped | ~22KB gzipped | ~80KB gzipped | ~60KB gzipped |
| **Next.js SSR** | Works (client component) | Works (client component) | Works (client component) | Works (client component) |
| **Documentation** | Excellent, many examples | Improving, still gaps | Good | Good |
| **Extensions/Plugins** | 50+ official extensions | Plugin-based, growing | Block-based, built-in | Plugin-heavy |
| **Community** | Large, mature (GitHub: 30k+) | Growing fast (Meta-backed) | Growing | Moderate |
| **Headless/Unstyled** | Yes | Yes | No (has built-in UI) | Semi-headless |
| **Collaboration** | Yes (paid Cloud, or Yjs) | Yes (via Yjs/Liveblocks) | Yes (via Yjs) | Yes (via Yjs) |
| **Server-side rendering** | Yes (via prosemirror-to-html) | Yes (@lexical/headless) | Via ProseMirror | Via Slate |
| **Content Output** | JSON + HTML | JSON (Lexical state) | JSON (block-based) | JSON (Slate nodes) |
| **License** | MIT | MIT | MPL 2.0 | MIT |
| **Maintenance** | Active (Tiptap GmbH) | Active (Meta) | Active | Active |
| **Learning Curve** | Low-Medium | Medium-High | Low | High |
| **Tailwind Integration** | Excellent (headless) | Excellent (headless) | Requires overrides | Good |

### 2.2 Recommendation: Tiptap

**Winner: Tiptap** for the following reasons:

1. **Fastest path to production**: Tiptap has the most comprehensive documentation, tutorials, and community examples specifically for Next.js projects. There are multiple production-quality tutorials showing Tiptap + Next.js + Tailwind integration.

2. **Extension ecosystem**: The 50+ official extensions cover everything a knowledge base needs out of the box:
   - `@tiptap/extension-heading` (H1-H6)
   - `@tiptap/extension-image` (inline images)
   - `@tiptap/extension-link` (hyperlinks)
   - `@tiptap/extension-code-block-lowlight` (syntax highlighting)
   - `@tiptap/extension-table` (tables)
   - `@tiptap/extension-placeholder`
   - `@tiptap/extension-character-count`
   - `@tiptap/extension-youtube` (embeds)

3. **Dual output (JSON + HTML)**: Tiptap natively exports both JSON (for editing/storage) and HTML (for rendering/SEO), which aligns perfectly with our hybrid storage strategy (see Section 6).

4. **Headless architecture**: Being fully headless, Tiptap integrates seamlessly with our Tailwind CSS v4 design system. We control all styling through our existing design tokens.

5. **ProseMirror foundation**: ProseMirror is the most battle-tested rich text editing framework. Tiptap abstracts away its complexity while retaining its reliability.

6. **Server-side HTML generation**: The `@tiptap/html` package allows server-side JSON-to-HTML conversion, which is critical for our SEO and ISR caching strategy.

### 2.3 Tiptap Package Requirements

```json
{
  "dependencies": {
    "@tiptap/react": "^2.11.x",
    "@tiptap/starter-kit": "^2.11.x",
    "@tiptap/extension-image": "^2.11.x",
    "@tiptap/extension-link": "^2.11.x",
    "@tiptap/extension-placeholder": "^2.11.x",
    "@tiptap/extension-code-block-lowlight": "^2.11.x",
    "@tiptap/extension-table": "^2.11.x",
    "@tiptap/extension-table-row": "^2.11.x",
    "@tiptap/extension-table-cell": "^2.11.x",
    "@tiptap/extension-table-header": "^2.11.x",
    "@tiptap/extension-character-count": "^2.11.x",
    "@tiptap/extension-youtube": "^2.11.x",
    "@tiptap/extension-text-align": "^2.11.x",
    "@tiptap/extension-underline": "^2.11.x",
    "@tiptap/extension-color": "^2.11.x",
    "@tiptap/extension-text-style": "^2.11.x",
    "@tiptap/extension-highlight": "^2.11.x",
    "@tiptap/html": "^2.11.x",
    "lowlight": "^3.x"
  }
}
```

### 2.4 Editor Component Architecture

```
src/components/editor/
  KBEditor.tsx              # Main editor wrapper (client component)
  KBEditorToolbar.tsx       # Toolbar with formatting buttons
  KBEditorBubbleMenu.tsx    # Floating menu on text selection
  KBEditorImageUpload.tsx   # Image upload handler
  extensions/
    custom-image.ts         # Extended image node with captions
    callout.ts              # Callout/admonition block
    embed.ts                # Embed handler (YouTube, etc.)
  utils/
    json-to-html.ts         # Server-side Tiptap JSON -> HTML
    html-sanitizer.ts       # DOMPurify-based sanitization
```

---

## 3. Full-Text Search Implementation

### 3.1 PostgreSQL tsvector/tsquery Approach

Our search strategy uses PostgreSQL's native full-text search capabilities, avoiding the need for external services like Elasticsearch or Algolia. This decision is driven by:

- **Simplified architecture**: No additional infrastructure to manage
- **ACID compliance**: Search index stays consistent with article data
- **Cost**: Zero additional cost (included in Supabase PostgreSQL)
- **Sufficient for scale**: Handles millions of documents with millisecond response times

### 3.2 Search Weights

| Field | Weight | Rationale |
|-------|--------|-----------|
| `title` | A (highest) | Most important for relevance |
| `subtitle` | B | Secondary heading, strong signal |
| `tags` | C | Keywords manually assigned for findability |
| `contentHtml` (stripped) | D (lowest) | Body text, broadest match |

### 3.3 Search Implementation via Prisma Raw Queries

```typescript
// src/lib/kb/search.ts

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  rank: number;
  headline: string;
  publishedAt: Date;
}

/**
 * Full-text search for published KB articles.
 * Uses PostgreSQL tsvector with weighted ranking.
 */
export async function searchKBArticles(
  tenantId: string,
  query: string,
  options: {
    categoryId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ results: SearchResult[]; total: number }> {
  const { categoryId, limit = 20, offset = 0 } = options;

  // Sanitize and prepare the search query
  // Convert user input into tsquery format
  const sanitizedQuery = query
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 1)
    .map(word => `${word}:*`) // Prefix matching for partial words
    .join(' & ');             // AND logic between words

  if (!sanitizedQuery) {
    return { results: [], total: 0 };
  }

  const categoryFilter = categoryId
    ? Prisma.sql`AND a."categoryId" = ${categoryId}`
    : Prisma.sql``;

  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      a.id,
      a.title,
      a.slug,
      a.excerpt,
      a."publishedAt",
      c.slug AS "categorySlug",
      c.name AS "categoryName",
      ts_rank_cd(a.search_vector, to_tsquery('english', ${sanitizedQuery})) AS rank,
      ts_headline(
        'english',
        coalesce(a.excerpt, ''),
        to_tsquery('english', ${sanitizedQuery}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=60, MinWords=20, MaxFragments=2'
      ) AS headline
    FROM "KBArticle" a
    LEFT JOIN "KBCategory" c ON a."categoryId" = c.id
    WHERE
      a."tenantId" = ${tenantId}
      AND a.status = 'published'
      AND a."deletedAt" IS NULL
      AND a.search_vector @@ to_tsquery('english', ${sanitizedQuery})
      ${categoryFilter}
    ORDER BY rank DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Get total count for pagination
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "KBArticle" a
    WHERE
      a."tenantId" = ${tenantId}
      AND a.status = 'published'
      AND a."deletedAt" IS NULL
      AND a.search_vector @@ to_tsquery('english', ${sanitizedQuery})
      ${categoryFilter}
  `;

  return {
    results,
    total: Number(countResult[0].count),
  };
}
```

### 3.4 Autocomplete/Suggestions Implementation

```typescript
// src/lib/kb/autocomplete.ts

import prisma from '@/lib/prisma';

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  categorySlug: string | null;
  similarity: number;
}

/**
 * Autocomplete suggestions using PostgreSQL trigram similarity.
 * Requires pg_trgm extension.
 */
export async function getKBSuggestions(
  tenantId: string,
  query: string,
  limit: number = 5
): Promise<Suggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const trimmedQuery = query.trim();

  return prisma.$queryRaw<Suggestion[]>`
    SELECT
      a.id,
      a.title,
      a.slug,
      c.slug AS "categorySlug",
      similarity(a.title, ${trimmedQuery}) AS similarity
    FROM "KBArticle" a
    LEFT JOIN "KBCategory" c ON a."categoryId" = c.id
    WHERE
      a."tenantId" = ${tenantId}
      AND a.status = 'published'
      AND a."deletedAt" IS NULL
      AND (
        a.title % ${trimmedQuery}
        OR a.title ILIKE ${'%' + trimmedQuery + '%'}
      )
    ORDER BY similarity DESC, a."viewCount" DESC
    LIMIT ${limit}
  `;
}
```

### 3.5 Search Result Highlighting

The `ts_headline()` function generates highlighted excerpts with `<mark>` tags around matching terms:

```typescript
// Example output:
// "Learn how to configure your <mark>email</mark> settings
//  and set up <mark>email</mark> forwarding in F-CORE."
```

This can be rendered directly in React:

```tsx
<p dangerouslySetInnerHTML={{ __html: result.headline }} />
```

The headline output is safe because `ts_headline()` only inserts the specified `StartSel`/`StopSel` markers, and the source content was sanitized before storage.

---

## 4. API Route Structure

### 4.1 Complete Endpoint Map

All endpoints follow the existing project patterns (see `/src/app/api/contacts/route.ts` and `/src/app/api/forms/route.ts`).

```
API Routes Structure:

/api/kb/
  categories/
    route.ts                    # GET (list), POST (create)
    [id]/
      route.ts                  # GET, PATCH, DELETE
      reorder/
        route.ts                # PATCH (reorder categories)
  articles/
    route.ts                    # GET (list with filters), POST (create)
    [id]/
      route.ts                  # GET, PATCH, DELETE
      publish/
        route.ts                # POST (publish), DELETE (unpublish)
      duplicate/
        route.ts                # POST (duplicate article)
  search/
    route.ts                    # GET (full-text search)
  suggestions/
    route.ts                    # GET (autocomplete)
  feedback/
    route.ts                    # POST (submit feedback)
  analytics/
    route.ts                    # GET (dashboard analytics)
    [articleId]/
      route.ts                  # GET (article-specific analytics)
      views/
        route.ts                # POST (increment view count)

Public Routes (no auth required):

/kb/
  page.tsx                      # Knowledge base home (category listing)
  search/
    page.tsx                    # Search results page
  [categorySlug]/
    page.tsx                    # Category page (article listing)
    [articleSlug]/
      page.tsx                  # Article detail page
```

### 4.2 API Route Implementations

#### Categories CRUD

```typescript
// src/app/api/kb/categories/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().uuid().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// GET /api/kb/categories - List categories as tree
export async function GET(request: NextRequest) {
  try {
    const tenantId = 'demo-tenant'; // TODO: from auth session

    const categories = await prisma.kBCategory.findMany({
      where: {
        tenantId,
        deletedAt: null,
        parentId: null, // Only top-level categories
      },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            _count: { select: { articles: { where: { status: 'published', deletedAt: null } } } },
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { articles: { where: { status: 'published', deletedAt: null } } } },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('Error fetching KB categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/kb/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const tenantId = 'demo-tenant'; // TODO: from auth session
    const { name, description, icon, parentId, orderIndex } = validation.data;

    // Generate slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');

    // Validate parentId exists if provided
    if (parentId) {
      const parent = await prisma.kBCategory.findFirst({
        where: { id: parentId, tenantId, deletedAt: null },
      });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
      // Enforce max 2 levels of nesting (like HubSpot)
      if (parent.parentId) {
        return NextResponse.json(
          { error: 'Maximum category nesting depth is 2 levels' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.kBCategory.create({
      data: {
        tenantId,
        name,
        slug,
        description,
        icon,
        parentId,
        orderIndex: orderIndex ?? 0,
      },
      include: {
        children: true,
        _count: { select: { articles: true } },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating KB category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
```

#### Articles CRUD

```typescript
// src/app/api/kb/articles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  contentJson: z.any().optional(),         // Tiptap JSON
  contentHtml: z.string().optional(),       // Pre-rendered HTML
  excerpt: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  visibility: z.enum(['public', 'private', 'password']).optional(),
});

const SORT_WHITELIST = ['createdAt', 'updatedAt', 'title', 'viewCount', 'publishedAt'] as const;

// GET /api/kb/articles - List articles with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = 'demo-tenant'; // TODO: from auth session

    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortByParam = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const sortBy = SORT_WHITELIST.includes(sortByParam as any)
      ? sortByParam
      : 'updatedAt';

    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { excerpt: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [articles, total] = await Promise.all([
      prisma.kBArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          status: true,
          publishedAt: true,
          viewCount: true,
          helpfulCount: true,
          notHelpfulCount: true,
          visibility: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { feedback: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.kBArticle.count({ where }),
    ]);

    return NextResponse.json({
      data: articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching KB articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST /api/kb/articles - Create article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createArticleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const tenantId = 'demo-tenant'; // TODO: from auth session
    const data = validation.data;

    // Generate slug from title
    const baseSlug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure unique slug within tenant
    let slug = baseSlug;
    const existing = await prisma.kBArticle.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      select: { id: true },
    });
    if (existing) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const article = await prisma.kBArticle.create({
      data: {
        tenantId,
        title: data.title,
        slug,
        subtitle: data.subtitle,
        contentJson: data.contentJson,
        contentHtml: data.contentHtml,
        excerpt: data.excerpt,
        categoryId: data.categoryId,
        tags: data.tags || [],
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        visibility: data.visibility || 'public',
        // authorId: userId, // TODO: from auth session
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating KB article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
```

#### Publish Workflow

```typescript
// src/app/api/kb/articles/[id]/publish/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/kb/articles/:id/publish - Publish article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = 'demo-tenant'; // TODO: from auth session

    const article = await prisma.kBArticle.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (!article.contentHtml && !article.contentJson) {
      return NextResponse.json(
        { error: 'Article must have content before publishing' },
        { status: 400 }
      );
    }

    const updated = await prisma.kBArticle.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        // publishedBy: userId, // TODO: from auth session
      },
    });

    // TODO: Trigger revalidation of the public article page
    // revalidateTag(`kb-article-${article.slug}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error publishing KB article:', error);
    return NextResponse.json(
      { error: 'Failed to publish article' },
      { status: 500 }
    );
  }
}

// DELETE /api/kb/articles/:id/publish - Unpublish article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = 'demo-tenant';

    const updated = await prisma.kBArticle.update({
      where: { id },
      data: {
        status: 'draft',
        publishedAt: null,
        publishedBy: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error unpublishing KB article:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish article' },
      { status: 500 }
    );
  }
}
```

#### Search API

```typescript
// src/app/api/kb/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchKBArticles } from '@/lib/kb/search';

// GET /api/kb/search?q=query&categoryId=xxx&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const tenantId = 'demo-tenant'; // For public KB, resolve from domain/subdomain
    const offset = (page - 1) * limit;

    const { results, total } = await searchKBArticles(tenantId, query, {
      categoryId,
      limit,
      offset,
    });

    return NextResponse.json({
      data: results,
      query,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error searching KB:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

#### Feedback Endpoint

```typescript
// src/app/api/kb/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const feedbackSchema = z.object({
  articleId: z.string().uuid(),
  isHelpful: z.boolean(),
  comment: z.string().max(1000).optional(),
  visitorId: z.string().max(100).optional(),
});

// POST /api/kb/feedback - Submit article feedback (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { articleId, isHelpful, comment, visitorId } = validation.data;
    const ipAddress = request.headers.get('x-forwarded-for')
      || request.headers.get('x-real-ip')
      || 'unknown';

    // Verify article exists and is published
    const article = await prisma.kBArticle.findFirst({
      where: { id: articleId, status: 'published', deletedAt: null },
      select: { id: true, tenantId: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Upsert feedback (update if visitor already submitted)
    const effectiveVisitorId = visitorId || ipAddress;

    const feedback = await prisma.kBArticleFeedback.upsert({
      where: {
        articleId_visitorId: {
          articleId,
          visitorId: effectiveVisitorId,
        },
      },
      update: { isHelpful, comment },
      create: {
        articleId,
        tenantId: article.tenantId,
        isHelpful,
        comment,
        visitorId: effectiveVisitorId,
        ipAddress,
      },
    });

    // Update denormalized counts on article
    const counts = await prisma.kBArticleFeedback.groupBy({
      by: ['isHelpful'],
      where: { articleId },
      _count: true,
    });

    const helpfulCount = counts.find(c => c.isHelpful)?._count ?? 0;
    const notHelpfulCount = counts.find(c => !c.isHelpful)?._count ?? 0;

    await prisma.kBArticle.update({
      where: { id: articleId },
      data: { helpfulCount, notHelpfulCount },
    });

    return NextResponse.json({
      id: feedback.id,
      isHelpful: feedback.isHelpful,
      helpfulCount,
      notHelpfulCount,
    });
  } catch (error) {
    console.error('Error submitting KB feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
```

#### View Count Tracking

```typescript
// src/app/api/kb/analytics/[articleId]/views/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/kb/analytics/:articleId/views - Increment view count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await params;

    // Use atomic increment to avoid race conditions
    await prisma.kBArticle.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently fail for view counting (non-critical)
    console.error('Error incrementing view count:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
```

---

## 5. SEO & Public Pages

### 5.1 URL Structure

Following HubSpot's knowledge base URL convention:

```
/kb                                      # KB home - category listing
/kb/search?q=query                       # Search results
/kb/[categorySlug]                       # Category page
/kb/[categorySlug]/[articleSlug]         # Article page
```

### 5.2 Dynamic Metadata Generation

```typescript
// src/app/kb/[categorySlug]/[articleSlug]/page.tsx

import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    categorySlug: string;
    articleSlug: string;
  }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, articleSlug } = await params;
  const tenantId = 'demo-tenant'; // TODO: resolve from domain

  const article = await prisma.kBArticle.findFirst({
    where: {
      slug: articleSlug,
      status: 'published',
      deletedAt: null,
      tenantId,
      category: { slug: categorySlug },
    },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      excerpt: true,
      canonicalUrl: true,
      noIndex: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!article) return { title: 'Article Not Found' };

  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt || '';
  const url = `/kb/${categorySlug}/${articleSlug}`;

  return {
    title: `${title} | F-CORE Knowledge Base`,
    description,
    robots: article.noIndex ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: article.canonicalUrl || url,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: article.author?.name ? [article.author.name] : undefined,
      section: article.category?.name,
      siteName: 'F-CORE Knowledge Base',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

// Article page component
export default async function ArticlePage({ params }: PageProps) {
  const { categorySlug, articleSlug } = await params;
  // ... fetch and render article
}
```

### 5.3 Sitemap Generation

```typescript
// src/app/kb/sitemap.ts

import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantId = 'demo-tenant'; // TODO: resolve from domain

  // Fetch all published articles with their category slugs
  const articles = await prisma.kBArticle.findMany({
    where: {
      tenantId,
      status: 'published',
      deletedAt: null,
      noIndex: false,
      visibility: 'public',
    },
    select: {
      slug: true,
      updatedAt: true,
      category: { select: { slug: true } },
    },
    orderBy: { publishedAt: 'desc' },
  });

  // Fetch all visible categories
  const categories = await prisma.kBCategory.findMany({
    where: {
      tenantId,
      deletedAt: null,
      isVisible: true,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.fcore.io';

  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/kb/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const articleUrls: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/kb/${article.category?.slug || 'uncategorized'}/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}/kb`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...categoryUrls,
    ...articleUrls,
  ];
}
```

### 5.4 JSON-LD Structured Data

```typescript
// src/components/kb/ArticleJsonLd.tsx

interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  categoryName: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  authorName,
  categoryName,
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'F-CORE',
    },
    articleSection: categoryName,
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

---

## 6. Content Storage Strategy

### 6.1 Comparison of Storage Formats

| Format | Storage Size | Edit Capability | Render Speed | SEO | FTS Compatibility | XSS Risk |
|--------|-------------|-----------------|-------------|-----|-------------------|----------|
| **Tiptap JSON** | Large (~2-3x HTML) | Excellent (native) | Slow (needs parsing) | Poor (needs conversion) | Poor (nested JSON) | Low |
| **HTML** | Medium | Poor (needs JSON conversion) | Instant | Excellent | Good (strip tags) | High (needs sanitization) |
| **Markdown** | Smallest | Good (with parser) | Medium (needs conversion) | Medium | Excellent | Low |

### 6.2 Recommendation: Hybrid (JSON + HTML)

Store **both** Tiptap JSON and pre-rendered HTML:

```
contentJson  → Source of truth for the editor (editing, future migrations)
contentHtml  → Pre-rendered output for display, SEO, and full-text search
```

**Why this approach:**

1. **Editing**: `contentJson` loads directly into the Tiptap editor without conversion. This is the canonical, lossless representation of the document.

2. **Rendering**: `contentHtml` is served directly to the page without any client-side parsing. This means:
   - Zero JavaScript needed for article rendering
   - Server Components can render articles without Tiptap being bundled
   - Full SSR/ISR compatibility

3. **SEO**: `contentHtml` can be indexed by search engines directly. No client-side hydration needed for content visibility.

4. **Full-Text Search**: The PostgreSQL trigger strips HTML tags from `contentHtml` to build the `tsvector`. This is cleaner than trying to extract text from nested JSON.

5. **Storage cost**: The additional storage for dual format is negligible. A 2000-word article is roughly 10KB as JSON + 5KB as HTML = 15KB total. At 10,000 articles, that is only 150MB.

### 6.3 Conversion Pipeline

```typescript
// src/lib/kb/content.ts

import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';

// Must match the extensions configured in the editor
const extensions = [
  StarterKit.configure({ codeBlock: false }),
  Image,
  Link.configure({ openOnClick: false }),
  Table,
  TableRow,
  TableCell,
  TableHeader,
  CodeBlockLowlight,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Underline,
  Highlight,
];

/**
 * Convert Tiptap JSON to HTML on the server.
 * Called when saving an article to generate contentHtml from contentJson.
 */
export function tiptapJsonToHtml(json: Record<string, unknown>): string {
  return generateHTML(json, extensions);
}

/**
 * Generate a plain-text excerpt from Tiptap JSON.
 * Extracts the first N characters of text content.
 */
export function generateExcerpt(json: Record<string, unknown>, maxLength = 200): string {
  const html = tiptapJsonToHtml(json);
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength
    ? text.substring(0, maxLength).replace(/\s\S*$/, '') + '...'
    : text;
}
```

### 6.4 Save Flow

```
User edits article in Tiptap Editor
         |
         v
editor.getJSON() ──> contentJson (stored in DB)
         |
         v
tiptapJsonToHtml(json) ──> contentHtml (stored in DB)
         |
         v
generateExcerpt(json) ──> excerpt (if not manually set)
         |
         v
PostgreSQL trigger ──> search_vector (auto-updated)
```

---

## 7. Performance & Caching

### 7.1 Caching Strategy Overview

```
Layer 1: Browser Cache
  ├── Static assets (CSS, JS, images) - immutable, long-lived
  └── API responses - short-lived (stale-while-revalidate)

Layer 2: Next.js Cache (Next.js 16 "use cache" directive)
  ├── Article pages - cached with tag-based revalidation
  ├── Category listings - cached, revalidate on article publish
  └── Search results - not cached (dynamic)

Layer 3: PostgreSQL
  ├── GIN indexes for full-text search
  ├── B-tree indexes for slug lookups
  └── Connection pooling via Supabase
```

### 7.2 Article Page Caching with Next.js 16

Next.js 16 introduces explicit caching via the `"use cache"` directive. This replaces the previous ISR approach with more granular control:

```typescript
// src/app/kb/[categorySlug]/[articleSlug]/page.tsx

import { cacheTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Enable cache with tag-based revalidation
async function getArticle(categorySlug: string, articleSlug: string) {
  'use cache';
  cacheTag(`kb-article-${articleSlug}`, 'kb-articles');

  const tenantId = 'demo-tenant';

  const article = await prisma.kBArticle.findFirst({
    where: {
      slug: articleSlug,
      status: 'published',
      deletedAt: null,
      tenantId,
      category: { slug: categorySlug },
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
    },
  });

  return article;
}

export default async function ArticlePage({ params }: PageProps) {
  const { categorySlug, articleSlug } = await params;
  const article = await getArticle(categorySlug, articleSlug);

  if (!article) notFound();

  return (
    <article>
      {/* Article header */}
      <header>
        <h1>{article.title}</h1>
        {article.subtitle && <h2>{article.subtitle}</h2>}
        {article.author && <p>By {article.author.name}</p>}
      </header>

      {/* Render pre-built HTML - zero client-side JS needed */}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: article.contentHtml || '' }}
      />

      {/* Client-side feedback widget */}
      {/* <ArticleFeedback articleId={article.id} /> */}
    </article>
  );
}
```

### 7.3 Cache Invalidation on Publish/Update

```typescript
// When an article is published or updated:
import { revalidateTag } from 'next/cache';

// Invalidate specific article cache
revalidateTag(`kb-article-${article.slug}`, 'max');

// Invalidate category listing cache
revalidateTag('kb-articles', 'max');

// Invalidate sitemap
revalidateTag('kb-sitemap', 'max');
```

### 7.4 Image Optimization

KB articles will contain inline images. Strategy:

1. **Upload to Supabase Storage**: Articles images are uploaded to a dedicated `kb-images` bucket in Supabase Storage.

2. **Next.js Image Optimization**: Use `next/image` with the Supabase storage domain configured in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/kb-images/**',
      },
    ],
  },
};
```

3. **Lazy Loading**: Images below the fold use native `loading="lazy"` attribute.

4. **WebP/AVIF**: Next.js automatically serves images in modern formats via its image optimization pipeline.

### 7.5 View Count Optimization

View count increments are high-frequency writes that can degrade performance. Strategies:

```typescript
// Option 1: Debounced client-side tracking (recommended)
// Only count unique views per session using sessionStorage

// src/components/kb/ArticleViewTracker.tsx
'use client';

import { useEffect } from 'react';

export function ArticleViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `kb-viewed-${articleId}`;
    if (sessionStorage.getItem(key)) return;

    // Fire and forget - non-blocking
    fetch(`/api/kb/analytics/${articleId}/views`, { method: 'POST' })
      .catch(() => {}); // Silently fail

    sessionStorage.setItem(key, '1');
  }, [articleId]);

  return null;
}
```

```typescript
// Option 2: Batch updates (for high-traffic scenarios)
// Accumulate view counts in memory and flush to DB periodically
// This would use a simple in-memory counter with setInterval flush
```

### 7.6 Database Query Performance

Key queries and their expected performance with proper indexes:

| Query | Index Used | Expected Time |
|-------|-----------|---------------|
| Article by slug | `@@unique([tenantId, slug])` | < 1ms |
| Category tree | `@@index([tenantId, parentId])` | < 2ms |
| Published articles list | `@@index([tenantId, status, deletedAt])` | < 5ms |
| Full-text search | GIN on `search_vector` | < 10ms (10K articles) |
| Autocomplete | GIN trigram on `title` | < 5ms |
| Popular articles | `@@index([viewCount])` | < 2ms |

---

## 8. Implementation Roadmap

### Phase 1: Foundation (3-4 days)

1. Add Prisma schema models (KBCategory, KBArticle, KBArticleFeedback)
2. Run Prisma migration
3. Apply raw SQL migration for full-text search (tsvector, triggers, GIN indexes)
4. Create `src/lib/kb/` utility functions (search, autocomplete, content conversion)
5. Install Tiptap packages

### Phase 2: Admin Backend (4-5 days)

1. API routes: Categories CRUD
2. API routes: Articles CRUD with publish workflow
3. API routes: Search and suggestions
4. API routes: Feedback and analytics
5. Tiptap editor component with toolbar
6. Image upload integration with Supabase Storage

### Phase 3: Admin UI (3-4 days)

1. KB dashboard page (article listing with filters)
2. Category management page (tree view with drag-and-drop reorder)
3. Article editor page (Tiptap + SEO metadata sidebar)
4. Article preview mode
5. Analytics dashboard (views, feedback, popular articles)

### Phase 4: Public Pages (3-4 days)

1. KB home page (category grid)
2. Category page (article listing)
3. Article page (HTML rendering + feedback widget)
4. Search page with results and highlighting
5. Breadcrumb navigation
6. Related articles component

### Phase 5: SEO & Polish (2-3 days)

1. Dynamic metadata (generateMetadata)
2. Sitemap generation
3. JSON-LD structured data
4. Open Graph images
5. Cache configuration and tag-based revalidation
6. Mobile responsive testing
7. Accessibility audit

**Estimated Total: 15-20 development days**

---

## Appendix A: File Structure

```
src/
  app/
    (dashboard)/
      kb/
        page.tsx                          # Admin: KB article listing
        categories/
          page.tsx                        # Admin: Category management
        articles/
          new/
            page.tsx                      # Admin: Create article
          [id]/
            edit/
              page.tsx                    # Admin: Edit article
            preview/
              page.tsx                    # Admin: Preview article
        analytics/
          page.tsx                        # Admin: KB analytics
    api/
      kb/
        categories/
          route.ts
          [id]/
            route.ts
            reorder/
              route.ts
        articles/
          route.ts
          [id]/
            route.ts
            publish/
              route.ts
            duplicate/
              route.ts
        search/
          route.ts
        suggestions/
          route.ts
        feedback/
          route.ts
        analytics/
          route.ts
          [articleId]/
            route.ts
            views/
              route.ts
    kb/                                   # Public pages (no auth)
      page.tsx                            # KB home
      sitemap.ts                          # Sitemap
      search/
        page.tsx                          # Search results
      [categorySlug]/
        page.tsx                          # Category page
        [articleSlug]/
          page.tsx                        # Article page
  components/
    kb/
      KBArticleCard.tsx                   # Article card for listings
      KBCategoryCard.tsx                  # Category card for home page
      KBSearchBar.tsx                     # Search with autocomplete
      KBBreadcrumb.tsx                    # Breadcrumb navigation
      KBFeedbackWidget.tsx               # Thumbs up/down widget
      KBRelatedArticles.tsx              # Related articles sidebar
      KBTableOfContents.tsx             # Auto-generated TOC from headings
      ArticleViewTracker.tsx             # View count tracker
      ArticleJsonLd.tsx                  # JSON-LD structured data
    editor/
      KBEditor.tsx                        # Tiptap editor wrapper
      KBEditorToolbar.tsx                # Editor toolbar
      KBEditorBubbleMenu.tsx             # Floating format menu
      KBEditorImageUpload.tsx            # Image upload handler
      extensions/
        custom-image.ts
        callout.ts
  lib/
    kb/
      search.ts                           # Full-text search functions
      autocomplete.ts                     # Autocomplete/suggestions
      content.ts                          # JSON-to-HTML conversion
      slugify.ts                          # Slug generation
    validations/
      kb.ts                               # Zod schemas for KB
  types/
    kb.ts                                 # TypeScript types for KB
```

## Appendix B: Reference Links

- [Tiptap Documentation](https://tiptap.dev/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Prisma Full-Text Search Guide](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search)
- [Next.js 16 Caching](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [HubSpot KB Categories](https://knowledge.hubspot.com/knowledge-base/manage-knowledge-base-categories-subcategories-and-tags)
- [HubSpot KB SEO Guide](https://blog.hubspot.com/service/seo-knowledge-base)

---

*Document created: 2026-02-09*
*Next step: Review with team and begin Phase 1 implementation.*
