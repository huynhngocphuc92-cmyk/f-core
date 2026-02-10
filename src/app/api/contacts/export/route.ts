import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { buildWhereClause, handleApiError } from "@/lib/api-helpers";

// CSV field escape: wrap in quotes if the value contains comma, quote, or newline
function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/contacts/export - Export contacts as CSV
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);

    const where = buildWhereClause(tenantId, { deletedAt: null });

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        companies: {
          include: { company: { select: { name: true } } },
          where: { isPrimary: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // CSV headers
    const headers = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "lifecycleStage",
      "jobTitle",
      "company",
      "city",
      "country",
    ];

    // Build CSV rows
    const rows = contacts.map((contact) => {
      const primaryCompany = contact.companies[0]?.company?.name || "";
      return [
        escapeCsvField(contact.firstName),
        escapeCsvField(contact.lastName),
        escapeCsvField(contact.email),
        escapeCsvField(contact.phone),
        escapeCsvField(contact.lifecycleStage),
        escapeCsvField(contact.jobTitle),
        escapeCsvField(primaryCompany),
        escapeCsvField(contact.city),
        escapeCsvField(contact.country),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="contacts-${timestamp}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
