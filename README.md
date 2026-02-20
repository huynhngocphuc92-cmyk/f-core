# F-CORE (HubSpot Demo)

F-CORE is a Next.js CRM demo inspired by HubSpot. The project currently includes core CRM, marketing, service, reporting, and an initial AI assistant implementation.

## Current Status (as of 2026-02-14)

- API layer: implemented across CRM modules (`src/app/api/*`)
- Dashboard/UI pages: broad coverage across contacts, companies, deals, workflows, tickets, reports, forms, KB, and more
- AI Assistant: Phase 1 implemented (`/ai-assistant`, `/api/ai/*`, `src/lib/ai/*`)
- Unit/API tests: broad coverage in `tests/api/*`
- E2E tests: baseline smoke + critical flows in `e2e/*`

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma + PostgreSQL
- Supabase Auth/SSR helpers
- Tailwind CSS v4
- Vercel AI SDK (`ai`) + OpenAI/Anthropic providers
- Vitest + Playwright

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# then fill required values
```

3. Generate Prisma client and run dev server:

```bash
npm run dev
```

4. Open:

- App: `http://localhost:3000`
- AI Assistant: `http://localhost:3000/ai-assistant`

## Scripts

```bash
npm run dev           # start Next.js dev server
npm run build         # prisma generate + production build
npm run start         # start production server
npm run lint          # eslint
npm test              # vitest (all)
npm run test:watch    # vitest watch
npm run test:coverage # vitest coverage
npm run test:e2e      # playwright
```

## Testing Notes

- API route tests use mocked Prisma/auth helpers from `tests/setup.ts`.
- E2E tests start the app with Playwright `webServer` config.
- If local Supabase credentials are missing, auth-dependent browser actions may fail; client-side validation and public routes still run.

## SLA Scheduler

- Cron endpoint: `POST /api/cron/sla-alerts`
- Manual runner (dashboard/API): `POST /api/service/sla/alerts/run`
- Required secret: `SLA_ALERTS_CRON_SECRET` (or `CRON_SECRET`)
- Deployment guide: `docs/SLA_CRON_DEPLOY.md`

## Service Routing Rules

- Policy API: `GET/PUT /api/service/inbox/routing-rules`
- Dashboard: `/service/routing`
- Ticket assignment flow: `POST /api/tickets` auto-assigns by priority team, business-hours override, and round-robin assignee selection

## Customer Portal (Service)

- Issue access token: `POST /api/service/portal/access`
- Contact ticket list/create: `GET/POST /api/service/portal/tickets` (token scoped)
- Ticket detail + replies: `GET /api/service/portal/tickets/[id]`, `POST /api/service/portal/tickets/[id]/reply`
- Public UI routes:
  - `/portal/tickets?token=<token>`
  - `/portal/tickets/[id]?token=<token>`

## CSAT/NPS Surveys (Service)

- Survey metrics + dispatch workflow: `GET/POST /api/service/surveys`
- Survey response endpoint (portal token auth): `POST /api/service/surveys/respond`
- Dashboard: `/service/surveys`
- Auto trigger: when a ticket transitions to `resolved`, survey invitation activity is generated (deduplicated per ticket)

## Service Analytics v2

- Analytics API: `GET /api/service/analytics?days=30`
- Dashboard: `/service/analytics`
- Includes ticket volume/resolution KPIs, SLA-related timing KPIs, channel/priority/category mix, assignee workload, and CSAT/NPS performance

## Sales Forecast & Playbooks

- Forecast API: `GET /api/sales/forecast?period=month|quarter`
- Forecast dashboard: `/sales/forecast`
- Playbooks APIs:
  - `GET/POST /api/sales/playbooks`
  - `PATCH /api/sales/playbooks/[runId]/steps/[stepId]`
- Playbooks dashboard: `/sales/playbooks`
- Document engagement API: `GET/POST /api/sales/documents/events`
- Document tracking dashboard: `/sales/documents`
- Call intelligence API: `GET/POST /api/sales/calls`
- Call intelligence dashboard: `/sales/calls`
- Coaching insights API: `GET /api/sales/coaching`
- Coaching dashboard: `/sales/coaching`
- Payment provider API: `GET/PUT /api/commerce/payments/providers`
- Payment provider dashboard: `/commerce/payments`
- Invoice APIs:
  - `GET/POST /api/commerce/invoices`
  - `PATCH /api/commerce/invoices/[id]`
