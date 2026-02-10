import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const saveAvailabilitySchema = z.object({
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
    })
  ),
});

// GET /api/meetings/availability - Get current user's availability
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const availability = await prisma.userAvailability.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ data: availability });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/meetings/availability - Replace user availability
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const { slots } = saveAvailabilitySchema.parse(body);

    // Delete existing and recreate
    await prisma.userAvailability.deleteMany({ where: { userId: user.id } });

    if (slots.length > 0) {
      await prisma.userAvailability.createMany({
        data: slots.map((s) => ({
          userId: user.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }

    const availability = await prisma.userAvailability.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ data: availability });
  } catch (error) {
    return handleApiError(error);
  }
}
