import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateDashboardSchema } from "@/lib/validations/reports";

// ============================================
// GET /api/dashboards/[id] - Get dashboard
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    const dashboard = await prisma.dashboard.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        widgets: {
          include: { report: true },
          orderBy: [{ y: "asc" }, { x: "asc" }],
        },
      },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: dashboard });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/dashboards/[id] - Update dashboard
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";
    const body = await request.json();

    const validation = updateDashboardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.dashboard.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    const dashboard = await prisma.dashboard.update({
      where: { id },
      data: validation.data,
      include: {
        widgets: {
          include: { report: true },
          orderBy: [{ y: "asc" }, { x: "asc" }],
        },
      },
    });

    return NextResponse.json({ data: dashboard });
  } catch (error) {
    console.error("Error updating dashboard:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/dashboards/[id] - Soft delete
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    const existing = await prisma.dashboard.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.dashboardWidget.deleteMany({ where: { dashboardId: id } }),
      prisma.dashboard.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    return NextResponse.json(
      { error: "Failed to delete dashboard" },
      { status: 500 }
    );
  }
}
