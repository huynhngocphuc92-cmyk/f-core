import { tool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit-helpers";

export function activityTools(tenantId: string, userId: string) {
  return {
    get_activities: tool({
      description:
        "Get recent activities for a contact or deal. Returns notes, calls, emails, tasks, and meetings.",
      inputSchema: z.object({
        contactId: z
          .string()
          .optional()
          .describe("Filter by contact ID"),
        dealId: z.string().optional().describe("Filter by deal ID"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe("Max results to return"),
      }),
      execute: async ({ contactId, dealId, limit }) => {
        const activities = await prisma.activity.findMany({
          where: {
            tenantId,
            ...(contactId && { contactId }),
            ...(dealId && { dealId }),
          },
          select: {
            id: true,
            type: true,
            subject: true,
            body: true,
            status: true,
            dueDate: true,
            createdAt: true,
            owner: { select: { name: true } },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        });
        return { activities, count: activities.length };
      },
    }),

    create_note: tool({
      description:
        "Create a note on a contact. Use this when the user wants to add a note or observation about a contact.",
      inputSchema: z.object({
        contactId: z.string().describe("The contact ID to add the note to"),
        content: z.string().describe("The note content"),
      }),
      execute: async ({ contactId, content }) => {
        const contact = await prisma.contact.findFirst({
          where: { id: contactId, tenantId, deletedAt: null },
          select: { id: true, firstName: true, lastName: true },
        });
        if (!contact) return { error: "Contact not found" };

        const activity = await prisma.activity.create({
          data: {
            tenantId,
            type: "note",
            subject: content.slice(0, 100),
            body: content,
            contactId,
            ownerId: userId,
          },
          select: {
            id: true,
            type: true,
            subject: true,
            createdAt: true,
          },
        });

        await logAuditEvent({
          tenantId,
          userId,
          action: "created",
          entity: "activity_note",
          entityId: activity.id,
          entityName: activity.subject ?? undefined,
          metadata: {
            source: "ai_tool",
            tool: "create_note",
            contactId,
          },
        });

        return {
          success: true,
          activity,
          message: `Note added to ${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
        };
      },
    }),

    create_task: tool({
      description:
        "Create a task with a title, due date, and optional contact association.",
      inputSchema: z.object({
        title: z.string().describe("Task title"),
        dueDate: z.string().describe("Due date in ISO format (YYYY-MM-DD)"),
        contactId: z
          .string()
          .optional()
          .describe("Optional contact ID to associate"),
        priority: z
          .enum(["low", "medium", "high"])
          .default("medium")
          .describe("Task priority"),
      }),
      execute: async ({ title, dueDate, contactId, priority }) => {
        if (contactId) {
          const contact = await prisma.contact.findFirst({
            where: { id: contactId, tenantId, deletedAt: null },
            select: { id: true },
          });
          if (!contact) {
            return { error: "Contact not found" };
          }
        }

        const activity = await prisma.activity.create({
          data: {
            tenantId,
            type: "task",
            subject: title,
            dueDate: new Date(dueDate),
            priority,
            status: "pending",
            contactId,
            ownerId: userId,
          },
          select: {
            id: true,
            type: true,
            subject: true,
            dueDate: true,
            priority: true,
            createdAt: true,
          },
        });

        await logAuditEvent({
          tenantId,
          userId,
          action: "created",
          entity: "activity_task",
          entityId: activity.id,
          entityName: activity.subject ?? undefined,
          metadata: {
            source: "ai_tool",
            tool: "create_task",
            contactId: contactId || null,
            priority,
          },
        });

        return { success: true, task: activity };
      },
    }),
  };
}
