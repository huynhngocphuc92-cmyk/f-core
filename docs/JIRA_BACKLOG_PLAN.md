# F-CORE Jira Backlog Plan

Last updated: 2026-02-16
Owner: Product + Engineering
Status: Draft for sprint planning

## Execution progress (2026-02-15 to 2026-02-16)

- [x] Export Jira-ready CSV import file: `docs/JIRA_BACKLOG_IMPORT.csv`
- [x] CPQ API RBAC + audit hardening pass
  - Enforced `crm.write` permission on:
    - `POST /api/quotes/[id]/approval/request`
    - `POST /api/quotes/[id]/approval/decision`
    - `POST /api/quotes/[id]/esign/events`
  - Enforced `crm.read` permission on:
    - `GET /api/quotes/[id]/timeline`
  - Expanded CPQ API tests with explicit 403 permission assertions + audit side-effect checks:
    - `tests/api/quotes-cpq.test.ts`
- [x] CPQ + AI prospecting route coverage expansion in E2E
  - Added route checks:
    - `/quotes`
    - `/ai-assistant/agents/prospecting`
  - Added focused CPQ UI surface smoke test:
    - `e2e/quotes-cpq.spec.ts`
- [x] Schema-drift resilience hardening for policy/SLA stores
  - Added `P2021/P2022` fallback handling in:
    - `src/lib/sla-policy-store.ts`
    - `src/lib/tenant-policy-store.ts`
  - Added regression coverage for missing-table fallback behavior:
    - `tests/api/service-sla-policies.test.ts`
    - `tests/api/settings-policies.test.ts`
    - `tests/api/auth-policy-discovery.test.ts`
- [x] PLAT-01 (v1/partial): SSO login flow (SAML/OIDC gateway)
  - Added tenant SSO config store in `src/lib/sso-config-store.ts` (provider type, IdP metadata, domain mapping, SSO-only enforcement flag)
  - Added APIs:
    - `GET/PUT /api/settings/sso`
    - `GET /api/auth/sso/discovery`
    - `GET /api/auth/sso/start`
  - Added settings route `/settings/sso` for configuring IdP connection and SSO-only policy
  - Updated login route `/login` to detect SSO by email domain and enforce SSO-only sign-in when enabled
  - Added demo SSO callback handling in `/auth/callback` for mocked IdP flow completion
- [x] PLAT-02 (v1/partial): SCIM user provisioning sync endpoint
  - Added SCIM provisioning store in `src/lib/scim-provisioning.ts` (create/list/get/patch/deactivate user lifecycle)
  - Added SCIM auth helper in `src/lib/scim-auth.ts` for bearer-token and tenant-header validation
  - Added APIs:
    - `GET/POST /api/scim/v2/Users`
    - `GET/PATCH/DELETE /api/scim/v2/Users/[id]`
  - Added environment variable `SCIM_BEARER_TOKEN` in `.env.example`
- [x] PLAT-03 (v1/hardening): RBAC permission matrix and API permission checks
  - Added `checkPermission()` + role-permission mapping in `src/lib/auth-helpers.ts`
  - Enforced `settings.read/manage` on properties and webhooks APIs
  - Enforced `ai.use` permission on AI chat/orchestration/agent/conversation APIs
  - Enforced `reports.manage` for AI eval harness APIs and `settings.manage` for AI prompt governance APIs
- [x] PLAT-04 (v1/hardening): Audit trail expansion for admin/security operations
  - Added `src/lib/audit-helpers.ts` with request-context audit logging
  - Added audit event writes for properties/webhooks create/update/delete
  - Added audit event writes for tickets/workflows/quotes create/update/delete
  - Added audit event writes for settings SSO/policy updates
  - Added audit event writes for SCIM provisioning lifecycle (create/update/deactivate)
  - Added audit event writes for AI prompt governance and AI usage tracking
- [x] PLAT-05 (v1/partial): Tenant-level policy settings (session, password, IP allowlist)
  - Added tenant policy store in `src/lib/tenant-policy-store.ts` (session/password/IP policy schemas, CIDR-aware IP checks, password validation helper)
  - Added APIs:
    - `GET/PUT /api/settings/policies`
    - `GET /api/auth/policy/discovery`
  - Added settings route `/settings/policies` for org-wide policy configuration
  - Updated `/login` workspace flow to discover policy, enforce IP allowlist, and validate password input against workspace policy
- [x] SERV-01 (v1): Omnichannel inbox abstraction API
  - Added `GET /api/service/inbox` to merge tickets + chat conversations
  - Added filtering by `channel`, `status`, and `search`
  - Added dashboard route `/service/inbox` and sidebar navigation entry
- [x] SERV-02 (v1/partial): SLA policy engine and breach tracking
  - Added shared SLA engine in `src/lib/sla-helpers.ts` (targets, due-date, breach/at-risk evaluation)
  - Added tenant policy store + validation in `src/lib/sla-policy-store.ts`
  - Added shared SLA service query helper in `src/lib/sla-service.ts`
  - Integrated SLA into tickets API responses and auto due-date generation (policy-aware)
  - Added `GET /api/service/sla` for SLA overview, breach metrics, and priority buckets
  - Added `GET/PUT /api/service/sla/policies` for tenant SLA policy management
  - Added `POST /api/service/sla/alerts/run` for breach/at-risk notification dispatch with cooldown
  - Added `POST /api/cron/sla-alerts` with secret-key auth for scheduled multi-tenant execution
  - Added deployment assets for scheduler (`vercel.json`, `.github/workflows/sla-alerts-cron.yml`, `docs/SLA_CRON_DEPLOY.md`)
  - Added SLA dashboard page `/service/sla` with live queue + editable policy form
  - Added manual alert trigger from SLA dashboard (`Run Alerts`)
  - Exposed SLA status in ticket list/detail UI (`/tickets`, `/tickets/[id]`)
