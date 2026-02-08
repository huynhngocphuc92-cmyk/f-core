import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/companies/[id] - Get a single company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const company = await prisma.company.findUnique({
      where: { id, tenantId, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        deals: {
          include: {
            deal: {
              select: {
                id: true,
                name: true,
                amount: true,
                stage: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: company });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PATCH /api/companies/[id] - Update a company
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.company.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.domain !== undefined && { domain: body.domain }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.industry !== undefined && { industry: body.industry }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.size !== undefined && { size: body.size }),
        ...(body.annualRevenue !== undefined && { annualRevenue: body.annualRevenue }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.linkedinUrl !== undefined && { linkedinUrl: body.linkedinUrl }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
        ...(body.ownerId !== undefined && { ownerId: body.ownerId }),
        ...(body.lifecycleStage !== undefined && { lifecycleStage: body.lifecycleStage }),
        ...(body.properties !== undefined && { properties: body.properties }),
        updatedBy: body.updatedBy,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ data: company });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Soft delete a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.company.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
