import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { validatePagination, handleApiError } from "@/lib/api-helpers";
import {
  countServiceInboxThreads,
  createServiceInboxThread,
  createServiceInboxThreadSchema,
  listServiceInboxThreads,
  serviceInboxThreadStatusSchema,
} from "@/lib/service-inbox-store";

const externalChannels = [
  "email",
  "phone",
  "sms",
  "whatsapp",
  "facebook",
  "custom",
] as const;

type ExternalInboxChannel = (typeof externalChannels)[number];
type InboxChannel = "ticket" | "chat" | ExternalInboxChannel;

type InboxItem = {
  id: string;
  type: InboxChannel;
  channel: InboxChannel;
  subject: string;
  status: string;
  priority: string | null;
  assignee: { id: string; name: string | null } | null;
  contact: { id: string; name: string; email: string | null } | null;
  updatedAt: string;
  createdAt: string;
};

function mergeAndPaginate(
  items: InboxItem[],
  page: number,
  limit: number,
  total: number
) {
  const sorted = items.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const skip = (page - 1) * limit;
  const data = sorted.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  });
}

function isExternalChannel(value: string): value is ExternalInboxChannel {
  return (externalChannels as readonly string[]).includes(value);
}

function buildThreadContact(item: {
  id: string;
  contactName: string | null;
  contactEmail: string | null;
}) {
  if (!item.contactName && !item.contactEmail) return null;
  return {
    id: item.id,
    name: item.contactName || item.contactEmail || "Unknown contact",
    email: item.contactEmail || null,
  };
}

// GET /api/service/inbox - Unified inbox (tickets + chat + omnichannel threads)
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit } = validatePagination(request.nextUrl.searchParams);

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");
    const channel = request.nextUrl.searchParams.get("channel") || "all";

    const ticketWhere = {
      tenantId,
      deletedAt: null,
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const chatWhere = {
      tenantId,
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                visitorName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                visitorEmail: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const includeTickets = channel === "all" || channel === "ticket";
    const includeChats = channel === "all" || channel === "chat";
    const threadChannel = isExternalChannel(channel) ? channel : undefined;
    const includeThreads = channel === "all" || Boolean(threadChannel);
    const threadStatus = status
      ? serviceInboxThreadStatusSchema.safeParse(status).data
      : undefined;

    const [tickets, chats, threads, ticketCount, chatCount, threadCount] = await Promise.all([
      includeTickets
        ? prisma.ticket.findMany({
            where: ticketWhere,
            include: {
              assignee: { select: { id: true, name: true } },
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: { updatedAt: "desc" },
            take: 200,
          })
        : Promise.resolve([]),
      includeChats
        ? prisma.chatConversation.findMany({
            where: chatWhere,
            include: {
              assignee: { select: { id: true, name: true } },
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: { updatedAt: "desc" },
            take: 200,
          })
        : Promise.resolve([]),
      includeThreads
        ? listServiceInboxThreads(tenantId, {
            channel: threadChannel,
            status: threadStatus,
            search: search || undefined,
            take: 200,
          })
        : Promise.resolve([]),
      includeTickets ? prisma.ticket.count({ where: ticketWhere }) : Promise.resolve(0),
      includeChats
        ? prisma.chatConversation.count({ where: chatWhere })
        : Promise.resolve(0),
      includeThreads
        ? countServiceInboxThreads(tenantId, {
            channel: threadChannel,
            status: threadStatus,
            search: search || undefined,
          })
        : Promise.resolve(0),
    ]);

    const ticketItems: InboxItem[] = tickets.map((ticket) => ({
      id: ticket.id,
      type: "ticket",
      channel: "ticket",
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority || null,
      assignee: ticket.assignee,
      contact: ticket.contact
        ? {
            id: ticket.contact.id,
            name: `${ticket.contact.firstName || ""} ${ticket.contact.lastName || ""}`.trim(),
            email: ticket.contact.email || null,
          }
        : null,
      updatedAt: ticket.updatedAt.toISOString(),
      createdAt: ticket.createdAt.toISOString(),
    }));

    const chatItems: InboxItem[] = chats.map((chat) => ({
      id: chat.id,
      type: "chat",
      channel: "chat",
      subject: chat.visitorName || chat.visitorEmail || "Anonymous visitor",
      status: chat.status,
      priority: null,
      assignee: chat.assignee,
      contact: chat.contact
        ? {
            id: chat.contact.id,
            name: `${chat.contact.firstName || ""} ${chat.contact.lastName || ""}`.trim(),
            email: chat.contact.email || null,
          }
        : null,
      updatedAt: chat.lastMessageAt?.toISOString() || chat.updatedAt.toISOString(),
      createdAt: chat.createdAt.toISOString(),
    }));

    const threadItems: InboxItem[] = threads.map((thread) => ({
      id: thread.id,
      type: thread.channel,
      channel: thread.channel,
      subject: thread.subject,
      status: thread.status,
      priority: thread.priority,
      assignee: thread.assigneeId
        ? {
            id: thread.assigneeId,
            name: null,
          }
        : null,
      contact: buildThreadContact(thread),
      updatedAt: thread.lastMessageAt || thread.updatedAt,
      createdAt: thread.createdAt,
    }));

    return mergeAndPaginate(
      [...ticketItems, ...chatItems, ...threadItems],
      page,
      limit,
      ticketCount + chatCount + threadCount
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/service/inbox - Ingest omnichannel conversation thread
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const payload = createServiceInboxThreadSchema.parse(await request.json());
    const thread = await createServiceInboxThread(tenantId, payload);

    return NextResponse.json(
      {
        data: {
          id: thread.id,
          type: thread.channel,
          channel: thread.channel,
          subject: thread.subject,
          status: thread.status,
          priority: thread.priority,
          assignee: thread.assigneeId
            ? {
                id: thread.assigneeId,
                name: null,
              }
            : null,
          contact: buildThreadContact(thread),
          updatedAt: thread.lastMessageAt || thread.updatedAt,
          createdAt: thread.createdAt,
        } satisfies InboxItem,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
