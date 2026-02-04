import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/activities
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const companyId = searchParams.get("companyId");
    const dealId = searchParams.get("dealId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = {
      ...(contactId && { contactId }),
      ...(companyId && { companyId }),
      ...(dealId && { dealId }),
      ...(type && { type }),
    };

    const activities = await prisma.activity.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

// POST /api/activities - Create activity (note, call, email, meeting, task)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type) {
      return NextResponse.json({ error: "Activity type is required" }, { status: 400 });
    }

    const tenantId = body.tenantId || "demo-tenant";

    const activity = await prisma.activity.create({
      data: {
        tenantId,
        type: body.type,
        subject: body.subject,
        body: body.body,
        contactId: body.contactId,
        companyId: body.companyId,
        dealId: body.dealId,
        ownerId: body.ownerId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority,
        status: body.status || (body.type === "task" ? "pending" : null),
        callDuration: body.callDuration,
        callOutcome: body.callOutcome,
        callDirection: body.callDirection,
        meetingStart: body.meetingStart ? new Date(body.meetingStart) : null,
        meetingEnd: body.meetingEnd ? new Date(body.meetingEnd) : null,
        meetingLocation: body.meetingLocation,
        attendees: body.attendees,
        emailTo: body.emailTo,
        emailCc: body.emailCc,
        metadata: body.metadata || {},
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
