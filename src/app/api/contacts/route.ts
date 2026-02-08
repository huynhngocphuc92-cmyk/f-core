import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/contacts - List all contacts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const lifecycleStage = searchParams.get("lifecycleStage") || "";
    const leadStatus = searchParams.get("leadStatus") || "";

    const skip = (page - 1) * limit;
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(lifecycleStage && { lifecycleStage }),
      ...(leadStatus && { leadStatus }),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          companies: {
            include: { company: { select: { id: true, name: true, domain: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      data: contacts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email && !body.firstName) {
      return NextResponse.json(
        { error: "Email or first name is required" },
        { status: 400 }
      );
    }

    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        email: body.email || null,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        phone: body.phone || null,
        mobilePhone: body.mobilePhone || null,
        lifecycleStage: body.lifecycleStage || "subscriber",
        leadStatus: body.leadStatus || null,
        ownerId: body.ownerId || null,
        jobTitle: body.jobTitle || null,
        department: body.department || null,
        website: body.website || null,
        linkedinUrl: body.linkedinUrl || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        postalCode: body.postalCode || null,
        properties: body.properties || {},
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Create company association if companyId provided
    if (body.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: body.companyId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (company) {
        await prisma.contactCompany.create({
          data: {
            contactId: contact.id,
            companyId: body.companyId,
            isPrimary: true,
          },
        });
      }
    }

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
