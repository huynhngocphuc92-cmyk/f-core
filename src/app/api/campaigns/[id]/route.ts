import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  previewText: z.string().max(500).nullable().optional(),
  templateId: z.string().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

// GET /api/campaigns/[id] - Get a single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    await checkOwnership(campaign.tenantId, request);

    return NextResponse.json(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/campaigns/[id] - Update a campaign (draft only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateCampaignSchema.parse(body);

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be edited" },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.previewText !== undefined && {
          previewText: data.previewText,
        }),
        ...(data.templateId !== undefined && {
          templateId: data.templateId,
        }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt
            ? new Date(data.scheduledAt)
            : null,
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/campaigns/[id] - Soft delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.emailCampaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