- [x] SERV-05 (v1/partial): Inbox routing and assignment rules
  - Added routing policy store + rule engine in `src/lib/service-routing-store.ts`
  - Added `GET/PUT /api/service/inbox/routing-rules` for tenant routing policy management
  - Added dashboard route `/service/routing` with team/priority/business-hours configuration UI
  - Integrated automatic assignment into `POST /api/tickets` using routing policy (priority + off-hours + round-robin)
- [x] SERV-03 (v1/partial): Customer portal for ticket updates
  - Added token signing/verification utilities for contact-scoped portal access (`src/lib/customer-portal-token.ts`, `src/lib/service-portal-auth.ts`)
  - Added `POST /api/service/portal/access` to issue time-limited portal token for a tenant contact
  - Added contact-scoped portal APIs:
    - `GET/POST /api/service/portal/tickets`
    - `GET /api/service/portal/tickets/[id]`
    - `POST /api/service/portal/tickets/[id]/reply`
  - Added public portal routes:
    - `/portal/tickets`
    - `/portal/tickets/[id]`
- [x] SERV-04 (v1/partial): CSAT/NPS survey workflows
  - Added survey domain helpers for sent/responded events and metric aggregation in `src/lib/service-survey.ts`
  - Added `GET/POST /api/service/surveys` for metrics and survey dispatch workflow after ticket resolution
  - Added `POST /api/service/surveys/respond` for contact-scoped CSAT/NPS submission (portal token auth)
  - Added automatic survey invitation trigger when ticket status changes to `resolved` in `PATCH /api/tickets/[id]`
  - Added survey dashboard page `/service/surveys` and sidebar entry `CSAT & NPS`
- [x] SERV-06 (v1/partial): Service analytics dashboard v2
  - Added analytics domain aggregator in `src/lib/service-analytics.ts`
  - Added `GET /api/service/analytics` with KPI rollups (ticket volume, resolution, response time, channel mix, assignee load, survey performance)
  - Added dashboard route `/service/analytics` with 7/14/30/90-day window filters and module panels
  - Added sidebar entry `Service Analytics`
- [x] SALES-01 (v1/partial): Revenue forecasting engine
  - Added forecasting engine in `src/lib/sales-forecast.ts` (stage-weighted forecast + trend baseline + confidence bands)
  - Added `GET /api/sales/forecast` with monthly/quarterly forecast payloads
  - Added dashboard route `/sales/forecast` with period switch and confidence-band table
- [x] SALES-02 (v1/partial): Sales playbooks with guided steps
  - Added playbook domain store in `src/lib/sales-playbook-store.ts` (templates, recommendation, run progress tracking)
  - Added APIs `GET/POST /api/sales/playbooks` and `PATCH /api/sales/playbooks/[runId]/steps/[stepId]`
  - Added dashboard route `/sales/playbooks` with deal context, recommended template, and step execution checklist
- [x] SALES-03 (v1/partial): Document tracking and engagement events
  - Added document event helpers in `src/lib/sales-document-events.ts` (event normalization + summary aggregation)
  - Added APIs `GET/POST /api/sales/documents/events` for quote-linked view/download/signed tracking
  - Added dashboard route `/sales/documents` for event capture and engagement monitoring
  - Events are persisted as `activity` records with metadata and linked to `dealId` for timeline visibility
- [x] SALES-04 (v1/partial): Call recording/transcription pipeline
  - Added call-intelligence helpers in `src/lib/sales-call-intelligence.ts` (transcript highlights, risk signal detection, summary metrics)
  - Added APIs `GET/POST /api/sales/calls` for call transcript ingestion and retrieval
  - Added dashboard route `/sales/calls` for recording calls and reviewing transcript insights
  - Call transcripts are persisted as `activity` records with searchable metadata linked to CRM records
- [x] SALES-05 (v1/partial): Coaching insights and action suggestions
  - Added coaching engine in `src/lib/sales-coaching.ts` (deal health score, risk level, recommendation generation)
  - Added API `GET /api/sales/coaching` combining deal pipeline + call transcript signals
  - Added dashboard route `/sales/coaching` with prioritized coaching queue and risk buckets
- [x] COMM-01 (v1/partial): Payment provider abstraction and configuration
  - Added provider config store in `src/lib/payment-provider-store.ts` (test/live modes, active provider switching, credential version rotation)
  - Added APIs `GET/PUT /api/commerce/payments/providers`
  - Added dashboard route `/commerce/payments` for provider config management
- [x] COMM-02 (v1/partial): Invoice generation and lifecycle states
  - Added invoice domain store in `src/lib/invoice-store.ts` with ledger-safe status transitions (`draft -> sent -> paid` or `void`)
  - Added APIs `GET/POST /api/commerce/invoices` and `PATCH /api/commerce/invoices/[id]`
  - Added dashboard route `/commerce/invoices` for invoice creation and lifecycle actions
