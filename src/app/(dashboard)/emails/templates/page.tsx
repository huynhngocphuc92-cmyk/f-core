import Link from "next/link";
import { ArrowLeft, Plus, FileText, Clock, BarChart2 } from "lucide-react";
import { getEmailTemplates } from "@/app/actions/emails";
import TemplateActions from "./TemplateActions";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const templates = await getEmailTemplates();

  return (
    <div className="p-6 pt-8">
      <Link
        href="/emails"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Emails
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">{templates.length} templates</p>
        </div>
        <TemplateActions mode="create" />
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No email templates yet</p>
          <TemplateActions mode="create" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-[#0891b2]/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  {template.category && (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 mt-1">
                      {template.category}
                    </span>
                  )}
                </div>
                <TemplateActions mode="row" templateId={template.id} templateName={template.name} />
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                <span className="font-medium">Subject:</span> {template.subject}
              </p>
              <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                {template.body}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" />
                  {template.usageCount} uses
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(template.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