- Invoice dashboard: `/commerce/invoices`
- Subscription APIs:
  - `GET/POST /api/commerce/subscriptions`
  - `PATCH /api/commerce/subscriptions/[id]`
- Subscription dashboard: `/commerce/subscriptions`
- Dunning APIs:
  - `GET/PUT/POST /api/commerce/dunning`
  - `PATCH /api/commerce/dunning/[id]`
- Dunning dashboard: `/commerce/dunning`
- Revenue report API: `GET /api/commerce/revenue`
- Revenue dashboard: `/commerce/revenue`
- Marketing Ads APIs:
  - `GET/PUT /api/marketing/ads/connectors`
  - `GET/POST /api/marketing/ads/campaigns`
- Marketing Ads dashboard: `/marketing/ads`
- Social Publishing APIs:
  - `GET/POST /api/marketing/social/posts`
  - `PATCH /api/marketing/social/posts/[id]`
- Social Scheduler dashboard: `/marketing/social`
- Attribution API: `GET /api/marketing/attribution?model=first_touch|last_touch|multi_touch&days=30`
- Attribution dashboard: `/marketing/attribution`
- Journey API: `GET /api/marketing/journey?days=30&limit=20`
- Journey dashboard: `/marketing/journey`
- A/B Testing APIs:
  - `GET/POST /api/marketing/experiments`
  - `PATCH /api/marketing/experiments/[id]`
  - `POST /api/marketing/experiments/[id]/events`
- A/B Testing dashboard: `/marketing/experiments`
- Marketing Analytics API: `GET /api/marketing/analytics?days=30&channel=paid_search&experimentType=landing_page`
- Marketing Analytics dashboard: `/marketing/analytics`
- Content Blog APIs:
  - `GET/POST /api/content/blog/posts`
  - `PATCH /api/content/blog/posts/[id]`
- Content Blog dashboard: `/content/blog`
- Content SEO API: `GET /api/content/seo/recommendations?sourceType=blog_post|landing_page&sourceId=<id>&keyword=seo`
- Content SEO dashboard: `/content/seo`
- Content Approval APIs:
  - `GET/PUT /api/content/approvals/policies`
  - `GET/POST /api/content/approvals/requests`
  - `POST /api/content/approvals/requests/[id]/decision`
- Content Approvals dashboard: `/content/approvals`
- Content Remix API: `GET/POST /api/content/remix`
- Content Remix dashboard: `/content/remix`
- Content Performance APIs:
  - `GET /api/content/performance`
  - `POST /api/content/performance/events`
- Content Performance dashboard: `/content/performance`
- Content Page Builder APIs:
  - `GET /api/content/pages/templates`
  - `GET/POST /api/content/pages/blocks`
  - `POST /api/content/pages/compose`
- Content Page Builder dashboard: `/content/pages`
- Data Sync APIs:
  - `GET/PUT /api/data/sync/mappings`
  - `GET/POST /api/data/sync/jobs`
- Data Sync dashboard: `/data/sync`
- Data Mapping Validation API: `GET/POST /api/data/sync/mappings/validate`
- Data Mapping Studio dashboard: `/data/mappings`
- Workflow Runtime APIs:
  - `GET/POST /api/workflows/runtime/runs`
  - `GET/POST /api/workflows/runtime/dead-letter`
  - `GET/POST /api/workflows/[id]/versions`
  - `POST /api/workflows/[id]/versions/[versionId]/restore`
- Workflow Runtime dashboard: `/workflows/runtime`
- AI Orchestration API: `GET/POST /api/ai/orchestration`
- AI Orchestration dashboard: `/ai-assistant/orchestration`
- AI Prompt Governance APIs:
  - `GET/POST /api/ai/prompts`
  - `POST /api/ai/prompts/[agent]/rollback`
