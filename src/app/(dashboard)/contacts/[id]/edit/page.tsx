import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditContactForm from "./EditContactForm";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const contact = await prisma.contact.findFirst({
    where: { id: decodedId, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      jobTitle: true,
      lifecycleStage: true,
      leadStatus: true,
      city: true,
      state: true,
      country: true,
    },
  });

  if (!contact) {
    notFound();
  }

  return <EditContactForm contact={contact} />;
}
