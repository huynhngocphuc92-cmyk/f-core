import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TENANT_ID = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

// GET /api/emails/[id] - Get email detail with events
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const email = await prisma.email.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
        events: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        attachments: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ data: email });
  } catch (error) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
}

// PATCH /api/emails/[id] - Update email (draft only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.email.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft emails can be edited" },
        { status: 400 }
      );
    }

    const email = await prisma.email.update({
      where: { id },
      data: {
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.bodyHtml !== undefined && { bodyHtml: body.bodyHtml }),
        ...(body.bodyText !== undefined && { bodyText: body.bodyText }),
        ...(body.toRecipients && { toRecipients: body.toRecipients }),
        ...(body.ccRecipients !== undefined && {
          ccRecipients: body.ccRecipients,
        }),
        ...(body.bccRecipients !== undefined && {
          bccRecipients: body.bccRecipients,
        }),
        ...(body.contactId !== undefined && { contactId: body.contactId }),
        ...(body.companyId !== undefined && { companyId: body.companyId }),
        ...(body.dealId !== undefined && { dealId: body.dealId }),
      },
    });

    return NextResponse.json({ data: email });
  } catch (error) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}

// DELETE /api/emails/[id] - Soft delete email
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.email.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    await prisma.email.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Email deleted" });
  } catch (error) {
    console.error("Error deleting email:", error);
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}
