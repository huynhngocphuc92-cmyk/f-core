import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addWidgetSchema, updateWidgetSchema } from "@/lib/validations/reports";

// ============================================
// POST /api/dashboards/[id]/widgets - Add widget
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dashboardId } = await params;
    const tenantId = "demo-tenant";
    const body = await request.json();

    const validation = addWidgetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify dashboard exists
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    // Verify report exists
    const report = await prisma.report.findFirst({
      where: { id: validation.data.reportId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const widget = await prisma.dashboardWidget.create({
      data: {
        dashboardId,
        ...validation.data,
      },
      include: { report: true },
    });

    return NextResponse.json({ data: widget }, { status: 201 });
  } catch (error) {
    console.error("Error adding widget:", error);
    return NextResponse.json(
      { error: "Failed to add widget" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/dashboards/[id]/widgets - Update widget positions (batch)
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dashboardId } = await params;
    const tenantId = "demo-tenant";
    const body = await request.json();

    // Verify dashboard exists
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    // Expect body.widgets = [{id, ...updates}]
    if (!Array.isArray(body.widgets)) {
      return NextResponse.json(
        { error: "Expected widgets array" },
        { status: 400 }
      );
    }

    const updates = [];
    for (const w of body.widgets) {
      const validation = updateWidgetSchema.safeParse(w);
      if (validation.success) {
        updates.push(
          prisma.dashboardWidget.updateMany({
            where: { id: w.id, dashboardId },
            data: validation.data,
          })
        );
      }
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating widgets:", error);
    return NextResponse.json(
      { error: "Failed to update widgets" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/dashboards/[id]/widgets - Remove widget
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dashboardId } = await params;
    const tenantId = "demo-tenant";
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId");

    if (!widgetId) {
      return NextResponse.json(
        { error: "widgetId query param required" },
        { status: 400 }
      );
    }

    // Verify dashboard exists
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    const deleted = await prisma.dashboardWidget.deleteMany({
      where: { id: widgetId, dashboardId },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Widget not found in this dashboard" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing widget:", error);
    return NextResponse.json(
      { error: "Failed to remove widget" },
      { status: 500 }
    );
  }
}
