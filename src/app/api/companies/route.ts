import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/companies - List all companies
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";
    const type = searchParams.get("type") || "";
    const size = searchParams.get("size") || "";

    const skip = (page - 1) * limit;
    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { domain: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(industry && { industry }),
      ...(type && { type }),
      ...(size && { size }),
    };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { contacts: true, deals: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      data: companies,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    // TODO: Get tenantId from authenticated user session
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const company = await prisma.company.create({
      data: {
        tenantId,
        name: body.name.trim(),
        domain: body.domain || null,
        description: body.description || null,
        industry: body.industry || null,
        type: body.type || null,
        size: body.size || null,
        annualRevenue: body.annualRevenue || null,
        phone: body.phone || null,
        website: body.website || null,
        linkedinUrl: body.linkedinUrl || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        postalCode: body.postalCode || null,
        ownerId: body.ownerId || null,
        lifecycleStage: body.lifecycleStage || null,
        properties: body.properties || {},
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { contacts: true, deals: true } },
      },
    });

    return NextResponse.json({ data: company }, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
