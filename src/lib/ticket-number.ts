import prisma from "@/lib/prisma";

/**
 * Get the next ticket number for a tenant using atomic increment.
 * Returns the new ticket number as an integer.
 */
export async function getNextTicketNumber(tenantId: string): Promise<number> {
  const counter = await prisma.ticketCounter.upsert({
    where: { tenantId },
    update: { lastNumber: { increment: 1 } },
    create: { tenantId, lastNumber: 1 },
  });

  return counter.lastNumber;
}

/**
 * Format a ticket number for display: 1 -> "T-0001"
 */
export function formatTicketNumber(ticketNumber: number): string {
  return `T-${String(ticketNumber).padStart(4, "0")}`;
}
