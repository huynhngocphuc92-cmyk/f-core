import { tool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";

export function dealTools(tenantId: string) {
  return {
    list_deals: tool({
      description:
        "List deals with optional filters by stage, owner, or pipeline. Returns deal summary.",
      inputSchema: z.object({
        stageId: z
          .string()
          .optional()
          .describe("Filter by pipeline stage ID"),
        ownerId: z.string().optional().describe("Filter by owner user ID"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe("Max results to return"),
      }),
      execute: async ({ stageId, ownerId, limit }) => {
        const deals = await prisma.deal.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(stageId && { stageId }),
            ...(ownerId && { ownerId }),
          },
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            closeDate: true,
            probability: true,
            priority: true,
            stage: { select: { name: true } },
            owner: { select: { name: true } },
          },
          take: limit,
          orderBy: { updatedAt: "desc" },
        });
        return { deals, count: deals.length };
      },
    }),

    get_deal: tool({
      description:
        "Get detailed information about a specific deal, including its contacts and activities.",
      inputSchema: z.object({
        id: z.string().describe("The deal ID"),
      }),
      execute: async ({ id }) => {
        const deal = await prisma.deal.findFirst({
          where: { id, tenantId, deletedAt: null },
          include: {
            stage: { select: { name: true, probability: true } },
            pipeline: { select: { name: true } },
            owner: { select: { name: true, email: true } },
            contacts: {
              include: {
                contact: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
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
          },
        });
        if (!deal) return { error: "Deal not found" };
        return deal;
      },
    }),

    pipeline_summary: tool({
      description:
        "Get pipeline summary with deal count and total value per stage. Useful for pipeline analysis.",
      inputSchema: z.object({
        pipelineId: z
          .string()
          .optional()
          .describe("Pipeline ID. If omitted, uses the first pipeline."),
      }),
      execute: async ({ pipelineId }) => {
        let targetPipelineId = pipelineId;

        if (!targetPipelineId) {
          const defaultPipeline = await prisma.pipeline.findFirst({
            where: { tenantId },
            select: { id: true, name: true },
          });
          if (!defaultPipeline)
            return { error: "No pipelines found for this tenant" };
          targetPipelineId = defaultPipeline.id;
        }

        const pipeline = await prisma.pipeline.findFirst({
          where: { id: targetPipelineId, tenantId },
          include: {
            stages: {
              orderBy: { orderIndex: "asc" },
              include: {
                deals: {
                  where: { deletedAt: null },
                  select: { amount: true },
                },
              },
            },
          },
        });

        if (!pipeline) return { error: "Pipeline not found" };

        const stages = pipeline.stages.map((stage) => ({
          name: stage.name,
          dealCount: stage.deals.length,
          totalValue: stage.deals.reduce(
            (sum, d) => sum + Number(d.amount || 0),
            0,
          ),
          probability: stage.probability,
        }));

        const totalDeals = stages.reduce((s, st) => s + st.dealCount, 0);
        const totalValue = stages.reduce((s, st) => s + st.totalValue, 0);
        const weightedValue = stages.reduce(
          (s, st) => s + st.totalValue * (st.probability / 100),
          0,
        );

        return {
          pipeline: pipeline.name,
          stages,
          summary: {
            totalDeals,
            totalValue,
            weightedValue: Math.round(weightedValue),
          },
        };
      },
    }),
  };
}
