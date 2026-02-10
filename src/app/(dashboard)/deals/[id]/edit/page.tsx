import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditDealForm from "./EditDealForm";

export const dynamic = "force-dynamic";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const deal = await prisma.deal.findFirst({
    where: { id: decodedId, deletedAt: null },
    select: {
      id: true,
      name: true,
      amount: true,
      currency: true,
      closeDate: true,
      priority: true,
      dealType: true,
      description: true,
      pipelineId: true,
      stageId: true,
    },
  });

  if (!deal) {
    notFound();
  }

  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: {
        orderBy: { probability: "asc" },
      },
    },
  });

  const serializedPipelines = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    stages: p.stages.map((s) => ({
      id: s.id,
      name: s.name,
      probability: s.probability ?? 0,
    })),
  }));

  const serializedDeal = {
    ...deal,
    amount: deal.amount ? Number(deal.amount) : null,
    closeDate: deal.closeDate ? deal.closeDate.toISOString().split("T")[0] : null,
  };

  return <EditDealForm deal={serializedDeal} pipelines={serializedPipelines} />;
}
