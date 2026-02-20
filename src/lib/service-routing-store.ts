import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const routingPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const routingChannelSchema = z.enum(["email", "phone", "web", "chat"]);

const routingTeamSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  assigneeIds: z.array(z.string().min(1)).max(100),
});

const routingBusinessHoursSchema = z
  .object({
    timezone: z.string().min(1).max(100).default("UTC"),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(1).max(24),
  })
  .refine((value) => value.startHour < value.endHour, {
    message: "startHour must be before endHour",
    path: ["endHour"],
  });

const routingRuleSchema = z.object({
  teamId: z.string().nullable().optional(),
});

export const serviceRoutingPolicySchema = z.object({
  teams: z.array(routingTeamSchema).min(1).max(20),
  businessHours: routingBusinessHoursSchema,
  priorityRules: z.object({
    low: routingRuleSchema,
    medium: routingRuleSchema,
    high: routingRuleSchema,
    urgent: routingRuleSchema,
  }),
  channelRules: z.object({
    email: routingRuleSchema,
    phone: routingRuleSchema,
    web: routingRuleSchema,
    chat: routingRuleSchema,
  }),
  offHoursTeamId: z.string().nullable().optional(),
  fallbackAssigneeId: z.string().nullable().optional(),
});

export type ServiceRoutingPolicy = z.infer<typeof serviceRoutingPolicySchema>;

type UserAvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type RoutingCandidateUser = {
  id: string;
  role?: string | null;
  availability?: UserAvailabilityWindow[];
};

export type ResolveTicketAssignmentInput = {
  tenantId: string;
  priority: z.infer<typeof routingPrioritySchema>;
  source?: z.infer<typeof routingChannelSchema> | null;
  explicitAssigneeId?: string | null;
  createdAt?: Date;
  users: RoutingCandidateUser[];
};

export type ResolveTicketAssignmentResult = {
  assigneeId: string | null;
  teamId: string | null;
  reason: "manual" | "priority" | "channel" | "off_hours" | "fallback" | "unassigned";
  inBusinessHours: boolean;
};

export const DEFAULT_SERVICE_ROUTING_POLICY: ServiceRoutingPolicy = {
  teams: [
    {
      id: "general",
      name: "General Support",
      assigneeIds: [],
    },
  ],
  businessHours: {
    timezone: "UTC",
    weekdays: [1, 2, 3, 4, 5],
    startHour: 9,
    endHour: 18,
  },
  priorityRules: {
    low: { teamId: "general" },
    medium: { teamId: "general" },
    high: { teamId: "general" },
    urgent: { teamId: "general" },
  },
  channelRules: {
    email: { teamId: null },
    phone: { teamId: null },
    web: { teamId: null },
    chat: { teamId: null },
  },
  offHoursTeamId: null,
  fallbackAssigneeId: null,
};

const roundRobinState = new Map<string, number>();

function parseHHMMToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;
  return hours * 60 + minutes;
}

function isUserAvailableAt(user: RoutingCandidateUser, now: Date): boolean {
  if (!user.availability || user.availability.length === 0) {
    return true;
  }

  const currentDay = now.getUTCDay();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  return user.availability.some((window) => {
    if (window.dayOfWeek !== currentDay) return false;
    const start = parseHHMMToMinutes(window.startTime);
    const end = parseHHMMToMinutes(window.endTime);
    if (start < 0 || end < 0 || start >= end) return false;
    return currentMinutes >= start && currentMinutes < end;
  });
}

