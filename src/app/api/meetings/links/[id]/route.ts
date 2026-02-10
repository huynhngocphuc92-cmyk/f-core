import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/meetings/links/[id] - Get a single meeting link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const link = await prisma.meetingLink.findUnique({
      where: { id },
      include: {
        meetingType: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Meeting link not found" },
        { status: 404 }
      );
    }

    await checkOwnership(link.tenantId, request);

    return NextResponse.json(link);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/meetings/links/[id] - Deactivate a meeting link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.meetingLink.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Meeting link not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.meetingLink.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
