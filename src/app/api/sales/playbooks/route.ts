import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  formatSalesPlaybookRun,
  getSalesPlaybookRuns,
  recommendSalesPlaybookTemplate,
  SALES_PLAYBOOK_TEMPLATES,
  startSalesPlaybookInputSchema,
  startSalesPlaybookRun,
} from "@/lib/sales-playbook-store";

// GET /api/sales/playbooks - Deal-scoped playbook templates and execution runs
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const dealId = request.nextUrl.searchParams.get("dealId") || undefined;

    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        amount: true,
        closeDate: true,
        stage: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
    });

    const selectedDeal = dealId
      ? deals.find((deal) => deal.id === dealId) || null
      : deals[0] || null;

    const recommended = recommendSalesPlaybookTemplate(selectedDeal?.stage?.name ?? null);

    return NextResponse.json({
      deals: deals.map((deal) => ({
        id: deal.id,
        name: deal.name,
        amount: deal.amount ? Number(deal.amount) : 0,
        closeDate: deal.closeDate,
        stageName: deal.stage?.name || null,
      })),
      templates: SALES_PLAYBOOK_TEMPLATES,
      runs: (await getSalesPlaybookRuns(tenantId, dealId)).map((run) => formatSalesPlaybookRun(run)),
      recommendation: selectedDeal
        ? {
            dealId: selectedDeal.id,
            templateId: recommended?.id || null,
            templateName: recommended?.name || null,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/sales/playbooks - Start a playbook run for a deal
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = startSalesPlaybookInputSchema.parse(body);

    const deal = await prisma.deal.findFirst({
      where: {
        id: payload.dealId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!deal) {
      throw new ApiError(404, "Deal not found");
    }

    const run = await startSalesPlaybookRun({
      tenantId,
      dealId: payload.dealId,
      templateId: payload.templateId,
    });

    await logAuditEvent({
      request,
      action: "created",
      entity: "sales_playbook_run",
      entityId: run.id,
      entityName: payload.templateId,
      changes: {
        dealId: payload.dealId,
        stepCount: run.steps.length,
      },
    });

    return NextResponse.json(
      {
        run: formatSalesPlaybookRun(run),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