- [x] COMM-03 (v1/partial): Subscription and recurring billing engine
  - Added recurring subscription store in `src/lib/subscription-store.ts` (plans, billing cycles, renewals, cancellation scheduling, immediate cancellation)
  - Added APIs `GET/POST /api/commerce/subscriptions` and `PATCH /api/commerce/subscriptions/[id]`
  - Added dashboard route `/commerce/subscriptions` for subscription lifecycle management
- [x] COMM-04 (v1/partial): Dunning workflow for failed payments
  - Added dunning policy and queue store in `src/lib/dunning-store.ts` (retry schedule, max retries, notification channels, auto-cancel policy)
  - Added APIs `GET/PUT/POST /api/commerce/dunning` and `PATCH /api/commerce/dunning/[id]`
  - Added dashboard route `/commerce/dunning` for failed-payment queue triage and retry actions
- [x] COMM-05 (v1/partial): Revenue reporting integration
  - Added consolidated revenue report aggregator in `src/lib/commerce-revenue.ts` (invoice collection, subscription MRR/ARR, dunning recovery, reconciliation issues)
  - Added API `GET /api/commerce/revenue`
  - Added dashboard route `/commerce/revenue` for finance reconciliation visibility
- [x] MKT-01 (v1/partial): Ads campaign management connectors
  - Added ads connector store in `src/lib/marketing-ads-store.ts` (Google/Meta/LinkedIn connector state, sync window, budget, campaign snapshot sync)
  - Added APIs `GET/PUT /api/marketing/ads/connectors` and `GET/POST /api/marketing/ads/campaigns`
  - Added dashboard route `/marketing/ads` for connector configuration and spend metric sync review
- [x] MKT-02 (v1/partial): Social publishing scheduler and monitoring
  - Added social publishing store in `src/lib/social-publishing-store.ts` (multi-channel post scheduling, lifecycle transitions, channel mix summary)
  - Added APIs `GET/POST /api/marketing/social/posts` and `PATCH /api/marketing/social/posts/[id]`
  - Added dashboard route `/marketing/social` for scheduling calendar queue and monitoring post status
- [x] MKT-03 (v1/partial): Attribution model service (first/last/multi-touch)
  - Added attribution engine in `src/lib/marketing-attribution.ts` (model calculation + channel normalization)
  - Added API `GET /api/marketing/attribution` with model/date-range selectors
  - Added dashboard route `/marketing/attribution` for model comparison and channel revenue breakdown
- [x] MKT-04 (v1/partial): Customer journey analytics timeline
  - Added journey analytics engine in `src/lib/marketing-journey.ts` (touchpoint pathing, conversion lag, top-path aggregation)
  - Added API `GET /api/marketing/journey` with date-range and result-limit controls
  - Added dashboard route `/marketing/journey` for conversion timeline and journey-path visualization
- [x] MKT-05 (v1/partial): A/B testing framework for landing pages/emails
  - Added experiment lifecycle store in `src/lib/marketing-experiments-store.ts` (variant split, exposure/conversion counters, winner selection)
  - Added APIs:
    - `GET/POST /api/marketing/experiments`
    - `PATCH /api/marketing/experiments/[id]`
    - `POST /api/marketing/experiments/[id]/events`
  - Added dashboard route `/marketing/experiments` for experiment setup, lifecycle control, and variant performance tracking
- [x] MKT-06 (v1/partial): Marketing analytics workspace v2
  - Added consolidated analytics builder in `src/lib/marketing-analytics.ts` (cross-module KPI rollups + channel/type drill-down filters)
  - Added API `GET /api/marketing/analytics` combining ads, social, attribution, journey, and experiment metrics
  - Added dashboard route `/marketing/analytics` for unified marketing performance workspace
- [x] CONT-01 (v1/partial): Blog and article management module
  - Added content blog workflow store in `src/lib/content-blog-store.ts` (draft/review/scheduled/published/archived lifecycle)
  - Added APIs:
    - `GET/POST /api/content/blog/posts`
    - `PATCH /api/content/blog/posts/[id]`
  - Added dashboard route `/content/blog` for authoring, review, publish, and scheduling workflows
- [x] CONT-02 (v1/partial): SEO recommendations service
  - Added SEO scoring engine in `src/lib/content-seo.ts` (on-page checks, weighted score, keyword density, actionable suggestions)
  - Added API `GET /api/content/seo/recommendations` for blog post or landing page SEO analysis
  - Added dashboard route `/content/seo` for source selection and on-page SEO recommendation review
- [x] CONT-03 (v1/partial): Content approval workflow
  - Added approval policy and request workflow store in `src/lib/content-approval-store.ts`
  - Added APIs:
    - `GET/PUT /api/content/approvals/policies`
    - `GET/POST /api/content/approvals/requests`
    - `POST /api/content/approvals/requests/[id]/decision`
  - Enforced blog publish/schedule approval gate in `PATCH /api/content/blog/posts/[id]` when `blog_post` approval policy is enabled
  - Added dashboard route `/content/approvals` for policy configuration and review queue handling
- [x] CONT-04 (v1/partial): Content remix/reuse assistant
  - Added remix generation store in `src/lib/content-remix-store.ts` (format templates, tone controls, length clamping, variant history)
  - Added API `GET/POST /api/content/remix` for approved-source variant generation and listing
  - Enforced approved-source gate: remix generation requires at least one `approved` request for source asset in content approval workflow
  - Added dashboard route `/content/remix` for source selection, format/tone configuration, and generated variant review
