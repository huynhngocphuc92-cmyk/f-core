# Ticketing/Helpdesk System - Competitive Analysis

> **Project:** F-CORE (HubSpot CRM Clone)
> **Date:** 2026-02-09
> **Competitors Analyzed:** HubSpot Service Hub, Zendesk, Freshdesk, Intercom
> **Purpose:** Feature mapping for F-CORE ticketing module design

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Ticket Creation Flow](#2-ticket-creation-flow)
3. [Ticket Statuses and Pipeline/Stages](#3-ticket-statuses-and-pipelinestages)
4. [SLA Tracking](#4-sla-tracking)
5. [Routing and Assignment Rules](#5-routing-and-assignment-rules)
6. [Ticket Views](#6-ticket-views)
7. [Customer-Facing Features](#7-customer-facing-features)
8. [Priority Levels and Visual Indicators](#8-priority-levels-and-visual-indicators)
9. [Comment/Note Threading](#9-commentnote-threading)
10. [Ticket Properties and Custom Fields](#10-ticket-properties-and-custom-fields)
11. [Reporting and Analytics](#11-reporting-and-analytics)
12. [Feature Comparison Matrix](#12-feature-comparison-matrix)
13. [Recommendations for F-CORE](#13-recommendations-for-f-core)

---

## 1. Executive Summary

Each competitor takes a distinct philosophical approach to ticketing:

| Competitor | Philosophy | Strength |
|------------|-----------|----------|
| **HubSpot Service Hub** | CRM-native ticketing with pipeline-based lifecycle | Deep CRM integration, unified customer record |
| **Zendesk** | Traditional ticket-centric helpdesk with extensive customization | Mature routing, macros, SLA engine |
| **Freshdesk** | Balanced helpdesk with strong automation and dispatch rules | Automation tiers, round-robin, SLA policies |
| **Intercom** | Conversation-first with tickets layered on top | Conversational UX, AI-native (Fin), ticket categories |

---

## 2. Ticket Creation Flow

### 2.1 HubSpot Service Hub

**Creation Methods:**
- Manual from Tickets Index Page (CRM > Tickets > Create Ticket)
- From Contact/Company record (auto-associates)
- From Conversations Inbox (auto-generated from email, chat, social)
- Via Forms (embedded on website/knowledge base)
- Via Workflows (automated based on triggers)
- Via API

**Default Required Fields:**
| Field | Required | Notes |
|-------|----------|-------|
| Ticket Name | Yes | Subject/title of the ticket |
| Pipeline | Yes | Assign to a specific ticket pipeline |
| Ticket Status | Yes | Select stage within the chosen pipeline |

**Optional Default Fields:**
- Ticket Owner (agent assignment)
- Priority (Low, Medium, High, Urgent)
- Source (Email, Chat, Phone, Form, etc.)
- Description
- Category (Enterprise only, AI-classified)
- Associated Contact/Company/Deal

**Customization:** The creation form itself can be edited ("Edit this form") to add/remove/reorder properties and associations.

---

### 2.2 Zendesk

**Creation Methods:**
- Agent creates from Agent Workspace (+Add > Ticket)
- Customer submits via Help Center / Web Form
- Email to support address (auto-ticket)
- Live chat / messaging conversion
- Phone call (via Zendesk Talk)
- Social media (Facebook, X/Twitter, Instagram, WhatsApp)
- Via API

**System Fields (built-in):**
| Field | Required | Notes |
|-------|----------|-------|
| Requester | Yes | Customer email/name |
| Subject | Yes | Ticket subject line |
| Description | Yes | Body of the request |
| Status | Auto-set | Defaults to "New" |
| Priority | No | Low, Normal, High, Urgent |
| Type | No | Question, Incident, Problem, Task |
| Group | No | Agent group assignment |
| Assignee | No | Specific agent |

**Ticket Forms:** Zendesk supports multiple ticket forms (Professional+), each with different field combinations. Conditional fields show/hide based on other field values.

---

### 2.3 Freshdesk

**Creation Methods:**
- Agent creates from Tickets > New Ticket
- Customer submits via Support Portal / Ticket Form
- Email to support address (auto-ticket)
- Phone call (Freshcaller integration)
- Chat (Freshchat integration)
- Social media (Facebook, X/Twitter)
- Via API
- Automation rules (auto-create from events)

**Default Fields:**
| Field | Required | Notes |
|-------|----------|-------|
| Requester (Email) | Yes | Customer identification |
| Subject | Yes | Ticket title |
| Description | Yes | Ticket body / issue detail |
| Status | Auto-set | Defaults to "Open" |
| Priority | No | Low, Medium, High, Urgent |
| Source | Auto-detected | Email, Portal, Phone, Chat, etc. |
| Group | No | Agent group for assignment |
| Agent | No | Specific agent |
| Type | No | Question, Incident, Problem, Feature Request |
| Product | No | If multi-product support is enabled |
| Company | No | Associated company |

**Multiple Ticket Forms:** Pro plan supports multiple ticket forms with different field configurations per form.

---

### 2.4 Intercom

**Creation Methods:**
- Agent creates from Inbox (Compose > Ticket)
- Customer submits via Messenger ticket form
- Created from existing conversation (convert to ticket)
- Back-office ticket linked from conversation or customer ticket
- Tracker ticket for company-wide issues
- Via Workflows (automated)
- Via API

**Ticket Categories (unique to Intercom):**

| Category | Purpose | Customer Visibility |
|----------|---------|-------------------|
| **Customer Ticket** | Track long-running customer queries | Always shared with customer |
| **Back-office Ticket** | Internal collaboration between teams | Internal by default, optionally shared |
| **Tracker Ticket** | Track issues affecting many customers (bugs, outages) | Internal only, never shared |

**Default Attributes:**
| Field | Required | Notes |
|-------|----------|-------|
| Ticket Type | Yes | Defines category and custom attributes |
| Title | Yes | Ticket title |
| Description | Yes | Issue details |
| Assignee (Team) | No | Team assignment |

**Custom Attributes per Ticket Type:** Each ticket type can have its own set of custom attributes with formats: text, list, number, decimal, boolean, date/time, file upload. Customer-facing attributes can be marked as visible and/or required for customers.

---

## 3. Ticket Statuses and Pipeline/Stages

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **Default Statuses** | New, Waiting on Contact, Waiting on Us, Closed | New, Open, Pending, On-hold (optional), Solved, Closed | Open, Pending, Resolved, Closed | Submitted, In Progress, Waiting on Customer, Resolved |
| **Custom Statuses** | Yes (unlimited, per pipeline) | Yes (custom statuses grouped under status categories) | Yes (Growth plan+) | Yes (customizable per ticket type) |
| **Pipeline Concept** | Yes (multiple pipelines with unique statuses) | No formal pipelines; uses views/groups | No formal pipelines; uses groups/products | No formal pipelines; uses ticket types |
| **Open/Closed Classification** | Each status marked as "Open" or "Closed" | Status categories: New, Open, Pending, Hold, Solved, Closed | Statuses mapped to timer behavior (SLA on/off) | States grouped under categories |
| **Auto-reopen on reply** | Configurable | Yes (Pending -> Open on customer reply) | Yes (any non-Open -> Open on customer reply) | Yes |
| **System-closed** | Configurable via automation | Auto-close after solved (default 4 days) | Auto-close resolved tickets (default 72 hours) | Configurable |

### Detailed Breakdown

**HubSpot Service Hub:**
- Pipeline-based model (like Deals). Each pipeline has its own sequence of statuses.
- Default pipeline: "Support Pipeline" with statuses: New -> Waiting on Contact -> Waiting on Us -> Closed
- Each status is classified as either "Open" or "Closed" type.
- Multiple pipelines per account (Starter: 2, Professional: 15, Enterprise: 50+).
- Stages can have required properties (gates), forcing agents to fill in data before moving.
- March 2025: Added "Urgent" priority level; added board layout for Help Desk.
- Time-in-status tracking properties available (Pro+) for analyzing bottleneck stages.

**Zendesk:**
- Linear lifecycle: New -> Open -> Pending/On-hold -> Solved -> Closed
- "New" = unassigned; transitions to "Open" once assigned to an agent.
- "Pending" = waiting on customer; auto-reopens on customer reply.
- "On-hold" = waiting on third party (optional status, internal-only; customer sees "Open").
- "Solved" = resolution provided; auto-closes after configurable period (default 4 days).
- "Closed" = locked/read-only; cannot be reopened. Customer reply creates follow-up ticket.
- Custom ticket statuses (2024+): Create custom statuses grouped under status categories (New, Open, Pending, Hold, Solved). Example: "Awaiting Engineering" under "Pending" category.
- Visual color coding: New (orange), Open (red), Pending (blue), On-hold (dark gray), Solved (light gray), Closed (light gray).

**Freshdesk:**
- Default statuses: Open, Pending, Resolved, Closed
- "Open" = requires agent action. All new tickets default to Open. Customer reply moves ticket back to Open.
- "Pending" = waiting for customer. SLA timers paused by default.
- "Resolved" = agent believes issue is solved. Awaiting customer confirmation.
- "Closed" = customer acknowledges resolution. Reopens to Open if customer replies.
- Custom statuses (Growth+): Add statuses like "Waiting on Third Party," "Escalated," etc. Can define agent-facing and customer-facing labels separately.
- "Waiting on Customer" and "Waiting on Third Party" are common custom additions.

**Intercom:**
- Ticket states differ from conversation states.
- Default ticket states: Submitted -> In Progress -> Waiting on Customer -> Resolved
- Custom states can be configured per ticket type.
- States are customizable with customer-facing labels.
- Tracker tickets have their own states (typically: Open, In Progress, Resolved).
- Back-office tickets: In Progress, Waiting on Customer, Resolved.

---

## 4. SLA Tracking

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **SLA Metrics** | First Response, Next Response, Time to Close | First Reply, Next Reply, Periodic Update, Requester Wait, Agent Work, Total Resolution | First Response, Every Response, Resolution | First Response, Next Response, Time to Close |
| **SLA Per Priority** | Yes | Yes | Yes | Yes |
| **Multiple SLA Policies** | Yes (Enterprise - conditional) | Yes (Professional+) | Yes (Growth+) | Yes (Expert plan) |
| **Business Hours** | Yes (tied to working hours) | Yes (calendar/business hours per schedule) | Yes (multiple business hour schedules) | Yes |
| **Breach Alerts** | Yes (workflow-based) | Yes (via automations/triggers) | Yes (up to 3 escalation levels) | Yes (via workflows) |
| **SLA Pause** | Yes (configurable per status) | Yes (Pending/On-hold pause the clock) | Yes (Pending status pauses timer) | Yes ("Waiting on customer" pauses) |
| **Conditional SLAs** | By source, pipeline, priority, team (Enterprise) | By group, organization, form, tag, priority | By ticket source, type, group, company, product, priority | By conversation attributes |
| **Reporting** | SLA attainment dashboards, time-in-status | SLA compliance reports, breach views | SLA performance reports, escalation history | SLA metrics in reporting, custom reports |
| **Plan Required** | Professional+ | Professional+ | Growth+ | Expert |

### Detailed Breakdown

**HubSpot Service Hub:**
- SLAs defined under Settings > Tickets > SLAs.
- Can set response time and resolution time targets per priority level.
- Conditional SLAs (Enterprise): Different SLA rules by ticket source, pipeline, priority, or HubSpot team. Example: VIP customers get 1-hour first response; standard gets 4 hours.
- Tied to working hours to prevent after-hours skew.
- March 2025 update: SLAs now apply to all tickets in Help Desk regardless of creation method.
- Time-in-status properties (Pro+): Track when a ticket entered/exited each status and total time spent.
- Automated reminders and escalations via workflows.

**Zendesk:**
- SLA targets: First Reply Time, Next Reply Time, Periodic Update Time, Requester Wait Time, Agent Work Time, Total Resolution Time.
- Multiple SLA policies (Professional+): Define different SLAs for different groups, organizations, ticket forms, or tags.
- Policies ordered by priority; first matching policy applies.
- Business hours vs. calendar hours configuration per SLA.
- SLA breach used as a condition in views (e.g., "Next SLA Breach" sort) and automations.
- Built-in views: "SLA breached" and "SLA approaching breach."

**Freshdesk:**
- SLA targets per priority: First Response Time, Every Response Time (Pro+), Resolution Time.
- Multiple SLA policies (Growth+): Trigger conditions based on source, type, group, company, product, and any custom fields.
- Policies ordered top-to-bottom; first match wins (most restrictive first).
- Up to 3 escalation levels per SLA with configurable recipients.
- December 2025 upgrade: Simplified SLA calculation logic for business hours. Round-robin routing now considers SLA urgency when assigning tickets.
- Escalation rules notify managers when tickets approach SLA deadlines.

**Intercom:**
- SLAs set under Settings > Inbox > SLAs.
- Targets: First Response Time, Next Response Time, Time to Close.
- SLA timer pauses when ticket state is "Waiting on customer."
- SLA start time is set to the user's last interaction timestamp.
- SLA metrics available in reporting (Advanced+).
- Custom reports using SLA metrics and attributes (Expert plan).
- Limitation: SLAs cannot be directly edited; must archive and recreate.

---

## 5. Routing and Assignment Rules

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **Round-Robin** | Yes (Pro+) | Yes (omnichannel routing) | Yes (Growth+) | Yes (via workflows) |
| **Skills-Based** | Yes (Enterprise) | Yes (Professional+) | Yes (Enterprise) | No native; attribute-based routing |
| **Load Balancing** | Yes (capacity limits) | Yes (agent capacity/status) | Yes (load-balanced assignment) | Yes (workload management) |
| **Manual Assignment** | Yes | Yes | Yes | Yes |
| **Auto-Assignment** | Yes (workflow-based) | Yes (triggers + omnichannel) | Yes (dispatch rules + Omniroute) | Yes (workflow-based) |
| **Channel-Based** | Yes | Yes | Yes | Yes |
| **Property-Based** | Yes (any ticket property) | Yes (via triggers/conditions) | Yes (via dispatch rules) | Yes (via workflow conditions) |
| **Agent Availability** | Yes (status-aware) | Yes (online/offline/away) | Yes (agent availability) | Yes (away/active status) |
| **Reassign on Away** | Configurable | Yes | Yes | Yes (configurable) |
| **Capacity Limits** | Yes (per user) | Yes (per agent, per channel) | Yes (ticket cap per agent) | Yes (per teammate) |

### Detailed Breakdown

**HubSpot Service Hub:**
- Conversation Routing (Starter+): Route incoming messages to specific teams based on channel.
- Workflow-based Routing (Pro+): Route tickets using any combination of ticket properties, contact/company properties, or custom logic.
- Skill-Based Routing (Enterprise): Assign tickets to agents based on skills (language, product expertise, customer type). Performance tracking shows matched tickets and assignment trends.
- Capacity Limits: Set maximum concurrent tickets per agent in Help Desk settings.
- AI-Powered Routing (2025): Automatic classification, intelligent routing to most appropriate team member, smart prioritization based on customer value and issue severity.

**Zendesk:**
- Omnichannel Routing: Unified routing engine across email, messaging, chat, and calls. Push-based routing to agents based on status and capacity.
- Skills-Based Routing (Professional+): Define agent skills (language, product knowledge, region). Match ticket attributes to agent skills. Can be standalone (agents pull) or part of omnichannel routing (system pushes).
- Triggers: Event-based rules that fire on ticket creation/update. Used for auto-assignment based on conditions (subject, tags, requester, priority, etc.).
- Round-Robin: Distribute tickets evenly within a group.
- Agent Capacity: Configure max tickets per agent per channel. Respects agent online/away status.

**Freshdesk:**
- Ticket Dispatch Rules: Automation rules that run on ticket creation. Assign tickets to specific groups/agents based on conditions (requester email, subject, source, properties).
- Round-Robin (Growth+): Assign tickets in circular order within a group. December 2025 upgrade: Now powered by Omniroute engine for smarter distribution.
- Load-Balanced Assignment (Growth+): Cap tickets per agent to prevent overload.
- Omniroute (2025-2026 upgrade): Routes tickets based on real-time agent workload and availability. Admins choose which statuses affect agent load. Can route by created time, response SLA, or resolution SLA urgency.
- Skill-Based Routing (Enterprise): Route based on agent expertise.

**Intercom:**
- Assignment Workflows: Create workflows that auto-assign conversations and tickets based on rules (tags, keywords, user attributes, conversation data).
- Team-Based Assignment: Assign to teams; system distributes within team.
- Round-Robin: Available within team assignment via workflows.
- Workload Management: Configure assignment caps per teammate.
- Smart Routing: Route based on customer tier, issue type, or urgency. VIP customers reach senior agents immediately.
- Away Status with Reassign: If teammate is set to Away with "Reassign replies" enabled, conversation reverts to Unassigned for redistribution.

---

## 6. Ticket Views

### Comparison Table

| View Type | HubSpot | Zendesk | Freshdesk | Intercom |
|-----------|---------|---------|-----------|----------|
| **List/Table View** | Yes (default) | Yes (primary view) | Yes (default) | Yes (Inbox list) |
| **Board/Kanban View** | Yes (March 2025, pipeline stages as columns) | No native kanban | Yes (Freshservice; limited in Freshdesk) | No native kanban |
| **Split View** | Yes (list + conversation panel) | No | No | Yes (list + conversation panel) |
| **Custom Views** | Yes (saved filters) | Yes (shared/personal views) | Yes (Growth+, saved filters) | Yes (customizable Inbox views) |
| **Default Views** | My Tickets, Unassigned, All Open, etc. | Your Unsolved, Unassigned, Recent, Pending, Suspended, Deleted | My Open/Pending, Overdue, Open in My Groups, Urgent/High, All, Unresolved, etc. | All, Unassigned, Mentions, Created by Me |
| **Sort by SLA** | Yes (SLA breach proximity) | Yes (Next SLA Breach) | Yes (due date) | Yes (SLA status) |
| **Bulk Actions** | Yes | Yes (apply macros to multiple) | Yes | Yes |
| **Inline Editing** | Yes (status, priority, owner) | Limited | Yes (status, priority, assignment) | Limited |

### Detailed Breakdown

**HubSpot Service Hub:**
- Help Desk workspace is the primary interface. Default layouts: Table, Split, and Board (March 2025).
- Board layout shows tickets as cards in columns by pipeline stage -- similar to Deals board view.
- Table layout with customizable columns (any ticket property).
- Split layout: ticket list on left, conversation/details on right.
- Custom views via saved filters (any combination of ticket properties).
- Printing: Can print ticket with selected properties and conversation.

**Zendesk:**
- Views are the primary organizational tool. Each view is a filtered, sorted list of tickets.
- Pre-built views: Your Unsolved Tickets, Unassigned Tickets, All Unsolved, Recently Updated, Pending, Suspended, Deleted.
- Custom views: Define conditions (ticket status, priority, group, requester, tags, custom fields, SLA breach, etc.). Can be shared (visible to all agents) or personal.
- Sort by Next SLA Breach to ensure SLA compliance.
- Max 30 tickets per page per view. Views do not auto-refresh (manual refresh required).
- Views support custom fields as columns and filter conditions.

**Freshdesk:**
- Ticket list view with default views: My Open/Pending, My Overdue, Open in My Groups, Urgent/High Priority, All Tickets, Unresolved, New and My Open, Tickets I Raised, Mentioned In, Watching, Spam, Trash.
- Custom views (Growth+): Create saved views with custom filter combinations. Can be personal or shared.
- Favorite views for quick access with ticket count badges.
- Kanban board view available in Freshservice (ITSM); Freshdesk has limited board support.
- Inline editing of Status, Priority, Agent, Group directly from list view.

**Intercom:**
- Inbox-based with customizable views.
- Default sections: All, Unassigned, Mentions, Your conversations.
- Custom views: Filter by any conversation/ticket attribute (team, status, priority, tags, SLA).
- Manager views: See conversations of teammates who report to you.
- Persistent views that remain accessible (saved filters).
- No native kanban/board view.

---

## 7. Customer-Facing Features

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **Customer Portal** | Yes (Pro+, branded, login-protected) | Yes (Help Center with ticket portal) | Yes (Support Portal with SSO) | No dedicated portal; Messenger-based |
| **Knowledge Base** | Yes (Pro+, branded, multi-language) | Yes (Guide, multilingual, community forums) | Yes (built-in, multi-language) | Yes (Help Center / Articles) |
| **Ticket Tracking** | Yes (view, open, reply to tickets) | Yes (My Activities / My Requests) | Yes (view status, reply, reopen) | Limited (via Messenger ticket updates) |
| **Self-Service Search** | Yes (AI-enhanced KB search) | Yes (AI-powered, content cues) | Yes (article suggestions) | Yes (Fin AI answers from KB) |
| **CSAT Surveys** | Yes (Pro+, post-ticket-close) | Yes (built-in, configurable) | Yes (built-in, automatable) | Yes (conversation ratings, CSAT) |
| **NPS Surveys** | Yes (Pro+) | No native (via integration) | No native | No native |
| **CES Surveys** | Yes (Pro+) | No native | No native | No native |
| **Chatbot/AI Agent** | Yes (Breeze AI, Customer Agent) | Yes (AI Agents, Answer Bot) | Yes (Freddy AI Agent, 500 sessions/month Growth+) | Yes (Fin AI Agent, $0.99/resolution) |
| **Community Forums** | No | Yes (Gather module) | Yes (Freshdesk Community) | No |
| **Mobile Support** | Yes (mobile inbox for agents) | Yes (Support mobile app for agents) | Yes (Freshdesk mobile app) | Yes (Messenger SDK for mobile) |
| **Reply to Closed** | Yes (March 2025, portal) | Creates follow-up ticket | Reopens ticket | Reopens conversation |

### Detailed Breakdown

**HubSpot Service Hub:**
- Customer Portal (Pro+): Login-protected, branded. Customers can view, open, and reply to support tickets. Portal inherits domain language (40+ languages). Integrates with Knowledge Base for self-service.
- Knowledge Base (Pro+): Branded help center with videos, FAQs, search. AI-enhanced search. Analytics on article usage.
- Feedback Surveys: CSAT (post-interaction), NPS (loyalty), CES (effort) -- all automatable via workflows. Triggers: after ticket close, time-based, custom.
- Customer Agent (AI): Breeze-powered, auto-responds from KB, learns over time.

**Zendesk:**
- Help Center (Guide): Customer-facing portal with articles, community forums (Gather), and ticket tracking (My Activities).
- Customers can submit tickets via Help Center forms, track status, and respond.
- AI Agents: Resolve customer queries using Help Center content. 
- Content Cues: AI suggests which articles to create/improve based on ticket trends.
- CSAT: Built-in satisfaction rating on solved tickets. Configurable survey. No native NPS/CES.

**Freshdesk:**
- Support Portal: Customer-facing ticket submission, status tracking, reopening.
- Knowledge Base: Built-in, multi-language. Article suggestion on ticket creation.
- CSAT Surveys: Built-in, automatable (send after ticket resolution, based on events).
- Freddy AI Agent: Chatbot that resolves common queries from KB (Growth+, 500 sessions/month).
- Community Forums: Customer-facing discussion forums.

**Intercom:**
- No dedicated customer portal. Customers interact via Messenger widget (chat-first).
- Customer ticket updates delivered via Messenger with real-time state notifications.
- Help Center (Articles): Branded, multi-language (Advanced+). Natural language search.
- Fin AI Agent: Resolves ~50-65% of queries autonomously from Help Center and past conversations. Billed at $0.99/resolution.
- CSAT: Conversation ratings (emoji-based: 5-point scale). Auto-sent when conversation closes.
- Product Tours: Proactive onboarding and self-service (paid add-on).

---

## 8. Priority Levels and Visual Indicators

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **Default Levels** | Low, Medium, High, Urgent (March 2025) | Low, Normal, High, Urgent | Low, Medium, High, Urgent | No default priority field; custom attribute |
| **Custom Priorities** | Via custom properties | Via custom dropdown field (cannot edit system field) | Cannot edit default; create custom field | Define as custom attribute on ticket type |
| **Color Coding** | Yes (visual indicators per priority) | No built-in color coding on priority (uses status colors) | Yes (color-coded labels) | No default |
| **SLA Linked** | Yes (SLA targets vary by priority) | Yes (SLA targets vary by priority) | Yes (SLA targets per priority, hard-coded link) | Yes (can link SLA to attributes) |
| **Auto-Set Priority** | Yes (workflows, AI classification) | Yes (triggers based on conditions) | Yes (dispatch rules, automation) | Yes (workflows based on conditions) |

### Detailed Breakdown

**HubSpot:** Four levels (added "Urgent" in March 2025). Priority drives SLA targets and can trigger workflows. AI classification can auto-set priority based on content analysis and customer value.

**Zendesk:** Four system levels (Low, Normal, High, Urgent). System priority field values cannot be modified, but a custom dropdown can be created for customer-facing priority (P1/P2/P3/P4) with triggers mapping between them. Priority field colors: not inherently color-coded (status field has colors instead). SLA policies use priority as a key target dimension.

**Freshdesk:** Four levels (Low, Medium, High, Urgent). Priority field is hard-coded and tied directly to SLA policies -- cannot be edited. If additional priority values are needed, a custom field must be created alongside. Priority color indicators visible in ticket list and detail views.

**Intercom:** No built-in priority field. Priority must be configured as a custom attribute on ticket types (list format). Can be used in workflow conditions for routing and SLA assignment. Less opinionated about priority -- relies on conversation urgency and SLA rules instead.

---

## 9. Comment/Note Threading

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **Public Replies** | Yes (to customer) | Yes (public comment) | Yes (reply to customer) | Yes (Customer tickets only) |
| **Internal Notes** | Yes (visible to team only) | Yes (internal note, not visible to requester) | Yes (private note) | Yes (all ticket categories) |
| **@Mentions** | Yes (mention teammates) | Yes (via CCs and followers) | Yes (mention agents in notes) | Yes (mention teammates in notes) |
| **Rich Text** | Yes (formatting, attachments) | Yes (formatting, attachments, inline images) | Yes (formatting, canned responses, attachments) | Yes (bold, italic, lists, code, links, attachments) |
| **Email Notifications** | Yes (customer notified on public reply) | Yes (triggers for notifications) | Yes (auto-notify on public reply) | Yes (customer notified on state change/reply) |
| **Conversation Threading** | Single thread per ticket | Single thread per ticket | Single thread per ticket with forward capability | Threaded within conversation; linked across tickets |
| **Cross-Posting** | No native | Side conversations (Pro+) | Shared ownership, watchers | Back-office notes cross-post to linked conversations |
| **Canned Responses** | Yes (snippets/templates) | Yes (macros with comments) | Yes (canned responses with dynamic fields) | Yes (saved replies, macros) |

### Detailed Breakdown

**HubSpot:** Tickets display a conversation thread with public replies (to customer) and internal comments (team-only). Activity timeline shows all ticket events (status changes, associations, workflow enrollments). Agents can use email templates/snippets for consistent responses.

**Zendesk:** Comments are either public (visible to requester and agents) or internal notes (agents only). Macros can add pre-built comments + update ticket fields in one click. Side conversations (Professional+) allow agents to loop in external parties (via email) or internal teams (via child tickets or Slack) without the customer seeing. CCs and followers track interested parties.

**Freshdesk:** Replies (public) and Private Notes (internal). Forward capability to share ticket with external parties. Canned responses with dynamic placeholders (requester name, ticket ID, agent name, etc.). Shared ownership allows multiple agents to collaborate. Watchers follow ticket updates without being assigned.

**Intercom:** Distinct handling per ticket category:
- **Customer tickets:** Support both internal notes and customer-facing replies. Toggle with keyboard shortcuts (N for notes, R for replies).
- **Back-office tickets:** Internal notes only. Cross-posting feature: notes can be simultaneously posted to the linked customer ticket/conversation.
- **Tracker tickets:** Internal notes only. Can broadcast updates to all impacted customers.
- Linked ticket architecture allows front-office and back-office to collaborate without mixing internal/external communication.

---

## 10. Ticket Properties and Custom Fields

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **Custom Field Types** | Text, Number, Date, Dropdown, Checkbox, Radio, Multi-select, File, Calculated, etc. | Text, Multi-line, Numeric, Decimal, Dropdown, Multi-select, Checkbox, Date, Regex, Lookup Relationship | Text, Number, Dropdown, Multi-line, Checkbox, Date, Decimal, Dependent | Text, List, Number, Decimal, Boolean, Date/Time, File Upload |
| **Conditional Fields** | Yes (conditional properties in playbooks) | Yes (conditional ticket fields based on status/form) | Yes (dynamic sections based on dropdown selection) | Yes (per ticket type) |
| **Required by Status** | Yes (required at pipeline stage) | Yes (required at specific statuses: New/Open/Pending/On-hold/Solved/Always) | No native per-status | No native per-status |
| **Multiple Forms** | Via "Edit this form" per context | Yes (multiple ticket forms, Professional+) | Yes (multiple ticket forms, Pro+) | Via ticket types (each type = unique form) |
| **Computed/Calculated** | Yes (calculated properties) | Limited (via custom code) | No native | No native |
| **Field Permissions** | Yes (agent-only, customer-visible) | Yes (agent-only, editable by agents, visible to end users, editable by end users) | Yes (agent-visible, customer-visible toggles) | Yes (visible to customer, required for customer, internal only) |
| **Search/Filter by Custom** | Yes | Yes (in views, triggers, automations) | Yes (in views, automations) | Yes (in views, workflows) |

### HubSpot Default Ticket Properties (notable)

| Property | Description |
|----------|-------------|
| Ticket Name | Subject/title |
| Ticket Description | Full description |
| Pipeline | Which pipeline the ticket belongs to |
| Ticket Status | Current stage in pipeline |
| Priority | Low/Medium/High/Urgent |
| Source | Channel origin (Email, Chat, Form, Phone, etc.) |
| Ticket Owner | Assigned agent |
| Create Date | When ticket was created |
| Close Date | When ticket was closed |
| Category | AI-classified category (Enterprise) |
| Last Response Date | Last customer or agent response |
| Resolution Time | Calculated total resolution time |
| Time to First Response | Calculated first response time |
| Associated Contact | Linked contact record |
| Associated Company | Linked company record |
| Associated Deal | Linked deal record |
| Ticket Owner Teams | Assigned team(s) |
| Sentiment | AI-detected sentiment (Enterprise) |
| Language | AI-detected language (Enterprise) |

---

## 11. Reporting and Analytics

### Comparison Table

| Feature | HubSpot | Zendesk | Freshdesk | Intercom |
|---------|---------|---------|-----------|----------|
| **Pre-Built Reports** | Yes (Service Analytics suite) | Yes (Explore pre-built dashboards) | Yes (built-in reports) | Yes (report templates) |
| **Custom Reports** | Yes (Report Builder, Pro+) | Yes (Explore, custom queries) | Yes (Pro+, custom dashboards) | Yes (Advanced+, custom reports) |
| **Key Metrics** | Ticket volume, first response time, resolution time, SLA attainment, agent performance, CSAT/NPS/CES, time in status | Ticket volume, first response, resolution, backlog, reopens, CSAT, SLA compliance, agent handle time, channel breakdown | Ticket volume, first response, resolution, agent performance, CSAT, SLA performance, group metrics | Conversation volume, response time, resolution, CSAT, Fin resolution rate, SLA metrics, teammate performance |
| **Agent Performance** | Yes (tickets per agent, response time, SLA attainment) | Yes (tickets handled, CSAT, avg handle time) | Yes (tickets resolved, SLA compliance, response time) | Yes (conversations handled, CSAT, response time) |
| **SLA Reporting** | Yes (attainment rates, breach analysis) | Yes (compliance rates, breach views) | Yes (SLA performance, escalation tracking) | Yes (SLA compliance, custom SLA reports on Expert) |
| **Dashboard** | Yes (customizable, drag-and-drop) | Yes (Explore dashboards, schedulable) | Yes (customizable dashboards) | Yes (report builder) |
| **Scheduled Reports** | Yes (email reports) | Yes (scheduled exports) | Yes (scheduled reports) | Limited |
| **Cross-Department** | Yes (CRM-wide reporting: sales + marketing + service) | Limited (service-focused) | Limited (support-focused) | Limited (support + product usage) |
| **AI Insights** | Yes (predictive insights, sentiment trends) | Yes (intelligent triage recommendations) | Limited | Yes (Fin performance analytics) |

### Detailed Breakdown

**HubSpot Service Hub:**
- Service Analytics suite with out-of-the-box reports: ticket volume over time, average resolution time, first response time, SLA attainment, agent productivity, CSAT/NPS/CES scores, knowledge base usage.
- Custom Report Builder (Pro+): Drag-and-drop, combine any CRM data (contacts, companies, deals, tickets).
- Cross-department visibility: Because tickets live in the CRM, reports can correlate service metrics with sales/marketing data.
- Help Desk Analyze tab (March 2025): New reporting on time in ticket status -- how long tickets spend in each stage, entry/exit timestamps.
- Real-time dashboards configurable per team or role.

**Zendesk:**
- Explore analytics platform with pre-built dashboards: Support, Chat, Talk, Guide, Sell.
- Custom reports with drag-and-drop query builder.
- Metrics: ticket volume, first reply time, full resolution time, backlog, reopens, one-touch tickets, agent CSAT, SLA compliance, channel breakdown.
- Scheduled exports and automated report delivery.
- WFM (Workforce Management): Historical reports by organization, agent activity timelines, schedule management.

**Freshdesk:**
- Pre-built reports: Helpdesk In-Depth, Agent Performance, Group Performance, SLA Report.
- Custom reports (Pro+): Build with custom metrics, filters, groupings.
- Curated reports: Ticket trends, customer satisfaction, agent activity.
- Scheduled reports delivery to stakeholders.
- Performance distribution: Response time and resolution time distributions.

**Intercom:**
- Report templates: Customer Satisfaction, Team Performance, Conversation Volume, Fin AI Agent Performance.
- Custom reports (Advanced+): Build using conversation/ticket metrics and attributes.
- CSAT reporting: Conversation ratings by teammate, team, channel, and AI agent.
- Fin AI analytics: Resolution rate, handoff rate, CSAT for AI-resolved conversations.
- Trending Topics and Insights: AI-identified trending customer issues and volume drivers.

---

## 12. Feature Comparison Matrix

### Overall Feature Matrix

| Category | HubSpot Service Hub | Zendesk | Freshdesk | Intercom |
|----------|-------------------|---------|-----------|----------|
| **Ticket Creation** | Multi-channel + CRM-native | Multi-channel + web forms | Multi-channel + portal | Conversation-first + ticket types |
| **Pipelines/Stages** | Multiple pipelines (unique to HubSpot) | Single lifecycle with custom statuses | Single lifecycle with custom statuses | Ticket types with custom states |
| **SLA Engine** | Strong (conditional, Pro+) | Best-in-class (multiple policies, 6 metrics) | Strong (multiple policies, 3 escalation levels) | Basic (Expert plan required) |
| **Routing** | AI-powered + skills-based (Enterprise) | Omnichannel + skills-based (Pro+) | Omniroute + round-robin + load balance | Workflow-based, attribute routing |
| **Views** | List + Board + Split | Views (list-only, most customizable) | List + limited Board | Inbox-based, customizable |
| **Customer Portal** | Branded, login-protected | Help Center with ticket tracking | Support Portal with SSO | No portal; Messenger-based |
| **Surveys** | CSAT + NPS + CES (best) | CSAT only native | CSAT only native | CSAT (conversation ratings) |
| **AI/Automation** | Breeze AI (classification, routing, sentiment) | AI Agents, intelligent triage, macros | Freddy AI, automation scenarios | Fin AI Agent (highest resolution rate) |
| **CRM Integration** | Native (strongest) | Requires integration | Freshsales integration | Requires integration |
| **Custom Fields** | Extensive + calculated properties | Extensive + conditional forms | Good + dynamic sections | Per ticket type attributes |
| **Reporting** | Cross-department, CRM-wide | Deepest analytics (Explore) | Good with scheduled reports | Growing, AI-focused |
| **Pricing (entry for SLA)** | $90/seat/mo (Professional) | $55/agent/mo (Suite Team) | $15/agent/mo (Growth) | $132/seat/mo (Expert) |

---

## 13. Recommendations for F-CORE

Based on this competitive analysis, the following recommendations should guide the F-CORE ticketing module design:

### 13.1 Must-Have Features (MVP)

1. **Pipeline-Based Ticket Lifecycle** (HubSpot model)
   - Multiple pipelines with customizable statuses
   - Each status classified as "Open" or "Closed"
   - Default pipeline: New -> In Progress -> Waiting on Contact -> Waiting on Us -> Resolved -> Closed
   - Required properties per stage (gates)

2. **Core Ticket Properties**
   - Ticket Name, Description, Pipeline, Status, Priority (Low/Medium/High/Urgent), Source, Owner, Category
   - Associated Contact, Company, Deal (CRM relationships)
   - Create Date, Close Date, Last Response Date
   - Custom properties support (text, number, dropdown, date, checkbox, multi-select)

3. **Basic SLA Tracking**
   - First Response Time and Resolution Time targets per priority
   - Business hours configuration
   - SLA timer pause on "Waiting" statuses
   - Breach alerts via notifications

4. **Routing & Assignment**
   - Manual assignment to agents/teams
   - Basic auto-assignment rules (round-robin within team)
   - Channel-based routing (email -> team, chat -> team)
   - Agent availability awareness

5. **Views**
   - List/Table view with sortable, filterable columns
   - Board/Kanban view by pipeline stage
   - Default views: My Tickets, Unassigned, All Open, Overdue
   - Custom saved views with filter combinations

6. **Comment Threading**
   - Public replies (to customer) and Internal notes (team-only)
   - Rich text editor with attachments
   - @mentions for teammates
   - Email notifications on public replies

7. **Priority System**
   - Four levels: Low, Medium, High, Urgent
   - Color-coded visual indicators
   - Linked to SLA targets
   - Auto-set via automation rules

### 13.2 Should-Have Features (Sprint 2-3)

1. **Customer Portal** -- branded, login-protected ticket tracking
2. **Knowledge Base** -- self-service articles with search
3. **CSAT Surveys** -- post-resolution satisfaction rating
4. **Multiple SLA Policies** -- conditional SLAs by source, priority, team, customer segment
5. **Skill-Based Routing** -- route by agent expertise
6. **Canned Responses / Macros** -- templates with dynamic fields
7. **Conditional Fields** -- show/hide fields based on ticket type or status
8. **Multiple Ticket Forms** -- different forms for different issue types
9. **SLA Reporting Dashboard** -- attainment rates, breach analysis, time-in-status

### 13.3 Nice-to-Have Features (Future)

1. **AI Ticket Classification** -- auto-categorize, auto-prioritize, sentiment analysis
2. **AI Suggested Responses** -- recommend replies based on KB and history
3. **NPS/CES Surveys** -- broader feedback collection
4. **Tracker Tickets** (Intercom model) -- bulk issue tracking for bugs/outages
5. **Side Conversations** (Zendesk model) -- loop in external parties privately
6. **Escalation Hierarchies** -- multi-level escalation chains
7. **Workforce Management** -- scheduling, capacity planning

### 13.4 Data Model Recommendations

```
tickets
  id                  UUID PK
  tenant_id           UUID FK (multi-tenancy)
  ticket_number       SERIAL (human-readable, auto-increment per tenant)
  title               VARCHAR(255) NOT NULL
  description         TEXT
  pipeline_id         UUID FK -> ticket_pipelines
  status_id           UUID FK -> ticket_pipeline_stages
  priority            ENUM('low','medium','high','urgent') DEFAULT 'medium'
  source              ENUM('email','chat','phone','form','portal','api','manual')
  category            VARCHAR(100)
  owner_id            UUID FK -> users (assigned agent)
  team_id             UUID FK -> teams (assigned team)
  contact_id          UUID FK -> contacts
  company_id          UUID FK -> companies
  deal_id             UUID FK -> deals (optional)
  sla_policy_id       UUID FK -> sla_policies
  first_response_at   TIMESTAMP
  resolved_at         TIMESTAMP
  closed_at           TIMESTAMP
  sla_first_response_due  TIMESTAMP
  sla_resolution_due      TIMESTAMP
  sla_breached        BOOLEAN DEFAULT FALSE
  created_at          TIMESTAMP DEFAULT NOW()
  updated_at          TIMESTAMP DEFAULT NOW()
  deleted_at          TIMESTAMP (soft delete)

ticket_pipelines
  id                  UUID PK
  tenant_id           UUID FK
  name                VARCHAR(100)
  is_default          BOOLEAN DEFAULT FALSE
  display_order       INTEGER
  created_at          TIMESTAMP
  deleted_at          TIMESTAMP

ticket_pipeline_stages
  id                  UUID PK
  pipeline_id         UUID FK -> ticket_pipelines
  name                VARCHAR(100)
  stage_type          ENUM('open','closed')
  display_order       INTEGER
  is_default          BOOLEAN DEFAULT FALSE
  required_properties JSONB (fields required at this stage)
  created_at          TIMESTAMP

ticket_comments
  id                  UUID PK
  ticket_id           UUID FK -> tickets
  author_id           UUID FK -> users
  body                TEXT
  comment_type        ENUM('public','internal')
  attachments         JSONB
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
  deleted_at          TIMESTAMP

sla_policies
  id                  UUID PK
  tenant_id           UUID FK
  name                VARCHAR(100)
  is_default          BOOLEAN DEFAULT FALSE
  conditions          JSONB (match criteria)
  targets             JSONB (response/resolution times per priority)
  business_hours_id   UUID FK -> business_hours
  priority_order      INTEGER
  created_at          TIMESTAMP
  deleted_at          TIMESTAMP

ticket_sla_events
  id                  UUID PK
  ticket_id           UUID FK -> tickets
  sla_policy_id       UUID FK -> sla_policies
  metric_type         ENUM('first_response','resolution')
  target_at           TIMESTAMP
  achieved_at         TIMESTAMP
  breached            BOOLEAN DEFAULT FALSE
  paused_duration     INTERVAL DEFAULT '0'
  created_at          TIMESTAMP

ticket_custom_fields
  id                  UUID PK
  tenant_id           UUID FK
  field_name          VARCHAR(100)
  field_label         VARCHAR(200)
  field_type          ENUM('text','number','dropdown','date','checkbox','multi_select','file')
  options             JSONB (for dropdown/multi_select)
  is_required         BOOLEAN DEFAULT FALSE
  is_customer_visible BOOLEAN DEFAULT FALSE
  display_order       INTEGER
  pipeline_id         UUID FK (optional, scope to pipeline)
  created_at          TIMESTAMP
  deleted_at          TIMESTAMP

ticket_custom_field_values
  id                  UUID PK
  ticket_id           UUID FK -> tickets
  field_id            UUID FK -> ticket_custom_fields
  value               TEXT
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
```

### 13.5 Key Design Principles

1. **CRM-Native:** Tickets are first-class CRM objects with full association to contacts, companies, and deals (HubSpot model).
2. **Pipeline Flexibility:** Multiple pipelines with customizable stages, inspired by HubSpot's deal pipeline pattern already used in F-CORE.
3. **SLA as Core:** SLA tracking built into the ticket lifecycle from day one, not bolted on later.
4. **Multi-Tenancy:** Every query includes `tenant_id` filter. No exceptions.
5. **Soft Delete:** All ticket entities use `deleted_at` for soft deletion.
6. **Extensibility:** Custom fields architecture supports per-tenant, per-pipeline field definitions.
7. **Audit Trail:** All status changes, assignments, and SLA events are tracked for reporting.

---

*End of Competitive Analysis*
