import { Plus, Filter, Download, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import SearchInput from "@/components/crm/SearchInput";
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

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">{contacts.length} contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lifecycle Stage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0891b2] flex items-center justify-center text-white font-medium text-sm">
                      {contact.firstName?.charAt(0) || "?"}
                      {contact.lastName?.charAt(0) || ""}
                    </div>
                    <span className="font-medium text-gray-900 hover:text-[#0891b2]">
                      {contact.firstName} {contact.lastName}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {contact.email || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {contact.phone || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      contact.lifecycleStage === "customer"
                        ? "bg-green-50 text-green-700"
                        : contact.lifecycleStage === "lead"
                        ? "bg-blue-50 text-blue-700"
                        : contact.lifecycleStage === "mql"
                        ? "bg-purple-50 text-purple-700"
                        : contact.lifecycleStage === "sql"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {contact.lifecycleStage || "subscriber"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {contact.owner?.name || "-"}
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search ? `No contacts matching "${search}"` : "No contacts found"}
            </p>
            {!search && (
              <Link
                href="/contacts/new"
                className="inline-flex items-center gap-2 mt-4 text-[#0891b2] hover:text-[#0ea5e9]"
              >
                <Plus className="w-4 h-4" />
                Create your first contact
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
