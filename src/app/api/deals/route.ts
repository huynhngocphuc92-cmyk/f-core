import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/deals - List all deals (with optional grouped mode for kanban)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const pipelineId = searchParams.get("pipelineId");
    const stageId = searchParams.get("stageId");
    const search = searchParams.get("search") || "";
    const ownerId = searchParams.get("ownerId") || "";
    const priority = searchParams.get("priority") || "";
    const grouped = searchParams.get("grouped") === "true";

    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
      ...(ownerId && { ownerId }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Grouped mode for Kanban board
    if (grouped && pipelineId) {
      const pipeline = await prisma.pipeline.findUnique({
        where: { id: pipelineId, tenantId },
        include: {
          stages: { orderBy: { orderIndex: "asc" } },
        },
      });

      if (!pipeline) {
        return NextResponse.json(
          { error: "Pipeline not found" },
          { status: 404 }
        );
      }

      const deals = await prisma.deal.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          stage: { select: { id: true, name: true, color: true, probability: true, orderIndex: true, isClosed: true, isWon: true } },
          pipeline: { select: { id: true, name: true } },
          contacts: { include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          companies: { include: { company: { select: { id: true, name: true, domain: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Group deals by stage
      const stages = pipeline.stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stageId === stage.id);
        const totalAmount = stageDeals.reduce(
          (sum, d) => sum + (d.amount ? Number(d.amount) : 0),
          0
        );
        return {
          ...stage,
          deals: stageDeals,
          totalAmount,
          count: stageDeals.length,
        };
      });

      const totalDeals = deals.length;
      const totalAmount = deals.reduce(
        (sum, d) => sum + (d.amount ? Number(d.amount) : 0),
        0
      );
      const weightedAmount = deals.reduce((sum, d) => {
        const amt = d.amount ? Number(d.amount) : 0;
        const prob = d.stage?.probability ?? 0;
        return sum + (amt * prob) / 100;
      }, 0);

      return NextResponse.json({
        data: {
          pipeline: { id: pipeline.id, name: pipeline.name },
          stages,
          summary: { totalDeals, totalAmount, weightedAmount },
        },
      });
    }

    // Standard paginated list mode
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          stage: { select: { id: true, name: true, color: true, probability: true } },
          pipeline: { select: { id: true, name: true } },
          contacts: { include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          companies: { include: { company: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      data: deals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.pipelineId || !body.stageId) {
      return NextResponse.json(
        { error: "Name, pipelineId, and stageId are required" },
        { status: 400 }
      );
    }

    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    // Validate pipeline belongs to tenant
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: body.pipelineId, tenantId },
    });
    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    // Validate stage belongs to pipeline
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: body.stageId, pipelineId: body.pipelineId },
    });
    if (!stage) {
      return NextResponse.json(
        { error: "Stage not found in this pipeline" },
        { status: 404 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description || null,
        amount: body.amount || null,
        currency: body.currency || "USD",
        closeDate: body.closeDate ? new Date(body.closeDate) : null,
        pipelineId: body.pipelineId,
        stageId: body.stageId,
        probability: stage.probability,
        ownerId: body.ownerId || null,
        dealType: body.dealType || null,
        priority: body.priority || null,
        properties: body.properties || {},
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: { select: { id: true, name: true, color: true, probability: true, orderIndex: true, isClosed: true, isWon: true } },
        pipeline: { select: { id: true, name: true } },
      },
    });

    // Create contact associations
    if (body.contactIds && Array.isArray(body.contactIds)) {
      for (const contactId of body.contactIds) {
        const contact = await prisma.contact.findUnique({
          where: { id: contactId, tenantId, deletedAt: null },
          select: { id: true },
        });
        if (contact) {
          await prisma.dealContact.create({
            data: { dealId: deal.id, contactId },
          });
        }
      }
    }

    // Create company associations
    if (body.companyIds && Array.isArray(body.companyIds)) {
      for (let i = 0; i < body.companyIds.length; i++) {
        const companyId = body.companyIds[i];
        const company = await prisma.company.findUnique({
          where: { id: companyId, tenantId, deletedAt: null },
          select: { id: true },
        });
        if (company) {
          await prisma.dealCompany.create({
            data: { dealId: deal.id, companyId, isPrimary: i === 0 },
          });
        }
      }
    }

    return NextResponse.json({ data: deal }, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
