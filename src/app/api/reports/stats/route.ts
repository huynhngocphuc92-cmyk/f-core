import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ============================================
// GET /api/reports/stats - Overview statistics
// ============================================

export async function GET() {
  try {
    const tenantId = "demo-tenant";

    const [totalContacts, totalCompanies, totalDeals, dealStats, contactsByStage, dealsByStage, recentActivities] = await Promise.all([
      prisma.contact.count({ where: { tenantId, deletedAt: null } }),
      prisma.company.count({ where: { tenantId, deletedAt: null } }),
      prisma.deal.count({ where: { tenantId, deletedAt: null } }),
      prisma.deal.aggregate({
        where: { tenantId, deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.contact.groupBy({
        by: ["lifecycleStage"],
        where: { tenantId, deletedAt: null },
        _count: true,
        orderBy: { _count: { lifecycleStage: "desc" } },
      }),
      prisma.deal.findMany({
        where: { tenantId, deletedAt: null },
        select: {
          stage: {
            select: { name: true, color: true },
          },
          amount: true,
        },
      }),
      prisma.activity.findMany({
        where: { tenantId },
        select: { type: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    // Aggregate deals by stage
    const stageMap: Record<string, { name: string; count: number; amount: number; color: string }> = {};
    for (const deal of dealsByStage) {
      const stageName = deal.stage.name;
      if (!stageMap[stageName]) {
        stageMap[stageName] = { name: stageName, count: 0, amount: 0, color: deal.stage.color || "#0891b2" };
      }
      stageMap[stageName].count++;
      stageMap[stageName].amount += Number(deal.amount || 0);
    }

    // Aggregate activities by type
    const activityMap: Record<string, number> = {};
    for (const activity of recentActivities) {
      activityMap[activity.type] = (activityMap[activity.type] || 0) + 1;
    }

    const dealsWon = dealsByStage.filter(
      (d) => d.stage.name === "Closed Won"
    ).length;

    const totalRevenue = Number(dealStats._sum.amount || 0);

    return NextResponse.json({
      data: {
        totalContacts,
        totalCompanies,
        totalDeals,
        totalRevenue,
        dealsWon,
        dealsByStage: Object.values(stageMap),
        contactsByLifecycle: contactsByStage.map((g) => ({
          name: g.lifecycleStage || "Unknown",
          count: g._count,
        })),
        recentActivities: Object.entries(activityMap).map(([type, count]) => ({
          name: type,
          count,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
