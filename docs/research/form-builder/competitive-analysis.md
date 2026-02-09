# Form Builder Competitive Analysis

> **Project:** F-CORE (HubSpot CRM Clone)
> **Date:** 2026-02-09
> **Author:** F-CORE Competitive Analysis Team
> **Status:** Complete
> **Sources:** Tavily search, product pages, review sites (G2, Capterra, TrustRadius), comparison guides

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Competitor Overview](#2-competitor-overview)
3. [Form Types](#3-form-types)
4. [Field Types](#4-field-types)
5. [Form Builder UX](#5-form-builder-ux)
6. [Conditional Logic](#6-conditional-logic)
7. [Multi-step / Multi-page Forms](#7-multi-step--multi-page-forms)
8. [Submission Management](#8-submission-management)
9. [Integrations](#9-integrations)
10. [Embed Options](#10-embed-options)
11. [Analytics](#11-analytics)
12. [Compliance & Security](#12-compliance--security)
13. [Styling & Theming](#13-styling--theming)
14. [Pricing Comparison](#14-pricing-comparison)
15. [Feature Matrix](#15-feature-matrix)
16. [Strategic Recommendations for F-CORE](#16-strategic-recommendations-for-f-core)

---

## 1. Executive Summary

The form builder market in 2026 is mature and highly competitive. Six major players serve different segments of the market, from free no-frills solutions (Google Forms) to enterprise-grade workflow automation platforms (Formstack). The key differentiators are:

- **CRM Integration Depth**: HubSpot leads with native CRM integration and progressive profiling
- **User Experience**: Typeform dominates with conversational, one-question-at-a-time UX
- **Feature Breadth**: JotForm offers the widest feature set with 40+ field types and 20,000+ templates
- **Simplicity & Value**: Tally delivers a Notion-like experience with a generous free tier
- **Enterprise Compliance**: Formstack excels in regulated industries (HIPAA, GDPR, SOC 2)
- **Accessibility**: Google Forms remains the simplest, most accessible free option

For F-CORE, the primary opportunity is building a form builder that combines HubSpot's CRM-native approach with modern UX patterns (block-based editing, conversational modes) while keeping the free tier generous like Tally.

---

## 2. Competitor Overview

### 2.1 HubSpot Forms

| Attribute | Details |
|-----------|---------|
| **Company** | HubSpot Inc. |
| **Focus** | CRM-integrated lead capture |
| **Users** | 200,000+ companies |
| **Free Tier** | Yes (part of HubSpot Free CRM) |
| **Starting Price** | Free; Marketing Hub Starter $20/mo |
| **Key Differentiator** | Progressive profiling, native CRM integration |

### 2.2 Typeform

| Attribute | Details |
|-----------|---------|
| **Company** | Typeform SL (Barcelona) |
| **Focus** | Conversational, engaging data collection |
| **Users** | Millions globally |
| **Free Tier** | Yes (10 responses/month, 1 user) |
| **Starting Price** | $29/mo (Basic) |
| **Key Differentiator** | One-question-at-a-time UX, 3.5x higher completion rates |

### 2.3 JotForm

| Attribute | Details |
|-----------|---------|
| **Company** | Jotform Inc. |
| **Focus** | Full-featured form builder for businesses |
| **Users** | 35+ million worldwide |
| **Free Tier** | Yes (5 forms, 100 submissions/month) |
| **Starting Price** | $39/mo (Bronze) |
| **Key Differentiator** | 20,000+ templates, 40+ field types, 150+ integrations |

### 2.4 Google Forms

| Attribute | Details |
|-----------|---------|
| **Company** | Google LLC |
| **Focus** | Simple, free, no-frills form creation |
| **Users** | Hundreds of millions (Google Workspace) |
| **Free Tier** | Yes (unlimited forms, unlimited responses) |
| **Starting Price** | Free; Workspace from $7.20/user/mo |
| **Key Differentiator** | Completely free, Google ecosystem integration |

### 2.5 Tally

| Attribute | Details |
|-----------|---------|
| **Company** | Tally (Belgium) |
| **Focus** | Notion-like simplicity for form building |
| **Users** | Growing rapidly among startups/creators |
| **Free Tier** | Yes (unlimited forms AND submissions) |
| **Starting Price** | $29/mo (Pro) |
| **Key Differentiator** | Most generous free tier, block-based Notion-style editor |

### 2.6 Formstack

| Attribute | Details |
|-----------|---------|
| **Company** | Formstack (Indianapolis) |
| **Focus** | Enterprise forms with workflow automation |
| **Users** | 27,000+ organizations |
| **Free Tier** | 14-day trial only |
| **Starting Price** | $83/mo (Forms plan) |
| **Key Differentiator** | HIPAA/GDPR/SOC 2 compliance, workflow automation, document generation |

---

## 3. Form Types

| Form Type | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|-----------|---------|----------|---------|--------------|-------|-----------|
| Contact Forms | Native | Yes | Yes | Yes | Yes | Yes |
| Surveys | Yes | Excellent | Yes | Yes | Yes | Yes |
| Registration | Yes | Yes | Yes | Yes | Yes | Yes |
| Feedback / NPS | Yes | Excellent | Yes | Basic | Yes | Yes |
| Lead Capture | Excellent | Yes | Yes | Basic | Yes | Yes |
| Payment Forms | No (via integrations) | Yes (Stripe) | Yes (30+ gateways) | No | Yes (Stripe) | Yes (PCI compliant) |
| Quiz / Assessment | No | Yes (4 modes) | Yes | Yes (quiz mode) | Basic | No |
| Order Forms | Basic | Basic | Excellent | No | Basic | Yes |
| Application Forms | Yes | Yes | Yes | Yes | Yes | Yes |
| Booking / Scheduling | No | No | Yes (calendar widget) | No | No | Yes (via workflows) |
| E-Signature Collection | No | No | Yes | No | Yes | Yes (Formstack Sign) |

### Analysis

- **HubSpot** excels at lead capture and CRM-connected forms but lacks native payment collection and quiz/assessment modes
- **Typeform** introduced 4 form modes in 2025: Universal, Lead Qualification, Knowledge Quiz, and Match Quiz -- a sophisticated approach to form purpose
- **JotForm** has the broadest coverage, including native payment with 30+ gateways, appointment booking with calendar sync, and e-signature support
- **Google Forms** is limited to surveys, quizzes, and basic data collection -- no payments, no e-signatures
- **Tally** covers most essentials including payments (Stripe) and e-signatures, impressive for a free tool
- **Formstack** focuses on enterprise use cases: compliance-heavy forms, document generation, and workflow automation

---

## 4. Field Types

### 4.1 Comprehensive Field Type Matrix

| Field Type | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|-----------|---------|----------|---------|--------------|-------|-----------|
| **Basic Input** | | | | | | |
| Single-line text | Yes | Yes | Yes | Yes | Yes | Yes |
| Multi-line text / Paragraph | Yes | Yes | Yes | Yes | Yes | Yes |
| Email | Yes | Yes | Yes | Via validation | Yes | Yes |
| Number | Yes | Yes | Yes | Via validation | Yes | Yes |
| Phone | Yes | Yes | Yes | Via validation | Yes | Yes |
| URL | Yes | Yes | Yes | Via validation | Yes | Yes |
| **Selection** | | | | | | |
| Dropdown / Select | Yes | Yes | Yes | Yes | Yes | Yes |
| Radio buttons | Yes | Yes | Yes | Yes (Multiple choice) | Yes | Yes |
| Checkbox | Yes | Yes | Yes | Yes | Yes | Yes |
| Multi-select | Yes | Yes | Yes | Yes (Checkboxes) | Yes | Yes |
| Image choice | No | Yes | Yes (widget) | No | No | No |
| **Date & Time** | | | | | | |
| Date picker | Yes | Yes | Yes | Yes | Yes | Yes |
| Time picker | Basic | Yes | Yes | Yes | Yes | Yes |
| Date-time combined | Basic | Yes | Yes | Separate fields | Yes | Yes |
| **File & Media** | | | | | | |
| File upload | Yes | Yes (paid) | Yes (100MB free) | Yes (limited) | Yes (10MB) | Yes |
| Image upload | Basic | Yes | Yes | Yes | Yes | Yes |
| Video upload | No | No | Yes (widget) | No | No | No |
| **Rating & Scale** | | | | | | |
| Star rating | No | Yes | Yes | No | Yes | No |
| NPS (0-10) | No | Yes | Yes (widget) | Via linear scale | Yes | No |
| Linear scale | No | Yes | Yes | Yes (1-10) | Yes | Yes |
| Matrix / Grid | No | No | Yes | Yes | No | Yes |
| Slider | No | Yes | Yes | No | Yes | No |
| Ranking / Ordering | No | Yes | Yes | No | Yes | No |
| **Advanced** | | | | | | |
| Hidden fields | Yes | Yes | Yes | No | Yes | Yes |
| Calculated fields | No | Yes | Yes | No | Yes | Yes |
| Payment field | No | Yes (Stripe) | Yes (30+ gateways) | No | Yes (Stripe) | Yes (PCI) |
| Signature | No | No | Yes | No | Yes | Yes |
| CAPTCHA | Yes (reCAPTCHA) | No | Yes (reCAPTCHA) | No | No | Yes (invisible reCAPTCHA) |
| Address / Location | Yes | Yes | Yes | No | No | Yes |
| Table / Grid input | No | No | Yes | Yes (grid) | No | Yes |
| Password | No | No | No | No | No | No |

### 4.2 Field Count Summary

| Platform | Approximate Field Types |
|----------|------------------------|
| JotForm | 40+ field types + 300 widgets |
| Formstack | 30+ field types |
| Typeform | 25+ question types |
| Tally | 20+ block types |
| HubSpot | 15+ field types (tied to CRM properties) |
| Google Forms | 9 question types |

### Analysis

- **JotForm** leads with 40+ field types plus 300 widgets for extending functionality (appointment scheduling, e-signatures, screen recording, etc.)
- **HubSpot's** field types are inherently tied to CRM properties, which is both a strength (data consistency) and a limitation (less flexibility)
- **Google Forms** has the fewest options with only 9 question types, though add-ons can extend functionality
- **Tally** provides a surprisingly rich set of field types for a free tool, including calculated fields, ratings, and e-signatures
- **Formstack** offers strong coverage for enterprise needs, including PCI-compliant payment fields and HIPAA-ready data collection

---

## 5. Form Builder UX

### 5.1 Builder Paradigm Comparison

| Platform | Builder Type | Description |
|----------|-------------|-------------|
| **HubSpot** | Drag-and-drop panel | Left panel with fields; drag to form canvas. WYSIWYG editor. Field configuration in right panel. |
| **Typeform** | Block-based sequential | Add questions sequentially. One-question-at-a-time preview. Visual logic builder. AI-assisted form creation. |
| **JotForm** | Drag-and-drop (2 modes) | Classic mode: all fields on one page. Card mode: one question at a time. Extensive right-panel configuration. |
| **Google Forms** | Linear sequential | Add questions one after another. Minimal configuration options. Section-based organization. |
| **Tally** | Block-based (Notion-style) | Type questions like a document. Slash commands to add blocks. Inline configuration. Most intuitive of all. |
| **Formstack** | Drag-and-drop enterprise | Full drag-and-drop with field library. Section-based organization. Advanced configuration sidebar. |

### 5.2 UX Feature Comparison

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Drag-and-drop | Yes | No | Yes | No | No (block-based) | Yes |
| Real-time preview | Yes | Yes | Yes | Yes | Yes (inline) | Yes |
| Mobile preview | Yes | Yes | Yes | Basic | Yes | Yes |
| Undo/Redo | Yes | Yes | Yes | Yes | Yes | Yes |
| Templates | Limited | 3,000+ | 20,000+ | ~20 | Community templates | 40+ |
| AI form builder | No | Yes (AI question generation) | Yes (AI agent) | Yes (Gemini) | No | Yes (AI-powered) |
| Field search | Yes | Yes | Yes | No | Via slash commands | Yes |
| Bulk edit | No | No | No | No | No | No |
| Version history | No | Yes (paid) | No | Yes (Google Drive) | No | No |
| Collaboration | Via team permissions | Workspaces (paid) | Enterprise only | Native (Google) | Pro plan | Team features |

### 5.3 Time-to-First-Form Benchmark (estimated)

| Platform | Simple Contact Form | Complex Multi-step Form |
|----------|-------------------|------------------------|
| Tally | ~2 minutes | ~10 minutes |
| Google Forms | ~3 minutes | ~15 minutes |
| Typeform | ~5 minutes | ~15 minutes |
| JotForm | ~5 minutes | ~20 minutes |
| HubSpot | ~5 minutes | ~20 minutes |
| Formstack | ~10 minutes | ~30 minutes |

### Analysis

- **Tally** has the fastest time-to-form thanks to its Notion-like interface -- users can literally type their questions as if writing a document
- **JotForm** offers the most flexibility with two modes (Classic and Card), but the builder can feel overwhelming with its many options
- **Typeform's** AI-powered form builder is particularly strong for lead qualification and quiz generation
- **Google Forms** added Gemini AI in 2025 for question suggestions and response summarization
- **HubSpot's** builder is solid but tightly coupled to CRM properties, which can slow down form creation for ad-hoc use cases

---

## 6. Conditional Logic

### 6.1 Logic Capabilities Matrix

| Capability | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|-----------|---------|----------|---------|--------------|-------|-----------|
| Show/Hide fields | Yes | Yes | Yes | No (section-only) | Yes | Yes |
| Show/Hide sections/steps | Yes | Yes | Yes | Yes (section-based) | Yes | Yes |
| Skip logic | Yes | Yes (Logic Jumps) | Yes | Yes (Go to section) | Yes | Yes |
| Branching paths | Yes | Yes (visual builder) | Yes | Basic (section-based) | Basic | Yes |
| Calculated values | No | Yes | Yes | No | Yes | Yes |
| Conditional redirects | Yes | Yes | Yes | No | Yes | Yes |
| Conditional email notifications | Basic | No | Yes | No | Yes | Yes |
| Conditional pricing | No | Yes | Yes | No | Yes | Yes (discount codes) |
| Multi-condition rules (AND/OR) | Yes | Yes (AND/OR) | Yes | No | Basic | Yes |
| Nested conditions | Basic | Yes | Yes | No | No | Yes |
| Logic on field values | Yes (enumeration only) | Yes (any field) | Yes (any field) | Dropdown/MC only | Yes (most fields) | Yes (any field) |

### 6.2 Logic Builder Interface

| Platform | Interface Type | Ease of Use |
|----------|---------------|-------------|
| **HubSpot** | Tab-based rules per field | Moderate -- rules defined on each field separately |
| **Typeform** | Visual flow builder | Excellent -- visual graph showing all logic paths |
| **JotForm** | Centralized conditions panel | Good -- all rules in Settings > Conditions |
| **Google Forms** | Section-level routing | Basic -- "Go to section based on answer" per question |
| **Tally** | Inline conditional blocks | Good -- add logic blocks directly in the form flow |
| **Formstack** | Rule builder sidebar | Good -- if/then rules with preview testing |

### Analysis

- **Google Forms** has the most limited conditional logic: only section-level routing, only for Multiple Choice and Dropdown fields, and no question-level show/hide
- **Typeform's** visual logic builder is the most intuitive -- you can see the entire branching tree and understand complex flows at a glance
- **JotForm** has the deepest conditional logic with support for calculated fields, conditional emails, multi-layered rules, and automated actions
- **HubSpot** added conditional logic for form steps in 2025/2026, improving its previously basic implementation; but it still only works with enumeration properties (dropdowns, radio buttons)
- **Tally** provides conditional logic for free, which is a strong differentiator against competitors that gate this behind paid plans
- **Formstack** offers conditional logic with a "preview" mode (fixed in Sept 2025) allowing testing before publishing

---

## 7. Multi-step / Multi-page Forms

### 7.1 Multi-step Capabilities

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Multi-page forms | Yes | Inherent (1 Q per page) | Yes | Yes (Sections) | Yes (Page breaks) | Yes |
| Progress bar | Yes | Yes (configurable) | Yes | No | Yes | Yes |
| Step navigation (back/forward) | Yes | Yes | Yes | Yes (between sections) | Yes | Yes |
| Step numbers / labels | Yes | Optional | Yes | Section headers only | Basic | Yes |
| Conditional step visibility | Yes (new 2025) | Yes | Yes | No | Basic | Yes |
| Save and resume | No | No | No | No | Yes (partial submissions) | Yes |
| Step-level validation | Yes | Yes | Yes | No | Yes | Yes |
| Animated transitions | No | Yes (signature UX) | Card mode only | No | No | No |

### 7.2 Progress Indicator Styles

| Platform | Available Styles |
|----------|-----------------|
| HubSpot | Numbered steps, progress bar |
| Typeform | Percentage bar, question counter |
| JotForm | Progress bar, step numbers, percentage |
| Google Forms | None (section headers only) |
| Tally | Progress bar |
| Formstack | Progress bar, step numbers, percentage |

### Analysis

- **Typeform** inherently provides multi-step via one-question-at-a-time, with animated transitions and a polished experience
- **JotForm** offers the most flexible multi-page configuration with both Classic (all-on-one-page with page breaks) and Card (one-at-a-time) modes
- **HubSpot** added conditional step visibility in 2025/2026, allowing showing/hiding entire form steps based on prior answers
- **Google Forms** multi-step is cumbersome: you must manually create sections and manage routing between them
- **Tally's** page breaks are simple but effective, and partial submissions are available on the Pro plan
- **Formstack's** "Save and Resume" feature is critical for long enterprise forms -- users can return and complete later

---

## 8. Submission Management

### 8.1 Submission Handling Capabilities

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Submission list / inbox | Yes (CRM contacts) | Yes (Results) | Yes (Inbox + Tables) | Yes (Responses tab) | Yes | Yes |
| Individual response view | Yes (contact record) | Yes | Yes | Yes | Yes | Yes |
| Export CSV/Excel | Yes | Yes (XLSX/CSV) | Yes | Yes (Google Sheets) | Yes | Yes (CSV/Excel/PDF) |
| Export PDF | No | No | Yes (PDF generation) | No | No | Yes |
| Email notifications | Yes | Yes (paid) | Yes | Yes | Yes (Pro) | Yes |
| Auto-responder emails | Yes (via workflows) | Yes (paid) | Yes (built-in) | No | No | Yes |
| Submission editing | No | No | No | Yes (if allowed) | No | No |
| Partial submissions | No | No | No | No | Yes (Pro) | Yes |
| Spam filtering | Yes (built-in) | Basic | Yes (reCAPTCHA) | No | Yes (duplicate prevention) | Yes (invisible reCAPTCHA) |
| Submission API | Yes (HubSpot API) | Yes | Yes | No (Sheets API) | Yes | Yes |
| Data retention controls | Basic | Yes (Business plan auto-delete) | Yes | Via Google admin | No | Yes (auto-delete feature) |
| Webhook on submission | Yes | Yes | Yes | No (via Apps Script) | Yes | Yes |

### 8.2 Data Routing & Automation

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Create/update CRM records | Native | Via integrations | Via integrations | No | No | Via integrations |
| Trigger email sequences | Yes (workflows) | Via integrations | Basic auto-responder | No | No | Yes (workflows) |
| Assign to team member | Yes (lead routing) | No | Yes (approval workflows) | No | No | Yes (dynamic task assignment) |
| Lead scoring on submission | Yes | No | No | No | No | No |
| Progressive profiling | Yes (unique to HubSpot) | No | No | No | No | No |

### Analysis

- **HubSpot** uniquely combines form submissions with CRM contact records, lead scoring, and workflow automation -- this is the gold standard for CRM-integrated form management
- **HubSpot's progressive profiling** is a standout feature: returning visitors see different fields based on what they have already provided, gradually building a complete profile
- **JotForm** offers the most comprehensive standalone submission management with Tables (spreadsheet view), Inbox (email-like view), PDF generation, and approval workflows
- **Formstack** excels in enterprise data management with data routing, dynamic task assignment, and auto-delete for compliance
- **Google Forms** has the simplest management -- responses go to a tab or Google Sheets, with minimal filtering or automation
- **Tally's** partial submissions feature (Pro) is valuable for recovering incomplete responses

---

## 9. Integrations

### 9.1 Integration Ecosystem Size

| Platform | Native Integrations | Via Zapier/Make | Webhooks | API |
|----------|-------------------|-----------------|----------|-----|
| HubSpot | 1,500+ (App Marketplace) | Yes | Yes | Yes (extensive) |
| Typeform | 120+ native | 3,000+ via Zapier | Yes | Yes |
| JotForm | 150+ native | Yes (Zapier, Make, IFTTT) | Yes | Yes |
| Google Forms | Google Workspace only | Via Zapier/add-ons | Via Apps Script | Limited |
| Tally | 15+ native | Yes (Zapier, Make, Pipedream) | Yes | Yes (free) |
| Formstack | 250+ native | Yes | Yes | Yes |

### 9.2 Key Integration Categories

| Category | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|----------|---------|----------|---------|--------------|-------|-----------|
| **CRM** | Native | HubSpot, Salesforce | HubSpot, Salesforce, Zoho, Pipedrive | No | No | HubSpot, Salesforce |
| **Email Marketing** | Native | Mailchimp, ActiveCampaign | Mailchimp, Constant Contact, ActiveCampaign | No | No | Mailchimp, Constant Contact |
| **Spreadsheets** | Google Sheets | Google Sheets, Notion | Google Sheets | Google Sheets (native) | Google Sheets, Notion, Airtable | Google Sheets |
| **Project Management** | Asana, Monday | Monday, Notion | Monday, Asana, Trello | No | Linear, Notion | Monday, Asana |
| **Payment** | Stripe (via HubSpot Payments) | Stripe | Stripe, PayPal, Square, 30+ more | No | Stripe | Stripe, PayPal, Authorize.Net |
| **Communication** | Slack, Teams | Slack | Slack, Teams | No | Slack | Slack, Teams |
| **Storage** | No | No | Google Drive, Dropbox, OneDrive | Google Drive | No | Google Drive, Dropbox, S3, SFTP |
| **Analytics** | Native | Google Analytics, Meta Pixel | Google Analytics | Google Analytics | Google Analytics, Meta Pixel | Google Analytics, Meta Pixel |

### Analysis

- **HubSpot** has the largest integration ecosystem through its App Marketplace (1,500+), but form integrations specifically revolve around the HubSpot ecosystem
- **Typeform** reaches 3,000+ tools when counting Zapier connections, with particularly strong Workflow Builder capabilities
- **JotForm** has the most diverse payment integrations with 30+ gateways including regional options
- **Google Forms** is effectively limited to Google Workspace; anything else requires Zapier or Apps Script
- **Tally** has fewer native integrations but covers essentials (Notion, Google Sheets, Airtable, Slack) and offers webhooks + API for free
- **Formstack** differentiates with enterprise storage integrations (S3, SFTP, SharePoint) and Salesforce-native solutions

---

## 10. Embed Options

### 10.1 Embed Type Comparison

| Embed Type | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|-----------|---------|----------|---------|--------------|-------|-----------|
| Inline / Standard embed | Yes | Yes | Yes (iframe + JS) | Yes (iframe) | Yes | Yes |
| Popup / Modal | Yes (pop-up forms) | Yes | Yes (lightbox) | No | Yes | Yes |
| Slide-in / Slider | Yes (slide-in) | Yes (Slider) | No | No | No | No |
| Full-page / Standalone | Yes | Yes (Full page) | Yes | Yes (link) | Yes | Yes |
| Popover / Side tab | No | Yes (Popover + Side tab) | No | No | No | No |
| Share link | Yes | Yes | Yes | Yes | Yes | Yes |
| QR Code | Yes | Yes | Yes | No | Yes | No |
| Exit-intent trigger | Yes | Yes (Popup) | No | No | No | No |
| Chat-bot style | Yes (HubSpot chatflows) | No | No | No | No | No |
| WordPress plugin | No (embed code) | No (embed code) | Yes (native plugin) | No | No | Yes (WordPress plugin) |
| Custom domain hosting | No | Enterprise only | Enterprise only | No | Pro plan | Yes |

### 10.2 Embed Configuration

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Custom width/height | Yes | Yes | Yes | Yes | Yes | Yes |
| Transparent background | No | Yes (0-100%) | No | No | Yes | No |
| Auto-resize | Yes | Yes | Yes | No | Yes | Yes |
| Lazy loading | Yes | Yes | No | No | Yes | No |
| Custom trigger button | Pop-up forms | Yes (Popover) | No | No | No | No |
| Seamless/borderless mode | Basic | Yes | No | No | Yes | Yes |

### Analysis

- **Typeform** offers the most diverse embed options: Standard, Full page, Popup, Slider, Popover, and Side tab -- with extensive customization per mode
- **HubSpot** provides strong embed options including pop-up forms, slide-in forms, and exit-intent triggers, plus chatbot-style forms via chatflows
- **JotForm** supports iframe, JavaScript embed, and lightbox popup, plus a native WordPress plugin
- **Google Forms** is limited to iframe embed or direct link sharing
- **Tally** offers clean embed options with transparent backgrounds and custom domains on the Pro plan
- **Formstack** provides subdomains and custom domains, plus WordPress plugin support

---

## 11. Analytics

### 11.1 Analytics Capabilities

| Metric / Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|-----------|---------|----------|---------|--------------|-------|-----------|
| Total submissions | Yes | Yes | Yes | Yes | Yes | Yes |
| Form views / impressions | Yes | Yes | Yes | No | Yes | Yes |
| Conversion rate | Yes | Yes | Yes | No | No | Yes |
| Completion rate | Yes | Yes | Yes | No | Yes | Yes |
| Field drop-off analysis | No | Yes (paid) | Basic | No | No | Yes (Field Bottleneck) |
| Time to complete | No | Yes | No | No | No | No |
| Response visualizations | Yes (automatic charts) | Basic charts | Yes (Report Builder) | Yes (auto pie/bar charts) | Basic | Yes (custom charts) |
| A/B testing | Landing pages only | No | No | No | No | Yes (Conversion Kit) |
| Source / UTM tracking | Yes (campaign tracking) | Yes (hidden fields) | Yes | No | Yes (hidden fields) | Yes (Campaign Tracking) |
| AI-powered insights | No | Yes (Smart Insights) | No | Yes (Gemini summaries) | No | No |
| Respondent metadata | Yes (CRM enriched) | Basic | Yes (IP, OS, browser, location) | Basic (email if required) | Basic | Yes (IP, OS, browser, location) |
| Real-time updates | Yes | Yes | Yes | Yes | Yes | Yes |
| Exportable reports | Yes | Yes | Yes (Report Builder) | Google Sheets | Yes | Yes |

### 11.2 Advanced Analytics Features

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Funnel visualization | No | Partial (drop-off) | No | No | No | No |
| Cohort analysis | No | No | No | No | No | No |
| Response segmentation | Yes (via CRM lists) | No | No | No | No | Basic |
| Cross-form analytics | Yes (dashboard) | No | Basic (Report Builder) | No | No | Yes |
| Integration with GA4 | Yes | Yes | Yes | No | Yes | Yes |
| Facebook Pixel / Meta | Yes | Yes (paid) | Yes | No | Yes | Yes |
| Attribution reporting | Yes (native) | Via hidden fields | No | No | No | Via Campaign Tracking |

### Analysis

- **HubSpot** has the strongest analytics when combined with its CRM: form performance data is enriched with contact lifecycle data, attribution, and revenue attribution
- **Typeform** offers the best field-level analytics with drop-off identification and time-to-complete metrics, plus AI-powered Smart Insights for open-ended response analysis
- **Formstack** leads in enterprise analytics with A/B testing (Conversion Kit), Field Bottleneck analysis, and detailed respondent metadata
- **JotForm** provides a Report Builder for creating visual summaries, but lacks dedicated A/B testing
- **Google Forms** added Gemini-powered response summarization in 2025, automatically generating insights from text responses
- **Tally** has minimal analytics -- basic submission counts and completion rates without deeper insights

---

## 12. Compliance & Security

### 12.1 Compliance Certifications

| Standard | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|----------|---------|----------|---------|--------------|-------|-----------|
| GDPR | Yes | Yes | Yes | Yes (via Google) | Yes | Yes |
| HIPAA | Enterprise only | Eligible plans | Yes (dedicated plans) | No (free tier) | No | Yes (Enterprise) |
| SOC 2 | Yes | Yes | Yes | Via Google Cloud | No | Yes |
| PCI DSS | HubSpot Payments | Via Stripe | Yes | No | Via Stripe | Yes |
| Section 508 / WCAG | Partial | Partial | Partial | Yes | Partial | Yes |
| ISO 27001 | Yes | Yes | No | Via Google Cloud | No | No |
| CCPA | Yes | Yes | Yes | Yes | Yes | Yes |

### 12.2 Security Features

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| SSL/TLS encryption | Yes | Yes | Yes | Yes | Yes | Yes |
| Data encryption at rest | Yes | Yes | Yes | Yes | Yes | Yes |
| reCAPTCHA | Yes | No | Yes (v2 + invisible) | No | No | Yes (invisible) |
| Honeypot fields | Yes | No | Yes | No | No | No |
| Rate limiting | Yes | Yes | No | No | Yes (duplicate prevention) | No |
| CAPTCHA alternatives | Cookie-based bot detection | No | Yes (hCaptcha) | No | Duplicate prevention | IP-based blocking |
| Two-factor auth (admin) | Yes | Yes | Yes | Yes (Google) | Yes | Yes |
| SSO/SAML | Enterprise | Enterprise | Enterprise | Google Workspace | No | Enterprise (SCIM) |
| Data retention policies | Configurable | Auto-delete (Business) | Configurable | Via Google admin | No | Yes (auto-delete) |
| Audit logs | Enterprise | No | Enterprise | Via Google admin | No | Yes |
| BAA available | Enterprise | On request | Yes | Yes (Workspace) | No | Yes |
| Data residency options | EU/US | EU/US | EU/US/Australia | Google regions | EU | US |

### 12.3 GDPR-Specific Features

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Consent checkboxes | Yes (configurable) | Yes | Yes | Manual (checkbox field) | Yes | Yes |
| Cookie consent integration | Yes | Yes | Yes | No | No | Yes |
| Right to erasure workflows | Yes (via GDPR tools) | Manual | Manual | Manual | Manual | Yes (automated workflows) |
| Data processing agreements | Yes | Yes | Yes | Yes | Yes | Yes |
| Privacy policy links | Yes (configurable) | Yes | Yes | No | Yes | Yes |

### Analysis

- **Formstack** leads in compliance with HIPAA, GDPR, SOC 2, PCI DSS, and Section 508 support -- purpose-built for regulated industries (healthcare, finance, government)
- **HubSpot** offers strong security at Enterprise tier with SSO/SAML, audit logs, and HIPAA eligibility
- **JotForm** provides HIPAA-compliant plans and comprehensive security features including reCAPTCHA, honeypot, and hCaptcha
- **Google Forms** inherits Google Cloud security but lacks form-specific security features (no CAPTCHA, no honeypot, no rate limiting)
- **Tally** has the weakest security posture -- no CAPTCHA, no HIPAA support, limited compliance certifications
- **Typeform** notably lacks CAPTCHA entirely, relying on its conversational UX as a natural bot deterrent (one question at a time makes bot submissions harder)

---

## 13. Styling & Theming

### 13.1 Design Customization

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| Pre-built themes | Limited | Yes | Yes | Yes (basic) | Yes | Yes |
| Custom colors | Yes | Yes | Yes | Yes (limited) | Yes | Yes |
| Custom fonts | Limited | Yes (paid) | Yes (custom CSS) | 4 font options | Pro plan | Yes |
| Logo / Brand image | Yes | Yes | Yes | Header image only | Yes | Yes |
| Background image | No | Yes | Yes | No | Yes | Yes |
| Custom CSS | No | Enterprise only | Yes (free) | No (add-ons only) | Pro plan | Yes |
| White-labeling | Enterprise | Paid (remove branding) | Paid | N/A (no branding) | Free (no branding) | Yes |
| Brand Kit / Design tokens | No | Yes (Brand Kit) | No | No | No | No |
| Dark mode | No | Yes | No | No | Yes | No |
| Custom thank-you page | Yes | Yes | Yes | Basic message only | Yes | Yes |
| Custom error messages | Basic | Yes | Yes | No | No | Yes |
| Layout options | Single column | Full-screen, side-by-side | Multiple layouts | Single column | Flexible | Single column |
| Responsive / Mobile | Yes | Excellent | Yes | Yes | Excellent | Yes |
| RTL language support | Yes | Partial | Yes | Yes | No | Yes |

### 13.2 Visual Customization Depth Rating

| Platform | Customization Depth | Notes |
|----------|-------------------|-------|
| **Typeform** | Deep | Brand Kit, transparent backgrounds, full-screen layouts, video backgrounds, custom fonts |
| **JotForm** | Deep | Custom CSS, multiple themes, layout options, brand colors |
| **Formstack** | Deep | Custom CSS, subdomains, white-labeling, custom branding |
| **Tally** | Moderate | Clean defaults, custom themes on Pro, CSS on Pro |
| **HubSpot** | Moderate | Limited to CRM branding, no custom CSS |
| **Google Forms** | Shallow | Basic colors, header image, 4 fonts -- very limited |

### Analysis

- **Typeform** has the most polished visual experience with Brand Kit, custom fonts, transparent backgrounds, and layout options that make forms feel like branded experiences
- **JotForm** offers the most accessible deep customization with free custom CSS access
- **Tally** stands out by offering no-branding on the free tier -- most competitors charge for branding removal
- **HubSpot** form styling is limited compared to standalone form builders; forms are designed to match HubSpot site themes rather than standalone branding
- **Google Forms** has the least customization: basic theme colors, a header image, and 4 font choices
- **Formstack** provides enterprise branding with subdomains, white-labeling, and custom CSS

---

## 14. Pricing Comparison

### 14.1 Free Tier Comparison

| Platform | Free Forms | Free Submissions/mo | Free Users | Branding Removed | Key Free Limitations |
|----------|-----------|---------------------|-----------|-------------------|---------------------|
| **Google Forms** | Unlimited | Unlimited | Unlimited (Google account) | N/A | Limited features, no payments, basic logic |
| **Tally** | Unlimited | Unlimited | 1 | Yes (no branding!) | No custom CSS, no team features |
| **HubSpot** | Unlimited | Unlimited | Unlimited | No (HubSpot branding) | Basic features, no progressive profiling |
| **JotForm** | 5 | 100 | 1 | No | Very limited capacity |
| **Typeform** | Unlimited | 10 | 1 | No | Extremely low response limit |
| **Formstack** | No free tier | N/A | N/A | N/A | 14-day trial only |

### 14.2 Paid Plan Comparison (Starting Prices, Monthly Billing)

| Tier | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|------|---------|----------|---------|--------------|-------|-----------|
| Entry | $20/mo (Starter) | $39/mo (Basic) | $39/mo (Bronze) | Free | $29/mo (Pro) | $99/mo (Forms) |
| Mid | $890/mo (Professional) | $79/mo (Plus) | $49/mo (Silver) | $7.20/user/mo | $29/mo (only tier) | $299/mo (Suite) |
| High | $3,600/mo (Enterprise) | $99/mo (Business) | $129/mo (Gold) | $14.40/user/mo | N/A | Custom (Enterprise) |
| Enterprise | Custom | Custom | Custom | Custom | N/A | Custom |

### 14.3 Cost Per Submission (approximate, entry-level paid)

| Platform | Monthly Cost | Submissions Included | Cost per Submission |
|----------|-------------|---------------------|-------------------|
| Google Forms | $0 | Unlimited | $0.00 |
| Tally | $0 (free) | Unlimited | $0.00 |
| HubSpot | $0 (free) | Unlimited | $0.00 |
| JotForm | $39/mo | 1,000 | $0.039 |
| Typeform | $39/mo | 100 | $0.39 |
| Formstack | $99/mo | 1,000/form | ~$0.10 |

### Analysis

- **Tally** offers the best value: unlimited forms and submissions for free, no branding, with conditional logic included
- **Google Forms** is the most cost-effective for high-volume, simple forms
- **Typeform** is the most expensive per submission -- at $0.39/submission on the Basic plan, it can be cost-prohibitive for high-volume use cases
- **HubSpot** is free for basic forms but the real value (progressive profiling, workflows, A/B testing) requires Marketing Hub Professional ($890/mo)
- **Formstack** is the most expensive entry point at $99/mo, reflecting its enterprise positioning

---

## 15. Feature Matrix

### Complete Feature Comparison

| Feature | HubSpot | Typeform | JotForm | Google Forms | Tally | Formstack |
|---------|---------|----------|---------|--------------|-------|-----------|
| **Builder** | | | | | | |
| Drag-and-drop | Yes | No | Yes | No | Block-based | Yes |
| Templates | Limited | 3,000+ | 20,000+ | ~20 | Community | 40+ |
| AI builder | No | Yes | Yes | Yes (Gemini) | No | Yes |
| **Logic** | | | | | | |
| Conditional show/hide | Yes | Yes | Yes | Section only | Yes | Yes |
| Branching | Yes | Yes | Yes | Basic | Basic | Yes |
| Calculations | No | Yes | Yes | No | Yes | Yes |
| **Forms** | | | | | | |
| Multi-step | Yes | Native | Yes | Sections | Page breaks | Yes |
| Save & resume | No | No | No | No | Pro | Yes |
| Progressive profiling | Yes | No | No | No | No | No |
| **Payments** | | | | | | |
| Payment collection | Integrations | Stripe | 30+ gateways | No | Stripe | PCI compliant |
| **Security** | | | | | | |
| CAPTCHA | reCAPTCHA | No | reCAPTCHA | No | No | Invisible reCAPTCHA |
| GDPR | Yes | Yes | Yes | Yes | Yes | Yes |
| HIPAA | Enterprise | On request | Yes | No | No | Enterprise |
| **Embed** | | | | | | |
| Inline | Yes | Yes | Yes | Yes | Yes | Yes |
| Popup | Yes | Yes | Yes | No | Yes | Yes |
| Slide-in | Yes | Yes | No | No | No | No |
| Standalone | Yes | Yes | Yes | Yes | Yes | Yes |
| **Analytics** | | | | | | |
| Conversion rate | Yes | Yes | Yes | No | No | Yes |
| Drop-off analysis | No | Yes | No | No | No | Yes |
| A/B testing | Landing pages | No | No | No | No | Yes |
| AI insights | No | Yes | No | Yes (Gemini) | No | No |
| **Integrations** | | | | | | |
| Native CRM | Yes (built-in) | Via integration | Via integration | No | No | Via integration |
| Webhooks | Yes | Yes | Yes | Via Script | Yes | Yes |
| API | Yes | Yes | Yes | Limited | Yes (free) | Yes |
| **Styling** | | | | | | |
| Custom CSS | No | Enterprise | Yes (free) | No | Pro | Yes |
| White-label | Enterprise | Paid | Paid | N/A | Free | Yes |
| Brand Kit | No | Yes | No | No | No | No |

---

## 16. Strategic Recommendations for F-CORE

### 16.1 Competitive Positioning

F-CORE should position its form builder as the **"CRM-native form builder with modern UX"**, combining the best of:

1. **HubSpot's CRM integration** -- forms that feed directly into contacts, deals, and workflows
2. **Tally's simplicity** -- block-based, Notion-like builder experience
3. **Typeform's engagement** -- optional conversational mode for higher completion rates
4. **JotForm's feature depth** -- comprehensive field types and integrations

### 16.2 Must-Have Features (MVP / Sprint Priority)

#### P0 -- Core (Ship First)
- Block-based form builder (Notion-style, inspired by Tally)
- Core field types: text, email, number, phone, dropdown, radio, checkbox, date, file upload, hidden
- Basic conditional logic: show/hide fields based on answers
- CRM integration: submissions auto-create/update contacts
- Inline embed + standalone page + share link
- Basic analytics: submissions, views, conversion rate
- Email notification on submission
- GDPR consent checkbox field
- Mobile-responsive forms
- Unlimited forms and submissions on free tier (match Tally's positioning)

#### P1 -- Essential (Sprint 2-3)
- Multi-step forms with progress bar
- Advanced conditional logic: branching, skip logic, AND/OR conditions
- Calculated fields for pricing/scoring
- Rating and NPS field types
- Popup and slide-in embed options
- Auto-responder emails
- Custom styling: colors, fonts, logo
- reCAPTCHA / honeypot spam protection
- CSV/Excel export
- Webhook integration on submission

#### P2 -- Competitive (Sprint 4-6)
- Progressive profiling (HubSpot-style -- key differentiator)
- Conversational mode (one-question-at-a-time, inspired by Typeform)
- Payment field (Stripe integration)
- AI-powered form builder (generate forms from natural language)
- A/B testing for forms
- Field drop-off analytics
- Template library (20+ starter templates)
- Custom CSS support
- Save and resume for long forms
- Zapier/Make integration

#### P3 -- Enterprise (Future)
- HIPAA compliance mode
- E-signature fields
- Approval workflows on submissions
- White-labeling / custom domains
- AI-powered response insights
- Advanced reporting and dashboards
- SSO/SAML integration
- Audit logging
- Data routing rules
- Multi-language / localization

### 16.3 Key Differentiators to Build

| Differentiator | Why It Matters | How to Implement |
|---------------|----------------|-----------------|
| **CRM-Native Forms** | HubSpot's #1 advantage -- forms connected to CRM are 10x more useful than standalone | Every submission creates/updates a contact record; fields map to CRM properties |
| **Free Unlimited Tier** | Tally proves this is viable and drives massive adoption | No submission limits on free tier; monetize through advanced features (CSS, branding, analytics) |
| **Block-Based + Conversational** | Best of both worlds -- no competitor offers both | Toggle between "Document mode" (Tally-style) and "Conversation mode" (Typeform-style) |
| **Progressive Profiling** | Only HubSpot has this; huge value for repeat visitors | Track known contacts; swap out already-answered fields for new ones |
| **Built-in Lead Scoring** | Connect form answers directly to lead quality scores | Assign point values to field options; auto-calculate lead score on submission |

### 16.4 UX Architecture Recommendation

```
Form Builder Page
  +-- Top Bar: Form name, Save, Preview (Desktop/Mobile), Publish
  +-- Left Panel: Field palette (grouped by category)
  +-- Center Canvas: Block-based editor (Notion-style)
  |     +-- Click to add block / type "/"
  |     +-- Drag to reorder
  |     +-- Inline field configuration
  +-- Right Panel: Selected field settings
  |     +-- General (label, placeholder, required)
  |     +-- Logic (show/hide conditions)
  |     +-- Validation (rules, error messages)
  |     +-- Styling (override defaults)
  +-- Bottom Bar: Mode toggle (Document | Conversation)
```

### 16.5 Data Model Considerations

Based on competitive analysis, the form builder data model should support:

- **Forms**: id, name, description, type (contact/survey/lead/payment), mode (document/conversation), settings (JSON), style_config (JSON), tenant_id
- **Form Fields**: id, form_id, type, label, placeholder, required, order, logic_rules (JSON), validation_rules (JSON), options (JSON for select/radio), crm_property_id (FK)
- **Form Steps/Pages**: id, form_id, title, order, visibility_conditions (JSON)
- **Form Submissions**: id, form_id, contact_id (FK), data (JSONB), metadata (IP, UA, referrer), status, created_at, tenant_id
- **Form Analytics Events**: id, form_id, event_type (view/start/field_interact/submit/abandon), field_id, timestamp, session_id

### 16.6 Risks and Watchpoints

| Risk | Mitigation |
|------|-----------|
| Feature creep -- trying to match all competitors | Strict P0/P1/P2 prioritization; ship MVP fast |
| Performance with complex conditional logic | Client-side logic evaluation; server-side validation only |
| Spam without CAPTCHA on free tier | Implement honeypot + rate limiting before CAPTCHA |
| Storage costs for file uploads | Set reasonable limits (10MB per file, 100MB per form) |
| Styling consistency across embed modes | Design system tokens; test all embed modes in CI |

---

## Appendix A: Research Sources

- HubSpot Forms product page and knowledge base (hubspot.com)
- Typeform pricing, features, and embed documentation (typeform.com)
- JotForm features, conditional logic, and blog (jotform.com)
- Google Forms conditional questions guides (support.google.com, zapier.com)
- Tally.so product page and comparison guides (tally.so)
- Formstack features, pricing, HIPAA documentation (formstack.com)
- Fillout form builder comparison table (fillout.com)
- Heyflow online form builders comparison (heyflow.com)
- Hackceleration product reviews (hackceleration.com)
- Knock AI form builder comparison (knock-ai.com)
- Various G2, TrustRadius, and Capterra reviews

---

*Last updated: 2026-02-09*
