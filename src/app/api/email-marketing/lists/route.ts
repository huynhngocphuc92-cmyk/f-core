import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDemoTenantId } from '@/lib/tenant';
import { createListSchema } from '@/lib/email-marketing/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { deletedAt: null };

    const [lists, total] = await Promise.all([
      prisma.contactList.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { members: true } } },
      }),
      prisma.contactList.count({ where }),
    ]);

    return NextResponse.json({
      data: lists,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tenantId = body.tenantId || await getDemoTenantId();

    const list = await prisma.contactList.create({
      data: {
        tenantId,
        ...parsed.data,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
