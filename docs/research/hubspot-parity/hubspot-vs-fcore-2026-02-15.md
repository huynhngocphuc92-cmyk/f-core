# HubSpot vs F-CORE Parity Survey

> Date: 2026-02-15  
> Scope: `hubspot.com` official product pages vs current `hubspot-demo` codebase  
> Analyst mode: multi-agent research/comparison workflow

---

## 1) Agent Team Setup

### Agent A - Source Baseline (HubSpot)
- Mission: thu thap danh muc capability tu trang chinh thuc HubSpot.
- Sources:
  - https://www.hubspot.com/products
  - https://www.hubspot.com/products/sales
  - https://www.hubspot.com/products/service
  - https://www.hubspot.com/products/marketing
  - https://www.hubspot.com/products/content
  - https://www.hubspot.com/products/operations
  - https://www.hubspot.com/products/commerce
  - https://www.hubspot.com/products/artificial-intelligence/breeze-ai-agents
  - https://www.hubspot.com/products/commerce/cpq
  - https://www.hubspot.com/products/service/knowledge-base
  - https://www.hubspot.com/products/service/omnichannel-customer-service

### Agent B - Internal Inventory (F-CORE)
- Mission: scan route/API/test/plan de biet du an da lam gi.
- Key local evidence:
  - `docs/JIRA_BACKLOG_PLAN.md`
  - `docs/MASTER_PLAN.md`
  - `docs/JIRA_BACKLOG_IMPORT.csv`
  - `src/components/dashboard/AppSidebar.tsx`
  - `src/app/api/**`
  - `tests/api/**`

### Agent C - Gap Mapper
- Mission: map HubSpot capabilities -> F-CORE status (`done`, `partial`, `missing`).
- Rule:
  - `done`: co route/API + behavior khop core use-case.
  - `partial`: co module v1/demo, hoac thieu depth enterprise/integration.
  - `missing`: chua co module capability tuong ung.

### Agent D - Priority Planner
- Mission: xep hang 4 priority tiep theo theo impact/revenue/risk.

---

## 2) Current Project Snapshot (from plans/backlog)

- Backlog execution list dang danh dau rat nhieu item da xong nhung chu yeu o muc `v1/partial`: `docs/JIRA_BACKLOG_PLAN.md:10`, `docs/JIRA_BACKLOG_PLAN.md:49`, `docs/JIRA_BACKLOG_PLAN.md:110`, `docs/JIRA_BACKLOG_PLAN.md:130`, `docs/JIRA_BACKLOG_PLAN.md:157`, `docs/JIRA_BACKLOG_PLAN.md:194`, `docs/JIRA_BACKLOG_PLAN.md:225`.
- Security hardening co tien trien ro (RBAC/audit/security regression): `docs/JIRA_BACKLOG_PLAN.md:26`, `docs/JIRA_BACKLOG_PLAN.md:31`, `docs/JIRA_BACKLOG_PLAN.md:274`.
- Test signal tot theo backlog note:
  - `812` tests full suite: `docs/JIRA_BACKLOG_PLAN.md:326`
  - `41` targeted security/AI tests: `docs/JIRA_BACKLOG_PLAN.md:327`
- UI navigation breadth rat lon (Sales/Service/Commerce/Marketing/Content/Data/AI): `src/components/dashboard/AppSidebar.tsx:58`.

---

## 3) Parity Matrix (HubSpot vs F-CORE)

