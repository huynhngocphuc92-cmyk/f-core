# KE HOACH TICH HOP TRO LY AI - F-CORE CRM

> Version: 1.0
> Feature Name: **F-CORE Copilot** (tuong tu HubSpot ChatSpot / Breeze)
> Status: PHASE 1 + SECURITY HARDENING IMPLEMENTED (roadmap ben duoi giu lai cho Phase 2+)

---

## I. TONG QUAN

### Muc tieu
Tich hop tro ly AI vao F-CORE CRM, giup nguoi dung:
- Truy van du lieu CRM bang ngon ngu tu nhien
- Tu dong thao tac (tao note, draft email, cap nhat deal)
- Phan tich pipeline, du bao doanh so
- Goi y hanh dong tiep theo cho deals/contacts

### Hien trang
- **AI infrastructure:** DA CO (`/api/ai/chat`, `/api/ai/conversations`, Prisma AI models, tool registry)
- **Chat hien tai:** Da co trang `/ai-assistant` su dung `useChat` + stream response
- **CRM data:** Day du (Contact, Company, Deal, Activity, Pipeline, Workflow...)
- **Hardening da xong:** RBAC (`ai.use`), rate-limit theo user, prompt-injection validation, audit logs, token usage tracking
- **Roadmap con lai:** Agent workflows nang cao, observability chi tiet hon, va E2E end-to-end cho AI actions

---

## II. KIEN TRUC TONG THE

### Tech Stack

| Component | Technology | Ly do |
|-----------|-----------|-------|
| AI SDK | **Vercel AI SDK** (`ai`) | Built for Next.js, streaming, tool calling, provider-agnostic |
| LLM Provider | **OpenAI GPT-4o-mini** (default) | Chi phi thap, nhanh, du thong minh cho CRM |
| Fallback LLM | **Anthropic Claude 3.5 Sonnet** | Co the swap qua config |
| Streaming | **Edge Runtime** | Low latency, realtime response |
| Database | **Prisma** (cung stack hien tai) | AIConversation + AIMessage tables |
| Frontend | **useChat()** hook tu Vercel AI SDK | Streaming UI out-of-the-box |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  ┌───────────────┐  ┌──────────────────────────┐    │
│  │ Sidebar Panel │  │  /ai-assistant (Full Page)│    │
│  │ (Floating)    │  │  - Conversation List      │    │
│  │ - Quick Ask   │  │  - Chat Interface         │    │
│  │ - Mini Chat   │  │  - Context Picker         │    │
│  └──────┬────────┘  └────────────┬──────────────┘    │
│         │         useChat()      │                   │
└─────────┼────────────────────────┼───────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────┐
│                   API LAYER                          │
│                                                      │
│  POST /api/ai/chat ◄─── Streaming (Edge Runtime)    │
│    ├── System Prompt (CRM context)                   │
│    ├── Tool Calling ──► CRM Tools                    │
│    └── Stream Response ──► Client                    │
│                                                      │
│  GET  /api/ai/conversations      (list)              │
│  POST /api/ai/conversations      (create)            │
│  GET  /api/ai/conversations/[id] (get + messages)    │
│  DEL  /api/ai/conversations/[id] (soft delete)       │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 CRM TOOLS (Function Calling)         │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │search_contacts│ │ get_deal     │ │create_activity│ │
│  │search_companies│ │ list_deals  │ │draft_email   │ │
│  │get_contact    │ │pipeline_stats│ │create_task   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐                   │
│  │ get_activities│ │ revenue_stats│                   │
│  │ get_tickets  │ │ suggest_next │                   │
│  └──────────────┘ └──────────────┘                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              DATABASE (Prisma + Supabase)             │
│                                                      │
│  [Contact] [Company] [Deal] [Activity] [Pipeline]    │
│  [AIConversation] [AIMessage]  ◄── NEW               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## III. DATABASE SCHEMA

```prisma
model AIConversation {
  id          String    @id @default(uuid())
  tenantId    String
  userId      String
  title       String?           // Auto-generated tu message dau tien
  model       String    @default("gpt-4o-mini")

  // Context: Gan conversation voi CRM object
  contextType String?           // "contact" | "deal" | "company" | null
  contextId   String?           // ID cua object

  metadata    Json      @default("{}")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?         // Soft delete

  messages    AIMessage[]
  tenant      Tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId, userId])
  @@index([tenantId, contextType, contextId])
}

model AIMessage {
  id              String    @id @default(uuid())
  conversationId  String
  role            String              // "user" | "assistant" | "system" | "tool"
  content         String    @db.Text

  // Tool calling
  toolCalls       Json?               // Array of tool invocations
  toolResults     Json?               // Array of tool results

  // Usage tracking
  promptTokens    Int?
  completionTokens Int?

  createdAt       DateTime  @default(now())

  conversation    AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
}
```

