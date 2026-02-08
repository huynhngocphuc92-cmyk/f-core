import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateCampaignSchema } from '@/lib/email-marketing/schemas';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await paramsPromise;
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        template: true,
        list: { include: { _count: { select: { members: true } } } },
        _count: { select: { sends: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await paramsPromise;
    const body = await request.json();
    const parsed = updateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.scheduledAt) {
      data.scheduledAt = new Date(parsed.data.scheduledAt);
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await paramsPromise;
    const body = await request.json();

    const validStatuses = ['draft', 'scheduled', 'sending', 'sent', 'cancelled'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.update({
        where: { id },
        data: {
          status: body.status,
          ...(body.status === 'cancelled' ? { cancelledAt: new Date() } : {}),
        },
      });
      return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await paramsPromise;
    await prisma.emailCampaign.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'cancelled' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
