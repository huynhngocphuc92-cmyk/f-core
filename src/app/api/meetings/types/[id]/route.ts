import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/meetings/types/[id] - Get a single meeting type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meetingType = await prisma.meetingType.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        availability: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        _count: { select: { bookings: true } },
      },
    });

    if (!meetingType) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(meetingType);
  } catch (error) {
    console.error("Error fetching meeting type:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting type" },
      { status: 500 }
    );
  }
}

// PATCH /api/meetings/types/[id] - Update a meeting type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify not soft-deleted
    const existing = await prisma.meetingType.findUnique({
      where: { id },
      select: { deletedAt: true },
    });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    const meetingType = await prisma.meetingType.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.bufferBefore !== undefined && { bufferBefore: body.bufferBefore }),
        ...(body.bufferAfter !== undefined && { bufferAfter: body.bufferAfter }),
        ...(body.minNotice !== undefined && { minNotice: body.minNotice }),
        ...(body.maxAdvance !== undefined && { maxAdvance: body.maxAdvance }),
        ...(body.locationType !== undefined && { locationType: body.locationType }),
        ...(body.locationValue !== undefined && { locationValue: body.locationValue }),
        ...(body.customFields !== undefined && { customFields: body.customFields }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        availability: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    return NextResponse.json(meetingType);
  } catch (error) {
    console.error("Error updating meeting type:", error);
    return NextResponse.json(
      { error: "Failed to update meeting type" },
      { status: 500 }
    );
  }
}

// DELETE /api/meetings/types/[id] - Soft delete a meeting type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.meetingType.findUnique({
      where: { id },
      select: { deletedAt: true },
    });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    await prisma.meetingType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting type:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting type" },
      { status: 500 }
    );
  }
}
