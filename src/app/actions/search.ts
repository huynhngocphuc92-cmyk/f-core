"use server";

import prisma from "@/lib/prisma";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

export interface SearchResult {
  id: string;
  name: string;
  subtitle?: string;
  link: string;
  type: "contact" | "company" | "deal" | "ticket";
}

export interface GroupedSearchResults {
  contacts: SearchResult[];
  companies: SearchResult[];
  deals: SearchResult[];
  tickets: SearchResult[];
}

export async function globalSearch(query: string): Promise<GroupedSearchResults> {
  if (!query || query.trim().length < 2) {
    return { contacts: [], companies: [], deals: [], tickets: [] };
  }

  const tenantId = await getTenantId();
  const searchTerm = query.trim();

  const [contacts, companies, deals, tickets] = await Promise.all([
    // Search Contacts
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
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),

    // Search Companies
    prisma.company.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { domain: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        domain: true,
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),

    // Search Deals
    prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        name: { contains: searchTerm, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),

    // Search Tickets
    prisma.ticket.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { subject: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        subject: true,
        ticketNumber: true,
        status: true,
        priority: true,
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    contacts: contacts.map((c) => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed",
      subtitle: c.email || undefined,
      link: `/contacts/${c.id}`,
      type: "contact" as const,
    })),
    companies: companies.map((c) => ({
      id: c.id,
      name: c.name,
      subtitle: c.domain || undefined,
      link: `/companies/${c.id}`,
      type: "company" as const,
    })),
    deals: deals.map((d) => ({
      id: d.id,
      name: d.name,
      subtitle: d.amount
        ? `${d.currency} ${Number(d.amount).toLocaleString()}`
        : undefined,
      link: `/deals/${d.id}`,
      type: "deal" as const,
    })),
    tickets: tickets.map((t) => ({
      id: t.id,
      name: t.subject,
      subtitle: `#${t.ticketNumber} - ${t.status}`,
      link: `/tickets/${t.id}`,
      type: "ticket" as const,
    })),
  };
}
