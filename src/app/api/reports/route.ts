import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createReportSchema } from "@/lib/validations/reports";

// ============================================
// GET /api/reports - List reports
// ============================================

export async function GET(request: NextRequest) {
  try {
    const tenantId = "demo-tenant";
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const favoritesOnly = searchParams.get("favorites") === "true";

    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (favoritesOnly) {
      where.isFavorite = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: reports, total: reports.length });
  } catch (error) {
    console.error("Error listing reports:", error);
    return NextResponse.json(
      { error: "Failed to list reports" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/reports - Create report
// ============================================

export async function POST(request: NextRequest) {
  try {
    const tenantId = "demo-tenant";
    const body = await request.json();

    const validation = createReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { definition, ...rest } = validation.data;
    const report = await prisma.report.create({
      data: {
        tenantId,
        ...rest,
        definition: definition as any,
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
