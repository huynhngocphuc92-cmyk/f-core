import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  User,
  Building2,
  Handshake,
  Send,
  Eye,
  MousePointerClick,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getEmailDetail } from "@/app/actions/emails";
import EmailStatusActions from "./EmailStatusActions";

export const dynamic = "force-dynamic";

function getStatusInfo(status: string | null) {
  switch (status) {
    case "delivered":
      return { icon: CheckCircle2, label: "Delivered", color: "text-blue-600", bg: "bg-blue-50" };
    case "opened":
      return { icon: Eye, label: "Opened", color: "text-green-600", bg: "bg-green-50" };
    case "clicked":
      return { icon: MousePointerClick, label: "Clicked", color: "text-purple-600", bg: "bg-purple-50" };
    case "bounced":
      return { icon: Mail, label: "Bounced", color: "text-red-600", bg: "bg-red-50" };
    default:
      return { icon: Send, label: "Sent", color: "text-gray-600", bg: "bg-gray-50" };
  }
}

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = await getEmailDetail(decodeURIComponent(id));

  if (!email) notFound();

  const status = getStatusInfo(email.emailStatus);
  const StatusIcon = status.icon;
  const metadata = email.metadata as Record<string, unknown> | null;

  return (
    <div className="p-6 pt-8">
      <Link
        href="/emails"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Emails
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {email.subject || "(no subject)"}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(email.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Email metadata */}
            <div className="mt-4 space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-12">From:</span>
                <span className="text-gray-900">{email.owner?.email || "system@f-core.com"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-12">To:</span>
                <span className="text-gray-900">{email.emailTo}</span>
              </div>
              {email.emailCc && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-12">CC:</span>
                  <span className="text-gray-900">{email.emailCc}</span>
                </div>
              )}
              {email.emailBcc && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-12">BCC:</span>
                  <span className="text-gray-900">{email.emailBcc}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Body */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {email.body || "(no content)"}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Tracking Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Tracking
            </h3>
            <EmailStatusActions emailId={email.id} currentStatus={email.emailStatus || "sent"} />
            {typeof metadata?.trackingId === "string" && (
              <p className="text-xs text-gray-400 mt-3">
                Tracking ID: {metadata.trackingId.slice(0, 12)}...
              </p>
            )}
          </div>

          {/* Associations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Associations
            </h3>
            <div className="space-y-3">
              {email.contact ? (
                <Link
                  href={`/contacts/${email.contact.id}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0891b2] transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  {[email.contact.firstName, email.contact.lastName].filter(Boolean).join(" ")}
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  No contact linked
                </p>
              )}
              {email.company ? (
                <Link
                  href={`/companies/${email.company.id}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0891b2] transition-colors"
                >
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {email.company.name}
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 className="w-4 h-4" />
                  No company linked
                </p>
              )}
              {email.deal ? (
                <Link
                  href={`/deals/${email.deal.id}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0891b2] transition-colors"
                >
                  <Handshake className="w-4 h-4 text-gray-400" />
                  {email.deal.name}
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Handshake className="w-4 h-4" />
                  No deal linked
                </p>
              )}
            </div>
          </div>

          {/* Sent by */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              About
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Sent by</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {email.owner?.name || "System"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sent at</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(email.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
