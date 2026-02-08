import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const activityIncludes = {
  owner: { select: { id: true, name: true, email: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: { id: true, name: true, domain: true } },
  deal: { select: { id: true, name: true, amount: true } },
};

// GET /api/activities/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const activity = await prisma.activity.findUnique({
      where: { id, tenantId },
      include: activityIncludes,
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: activity });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

// PATCH /api/activities/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.activity.findUnique({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Common fields
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.ownerId !== undefined) updateData.ownerId = body.ownerId;

    // Task fields
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed" && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (body.status !== "completed") {
        updateData.completedAt = null;
      }
    }
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.priority !== undefined) updateData.priority = body.priority;

    // Call fields
    if (body.callDuration !== undefined) updateData.callDuration = body.callDuration;
    if (body.callOutcome !== undefined) updateData.callOutcome = body.callOutcome;
    if (body.callDirection !== undefined) updateData.callDirection = body.callDirection;

    // Meeting fields
    if (body.meetingStart !== undefined) updateData.meetingStart = body.meetingStart ? new Date(body.meetingStart) : null;
    if (body.meetingEnd !== undefined) updateData.meetingEnd = body.meetingEnd ? new Date(body.meetingEnd) : null;
    if (body.meetingLocation !== undefined) updateData.meetingLocation = body.meetingLocation;
    if (body.attendees !== undefined) updateData.attendees = body.attendees;

    // Email fields
    if (body.emailTo !== undefined) updateData.emailTo = body.emailTo;
    if (body.emailCc !== undefined) updateData.emailCc = body.emailCc;
    if (body.emailBcc !== undefined) updateData.emailBcc = body.emailBcc;
    if (body.emailStatus !== undefined) updateData.emailStatus = body.emailStatus;

    const activity = await prisma.activity.update({
      where: { id, tenantId },
      data: updateData,
      include: activityIncludes,
    });

    return NextResponse.json({ data: activity });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

// DELETE /api/activities/[id] - Hard delete (activities don't have soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.activity.findUnique({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    await prisma.activity.delete({ where: { id, tenantId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}
