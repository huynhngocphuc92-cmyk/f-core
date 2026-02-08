import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/meetings/types/[id]/availability - Get availability for a meeting type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const availability = await prisma.meetingAvailability.findMany({
      where: { meetingTypeId: id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ data: availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// PUT /api/meetings/types/[id]/availability - Replace availability for a meeting type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!Array.isArray(body.availability)) {
      return NextResponse.json(
        { error: "availability array is required" },
        { status: 400 }
      );
    }

    // Validate each entry
    for (const entry of body.availability) {
      if (entry.dayOfWeek === undefined || !entry.startTime || !entry.endTime) {
        return NextResponse.json(
          { error: "Each availability entry requires dayOfWeek, startTime, and endTime" },
          { status: 400 }
        );
      }
      if (entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
        return NextResponse.json(
          { error: "dayOfWeek must be 0-6 (Sunday-Saturday)" },
          { status: 400 }
        );
      }
    }

    // Delete existing and create new in a transaction
    await prisma.$transaction([
      prisma.meetingAvailability.deleteMany({
        where: { meetingTypeId: id },
      }),
      prisma.meetingAvailability.createMany({
        data: body.availability.map((entry: {
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          timezone?: string;
          isActive?: boolean;
        }) => ({
          meetingTypeId: id,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          timezone: entry.timezone || "UTC",
          isActive: entry.isActive !== false,
        })),
      }),
    ]);

    // Fetch the updated availability
    const availability = await prisma.meetingAvailability.findMany({
      where: { meetingTypeId: id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ data: availability });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
