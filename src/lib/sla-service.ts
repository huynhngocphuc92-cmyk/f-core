import prisma from "@/lib/prisma";
import { getSlaPolicy } from "@/lib/sla-policy-store";
import { withTicketSla } from "@/lib/sla-helpers";

type SlaTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  dueDate: Date | null;
  firstResponseAt: Date | null;
  assignee: { id: string; name: string | null } | null;
};

export async function getActiveTicketsWithSla(tenantId: string) {
  const policy = await getSlaPolicy(tenantId);

  const tickets = (await prisma.ticket.findMany({
    where: {
      tenantId,
      deletedAt: null,
      status: { in: ["open", "in_progress", "waiting"] },
    },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      dueDate: true,
      firstResponseAt: true,
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  })) as SlaTicket[];

  return {
    policy,
    tickets: tickets.map((ticket) => withTicketSla(ticket, new Date(), policy)),
  };
}
