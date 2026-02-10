import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const associationSchema = z.object({
  type: z.enum([
    "contact-company",
    "deal-contact",
    "deal-company",
  ]),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
});

// POST /api/associations - Create an association
export async function POST(request: NextRequest) {
  try {
    await getTenantId(request);
    const body = await request.json();
    const data = associationSchema.parse(body);

    switch (data.type) {
      case "contact-company": {
        await prisma.contactCompany.create({
          data: {
            contactId: data.sourceId,
            companyId: data.targetId,
          },
        });
        break;
      }
      case "deal-contact": {
        await prisma.dealContact.create({
          data: {
            dealId: data.sourceId,
            contactId: data.targetId,
          },
        });
        break;
      }
      case "deal-company": {
        await prisma.dealCompany.create({
          data: {
            dealId: data.sourceId,
            companyId: data.targetId,
          },
        });
        break;
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation (association already exists)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "Association already exists" },
        { status: 409 }
      );
    }
    return handleApiError(error);
  }
}

// DELETE /api/associations - Remove an association
export async function DELETE(request: NextRequest) {
  try {
    await getTenantId(request);
    const body = await request.json();
    const data = associationSchema.parse(body);

    switch (data.type) {
      case "contact-company": {
        await prisma.contactCompany.delete({
          where: {
            contactId_companyId: {
              contactId: data.sourceId,
              companyId: data.targetId,
            },
          },
        });
        break;
      }
      case "deal-contact": {
        await prisma.dealContact.delete({
          where: {
            dealId_contactId: {
              dealId: data.sourceId,
              contactId: data.targetId,
            },
          },
        });
        break;
      }
      case "deal-company": {
        await prisma.dealCompany.delete({
          where: {
            dealId_companyId: {
              dealId: data.sourceId,
              companyId: data.targetId,
            },
          },
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
