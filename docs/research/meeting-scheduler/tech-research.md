# Meeting Scheduler - Technical Architecture Research

> **Project:** F-CORE (HubSpot CRM Clone)
> **Module:** Meeting Scheduler (Sales Hub)
> **Priority:** P1
> **Author:** Tech Research Agent
> **Date:** 2026-02-08
> **Status:** COMPLETE

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [HubSpot Meeting Scheduler Analysis](#2-hubspot-meeting-scheduler-analysis)
3. [Database Schema Design](#3-database-schema-design)
4. [Complete Prisma Schema Proposal](#4-complete-prisma-schema-proposal)
5. [Calendar & Scheduling Logic](#5-calendar--scheduling-logic)
6. [Booking Flow Architecture](#6-booking-flow-architecture)
7. [API Route Design](#7-api-route-design)
8. [Real-time Features](#8-real-time-features)
9. [Notification System](#9-notification-system)
10. [External Calendar Integration](#10-external-calendar-integration)
11. [Performance Considerations](#11-performance-considerations)
12. [Library & Dependency Decisions](#12-library--dependency-decisions)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Decision Log](#14-decision-log)

---

## 1. Executive Summary

The Meeting Scheduler is a P1 feature within the Sales Hub of F-CORE. It enables users to:

- Create meeting types with configurable durations and booking settings
- Share public booking links so prospects can self-schedule meetings
- Define weekly availability schedules with date-based overrides
- Detect conflicts and prevent double-booking
- Sync with external calendars (Google Calendar, Outlook/Microsoft 365)
- Send email confirmations with .ics calendar invites
- Track meetings as CRM activities linked to Contacts, Companies, and Deals

This document provides a comprehensive technical blueprint covering database design, scheduling algorithms, API routes, real-time updates, notification workflows, external integrations, and a phased implementation roadmap.

### Scope

| In Scope (MVP)                          | Deferred (Post-MVP)                    |
|-----------------------------------------|-----------------------------------------|
| Meeting CRUD                            | Google Calendar bi-directional sync     |
| Meeting types & booking links           | Outlook/Microsoft Graph integration     |
| Weekly availability schedules           | Round-robin team scheduling             |
| Date overrides                          | Group meetings                          |
| Public booking page                     | Recurring meeting series (RRULE)        |
| Conflict detection                      | Payment collection on booking           |
| .ics file generation                    | Custom form builder for booking page    |
| Email confirmation                      | Video conferencing integration          |
| Activity timeline integration           | Embedded scheduling widget              |
| Buffer time between meetings            | Analytics & reporting dashboard         |

---

## 2. HubSpot Meeting Scheduler Analysis

### 2.1 How HubSpot Meetings Work

Based on research of HubSpot's meeting scheduler:

1. **Calendar Connection:** Users connect their Google Calendar or Office 365 calendar. HubSpot reads free/busy data from the connected calendar.

2. **Meeting Types:** Users create scheduling pages that define:
   - Meeting name and description
   - Duration options (15, 30, 45, 60 min)
   - Custom availability windows
   - Booking form questions
   - Buffer time between meetings
   - Minimum scheduling notice

3. **Booking Link:** Each scheduling page gets a unique URL slug. The link shows available slots based on:
   - The user's defined availability hours
   - Free/busy data from connected calendar(s)
   - Buffer time settings
   - Minimum notice period

4. **Booking Flow:** When a prospect books:
   - Creates/updates a Contact record in CRM
   - Logs a Meeting activity on the contact timeline
   - Sends calendar invites to all parties
   - Adds the event to the organizer's calendar

5. **Meeting Types (Scheduling Modes):**
   - **One-on-One:** Single person availability
   - **Round Robin:** Rotates among team members
   - **Group:** Requires all team members available

### 2.2 Key Features to Clone

| Feature                    | HubSpot Behavior                                | F-CORE Implementation                  |
|----------------------------|------------------------------------------------|----------------------------------------|
| Calendar sync              | Google + Office 365                            | Start internal-only, add Google later  |
| Booking link               | `meetings.hubspot.com/username/meeting-name`   | `/book/{slug}`                         |
| Availability               | Weekly hours + calendar free/busy              | Weekly hours + internal meeting check  |
| Meeting types              | Custom types with logging categories           | MeetingType model                      |
| CRM integration            | Auto-create/update contact                     | Link to Contact, Company, Deal         |
| Reminders                  | Email before meeting                           | Email reminders via cron               |
| Cancellation               | Cancel/reschedule link in confirmation          | Cancel via link, reschedule later      |

---

## 3. Database Schema Design

### 3.1 Entity Relationship Overview

```
                                +------------------+
                                |      User        |
                                |  (organizer)     |
                                +--------+---------+
                                         |
              +--------------------------+----------------------------+
              |                          |                            |
    +---------v---------+    +-----------v-----------+    +-----------v---------+
    |   MeetingType      |    |   Availability       |    |   Meeting           |
    |                    |    |   Schedule            |    |                     |
    | - name             |    |                       |    | - title             |
    | - duration         |    | - dayOfWeek rules     |    | - startTime         |
    | - color            |    | - date overrides      |    | - endTime           |
    | - bufferBefore     |    |                       |    | - status            |
    | - bufferAfter      |    |                       |    | - location          |
    +---------+----------+    +-----------------------+    +---------+-----------+
              |                                                      |
    +---------v----------+                              +------------v---------+
    |   BookingLink      |                              |  MeetingAttendee     |
    |                    |                              |                      |
    | - slug             |                              | - email              |
    | - isActive         |                              | - responseStatus     |
    | - settings (JSON)  |                              | - contactId?         |
    +--------------------+                              +------------+---------+
                                                                     |
                                                        +------------v---------+
                                                        |   Activity           |
                                                        |   (type=meeting)     |
                                                        |                      |
                                                        | - linked to          |
                                                        |   Contact/Company    |
                                                        |   /Deal              |
                                                        +----------------------+
```

### 3.2 Model Descriptions

#### Meeting
The core entity representing a scheduled meeting instance.

| Field              | Type          | Purpose                                              |
|--------------------|---------------|------------------------------------------------------|
| id                 | UUID          | Primary key                                          |
| tenantId           | UUID          | Multi-tenancy isolation                              |
| title              | String        | Meeting title/subject                                |
| description        | Text?         | Rich text description/agenda                         |
| meetingTypeId      | UUID?         | Link to MeetingType                                  |
| organizerId        | UUID          | User who owns/organizes the meeting                  |
| startTime          | DateTime      | UTC start time                                       |
| endTime            | DateTime      | UTC end time                                         |
| timezone           | String        | IANA timezone of the organizer (e.g. Asia/Ho_Chi_Minh) |
| location           | String?       | Physical location or "Virtual"                       |
| locationUrl        | String?       | Video conference URL                                 |
| status             | Enum          | scheduled, completed, cancelled, no_show             |
| source             | Enum          | manual, booking_link, calendar_sync, api             |
| bookingLinkId      | UUID?         | If booked via a booking link                         |
| cancellationReason | String?       | Why it was cancelled                                 |
| cancelledAt        | DateTime?     | When it was cancelled                                |
| cancelledBy        | String?       | Who cancelled (userId or email)                      |
| outcome            | String?       | Post-meeting outcome notes                           |
| metadata           | JSON          | Extensible data (external calendar IDs, etc.)        |
| activityId         | UUID?         | Link back to Activity for timeline                   |
| createdAt          | DateTime      | Audit                                                |
| updatedAt          | DateTime      | Audit                                                |
| deletedAt          | DateTime?     | Soft delete                                          |

#### MeetingAttendee
Junction table linking meetings to attendees (both internal users and external contacts).

| Field              | Type          | Purpose                                              |
|--------------------|---------------|------------------------------------------------------|
| id                 | UUID          | Primary key                                          |
| meetingId          | UUID          | FK to Meeting                                        |
| email              | String        | Attendee email (source of truth)                     |
| name               | String?       | Display name                                         |
| role               | Enum          | organizer, required, optional                        |
| responseStatus     | Enum          | pending, accepted, declined, tentative               |
| contactId          | UUID?         | FK to Contact (if matched)                           |
| userId             | UUID?         | FK to User (if internal)                             |
| isOrganizer        | Boolean       | Whether this attendee is the organizer               |
| createdAt          | DateTime      | Audit                                                |

#### MeetingType
Defines reusable meeting templates (like "Discovery Call", "Product Demo", "Quick Chat").

| Field              | Type          | Purpose                                              |
|--------------------|---------------|------------------------------------------------------|
| id                 | UUID          | Primary key                                          |
| tenantId           | UUID          | Multi-tenancy                                        |
| name               | String        | Display name (e.g. "30-minute Discovery Call")       |
| slug               | String        | URL-safe identifier                                  |
| description        | Text?         | Description shown on booking page                    |
| durationMinutes    | Int           | Default duration in minutes                          |
| durationOptions    | Int[]?        | If multiple durations offered (e.g. [15, 30, 60])    |
| color              | String?       | Hex color for calendar display                       |
| icon               | String?       | Icon identifier                                      |
| isActive           | Boolean       | Whether this type is available for booking           |
| ownerId            | UUID          | User who owns this meeting type                      |
| bufferBefore       | Int           | Minutes of buffer before meeting (default 0)         |
| bufferAfter        | Int           | Minutes of buffer after meeting (default 0)          |
| minNoticeMinutes   | Int           | Minimum advance booking notice (default 60)          |
| maxDaysInAdvance   | Int           | How far ahead booking is allowed (default 60)        |
| confirmationMessage| Text?         | Custom message shown after booking                   |
| formFields         | JSON          | Custom form fields for booking page                  |
| settings           | JSON          | Additional settings (reminders, etc.)                |
| orderIndex         | Int           | Display order                                        |
| createdAt          | DateTime      | Audit                                                |
| updatedAt          | DateTime      | Audit                                                |
| deletedAt          | DateTime?     | Soft delete                                          |

#### BookingLink
Shareable links that map to a meeting type + user.

| Field              | Type          | Purpose                                              |
|--------------------|---------------|------------------------------------------------------|
| id                 | UUID          | Primary key                                          |
| tenantId           | UUID          | Multi-tenancy                                        |
| slug               | String        | Unique URL slug (e.g. "john/discovery-call")         |
| meetingTypeId      | UUID          | FK to MeetingType                                    |
| ownerId            | UUID          | User who owns this link                              |
| isActive           | Boolean       | Whether link is accepting bookings                   |
| expiresAt          | DateTime?     | Optional expiration date                             |
| maxBookings        | Int?          | Optional max number of bookings                      |
| currentBookings    | Int           | Counter of bookings made (default 0)                 |
| customAvailability | Boolean       | If true, use link-specific availability              |
| settings           | JSON          | Override settings (welcome message, etc.)            |
| createdAt          | DateTime      | Audit                                                |
| updatedAt          | DateTime      | Audit                                                |
| deletedAt          | DateTime?     | Soft delete                                          |

#### AvailabilitySchedule
Defines a user's weekly recurring availability pattern.

| Field              | Type          | Purpose                                              |
|--------------------|---------------|------------------------------------------------------|
| id                 | UUID          | Primary key                                          |
| tenantId           | UUID          | Multi-tenancy                                        |
| userId             | UUID          | FK to User                                           |
| name               | String        | Schedule name (e.g. "Working Hours")                 |
| timezone           | String        | IANA timezone for this schedule                      |
| isDefault          | Boolean       | Whether this is the user's default schedule          |
| createdAt          | DateTime      | Audit                                                |
| updatedAt          | DateTime      | Audit                                                |

#### AvailabilityRule
Individual day-of-week rules within an availability schedule.

| Field              | Type          | Purpose                                              |
|--------------------|---------------|------------------------------------------------------|
| id                 | UUID          | Primary key                                          |
| scheduleId         | UUID          | FK to AvailabilitySchedule                           |
| dayOfWeek          | Int           | 0=Sunday, 1=Monday, ..., 6=Saturday                 |
| startTime          | String        | Start time in HH:mm format (e.g. "09:00")           |
| endTime            | String        | End time in HH:mm format (e.g. "17:00")             |
| isEnabled          | Boolean       | Whether this day is available (default true)         |
| createdAt          | DateTime      | Audit                                                |

**Design Note:** Using String for `startTime`/`endTime` instead of DateTime because these represent recurring wall-clock times in the schedule's timezone, not absolute UTC instants. A time like "09:00" on Monday means 09:00 in whatever timezone the schedule is configured for. This approach avoids DST conversion complexity at the storage layer.

#### AvailabilityOverride
Date-specific overrides (e.g., holidays, special hours, blocked dates).

| Field              | Type          | Purpose                                              |
|--------------------|---------------|------------------------------------------------------|
| id                 | UUID          | Primary key                                          |
| scheduleId         | UUID          | FK to AvailabilitySchedule                           |
| date               | DateTime      | The specific date being overridden (date only)       |
| startTime          | String?       | Override start time (null = unavailable all day)     |
| endTime            | String?       | Override end time                                    |
| isAvailable        | Boolean       | If false, the entire day is blocked                  |
| reason             | String?       | e.g. "National Holiday", "PTO"                       |
| createdAt          | DateTime      | Audit                                                |

### 3.3 CRM Association Tables

We need many-to-many relationships between Meetings and CRM objects (Contact, Company, Deal).

#### MeetingContact

| Field      | Type    | Purpose                             |
|------------|---------|-------------------------------------|
| meetingId  | UUID    | FK to Meeting                       |
| contactId  | UUID    | FK to Contact                       |
| createdAt  | DateTime| Audit                               |

#### MeetingCompany

| Field      | Type    | Purpose                             |
|------------|---------|-------------------------------------|
| meetingId  | UUID    | FK to Meeting                       |
| companyId  | UUID    | FK to Company                       |
| createdAt  | DateTime| Audit                               |

#### MeetingDeal

| Field      | Type    | Purpose                             |
|------------|---------|-------------------------------------|
| meetingId  | UUID    | FK to Meeting                       |
| dealId     | UUID    | FK to Deal                          |
| createdAt  | DateTime| Audit                               |

### 3.4 Relationship to Activity Model

The existing `Activity` model already has meeting-specific fields (`meetingStart`, `meetingEnd`, `meetingLocation`, `attendees`). The strategy is:

1. When a Meeting is created, also create a corresponding Activity with `type = "meeting"`.
2. Store the `activityId` on the Meeting record for cross-reference.
3. The Activity provides the timeline view; the Meeting model provides the full scheduling data.
4. Keep the Activity fields populated for backward compatibility with the existing timeline UI.

This dual-model approach allows the meeting scheduler to have its own rich data model while integrating seamlessly with the existing activity timeline.

### 3.5 Handling Recurring Meetings

**Decision: Defer RRULE-based recurrence to post-MVP.**

Rationale:
- Recurring meetings are complex and require significant infrastructure (RRULE parsing, exception handling, instance materialization).
- The MVP can support "series" by allowing users to manually create multiple meetings.
- When implemented later, the approach will be:

```
Recommended Approach (Post-MVP):
1. Store RRULE string on a RecurrenceSeries model
2. Use rrule.js library to compute occurrences on-the-fly
3. Materialize instances only when they need to be modified (exceptions)
4. Store recurrenceSeriesId and recurrenceIndex on Meeting instances
```

Libraries for RRULE:
- **rrule.js** (https://github.com/jkbrzt/rrule) - The de facto standard. 1.2M weekly downloads. Full RFC 5545 RRULE support.
- Supports `.between(start, end)` for efficient range queries.
- Can parse from string: `RRule.fromString('FREQ=WEEKLY;BYDAY=MO,WE,FR')`.

PostgreSQL-level options (for advanced use):
- **pgcalendar** extension provides native recurrence support.
- **plv8 + rrule.js** for server-side occurrence computation.
- Materialized views for pre-computing upcoming occurrences.

### 3.6 Indexes and Performance

```sql
-- Meeting lookups
@@index([tenantId])                    -- Multi-tenancy filter
@@index([organizerId])                 -- User's meetings
@@index([startTime])                   -- Date range queries
@@index([status])                      -- Status filtering
@@index([deletedAt])                   -- Soft delete filter
@@index([bookingLinkId])               -- Booking analytics
@@index([tenantId, organizerId, startTime])  -- Compound: user's meetings in range

-- MeetingAttendee
@@index([meetingId])                    -- Attendees for a meeting
@@index([email])                       -- Meetings for an email
@@index([contactId])                   -- Meetings for a contact
@@index([userId])                      -- Meetings for a user

-- BookingLink
@@unique([slug])                       -- Unique booking URLs
@@index([tenantId, ownerId])           -- Owner's booking links

-- MeetingType
@@unique([tenantId, ownerId, slug])    -- Unique slug per user per tenant
@@index([tenantId])                    -- Tenant filter

-- AvailabilityRule
@@index([scheduleId])                  -- Rules for a schedule
@@unique([scheduleId, dayOfWeek])      -- One rule per day per schedule

-- AvailabilityOverride
@@index([scheduleId, date])            -- Override lookup by date
@@unique([scheduleId, date])           -- One override per date per schedule

-- CRM Associations
@@index on MeetingContact([meetingId])
@@index on MeetingContact([contactId])
@@index on MeetingCompany([meetingId])
@@index on MeetingDeal([meetingId])
```

### 3.7 Double-Booking Prevention at Database Level

PostgreSQL offers a powerful mechanism for preventing overlapping time ranges: **exclusion constraints** with the `tstzrange` type and GiST index.

```sql
-- Enable the btree_gist extension (required for exclusion constraints with = operator)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping meetings for the same organizer
ALTER TABLE "Meeting" ADD CONSTRAINT no_overlapping_meetings
EXCLUDE USING gist (
  "organizerId" WITH =,
  tstzrange("startTime", "endTime") WITH &&
) WHERE ("status" != 'cancelled' AND "deletedAt" IS NULL);
```

This constraint ensures that for the same organizer, no two non-cancelled meetings can have overlapping time ranges. The database enforces this atomically, preventing race conditions.

**Important:** Since Prisma does not natively support exclusion constraints, this must be added via a raw SQL migration.

---

## 4. Complete Prisma Schema Proposal

The following Prisma models follow existing project patterns: UUID primary keys, `tenantId` for multi-tenancy, `createdAt`/`updatedAt` for audit, `deletedAt` for soft delete.

```prisma
// ============================================
// MEETING SCHEDULER MODELS
// ============================================

// Meeting Status
enum MeetingStatus {
  scheduled
  completed
  cancelled
  no_show
}

// Meeting Source - how the meeting was created
enum MeetingSource {
  manual        // Created manually in CRM
  booking_link  // Booked via public booking link
  calendar_sync // Synced from external calendar
  api           // Created via API
}

// Attendee Role
enum AttendeeRole {
  organizer
  required
  optional
}

// Attendee Response Status
enum AttendeeResponseStatus {
  pending
  accepted
  declined
  tentative
}

// Core Meeting Model
model Meeting {
  id                 String          @id @default(uuid())
  tenantId           String

  // Basic Info
  title              String
  description        String?         @db.Text

  // Scheduling
  startTime          DateTime
  endTime            DateTime
  timezone           String          @default("UTC")
  duration           Int             // Duration in minutes (denormalized for queries)

  // Location
  location           String?
  locationUrl        String?         // Video conference link

  // Status & Tracking
  status             MeetingStatus   @default(scheduled)
  source             MeetingSource   @default(manual)
  outcome            String?         // Post-meeting outcome/notes

  // Cancellation
  cancellationReason String?
  cancelledAt        DateTime?
  cancelledBy        String?

  // Relations
  organizerId        String
  meetingTypeId      String?
  bookingLinkId      String?
  activityId         String?         // Link back to Activity for timeline

  // Extensible metadata
  // Stores: externalCalendarId, conferenceData, remindersSent, etc.
  metadata           Json            @default("{}")

  // Audit
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  deletedAt          DateTime?
  createdBy          String?
  updatedBy          String?

  // Relations
  tenant             Tenant          @relation(fields: [tenantId], references: [id])
  organizer          User            @relation("MeetingOrganizer", fields: [organizerId], references: [id])
  meetingType        MeetingType?    @relation(fields: [meetingTypeId], references: [id])
  bookingLink        BookingLink?    @relation(fields: [bookingLinkId], references: [id])
  attendees          MeetingAttendee[]
  contacts           MeetingContact[]
  companies          MeetingCompany[]
  deals              MeetingDeal[]

  @@index([tenantId])
  @@index([organizerId])
  @@index([startTime])
  @@index([endTime])
  @@index([status])
  @@index([deletedAt])
  @@index([bookingLinkId])
  @@index([meetingTypeId])
  @@index([tenantId, organizerId, startTime])
  @@index([tenantId, startTime, endTime])
}

model MeetingAttendee {
  id               String                   @id @default(uuid())
  meetingId        String
  email            String
  name             String?
  role             AttendeeRole             @default(required)
  responseStatus   AttendeeResponseStatus   @default(pending)
  isOrganizer      Boolean                  @default(false)

  // CRM Links
  contactId        String?
  userId           String?

  createdAt        DateTime                 @default(now())

  // Relations
  meeting          Meeting                  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  contact          Contact?                 @relation(fields: [contactId], references: [id])

  @@index([meetingId])
  @@index([email])
  @@index([contactId])
  @@index([userId])
  @@unique([meetingId, email])
}

model MeetingType {
  id                  String    @id @default(uuid())
  tenantId            String
  ownerId             String

  // Display
  name                String
  slug                String
  description         String?   @db.Text
  color               String?   // Hex color
  icon                String?   // Lucide icon name

  // Duration
  durationMinutes     Int       @default(30)
  durationOptions     Json?     // Array of integers, e.g. [15, 30, 60]

  // Scheduling Rules
  bufferBefore        Int       @default(0)   // Minutes before meeting
  bufferAfter         Int       @default(0)   // Minutes after meeting
  minNoticeMinutes    Int       @default(60)  // Minimum booking notice
  maxDaysInAdvance    Int       @default(60)  // Max days ahead for booking

  // Booking Page
  confirmationMessage String?   @db.Text
  formFields          Json      @default("[]")  // Custom form fields
  settings            Json      @default("{}")  // Additional settings

  // State
  isActive            Boolean   @default(true)
  orderIndex          Int       @default(0)

  // Audit
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  // Relations
  tenant              Tenant    @relation(fields: [tenantId], references: [id])
  owner               User      @relation("MeetingTypeOwner", fields: [ownerId], references: [id])
  bookingLinks        BookingLink[]
  meetings            Meeting[]

  @@unique([tenantId, ownerId, slug])
  @@index([tenantId])
  @@index([ownerId])
  @@index([isActive])
}

model BookingLink {
  id                  String    @id @default(uuid())
  tenantId            String
  ownerId             String
  meetingTypeId       String

  // URL
  slug                String    @unique  // Global unique slug

  // State
  isActive            Boolean   @default(true)
  expiresAt           DateTime?
  maxBookings         Int?
  currentBookings     Int       @default(0)

  // Settings
  customAvailability  Boolean   @default(false)
  settings            Json      @default("{}")  // Welcome message, branding, etc.

  // Audit
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  // Relations
  tenant              Tenant    @relation(fields: [tenantId], references: [id])
  owner               User      @relation("BookingLinkOwner", fields: [ownerId], references: [id])
  meetingType         MeetingType @relation(fields: [meetingTypeId], references: [id])
  meetings            Meeting[]

  @@index([tenantId])
  @@index([ownerId])
  @@index([meetingTypeId])
  @@index([slug])
}

model AvailabilitySchedule {
  id          String    @id @default(uuid())
  tenantId    String
  userId      String

  name        String    @default("Working Hours")
  timezone    String    @default("UTC")
  isDefault   Boolean   @default(false)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  owner       User      @relation("AvailabilityOwner", fields: [userId], references: [id])
  rules       AvailabilityRule[]
  overrides   AvailabilityOverride[]

  @@index([tenantId])
  @@index([userId])
  @@index([isDefault])
  @@unique([tenantId, userId, name])
}

model AvailabilityRule {
  id          String    @id @default(uuid())
  scheduleId  String

  dayOfWeek   Int       // 0=Sun, 1=Mon, ..., 6=Sat
  startTime   String    // "09:00" (HH:mm in schedule timezone)
  endTime     String    // "17:00"
  isEnabled   Boolean   @default(true)

  createdAt   DateTime  @default(now())

  // Relations
  schedule    AvailabilitySchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@index([scheduleId])
  @@unique([scheduleId, dayOfWeek])
}

model AvailabilityOverride {
  id          String    @id @default(uuid())
  scheduleId  String

  date        DateTime  @db.Date  // Specific date
  startTime   String?   // Override hours (null = blocked all day)
  endTime     String?
  isAvailable Boolean   @default(true)
  reason      String?   // "Holiday", "PTO", etc.

  createdAt   DateTime  @default(now())

  // Relations
  schedule    AvailabilitySchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@index([scheduleId, date])
  @@unique([scheduleId, date])
}

// ============================================
// CRM ASSOCIATION TABLES (Meeting <-> CRM Objects)
// ============================================

model MeetingContact {
  meetingId   String
  contactId   String
  createdAt   DateTime  @default(now())

  meeting     Meeting   @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  contact     Contact   @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@id([meetingId, contactId])
}

model MeetingCompany {
  meetingId   String
  companyId   String
  createdAt   DateTime  @default(now())

  meeting     Meeting   @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@id([meetingId, companyId])
}

model MeetingDeal {
  meetingId   String
  dealId      String
  createdAt   DateTime  @default(now())

  meeting     Meeting   @relation(fields: [dealId], references: [id], onDelete: Cascade)
  deal        Deal      @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@id([meetingId, dealId])
}
```

### Required Updates to Existing Models

The following models need new relation fields added:

```prisma
// In User model, add:
  meetingsOrganized  Meeting[]              @relation("MeetingOrganizer")
  meetingTypes       MeetingType[]          @relation("MeetingTypeOwner")
  bookingLinks       BookingLink[]          @relation("BookingLinkOwner")
  availabilities     AvailabilitySchedule[] @relation("AvailabilityOwner")

// In Tenant model, add:
  meetings           Meeting[]
  meetingTypes       MeetingType[]
  bookingLinks       BookingLink[]
  availabilities     AvailabilitySchedule[]

// In Contact model, add:
  meetingAttendees   MeetingAttendee[]
  meetings           MeetingContact[]

// In Company model, add:
  meetings           MeetingCompany[]

// In Deal model, add:
  meetings           MeetingDeal[]
```

---

## 5. Calendar & Scheduling Logic

### 5.1 Availability Calculation Algorithm

The core scheduling algorithm computes available time slots for a given user and date range. Here is the step-by-step process:

```
Input:
  - userId: string
  - dateRange: { start: Date, end: Date }
  - meetingTypeId: string (for duration, buffer settings)
  - timezone: string (requester's timezone)

Output:
  - availableSlots: Array<{ start: Date, end: Date }>

Algorithm:

1. LOAD availability schedule for user
   - Get default AvailabilitySchedule
   - Load all AvailabilityRules (weekly patterns)
   - Load all AvailabilityOverrides for the date range

2. LOAD meeting type settings
   - duration, bufferBefore, bufferAfter, minNoticeMinutes, maxDaysInAdvance

3. For each day in dateRange:

   a. DETERMINE base availability for this day:
      - Check if an AvailabilityOverride exists for this date
        - If override exists AND isAvailable=false -> skip day entirely
        - If override exists AND isAvailable=true -> use override times
        - If no override -> use AvailabilityRule for this dayOfWeek
        - If rule is not enabled -> skip day entirely

   b. CONVERT availability times to UTC:
      - Parse "09:00"-"17:00" in the schedule's timezone
      - Convert to UTC DateTime for this specific date
      - Handle DST transitions correctly

   c. GENERATE candidate slots:
      - Starting from availabilityStart, create slots of [duration] minutes
      - Apply step interval (typically = duration, or configurable e.g. 15 min)
      - Each slot: { start: slotStart, end: slotStart + duration }

   d. APPLY buffer times:
      - For each slot, the "blocked window" is:
        [slotStart - bufferBefore, slotEnd + bufferAfter]

   e. FILTER out conflicts:
      - Load existing meetings for this user on this day
        (status IN ['scheduled', 'completed'] AND deletedAt IS NULL)
      - For each candidate slot, check if its blocked window overlaps
        with any existing meeting's time range
      - Remove conflicting slots

   f. APPLY minimum notice:
      - Remove any slot where slotStart < now() + minNoticeMinutes

   g. APPLY max advance limit:
      - Remove any slot where slotStart > now() + maxDaysInAdvance

4. RETURN remaining slots, converted to requester's timezone
```

### 5.2 Efficient Conflict Detection Query

```sql
-- Find all meetings for a user in a date range (for conflict checking)
SELECT "startTime", "endTime"
FROM "Meeting"
WHERE "organizerId" = $1
  AND "tenantId" = $2
  AND "status" IN ('scheduled', 'completed')
  AND "deletedAt" IS NULL
  AND "startTime" < $4  -- range end
  AND "endTime" > $3    -- range start
ORDER BY "startTime";
```

This query uses the composite index on `(tenantId, organizerId, startTime)` and returns all meetings in the range. The application then performs the overlap check in memory, which is efficient because a typical user has at most ~20 meetings per day.

### 5.3 Timezone Handling Strategy

**Core Principle: Store in UTC, display in local.**

| Data Type               | Storage Format                | Display Format              |
|--------------------------|-------------------------------|------------------------------|
| Meeting startTime/endTime| UTC DateTime                 | Converted to viewer's TZ    |
| Availability rules       | Wall-clock time strings      | Displayed as-is             |
| Availability schedule TZ | IANA timezone string         | Used for conversion         |
| Booking requester TZ     | Detected from browser        | Used for slot display       |

**Conversion Flow:**

```
Availability Rule: "Monday 09:00-17:00" in "Asia/Ho_Chi_Minh" (UTC+7)
                            |
                            v
Convert for specific Monday: 2026-02-09 09:00 ICT = 2026-02-09 02:00 UTC
                            |
                            v
Generate slots in UTC: [02:00-02:30, 02:30-03:00, ..., 09:30-10:00]
                            |
                            v
Display to booker in "America/New_York" (UTC-5):
  [21:00-21:30, 21:30-22:00, ...] (previous day!)
```

**DST Considerations:**
- Always use IANA timezone names, never fixed UTC offsets.
- When converting availability rules to UTC for a specific date, use the DST rules in effect for that date.
- Luxon handles this correctly with `DateTime.fromObject({ ... }, { zone: 'America/New_York' })`.

### 5.4 Conflict Detection for Attendees

Beyond checking the organizer's calendar, we should check all attendees:

```typescript
async function getConflicts(
  meetingId: string | null, // null for new meetings
  organizerId: string,
  attendeeUserIds: string[],
  startTime: Date,
  endTime: Date,
  tenantId: string
): Promise<ConflictResult[]> {
  const allUserIds = [organizerId, ...attendeeUserIds];

  const conflicts = await prisma.meeting.findMany({
    where: {
      tenantId,
      status: { in: ['scheduled', 'completed'] },
      deletedAt: null,
      id: meetingId ? { not: meetingId } : undefined,
      OR: [
        // Organizer conflict
        {
          organizerId: { in: allUserIds },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        // Attendee conflict
        {
          attendees: { some: { userId: { in: allUserIds } } },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
    include: { attendees: true },
  });

  return conflicts.map(c => ({
    meetingId: c.id,
    title: c.title,
    startTime: c.startTime,
    endTime: c.endTime,
    conflictingUserIds: allUserIds.filter(uid =>
      uid === c.organizerId || c.attendees.some(a => a.userId === uid)
    ),
  }));
}
```

---

## 6. Booking Flow Architecture

### 6.1 Public vs Authenticated Booking

| Aspect            | Public Booking Page          | Authenticated Scheduling     |
|--------------------|-----------------------------|-------------------------------|
| URL                | `/book/{slug}`               | `/meetings/new`              |
| Auth required      | No                          | Yes (logged-in user)         |
| Data provided by   | Form submission              | CRM data + form              |
| Rate limiting      | Aggressive (by IP)          | Standard                     |
| CAPTCHA            | Recommended                 | Not needed                   |
| Contact creation   | Auto-create if not exists   | Select existing contact      |
| Meeting creation   | Source = booking_link        | Source = manual              |

### 6.2 Booking Page Flow

```
1. GET /book/{slug}
   - Validate slug exists and is active
   - Check expiration and max bookings
   - Return: meeting type info, owner info, timezone list
   - Return: available dates for the next maxDaysInAdvance days

2. User selects a date
   - GET /api/booking/{slug}/slots?date={YYYY-MM-DD}&timezone={tz}
   - Return: available time slots for that date

3. User selects a time slot
   - Client shows booking form (name, email, custom fields)
   - User fills in details

4. POST /api/booking/{slug}
   - Validate all inputs (Zod)
   - Re-check slot availability (prevent stale data)
   - BEGIN TRANSACTION
     - Create or find Contact by email
     - Create Meeting with status=scheduled
     - Create MeetingAttendee records
     - Create MeetingContact association
     - Create Activity (type=meeting) for timeline
     - Increment BookingLink.currentBookings
     - COMMIT
   - Generate .ics file
   - Send confirmation email with .ics attachment
   - Return: confirmation details + calendar links
```

### 6.3 Race Condition Prevention

Double-booking can occur when two people try to book the same slot simultaneously. Multiple layers of protection:

**Layer 1: PostgreSQL Exclusion Constraint (Database Level)**

```sql
ALTER TABLE "Meeting" ADD CONSTRAINT no_overlapping_meetings
EXCLUDE USING gist (
  "organizerId" WITH =,
  tstzrange("startTime", "endTime") WITH &&
) WHERE ("status" != 'cancelled' AND "deletedAt" IS NULL);
```

This is the strongest guarantee. Even if application-level checks fail, the database will reject the second insert.

**Layer 2: Optimistic Check Before Insert (Application Level)**

```typescript
async function bookSlot(data: BookingData) {
  return await prisma.$transaction(async (tx) => {
    // Re-check availability within transaction
    const conflicts = await tx.meeting.count({
      where: {
        organizerId: data.organizerId,
        tenantId: data.tenantId,
        status: { in: ['scheduled', 'completed'] },
        deletedAt: null,
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });

    if (conflicts > 0) {
      throw new Error('SLOT_NO_LONGER_AVAILABLE');
    }

    // Create the meeting
    const meeting = await tx.meeting.create({ data: { ... } });
    return meeting;
  }, {
    isolationLevel: 'Serializable', // Strongest isolation
  });
}
```

**Layer 3: Token-Based Reservation (Optional, for high traffic)**

For very high-traffic booking pages, consider a short-lived reservation:

```
1. When user selects a slot: POST /api/booking/{slug}/reserve
   - Create a temporary hold (Redis key with TTL = 5 minutes)
   - Key: `reservation:{organizerId}:{startTime}` = reservationToken

2. When user submits the form: POST /api/booking/{slug}/confirm
   - Verify the reservationToken matches
   - If valid, create the meeting
   - Delete the reservation key

3. If TTL expires, the hold is automatically released
```

For the F-CORE MVP, Layers 1 + 2 are sufficient. Layer 3 is only needed at scale (thousands of bookings per minute on the same link).

---

## 7. API Route Design

### 7.1 Route Overview

| Method | Route                                 | Auth       | Purpose                         |
|--------|---------------------------------------|------------|----------------------------------|
| GET    | `/api/meetings`                       | Required   | List meetings (paginated)       |
| POST   | `/api/meetings`                       | Required   | Create a meeting manually       |
| GET    | `/api/meetings/[id]`                  | Required   | Get meeting details             |
| PATCH  | `/api/meetings/[id]`                  | Required   | Update meeting                  |
| DELETE | `/api/meetings/[id]`                  | Required   | Cancel meeting (soft)           |
| GET    | `/api/meeting-types`                  | Required   | List user's meeting types       |
| POST   | `/api/meeting-types`                  | Required   | Create a meeting type           |
| GET    | `/api/meeting-types/[id]`             | Required   | Get meeting type details        |
| PATCH  | `/api/meeting-types/[id]`             | Required   | Update meeting type             |
| DELETE | `/api/meeting-types/[id]`             | Required   | Deactivate meeting type         |
| GET    | `/api/booking-links`                  | Required   | List user's booking links       |
| POST   | `/api/booking-links`                  | Required   | Create a booking link           |
| PATCH  | `/api/booking-links/[id]`             | Required   | Update booking link             |
| DELETE | `/api/booking-links/[id]`             | Required   | Deactivate booking link         |
| GET    | `/api/availability`                   | Required   | Get user's available slots      |
| GET    | `/api/availability/schedules`         | Required   | Get user's schedules            |
| POST   | `/api/availability/schedules`         | Required   | Create availability schedule    |
| PATCH  | `/api/availability/schedules/[id]`    | Required   | Update schedule & rules         |
| GET    | `/api/booking/[slug]`                 | Public     | Get booking page data           |
| GET    | `/api/booking/[slug]/slots`           | Public     | Get available slots for date    |
| POST   | `/api/booking/[slug]`                 | Public     | Submit a booking                |
| POST   | `/api/meetings/[id]/cancel`           | Token/Auth | Cancel a meeting                |
| POST   | `/api/meetings/[id]/reschedule`       | Token/Auth | Reschedule a meeting            |

### 7.2 Zod Validation Schemas

```typescript
import { z } from 'zod';

// ---- Meeting Schemas ----

export const CreateMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string().datetime(), // ISO 8601
  endTime: z.string().datetime(),
  timezone: z.string().default('UTC'),
  location: z.string().max(500).optional(),
  locationUrl: z.string().url().optional(),
  meetingTypeId: z.string().uuid().optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(['organizer', 'required', 'optional']).default('required'),
  })).optional(),
  contactIds: z.array(z.string().uuid()).optional(),
  companyIds: z.array(z.string().uuid()).optional(),
  dealIds: z.array(z.string().uuid()).optional(),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'endTime must be after startTime',
});

export const UpdateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  timezone: z.string().optional(),
  location: z.string().max(500).optional(),
  locationUrl: z.string().url().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  outcome: z.string().optional(),
});

export const ListMeetingsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  organizerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['startTime', 'createdAt', 'title']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ---- Meeting Type Schemas ----

export const CreateMeetingTypeSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  durationOptions: z.array(z.number().int().min(5).max(480)).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().optional(),
  bufferBefore: z.number().int().min(0).max(120).default(0),
  bufferAfter: z.number().int().min(0).max(120).default(0),
  minNoticeMinutes: z.number().int().min(0).max(10080).default(60),
  maxDaysInAdvance: z.number().int().min(1).max(365).default(60),
  confirmationMessage: z.string().optional(),
  formFields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'email', 'phone', 'textarea', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
});

// ---- Booking Schemas ----

export const PublicBookingSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  startTime: z.string().datetime(),
  duration: z.number().int().min(5).max(480),
  timezone: z.string(),
  notes: z.string().max(2000).optional(),
  customFields: z.record(z.string()).optional(),
});

export const AvailabilitySlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string(),
  duration: z.coerce.number().int().min(5).max(480).optional(),
});

// ---- Availability Schemas ----

export const CreateAvailabilityScheduleSchema = z.object({
  name: z.string().min(1).max(255).default('Working Hours'),
  timezone: z.string(),
  isDefault: z.boolean().default(false),
  rules: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isEnabled: z.boolean().default(true),
  })),
});

export const CreateAvailabilityOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isAvailable: z.boolean(),
  reason: z.string().optional(),
});
```

### 7.3 Sample API Route Implementation

```typescript
// /api/meetings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { CreateMeetingSchema, ListMeetingsSchema } from '@/lib/validations/meeting';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = ListMeetingsSchema.parse(searchParams);

  const where = {
    tenantId: user.tenantId,
    deletedAt: null,
    ...(query.status && { status: query.status }),
    ...(query.organizerId && { organizerId: query.organizerId }),
    ...(query.startDate && { startTime: { gte: new Date(query.startDate) } }),
    ...(query.endDate && { startTime: { lte: new Date(query.endDate) } }),
    ...(query.contactId && {
      contacts: { some: { contactId: query.contactId } }
    }),
    ...(query.search && {
      title: { contains: query.search, mode: 'insensitive' }
    }),
  };

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        meetingType: { select: { id: true, name: true, color: true } },
        attendees: { select: { id: true, email: true, name: true, responseStatus: true } },
        _count: { select: { contacts: true, companies: true, deals: true } },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.meeting.count({ where }),
  ]);

  return NextResponse.json({
    data: meetings,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data = CreateMeetingSchema.parse(body);

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  // Check for conflicts
  const conflicts = await prisma.meeting.count({
    where: {
      tenantId: user.tenantId,
      organizerId: user.id,
      status: { in: ['scheduled', 'completed'] },
      deletedAt: null,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflicts > 0) {
    return NextResponse.json(
      { error: 'Time slot conflicts with an existing meeting' },
      { status: 409 }
    );
  }

  const meeting = await prisma.$transaction(async (tx) => {
    // Create the meeting
    const meeting = await tx.meeting.create({
      data: {
        tenantId: user.tenantId,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        timezone: data.timezone,
        duration,
        location: data.location,
        locationUrl: data.locationUrl,
        organizerId: user.id,
        meetingTypeId: data.meetingTypeId,
        source: 'manual',
        status: 'scheduled',
        createdBy: user.id,
        attendees: {
          create: [
            // Add organizer as attendee
            {
              email: user.email,
              name: user.name,
              role: 'organizer',
              isOrganizer: true,
              userId: user.id,
            },
            // Add other attendees
            ...(data.attendees || []).map(a => ({
              email: a.email,
              name: a.name,
              role: a.role,
            })),
          ],
        },
      },
      include: { attendees: true },
    });

    // Create CRM associations
    if (data.contactIds?.length) {
      await tx.meetingContact.createMany({
        data: data.contactIds.map(contactId => ({
          meetingId: meeting.id,
          contactId,
        })),
      });
    }
    if (data.companyIds?.length) {
      await tx.meetingCompany.createMany({
        data: data.companyIds.map(companyId => ({
          meetingId: meeting.id,
          companyId,
        })),
      });
    }
    if (data.dealIds?.length) {
      await tx.meetingDeal.createMany({
        data: data.dealIds.map(dealId => ({
          meetingId: meeting.id,
          dealId,
        })),
      });
    }

    // Create Activity for timeline
    const activity = await tx.activity.create({
      data: {
        tenantId: user.tenantId,
        type: 'meeting',
        subject: data.title,
        body: data.description,
        ownerId: user.id,
        meetingStart: startTime,
        meetingEnd: endTime,
        meetingLocation: data.location,
        attendees: data.attendees
          ? JSON.stringify(data.attendees.map(a => a.email))
          : null,
        contactId: data.contactIds?.[0],
        companyId: data.companyIds?.[0],
        dealId: data.dealIds?.[0],
      },
    });

    // Link activity to meeting
    await tx.meeting.update({
      where: { id: meeting.id },
      data: { activityId: activity.id },
    });

    return meeting;
  });

  return NextResponse.json({ data: meeting }, { status: 201 });
}
```

---

## 8. Real-time Features

### 8.1 Supabase Realtime Integration

Supabase Realtime uses PostgreSQL's logical replication to push database changes to connected clients via WebSockets.

**Use Cases for Meeting Scheduler:**

| Feature                        | Realtime Channel              | Event Type    |
|-------------------------------|-------------------------------|---------------|
| Meeting status changes         | `meetings:{tenantId}`         | UPDATE        |
| New meeting booked            | `meetings:{tenantId}`         | INSERT        |
| Meeting cancelled             | `meetings:{tenantId}`         | UPDATE        |
| Attendee response changes     | `meeting-attendees:{meetingId}` | UPDATE      |
| Availability updates          | `availability:{userId}`       | UPDATE/INSERT |

### 8.2 Client-Side Subscription

```typescript
// hooks/useMeetingRealtime.ts
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useMeetingRealtime(tenantId: string) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel(`meetings:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Meeting',
          filter: `tenantId=eq.${tenantId}`,
        },
        (payload) => {
          // Refresh server components to get updated data
          router.refresh();

          // Optionally show a toast notification
          if (payload.eventType === 'INSERT') {
            showToast(`New meeting: ${payload.new.title}`);
          }
          if (payload.eventType === 'UPDATE' && payload.new.status === 'cancelled') {
            showToast(`Meeting cancelled: ${payload.new.title}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router]);
}
```

### 8.3 Live Availability Updates

When a booking is made via a public booking page, other viewers of the same page should see the slot disappear:

```typescript
// On the public booking page
export function useBookingAvailability(slug: string, date: string) {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchSlots(slug, date).then(setSlots);

    // Subscribe to meeting changes for the booking link owner
    const channel = supabase
      .channel(`booking:${slug}`)
      .on('broadcast', { event: 'slot_update' }, (payload) => {
        // Re-fetch slots when a booking is made
        fetchSlots(slug, date).then(setSlots);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug, date]);

  return slots;
}
```

**Note:** For the public booking page, using Supabase Broadcast (not Postgres Changes) is recommended because:
- It does not expose database internals to unauthenticated users.
- The server broadcasts a generic "slots updated" event after a booking.
- Clients re-fetch slots via the API.

---

## 9. Notification System

### 9.1 Notification Types

| Trigger                  | Recipient(s)        | Channel        | Content                              |
|--------------------------|---------------------|----------------|--------------------------------------|
| Meeting booked           | Organizer           | Email          | "New meeting booked" + details       |
| Meeting booked           | Attendee(s)         | Email + .ics   | Calendar invite with .ics            |
| Meeting reminder         | All attendees       | Email          | "Your meeting starts in X minutes"   |
| Meeting cancelled        | All attendees       | Email + .ics   | Cancellation notice with .ics cancel |
| Meeting rescheduled      | All attendees       | Email + .ics   | Updated invite with new .ics         |
| Attendee response        | Organizer           | In-app         | "John accepted your meeting"         |

### 9.2 .ics File Generation

**Recommended Library: `ical-generator`**

- Weekly downloads: ~300K
- Full TypeScript support
- Supports: events, alarms, attendees, recurrence, timezones
- Actively maintained

```typescript
import ical, {
  ICalCalendarMethod,
  ICalAttendeeRole,
  ICalAttendeeStatus,
} from 'ical-generator';

export function generateMeetingICS(meeting: {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: string;
  locationUrl?: string;
  organizer: { name: string; email: string };
  attendees: Array<{ name?: string; email: string; status: string }>;
}): string {
  const calendar = ical({
    name: 'F-CORE Meeting',
    method: ICalCalendarMethod.REQUEST,
    prodId: { company: 'F-CORE', product: 'CRM', language: 'EN' },
  });

  const event = calendar.createEvent({
    id: meeting.id,
    start: meeting.startTime,
    end: meeting.endTime,
    timezone: meeting.timezone,
    summary: meeting.title,
    description: meeting.description,
    location: meeting.location,
    url: meeting.locationUrl,
    organizer: {
      name: meeting.organizer.name,
      email: meeting.organizer.email,
    },
  });

  // Add attendees
  for (const attendee of meeting.attendees) {
    event.createAttendee({
      email: attendee.email,
      name: attendee.name,
      role: ICalAttendeeRole.REQ,
      status: attendee.status === 'accepted'
        ? ICalAttendeeStatus.ACCEPTED
        : ICalAttendeeStatus.NEEDSACTION,
      rsvp: true,
    });
  }

  // Add a 15-minute reminder
  event.createAlarm({
    type: 'display',
    trigger: 15 * 60, // 15 minutes before
    description: `Reminder: ${meeting.title} starts in 15 minutes`,
  });

  return calendar.toString();
}
```

### 9.3 Email Sending with Calendar Invite

```typescript
import nodemailer from 'nodemailer';

export async function sendMeetingInvite(
  to: string,
  subject: string,
  htmlBody: string,
  icsContent: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"F-CORE" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html: htmlBody,
    alternatives: [
      {
        contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
        content: icsContent,
      },
    ],
    attachments: [
      {
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar',
      },
    ],
  });
}
```

### 9.4 Reminder Scheduling

**Approach: Database-driven with periodic cron job.**

```typescript
// Cron job: runs every 5 minutes
// File: /api/cron/meeting-reminders/route.ts

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 15 * 60 * 1000); // 15 min

  // Find meetings starting soon that have not been reminded
  const meetings = await prisma.meeting.findMany({
    where: {
      status: 'scheduled',
      deletedAt: null,
      startTime: { gte: now, lte: reminderWindow },
      NOT: { metadata: { path: ['reminderSent'], equals: true } },
    },
    include: {
      attendees: true,
      organizer: { select: { name: true, email: true } },
    },
  });

  for (const meeting of meetings) {
    // Send reminder emails to all attendees
    for (const attendee of meeting.attendees) {
      await sendReminderEmail(attendee.email, meeting);
    }

    // Mark as reminded
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        metadata: {
          ...(meeting.metadata as object),
          reminderSent: true,
          reminderSentAt: now.toISOString(),
        },
      },
    });
  }

  return NextResponse.json({ processed: meetings.length });
}
```

**Deployment Options for Cron:**
- **Vercel Cron Jobs:** Native support via `vercel.json` configuration.
- **Supabase Edge Functions with pg_cron:** Database-level scheduling.
- **External cron service:** e.g., cron-job.org, Upstash QStash.

---

## 10. External Calendar Integration

### 10.1 Google Calendar API

**Authentication Flow:**

```
1. User clicks "Connect Google Calendar" in F-CORE settings
2. Redirect to Google OAuth2 consent screen
   - Scopes: calendar.readonly, calendar.events
3. Google redirects back with authorization code
4. Exchange code for access_token + refresh_token
5. Store encrypted refresh_token in database
6. Use refresh_token to get new access_tokens as needed
```

**Key API Endpoints:**

| Endpoint                                    | Purpose                              |
|--------------------------------------------|--------------------------------------|
| `GET /calendars/primary/events`            | List events (free/busy check)        |
| `POST /calendars/primary/events`           | Create calendar event                |
| `PATCH /calendars/{id}/events/{eventId}`   | Update event                         |
| `DELETE /calendars/{id}/events/{eventId}`  | Delete event                         |
| `POST /freeBusy`                           | Batch free/busy query                |

**Free/Busy Query (Most Important for Scheduling):**

```typescript
import { google } from 'googleapis';

async function getGoogleFreeBusy(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const calendar = google.calendar({ version: 'v3' });

  const response = await calendar.freebusy.query({
    auth: new google.auth.OAuth2().setCredentials({
      access_token: accessToken,
    }),
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: 'primary' }],
    },
  });

  const busy = response.data.calendars?.primary?.busy || [];
  return busy.map(b => ({
    start: new Date(b.start!),
    end: new Date(b.end!),
  }));
}
```

**Integration into Availability Algorithm:**

When Google Calendar is connected, modify step 3e of the availability algorithm:

```
e. FILTER out conflicts:
   - Load existing F-CORE meetings for this user (as before)
   - ALSO load Google Calendar free/busy for this date range
   - Merge both lists of busy periods
   - Remove slots that overlap with any busy period
```

### 10.2 Microsoft Graph API (Outlook/Office 365)

**Authentication:**
- Uses OAuth2 with Microsoft Entra ID (Azure AD)
- Scopes: `Calendars.ReadWrite`
- Client credentials flow for service-to-service; delegated flow for user context

**Key Endpoints:**

| Endpoint                                    | Purpose                              |
|--------------------------------------------|--------------------------------------|
| `GET /me/calendarview`                     | List events in a date range          |
| `POST /me/events`                          | Create calendar event                |
| `GET /me/calendar/getSchedule`             | Free/busy query                      |
| `PATCH /me/events/{id}`                    | Update event                         |
| `DELETE /me/events/{id}`                   | Delete event                         |

**Free/Busy Query:**

```typescript
import { Client } from '@microsoft/microsoft-graph-client';

async function getOutlookFreeBusy(
  accessToken: string,
  userEmail: string,
  startTime: Date,
  endTime: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const response = await client.api('/me/calendar/getSchedule').post({
    schedules: [userEmail],
    startTime: { dateTime: startTime.toISOString(), timeZone: 'UTC' },
    endTime: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
    availabilityViewInterval: 15,
  });

  const schedule = response.value?.[0];
  const busyItems = schedule?.scheduleItems?.filter(
    (item: any) => item.status !== 'free'
  ) || [];

  return busyItems.map((item: any) => ({
    start: new Date(item.start.dateTime),
    end: new Date(item.end.dateTime),
  }));
}
```

### 10.3 Calendar Credential Storage

```prisma
model CalendarConnection {
  id            String    @id @default(uuid())
  tenantId      String
  userId        String

  provider      String    // "google" | "microsoft"
  email         String    // Calendar account email
  accessToken   String    // Encrypted
  refreshToken  String    // Encrypted
  tokenExpiresAt DateTime?
  calendarId    String?   // Primary calendar ID
  isActive      Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  user          User      @relation(fields: [userId], references: [id])

  @@index([tenantId, userId])
  @@unique([userId, provider, email])
}
```

**Security Note:** Access tokens and refresh tokens must be encrypted at rest. Use AES-256-GCM encryption with a server-side key stored in environment variables.

---

## 11. Performance Considerations

### 11.1 Efficient Slot Computation

**Problem:** Computing available slots for a month view requires checking availability + conflicts for 30 days.

**Solution: Batch query + in-memory computation.**

```typescript
async function getSlotsForDateRange(
  userId: string,
  tenantId: string,
  startDate: Date,
  endDate: Date,
  meetingType: MeetingType,
  timezone: string
): Promise<Map<string, Slot[]>> {
  // Single query: get all meetings in the range
  const meetings = await prisma.meeting.findMany({
    where: {
      tenantId,
      organizerId: userId,
      status: { in: ['scheduled', 'completed'] },
      deletedAt: null,
      startTime: { lt: endDate },
      endTime: { gt: startDate },
    },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: 'asc' },
  });

  // Single query: get availability schedule with all rules + overrides
  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId, tenantId, isDefault: true },
    include: {
      rules: true,
      overrides: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
      },
    },
  });

  // In-memory: compute slots day by day
  const slotsByDate = new Map<string, Slot[]>();
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate, 'yyyy-MM-dd');
    const daySlots = computeSlotsForDay(
      currentDate,
      schedule,
      meetings,
      meetingType,
      timezone
    );
    slotsByDate.set(dateStr, daySlots);
    currentDate = addDays(currentDate, 1);
  }

  return slotsByDate;
}
```

This approach uses only 2 database queries regardless of the date range length.

### 11.2 Caching Strategy

| Data                    | Cache Location    | TTL        | Invalidation              |
|-------------------------|-------------------|------------|---------------------------|
| Availability schedule   | In-memory (React) | 5 minutes  | On schedule update        |
| Available slots         | None (compute)    | N/A        | Always fresh              |
| Meeting list            | SWR/React Query   | 30 seconds | Realtime subscription     |
| Meeting type config     | In-memory          | 10 minutes | On type update            |
| Google free/busy        | Server (Redis)    | 2 minutes  | On new booking            |

**Why NOT cache available slots:** Slot availability changes frequently (new bookings, cancellations). Serving stale slot data leads to booking failures. It is better to compute fresh and use the database exclusion constraint as the safety net.

### 11.3 Calendar Rendering Optimization

For the calendar UI component:

1. **Virtualization:** Only render visible weeks/days. Use `react-virtualized` or `@tanstack/virtual` for month views with many events.

2. **Lazy loading:** Load events for visible date range only. When the user navigates to a new month, fetch that month's data.

3. **Debounced navigation:** When the user rapidly clicks through months, debounce the API calls to avoid flooding the server.

4. **Optimistic updates:** When creating/updating/cancelling a meeting, update the UI immediately before the server responds.

### 11.4 Pagination for Meeting Lists

```typescript
// Cursor-based pagination for better performance on large datasets
const ListMeetingsCursorSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
});

// Usage in query:
const meetings = await prisma.meeting.findMany({
  where: { tenantId, deletedAt: null },
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  take: limit,
  orderBy: { startTime: 'asc' },
});
```

---

## 12. Library & Dependency Decisions

### 12.1 Date/Time Library

| Library   | Size (min+gzip) | TZ Support     | DST Handling | Tree-shake | Recommendation     |
|-----------|-----------------|----------------|-------------|------------|---------------------|
| date-fns  | ~6KB per fn     | Via date-fns-tz| Partial     | Excellent  | For simple ops      |
| dayjs     | ~2KB            | Via plugin     | Buggy       | Good       | Not for scheduling  |
| luxon     | ~23KB           | Built-in       | Excellent   | No         | **Recommended**     |
| Temporal  | Native          | Built-in       | Excellent   | N/A        | Not yet stable      |

**Decision: Use Luxon for all timezone-sensitive scheduling logic.**

**Rationale:**
- Day.js has known DST bugs (confirmed in GitHub issues since 2020, still unresolved).
- Luxon is built on the Intl API and IANA timezone database, providing correct DST handling.
- For a scheduling system, timezone correctness is non-negotiable.
- The 23KB bundle size is acceptable for a CRM application.
- date-fns can be used alongside Luxon for simple formatting tasks on the client.

```typescript
// Example: Convert availability rule to UTC for a specific date
import { DateTime } from 'luxon';

function availabilityToUTC(
  date: string,     // "2026-02-09"
  startTime: string, // "09:00"
  timezone: string   // "Asia/Ho_Chi_Minh"
): { start: Date; end: Date } {
  const dt = DateTime.fromISO(`${date}T${startTime}`, { zone: timezone });
  return {
    start: dt.toUTC().toJSDate(),
    end: dt.toUTC().toJSDate(),
  };
}
```

### 12.2 ICS Generation

| Library          | Downloads/week | TS Support | Maintained | Features              |
|------------------|----------------|------------|------------|------------------------|
| ical-generator   | ~300K          | Native     | Active     | Full RFC 5545          |
| ics              | ~1.5M          | .d.ts      | Active     | Simpler API            |
| ical-gen         | ~500           | Native     | New        | Lightweight fork       |

**Decision: Use `ical-generator`.**

**Rationale:**
- Native TypeScript
- Full RFC 5545 support (alarms, attendees, recurrence, timezones)
- Works with Luxon and dayjs datetime objects
- Supports `METHOD:REQUEST` for calendar invites (required for Outlook)
- Well-documented

### 12.3 Recurrence (Post-MVP)

**Decision: Use `rrule` (rrule.js) when implementing recurrence.**

```
npm install rrule
```

- 1.2M weekly downloads
- Full RFC 5545 RRULE support
- `.between(start, end)` for efficient range computation
- `.toText()` for human-readable description
- TypeScript support

### 12.4 Additional Dependencies

| Package               | Purpose                          | Phase    |
|------------------------|----------------------------------|----------|
| luxon                  | Timezone handling                | MVP      |
| ical-generator         | .ics file generation             | MVP      |
| nodemailer             | Email sending                    | MVP      |
| zod                    | Request validation               | MVP      |
| googleapis             | Google Calendar API              | Phase 2  |
| @microsoft/microsoft-graph-client | Microsoft Graph API   | Phase 3  |
| rrule                  | Recurrence pattern handling      | Phase 3  |

---

## 13. Implementation Roadmap

### Phase 1: MVP Core (Sprint N, ~2 weeks)

**Goal:** Users can manually create meetings, view them on a calendar, and link them to CRM records.

| Task | Priority | Estimate | Dependencies |
|------|----------|----------|--------------|
| Prisma schema migration (all meeting models) | P0 | 1d | None |
| DB exclusion constraint migration | P0 | 0.5d | Schema |
| Meeting CRUD API routes | P0 | 2d | Schema |
| Meeting list page (table view) | P0 | 1.5d | API |
| Meeting detail/edit modal | P0 | 1d | API |
| Create meeting form | P0 | 1.5d | API |
| Activity timeline integration | P0 | 1d | Meeting CRUD |
| CRM association (Contact/Company/Deal) | P0 | 1d | Meeting CRUD |
| Zod validation schemas | P0 | 0.5d | None |
| Calendar view component (basic) | P1 | 2d | Meeting list |

**Deliverables:**
- Meeting CRUD with CRM associations
- Meeting list page with filtering
- Basic calendar view (month/week/day)
- Meetings appear on Contact/Company/Deal timelines

### Phase 2: Availability & Booking (Sprint N+1, ~2 weeks)

**Goal:** Users can set availability, create booking links, and external prospects can book meetings.

| Task | Priority | Estimate | Dependencies |
|------|----------|----------|--------------|
| Availability schedule CRUD | P0 | 1.5d | Schema |
| Availability rules + overrides UI | P0 | 2d | Schedule CRUD |
| Meeting type CRUD | P0 | 1.5d | Schema |
| Booking link management | P0 | 1d | Meeting types |
| Slot generation algorithm | P0 | 2d | Availability |
| Public booking page | P0 | 2d | Slot generation |
| Double-booking prevention | P0 | 0.5d | Booking |
| .ics file generation | P0 | 0.5d | Meeting creation |
| Booking confirmation email | P0 | 1d | .ics gen |

**Deliverables:**
- Users can set their weekly availability
- Meeting types with customizable settings
- Shareable booking links
- Public booking page with slot selection
- Email confirmation with calendar invite

### Phase 3: Notifications & Polish (Sprint N+2, ~1 week)

**Goal:** Email reminders, meeting status management, real-time updates.

| Task | Priority | Estimate | Dependencies |
|------|----------|----------|--------------|
| Meeting reminder cron job | P1 | 1d | Email setup |
| Cancellation flow + email | P1 | 1d | .ics cancel |
| Reschedule flow | P1 | 1d | Booking |
| Supabase Realtime integration | P1 | 1d | Meetings |
| Meeting outcome tracking | P2 | 0.5d | Meeting detail |
| Buffer time enforcement | P1 | 0.5d | Slot algorithm |

**Deliverables:**
- Email reminders before meetings
- Cancel and reschedule functionality
- Real-time meeting updates in UI

### Phase 4: External Calendar Sync (Sprint N+3, ~2 weeks)

**Goal:** Connect Google Calendar for free/busy checking and event sync.

| Task | Priority | Estimate | Dependencies |
|------|----------|----------|--------------|
| CalendarConnection model + migration | P1 | 0.5d | Schema |
| Google OAuth2 flow | P1 | 2d | Google Cloud setup |
| Google free/busy integration | P1 | 1.5d | OAuth |
| Merge external busy times into slots | P1 | 1d | Free/busy |
| Create Google Calendar event on booking | P2 | 1d | OAuth |
| Bi-directional sync architecture | P2 | 2d | Events API |
| Microsoft Graph OAuth2 (stretch) | P3 | 2d | Azure setup |

**Deliverables:**
- "Connect Google Calendar" in settings
- Booking slots reflect Google Calendar availability
- New meetings create Google Calendar events

### Phase 5: Advanced Features (Future Sprints)

| Feature | Complexity | Dependencies |
|---------|-----------|--------------|
| Round-robin team scheduling | High | Team model |
| Group meeting availability | High | Multi-user availability |
| Recurring meetings (RRULE) | High | rrule.js |
| Embedded booking widget | Medium | Iframe/web component |
| Meeting analytics dashboard | Medium | Reporting infrastructure |
| Payment collection on booking | Medium | Stripe integration |
| Custom booking form builder | Medium | Form engine |
| Video conferencing integration | Medium | Zoom/Meet API |

---

## 14. Decision Log

### Decision 1: Separate Meeting Model vs Extending Activity

| Option | Pros | Cons |
|--------|------|------|
| **A: Separate Meeting model + Activity link** | Rich data model, proper relations, dedicated indexes, clean separation of concerns | Some data duplication, need to keep in sync |
| B: Extend Activity model | Single source of truth, simpler schema | Activity becomes bloated, harder to query meeting-specific data, mixed concerns |

**Decision: Option A - Separate Meeting model linked to Activity.**

**Rationale:** The Activity model is a generic timeline entry. Meetings require rich scheduling data (attendees with RSVP, availability rules, booking links, recurrence) that does not belong in a generic activity table. The Activity record serves as the timeline entry; the Meeting record is the operational model.

### Decision 2: Luxon Over Day.js for Timezone Handling

**Decision: Luxon for all timezone-critical operations.**

**Rationale:** Day.js has confirmed DST bugs that have been open since 2020. For a scheduling application, incorrect timezone conversion means meetings at the wrong time. Luxon uses the Intl API and handles DST transitions correctly. The ~23KB additional bundle size is an acceptable trade-off for correctness.

### Decision 3: Database-Level Double-Booking Prevention

**Decision: Use PostgreSQL exclusion constraint with `tstzrange` AND application-level checks.**

**Rationale:**
- Application-level checks alone are vulnerable to race conditions under concurrent requests.
- The exclusion constraint provides an atomic, database-level guarantee.
- Even if two concurrent requests pass the application check, only one INSERT will succeed.
- Prisma does not support exclusion constraints declaratively, so this requires a raw SQL migration. This is an acceptable trade-off.

### Decision 4: Wall-Clock Strings for Availability Rules

**Decision: Store availability times as strings ("09:00") rather than DateTime.**

**Rationale:**
- Availability rules represent recurring wall-clock times: "I am available 9 AM to 5 PM every Monday."
- This is a timezone-relative concept, not a UTC instant.
- Storing "09:00" + timezone is simpler and more correct than storing a DateTime and converting.
- When computing slots for a specific date, we combine the date + time string + timezone to get the UTC instant.

### Decision 5: Defer Recurring Meetings to Post-MVP

**Decision: No RRULE-based recurrence in MVP.**

**Rationale:**
- Recurring meetings require exception handling (modify single instance, delete single instance).
- The RRULE specification is complex (RFC 5545).
- MVP users can create individual meetings. Series support is a nice-to-have.
- When implemented, the plan is to store the RRULE string and compute occurrences on-the-fly with rrule.js.

### Decision 6: ical-generator Over ics for ICS Generation

**Decision: Use `ical-generator` library.**

**Rationale:**
- Native TypeScript (vs `.d.ts` type definitions for `ics`)
- Supports `METHOD:REQUEST` which is critical for Outlook to recognize emails as calendar invites
- Works with Luxon DateTime objects
- Full RFC 5545 support including alarms and attendees

### Decision 7: Supabase Broadcast for Public Booking Real-time

**Decision: Use Supabase Broadcast (not Postgres Changes) for the public booking page.**

**Rationale:**
- Postgres Changes exposes database structure to clients.
- Public booking pages are unauthenticated.
- Broadcast allows the server to emit a simple "slots_updated" event without leaking data.
- Clients re-fetch via the API to get fresh slot data.

### Decision 8: Cron-based Reminders Over Queue

| Option | Pros | Cons |
|--------|------|------|
| **A: Cron job (every 5 min)** | Simple, no infrastructure needed, Vercel Cron support | Up to 5-min delay, scale limit |
| B: Message queue (BullMQ/Redis) | Precise timing, scalable | Additional infrastructure, complexity |
| C: Supabase Edge Function + pg_cron | Database-native, no external service | Limited runtime, debugging harder |

**Decision: Option A - Cron job for MVP. Migrate to queue if needed.**

**Rationale:** For MVP scale (dozens of meetings per day), a cron job running every 5 minutes is sufficient. A 5-minute reminder precision window (send reminders 10-15 minutes before) is acceptable. If the system grows to handle thousands of daily meetings, migrating to a queue is straightforward.

---

## Appendix A: Reference Architecture Diagram

```
+-----------------------------------------------------------------------+
|                      F-CORE Meeting Scheduler                         |
+-----------------------------------------------------------------------+
|                                                                       |
|  +-------------+     +-----------------+     +--------------------+   |
|  |   Next.js   |     |   API Routes    |     |   Public Booking   |   |
|  |  Dashboard  |     |  /api/meetings  |     |   /book/{slug}     |   |
|  |  (Auth'd)   |     |  /api/avail...  |     |   (No auth)        |   |
|  +------+------+     +--------+--------+     +----------+---------+   |
|         |                     |                          |            |
|  +------v---------------------v--------------------------v--------+   |
|  |                     Service Layer                              |   |
|  |                                                                |   |
|  |  +-------------+  +--------------+  +----------------------+  |   |
|  |  |  Meeting    |  | Availability |  |  Booking             |  |   |
|  |  |  Service    |  | Service      |  |  Service             |  |   |
|  |  |             |  |              |  |                      |  |   |
|  |  | - CRUD      |  | - Schedule   |  | - Slot generation    |  |   |
|  |  | - Conflict  |  | - Rules      |  | - Double-book prev.  |  |   |
|  |  | - Timeline  |  | - Overrides  |  | - Contact creation   |  |   |
|  |  +------+------+  +------+-------+  +----------+-----------+  |   |
|  |         |                |                      |              |   |
|  +---------+----------------+----------------------+--------------+   |
|            |                |                      |                  |
|  +---------v----------------v----------------------v--------------+   |
|  |                     Prisma ORM + PostgreSQL                    |   |
|  |                                                                |   |
|  |  Meeting | MeetingAttendee | MeetingType | BookingLink         |   |
|  |  AvailabilitySchedule | AvailabilityRule | AvailabilityOverride|   |
|  |  MeetingContact | MeetingCompany | MeetingDeal                |   |
|  |                                                                |   |
|  |  EXCLUSION CONSTRAINT (tstzrange) for double-booking prevent.  |   |
|  +----------------------------------------------------------------+   |
|                                                                       |
|  +---------------------------------------------------------------+   |
|  |                     External Integrations                      |   |
|  |                                                                |   |
|  |  +--------------+  +---------------+  +-------------------+   |   |
|  |  | Google       |  | Microsoft     |  | Email (SMTP)      |   |   |
|  |  | Calendar API |  | Graph API     |  | + ical-generator  |   |   |
|  |  | (Phase 4)    |  | (Phase 4+)    |  | (Phase 2)         |   |   |
|  |  +--------------+  +---------------+  +-------------------+   |   |
|  +---------------------------------------------------------------+   |
|                                                                       |
|  +---------------------------------------------------------------+   |
|  |                     Real-time Layer                            |   |
|  |                                                                |   |
|  |  Supabase Realtime                                            |   |
|  |  - Postgres Changes: Meeting INSERT/UPDATE/DELETE             |   |
|  |  - Broadcast: Public booking page slot updates                |   |
|  |  - Presence: (future) live user indicators                    |   |
|  +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
```

---

## Appendix B: File Structure Proposal

```
src/
  app/
    (dashboard)/
      meetings/
        page.tsx                    # Meeting list/calendar view
        new/
          page.tsx                  # Create meeting form
        [id]/
          page.tsx                  # Meeting detail
        types/
          page.tsx                  # Meeting type management
          [id]/
            page.tsx                # Edit meeting type
        booking-links/
          page.tsx                  # Booking link management
        availability/
          page.tsx                  # Availability schedule
    book/
      [slug]/
        page.tsx                    # Public booking page
    api/
      meetings/
        route.ts                    # GET list, POST create
        [id]/
          route.ts                  # GET, PATCH, DELETE
      meeting-types/
        route.ts                    # GET list, POST create
        [id]/
          route.ts                  # GET, PATCH, DELETE
      booking-links/
        route.ts                    # GET list, POST create
        [id]/
          route.ts                  # PATCH, DELETE
      availability/
        route.ts                    # GET available slots
        schedules/
          route.ts                  # GET, POST schedules
          [id]/
            route.ts                # PATCH schedule
      booking/
        [slug]/
          route.ts                  # GET page data, POST submit
          slots/
            route.ts                # GET available slots
      cron/
        meeting-reminders/
          route.ts                  # Cron job for reminders
  components/
    meetings/
      MeetingList.tsx               # Table view of meetings
      MeetingCalendar.tsx           # Calendar view component
      MeetingCard.tsx               # Meeting card for lists
      MeetingForm.tsx               # Create/edit meeting form
      MeetingDetail.tsx             # Meeting detail view
      MeetingTypeCard.tsx           # Meeting type card
      MeetingTypeForm.tsx           # Meeting type form
      BookingLinkCard.tsx           # Booking link card
      AvailabilityEditor.tsx        # Weekly availability editor
      AvailabilityOverrideModal.tsx # Date override modal
      BookingPage.tsx               # Public booking page UI
      SlotPicker.tsx                # Time slot selection
      BookingForm.tsx               # Booking form for prospects
      BookingConfirmation.tsx       # Booking confirmation view
  lib/
    meetings/
      availability.ts              # Slot computation algorithm
      conflicts.ts                 # Conflict detection
      ics-generator.ts             # ICS file generation
      notifications.ts             # Meeting notification helpers
    validations/
      meeting.ts                   # Zod schemas
  hooks/
    useMeetings.ts                 # Meeting data fetching
    useMeetingRealtime.ts          # Realtime subscription
    useAvailability.ts             # Availability management
```

---

## Appendix C: Glossary

| Term                  | Definition                                                    |
|-----------------------|---------------------------------------------------------------|
| Availability Schedule | A user's weekly recurring availability pattern                |
| Availability Rule     | A single day-of-week time window (e.g., Mon 9-5)            |
| Availability Override | A date-specific exception (holiday, PTO, special hours)      |
| Booking Link          | A shareable URL that allows external users to book meetings  |
| Meeting Type          | A template defining meeting parameters (duration, buffer)    |
| Buffer Time           | Enforced gap before/after a meeting                           |
| Minimum Notice        | Minimum lead time required to book (e.g., 1 hour ahead)     |
| Exclusion Constraint  | PostgreSQL feature preventing overlapping time ranges        |
| RRULE                 | iCalendar recurrence rule (RFC 5545)                         |
| Free/Busy             | Calendar availability data (time blocks marked busy/free)    |
| ICS                   | iCalendar file format for calendar events                    |
| IANA Timezone         | Standard timezone identifier (e.g., America/New_York)        |
| Slot                  | An available time window that can be booked                  |
| DST                   | Daylight Saving Time                                         |
| GiST                  | Generalized Search Tree (PostgreSQL index type)              |

---

*This document should be referenced before and during implementation of the meeting scheduler feature.*
*Last updated: 2026-02-08*