| Domain | HubSpot capability baseline | F-CORE status | Evidence | Gap summary |
|---|---|---|---|---|
| Platform | SSO/SCIM/RBAC/audit/policy | Partial-Strong | `docs/JIRA_BACKLOG_PLAN.md:10`, `docs/JIRA_BACKLOG_PLAN.md:19`, `docs/JIRA_BACKLOG_PLAN.md:26`, `docs/JIRA_BACKLOG_PLAN.md:31`, `docs/JIRA_BACKLOG_PLAN.md:38` | Da co enterprise foundation v1; can harden production integrations (real IdP provisioning lifecycle, ops playbooks). |
| Core CRM | Contacts/Companies/Deals/Tickets/Activities | Done-Partial | `src/components/dashboard/AppSidebar.tsx:60`, `src/components/dashboard/AppSidebar.tsx:61`, `src/components/dashboard/AppSidebar.tsx:62`, `src/components/dashboard/AppSidebar.tsx:75` | Breadth tot; can nang cap advanced object model (custom objects at scale, governance). |
| Sales | Forecasting, playbooks, doc tracking, call intelligence, coaching | Partial | `src/components/dashboard/AppSidebar.tsx:63`, `src/components/dashboard/AppSidebar.tsx:64`, `src/components/dashboard/AppSidebar.tsx:65`, `src/components/dashboard/AppSidebar.tsx:66`, `src/components/dashboard/AppSidebar.tsx:67` | Co 5 module chinh, nhung chua ngang depth enterprise HubSpot Sales Hub (prospecting workspace, deeper automation). |
| Sales CPQ | Advanced quote approvals, buyer intent/activity, e-signature | Partial-Missing | HubSpot CPQ page + local quotes APIs `src/app/api/quotes/route.ts:35`, `src/app/api/quotes/route.ts:85` | F-CORE co quotes CRUD; chua thay workflow quote approvals/e-sign/buyer engagement stack day du. |
| Service | Omnichannel inbox/help desk, SLA, routing, portal, surveys, analytics | Partial | `docs/JIRA_BACKLOG_PLAN.md:45`, `docs/JIRA_BACKLOG_PLAN.md:49`, `docs/JIRA_BACKLOG_PLAN.md:62`, `docs/JIRA_BACKLOG_PLAN.md:67`, `docs/JIRA_BACKLOG_PLAN.md:77`, `docs/JIRA_BACKLOG_PLAN.md:83` | Service breadth rat kha; nhung omnichannel hien tai chu yeu ticket/chat. |
| Service Omnichannel depth | Email/chat/phone/SMS/WhatsApp/Facebook/custom channels | Partial-Missing | `src/app/api/service/inbox/route.ts:44`, `src/app/api/service/inbox/route.ts:96`, `src/app/api/service/inbox/route.ts:160` | Hien merge ticket + chat conversation; chua thay full channel matrix nhu HubSpot omnichannel positioning. |
| Service CS Workspace | Customer success workspace/health-style operations | Missing | HubSpot Service product page | Chua thay route/module tuong ung ro rang trong sidebar/API. |
| Marketing | Ads, social, attribution, journey, experiments, analytics | Partial | `src/components/dashboard/AppSidebar.tsx:77`, `src/components/dashboard/AppSidebar.tsx:78`, `src/components/dashboard/AppSidebar.tsx:79`, `src/components/dashboard/AppSidebar.tsx:80`, `src/components/dashboard/AppSidebar.tsx:81`, `src/components/dashboard/AppSidebar.tsx:82` | Feature breadth co, nhung nhieu module dang v1/demo. |
| Marketing connectors | Native ad/social connectors + real sync | Partial-Missing | `src/lib/marketing-ads-store.ts:53`, `src/lib/marketing-ads-store.ts:125` | Dang dung in-memory state + mock campaign snapshots, chua la integration production. |
| Content | Blog, SEO, approvals, remix, performance, page builder | Partial | `src/components/dashboard/AppSidebar.tsx:83`, `src/components/dashboard/AppSidebar.tsx:84`, `src/components/dashboard/AppSidebar.tsx:85`, `src/components/dashboard/AppSidebar.tsx:86`, `src/components/dashboard/AppSidebar.tsx:87`, `src/components/dashboard/AppSidebar.tsx:88` | Da co Content Hub v1 kha day; can bo sung memberships/multi-site governance depth. |
| Data/Operations | Data sync, mapping validation, quality, lineage, runtime | Partial | `docs/JIRA_BACKLOG_PLAN.md:194`, `docs/JIRA_BACKLOG_PLAN.md:200`, `docs/JIRA_BACKLOG_PLAN.md:207`, `docs/JIRA_BACKLOG_PLAN.md:213`, `docs/JIRA_BACKLOG_PLAN.md:217` | Co framework tot; can bo sung external data warehouse/storage connectivity theo huong HubSpot Operations. |
| Commerce | Payments config, invoices, subscriptions, dunning, revenue | Partial | `src/components/dashboard/AppSidebar.tsx:68`, `src/components/dashboard/AppSidebar.tsx:69`, `src/components/dashboard/AppSidebar.tsx:70`, `src/components/dashboard/AppSidebar.tsx:71`, `src/components/dashboard/AppSidebar.tsx:72` | Co full module map tren UI, nhung backend core billing nhieu phan con in-memory. |
| Commerce persistence | Durable billing ledger states | Partial-Missing | `src/lib/invoice-store.ts:37`, `src/lib/subscription-store.ts:43` | Invoice/subscription stores dang Map in-memory; rui ro mat data khi restart/deploy. |
| AI Assistant | Copilot chat + orchestration + governance + eval harness | Partial-Strong | `src/components/dashboard/AppSidebar.tsx:111`, `src/components/dashboard/AppSidebar.tsx:112`, `src/components/dashboard/AppSidebar.tsx:113`, `src/components/dashboard/AppSidebar.tsx:114` | Governance/QA AI co nen tot. |
| AI Domain agents | Sales/Service/Knowledge agent | Partial | `src/components/dashboard/AppSidebar.tsx:115`, `src/components/dashboard/AppSidebar.tsx:116`, `src/components/dashboard/AppSidebar.tsx:117` | Co 3 agent chinh. |
| AI depth vs HubSpot Breeze agent suite | Prospecting/Customer/Content/Social specialized agents | Missing-Partial | HubSpot Breeze Agents page + local `src/lib/ai/sales-agent.ts:70`, `src/lib/ai/service-agent.ts:58`, `src/lib/ai/knowledge-agent.ts:57` | Local agents dang heuristic/rule-based, chua thay du 5 luong specialized nhu HubSpot positioning. |
| QA/Hardening | E2E/security/perf/release gates | Partial-Strong | `docs/JIRA_BACKLOG_PLAN.md:254`, `docs/JIRA_BACKLOG_PLAN.md:260`, `docs/JIRA_BACKLOG_PLAN.md:267`, `docs/JIRA_BACKLOG_PLAN.md:280` | Co khung hardening rat tot cho v1. |

