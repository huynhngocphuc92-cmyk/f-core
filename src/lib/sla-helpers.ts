import { DEFAULT_SLA_POLICY, type SlaPolicy } from "@/lib/sla-policy-store";

type TicketPriority = "low" | "medium" | "high" | "urgent";

type TicketSlaInput = {
  createdAt: Date;
  dueDate?: Date | null;
  firstResponseAt?: Date | null;
  status: string;
  priority: string;
};

type SlaTarget = {
  firstResponseMinutes: number;
  resolutionHours: number;
};

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function isTerminalStatus(status: string): boolean {
  return status === "resolved" || status === "closed";
}

export function getSlaTarget(priority: string, policy: SlaPolicy = DEFAULT_SLA_POLICY): SlaTarget {
  if (priority === "low") return policy.low;
  if (priority === "high") return policy.high;
  if (priority === "urgent") return policy.urgent;
  return policy.medium;
}

export function computeTicketDueDate(
  createdAt: Date,
  priority: string,
  policy: SlaPolicy = DEFAULT_SLA_POLICY,
): Date {
  const target = getSlaTarget(priority, policy);
  return addHours(createdAt, target.resolutionHours);
}

export function getSlaStatus(
  ticket: TicketSlaInput,
  now = new Date(),
  policy: SlaPolicy = DEFAULT_SLA_POLICY,
) {
  const target = getSlaTarget(ticket.priority, policy);
  const firstResponseDueAt = addMinutes(ticket.createdAt, target.firstResponseMinutes);
  const resolutionDueAt = ticket.dueDate ?? computeTicketDueDate(ticket.createdAt, ticket.priority, policy);
  const terminal = isTerminalStatus(ticket.status);

  const firstResponseBreached = !ticket.firstResponseAt && now > firstResponseDueAt;
  const resolutionBreached = !terminal && now > resolutionDueAt;

  const firstResponseRemainingMinutes = Math.round(
    (firstResponseDueAt.getTime() - now.getTime()) / (60 * 1000),
  );
  const resolutionRemainingMinutes = Math.round(
    (resolutionDueAt.getTime() - now.getTime()) / (60 * 1000),
  );

  const atRisk =
    !terminal &&
    !resolutionBreached &&
    resolutionRemainingMinutes <= 120 &&
    resolutionRemainingMinutes >= 0;
  const firstResponseAtRisk =
    !ticket.firstResponseAt &&
    !firstResponseBreached &&
    firstResponseRemainingMinutes <= 15 &&
    firstResponseRemainingMinutes >= 0;

  return {
    breached: firstResponseBreached || resolutionBreached,
    atRisk: atRisk || firstResponseAtRisk,
    firstResponse: {
      dueAt: firstResponseDueAt.toISOString(),
      respondedAt: ticket.firstResponseAt?.toISOString() ?? null,
      breached: firstResponseBreached,
      remainingMinutes: firstResponseRemainingMinutes,
    },
    resolution: {
      dueAt: resolutionDueAt.toISOString(),
      breached: resolutionBreached,
      remainingMinutes: resolutionRemainingMinutes,
    },
    targets: target,
  };
}

export function withTicketSla<T extends TicketSlaInput>(
  ticket: T,
  now = new Date(),
  policy: SlaPolicy = DEFAULT_SLA_POLICY,
) {
  return {
    ...ticket,
    sla: getSlaStatus(ticket, now, policy),
  };
}

export function getAllSlaTargets() {
  return DEFAULT_SLA_POLICY;
}
