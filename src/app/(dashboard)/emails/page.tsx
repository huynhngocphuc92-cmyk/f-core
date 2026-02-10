import { Mail, Plus, Send, Eye, MousePointerClick, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getEmails } from "@/app/actions/emails";
import SearchInput from "@/components/crm/SearchInput";

export const dynamic = "force-dynamic";

function getStatusBadge(status: string | null) {
  switch (status) {
    case "delivered":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
          <CheckCircle2 className="w-3 h-3" />
          Delivered
        </span>
      );
    case "opened":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
          <Eye className="w-3 h-3" />
          Opened
        </span>
      );
    case "clicked":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
          <MousePointerClick className="w-3 h-3" />
          Clicked
        </span>
      );
    case "bounced":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700">
          <AlertCircle className="w-3 h-3" />
          Bounced
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-50 text-gray-700">
          <Send className="w-3 h-3" />
          Sent
        </span>
      );
  }
}

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const emails = await getEmails(search);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
          <p className="text-gray-600 mt-1">{emails.length} tracked emails</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/emails/templates"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Templates
          </Link>
          <Link
            href="/emails/compose"
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Compose
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <SearchInput placeholder="Search emails..." />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sender
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/emails/${email.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-[#0891b2] transition-colors"
                  >
                    {email.subject || "(no subject)"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {email.emailTo || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {email.contact ? (
                    <Link
                      href={`/contacts/${email.contact.id}`}
                      className="text-[#0891b2] hover:underline"
                    >
                      {[email.contact.firstName, email.contact.lastName].filter(Boolean).join(" ")}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(email.emailStatus)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(email.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {email.owner?.name || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {emails.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search ? `No emails matching "${search}"` : "No emails sent yet"}
            </p>
            {!search && (
              <Link
                href="/emails/compose"
                className="inline-flex items-center gap-2 mt-4 text-[#0891b2] hover:text-[#0e7490]"
              >
                <Plus className="w-4 h-4" />
                Compose your first email
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