- [x] CONT-05 (v1/partial): Performance dashboard for content assets
  - Added content performance analytics module in `src/lib/content-performance.ts` (event tracking + aggregation by asset/channel)
  - Added APIs:
    - `GET /api/content/performance`
    - `POST /api/content/performance/events`
  - Added dashboard route `/content/performance` for filterable performance KPIs and by-asset/by-channel views
  - Added demo event tracking form to capture `view|lead|conversion` signals by source asset and channel
- [x] CONT-06 (v1/partial): Website page management enhancements
  - Added structured page-builder module in `src/lib/content-page-builder.ts` (templates, reusable blocks, section composition, HTML renderer)
  - Added APIs:
    - `GET /api/content/pages/templates`
    - `GET/POST /api/content/pages/blocks`
    - `POST /api/content/pages/compose`
  - Added dashboard route `/content/pages` for template selection, reusable block library, and structured section composition into landing pages
- [x] DATA-01 (v1/partial): Bi-directional sync framework for external systems
  - Added sync framework store in `src/lib/data-sync-store.ts` (mapping upsert, bidirectional import/export execution, conflict policies, job history)
  - Added APIs:
    - `GET/PUT /api/data/sync/mappings`
    - `GET/POST /api/data/sync/jobs`
  - Added dashboard route `/data/sync` for mapping configuration, dry-run execution, and sync job conflict visibility
- [x] DATA-02 (v1/partial): Deduplication and data-quality rule engine
  - Added quality-rule and dedupe engine in `src/lib/data-quality-store.ts` (rule policies, duplicate candidate detection, merge audit history)
  - Added APIs:
    - `GET/PUT /api/data/quality/rules`
    - `GET /api/data/quality/dedupe/candidates`
    - `GET/POST /api/data/quality/merge`
  - Added dashboard route `/data/quality` for rule configuration, duplicate review, and merge workflow execution with audit trail
- [x] DATA-03 (v1/partial): Data lineage and job observability
  - Expanded sync job observability in `src/lib/data-sync-store.ts` (trace steps, diagnostics, lineage events, retry attempt linkage)
  - Added APIs:
    - `GET /api/data/sync/observability`
    - `POST /api/data/sync/jobs/[id]/retry`
  - Added dashboard route `/data/lineage` for observability timeline, diagnostics drill-down, and in-app retry controls
- [x] DATA-04 (v1/partial): Field mapping UI and transformation rules
  - Added mapping rules engine in `src/lib/data-mapping-rules.ts` (transform functions, validation rules, duplicate detection, preview generation)
  - Added API `GET/POST /api/data/sync/mappings/validate` for catalog discovery and mapping rule validation/preview
  - Added dashboard route `/data/mappings` for field-level schema mapping, transform config, validation toggles, and preview testing
- [x] DATA-05 (v1/partial): Programmable automation runtime improvements
  - Added workflow runtime engine in `src/lib/workflow-runtime-store.ts` (retry attempts, dead-letter queue, runtime summary, and version snapshots)
  - Added APIs:
    - `GET/POST /api/workflows/runtime/runs`
    - `GET/POST /api/workflows/runtime/dead-letter`
    - `GET/POST /api/workflows/[id]/versions`
    - `POST /api/workflows/[id]/versions/[versionId]/restore`
  - Added dashboard route `/workflows/runtime` for runtime execution controls, dead-letter retries, and workflow version rollback
- [x] AI-01 (v1/partial): Agent orchestration layer (planner + tools + memory)
  - Added orchestration core in `src/lib/ai/orchestrator.ts` (multi-step planning, tool execution sequencing, policy guardrails, conversation memory)
  - Added API `GET/POST /api/ai/orchestration` for plan execution and memory inspection
  - Integrated orchestration context and guardrails into `POST /api/ai/chat`
  - Added dashboard route `/ai-assistant/orchestration` for orchestration plan/guardrail/memory visibility
- [x] AI-02 (v1/partial): Sales agent (deal coaching, forecast insights)
  - Added sales agent engine in `src/lib/ai/sales-agent.ts` (action recommendation ranking, evidence extraction, confidence scoring)
  - Added API `GET/POST /api/ai/agents/sales` for tenant-level forecast and coaching analysis
  - Added dashboard route `/ai-assistant/agents/sales` for explainable recommendations and action planning
- [x] AI-03 (v1/partial): Service agent (ticket triage, suggested replies)
  - Added service agent engine in `src/lib/ai/service-agent.ts` (risk-based ticket triage, draft reply generation, confidence scoring)
  - Added API `GET/POST /api/ai/agents/service` for ticket queue analysis and response suggestions
  - Added dashboard route `/ai-assistant/agents/service` for triage execution and draft-reply review
- [x] AI-04 (v1/partial): Knowledge agent (search + answer grounding)
  - Added knowledge agent engine in `src/lib/ai/knowledge-agent.ts` (query relevance ranking, citation grounding, safe fallback behavior)
  - Added API `GET/POST /api/ai/agents/knowledge` for knowledge-base grounded answer generation
  - Added dashboard route `/ai-assistant/agents/knowledge` for citation review and grounding safety checks
- [x] AI-05 (v1/partial): AI evaluation harness (quality, latency, cost)
  - Added AI evaluation harness in `src/lib/ai/eval-harness.ts` for benchmark scoring across sales, service, and knowledge agent flows
  - Added API `GET/POST /api/ai/evals` for running benchmark suites with configurable thresholds
  - Added dashboard route `/ai-assistant/evals` for pass/fail and metric inspection
  - Added CI workflow `.github/workflows/ai-evals.yml` running `npm run test:ai-evals` on PR/push
