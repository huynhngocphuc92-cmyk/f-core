import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const activityIncludes = {
  owner: { select: { id: true, name: true, email: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: { id: true, name: true, domain: true } },
  deal: { select: { id: true, name: true, amount: true } },
};

// GET /api/activities - List activities with cursor pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const companyId = searchParams.get("companyId");
    const dealId = searchParams.get("dealId");
    const type = searchParams.get("type");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const where = {
      tenantId,
      ...(contactId && { contactId }),
      ...(companyId && { companyId }),
      ...(dealId && { dealId }),
      ...(type && { type: { in: type.split(",") } }),
    };

    const activities = await prisma.activity.findMany({
      where,
      include: activityIncludes,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = activities.length > limit;
    const data = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({
      data,
      meta: { nextCursor, hasMore },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type) {
      return NextResponse.json(
        { error: "Activity type is required" },
        { status: 400 }
      );
    }

    const validTypes = ["email", "call", "meeting", "note", "task"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid activity type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    // Validate associations belong to tenant
    if (body.contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: body.contactId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
    }

    if (body.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: body.companyId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
    }

    if (body.dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: body.dealId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!deal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
    }

    const activity = await prisma.activity.create({
      data: {
        tenantId,
        type: body.type,
        subject: body.subject || null,
        body: body.body || null,
        contactId: body.contactId || null,
        companyId: body.companyId || null,
        dealId: body.dealId || null,
        ownerId: body.ownerId || null,
        // Task fields
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority || null,
        status: body.status || (body.type === "task" ? "pending" : null),
        // Call fields
        callDuration: body.callDuration || null,
        callOutcome: body.callOutcome || null,
        callDirection: body.callDirection || null,
        // Meeting fields
        meetingStart: body.meetingStart ? new Date(body.meetingStart) : null,
        meetingEnd: body.meetingEnd ? new Date(body.meetingEnd) : null,
        meetingLocation: body.meetingLocation || null,
        attendees: body.attendees || null,
        // Email fields
        emailTo: body.emailTo || null,
        emailCc: body.emailCc || null,
        emailBcc: body.emailBcc || null,
        emailStatus: body.emailStatus || null,
        metadata: body.metadata || {},
      },
      include: activityIncludes,
    });

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
