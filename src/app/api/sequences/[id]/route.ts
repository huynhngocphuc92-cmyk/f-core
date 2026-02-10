import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateSequenceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
  steps: z.array(z.record(z.string(), z.unknown())).optional(),
});

// GET /api/sequences/[id] - Get a single sequence
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const sequence = await prisma.sequence.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { startedAt: "desc" },
          take: 50,
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    await checkOwnership(sequence.tenantId, request);

    return NextResponse.json(sequence);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/sequences/[id] - Update a sequence
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateSequenceSchema.parse(body);

    const existing = await prisma.sequence.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const sequence = await prisma.sequence.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.steps !== undefined && {
          steps: data.steps as unknown as Prisma.InputJsonValue,
        }),
      },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json(sequence);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/sequences/[id] - Soft delete a sequence
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.sequence.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.sequence.update({
      where: { id },
      data: { deletedAt: new Date(), status: "draft" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
