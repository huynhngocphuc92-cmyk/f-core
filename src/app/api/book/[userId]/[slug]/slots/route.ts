import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/book/[userId]/[slug]/slots?date=2024-01-15&timezone=America/New_York
// Public: Get available time slots for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; slug: string }> }
) {
  try {
    const { userId, slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date");
    const visitorTimezone = searchParams.get("timezone") || "UTC";

    if (!dateStr) {
      return NextResponse.json(
        { error: "date parameter is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Find the meeting type with availability
    const meetingType = await prisma.meetingType.findUnique({
      where: { userId_slug: { userId, slug } },
      include: {
        availability: { where: { isActive: true } },
      },
    });

    if (!meetingType || meetingType.deletedAt || !meetingType.isActive) {
      return NextResponse.json(
        { error: "Meeting type not found or inactive" },
        { status: 404 }
      );
    }

    // Parse the requested date
    const requestedDate = new Date(dateStr + "T00:00:00Z");
    const dayOfWeek = requestedDate.getUTCDay();

    // Find availability rules for this day of week
    const dayAvailability = meetingType.availability.filter(
      (a) => a.dayOfWeek === dayOfWeek
    );

    if (dayAvailability.length === 0) {
      return NextResponse.json({ data: [], date: dateStr });
    }

    // Generate time slots
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    const now = new Date();
    const minNoticeMs = meetingType.minNotice * 60000;

    for (const avail of dayAvailability) {
      const [startHour, startMinute] = avail.startTime.split(":").map(Number);
      const [endHour, endMinute] = avail.endTime.split(":").map(Number);

      // Create start/end times in UTC for the requested date
      const windowStart = new Date(requestedDate);
      windowStart.setUTCHours(startHour, startMinute, 0, 0);

      const windowEnd = new Date(requestedDate);
      windowEnd.setUTCHours(endHour, endMinute, 0, 0);

      // Generate slots at duration intervals
      let slotStart = new Date(windowStart);

      while (slotStart.getTime() + meetingType.duration * 60000 <= windowEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + meetingType.duration * 60000);

        // Check minimum notice
        const meetsNotice = slotStart.getTime() - now.getTime() >= minNoticeMs;

        if (meetsNotice) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true,
          });
        }

        // Move to next slot (duration interval, no overlap)
        slotStart = new Date(slotStart.getTime() + meetingType.duration * 60000);
      }
    }

    if (slots.length === 0) {
      return NextResponse.json({ data: [], date: dateStr });
    }

    // Get existing bookings for this date range to mark unavailable slots
    const dayStart = new Date(requestedDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const existingBookings = await prisma.meetingBooking.findMany({
      where: {
        meetingType: { userId },
        status: { in: ["scheduled"] },
        startTime: { lte: dayEnd },
        endTime: { gte: dayStart },
      },
      select: { startTime: true, endTime: true },
    });

    // Mark slots as unavailable if they overlap with existing bookings (including buffers)
    for (const slot of slots) {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      const bufferedStart = new Date(slotStart.getTime() - meetingType.bufferBefore * 60000);
      const bufferedEnd = new Date(slotEnd.getTime() + meetingType.bufferAfter * 60000);

      for (const booking of existingBookings) {
        if (booking.startTime < bufferedEnd && booking.endTime > bufferedStart) {
          slot.available = false;
          break;
        }
      }
    }

    // Only return available slots
    const availableSlots = slots.filter((s) => s.available);

    return NextResponse.json({
      data: availableSlots,
      date: dateStr,
      timezone: visitorTimezone,
      meetingDuration: meetingType.duration,
    });
  } catch (error) {
    console.error("Error generating slots:", error);
    return NextResponse.json(
      { error: "Failed to generate time slots" },
      { status: 500 }
    );
  }
}
