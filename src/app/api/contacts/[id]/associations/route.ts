import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/contacts/[id]/associations - List associations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const contact = await prisma.contact.findUnique({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const [companies, deals] = await Promise.all([
      prisma.contactCompany.findMany({
        where: { contactId: id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              domain: true,
              industry: true,
            },
          },
        },
      }),
      prisma.dealContact.findMany({
        where: { contactId: id },
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
      }),
    ]);

    return NextResponse.json({ data: { companies, deals } });
  } catch (error) {
    console.error("Error fetching associations:", error);
    return NextResponse.json(
      { error: "Failed to fetch associations" },
      { status: 500 }
    );
  }
}

// POST /api/contacts/[id]/associations - Create association
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const contact = await prisma.contact.findUnique({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    if (body.type === "company" && body.targetId) {
      const company = await prisma.company.findUnique({
        where: { id: body.targetId, tenantId, deletedAt: null },
        select: { id: true },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }

      // Check if already associated
      const existing = await prisma.contactCompany.findUnique({
        where: {
          contactId_companyId: { contactId: id, companyId: body.targetId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Association already exists" },
          { status: 409 }
        );
      }

      // Check if this is the first association (make it primary)
      const existingCount = await prisma.contactCompany.count({
        where: { contactId: id },
      });

      const association = await prisma.contactCompany.create({
        data: {
          contactId: id,
          companyId: body.targetId,
          isPrimary: existingCount === 0,
        },
        include: {
          company: {
            select: { id: true, name: true, domain: true, industry: true },
          },
        },
      });

      return NextResponse.json({ data: association }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid association type. Use 'company' with 'targetId'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating association:", error);
    return NextResponse.json(
      { error: "Failed to create association" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id]/associations - Remove association
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get("companyId");
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId query parameter is required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findUnique({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.contactCompany.findUnique({
      where: {
        contactId_companyId: { contactId: id, companyId },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    await prisma.contactCompany.delete({
      where: {
        contactId_companyId: { contactId: id, companyId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing association:", error);
    return NextResponse.json(
      { error: "Failed to remove association" },
      { status: 500 }
    );
  }
}
