import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateMeetingTypeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  duration: z.number().int().min(5).max(480).optional(),
  description: z.string().max(2000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
  bufferBefore: z.number().int().min(0).max(60).optional(),
  bufferAfter: z.number().int().min(0).max(60).optional(),
});

// GET /api/meetings/types/[id] - Get a single meeting type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const meetingType = await prisma.meetingType.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        meetingLinks: { where: { isActive: true } },
      },
    });

    if (!meetingType) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    await checkOwnership(meetingType.tenantId, request);

    return NextResponse.json(meetingType);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/meetings/types/[id] - Update a meeting type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateMeetingTypeSchema.parse(body);

    const existing = await prisma.meetingType.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const meetingType = await prisma.meetingType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.bufferBefore !== undefined && {
          bufferBefore: data.bufferBefore,
        }),
        ...(data.bufferAfter !== undefined && {
          bufferAfter: data.bufferAfter,
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(meetingType);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/meetings/types/[id] - Soft delete a meeting type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.meetingType.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.meetingType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
