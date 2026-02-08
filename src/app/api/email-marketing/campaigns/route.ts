import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDemoTenantId } from '@/lib/tenant';
import { createCampaignSchema } from '@/lib/email-marketing/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: { select: { id: true, name: true } },
          list: { select: { id: true, name: true, memberCount: true } },
        },
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    return NextResponse.json({
      data: campaigns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tenantId = body.tenantId || await getDemoTenantId();

    const campaign = await prisma.emailCampaign.create({
      data: {
        tenantId,
        name: parsed.data.name,
        description: parsed.data.description,
        templateId: parsed.data.templateId,
        subject: parsed.data.subject,
        previewText: parsed.data.previewText,
        fromName: parsed.data.fromName,
        fromEmail: parsed.data.fromEmail,
        replyTo: parsed.data.replyTo,
        listId: parsed.data.listId,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
        status: parsed.data.scheduledAt ? 'scheduled' : 'draft',
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
