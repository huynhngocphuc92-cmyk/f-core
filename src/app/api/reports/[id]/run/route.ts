import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildReportQuery } from "@/lib/reports/query-builder";
import { createReportSchema } from "@/lib/validations/reports";

// ============================================
// POST /api/reports/[id]/run - Execute report query
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    const report = await prisma.report.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Validate the definition
    const defValidation = createReportSchema.shape.definition.safeParse(report.definition);
    if (!defValidation.success) {
      return NextResponse.json(
        { error: "Invalid report definition", details: defValidation.error.issues },
        { status: 400 }
      );
    }

    // Build and execute query
    const { sql, params: queryParams } = buildReportQuery(defValidation.data, tenantId);
    const results = await prisma.$queryRawUnsafe(sql, ...queryParams);

    // Update run stats
    await prisma.report.update({
      where: { id },
      data: {
        runCount: { increment: 1 },
        lastRunAt: new Date(),
      },
    });

    // Serialize BigInt/Decimal values
    const serialized = JSON.parse(
      JSON.stringify(results, (_, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    );

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error("Error running report:", error);
    return NextResponse.json(
      { error: "Failed to run report" },
      { status: 500 }
    );
  }
}
