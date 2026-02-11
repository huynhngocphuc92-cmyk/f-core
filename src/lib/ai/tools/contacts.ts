import { tool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";

export function contactTools(tenantId: string) {
  return {
    search_contacts: tool({
      description:
        "Search for contacts by name, email, or phone. Returns a list of matching contacts.",
      inputSchema: z.object({
        query: z.string().describe("Search query (name, email, or phone)"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(5)
          .describe("Max results to return"),
      }),
      execute: async ({ query, limit }) => {
        const contacts = await prisma.contact.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            lifecycleStage: true,
            jobTitle: true,
            owner: { select: { name: true } },
          },
          take: limit,
          orderBy: { updatedAt: "desc" },
        });
        return { contacts, count: contacts.length };
      },
    }),

    get_contact: tool({
      description:
        "Get detailed information about a specific contact, including their recent activities.",
      inputSchema: z.object({
        id: z.string().describe("The contact ID"),
      }),
      execute: async ({ id }) => {
        const contact = await prisma.contact.findFirst({
          where: { id, tenantId, deletedAt: null },
          include: {
            owner: { select: { name: true, email: true } },
            companies: {
              include: { company: { select: { id: true, name: true } } },
            },
            activities: {
              take: 5,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                type: true,
                subject: true,
                createdAt: true,
              },
            },
            deals: {
              include: {
                deal: {
                  select: { id: true, name: true, amount: true, stageId: true },
                },
              },
            },
          },
        });
        if (!contact) return { error: "Contact not found" };
        return contact;
      },
    }),
  };
}
