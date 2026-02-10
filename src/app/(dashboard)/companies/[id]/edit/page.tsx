import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditCompanyForm from "./EditCompanyForm";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const company = await prisma.company.findFirst({
    where: { id: decodedId, deletedAt: null },
    select: {
      id: true,
      name: true,
      domain: true,
      industry: true,
      type: true,
      size: true,
      phone: true,
      website: true,
      city: true,
      state: true,
      country: true,
      description: true,
    },
  });

  if (!company) {
    notFound();
  }

  return <EditCompanyForm company={company} />;
}
