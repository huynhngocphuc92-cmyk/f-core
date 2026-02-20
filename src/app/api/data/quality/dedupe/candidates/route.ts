import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  detectCompanyDuplicates,
  detectContactDuplicates,
  qualityObjectTypeSchema,
} from "@/lib/data-quality-store";

function parseLimit(raw: string | null) {
  const parsed = Number(raw || 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(200, Math.max(10, parsed));
}

// GET /api/data/quality/dedupe/candidates?objectType=contact|company&limit=50
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const objectType = qualityObjectTypeSchema.parse(
      request.nextUrl.searchParams.get("objectType") || "contact"
    );
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

    if (objectType === "contact") {
      const contacts = await prisma.contact.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
      });

      const candidates = detectContactDuplicates(contacts);
      return NextResponse.json({ data: candidates, totalCandidates: candidates.length });
    }

    const companies = await prisma.company.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        phone: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    const candidates = detectCompanyDuplicates(companies);
    return NextResponse.json({ data: candidates, totalCandidates: candidates.length });
  } catch (error) {
    return handleApiError(error);
  }
}