- AI Prompt Governance dashboard: `/ai-assistant/prompts`
- AI Eval Harness API: `GET/POST /api/ai/evals`
- AI Eval Harness dashboard: `/ai-assistant/evals`
- AI Sales Agent API: `GET/POST /api/ai/agents/sales`
- AI Sales Agent dashboard: `/ai-assistant/agents/sales`
- AI Service Agent API: `GET/POST /api/ai/agents/service`
- AI Service Agent dashboard: `/ai-assistant/agents/service`
- AI Knowledge Agent API: `GET/POST /api/ai/agents/knowledge`
- AI Knowledge Agent dashboard: `/ai-assistant/agents/knowledge`
- Data Quality APIs:
  - `GET/PUT /api/data/quality/rules`
  - `GET /api/data/quality/dedupe/candidates`
  - `GET/POST /api/data/quality/merge`
- Data Quality dashboard: `/data/quality`
- Data Lineage/Observability APIs:
  - `GET /api/data/sync/observability`
  - `POST /api/data/sync/jobs/[id]/retry`
- Data Lineage dashboard: `/data/lineage`
- API Performance Budget APIs:
  - `GET/PUT /api/qa/performance/budgets`
  - `GET/POST /api/qa/performance/evaluate`
- API Performance dashboard: `/qa/performance`
- Frontend Performance APIs:
  - `GET/PUT /api/qa/frontend-performance/thresholds`
  - `GET/POST /api/qa/frontend-performance/evaluate`
- Frontend Performance dashboard: `/qa/frontend-performance`
- Release Readiness APIs:
  - `GET/PUT /api/qa/release-readiness/checklist`
  - `GET/POST /api/qa/release-readiness/evaluate`
- Release Readiness dashboard: `/qa/release-readiness`
- SSO Settings APIs:
  - `GET/PUT /api/settings/sso`
  - `GET /api/auth/sso/discovery`
  - `GET /api/auth/sso/start`
- SSO Settings dashboard: `/settings/sso`
- Tenant Policy APIs:
  - `GET/PUT /api/settings/policies`
  - `GET /api/auth/policy/discovery`
- Tenant Policy dashboard: `/settings/policies`
- SCIM Provisioning APIs:
  - `GET/POST /api/scim/v2/Users`
  - `GET/PATCH/DELETE /api/scim/v2/Users/[id]`
  - Requires headers: `Authorization: Bearer <SCIM_BEARER_TOKEN>` and `x-tenant-id: <tenant-id>`
- Supports test/live mode and provider credential rotation for commerce foundation
- Supports invoice lifecycle with ledger-safe transitions (draft/sent/paid/void)
- Supports recurring plans with monthly/quarterly/yearly cycles, renewal actions, and cancellation policies
- Supports failed-payment dunning workflow with retry schedules and notification channels
- Supports finance reconciliation across invoices, subscriptions, and payment recovery signals
- Supports deal-scoped recommended playbooks and guided step tracking for rep execution
- Captures quote engagement events (view/download/signed) and links them to sales timeline activities
- Captures call transcripts with highlights and risk signals for sales coaching workflows
- Generates prioritized coaching suggestions using deal health scores and risk buckets
- Generates service-ticket triage recommendations with draft customer replies and confidence scoring
- Provides grounded knowledge answers with KB citation evidence and safe fallback when context is missing
- Runs AI quality/latency/cost regression benchmarks in CI via `.github/workflows/ai-evals.yml`
- Supports per-agent prompt versioning and one-click rollback for governed AI behavior changes
- Supports API P95 latency/error budget monitoring with alert generation and evaluation history
- Supports route-level frontend performance thresholds (LCP/INP/CLS/JS) with alert evaluation tracking
- Supports release readiness checklist automation with blocker detection and run history
- Enforces release quality/security gates in CI via `.github/workflows/release-readiness.yml`
- Supports tenant-level SAML/OIDC configuration and SSO-only login enforcement
- Supports SCIM v2 user provisioning flows (create/update/deactivate) for enterprise IdP sync
- Supports tenant-wide session/password/IP allowlist policy controls with login-time enforcement

## Project Structure

- `src/app/` - App Router pages, API routes, server actions
- `src/components/` - UI and feature components
- `src/lib/` - shared modules (auth, prisma, ai, validation, reports)
- `prisma/` - schema, migrations, seed
- `tests/` - Vitest suites
- `e2e/` - Playwright specs
- `docs/` - strategy, plans, and reports
