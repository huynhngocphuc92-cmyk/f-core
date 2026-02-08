# UX Patterns for Workflow/Automation Builders in CRM Platforms

> **Research Date:** 2026-02-08
> **Author:** F-CORE Research Team
> **Sources:** HubSpot, Salesforce, n8n, Pipedrive, Temporal, React Flow (xyflow)
> **Purpose:** Inform the design and development of F-CORE's Workflow Automation feature

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Visual Flow Builder Patterns](#2-visual-flow-builder-patterns)
3. [Trigger Configuration UX](#3-trigger-configuration-ux)
4. [Action Configuration UX](#4-action-configuration-ux)
5. [Testing and Preview](#5-testing-and-preview)
6. [Workflow Management](#6-workflow-management)
7. [Mobile Considerations](#7-mobile-considerations)
8. [Accessibility](#8-accessibility)
9. [Technology Recommendations](#9-technology-recommendations)
10. [F-CORE MVP Scope](#10-f-core-mvp-scope)
11. [Wireframe Descriptions](#11-wireframe-descriptions)
12. [User Flow Diagrams](#12-user-flow-diagrams)

---

## 1. Executive Summary

Modern CRM workflow builders have converged on a set of proven UX patterns. After analyzing HubSpot Workflows, Salesforce Flow Builder, n8n, Pipedrive, and other automation platforms, the following key patterns emerge:

**Core Pattern: Vertical Linear Flow with Branching**
- HubSpot and Salesforce both use a primarily vertical, top-to-bottom flow layout
- This is simpler to understand than freeform canvas approaches (like n8n)
- Nodes are connected by vertical lines with "+" buttons between them to add steps
- Branching creates horizontal expansion for if/then paths

**Key Takeaways:**
1. **Start simple, reveal complexity.** The best builders use progressive disclosure -- basic linear flows are trivial to create, while branching/conditions are available but not forced.
2. **Inline editing over modals.** n8n's "focus panel" experiment (side panel editing) and Salesforce's single-click element cards show a trend toward editing nodes without full-screen modals.
3. **Visual clarity trumps density.** HubSpot users have complained about information overload in the UI. Clean, minimal node cards with expandable details perform better.
4. **Testing is non-negotiable.** Salesforce's flow testing, n8n's real-time execution view, and Adobe Journey Optimizer's dry-run mode all point to the need for workflow simulation before going live.
5. **Mobile: read-only is acceptable.** No major CRM provides a fully functional mobile workflow builder. Read-only monitoring with quick enable/disable is the norm.

---

## 2. Visual Flow Builder Patterns

### 2.1 Layout Approaches Compared

| Platform | Layout Type | Canvas | Navigation |
|----------|------------|--------|------------|
| HubSpot | Vertical linear (auto-layout) | Scrollable canvas | Minimap, zoom, pan |
| Salesforce Flow | Vertical auto-layout (default) or freeform | Zoomable canvas | Element palette sidebar |
| n8n | Freeform node graph | Infinite canvas | Minimap, zoom, fit-to-screen |
| Pipedrive | Vertical linear | Simple scroll | No minimap |
| Make (Integromat) | Horizontal freeform | Zoomable canvas | Module palette |

### 2.2 HubSpot Workflow Editor (Reference Model)

HubSpot uses a **vertical auto-layout** approach with the following structure:

```
+----------------------------------------------------------+
|  [Workflow Name]        [Undo] [Redo]  [Review & Publish] |
+----------------------------------------------------------+
|                                                          |
|  +------------------+                                    |
|  | ENROLLMENT       |    <- Trigger card (top)           |
|  | TRIGGER          |                                    |
|  | [Edit trigger]   |                                    |
|  +------------------+                                    |
|          |                                               |
|         [+]           <- Add action button               |
|          |                                               |
|  +------------------+                                    |
|  | ACTION STEP 1    |    <- Action node                  |
|  | Send email       |                                    |
|  +------------------+                                    |
|          |                                               |
|         [+]                                              |
|          |                                               |
|  +------+------+                                         |
|  | IF/THEN     |      <- Branch node                     |
|  +------+------+                                         |
|     /         \                                          |
|  [YES]       [NO]     <- Branch paths                    |
|    |           |                                         |
|  +----+     +----+                                       |
|  | A2 |     | A3 |                                       |
|  +----+     +----+                                       |
|     \         /                                          |
|      +-------+                                           |
|         [+]                                              |
|                                                          |
+----------------------------------------------------------+
| [Show minimap]                    [Zoom +] [Zoom -] [Fit]|
+----------------------------------------------------------+
```

**Key UX Details:**
- **Minimap panel:** Opens in the upper-left corner, shows the entire workflow as a small overview. Clicking on the minimap navigates the main canvas. Actions requiring attention are highlighted in yellow.
- **Undo/Redo:** Available in the top bar with keyboard shortcuts (Cmd+Z / Cmd+Shift+Z).
- **Plus (+) button:** Appears between every node. Clicking it opens a left-side panel with categorized action types.
- **Node cards:** Each step is a rectangular card showing the action type, icon, and a brief summary. Clicking a card opens a configuration panel on the left side.

### 2.3 Salesforce Flow Builder

Salesforce offers two layout modes:

**Auto-Layout (Default and Recommended):**
- Vertical top-to-bottom arrangement
- Elements snap into position automatically
- Plus button under each element to add the next step
- More beginner-friendly

**Free-Form Layout:**
- Drag elements anywhere on canvas
- Manual connector drawing between elements
- More flexible but harder to maintain
- Suitable for complex, non-linear flows

**Recent improvements (Summer 2025):**
- Single-click element cards (previously required double-click)
- New "Create New Flow" modal with smart filtering and search
- Screen preview for testing responsive layouts within the builder
- CLI-based flow testing (`sf flow run test`)

### 2.4 n8n Workflow Editor

n8n uses a **freeform node graph** approach:

```
+------------------------------------------------------------------+
| [Workflow Name] [+ Add Tag] [Save] [Share] [Execute]  [Publish]  |
+------------------------------------------------------------------+
|            |                                                      |
| [Nodes     |   +--------+     +--------+     +--------+          |
|  Panel]    |   |Trigger |---->| HTTP   |---->| IF     |          |
|            |   |Schedule|     | Request|     |        |          |
| [Search]   |   +--------+     +--------+     +---+----+          |
|            |                                  /        \          |
| [Triggers] |                           +------+    +------+      |
| [Actions]  |                           |Slack |    |Email |      |
| [Core]     |                           +------+    +------+      |
|            |                                                      |
+------------------------------------------------------------------+
| [Zoom +] [Zoom -] [Fit] [Tidy]              [Minimap] [AI Asst] |
+------------------------------------------------------------------+
```

**Key UX Details:**
- **Focus Panel (New - v1.113.0+):** Shows node parameters on the right side of the canvas when a node is selected, without opening a full modal. Keeps workflow diagram visible while editing.
- **Real-time execution view:** Data flows between nodes are highlighted -- green for success, red for errors.
- **Sticky notes:** Can be placed on the canvas for documentation/context.
- **Connection lines:** Drawn by dragging from output handles to input handles.
- **Tidy button:** Auto-arranges nodes for readability.

### 2.5 Recommended Approach for F-CORE

**Primary: Vertical Auto-Layout (HubSpot-style)**

Rationale:
1. Lower learning curve for CRM users who are not developers
2. Automatically handles layout complexity
3. Clear top-to-bottom reading order matches how people think about sequential processes
4. Branching expands horizontally, which is visually intuitive
5. Easier to implement responsive behavior

**Enhancement: Side-panel editing (n8n-inspired)**

Instead of full-screen modals for node configuration, use a right-side panel that shows node settings while keeping the flow diagram visible.

---

## 3. Trigger Configuration UX

### 3.1 Trigger Type Selection

HubSpot organizes triggers into these categories:

| Category | Examples |
|----------|---------|
| **Manual** | Trigger manually (no automatic enrollment) |
| **Filter-based** | Met filter criteria (property conditions) |
| **Scheduled** | On a schedule (daily, weekly, specific time) |
| **Event-based** | Form submission, Page visited, Email opened, Deal stage changed, Property value changed |
| **Webhook** | Received a webhook from an external app |

**UX Pattern for Trigger Selection:**

```
+-----------------------------------------------+
| How should this workflow start?                |
+-----------------------------------------------+
|                                                |
|  [x] When an event occurs                     |
|      +---------------------------------------+|
|      | Select an event trigger:              ||
|      |                                       ||
|      | > Contact events                      ||
|      |   - Form submitted                    ||
|      |   - Page visited                      ||
|      |   - Email opened/clicked              ||
|      |                                       ||
|      | > Deal events                         ||
|      |   - Deal stage changed                ||
|      |   - Deal created                      ||
|      |   - Deal property changed             ||
|      |                                       ||
|      | > Company events                      ||
|      |   - Company property changed           ||
|      +---------------------------------------+|
|                                                |
|  [ ] When filter criteria is met               |
|  [ ] On a schedule                             |
|  [ ] Trigger manually                          |
+-----------------------------------------------+
```

### 3.2 Property-Based Filter UI

The filter builder follows a pattern of:
**[Property] [Operator] [Value]**

```
+-----------------------------------------------+
| Filter Criteria                                |
+-----------------------------------------------+
|                                                |
| When ALL of the following are true:            |
|                                                |
| +-------------------------------------------+ |
| | Contact Property: [Lifecycle Stage    v]  | |
| | Operator:         [is equal to        v]  | |
| | Value:            [Lead              v]  | |
| +-------------------------------------------+ |
|                                                |
| [+ Add filter]      [AND / OR toggle]          |
|                                                |
+-----------------------------------------------+
```

**Key UX decisions observed across platforms:**
- **Grouped AND/OR logic:** HubSpot supports up to 250 filters with AND/OR grouping
- **Property search:** Searchable dropdown with categorized properties (Contact, Company, Deal, Custom)
- **Operator adapts to type:** Text properties show "contains, equals, starts with"; Number properties show "greater than, less than, between"; Date properties show "is before, is after, is within"
- **Value suggestions:** Known values auto-populate (e.g., lifecycle stage options)

### 3.3 Re-enrollment Settings

```
+-----------------------------------------------+
| Re-enrollment Settings                         |
+-----------------------------------------------+
|                                                |
| Should contacts be re-enrolled in this         |
| workflow?                                      |
|                                                |
| ( ) No - Enroll only the first time criteria   |
|     are met (default)                          |
|                                                |
| (x) Yes - Re-enroll every time the trigger     |
|     occurs                                     |
|                                                |
| NOTE: The following enrollment conditions      |
| cannot be used for re-enrollment:              |
| - List membership (static)                     |
| - Workflow status filters                      |
|                                                |
+-----------------------------------------------+
```

**Important rules from HubSpot's implementation:**
- Re-enrollment is off by default
- Not all trigger types support re-enrollment (listed clearly)
- Merged records do not auto-enroll unless re-enrollment is enabled
- A record must complete or be removed before re-enrolling

### 3.4 Unenrollment and Suppression

```
+-----------------------------------------------+
| Unenrollment Settings                          |
+-----------------------------------------------+
|                                                |
| Remove records from this workflow when:        |
|                                                |
| [x] They no longer meet enrollment criteria    |
| [x] They meet the following conditions:        |
|     +---------------------------------------+  |
|     | Lifecycle Stage [is equal to] [Customer]| |
|     +---------------------------------------+  |
|                                                |
| Suppression List:                              |
| [ ] Exclude records in: [Select list... v]     |
|                                                |
+-----------------------------------------------+
```

---

## 4. Action Configuration UX

### 4.1 Action Type Selection

When the user clicks the "+" button between nodes, a categorized panel appears:

```
+-----------------------------------------------+
| Add an action                                  |
+-----------------------------------------------+
| [Search actions...]                            |
+-----------------------------------------------+
|                                                |
| POPULAR                                        |
|   [icon] Send email                            |
|   [icon] Create task                           |
|   [icon] Set property value                    |
|   [icon] Add delay                             |
|                                                |
| COMMUNICATION                                  |
|   [icon] Send email                            |
|   [icon] Send internal notification            |
|   [icon] Send SMS                              |
|                                                |
| CRM                                            |
|   [icon] Create record                         |
|   [icon] Edit record                           |
|   [icon] Delete record (soft)                  |
|   [icon] Set property value                    |
|   [icon] Copy property value                   |
|   [icon] Add to list                           |
|                                                |
| FLOW CONTROL                                   |
|   [icon] If/then branch                        |
|   [icon] Value equals branch                   |
|   [icon] Delay (time-based)                    |
|   [icon] Delay until date                      |
|   [icon] Delay until event                     |
|   [icon] Go to action                          |
|                                                |
| INTEGRATION                                    |
|   [icon] Enroll in another workflow             |
|   [icon] Trigger webhook                       |
|   [icon] Custom code                           |
|                                                |
+-----------------------------------------------+
```

### 4.2 Property Mapping / Field Selection

When configuring a "Set property value" action:

```
+-----------------------------------------------+
| Set Property Value                             |
+-----------------------------------------------+
|                                                |
| Object:   [Contact              v]             |
|                                                |
| Property: [Lifecycle Stage      v]             |
|           (searchable dropdown)                |
|                                                |
| New Value: [Marketing Qualified Lead  v]       |
|            (context-sensitive input)           |
|                                                |
| [Save]                                         |
+-----------------------------------------------+
```

### 4.3 Personalization Tokens / Template Variables

In email and text actions, personalization tokens are inserted via a token picker:

```
+-----------------------------------------------+
| Email Body                                     |
+-----------------------------------------------+
|                                                |
| Hi {{contact.first_name}},                     |
|                                                |
| Thank you for your interest in                 |
| {{deal.deal_name}}.                            |
|                                                |
| [B] [I] [U] [Link] [Image] [{} Token v]       |
+-----------------------------------------------+
| Token Picker:                                  |
| +-------------------------------------------+ |
| | [Search tokens...]                        | |
| |                                           | |
| | Contact Properties                        | |
| |   first_name                              | |
| |   last_name                               | |
| |   email                                   | |
| |   company                                 | |
| |                                           | |
| | Deal Properties                           | |
| |   deal_name                               | |
| |   amount                                  | |
| |   close_date                              | |
| +-------------------------------------------+ |
+-----------------------------------------------+
```

**Design principles:**
- Tokens use double-curly-brace syntax: `{{object.property}}`
- Searchable token picker organized by object type
- Default/fallback value option when token is empty
- Preview shows resolved values with sample data

### 4.4 Delay / Wait Step Configuration

```
+-----------------------------------------------+
| Configure Delay                                |
+-----------------------------------------------+
|                                                |
| Delay type:                                    |
|                                                |
| (x) Fixed delay                                |
|     Wait for: [3] [days v]                     |
|     Options: hours, minutes, days, weeks       |
|                                                |
| ( ) Until a specific date/time                 |
|     Date property: [Close Date     v]          |
|     Time: [09:00 AM v]                         |
|     Timezone: [Contact timezone v]             |
|                                                |
| ( ) Until an event occurs                      |
|     Event: [Form Submitted     v]              |
|     Timeout: [7] [days] (then continue)        |
|                                                |
+-----------------------------------------------+
```

### 4.5 Branch / Condition Builder (If/Then UI)

HubSpot supports two types of branching:

**Type 1: If/Then Branch (AND/OR Logic)**
```
+--------------------------------------------------+
|  IF/THEN BRANCH                                   |
+--------------------------------------------------+
| Branch 1: "High Value"                            |
| +----------------------------------------------+ |
| | Deal Amount [is greater than] [$10,000]      | |
| | AND                                           | |
| | Lifecycle Stage [is equal to] [Opportunity]  | |
| +----------------------------------------------+ |
|                                                   |
| Branch 2: "Medium Value"                          |
| +----------------------------------------------+ |
| | Deal Amount [is between] [$1,000] and [$10k] | |
| +----------------------------------------------+ |
|                                                   |
| Branch 3: "None met" (default/else)               |
| (Cannot be removed)                               |
|                                                   |
| [+ Add branch]  (up to 20 branches)              |
+--------------------------------------------------+
```

**Type 2: Value Equals Branch (Auto-split)**
```
+--------------------------------------------------+
|  VALUE EQUALS BRANCH                              |
+--------------------------------------------------+
| Split based on:                                   |
| Property: [Deal Stage           v]                |
|                                                   |
| Branches auto-created:                            |
|  [Appointment Scheduled] --> path A               |
|  [Qualified to Buy]      --> path B               |
|  [Presentation Made]     --> path C               |
|  [Decision Maker Bought] --> path D               |
|  [None of the above]     --> default path          |
|                                                   |
| (Up to 250 branches per property)                 |
+--------------------------------------------------+
```

**Visual rendering of branches:**
```
              +------------+
              | IF/THEN    |
              +-----+------+
             /      |       \
       [Branch 1] [Branch 2] [None met]
          |          |           |
        +---+      +---+      +---+
        | A |      | B |      | C |
        +---+      +---+      +---+
          \         |          /
           +--------+---------+
                    |
                   [+]
```

**Key UX considerations for branching:**
- Records are evaluated against branches in order (first match wins)
- The "None met" / default branch cannot be deleted
- Adding a delay before a branch gives records time to meet criteria
- Visual branch lines should use distinct colors for clarity
- Branches can be reordered via drag-and-drop

---

## 5. Testing and Preview

### 5.1 Test with Sample Record

```
+-----------------------------------------------+
| Test Workflow                                  |
+-----------------------------------------------+
|                                                |
| Select a record to test with:                  |
| [Search contacts...                    v]      |
|                                                |
| Selected: John Smith (john@example.com)        |
|                                                |
| Test Options:                                  |
| [x] Preview only (do not execute actions)      |
| [ ] Execute actions (live test)                |
|                                                |
| [Run Test]                                     |
+-----------------------------------------------+
```

### 5.2 Dry-Run / Simulation Mode

Based on patterns from Adobe Journey Optimizer and other platforms:

```
+-----------------------------------------------+
| Dry Run Mode                                   |
+-----------------------------------------------+
|                                                |
| Status: [ACTIVE - DRY RUN]                     |
|                                                |
| Configuration:                                 |
| [x] Enable Wait/Delay activities               |
| [ ] Disable Wait/Delay (fast-forward)          |
|                                                |
| Dry Run Results:                               |
| +-------------------------------------------+ |
| | Step 1: Enrollment Trigger       [PASS]   | |
| | Step 2: Send Email              [SKIPPED] | |
| | Step 3: Delay 3 days            [SKIPPED] | |
| | Step 4: If/Then Branch          [PASS]    | |
| |   -> Branch: "High Value"      [MATCHED] | |
| | Step 5: Create Task             [SKIPPED] | |
| +-------------------------------------------+ |
|                                                |
| Records processed: 47                          |
| Paths taken:                                   |
|   Branch "High Value": 12 records              |
|   Branch "None met": 35 records                |
|                                                |
| [End Dry Run]                                  |
+-----------------------------------------------+
```

**Key principles from research:**
- Dry run should NOT send real emails, create real tasks, or modify records
- It should show which path each record would take through the workflow
- Metrics (counts per branch) should be visible in real time
- Wait/Delay steps can optionally be fast-forwarded
- Color-coded results: green = passed, yellow = skipped, red = error
- Dry run results should be distinguishable from live data (filtered via flag)

### 5.3 Execution Preview / Step-by-Step Debugger

Inspired by n8n's real-time execution view and Temporal's Timeline view:

```
+-----------------------------------------------+
| Execution Debugger                              |
+-----------------------------------------------+
|                                                |
| Record: John Smith                             |
| Enrollment: 2026-02-08 14:32:00                |
| Status: [IN PROGRESS]                          |
|                                                |
| Timeline:                                      |
| [14:32:00] Enrolled via trigger               |
|     -> Trigger: "Form submitted on /contact"  |
| [14:32:01] Action: Set lifecycle = MQL     OK |
| [14:32:02] Action: Send welcome email      OK |
|     -> Email ID: 12345                        |
|     -> Recipient: john@example.com            |
| [14:32:02] Delay: Wait 3 days                |
|     -> Resumes: 2026-02-11 14:32:02           |
| [PENDING] If/Then Branch evaluation            |
| [PENDING] Create follow-up task                |
|                                                |
| [<< Previous Step] [Next Step >>] [Cancel]     |
+-----------------------------------------------+
```

### 5.4 Pre-publish Validation

Before publishing, the system should validate:

```
+-----------------------------------------------+
| Review and Publish                             |
+-----------------------------------------------+
|                                                |
| WARNINGS (2):                                  |
| [!] Step 3: Email template has no subject line |
| [!] Step 7: Branch "High Value" has no actions |
|                                                |
| SUMMARY:                                       |
| Trigger: Form submitted on /contact            |
| Actions: 5 steps, 2 branches                  |
| Estimated records: ~1,200 contacts meet        |
|   enrollment criteria                          |
|                                                |
| Re-enrollment: Disabled                        |
| Timing: Execute immediately                    |
|                                                |
| [x] I have reviewed this workflow              |
|                                                |
| [Go Back]              [Turn On Workflow]      |
+-----------------------------------------------+
```

---

## 6. Workflow Management

### 6.1 Workflow List View

```
+-----------------------------------------------------------------------+
| Workflows                              [+ Create Workflow]            |
+-----------------------------------------------------------------------+
| [All] [Active] [Inactive] [Draft] [Needs Review]     [Search...]     |
+-----------------------------------------------------------------------+
| Type: [All v]  Object: [All v]  Created by: [All v]  [More filters] |
+-----------------------------------------------------------------------+
|                                                                       |
| Status | Name                  | Type     | Enrolled | Object   | Mod |
|--------|----------------------|----------|----------|----------|-----|
| [ON]   | Welcome New Leads    | Contact  | 1,247    | Contact  | 2d  |
| [ON]   | Deal Stage Notif.    | Deal     | 456      | Deal     | 1w  |
| [OFF]  | Re-engagement Camp.  | Contact  | --       | Contact  | 3w  |
| [DFT]  | Onboarding Flow v2   | Contact  | --       | Contact  | 1d  |
| [ERR]  | Invoice Reminder     | Company  | 23       | Company  | 4h  |
|                                                                       |
+-----------------------------------------------------------------------+
| Showing 1-10 of 47 workflows          [< 1 2 3 4 5 >]               |
+-----------------------------------------------------------------------+
```

**Status indicators:**
- **ON (green dot):** Active and enrolling records
- **OFF (gray dot):** Inactive, not enrolling
- **DFT (blue dot):** Draft, never been published
- **ERR (red dot):** Active but has errors requiring attention

**Key UX patterns:**
- Toggle switch in the list for quick enable/disable
- Inline enrollment count gives at-a-glance impact assessment
- "Needs Review" filter shows workflows with errors or warnings
- Bulk actions: enable, disable, clone, delete, move to folder
- Folders/categories for organization at scale

### 6.2 Execution History with Timeline

Based on HubSpot's workflow details page and Temporal's Timeline view:

```
+-----------------------------------------------------------------------+
| Workflow: Welcome New Leads                          [Edit] [Disable] |
+-----------------------------------------------------------------------+
| [Performance] [Action Logs] [Enrollment History] [Issues]            |
+-----------------------------------------------------------------------+

--- Performance Tab ---

+-----------------------------------------------------------------------+
| Top Metrics                                                           |
+-----------------------------------------------------------------------+
| Total Enrolled  | Completed | Active | Errored | Avg. Completion Time|
|     1,247       |   1,089   |   134  |    24   |    4.2 days         |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| Enrollment Over Time                              [7d] [30d] [90d]   |
+-----------------------------------------------------------------------+
|                                                                       |
|  150|                                                                 |
|     |    __                                                           |
|  100|   /  \        __                                                |
|     |  /    \      /  \     ___                                       |
|   50| /      \    /    \   /   \                                      |
|     |/        \__/      \_/     \___                                  |
|    0+-----+-----+-----+-----+-----+                                  |
|     Mon   Tue   Wed   Thu   Fri   Sat                                |
|                                                                       |
| Legend: [--- Enrolled] [--- Completed] [--- Errored]                 |
+-----------------------------------------------------------------------+

--- Action Logs Tab ---

+-----------------------------------------------------------------------+
| Action Logs                           [Filter by action v] [Export]  |
+-----------------------------------------------------------------------+
| Time               | Record          | Action         | Status       |
|--------------------|-----------------|----------------|-------------|
| 2026-02-08 14:32   | John Smith      | Send email     | Sent        |
| 2026-02-08 14:31   | Jane Doe        | Set property   | Completed   |
| 2026-02-08 14:30   | Bob Wilson      | If/Then Branch | Evaluated   |
| 2026-02-08 14:28   | Alice Brown     | Send email     | FAILED      |
|                    |                 |                | [View Error]|
+-----------------------------------------------------------------------+

--- Issues Tab ---

+-----------------------------------------------------------------------+
| Issues (3 open)                                                       |
+-----------------------------------------------------------------------+
| [!] 24 records failed at "Send Email" step                           |
|     Error: Email template deleted                                    |
|     First occurrence: 2026-02-06 09:00                               |
|     [Fix Now] [Ignore]                                               |
|                                                                       |
| [!] 5 records stuck at "Delay" step for 14+ days                    |
|     Expected delay: 3 days                                           |
|     [View Records] [Skip Delay]                                      |
+-----------------------------------------------------------------------+
```

### 6.3 Error State Visualization

Errors should be surfaced at multiple levels:

**Level 1 - List View:** Red dot status indicator + error count badge
**Level 2 - Flow Editor:** Error nodes highlighted in red/yellow with inline warning
**Level 3 - Execution Detail:** Full error message with stack trace and affected records

```
Error Node Visualization (in flow editor):

  +----------------------------+
  | [!] Send Welcome Email     |  <- Red border, warning icon
  |                            |
  | ERROR: Template not found  |  <- Error message inline
  | 24 records affected        |
  | [Fix] [Skip] [View]       |
  +----------------------------+
```

### 6.4 Performance Metrics Dashboard

Key metrics to track per workflow:

| Metric | Description | Visualization |
|--------|-------------|---------------|
| Total Enrolled | Records that entered the workflow | Counter |
| Completed | Records that reached the end | Counter + % |
| Active | Records currently in the workflow | Counter |
| Errored | Records that hit an error | Counter + % (red) |
| Avg. Completion Time | Mean time from enrollment to completion | Duration |
| Step Completion Rate | % of records completing each step | Funnel chart |
| Branch Distribution | % of records per branch path | Bar/Pie chart |
| Email Performance | Open/click rates for email actions | Line chart |

---

## 7. Mobile Considerations

### 7.1 Industry Consensus: Read-Only on Mobile

No major CRM platform provides a full-featured workflow builder on mobile. The consensus is:

- **Desktop:** Full builder experience (create, edit, configure, test)
- **Tablet:** Simplified builder (view, basic edits, monitoring)
- **Mobile Phone:** Read-only monitoring with quick actions

### 7.2 Mobile Workflow Monitoring View

```
+-----------------------------------+
| < Workflows                       |
+-----------------------------------+
| Welcome New Leads          [ON/OFF toggle] |
+-----------------------------------+
|                                   |
| METRICS                          |
| +------+  +------+  +------+    |
| | 1,247|  | 1,089|  |   24 |    |
| | Enrl |  | Done |  | Err  |    |
| +------+  +------+  +------+    |
|                                   |
| RECENT ACTIVITY                  |
| 14:32 John Smith enrolled        |
| 14:31 Jane Doe completed         |
| 14:28 Alice Brown FAILED         |
|       [View Error]               |
|                                   |
| [View Full Workflow]             |
| (Opens simplified flow view)     |
+-----------------------------------+
```

### 7.3 Mobile Quick Actions

- **Enable/Disable toggle:** One-tap to turn workflows on/off
- **Push notifications:** Alert when workflows error or complete milestones
- **Quick stats:** Enrollment and error counts visible at a glance
- **Drill-down:** Tap a record to see its journey through the workflow

### 7.4 Responsive Flow Viewer (Tablet)

For tablet-sized screens, the flow can be rendered read-only with zoom/pan:

```
+------------------------------------------+
| Welcome New Leads        [Edit on Desktop]|
+------------------------------------------+
|                                          |
|  [Trigger: Form Submitted]               |
|          |                               |
|  [Send Email]                            |
|          |                               |
|  [Delay: 3 days]                         |
|          |                               |
|  [If/Then]                               |
|    /    \                                |
| [Yes]  [No]                              |
|   |      |                               |
| [Task] [Email]                           |
|                                          |
| [Pinch to zoom] [Drag to pan]            |
+------------------------------------------+
```

---

## 8. Accessibility

### 8.1 Key Accessibility Requirements for Flow Builders

Based on research from Synergy Codes' accessibility-first workflow builder case study:

**Keyboard Navigation:**
- Tab through nodes in flow order (top to bottom, left to right for branches)
- Arrow keys to navigate between connected nodes
- Enter/Space to select and open node configuration
- Escape to close panels/modals
- Keyboard shortcuts for common actions (add node, undo, redo, save)

**Screen Reader Support:**
- Each node announces: type, label, status, and connections
- Example: "Step 3: Send Email action. Connected from Delay step. Connected to If/Then branch. Status: configured."
- Flow structure announced as a list: "Workflow with 7 steps. Step 1 of 7: Enrollment trigger, Form submitted."
- ARIA live regions for real-time status updates during execution
- ARIA attributes on all interactive elements

**Visual Accessibility:**
- High contrast mode support
- Status indicated by both color AND icon/text (never color alone)
- Minimum 4.5:1 contrast ratio for all text
- Focus indicators visible on all interactive elements
- Zoom support from 50% to 200% without loss of functionality

**Interaction Alternatives:**
- Drag-and-drop has keyboard equivalent (select source, Tab to target, Enter to connect)
- Right-click context menus accessible via keyboard (Shift+F10 or menu key)
- Contextual help panel listing available keyboard shortcuts

### 8.2 WCAG 2.1 Compliance Targets

| Criteria | Level | Implementation |
|----------|-------|----------------|
| 1.1.1 Non-text Content | A | Alt text on all icons, ARIA labels on nodes |
| 1.3.1 Info and Relationships | A | Semantic HTML, heading hierarchy in panels |
| 1.4.3 Contrast | AA | 4.5:1 for text, 3:1 for UI components |
| 2.1.1 Keyboard | A | Full keyboard navigation of flow editor |
| 2.1.2 No Keyboard Trap | A | Escape always exits modals/panels |
| 2.4.3 Focus Order | A | Logical tab order through flow |
| 2.4.7 Focus Visible | AA | Custom focus ring on all elements |
| 4.1.2 Name, Role, Value | A | ARIA roles on custom components |

---

## 9. Technology Recommendations

### 9.1 React Flow (xyflow) - Recommended Canvas Library

**React Flow** (`@xyflow/react`) is the industry-standard library for building node-based UIs in React:

- **35,100+ GitHub stars**, 4.1M+ weekly npm installs
- MIT licensed
- Used by Stripe, Typeform, DoubleLoop
- Built-in: drag, zoom, pan, select, minimap, controls, background grid
- Custom node and edge components (full React)
- Works with Tailwind CSS and shadcn/ui via React Flow UI components
- Zustand-based state management recommendation

**Key Integration Points:**
```
@xyflow/react         -- Core library
@xyflow/react/dist/style.css  -- Base styles
React Flow UI         -- Pre-built components via shadcn CLI
Zustand               -- State management
```

**Workflow Editor Template:** React Flow offers a Pro template specifically for workflow editors built with Next.js, Tailwind CSS, and shadcn/ui -- directly aligned with F-CORE's tech stack.

### 9.2 Alternative Libraries Considered

| Library | Stars | Pros | Cons | Decision |
|---------|-------|------|------|----------|
| React Flow | 35.1K | Most mature, best docs, huge community | Pro features require subscription | **Selected** |
| reaflow | ~2K | Built for workflows specifically | Smaller community, less maintained | Backup option |
| Flowy | ~11K | Simple API | No React support, basic features | Rejected |
| flow-builder | ~1K | Lightweight | Too basic for CRM needs | Rejected |

### 9.3 Backend Architecture for Workflow Engine

```
+-------------------+     +-------------------+     +------------------+
|  Workflow Editor   |     |  Workflow Engine   |     |  Action Executors |
|  (React Flow)      |---->|  (Server-side)     |---->|  (Workers)        |
|                   |     |                   |     |                  |
|  - Canvas UI      |     |  - State machine  |     |  - Send email    |
|  - Node config    |     |  - Scheduler      |     |  - Update CRM    |
|  - Validation     |     |  - Queue (BullMQ) |     |  - Webhooks      |
|  - Preview/test   |     |  - Event bus      |     |  - Custom code   |
+-------------------+     +-------------------+     +------------------+
        |                         |                         |
        v                         v                         v
+-------------------------------------------------------------------+
|                    PostgreSQL (Supabase)                           |
|  workflows | workflow_steps | workflow_executions | execution_logs |
+-------------------------------------------------------------------+
```

---

## 10. F-CORE MVP Scope

### 10.1 Phase 1: MVP (Sprint N)

**Must Have:**
- [x] Workflow list view (active/inactive/draft filters)
- [x] Vertical auto-layout flow editor with React Flow
- [x] Basic trigger types: manual, property filter, form submission
- [x] Core actions: send email, set property, create task, add delay
- [x] Simple if/then branching (single condition)
- [x] Enable/disable toggle
- [x] Pre-publish validation (warnings/errors)
- [x] Basic execution history (action logs)

**Nice to Have:**
- [ ] Minimap navigation
- [ ] Undo/Redo
- [ ] Personalization tokens in email actions

### 10.2 Phase 2: Enhanced Builder

**Features:**
- [ ] Multi-branch if/then (up to 10 branches)
- [ ] Value-equals auto-branching
- [ ] Re-enrollment settings
- [ ] Unenrollment triggers and suppression lists
- [ ] Workflow cloning
- [ ] Workflow folders/categories
- [ ] Dry-run simulation mode
- [ ] Performance metrics dashboard
- [ ] Side-panel node editing (n8n-style)

### 10.3 Phase 3: Advanced Automation

**Features:**
- [ ] Webhook triggers and actions
- [ ] Cross-object workflows (contact -> deal -> company)
- [ ] Custom code action (JavaScript)
- [ ] Workflow templates library
- [ ] A/B testing within workflows
- [ ] AI-powered workflow suggestions
- [ ] Mobile monitoring view
- [ ] Full audit trail with version history

### 10.4 MVP Data Model (Conceptual)

```sql
-- Core tables for workflow engine

workflows
  id              UUID PRIMARY KEY
  tenant_id       UUID NOT NULL (FK -> tenants)
  name            VARCHAR(255) NOT NULL
  description     TEXT
  object_type     VARCHAR(50) NOT NULL  -- contact, deal, company
  status          VARCHAR(20) NOT NULL  -- draft, active, inactive
  trigger_config  JSONB NOT NULL
  settings        JSONB  -- timing, re-enrollment, etc.
  created_by      UUID (FK -> users)
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
  deleted_at      TIMESTAMP  -- soft delete

workflow_steps
  id              UUID PRIMARY KEY
  workflow_id     UUID (FK -> workflows)
  tenant_id       UUID NOT NULL
  step_type       VARCHAR(50) NOT NULL  -- action, condition, delay
  action_type     VARCHAR(50)           -- send_email, set_property, etc.
  config          JSONB NOT NULL        -- step-specific configuration
  position        INTEGER NOT NULL      -- order in flow
  parent_step_id  UUID (FK -> workflow_steps, nullable)
  branch_label    VARCHAR(100)          -- for conditional branches
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

workflow_executions
  id              UUID PRIMARY KEY
  workflow_id     UUID (FK -> workflows)
  tenant_id       UUID NOT NULL
  record_id       UUID NOT NULL         -- enrolled record
  record_type     VARCHAR(50) NOT NULL
  status          VARCHAR(20) NOT NULL  -- active, completed, errored, cancelled
  current_step_id UUID (FK -> workflow_steps)
  enrolled_at     TIMESTAMP
  completed_at    TIMESTAMP
  error_message   TEXT

execution_logs
  id              UUID PRIMARY KEY
  execution_id    UUID (FK -> workflow_executions)
  tenant_id       UUID NOT NULL
  step_id         UUID (FK -> workflow_steps)
  status          VARCHAR(20) NOT NULL  -- success, failed, skipped
  input_data      JSONB
  output_data     JSONB
  error_details   JSONB
  executed_at     TIMESTAMP
  duration_ms     INTEGER
```

---

## 11. Wireframe Descriptions

### 11.1 Workflow List Page

**Layout:** Standard dashboard page with sidebar navigation
**Header:** "Workflows" title, "+ Create Workflow" primary button (top right)
**Filters Bar:** Tab-style filters (All | Active | Inactive | Draft), search input, type/object dropdowns
**Table:** Sortable columns - Status toggle, Name (link), Type, Object, Enrolled count, Last Modified, Actions (3-dot menu)
**Empty State:** Illustration with "Create your first workflow" CTA and link to templates
**Pagination:** Bottom center, showing record count and page navigation

### 11.2 Workflow Creation Modal

**Step 1 - Choose Object Type:**
- Radio buttons: Contact, Deal, Company, Ticket
- Each option shows a brief description and icon

**Step 2 - Start from:**
- Cards: "Start from scratch", "Start from template"
- Template cards show name, description, and preview thumbnail

**Step 3 - Name and Description:**
- Text input for name (required)
- Textarea for description (optional)
- "Create" button

### 11.3 Workflow Editor Page

**Top Bar:**
- Left: Back arrow, Workflow name (editable inline), status badge
- Center: Undo, Redo buttons
- Right: "Review and Publish" primary button, 3-dot menu (Clone, Delete, Settings)

**Main Canvas Area:**
- Gray dotted-grid background (React Flow default)
- Trigger card at top, action nodes below, connected by vertical lines
- "+" buttons between nodes (circular, centered on connecting line)
- Selected node shows blue border highlight

**Left Panel (shown when adding/editing):**
- Slides in from left
- Header: "Add action" or "Configure: [Action Name]"
- Content: categorized action list or form fields
- Footer: "Save" and "Cancel" buttons

**Bottom Bar:**
- Left: Minimap toggle
- Right: Zoom controls (-, +, Fit), percentage indicator

### 11.4 Trigger Configuration Panel

**Panel Position:** Left side, 400px wide
**Header:** "Enrollment Trigger" with close (X) button
**Tabs:** "Trigger" | "Settings"

**Trigger Tab:**
- Trigger type selector (radio or card-based)
- Dynamic form based on selected type
- Filter builder with AND/OR grouping
- "Save" button

**Settings Tab:**
- Re-enrollment toggle with options
- Unenrollment criteria builder
- Suppression list selector
- Timing settings (execute when, timezone)

### 11.5 Action Configuration Panel

**Panel Position:** Left side, 400px wide
**Header:** Action type icon + name, close button
**Content:** Dynamic form based on action type

Example for "Send Email":
- Template selector (dropdown with preview)
- Personalization tokens info
- Send time options
- "Save" button

Example for "If/Then Branch":
- Branch name input
- Filter builder (property, operator, value)
- "Add branch" button
- Branch list with reorder handles

---

## 12. User Flow Diagrams

### 12.1 Creating a New Workflow

```
[Start]
  |
  v
[Click "+ Create Workflow"]
  |
  v
[Select Object Type] --> Contact / Deal / Company / Ticket
  |
  v
[Choose Template or Scratch] --> [Template] --> [Select template] --> [Customize]
  |                                                                       |
  v                                                                       v
[Enter Name and Description]  <------------------------------------------+
  |
  v
[Workflow Editor Opens]
  |
  v
[Configure Enrollment Trigger]
  |
  v
[Add First Action via "+" button]
  |
  v
[Select action type from panel]
  |
  v
[Configure action details]
  |
  v
[Add more actions / branches as needed]
  |
  v
[Click "Review and Publish"]
  |
  v
[System validates workflow]
  |
  +-- [Errors found?] --YES--> [Show errors, return to editor]
  |
  +-- [No errors] --> [Show summary + enrollment estimate]
  |
  v
[Click "Turn On Workflow"]
  |
  v
[Workflow is ACTIVE]
  |
  v
[End]
```

### 12.2 Record Enrollment and Execution Flow

```
[Record meets trigger criteria]
  |
  v
[Check: Already enrolled?]
  |
  +-- YES --> [Re-enrollment enabled?]
  |              |
  |              +-- NO  --> [Skip - do not enroll]
  |              +-- YES --> [Re-enroll]
  |
  +-- NO --> [Enroll record]
  |
  v
[Check: Suppression list?]
  |
  +-- YES --> [Skip - do not enroll]
  +-- NO  --> [Continue]
  |
  v
[Execute Step 1]
  |
  v
[Step Type?]
  |
  +-- [Action] --> [Execute action] --> [Log result] --> [Next step]
  |
  +-- [Delay] --> [Schedule wake-up] --> [Wait...] --> [Next step]
  |
  +-- [Branch] --> [Evaluate conditions]
  |                  |
  |                  +-- [Branch 1 matched] --> [Follow Branch 1 path]
  |                  +-- [Branch 2 matched] --> [Follow Branch 2 path]
  |                  +-- [None matched]     --> [Follow "None met" path]
  |
  v
[More steps?]
  |
  +-- YES --> [Execute next step] (loop back)
  +-- NO  --> [Mark execution as COMPLETED]
  |
  v
[Check: Unenrollment criteria met at any point?]
  +-- YES --> [Remove from workflow, mark CANCELLED]
  |
  v
[End]
```

### 12.3 Workflow Monitoring Flow (Admin)

```
[Start: Open Workflow List]
  |
  v
[View workflow statuses and metrics]
  |
  v
[Notice error badge on "Invoice Reminder" workflow]
  |
  v
[Click workflow name]
  |
  v
[Workflow Details Page loads]
  |
  v
[Click "Issues" tab]
  |
  v
[See: "24 records failed at Send Email step"]
  |
  v
[Click "Fix Now"]
  |
  v
[Editor opens, scrolled to error step]
  |
  v
[Step highlighted in red with error message]
  |
  v
[Fix the issue (e.g., select new email template)]
  |
  v
[Save changes]
  |
  v
[Click "Retry failed records" or wait for new enrollments]
  |
  v
[Monitor via Performance tab]
  |
  v
[End]
```

### 12.4 Mobile Quick-Action Flow

```
[Open F-CORE Mobile App]
  |
  v
[Navigate to Automation section]
  |
  v
[See list of workflows with status indicators]
  |
  v
[Notice "Invoice Reminder" has red error badge]
  |
  v
[Tap workflow card]
  |
  v
[See metrics: Enrolled, Completed, Errored]
  |
  v
[See recent activity feed with error details]
  |
  v
[Option A: Toggle OFF to stop enrollment]
[Option B: Tap "View on Desktop" for full editing]
  |
  v
[Receive push notification when fixed workflow resumes]
  |
  v
[End]
```

---

## Appendix A: Research Sources

1. HubSpot Knowledge Base - Workflow Creation: https://knowledge.hubspot.com/workflows/create-workflows
2. HubSpot Knowledge Base - Enrollment Triggers: https://knowledge.hubspot.com/workflows/set-your-workflow-enrollment-triggers
3. HubSpot Knowledge Base - If/Then Branches: https://knowledge.hubspot.com/workflows/use-if-then-branches-in-workflows
4. HubSpot Knowledge Base - Workflow Details Page: https://knowledge.hubspot.com/workflows/understand-your-workflow-details-page
5. HubSpot Knowledge Base - Re-enrollment Triggers: https://knowledge.hubspot.com/workflows/add-re-enrollment-triggers-to-a-workflow
6. HubSpot Knowledge Base - Workflow Settings: https://knowledge.hubspot.com/workflows/manage-your-workflow-settings
7. Salesforce Flow Builder Best Practices: https://www.getclientell.com/blogs/salesforce-flow-builder-best-practices-and-pitfalls
8. Salesforce Summer '25 Flow Features: https://admin.salesforce.com/blog/2025/accelerate-automation-with-summer-25-flow-features-be-release-ready
9. Salesforce Flow Complete Guide 2026: https://www.default.com/post/salesforce-flow-building-visual-workflows-in-salesforce
10. n8n Editor UI Documentation: https://docs.n8n.io/courses/level-one/chapter-1/
11. n8n Focus Panel Experiment: https://community.n8n.io/t/help-us-test-some-canvas-improvements/201703
12. Pipedrive If/Else Conditions: https://www.pipedrive.com/en/blog/if-else-conditions
13. Temporal Workflow Timeline View: https://temporal.io/blog/lets-visualize-a-workflow
14. Temporal Workflow Exploration UI: https://temporal.io/blog/the-dark-magic-of-workflow-exploration
15. Adobe Journey Optimizer Dry Run: https://experienceleague.adobe.com/en/docs/journey-optimizer/using/orchestrate-journeys/create-journey/journey-dry-run
16. React Flow (xyflow): https://reactflow.dev/
17. React Flow UI Components: https://reactflow.dev/ui
18. React Flow Workflow Editor Template: https://reactflow.dev/ui/templates/workflow-editor
19. Synergy Codes - Accessibility-First Workflow Builder: https://www.synergycodes.com/blog/accessibility-first-workflow-for-inclusive-data-visualization
20. Synergy Codes - State Management in React Flow: https://www.synergycodes.com/blog/state-management-in-react-flow
21. HubSpot Design Evolution Blog: https://product.hubspot.com/blog/designing-for-your-next-decade-growth
22. No-Code Workflow Automation Guide (WeWeb): https://www.weweb.io/blog/no-code-workflow-automation-complete-guide

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Enrollment** | The process of a record entering a workflow |
| **Re-enrollment** | Allowing a record to go through the workflow again |
| **Unenrollment** | Removing a record from a workflow before completion |
| **Suppression list** | A list of records that should never enter a workflow |
| **Branch** | A decision point that splits the flow into multiple paths |
| **Action** | A step that performs an operation (send email, update record) |
| **Trigger** | The condition that starts a workflow for a record |
| **Node** | A visual element on the canvas representing a step |
| **Edge/Connector** | A line connecting two nodes showing flow direction |
| **Canvas** | The visual workspace where the workflow is designed |
| **Minimap** | A small overview panel showing the entire workflow for navigation |
| **Dry run** | Executing a workflow without performing real actions |
| **Execution log** | A record of each step performed during a workflow run |
