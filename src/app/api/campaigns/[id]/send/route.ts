import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// POST /api/campaigns/[id]/send - Send a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, deletedAt: null },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    await checkOwnership(campaign.tenantId, request);

    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be sent" },
        { status: 400 }
      );
    }

    // Get all contacts with emails for this tenant
    const contacts = await prisma.contact.findMany({
      where: { tenantId, deletedAt: null, email: { not: null } },
      select: { email: true },
    });

    const recipientCount = contacts.length;

    // Simulate sending metrics
    const delivered = Math.floor(recipientCount * 0.95);
    const opened = Math.floor(delivered * 0.35);
    const clicked = Math.floor(opened * 0.15);
    const bounced = recipientCount - delivered;

    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        recipientCount,
        sentCount: recipientCount,
        deliveredCount: delivered,
        openedCount: opened,
        clickedCount: clicked,
        bouncedCount: bounced,
      },
    });

    return NextResponse.json({
      success: true,
      recipientCount,
      delivered,
      opened,
      clicked,
      bounced,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
