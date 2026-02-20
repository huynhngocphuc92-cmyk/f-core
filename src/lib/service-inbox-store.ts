import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const serviceInboxExternalChannelSchema = z.enum([
  "email",
  "phone",
  "sms",
  "whatsapp",
  "facebook",
  "custom",
]);

export const serviceInboxThreadStatusSchema = z.enum([
  "open",
  "assigned",
  "resolved",
  "closed",
]);

export const serviceInboxThreadPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const createServiceInboxThreadSchema = z.object({
  channel: serviceInboxExternalChannelSchema,
  externalThreadId: z.string().min(1).max(160).optional(),
  subject: z.string().min(1).max(240),
  status: serviceInboxThreadStatusSchema.optional(),
  priority: serviceInboxThreadPrioritySchema.optional().nullable(),
  assigneeId: z.string().min(1).max(120).optional().nullable(),
  contactName: z.string().max(160).optional().nullable(),
  contactEmail: z.string().email().max(200).optional().nullable(),
  messagePreview: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
});

export type ServiceInboxThread = {
  id: string;
  tenantId: string;
  channel: z.infer<typeof serviceInboxExternalChannelSchema>;
  externalThreadId: string | null;
  subject: string;
  status: z.infer<typeof serviceInboxThreadStatusSchema>;
  priority: z.infer<typeof serviceInboxThreadPrioritySchema> | null;
  assigneeId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  messagePreview: string | null;
  metadata: Record<string, unknown>;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function normalizeMetadata(value: unknown) {
  const parsed = z.record(z.string(), z.unknown()).safeParse(
    value && typeof value === "object" ? value : {}
  );
  return parsed.success ? parsed.data : {};
}

function normalizeServiceInboxThread(row: {
  id: string;
  tenantId: string;
  channel: string;
  externalThreadId: string | null;
  subject: string;
  status: string;
  priority: string | null;
  assigneeId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  messagePreview: string | null;
  metadata: unknown;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    channel: serviceInboxExternalChannelSchema.parse(row.channel),
    externalThreadId: row.externalThreadId,
    subject: row.subject,
    status: serviceInboxThreadStatusSchema.parse(row.status),
    priority: row.priority ? serviceInboxThreadPrioritySchema.parse(row.priority) : null,
    assigneeId: row.assigneeId,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    messagePreview: row.messagePreview,
    metadata: normalizeMetadata(row.metadata),
    lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } satisfies ServiceInboxThread;
}

export async function createServiceInboxThread(
  tenantId: string,
  payload: z.infer<typeof createServiceInboxThreadSchema>
) {
  const row = await prisma.serviceOmnichannelThread.create({
    data: {
      tenantId,
      channel: payload.channel,
      externalThreadId: payload.externalThreadId || null,
      subject: payload.subject,
      status: payload.status || "open",
      priority: payload.priority || null,
      assigneeId: payload.assigneeId || null,
      contactName: payload.contactName || null,
      contactEmail: payload.contactEmail || null,
      messagePreview: payload.messagePreview || null,
      metadata: (payload.metadata || {}) as Prisma.InputJsonValue,
      lastMessageAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
    },
    select: {
      id: true,
      tenantId: true,
      channel: true,
      externalThreadId: true,
      subject: true,
      status: true,
      priority: true,
      assigneeId: true,
      contactName: true,
      contactEmail: true,
      messagePreview: true,
      metadata: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return normalizeServiceInboxThread(row);
}

export async function listServiceInboxThreads(
  tenantId: string,
  filters?: {
    channel?: z.infer<typeof serviceInboxExternalChannelSchema>;
    status?: z.infer<typeof serviceInboxThreadStatusSchema>;
    search?: string;
    take?: number;
  }
) {
  const rows = await prisma.serviceOmnichannelThread.findMany({
    where: {
      tenantId,
      channel: filters?.channel,
      status: filters?.status,
      ...(filters?.search
        ? {
            OR: [
              {
                subject: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                contactName: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                contactEmail: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: filters?.take || 200,
    select: {
      id: true,
      tenantId: true,
      channel: true,
      externalThreadId: true,
      subject: true,
      status: true,
      priority: true,
      assigneeId: true,
      contactName: true,
      contactEmail: true,
      messagePreview: true,
      metadata: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((row) => normalizeServiceInboxThread(row));
}

export async function countServiceInboxThreads(
  tenantId: string,
  filters?: {
    channel?: z.infer<typeof serviceInboxExternalChannelSchema>;
    status?: z.infer<typeof serviceInboxThreadStatusSchema>;
    search?: string;
  }
) {
  return prisma.serviceOmnichannelThread.count({
    where: {
      tenantId,
      channel: filters?.channel,
      status: filters?.status,
      ...(filters?.search
        ? {
            OR: [
              {
                subject: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                contactName: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                contactEmail: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
  });
}

export async function resetServiceInboxStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.serviceOmnichannelThread.deleteMany();
}
