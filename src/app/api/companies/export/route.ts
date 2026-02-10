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

// GET /api/companies/export - Export companies as CSV
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);

    const where = buildWhereClause(tenantId, { deletedAt: null });

    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // CSV headers
    const headers = [
      "name",
      "domain",
      "industry",
      "size",
      "phone",
      "website",
      "city",
      "country",
    ];

    // Build CSV rows
    const rows = companies.map((company) =>
      [
        escapeCsvField(company.name),
        escapeCsvField(company.domain),
        escapeCsvField(company.industry),
        escapeCsvField(company.size),
        escapeCsvField(company.phone),
        escapeCsvField(company.website),
        escapeCsvField(company.city),
        escapeCsvField(company.country),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="companies-${timestamp}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
