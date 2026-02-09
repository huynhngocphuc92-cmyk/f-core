import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createDashboardSchema } from "@/lib/validations/reports";

// ============================================
// GET /api/dashboards - List dashboards
// ============================================

export async function GET() {
  try {
    const tenantId = "demo-tenant";

    const dashboards = await prisma.dashboard.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        widgets: {
          include: { report: true },
          orderBy: [{ y: "asc" }, { x: "asc" }],
        },
        _count: { select: { widgets: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: dashboards });
  } catch (error) {
    console.error("Error listing dashboards:", error);
    return NextResponse.json(
      { error: "Failed to list dashboards" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/dashboards - Create dashboard
// ============================================

export async function POST(request: NextRequest) {
  try {
    const tenantId = "demo-tenant";
    const body = await request.json();

    const validation = createDashboardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        tenantId,
        ...validation.data,
      },
    });

    return NextResponse.json({ data: dashboard }, { status: 201 });
  } catch (error) {
    console.error("Error creating dashboard:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard" },
      { status: 500 }
    );
  }
}
