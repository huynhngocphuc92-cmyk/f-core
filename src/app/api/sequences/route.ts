import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createSequenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  steps: z.array(z.record(z.string(), z.unknown())).optional(),
});

// GET /api/sequences - List sequences
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    const additionalWhere = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [sequences, total] = await Promise.all([
      prisma.sequence.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sequence.count({ where }),
    ]);

    return paginatedResponse(sequences, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/sequences - Create a sequence
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createSequenceSchema.parse(body);

    const sequence = await prisma.sequence.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        steps: (data.steps || []) as Prisma.InputJsonValue,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
