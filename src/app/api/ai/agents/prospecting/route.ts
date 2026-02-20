import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  buildProspectingAgentInsights,
  prospectingAgentRequestSchema,
} from "@/lib/ai/prospecting-agent";

async function computeProspectingAgentResponse(
  tenantId: string,
  input: {
    query?: string;
    maxRecommendations?: number;
    segment?: "all" | "new_leads" | "stalled_deals" | "inactive_contacts";
    lookbackDays?: number;
  }
) {
  const [contacts, deals, activities] = await Promise.all([
    prisma.contact.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        lifecycleStage: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        amount: true,
        probability: true,
        closeDate: true,
        updatedAt: true,
        contacts: {
          select: {
            contactId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.activity.findMany({
      where: {
        tenantId,
      },
      select: {
        contactId: true,
        dealId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    }),
  ]);

  const contactLastActivity = new Map<string, Date>();
  const dealLastActivity = new Map<string, Date>();

  for (const activity of activities) {
    if (activity.contactId && !contactLastActivity.has(activity.contactId)) {
      contactLastActivity.set(activity.contactId, activity.createdAt);
    }
    if (activity.dealId && !dealLastActivity.has(activity.dealId)) {
      dealLastActivity.set(activity.dealId, activity.createdAt);
    }
  }

  return buildProspectingAgentInsights({
    query: input.query,
    maxRecommendations: input.maxRecommendations,
    segment: input.segment,
    lookbackDays: input.lookbackDays,
    contacts: contacts.map((contact) => ({
      id: contact.id,
      name:
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
        contact.email ||
        "Unnamed contact",
      email: contact.email,
      lifecycleStage: contact.lifecycleStage,
      lastActivityAt: contactLastActivity.get(contact.id) || null,
    })),
    deals: deals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      amount: deal.amount ? Number(deal.amount) : 0,
      probability: deal.probability,
      closeDate: deal.closeDate,
      lastActivityAt: dealLastActivity.get(deal.id) || null,
      contactIds: deal.contacts.map((item) => item.contactId),
    })),
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const payload = prospectingAgentRequestSchema.parse({
      query: request.nextUrl.searchParams.get("query") || undefined,
      maxRecommendations: request.nextUrl.searchParams.get("maxRecommendations")
        ? Number(request.nextUrl.searchParams.get("maxRecommendations"))
        : undefined,
      segment:
        (request.nextUrl.searchParams.get("segment") as
          | "all"
          | "new_leads"
          | "stalled_deals"
          | "inactive_contacts"
          | null) || undefined,
      lookbackDays: request.nextUrl.searchParams.get("lookbackDays")
        ? Number(request.nextUrl.searchParams.get("lookbackDays"))
        : undefined,
    });

    const data = await computeProspectingAgentResponse(user.tenantId, payload);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const body = await request.json();
    const payload = prospectingAgentRequestSchema.parse(body);

    const data = await computeProspectingAgentResponse(user.tenantId, payload);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