- [x] AI-06 (v1/partial): Prompt/version governance and rollback
  - Added prompt governance store in `src/lib/ai/prompt-governance.ts` (per-agent version history, active version tracking, rollback)
  - Added APIs:
    - `GET/POST /api/ai/prompts`
    - `POST /api/ai/prompts/[agent]/rollback`
  - Added dashboard route `/ai-assistant/prompts` for prompt version management and one-click rollback
  - Integrated active chat prompt version into `POST /api/ai/chat` prompt construction
- [x] QA-02 (v1/partial): API performance budgets and alerting
  - Added performance budget engine in `src/lib/api-performance-budget.ts` (endpoint budgets, latency/error breach evaluation, alert history)
  - Added APIs:
    - `GET/PUT /api/qa/performance/budgets`
    - `GET/POST /api/qa/performance/evaluate`
  - Added dashboard route `/qa/performance` for budget configuration, evaluation run, and alert visibility
- [x] QA-04 (v1/partial): Frontend performance optimization pass
  - Added frontend threshold engine in `src/lib/frontend-performance.ts` (route-level LCP/INP/CLS/JS budgets with alert evaluation history)
  - Added APIs:
    - `GET/PUT /api/qa/frontend-performance/thresholds`
    - `GET/POST /api/qa/frontend-performance/evaluate`
  - Added dashboard route `/qa/frontend-performance` for threshold tuning and evaluation alerts
  - Optimized dashboard layout by lazy-loading `CommandPalette` via client wrapper and enabling content-visibility for main dashboard content
- [x] QA-05 (v1/partial): Release readiness checklist automation
  - Added release-readiness gate engine in `src/lib/release-readiness.ts` (tenant checklist policy, gate status evaluation, blocker detection, run history)
  - Added APIs:
    - `GET/PUT /api/qa/release-readiness/checklist`
    - `GET/POST /api/qa/release-readiness/evaluate`
  - Added dashboard route `/qa/release-readiness` for gate policy configuration and release readiness evaluation
  - Added CI workflow `.github/workflows/release-readiness.yml` to enforce test/security/AI-eval/build gates on PR and main
- [x] QA-03 (v1/hardening): Security regression coverage expanded
  - Added forbidden-permission tests for properties/webhooks routes
  - Added audit-log side effect assertions in properties/webhooks tests
  - Added audit-log side effect assertions in tickets/workflows/quotes tests
  - Added AI security regression tests (prompt-injection block, conversation tenant isolation, per-user rate limit)
  - Added RBAC regression tests for AI agents/orchestration/evals/prompts routes
- [x] QA-01 (v1/critical-flow-expanded): Expanded E2E coverage scope in code
  - Added `e2e/dashboard-modules.spec.ts` for dashboard module route checks
  - Added `/service/inbox` route coverage in dashboard module checks
  - Added `/service/sla` route coverage in dashboard module checks
  - Added `/service/routing` route coverage in dashboard module checks
  - Added `/service/surveys` route coverage in dashboard module checks
  - Added `/service/analytics` route coverage in dashboard module checks
  - Added `/sales/forecast` route coverage in dashboard module checks
  - Added `/sales/playbooks` route coverage in dashboard module checks
  - Added `/sales/documents` route coverage in dashboard module checks
  - Added `/sales/calls` route coverage in dashboard module checks
  - Added `/sales/coaching` route coverage in dashboard module checks
  - Added `/commerce/payments` route coverage in dashboard module checks
  - Added `/commerce/invoices` route coverage in dashboard module checks
  - Added `/commerce/subscriptions` route coverage in dashboard module checks
  - Added `/commerce/dunning` route coverage in dashboard module checks
  - Added `/commerce/revenue` route coverage in dashboard module checks
  - Added `/marketing/ads` route coverage in dashboard module checks
  - Added `/marketing/social` route coverage in dashboard module checks
  - Added `/marketing/attribution` route coverage in dashboard module checks
  - Added `/marketing/journey` route coverage in dashboard module checks
  - Added `/marketing/experiments` route coverage in dashboard module checks
  - Added `/marketing/analytics` route coverage in dashboard module checks
  - Added `/content/blog` route coverage in dashboard module checks
  - Added `/content/seo` route coverage in dashboard module checks
  - Added `/content/approvals` route coverage in dashboard module checks
  - Added `/content/remix` route coverage in dashboard module checks
  - Added `/content/performance` route coverage in dashboard module checks
  - Added `/content/pages` route coverage in dashboard module checks
  - Added `/data/sync` route coverage in dashboard module checks
  - Added `/data/mappings` route coverage in dashboard module checks
  - Added `/data/quality` route coverage in dashboard module checks
  - Added `/data/lineage` route coverage in dashboard module checks
  - Added `/qa/performance` route coverage in dashboard module checks
  - Added `/qa/frontend-performance` route coverage in dashboard module checks
  - Added `/qa/release-readiness` route coverage in dashboard module checks
  - Added `/settings/sso` route coverage in dashboard module checks
  - Added `/settings/policies` route coverage in dashboard module checks
  - Added `/workflows/runtime` route coverage in dashboard module checks
  - Added `/ai-assistant/orchestration` route coverage in dashboard module checks
  - Added `/ai-assistant/prompts` route coverage in dashboard module checks
  - Added `/ai-assistant/evals` route coverage in dashboard module checks
  - Added `/ai-assistant/agents/sales` route coverage in dashboard module checks
  - Added `/ai-assistant/agents/service` route coverage in dashboard module checks
  - Added `/ai-assistant/agents/knowledge` route coverage in dashboard module checks
  - Added cross-hub and security operations coverage in `e2e/critical-flows.spec.ts`
