import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { z } from "zod";
import { nanoid } from "nanoid";

const sendEmailSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  templateId: z.string().optional(),
});

// GET /api/emails - List sent emails (activities with type="email")
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");

    const additionalWhere = {
      type: "email",
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" as const } },
              { emailTo: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [emails, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          owner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return paginatedResponse(emails, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/emails - Send an email (create activity)
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = sendEmailSchema.parse(body);

    const trackingId = nanoid();

    const activity = await prisma.activity.create({
      data: {
        tenantId,
        type: "email",
        subject: data.subject,
        body: data.body,
        emailTo: data.to,
        emailCc: data.cc,
        emailBcc: data.bcc,
        emailStatus: "sent",
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        ownerId: user.id,
        metadata: {
          trackingId,
          templateId: data.templateId,
          sentAt: new Date().toISOString(),
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        owner: { select: { id: true, name: true } },
      },
    });

    // Increment template usage if used
    if (data.templateId) {
      await prisma.emailTemplate.update({
        where: { id: data.templateId },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Simulate delivery
    await prisma.activity.update({
      where: { id: activity.id },
      data: { emailStatus: "delivered" },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
