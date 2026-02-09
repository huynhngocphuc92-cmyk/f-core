import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { validatePagination, buildWhereClause, paginatedResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/contacts - List all contacts (with tenant isolation)
export async function GET(request: NextRequest) {
  try {
    // Authentication & tenant isolation
    const tenantId = await getTenantId(request);
    
    // Pagination
    const { page, limit, skip } = validatePagination(request.nextUrl.searchParams);
    
    // Search filters
    const search = request.nextUrl.searchParams.get("search") || "";
    const lifecycleStage = request.nextUrl.searchParams.get("lifecycleStage");

    const additionalWhere = {
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(lifecycleStage && { lifecycleStage }),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          companies: {
            include: { company: { select: { id: true, name: true } } },
            where: { isPrimary: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return paginatedResponse(contacts, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/contacts - Create a new contact (with validation & tenant isolation)
export async function POST(request: NextRequest) {
  try {
    // Authentication & tenant isolation
    const tenantId = await getTenantId(request);
    
    const body = await request.json();

    // Basic validation (Zod would be better but keeping it simple for now)
    if (!body.email && !body.firstName) {
      return NextResponse.json(
        { error: "Email or first name is required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId,  // Use authenticated user's tenant, NOT from request body!
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        mobilePhone: body.mobilePhone,
        lifecycleStage: body.lifecycleStage || "subscriber",
        leadStatus: body.leadStatus,
        ownerId: body.ownerId,
        jobTitle: body.jobTitle,
        department: body.department,
        website: body.website,
        linkedinUrl: body.linkedinUrl,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        properties: body.properties || {},
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
