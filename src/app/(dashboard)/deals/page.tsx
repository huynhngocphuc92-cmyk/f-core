import prisma from "@/lib/prisma";
import DealsBoard from "./DealsBoard";
import { getServerI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const { t } = await getServerI18n();
  const deals = await prisma.deal.findMany({
    where: { deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      stage: { select: { id: true, name: true, color: true, probability: true } },
      pipeline: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = deals.map((d) => ({
    id: d.id,
    name: d.name,
    amount: d.amount ? Number(d.amount) : null,
    currency: d.currency,
    closeDate: d.closeDate ? d.closeDate.toISOString() : null,
    priority: d.priority,
    stage: { ...d.stage, color: d.stage.color || "#6b7280" },
    pipeline: d.pipeline,
    owner: d.owner
      ? {
          ...d.owner,
          name: d.owner.name || t("dashboard.deals.unknownOwner", "Unknown"),
        }
      : null,
  }));

  return <DealsBoard deals={serialized} />;
}
