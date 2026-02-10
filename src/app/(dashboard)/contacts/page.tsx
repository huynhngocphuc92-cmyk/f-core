import { Plus, Filter } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import SearchInput from "@/components/crm/SearchInput";
import ContactsTable from "@/components/crm/ContactsTable";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getContacts(search?: string) {
  const where: Prisma.ContactWhereInput = { deletedAt: null };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.contact.findMany({
    where,
    include: {
      owner: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const contacts = await getContacts(search);

  // Serialize contacts for the client component
  const serializedContacts = contacts.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    lifecycleStage: c.lifecycleStage,
    ownerName: c.owner?.name || null,
  }));

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">{contacts.length} contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create contact
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-6">
        <SearchInput placeholder="Search contacts..." />
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Table with bulk selection */}
      <ContactsTable contacts={serializedContacts} search={search} />
    </div>
  );
}
