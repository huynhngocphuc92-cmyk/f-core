import { tool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";

export function companyTools(tenantId: string) {
  return {
    search_companies: tool({
      description:
        "Search for companies by name, domain, or industry. Returns a list of matching companies.",
      inputSchema: z.object({
        query: z.string().describe("Search query (name, domain, or industry)"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(5)
          .describe("Max results to return"),
      }),
      execute: async ({ query, limit }) => {
        const companies = await prisma.company.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { domain: { contains: query, mode: "insensitive" } },
              { industry: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            domain: true,
            industry: true,
            size: true,
            annualRevenue: true,
            owner: { select: { name: true } },
          },
          take: limit,
          orderBy: { updatedAt: "desc" },
        });
        return { companies, count: companies.length };
      },
    }),

    get_company: tool({
      description:
        "Get detailed information about a specific company, including its contacts.",
      inputSchema: z.object({
        id: z.string().describe("The company ID"),
      }),
      execute: async ({ id }) => {
        const company = await prisma.company.findFirst({
          where: { id, tenantId, deletedAt: null },
          include: {
            owner: { select: { name: true, email: true } },
            contacts: {
              include: {
                contact: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    jobTitle: true,
                  },
                },
              },
              take: 10,
            },
          },
        });
        if (!company) return { error: "Company not found" };
        return company;
      },
    }),
  };
}
