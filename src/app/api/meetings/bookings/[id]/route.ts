import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/meetings/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await prisma.meetingBooking.findUnique({
      where: { id },
      include: {
        meetingType: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        contact: true,
        company: true,
        deal: true,
        activity: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PATCH /api/meetings/bookings/[id] - Update a booking (reschedule or cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If cancelling
    if (body.status === "cancelled") {
      const booking = await prisma.meetingBooking.update({
        where: { id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: body.cancelReason,
          cancelledBy: body.cancelledBy || "host",
        },
      });
      return NextResponse.json(booking);
    }

    // If rescheduling
    if (body.startTime && body.endTime) {
      // Check for overlapping bookings
      const overlapping = await prisma.meetingBooking.findFirst({
        where: {
          id: { not: id },
          meetingType: {
            userId: body.userId,
          },
          status: { in: ["scheduled"] },
          startTime: { lt: new Date(body.endTime) },
          endTime: { gt: new Date(body.startTime) },
        },
      });

      if (overlapping) {
        return NextResponse.json(
          { error: "Time slot conflicts with an existing booking" },
          { status: 409 }
        );
      }

      const booking = await prisma.meetingBooking.update({
        where: { id },
        data: {
          startTime: new Date(body.startTime),
          endTime: new Date(body.endTime),
          timezone: body.timezone,
        },
      });
      return NextResponse.json(booking);
    }

    // General update (CRM associations, notes)
    const booking = await prisma.meetingBooking.update({
      where: { id },
      data: {
        ...(body.contactId !== undefined && { contactId: body.contactId }),
        ...(body.companyId !== undefined && { companyId: body.companyId }),
        ...(body.dealId !== undefined && { dealId: body.dealId }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: {
        meetingType: { select: { id: true, name: true, duration: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