- [x] Persistence hardening wave (content + sales support modules)
  - Migrated `content-performance` event store to Prisma model `ContentPerformanceEvent`
  - Migrated `content-page-builder` reusable block store to Prisma model `ContentReusableBlock`
  - Migrated `sales-playbook` run state store to Prisma model `SalesPlaybookRun`
  - Added migration `prisma/migrations/20260215182000_add_content_builder_performance_playbook_persistence/`
  - Updated APIs and test harness for async Prisma-backed stores
- [x] Persistence hardening wave (workflow runtime + AI governance/orchestration)
  - Migrated workflow runtime stores to Prisma models:
    - `WorkflowVersionSnapshot`
    - `WorkflowRuntimeRun`
    - `WorkflowRuntimeDeadLetter`
  - Migrated AI prompt governance store to Prisma model `AiPromptVersion`
  - Migrated AI orchestration memory store to Prisma model `AiOrchestrationMemory`
  - Added migration `prisma/migrations/20260215191000_add_workflow_ai_runtime_persistence/`
  - Updated dependent APIs (`/api/workflows/runtime/*`, `/api/workflows/[id]/versions*`, `/api/ai/prompts*`, `/api/ai/orchestration`, `/api/ai/chat`) and test harness for async Prisma-backed stores
- [x] Integration hardening wave (ads + payments connectors)
  - Added ads connector integration hardening fields in persistence:
    - `MarketingAdsConnector.authConfig`
    - `MarketingAdsConnector.lastSyncStatus`
    - `MarketingAdsConnector.lastSyncError`
    - `MarketingAdsConnector.lastSyncDurationMs`
    - `MarketingAdsConnector.consecutiveSyncFailures`
  - Added idempotent ads campaign sync key:
    - unique index `MarketingAdsCampaign(tenantId, connectorId, externalCampaignId)`
  - Upgraded ads sync engine with:
    - connector auth/account validation before connect/sync
    - retry-aware sync execution (`maxRetries`)
    - `dryRun` mode
    - per-connector sync diagnostics in API result (`status`, `imported`, `retriesUsed`, `durationMs`, `error`)
  - Added payment provider verification persistence fields:
    - `CommercePaymentProviderConfig.lastVerificationStatus`
    - `CommercePaymentProviderConfig.lastVerificationError`
    - `CommercePaymentProviderConfig.lastVerifiedAt`
  - Added provider credential validation rules (Stripe/PayPal) and health verification flow
  - Added API `POST /api/commerce/payments/providers/verify`
  - Added migration `prisma/migrations/20260215195500_add_ads_payment_integration_hardening/`
- [x] Service omnichannel expansion wave (inbox external channels + ingestion)
  - Added service inbox persistence model `ServiceOmnichannelThread` with migration:
    - `prisma/migrations/20260215203000_add_service_omnichannel_inbox_threads/`
  - Added omnichannel thread store and validation schemas in:
    - `src/lib/service-inbox-store.ts`
  - Extended service inbox API:
    - `GET /api/service/inbox` now merges tickets, chat conversations, and external omnichannel threads
    - `POST /api/service/inbox` now ingests external channel threads (`email`, `phone`, `sms`, `whatsapp`, `facebook`, `custom`)
  - Expanded service inbox dashboard UI (`/service/inbox`) with new channel filters and channel-specific icons/labels
  - Expanded API/mocking coverage:
    - `tests/api/service-inbox.test.ts`
    - `tests/setup.ts` (`serviceOmnichannelThread` stateful model)
- [x] Sales CPQ + AI prospecting depth wave (enterprise quote lifecycle + new AI agent)
  - Added enterprise CPQ quote persistence fields and models:
    - `Quote.approvalStatus`, `Quote.approvalRequestedAt`, `Quote.approvalDecidedAt`, `Quote.approvalDecidedBy`
    - `Quote.eSignStatus`, `Quote.eSignSentAt`, `Quote.eSignCompletedAt`, `Quote.buyerLastActivityAt`
    - `QuoteApprovalRequest`, `QuoteBuyerActivity`
  - Added migration:
    - `prisma/migrations/20260216101500_add_quote_cpq_enterprise/`
  - Added CPQ quote workflow store in `src/lib/quote-cpq-store.ts`:
    - approval request/decision lifecycle
    - e-sign event ingestion and state transitions
    - unified quote activity timeline
  - Added quote CPQ APIs:
    - `POST /api/quotes/[id]/approval/request`
    - `POST /api/quotes/[id]/approval/decision`
    - `POST /api/quotes/[id]/esign/events`
    - `GET /api/quotes/[id]/timeline`
  - Expanded quote APIs and dashboard:
    - enriched `GET/PATCH /api/quotes/[id]` payload with approval/e-sign/timeline-linked data
    - enriched `/quotes` list with approval/e-sign state badges
    - added quote detail route `/quotes/[id]` with CPQ controls and approval/activity timeline
  - Added AI Prospecting agent:
    - `src/lib/ai/prospecting-agent.ts`
    - `GET/POST /api/ai/agents/prospecting`
    - dashboard route `/ai-assistant/agents/prospecting`
    - prompt governance support for `prospecting` agent in `/ai-assistant/prompts`
  - Added regression/unit coverage:
    - `tests/api/quotes-cpq.test.ts`
    - `tests/api/ai-prospecting-agent.test.ts`
    - `tests/lib/ai-prospecting-agent.test.ts`
