"use client";

import Link from "next/link";
import { Plus, MoreHorizontal } from "lucide-react";
import SelectableTable from "@/components/crm/SelectableTable";

// ============================================
// TYPES
// ============================================

interface SerializedContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  lifecycleStage: string | null;
  ownerName: string | null;
}

interface ContactsTableProps {
  contacts: SerializedContact[];
  search?: string;
}

// ============================================
// LIFECYCLE STAGE BADGE
// ============================================

function StageBadge({ stage }: { stage: string | null }) {
  const display = stage || "subscriber";
  const colorClass =
    display === "customer"
      ? "bg-green-50 text-green-700"
      : display === "lead"
      ? "bg-blue-50 text-blue-700"
      : display === "mql"
      ? "bg-purple-50 text-purple-700"
      : display === "sql"
      ? "bg-orange-50 text-orange-700"
      : "bg-gray-50 text-gray-700";

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
    >
      {display}
    </span>
  );
}

// ============================================
// COMPONENT
// ============================================

export default function ContactsTable({
  contacts,
  search,
}: ContactsTableProps) {
  return (
    <SelectableTable items={contacts} module="contacts">
      {({ selectedIds, toggleItem, toggleAll, allSelected, someSelected }) => (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2] cursor-pointer"
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
              {contacts.map((contact) => {
                const isSelected = selectedIds.has(contact.id);
                return (
                  <tr
                    key={contact.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-cyan-50/60"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(contact.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2] cursor-pointer"
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
                      <StageBadge stage={contact.lifecycleStage} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.ownerName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {contacts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {search
                  ? `No contacts matching "${search}"`
                  : "No contacts found"}
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
      )}
    </SelectableTable>
  );
}