---

## IV. AI TOOLS (Function Calling)

### Tool Registry

| Tool | Muc dich | Input | Output |
|------|----------|-------|--------|
| `search_contacts` | Tim contacts | `{ query, limit? }` | Contact[] |
| `get_contact` | Chi tiet contact | `{ id }` | Contact + Activities |
| `search_companies` | Tim companies | `{ query, limit? }` | Company[] |
| `get_company` | Chi tiet company | `{ id }` | Company + Contacts |
| `list_deals` | List deals | `{ stage?, ownerId?, limit? }` | Deal[] |
| `get_deal` | Chi tiet deal | `{ id }` | Deal + Stage + Activities |
| `pipeline_summary` | Tong quan pipeline | `{ pipelineId? }` | Stats by stage |
| `revenue_forecast` | Du bao revenue | `{ period? }` | Forecast data |
| `get_activities` | Activities cua object | `{ contactId?, dealId? }` | Activity[] |
| `create_note` | Tao ghi chu | `{ contactId, content }` | Activity |
| `create_task` | Tao task | `{ title, dueDate, contactId? }` | Activity |
| `draft_email` | Draft email | `{ contactId, subject, tone? }` | Email draft |
| `suggest_next_action` | Goi y buoc tiep | `{ dealId }` | Suggestion text |

### System Prompt Template

```text
You are F-CORE Copilot, an AI assistant for the F-CORE CRM platform.

You help sales teams manage their contacts, deals, and pipeline.

CAPABILITIES:
- Search and retrieve CRM data (contacts, companies, deals)
- Create notes, tasks, and draft emails
- Analyze pipeline health and forecast revenue
- Suggest next best actions for deals

RULES:
- Only access data belonging to the current user's tenant
- When showing data, format it clearly with key fields
- When creating records, confirm with the user before executing
- Be concise and action-oriented
- Use Vietnamese if the user writes in Vietnamese

CURRENT CONTEXT:
- Tenant ID: {tenantId}
- User: {userName}
- Attached: {contextType} - {contextName} (if any)
```

---

## V. API ROUTES

### 1. POST /api/ai/chat (Core - Streaming)

```typescript
// src/app/api/ai/chat/route.ts
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { tools } from "@/lib/ai/tools";

export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request);
  const { messages, conversationId, contextType, contextId } = await request.json();

  const systemPrompt = buildSystemPrompt(tenantId, contextType, contextId);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
    tools: tools(tenantId), // Pass tenantId for scoping
    maxSteps: 5,            // Allow multi-step tool calls
  });

  return result.toDataStreamResponse();
}
```

### 2. Conversations CRUD

```
GET    /api/ai/conversations          - List user's conversations
POST   /api/ai/conversations          - Create new conversation
GET    /api/ai/conversations/[id]     - Get conversation + messages
DELETE /api/ai/conversations/[id]     - Soft delete
```

---

## VI. FRONTEND COMPONENTS

### Component Tree

```
src/app/(dashboard)/ai-assistant/
├── page.tsx                    # Main page (Server Component)
└── components/
    ├── AIAssistantClient.tsx   # Client wrapper with useChat()
    ├── ConversationList.tsx    # Sidebar: list past conversations
    ├── ChatInterface.tsx       # Main chat area
    ├── MessageBubble.tsx       # Single message (user/assistant)
    ├── ToolCallDisplay.tsx     # Show tool invocation results
    ├── ContextPicker.tsx       # Select contact/deal/company context
    ├── SuggestedPrompts.tsx    # Quick action buttons
    └── StreamingIndicator.tsx  # Typing animation
```

### UI Design (theo F-CORE Design System)

```
┌──────────────────────────────────────────────────┐
│ F-CORE Copilot                          [+ New]  │
├──────────────┬───────────────────────────────────┤
│              │                                    │
│ Conversations│  ┌─ Context: Deal "Enterprise" ─┐ │
│              │  └──────────────────────────────┘ │
│ ● Pipeline   │                                    │
│   analysis   │  👤 Show me the deal pipeline      │
│              │     summary for this quarter       │
│ ● Draft email│                                    │
│   to John    │  🤖 Here's your Q1 pipeline:       │
│              │     ┌────────────────────────┐     │
│ ● Contact    │     │ Stage    │ Deals │ $   │     │
│   research   │     │ Qualify  │ 12    │ 45K │     │
│              │     │ Propose  │ 8     │ 120K│     │
│              │     │ Close    │ 3     │ 85K │     │
│              │     └────────────────────────┘     │
│              │     Total pipeline: $250K          │
│              │                                    │
│              │  ┌──────────────────────────────┐  │
│              │  │ Type a message...        Send │  │
│              │  └──────────────────────────────┘  │
│              │                                    │
│              │  💡 Suggested:                      │
│              │  [Draft email] [Pipeline stats]    │
│              │  [Search contacts] [Create task]   │
└──────────────┴───────────────────────────────────┘
```