- [x] Validation: full test suite passing (`837` tests)
- [x] Validation (hardening pass): targeted security/AI regression suite passing (`41` tests)
- [x] Validation: production build passing (`npm run build`)

## Estimation model

- Story Points (SP): 1, 2, 3, 5, 8, 13
- Priority: P0 (critical), P1 (high), P2 (medium), P3 (low)
- Sprint capacity suggestion: 35-45 SP / sprint (team 4-6 engineers)

## Epic summary

| Epic ID | Epic Name | Priority | Target Phase | Estimated SP |
|---|---|---|---|---:|
| EPIC-01 | Platform Enterprise Foundation | P0 | Phase A | 34 |
| EPIC-02 | Service Hub Advanced | P0 | Phase B | 39 |
| EPIC-03 | Sales Hub Advanced | P1 | Phase B | 34 |
| EPIC-04 | Commerce Hub Billing | P1 | Phase D | 31 |
| EPIC-05 | Marketing Hub Advanced | P1 | Phase C | 42 |
| EPIC-06 | Content Hub Full | P2 | Phase C | 36 |
| EPIC-07 | Operations/Data Hub Full | P1 | Phase A/C | 34 |
| EPIC-08 | AI Breeze Agents v2 | P1 | Phase D | 39 |
| EPIC-09 | Quality, Performance, Security Hardening | P0 | Continuous | 26 |

Total estimate: 315 SP

## EPIC-01 Platform Enterprise Foundation

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| PLAT-01 | Implement SSO login flow (SAML/OIDC gateway) | P0 | 8 | None | Admin can enforce SSO-only login and users can sign in via IdP |
| PLAT-02 | Add SCIM user provisioning sync endpoint | P1 | 8 | PLAT-01 | Create/update/deactivate users from IdP events |
| PLAT-03 | Introduce granular RBAC permission matrix | P0 | 8 | None | Permissions enforce module/action-level checks on API and UI |
| PLAT-04 | Add audit trail expansion for admin/security events | P1 | 5 | None | Security-relevant events are queryable with actor and timestamp |
| PLAT-05 | Tenant-level policy settings (session, password, IP allowlist) | P2 | 5 | PLAT-03 | Tenant admins can configure and apply org-wide policy |

## EPIC-02 Service Hub Advanced

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| SERV-01 | Build omnichannel inbox abstraction | P0 | 8 | PLAT-03 | Unified queue view supports ticket/chat plus external channels (email, phone, SMS, WhatsApp, Facebook, custom) |
| SERV-02 | Add SLA policy engine and breach tracking | P0 | 8 | SERV-01 | Ticket SLA timers and breach status visible in ticket detail/list |
| SERV-03 | Build customer portal for ticket updates | P1 | 8 | SERV-01 | External contacts can create/view/reply tickets with scoped access |
| SERV-04 | Add CSAT/NPS survey workflows | P1 | 5 | SERV-01 | Survey triggers post-resolution and metrics aggregate on dashboard |
| SERV-05 | Add inbox routing and assignment rules | P1 | 5 | SERV-01 | Rule-based assignment works by team, priority, and business hours |
| SERV-06 | Service analytics dashboard v2 | P2 | 5 | SERV-02, SERV-04 | SLA/CSAT/team performance dashboards available and filterable |

## EPIC-03 Sales Hub Advanced

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| SALES-01 | Revenue forecasting engine (stage-weighted + trend) | P1 | 8 | None | Forecast report supports monthly/quarterly views with confidence bands |
| SALES-02 | Sales playbooks with guided steps | P1 | 5 | None | Reps can launch contextual playbooks from deal/contact records |
| SALES-03 | Document tracking and engagement events | P1 | 8 | PLAT-04 | View/signed/download events are captured and linked to timeline |
| SALES-04 | Call recording/transcription pipeline | P2 | 8 | SERV-01 | Calls generate transcript + searchable snippets |
| SALES-05 | Coaching insights and action suggestions | P2 | 5 | SALES-04, EPIC-08 | Managers can see risk signals and coaching cues per rep |

## EPIC-04 Commerce Hub Billing

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| COMM-01 | Payment provider abstraction and configuration | P1 | 5 | None | Supports test/live mode and provider credential rotation |
| COMM-02 | Invoice generation and lifecycle states | P1 | 8 | COMM-01 | Draft/sent/paid/void invoices with ledger-safe state transitions |
| COMM-03 | Subscription and recurring billing engine | P1 | 8 | COMM-01 | Plans, cycles, renewals, cancellation policies supported |
| COMM-04 | Dunning workflow for failed payments | P2 | 5 | COMM-03 | Retry schedule + customer notifications configurable |
| COMM-05 | Revenue reporting integration | P2 | 5 | COMM-02, COMM-03 | Finance reports reconcile invoices/subscriptions/payments |

