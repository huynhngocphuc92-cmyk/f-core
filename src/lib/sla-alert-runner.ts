import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getActiveTicketsWithSla } from "@/lib/sla-service";

const ALERT_COOLDOWN_HOURS = 6;

type RunSlaAlertRunnerOptions = {
  tenantId: string;
  dryRun?: boolean;
};

type SlaAlertReason = "sla_breached" | "sla_at_risk";

async function createAlertIfNeeded(args: {
  tenantId: string;
  userId: string;
  ticketId: string;
  ticketSubject: string;
  reason: SlaAlertReason;
  dryRun: boolean;
}) {
  const cooldownSince = new Date(
    Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000
  );
  const type = args.reason === "sla_breached" ? "sla_breach" : "sla_at_risk";
  const link = `/tickets/${args.ticketId}`;

  const existing = await prisma.notification.findFirst({
    where: {
      tenantId: args.tenantId,
      userId: args.userId,
      type,
      link,
      createdAt: { gte: cooldownSince },
    },
  });

  if (existing) return { created: false, skipped: true };
  if (args.dryRun) return { created: false, skipped: false };

  await prisma.notification.create({
    data: {
      tenantId: args.tenantId,
      userId: args.userId,
      type,
      title:
        args.reason === "sla_breached"
          ? "SLA breached ticket"
          : "SLA at-risk ticket",
      message:
        args.reason === "sla_breached"
          ? `Ticket "${args.ticketSubject}" has breached SLA and needs immediate action.`
          : `Ticket "${args.ticketSubject}" is approaching SLA deadline.`,
      link,
      icon: args.reason === "sla_breached" ? "alert-triangle" : "clock",
      metadata: {
        ticketId: args.ticketId,
        reason: args.reason,
      } as Prisma.InputJsonValue,
    },
  });

  return { created: true, skipped: false };
}

export async function runSlaAlertRunner({
  tenantId,
  dryRun = false,
}: RunSlaAlertRunnerOptions) {
  const { tickets } = await getActiveTicketsWithSla(tenantId);

  const targetTickets = tickets.filter((ticket) => ticket.sla.breached || ticket.sla.atRisk);
  const fallbackUsers = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ["admin", "manager"] },
      deletedAt: null,
    },
    select: { id: true },
    take: 20,
  });

  let notificationsCreated = 0;
  let notificationsSuppressed = 0;
  let notificationsWouldCreate = 0;

  for (const ticket of targetTickets) {
    const recipients = new Set<string>();
    if (ticket.assignee?.id) recipients.add(ticket.assignee.id);
    fallbackUsers.forEach((user) => recipients.add(user.id));

    const reason: SlaAlertReason = ticket.sla.breached ? "sla_breached" : "sla_at_risk";

    for (const userId of recipients) {
      const result = await createAlertIfNeeded({
        tenantId,
        userId,
        ticketId: ticket.id,
        ticketSubject: ticket.subject,
        reason,
        dryRun,
      });
      if (result.created) notificationsCreated += 1;
      if (result.skipped) notificationsSuppressed += 1;
      if (!result.created && !result.skipped) notificationsWouldCreate += 1;
    }
  }

  return {
    tenantId,
    dryRun,
    targetTicketCount: targetTickets.length,
    notificationsCreated,
    notificationsSuppressed,
    notificationsWouldCreate,
  };
}