function clonePolicy(policy: ServiceRoutingPolicy): ServiceRoutingPolicy {
  return {
    teams: policy.teams.map((team) => ({ ...team, assigneeIds: [...team.assigneeIds] })),
    businessHours: {
      timezone: policy.businessHours.timezone,
      weekdays: [...policy.businessHours.weekdays],
      startHour: policy.businessHours.startHour,
      endHour: policy.businessHours.endHour,
    },
    priorityRules: {
      low: { teamId: policy.priorityRules.low.teamId ?? null },
      medium: { teamId: policy.priorityRules.medium.teamId ?? null },
      high: { teamId: policy.priorityRules.high.teamId ?? null },
      urgent: { teamId: policy.priorityRules.urgent.teamId ?? null },
    },
    channelRules: {
      email: { teamId: policy.channelRules.email.teamId ?? null },
      phone: { teamId: policy.channelRules.phone.teamId ?? null },
      web: { teamId: policy.channelRules.web.teamId ?? null },
      chat: { teamId: policy.channelRules.chat.teamId ?? null },
    },
    offHoursTeamId: policy.offHoursTeamId ?? null,
    fallbackAssigneeId: policy.fallbackAssigneeId ?? null,
  };
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizePolicy(value: Prisma.JsonValue | null | undefined): ServiceRoutingPolicy {
  const parsed = serviceRoutingPolicySchema.safeParse(value);
  if (parsed.success) return clonePolicy(parsed.data);
  return clonePolicy(DEFAULT_SERVICE_ROUTING_POLICY);
}

export function isInRoutingBusinessHours(
  policy: ServiceRoutingPolicy,
  at: Date
): boolean {
  const day = at.getUTCDay();
  const hour = at.getUTCHours();
  return (
    policy.businessHours.weekdays.includes(day) &&
    hour >= policy.businessHours.startHour &&
    hour < policy.businessHours.endHour
  );
}

export async function getServiceRoutingPolicy(tenantId: string): Promise<ServiceRoutingPolicy> {
  const row = await prisma.serviceRoutingPolicyConfig.findFirst({
    where: { tenantId },
  });

  if (!row) return clonePolicy(DEFAULT_SERVICE_ROUTING_POLICY);
  return normalizePolicy(row.policy);
}

export async function setServiceRoutingPolicy(
  tenantId: string,
  policy: ServiceRoutingPolicy
): Promise<ServiceRoutingPolicy> {
  const existing = await prisma.serviceRoutingPolicyConfig.findFirst({
    where: { tenantId },
  });

  if (existing) {
    await prisma.serviceRoutingPolicyConfig.update({
      where: { id: existing.id },
      data: {
        policy: toInputJsonValue(policy),
      },
    });
  } else {
    await prisma.serviceRoutingPolicyConfig.create({
      data: {
        tenantId,
        policy: toInputJsonValue(policy),
      },
    });
  }

  return clonePolicy(policy);
}

function pickRoundRobin(tenantId: string, key: string, assigneeIds: string[]): string | null {
  if (assigneeIds.length === 0) return null;
  const stateKey = `${tenantId}:${key}`;
  const current = roundRobinState.get(stateKey) ?? 0;
  const index = current % assigneeIds.length;
  roundRobinState.set(stateKey, current + 1);
  return assigneeIds[index] ?? null;
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export async function resolveTicketAssignment(
  input: ResolveTicketAssignmentInput
): Promise<ResolveTicketAssignmentResult> {
  if (input.explicitAssigneeId) {
    return {
      assigneeId: input.explicitAssigneeId,
      teamId: null,
      reason: "manual",
      inBusinessHours: true,
    };
  }

  const now = input.createdAt ?? new Date();
  const policy = await getServiceRoutingPolicy(input.tenantId);
  const inBusinessHours = isInRoutingBusinessHours(policy, now);

  const sourceRule = input.source ? policy.channelRules[input.source] : null;
  const priorityRule = policy.priorityRules[input.priority];

  let teamId: string | null = null;
  let reason: ResolveTicketAssignmentResult["reason"] = "unassigned";

  if (!inBusinessHours && policy.offHoursTeamId) {
    teamId = policy.offHoursTeamId;
    reason = "off_hours";
  } else if (priorityRule?.teamId) {
    teamId = priorityRule.teamId;
    reason = "priority";
  } else if (sourceRule?.teamId) {
    teamId = sourceRule.teamId;
    reason = "channel";
  }

  const allUserIds = uniqueIds(input.users.map((user) => user.id));
  let candidateUserIds = allUserIds;

  if (teamId) {
    const team = policy.teams.find((item) => item.id === teamId);
    candidateUserIds = uniqueIds(team?.assigneeIds || []);
  }

  const availableUsers = input.users
    .filter((user) => candidateUserIds.includes(user.id))
    .filter((user) => isUserAvailableAt(user, now))
    .map((user) => user.id);

  const selectedUserId = pickRoundRobin(
    input.tenantId,
    teamId || reason,
    availableUsers.length > 0 ? availableUsers : candidateUserIds
  );

  if (selectedUserId) {
    return {
      assigneeId: selectedUserId,
      teamId,
      reason,
      inBusinessHours,
    };
  }

  if (policy.fallbackAssigneeId && allUserIds.includes(policy.fallbackAssigneeId)) {
    return {
      assigneeId: policy.fallbackAssigneeId,
      teamId,
      reason: "fallback",
      inBusinessHours,
    };
  }

  return {
    assigneeId: null,
    teamId,
    reason: "unassigned",
    inBusinessHours,
  };
}

export async function resetServiceRoutingStoreForTests() {
  roundRobinState.clear();
  if (process.env.NODE_ENV !== "test") return;
  await prisma.serviceRoutingPolicyConfig.deleteMany();
}