## EPIC-05 Marketing Hub Advanced

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| MKT-01 | Ads campaign management connectors | P1 | 8 | PLAT-03 | Campaign sync and spend metrics available in UI |
| MKT-02 | Social publishing scheduler + monitoring | P1 | 8 | MKT-01 | Multi-channel calendar with post status tracking |
| MKT-03 | Attribution model service (first/last/multi-touch) | P1 | 8 | MKT-01 | Attribution reports selectable by model and date range |
| MKT-04 | Customer journey analytics timeline | P2 | 8 | MKT-03 | Journey map visualizes channel-to-conversion path |
| MKT-05 | A/B testing framework for landing pages/emails | P2 | 5 | Existing forms/landing-pages/email modules | Experiment setup and winner evaluation supported |
| MKT-06 | Marketing analytics workspace v2 | P2 | 5 | MKT-02, MKT-03 | Consolidated KPIs and drill-down filtering |

## EPIC-06 Content Hub Full

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| CONT-01 | Blog and article management module | P2 | 8 | None | Create/edit/publish/schedule posts with authoring workflow |
| CONT-02 | SEO recommendations service | P2 | 8 | CONT-01 | On-page SEO score and actionable suggestions shown per page/post |
| CONT-03 | Content approval workflow | P2 | 5 | PLAT-03 | Reviewer approval gates before publish for configured spaces |
| CONT-04 | Content remix/reuse assistant | P2 | 5 | EPIC-08 | Generate repurposed variants from approved source content |
| CONT-05 | Performance dashboard for content assets | P2 | 5 | CONT-01 | Views/leads/conversions by asset and channel |
| CONT-06 | Website page management enhancements | P2 | 5 | Existing landing-pages module | Structured sections/templates and reusable blocks |

## EPIC-07 Operations/Data Hub Full

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| DATA-01 | Bi-directional sync framework for external systems | P1 | 8 | PLAT-01 | Mappings support import/export conflict-safe sync |
| DATA-02 | Deduplication and data-quality rule engine | P1 | 8 | DATA-01 | Duplicate detection and merge workflow with audit trail |
| DATA-03 | Data lineage and job observability | P2 | 5 | DATA-01 | Sync jobs expose traces, retry status, and failure diagnostics |
| DATA-04 | Field mapping UI and transformation rules | P1 | 8 | DATA-01 | Admin can map schema with validation and transform functions |
| DATA-05 | Programmable automation runtime improvements | P2 | 5 | Existing workflows module | Workflow runtime supports retries, dead-letter, and versioning |

## EPIC-08 AI Breeze Agents v2

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| AI-01 | Agent orchestration layer (planner + tools + memory) | P1 | 8 | Existing AI assistant v1 | Multi-step tool plans with policy guardrails |
| AI-02 | Sales agent (deal coaching, forecast insights) | P1 | 8 | AI-01, SALES-01 | Sales prompts produce actionable and explainable outputs |
| AI-03 | Service agent (ticket triage, suggested replies) | P1 | 8 | AI-01, SERV-01 | Agent proposes triage + draft reply with confidence score |
| AI-04 | Knowledge agent (search + answer grounding) | P1 | 5 | AI-01, knowledge-base module | Answers cite KB sources and handle missing info safely |
| AI-05 | AI evaluation harness (quality, latency, cost) | P1 | 5 | AI-01 | Regression benchmarks run in CI for major agent flows |
| AI-06 | Prompt/version governance and rollback | P2 | 5 | AI-01 | Prompt versions tracked with one-click rollback per agent |

## EPIC-09 Quality, Performance, Security Hardening

| Story ID | Story | Priority | SP | Dependencies | Acceptance criteria |
|---|---|---|---:|---|---|
| QA-01 | Expand E2E suite for critical business flows | P0 | 8 | None | End-to-end paths cover CRM, service, sales, marketing happy paths |
| QA-02 | Add API performance budgets and alerting | P1 | 5 | None | P95 latency/error budgets visible and alertable |
| QA-03 | Security regression suite + policy checks | P0 | 5 | PLAT-03 | Authz, tenant isolation, and injection checks block release on fail |
| QA-04 | Frontend performance optimization pass | P2 | 5 | None | Lighthouse thresholds met on key routes |
| QA-05 | Release readiness checklist automation | P2 | 3 | QA-01, QA-03 | Pre-release pipeline enforces quality/security gates |

## Suggested sprint plan (first 4 sprints)

| Sprint | Scope | Target SP | Candidate stories |
|---|---|---:|---|
| Sprint 1 | Platform security foundation | 40 | PLAT-03, PLAT-04, QA-03, SERV-01, QA-01(partial) |
| Sprint 2 | Service advanced v1 | 40 | SERV-02, SERV-03, SERV-05, SERV-06(partial), QA-01(partial) |
| Sprint 3 | Sales advanced v1 + data sync start | 38 | SALES-01, SALES-02, SALES-03, DATA-01 |
| Sprint 4 | Commerce + AI foundation | 42 | COMM-01, COMM-02, COMM-03(partial), AI-01, AI-04 |

## Jira import tips

- Create Epic issues first from the epic summary table.
- Create Story issues with `Epic Link` mapped by prefix (`PLAT-*`, `SERV-*`, etc.).
- Track engineering tasks as subtasks under each story:
  - `Design`
  - `Backend`
  - `Frontend`
  - `Testing`
  - `Docs`
- Add standard labels: `hubspot-gap`, `phase-a|b|c|d`, `priority-p0|p1|p2|p3`.
