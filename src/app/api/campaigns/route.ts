import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { z } from "zod";

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  previewText: z.string().max(500).optional(),
  templateId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

// GET /api/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    const additionalWhere = {
      deletedAt: null,
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              {
                subject: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    return paginatedResponse(campaigns, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/campaigns - Create a campaign
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createCampaignSchema.parse(body);

    const campaign = await prisma.emailCampaign.create({
      data: {
        tenantId,
        name: data.name,
        subject: data.subject,
        body: data.body,
        previewText: data.previewText,
        templateId: data.templateId,
        scheduledAt: data.scheduledAt
          ? new Date(data.scheduledAt)
          : undefined,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
