import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const TENANT_ID = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  subject: z.string().max(998).optional(),
  bodyHtml: z.string().max(500000).optional(),
  bodyText: z.string().max(500000).optional(),
  category: z.string().max(100).optional(),
  isShared: z.boolean().optional(),
});

// GET /api/email-templates - List templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const templates = await prisma.emailTemplate.findMany({
      where: {
        tenantId: TENANT_ID,
        deletedAt: null,
        isActive: true,
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ useCount: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/email-templates - Create template
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = createTemplateSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const owner = await prisma.user.findFirst({
      where: { tenantId: TENANT_ID },
    });

    const template = await prisma.emailTemplate.create({
      data: {
        tenantId: TENANT_ID,
        name: body.name,
        subject: body.subject || null,
        bodyHtml: body.bodyHtml || null,
        bodyText: body.bodyText || null,
        category: body.category || null,
        isShared: body.isShared || false,
        createdById: owner?.id || null,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
