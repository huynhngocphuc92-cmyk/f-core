import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuoteCreateForm } from "./QuoteCreateForm";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getFormData() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return { deals: [], contacts: [], companies: [] };

  const [deals, contacts, companies] = await Promise.all([
    prisma.deal.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.contact.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.company.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    deals: deals.map((d) => ({ id: d.id, name: d.name })),
    contacts: contacts.map((c) => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Unnamed",
    })),
    companies: companies.map((c) => ({ id: c.id, name: c.name })),
  };
}

export default async function NewQuotePage() {
  const { deals, contacts, companies } = await getFormData();

  return (
    <div className="p-6 pt-8">
      <Link
        href="/quotes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quotes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Quote</h1>
        <p className="text-gray-600 mt-1">
          Configure pricing, line items, and terms for your quote
        </p>
      </div>

      <QuoteCreateForm deals={deals} contacts={contacts} companies={companies} />
    </div>
  );
}
