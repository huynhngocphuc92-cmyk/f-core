import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/book/[userId]/[slug] - Public: Get meeting type info for booking page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; slug: string }> }
) {
  try {
    const { userId, slug } = await params;

    const meetingType = await prisma.meetingType.findUnique({
      where: {
        userId_slug: { userId, slug },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        duration: true,
        color: true,
        locationType: true,
        minNotice: true,
        maxAdvance: true,
        customFields: true,
        isActive: true,
        deletedAt: true,
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        availability: {
          where: { isActive: true },
          select: { dayOfWeek: true, startTime: true, endTime: true, timezone: true },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!meetingType || meetingType.deletedAt || !meetingType.isActive) {
      return NextResponse.json(
        { error: "Meeting type not found or inactive" },
        { status: 404 }
      );
    }

    const { deletedAt, ...publicData } = meetingType;

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("Error fetching public meeting type:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting type" },
      { status: 500 }
    );
  }
}

// POST /api/book/[userId]/[slug] - Public: Create a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; slug: string }> }
) {
  try {
    const { userId, slug } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.startTime || !body.inviteeName || !body.inviteeEmail || !body.timezone) {
      return NextResponse.json(
        { error: "startTime, inviteeName, inviteeEmail, and timezone are required" },
        { status: 400 }
      );
    }

    // Find the meeting type
    const meetingType = await prisma.meetingType.findUnique({
      where: { userId_slug: { userId, slug } },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!meetingType || meetingType.deletedAt || !meetingType.isActive) {
      return NextResponse.json(
        { error: "Meeting type not found or inactive" },
        { status: 404 }
      );
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(startTime.getTime() + meetingType.duration * 60000);

    // Check minimum notice
    const now = new Date();
    const minNoticeMs = meetingType.minNotice * 60000;
    if (startTime.getTime() - now.getTime() < minNoticeMs) {
      return NextResponse.json(
        { error: "Booking does not meet minimum notice requirement" },
        { status: 400 }
      );
    }

    // Check max advance
    const maxAdvanceMs = meetingType.maxAdvance * 24 * 60 * 60 * 1000;
    if (startTime.getTime() - now.getTime() > maxAdvanceMs) {
      return NextResponse.json(
        { error: "Booking is too far in advance" },
        { status: 400 }
      );
    }

    // Check for overlapping bookings (including buffers)
    const bufferStart = new Date(startTime.getTime() - meetingType.bufferBefore * 60000);
    const bufferEnd = new Date(endTime.getTime() + meetingType.bufferAfter * 60000);

    const overlapping = await prisma.meetingBooking.findFirst({
      where: {
        meetingType: { userId },
        status: { in: ["scheduled"] },
        startTime: { lt: bufferEnd },
        endTime: { gt: bufferStart },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Auto-match contact by email
    let contactId: string | null = null;
    const existingContact = await prisma.contact.findFirst({
      where: {
        tenantId: meetingType.tenantId,
        email: body.inviteeEmail,
        deletedAt: null,
      },
    });
    if (existingContact) {
      contactId = existingContact.id;
    }

    // Create booking + activity in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create activity record
      const activity = await tx.activity.create({
        data: {
          tenantId: meetingType.tenantId,
          type: "meeting",
          subject: `Meeting: ${meetingType.name} with ${body.inviteeName}`,
          body: body.notes || null,
          ownerId: userId,
          contactId,
          meetingStart: startTime,
          meetingEnd: endTime,
          meetingLocation: meetingType.locationValue,
          attendees: [body.inviteeEmail, meetingType.user.email],
        },
      });

      // Create the booking
      const newBooking = await tx.meetingBooking.create({
        data: {
          tenantId: meetingType.tenantId,
          meetingTypeId: meetingType.id,
          startTime,
          endTime,
          timezone: body.timezone,
          inviteeName: body.inviteeName,
          inviteeEmail: body.inviteeEmail,
          inviteeCompany: body.inviteeCompany,
          inviteePhone: body.inviteePhone,
          notes: body.notes,
          customResponses: body.customResponses || {},
          contactId,
          activityId: activity.id,
        },
        include: {
          meetingType: {
            select: { name: true, duration: true, locationType: true, locationValue: true },
          },
        },
      });

      return newBooking;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
