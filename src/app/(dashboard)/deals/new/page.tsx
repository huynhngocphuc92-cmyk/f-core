import prisma from "@/lib/prisma";
import NewDealForm from "./NewDealForm";

export const dynamic = "force-dynamic";

export default async function NewDealPage() {
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: {
        orderBy: { probability: "asc" },
      },
    },
  });

  const serialized = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    stages: p.stages.map((s) => ({
      id: s.id,
      name: s.name,
      probability: s.probability ?? 0,
    })),
  }));

  return <NewDealForm pipelines={serialized} />;
}
