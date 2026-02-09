import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { validatePagination, buildWhereClause, paginatedResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/companies - List all companies (with tenant isolation)
export async function GET(request: NextRequest) {
  try {
    // Authentication & tenant isolation
    const tenantId = await getTenantId(request);
    
    // Pagination
    const { page, limit, skip } = validatePagination(request.nextUrl.searchParams);
    
    // Search filters
    const search = request.nextUrl.searchParams.get("search") || "";

    const additionalWhere = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { domain: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

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

    return paginatedResponse(companies, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/companies - Create a new company (with tenant isolation)
export async function POST(request: NextRequest) {
  try {
    // Authentication & tenant isolation
    const tenantId = await getTenantId(request);
    
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        tenantId,  // Use authenticated user's tenant, NOT from request body!
        name: body.name,
        domain: body.domain,
        description: body.description,
        industry: body.industry,
        type: body.type,
        size: body.size,
        annualRevenue: body.annualRevenue,
        phone: body.phone,
        website: body.website,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        ownerId: body.ownerId,
        properties: body.properties || {},
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
