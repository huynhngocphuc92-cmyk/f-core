import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  category: z.string().max(100).nullable().optional(),
  isShared: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/emails/templates/[id] - Get a single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const template = await prisma.emailTemplate.findFirst({
      where: { id, deletedAt: null },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await checkOwnership(template.tenantId, request);

    return NextResponse.json(template);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/emails/templates/[id] - Update a template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    const existing = await prisma.emailTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isShared !== undefined && { isShared: data.isShared }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { owner: { select: { id: true, name: true } } },
    });

    return NextResponse.json(template);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/emails/templates/[id] - Soft delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.emailTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.emailTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