---

## 4) Key Findings

1. Breadth parity cao, depth parity chua cao.
- [Inference] F-CORE da cover rat nhieu module theo hub (Sales/Service/Marketing/Content/Data/Commerce/AI), nhung nhieu module duoc ghi ro la `v1/partial`, va nhieu backend store con in-memory.

2. Kha nang production-readiness la gap lon nhat hien tai.
- Bang chung ro nhat: ads, invoices, subscriptions dung `Map` memory thay vi persistence layer:
  - `src/lib/marketing-ads-store.ts:53`
  - `src/lib/invoice-store.ts:37`
  - `src/lib/subscription-store.ts:43`

3. Service omnichannel va Commerce CPQ enterprise la 2 khoang cach business impact lon.
- HubSpot nhan manh omnichannel matrix va CPQ approvals/e-sign/workflow; F-CORE hien co base functionality nhung chua dat do sau enterprise.

4. AI stack co governance/testing tot, nhung can mo rong vertical agents.
- Copilot/orchestration/prompt governance/evals da co; can them content/social/customer/prospecting-specific agents neu muon sat HubSpot Breeze narrative.

---

## 5) Top 4 Priorities (next execution wave)

1. Persistence first (P0)
- Chuyen cac module commerce/marketing/data dang in-memory sang Prisma/Postgres with migrations, audit-safe writes, retry-safe jobs.

2. Real integrations (P0/P1)
- Thay mock connectors bang real connectors (ads/social/payment providers), co credential lifecycle, error observability, retry policy.

3. Service omnichannel expansion (P1)
- Mo rong `/service/inbox` tu ticket+chat sang email/phone/SMS/WhatsApp/custom channel adapters + SLA/routing parity.

4. Enterprise CPQ + AI agent depth (P1)
- Them quote approvals/e-sign/buyer activity timeline; mo rong AI agents cho prospecting/content/social/customer workflows.

---

## 6) Parity Score (survey-level estimate)

- Breadth parity (module coverage): ~75-80%
- Depth parity (enterprise-grade capability): ~40-50%
- Production readiness parity: ~35-45%

> [Inference] Score tren la danh gia dinh tinh dua tren baseline website HubSpot + code/backlog evidence hien tai, khong phai benchmark certifiable by external audit.

---

## 7) Notes on Method

- Survey uu tien source chinh thuc (`hubspot.com`) thay vi third-party blogs.
- Local status uu tien evidence tu code + plan/backlog thay vi chi route names.
- Danh gia "partial" duoc dung chu y vi codebase hien theo huong "feature breadth first, depth next".
