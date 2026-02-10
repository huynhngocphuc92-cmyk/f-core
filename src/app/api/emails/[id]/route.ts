import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateEmailSchema = z.object({
  emailStatus: z.enum(["sent", "delivered", "opened", "clicked", "bounced", "failed"]),
});

// GET /api/emails/[id] - Get email detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const email = await prisma.activity.findFirst({
      where: { id, type: "email" },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    await checkOwnership(email.tenantId, request);

    return NextResponse.json(email);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/emails/[id] - Update email status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateEmailSchema.parse(body);

    const existing = await prisma.activity.findFirst({
      where: { id, type: "email" },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const email = await prisma.activity.update({
      where: { id },
      data: { emailStatus: data.emailStatus },
    });

    return NextResponse.json(email);
  } catch (error) {
    return handleApiError(error);
  }
}
