import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/tenant";
import { createSLAPolicySchema } from "@/lib/validations/ticket";

// GET /api/tickets/sla - List all SLA policies
export async function GET() {
  try {
    const tenantId = await getDemoTenantId();

    const policies = await prisma.ticketSLAPolicy.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        _count: { select: { tickets: true } },
      },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json({ data: policies });
  } catch (error) {
    console.error("Error fetching SLA policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch SLA policies" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/sla - Create a new SLA policy
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getDemoTenantId();
    const body = await request.json();

    const parsed = createSLAPolicySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if policy already exists for this priority
    const existing = await prisma.ticketSLAPolicy.findUnique({
      where: { tenantId_priority: { tenantId, priority: parsed.data.priority } },
    });

    if (existing && !existing.deletedAt) {
      return NextResponse.json(
        { error: `SLA policy for priority "${parsed.data.priority}" already exists` },
        { status: 409 }
      );
    }

    // If soft-deleted policy exists, restore and update it
    if (existing && existing.deletedAt) {
      const policy = await prisma.ticketSLAPolicy.update({
        where: { id: existing.id },
        data: {
          ...parsed.data,
          deletedAt: null,
        },
      });
      return NextResponse.json(policy, { status: 201 });
    }

    const policy = await prisma.ticketSLAPolicy.create({
      data: {
        tenantId,
        ...parsed.data,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Error creating SLA policy:", error);
    return NextResponse.json(
      { error: "Failed to create SLA policy" },
      { status: 500 }
    );
  }
}
