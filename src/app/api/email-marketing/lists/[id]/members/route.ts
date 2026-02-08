import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMembersSchema } from '@/lib/email-marketing/schemas';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await paramsPromise;
    const body = await request.json();
    const parsed = addMembersSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.contactListMember.createMany({
      data: parsed.data.contactIds.map((contactId) => ({
        listId: id,
        contactId,
      })),
      skipDuplicates: true,
    });

    // Update member count
    const count = await prisma.contactListMember.count({ where: { listId: id } });
    await prisma.contactList.update({
      where: { id },
      data: { memberCount: count },
    });

    return NextResponse.json({ success: true, memberCount: count });
  } catch (error) {
    console.error('Error adding members:', error);
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await paramsPromise;
    const body = await request.json();

    if (body.contactIds && Array.isArray(body.contactIds)) {
      await prisma.contactListMember.deleteMany({
        where: {
          listId: id,
          contactId: { in: body.contactIds },
        },
      });

      const count = await prisma.contactListMember.count({ where: { listId: id } });
      await prisma.contactList.update({
        where: { id },
        data: { memberCount: count },
      });

      return NextResponse.json({ success: true, memberCount: count });
    }

    return NextResponse.json({ error: 'contactIds required' }, { status: 400 });
  } catch (error) {
    console.error('Error removing members:', error);
    return NextResponse.json({ error: 'Failed to remove members' }, { status: 500 });
  }
}
