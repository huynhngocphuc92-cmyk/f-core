import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/email-marketing/campaigns/[id]/send - Trigger campaign send
export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await paramsPromise;
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        list: {
          where: { deletedAt: null },
          include: {
            members: {
              include: {
                contact: {
                  select: { id: true, email: true, firstName: true, lastName: true, deletedAt: true },
                },
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Campaign can only be sent from draft or scheduled status' },
        { status: 400 }
      );
    }

    if (!campaign.list || campaign.list.members.length === 0) {
      return NextResponse.json(
        { error: 'Campaign has no audience. Please select a contact list.' },
        { status: 400 }
      );
    }

    // Create send records for each active contact in the list
    const activeMembers = campaign.list.members.filter(
      (member: { contact: { deletedAt: Date | null } }) => !member.contact.deletedAt
    );
    const sends = activeMembers.map((member: { contact: { id: string; email: string | null; firstName: string | null; lastName: string | null } }) => ({
      tenantId: campaign.tenantId,
      campaignId: campaign.id,
      contactId: member.contact.id,
      toEmail: member.contact.email || '',
      toName: [member.contact.firstName, member.contact.lastName].filter(Boolean).join(' ') || undefined,
      status: 'sent' as const,
      sentAt: new Date(),
    }));

    // Batch create send records (demo: mark as sent immediately)
    await prisma.emailCampaignSend.createMany({
      data: sends,
      skipDuplicates: true,
    });

    // Update campaign stats
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        completedAt: new Date(),
        totalRecipients: sends.length,
        totalSent: sends.length,
        totalDelivered: sends.length,
      },
    });

    return NextResponse.json({
      success: true,
      totalSent: sends.length,
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
  }
}