---

## VII. IMPLEMENTATION PHASES

### Phase 1: Foundation (Core Chat)
**Files moi:**
```
src/lib/ai/
├── provider.ts          # AI provider config
├── tools.ts             # Tool definitions
└── system-prompt.ts     # System prompt builder

src/app/api/ai/
├── chat/route.ts                    # Streaming chat endpoint
└── conversations/
    ├── route.ts                     # List + Create
    └── [id]/route.ts                # Get + Delete

src/app/(dashboard)/ai-assistant/
├── page.tsx                         # Main page
└── components/
    ├── AIAssistantClient.tsx
    ├── ChatInterface.tsx
    ├── MessageBubble.tsx
    └── StreamingIndicator.tsx
```

**Tasks:**
1. `npm install ai @ai-sdk/openai`
2. Add `OPENAI_API_KEY` to `.env`
3. Prisma migration: AIConversation + AIMessage
4. Build streaming chat API route
5. Build basic chat UI with `useChat()`
6. Add sidebar navigation link

### Phase 2: CRM Tools (Function Calling)
**Files moi:**
```
src/lib/ai/tools/
├── contacts.ts          # search_contacts, get_contact
├── companies.ts         # search_companies, get_company
├── deals.ts             # list_deals, get_deal, pipeline_summary
├── activities.ts        # get_activities, create_note, create_task
└── index.ts             # Tool registry
```

**Tasks:**
1. Implement 8 CRM tools with tenant_id scoping
2. Add tool result visualization component
3. Add context picker (attach contact/deal)
4. Test tool calling end-to-end

### Phase 3: Advanced Features
**Files moi:**
```
src/lib/ai/tools/
├── email.ts             # draft_email (dung EmailTemplate)
├── forecast.ts          # revenue_forecast
└── suggestions.ts       # suggest_next_action

src/app/(dashboard)/ai-assistant/components/
├── ConversationList.tsx
├── ContextPicker.tsx
├── SuggestedPrompts.tsx
└── ToolCallDisplay.tsx
```

**Tasks:**
1. Conversation persistence (save/load history)
2. Email drafting with template integration
3. Revenue forecast tool
4. Suggested prompts based on context
5. Conversation list sidebar

### Phase 4: Polish & Security
1. Rate limiting (token budget per tenant)
2. Audit logging for AI-created records
3. Input sanitization (prevent prompt injection)
4. Error handling & fallbacks
5. Unit tests + E2E tests
6. Mobile responsive UI

---

## VIII. DEPENDENCIES CAN THEM

```bash
# Core (bat buoc)
npm install ai @ai-sdk/openai

# Optional (neu muon dung Anthropic)
npm install @ai-sdk/anthropic
```

**Package sizes:**
- `ai`: ~50KB
- `@ai-sdk/openai`: ~15KB

---

## IX. ENV VARIABLES CAN THEM

```bash
# .env
OPENAI_API_KEY=sk-...              # Required
# ANTHROPIC_API_KEY=sk-ant-...     # Optional fallback
AI_MODEL=gpt-4o-mini               # Default model
AI_MAX_TOKENS=4096                  # Max response tokens
AI_RATE_LIMIT_PER_HOUR=100         # Rate limit per user
```

---

## X. SECURITY CHECKLIST

- [x] Moi AI query PHAI filter theo `tenant_id`
- [x] Tool calling KHONG duoc truy cap data ngoai tenant
- [x] Rate limiting theo user (tranh abuse/chi phi)
- [x] Audit log khi AI tao/sua records
- [x] Input validation chong prompt injection
- [x] KHONG gui PII vao system prompt (chi gui khi user hoi)
- [x] Token usage tracking de monitor chi phi

---

## XI. ESTIMATED SCOPE

| Phase | Files moi | LOC uoc tinh |
|-------|-----------|-------------|
| Phase 1: Foundation | ~10 files | ~600 LOC |
| Phase 2: CRM Tools | ~6 files | ~400 LOC |
| Phase 3: Advanced | ~8 files | ~500 LOC |
| Phase 4: Polish | ~4 files | ~300 LOC |
| **Total** | **~28 files** | **~1,800 LOC** |

---

## XII. REFERENCE

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [HubSpot ChatSpot](https://chatspot.ai) - Inspiration
- [HubSpot Breeze](https://www.hubspot.com/breeze) - Inspiration
