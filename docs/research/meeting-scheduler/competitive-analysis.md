# Meeting Scheduler - Competitive Analysis
> Feature: Meeting Scheduler (#7)
> Date: 2026-02-08
> Sources: HubSpot, Calendly, Salesforce, Pipedrive

---

## 1. HubSpot Meetings Tool (Primary Reference)

### Core Features
- **Booking Pages**: Customizable scheduling pages with company branding
- **Meeting Types**: 1-on-1, Group, Round Robin (auto-assign to team members)
- **Calendar Sync**: Google Calendar, Office 365, Exchange bi-directional sync
- **CRM Integration**: Automatically creates contact + activity records on booking
- **Timezone Auto-detect**: Detects visitor timezone, shows times in their local timezone
- **Buffer Times**: Configurable gaps between meetings (15min, 30min, etc.)
- **Working Hours**: Define availability windows per day of week
- **Embed Options**: Inline embed, popup widget, direct link
- **Reminders**: Email reminders before meeting (customizable timing)
- **Confirmation Page**: Custom redirect or thank-you page after booking

### Meeting Types Detail
| Type | Description | Use Case |
|------|-------------|----------|
| One-on-One | Single host, one invitee | Sales demos, consultations |
| Group | One host, multiple invitees same slot | Webinars, group demos |
| Round Robin | Multiple hosts, system picks available one | Sales team rotation |

### Booking Page Structure
1. Meeting type selection (duration options)
2. Calendar date picker (month view)
3. Time slot grid (15/30/60 min intervals)
4. Attendee info form (name, email, company, custom fields)
5. Confirmation + calendar invite

### CRM Activity Creation
On booking: Creates Activity (type: "meeting") with:
- subject, startTime, endTime
- Associated contact (creates if new)
- Associated company (domain lookup)
- Meeting link (Zoom/Google Meet/Teams)

---

## 2. Calendly

### Differentiators from HubSpot
- **Event Types**: More granular (one-off, recurring, collective, round robin)
- **Routing Forms**: Pre-booking survey to route to correct meeting type
- **Workflows**: Automated emails/SMS before and after meetings
- **Analytics Dashboard**: Booking rates, popular times, cancellation rates
- **Team Pages**: Branded team scheduling page showing all available members
- **Availability Presets**: Save and reuse availability configurations

### Technical Implementation Notes
- **Slug-based URLs**: `calendly.com/{user}/{event-type-slug}`
- **API-first**: REST API for event types, scheduled events, webhooks
- **Webhook Events**: `invitee.created`, `invitee.canceled`, `routing_form_submission.created`
- **Embed SDK**: JavaScript SDK with inline, popup, and popup-text modes

---

## 3. Salesforce Scheduler

### Key Features
- **Lightning Scheduler**: Built into Salesforce Service/Sales Cloud
- **Resource-based**: Assigns meetings to "Service Resources" (users)
- **Territory-aware**: Considers geographic territories for in-person meetings
- **Flow Integration**: Embeddable in Salesforce Flows for guided booking
- **Multi-resource**: Can book meetings requiring multiple participants

### Data Model
- ServiceAppointment (the meeting itself)
- ServiceResource (the host)
- ServiceTerritory (location/region)
- WorkType (meeting type/duration)
- TimeSlot (available windows)

---

## 4. Pipedrive Scheduler

### Key Features
- **Simple Setup**: Minimal configuration to get a booking link
- **Gmail Integration**: Insert availability directly from Gmail compose
- **Deal Association**: Meetings auto-linked to deals in pipeline
- **Video Integration**: Built-in Zoom/Teams/Google Meet links
- **Availability Proposals**: Send specific time slots via email

### Notable UX
- Two usage modes: "Propose Times" (pick specific slots) vs "Share Link" (full availability)
- Integration into email workflow (compose mode)
- Automatic deal/contact association based on email address

---

## 5. Feature Comparison Matrix

| Feature | HubSpot | Calendly | Salesforce | Pipedrive | F-CORE (Target) |
|---------|---------|----------|------------|-----------|-----------------|
| Booking Pages | Yes | Yes | Yes | Yes | **Yes** |
| 1-on-1 Meetings | Yes | Yes | Yes | Yes | **Yes** |
| Group Meetings | Yes | Yes | Limited | No | **Phase 2** |
| Round Robin | Yes | Yes | Yes | No | **Phase 2** |
| Calendar Sync | G/O365 | G/O365/iCal | Salesforce | G/O365 | **Simulated** |
| CRM Auto-create | Yes | Via integration | Native | Yes | **Yes** |
| Timezone Detection | Yes | Yes | Yes | Yes | **Yes** |
| Buffer Times | Yes | Yes | No | No | **Yes** |
| Custom Form Fields | Yes | Yes | Via Flows | Limited | **Yes** |
| Embed Widget | Yes | Yes | Via Flows | No | **Phase 2** |
| Video Meeting Links | Yes | Yes | Yes | Yes | **Simulated** |
| Email Reminders | Yes | Yes | Yes | Yes | **Phase 2** |
| Analytics | Basic | Advanced | Reports | Basic | **Phase 2** |

---

## 6. Key Takeaways for F-CORE Implementation

### Must-Have (MVP)
1. **Meeting Types CRUD** - Create/manage different meeting types with duration
2. **Booking Pages** - Public-facing pages for external booking
3. **Availability Management** - Set working hours and availability windows
4. **Time Slot Generation** - Calculate available slots from availability config
5. **CRM Association** - Auto-create contact and activity on booking
6. **Timezone Handling** - Display times in visitor's local timezone

### Nice-to-Have (Phase 2)
1. Round Robin assignment
2. Calendar sync (Google/O365)
3. Email reminders/confirmations
4. Embed widgets
5. Booking analytics

### Architecture Decisions
- **Slug-based URLs** like Calendly: `/meetings/{userId}/{meetingTypeSlug}`
- **Availability as weekly schedule**: Store day-of-week + start/end time
- **PostgreSQL for overlap prevention**: Use application-level checks (not EXCLUDE constraints since Prisma doesn't support them directly)
- **Meeting = Activity with type "meeting"**: Reuse existing Activity model + dedicated Meeting/MeetingType models
