# Ticketing System - Implementation Plan

## Scope (Demo Phase)
Based on research, implement core ticketing with pipeline management, commenting, and SLA display.

## Database Models (7 new)
1. Ticket - core entity with ticketNumber, title, description, priority, status, category, source
2. TicketComment - public replies + internal notes
3. TicketPipeline - separate from Deal Pipeline
4. TicketPipelineStage - stages with type (open/in_progress/waiting/resolved/closed)
5. TicketSLAPolicy - per-priority SLA targets
6. TicketActivity - audit trail
7. TicketCounter - sequential numbering per tenant

## API Routes (12 endpoints)
- GET/POST /api/tickets
- GET/PATCH/DELETE /api/tickets/[id]
- GET/POST /api/tickets/[id]/comments
- GET/POST /api/tickets/pipelines
- GET/PATCH /api/tickets/pipelines/[id]
- GET/POST /api/tickets/sla

## Frontend Pages (5)
1. /tickets - List view + Kanban board toggle
2. /tickets/[id] - Detail page with conversation + sidebar
3. /tickets/new - Create ticket form
4. /tickets/pipelines - Pipeline settings
5. /tickets/sla - SLA policy management

## Execution Order
1. Prisma schema update + push + generate
2. Seed data (pipeline, stages, SLA policies, sample tickets)
3. Zod validation schemas
4. Ticket numbering utility
5. API routes (CRUD → comments → pipelines → SLA)
6. Frontend pages (list → detail → create → settings)
7. Sidebar update (add Tickets nav item)
