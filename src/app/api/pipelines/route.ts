import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/pipelines - List all pipelines for tenant
export async function GET(_request: NextRequest) {
  try {
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const pipelines = await prisma.pipeline.findMany({
      where: { tenantId },
      include: {
        stages: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            name: true,
            orderIndex: true,
            probability: true,
            color: true,
            isClosed: true,
            isWon: true,
          },
        },
        _count: {
          select: {
            deals: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ data: pipelines });
  } catch (error) {
    console.error("Error fetching pipelines:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipelines" },
      { status: 500 }
    );
  }
}
