# HubSpot UI vs F-CORE UI Survey

Date: 2026-02-16  
Scope: UI/UX patterns and interaction model (not backend parity)  
Sources: official HubSpot pages + current F-CORE codebase

## 1) HubSpot UI baseline (official sources)

1. Navigation model: top navigation + left sidebar
- HubSpot setup docs show users opening Settings from the top nav, then using the left sidebar inside settings/workspace configuration.
- Sources:
  - https://knowledge.hubspot.com/account-management/set-your-account-defaults
  - https://knowledge.hubspot.com/account/get-started-with-sales-workspace

2. Dashboard customization is widget-driven and layout-edit oriented
- HubSpot docs describe adding/removing dashboard reports and customizing dashboard layout.
- Sources:
  - https://knowledge.hubspot.com/reports/customize-your-dashboard

3. Deals board is stage-column based
- HubSpot docs describe tracking deals in board view with deal stages.
- Source:
  - https://knowledge.hubspot.com/object-settings/track-and-manage-your-deals-in-a-board-view

4. Reporting UX includes AI-assisted creation
- HubSpot docs describe creating reports with AI from natural language prompts.
- Source:
  - https://knowledge.hubspot.com/reports/create-a-report-with-ai

5. Workspace-level personalization and defaults
- Account-level defaults include homepage/language/date and role-style settings.
- Source:
  - https://knowledge.hubspot.com/account-management/set-your-account-defaults

## 2) F-CORE UI current state (local evidence)

1. Layout shell: sidebar + top workspace header + content canvas
- Sidebar shell now includes a sticky top workspace header with global search, create menu, notifications/profile actions.
- Evidence:
  - `src/app/(dashboard)/layout.tsx:11`
  - `src/app/(dashboard)/layout.tsx:14`
  - `src/components/dashboard/AppHeader.tsx:99`

2. Very broad module navigation
- Sidebar already covers Sales/Service/Marketing/Content/Data/Commerce/AI routes.
- Evidence:
  - `src/components/dashboard/AppSidebar.tsx:68`
  - `src/components/dashboard/AppSidebar.tsx:269`

3. Search UX: command palette + top-bar trigger
- Cross-entity quick search overlay with grouped results, and top-bar search trigger opens the palette.
- Evidence:
  - `src/components/crm/CommandPalette.tsx:55`
  - `src/components/crm/CommandPalette.tsx:74`
  - `src/components/dashboard/AppHeader.tsx:113`
  - `src/components/crm/commandPaletteEvents.ts:1`

4. Deals UI includes board/list toggle
- Stage columns + card layout + list mode.
- Evidence:
  - `src/app/(dashboard)/deals/DealsBoard.tsx:204`
  - `src/app/(dashboard)/deals/DealsBoard.tsx:262`
  - `src/app/(dashboard)/deals/DealsBoard.tsx:299`

5. Dashboard widgets support add/remove, drag, resize, and persisted layout
- Widgets support direct drag/resize on canvas and persist layout via batch PATCH API.
- Evidence:
  - `src/app/(dashboard)/reports/dashboards/[id]/page.tsx:406`
  - `src/app/(dashboard)/reports/dashboards/[id]/page.tsx:432`
  - `src/app/(dashboard)/reports/dashboards/[id]/page.tsx:616`
  - `src/app/(dashboard)/reports/dashboards/[id]/page.tsx:701`
  - `src/app/api/dashboards/[id]/widgets/route.ts:96`

6. I18n UX is implemented with 3 locales
- English/Vietnamese/German switcher inside sidebar.
- Evidence:
  - `src/i18n/config.ts:1`
  - `src/components/i18n/LanguageSwitcher.tsx:13`
  - `src/components/dashboard/AppSidebar.tsx:377`

7. Design system direction is tokenized and HubSpot-inspired
- Global tokens and color variables are declared at theme layer.
- Evidence:
  - `src/app/globals.css:4`
  - `src/app/globals.css:9`

## 3) UI comparison matrix (HubSpot vs F-CORE)

| UI area | HubSpot pattern | F-CORE status | Assessment |
|---|---|---|---|
| Global navigation | Top nav + contextual sidebars | Sidebar shell + sticky top workspace header (`src/app/(dashboard)/layout.tsx:14`, `src/components/dashboard/AppHeader.tsx:99`) | Strong |
| Information architecture breadth | Multi-hub navigation | Very broad module map in one sidebar (`src/components/dashboard/AppSidebar.tsx:68`) | Strong |
| Deals workspace | Kanban board by stages | Board + list toggle implemented (`src/app/(dashboard)/deals/DealsBoard.tsx:204`) | Strong |
| Dashboard personalization | Widget layout customization (docs-driven) | Add/remove + drag/resize + persisted layout (`src/app/(dashboard)/reports/dashboards/[id]/page.tsx:432`) | Strong |
| Search interaction | Global object search and command workflows | Command palette + top-bar trigger (`src/components/dashboard/AppHeader.tsx:113`) | Strong |
| AI in analytics/reporting UI | Report creation with AI prompt | Dedicated AI area exists, but no equivalent "create report with AI" UX in reports page path shown | Partial |
| Omnichannel service inbox UI | Unified conversation channels | Multi-channel filter model exists in UI (`src/app/(dashboard)/service/inbox/page.tsx:18`) | Partial |
| Localization UX | Account-level defaults and language settings | 3-language live switcher in sidebar (`src/i18n/config.ts:1`) | Strong (scope-limited) |

## 4) Key UI gaps to close next

1. Add "create report with AI" flow in reports UI.
- This is a clear UX differentiator in HubSpot’s reporting experience.

2. Improve contextual workspace headers/toolbars per hub.
- Some pages already have strong local headers, but no unified cross-hub header pattern.

3. Continue service inbox UX depth (thread actions, channel-specific controls).
- Channel filter set exists, but deeper per-channel interaction parity is still limited.

4. Add account-defaults settings parity surface.
- HubSpot exposes homepage/language/date defaults and workspace-level defaults in account settings; F-CORE currently has language switcher but not full defaults panel parity.

## 5) Overall UI parity estimate (survey-level)

- UI breadth parity: 80-90%
- Interaction depth parity: 65-75%
- Enterprise UX polish parity: 55-65%

Inference note: these estimates are qualitative, based on official HubSpot documentation pages and direct code evidence in current F-CORE.

## 6) Validation snapshot for latest UI uplift

- Build: `npm run build` passed on 2026-02-16.
- E2E: `npx playwright test --reporter=line` passed (195/195) on 2026-02-16.
- Production deploy: `https://hubspot-demo-sandy.vercel.app` (deployment `dpl_33Nuy18SzWNPnBdzrvd5fE2B9CGA`, status Ready).
