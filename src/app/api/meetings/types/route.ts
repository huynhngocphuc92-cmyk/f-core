import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/meetings/types - List all meeting types
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (userId) where.userId = userId;
    if (isActive !== null) where.isActive = isActive !== "false";

    const meetingTypes = await prisma.meetingType.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        availability: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: meetingTypes });
  } catch (error) {
    console.error("Error fetching meeting types:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting types" },
      { status: 500 }
    );
  }
}

// POST /api/meetings/types - Create a new meeting type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.duration || !body.userId) {
      return NextResponse.json(
        { error: "name, duration, and userId are required" },
        { status: 400 }
      );
    }

    const tenantId = body.tenantId || "demo-tenant";

    // Generate slug from name
    const baseSlug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check slug uniqueness for this user
    const existing = await prisma.meetingType.findUnique({
      where: { userId_slug: { userId: body.userId, slug: baseSlug } },
    });

    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

    const meetingType = await prisma.meetingType.create({
      data: {
        tenantId,
        userId: body.userId,
        name: body.name,
        slug,
        description: body.description,
        duration: body.duration,
        color: body.color || "#0891b2",
        bufferBefore: body.bufferBefore ?? 0,
        bufferAfter: body.bufferAfter ?? 15,
        minNotice: body.minNotice ?? 240,
        maxAdvance: body.maxAdvance ?? 30,
        locationType: body.locationType || "video",
        locationValue: body.locationValue,
        customFields: body.customFields || [],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Create default availability (Mon-Fri 9:00-17:00) if requested
    if (body.createDefaultAvailability !== false) {
      const defaultAvailability = [1, 2, 3, 4, 5].map((day) => ({
        meetingTypeId: meetingType.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        timezone: body.timezone || "UTC",
      }));

      await prisma.meetingAvailability.createMany({
        data: defaultAvailability,
      });
    }

    // Re-fetch with availability
    const result = await prisma.meetingType.findUnique({
      where: { id: meetingType.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        availability: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting type:", error);
    return NextResponse.json(
      { error: "Failed to create meeting type" },
      { status: 500 }
    );
  }
}
