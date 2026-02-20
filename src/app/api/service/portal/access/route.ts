import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { issueCustomerPortalToken } from "@/lib/customer-portal-token";

const accessSchema = z.object({
  tenantId: z.string().min(1),
  email: z.string().email(),
  expiresInMinutes: z.number().int().min(10).max(60 * 24 * 7).optional(),
});

// POST /api/service/portal/access - Issue contact-scoped portal token (demo magic-link)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = accessSchema.parse(body);

    const contact = await prisma.contact.findFirst({
      where: {
        tenantId: data.tenantId,
        email: data.email,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!contact || !contact.email) {
      throw new ApiError(404, "Contact not found");
    }

    const { token, expiresAt } = issueCustomerPortalToken({
      tenantId: contact.tenantId,
      contactId: contact.id,
      email: contact.email,
      expiresInMinutes: data.expiresInMinutes,
    });

    const portalPath = `/portal/tickets?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      token,
      expiresAt,
      portalPath,
      contact: {
        id: contact.id,
        email: contact.email,
        name: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
