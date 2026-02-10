import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/search?q=term - Global search across contacts, companies, deals, tickets
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);

    const query = request.nextUrl.searchParams.get("q");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(parseInt(limitParam || "5", 10), 20);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        contacts: [],
        companies: [],
        deals: [],
        tickets: [],
      });
    }

    const searchTerm = query.trim();

    const [contacts, companies, deals, tickets] = await Promise.all([
      prisma.contact.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),

      prisma.company.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { domain: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, domain: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),

      prisma.deal.findMany({
        where: {
          tenantId,
          deletedAt: null,
          name: { contains: searchTerm, mode: "insensitive" },
        },
        select: { id: true, name: true, amount: true, currency: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),

      prisma.ticket.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            {
              subject: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          subject: true,
          ticketNumber: true,
          status: true,
          priority: true,
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      contacts: contacts.map((c) => ({
        id: c.id,
        name:
          [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed",
        subtitle: c.email || undefined,
        link: `/contacts/${c.id}`,
        type: "contact",
      })),
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        subtitle: c.domain || undefined,
        link: `/companies/${c.id}`,
        type: "company",
      })),
      deals: deals.map((d) => ({
        id: d.id,
        name: d.name,
        subtitle: d.amount
          ? `${d.currency} ${Number(d.amount).toLocaleString()}`
          : undefined,
        link: `/deals/${d.id}`,
        type: "deal",
      })),
      tickets: tickets.map((t) => ({
        id: t.id,
        name: t.subject,
        subtitle: `#${t.ticketNumber} - ${t.status}`,
        link: `/tickets/${t.id}`,
        type: "ticket",
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
