import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const enrollContactSchema = z.object({
  contactId: z.string().min(1),
});

// POST /api/sequences/[id]/enrollments - Enroll a contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = enrollContactSchema.parse(body);

    const sequence = await prisma.sequence.findFirst({
      where: { id, deletedAt: null },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    await checkOwnership(sequence.tenantId, request);

    if (sequence.status !== "active") {
      return NextResponse.json(
        { error: "Sequence must be active to enroll contacts" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existing = await prisma.sequenceEnrollment.findUnique({
      where: {
        sequenceId_contactId: {
          sequenceId: id,
          contactId: data.contactId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Contact is already enrolled in this sequence" },
        { status: 409 }
      );
    }

    const enrollment = await prisma.sequenceEnrollment.create({
      data: {
        sequenceId: id,
        contactId: data.contactId,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Increment enrolled count
    await prisma.sequence.update({
      where: { id },
      data: { enrolledCount: { increment: 1 } },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
