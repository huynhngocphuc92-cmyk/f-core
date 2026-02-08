import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/meetings/bookings - List bookings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const meetingTypeId = searchParams.get("meetingTypeId");
    const startAfter = searchParams.get("startAfter");
    const startBefore = searchParams.get("startBefore");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (meetingTypeId) where.meetingTypeId = meetingTypeId;
    if (startAfter || startBefore) {
      where.startTime = {
        ...(startAfter && { gte: new Date(startAfter) }),
        ...(startBefore && { lte: new Date(startBefore) }),
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.meetingBooking.findMany({
        where,
        include: {
          meetingType: {
            select: { id: true, name: true, duration: true, color: true },
          },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } },
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
      prisma.meetingBooking.count({ where }),
    ]);

    return NextResponse.json({
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
