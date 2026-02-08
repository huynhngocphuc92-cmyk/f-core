# Meeting Scheduler - UX Patterns Analysis
> Feature: Meeting Scheduler (#7)
> Date: 2026-02-08
> Sources: Smashing Magazine, Eleken, Storyly, UX Movement, FullCalendar

---

## 1. Booking Page Flow (Visitor Side)

### Recommended Step-by-Step Flow
```
Step 1: Landing Page
  - Meeting title & description
  - Host avatar + name
  - Duration badges (15min, 30min, 60min)
  - Company branding

Step 2: Date Selection
  - Month calendar view
  - Available dates highlighted
  - Unavailable dates grayed out
  - Today marker

Step 3: Time Slot Selection
  - Grid of available time slots
  - 15/30min intervals
  - Timezone auto-detected + changeable
  - Slots shown in visitor's local time

Step 4: Attendee Information
  - Name (required)
  - Email (required)
  - Company (optional)
  - Custom questions
  - Notes/message field

Step 5: Confirmation
  - Meeting summary (date, time, duration)
  - Add to calendar buttons (Google, Outlook, iCal)
  - Confirmation email sent
```

### Key UX Principles
- **Progressive disclosure**: Show one step at a time
- **Max 6 taps**: Date+time selection should take no more than 6 interactions
- **Instant feedback**: Show loading states during availability checks
- **Error prevention**: Disable unavailable dates/times rather than showing errors

---

## 2. Time Picker Patterns

### Pattern A: Time Slot Grid (Recommended for F-CORE)
```
Available Times for Feb 12, 2026:

  [  9:00 AM  ]  [  9:30 AM  ]  [ 10:00 AM  ]
  [ 10:30 AM  ]  [ 11:00 AM  ]  [ 11:30 AM  ]
  [  1:00 PM  ]  [  1:30 PM  ]  [  2:00 PM  ]
  [  2:30 PM  ]  [  3:00 PM  ]  [  3:30 PM  ]
```

**Pros**: Quick scanning, clear availability, mobile-friendly tap targets
**Cons**: Many slots can be overwhelming
**Best for**: Fixed-interval booking (our use case)

### Pattern B: Dropdown Time Selector
- Good for standard intervals
- Familiar to users
- Slower on mobile (scroll-heavy)

### Pattern C: Inline Calendar with Slots
- HubSpot/Calendly style: Calendar on left, slots on right
- Desktop: Side-by-side layout
- Mobile: Stacked vertically (calendar above, slots below)

---

## 3. Date Picker Best Practices

### Calendar Component Requirements
- **Month navigation**: Previous/Next arrows
- **Available date highlighting**: Use brand color for available dates
- **Today indicator**: Circle or dot marker
- **Disabled states**: Gray out past dates and fully-booked dates
- **Week start**: Configurable (Monday vs Sunday based on locale)
- **Date range**: Only show next 30-60 days of availability

### Mobile Considerations
- Minimum 44px touch target for date cells
- Swipe gesture for month navigation
- Avoid native date picker (poor UX per UX Movement research)
- Use chip/button-style selection instead of scroll wheels

---

## 4. Timezone UX

### Best Practices (Smashing Magazine / Grafana pattern)
1. **Auto-detect**: Use `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. **Show detected timezone**: Display "Times shown in Pacific Time (PST)"
3. **Allow override**: Dropdown to change timezone
4. **Search by city**: "Search: Ho Chi Minh City, Tokyo, New York..."
5. **Show UTC offset**: "UTC+7 (Ho Chi Minh City)"
6. **Persist preference**: Save in localStorage/cookie

### Implementation
```typescript
// Auto-detect timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// "Asia/Ho_Chi_Minh" -> Display: "Ho Chi Minh City (UTC+7)"

// Convert slot times for display
const displayTime = new Date(slotUTC).toLocaleTimeString('en-US', {
  timeZone: userTimezone,
  hour: '2-digit',
  minute: '2-digit'
});
```

---

## 5. Admin-Side UX (Meeting Management)

### Meeting Types List Page
```
+-----------------------------------------------------------+
| Meeting Types                            [+ Create New]   |
+-----------------------------------------------------------+
| +-------------------------------------------------------+ |
| | Product Demo                       30 min    Active    | |
| | meetings.f-core.com/john/product-demo                 | |
| | [Copy Link]  [Preview]  [Edit]  [...]                 | |
| +-------------------------------------------------------+ |
| +-------------------------------------------------------+ |
| | Quick Chat                         15 min    Active    | |
| | meetings.f-core.com/john/quick-chat                   | |
| | [Copy Link]  [Preview]  [Edit]  [...]                 | |
| +-------------------------------------------------------+ |
+-----------------------------------------------------------+
```

### Availability Configuration
```
Working Hours
+------------------------------------------+
| Monday      [x]  09:00 AM - 05:00 PM    |
| Tuesday     [x]  09:00 AM - 05:00 PM    |
| Wednesday   [x]  09:00 AM - 05:00 PM    |
| Thursday    [x]  09:00 AM - 05:00 PM    |
| Friday      [x]  09:00 AM - 04:00 PM    |
| Saturday    [ ]  Unavailable             |
| Sunday      [ ]  Unavailable             |
+------------------------------------------+

Buffer Time:  [15 min v]  between meetings
Min Notice:   [4 hours v] before meeting
Max Advance:  [30 days v] in the future
```

### Upcoming Meetings View
- List/calendar toggle view
- Sort by date (upcoming first)
- Status indicators: Scheduled, Completed, Cancelled, No-show
- Quick actions: Reschedule, Cancel, Add notes
- Associated CRM records (contact, company, deal)

---

## 6. Booking Confirmation Page

### Essential Elements
1. Success icon/animation
2. Meeting summary card (title, date, time, duration, timezone)
3. Host information (name, avatar)
4. "Add to Calendar" buttons:
   - Google Calendar (opens gcal URL)
   - Outlook (.ics download)
   - Apple Calendar (.ics download)
5. "Need to reschedule?" link
6. Confirmation email notice

---

## 7. Responsive Layout Strategy

### Desktop (>= 1024px)
- Two-column: Calendar left, time slots right
- Form below or in modal

### Tablet (768px - 1023px)
- Stacked: Calendar full-width, slots below
- Form below slots

### Mobile (< 768px)
- Full-width calendar
- Scrollable time slot chips
- Full-screen form
- Bottom sheet for confirmation

---

## 8. Component Mapping for F-CORE

| UX Pattern | F-CORE Component | Location |
|-----------|-----------------|----------|
| Booking Page | `BookingPage` | `src/app/book/[userId]/[slug]/page.tsx` |
| Calendar Picker | `MeetingCalendar` | `src/components/meetings/MeetingCalendar.tsx` |
| Time Slot Grid | `TimeSlotPicker` | `src/components/meetings/TimeSlotPicker.tsx` |
| Booking Form | `BookingForm` | `src/components/meetings/BookingForm.tsx` |
| Confirmation | `BookingConfirmation` | `src/components/meetings/BookingConfirmation.tsx` |
| Meeting Types List | `MeetingTypesList` | `src/components/meetings/MeetingTypesList.tsx` |
| Availability Editor | `AvailabilityEditor` | `src/components/meetings/AvailabilityEditor.tsx` |
| Meeting Type Form | `MeetingTypeForm` | `src/components/meetings/MeetingTypeForm.tsx` |
| Upcoming Meetings | `UpcomingMeetings` | `src/components/meetings/UpcomingMeetings.tsx` |
