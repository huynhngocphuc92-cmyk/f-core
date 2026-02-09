import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/contacts/[id] - Get a single contact (with tenant check)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);

    const contact = await prisma.contact.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        companies: {
          include: { company: true },
        },
        deals: {
          include: { deal: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Check tenant ownership
    await checkOwnership(contact.tenantId, request);

    return NextResponse.json(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/contacts/[id] - Update a contact (with tenant check)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);
    const body = await request.json();

    // Fetch contact first to verify ownership
    const existingContact = await prisma.contact.findUnique({
      where: { id, deletedAt: null },
      select: { tenantId: true },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Check tenant ownership
    await checkOwnership(existingContact.tenantId, request);

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(body.email !== undefined && { email: body.email }),
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.mobilePhone !== undefined && { mobilePhone: body.mobilePhone }),
        ...(body.lifecycleStage !== undefined && { lifecycleStage: body.lifecycleStage }),
        ...(body.leadStatus !== undefined && { leadStatus: body.leadStatus }),
        ...(body.ownerId !== undefined && { ownerId: body.ownerId }),
        ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
        ...(body.department !== undefined && { department: body.department }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
        ...(body.properties !== undefined && { properties: body.properties }),
        updatedBy: body.updatedBy,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/contacts/[id] - Soft delete a contact (with tenant check)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(request);

    // Fetch contact first to verify ownership
    const existingContact = await prisma.contact.findUnique({
      where: { id, deletedAt: null },
      select: { tenantId: true },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Check tenant ownership
    await checkOwnership(existingContact.tenantId, request);

    // Soft delete
    await prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
