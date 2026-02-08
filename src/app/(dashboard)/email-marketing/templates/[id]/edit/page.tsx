"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye } from "lucide-react";

interface TemplateData {
  id?: string;
  name: string;
  subject: string;
  previewText: string;
  category: string;
  htmlContent: string;
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [template, setTemplate] = useState<TemplateData>({
    name: "",
    subject: "",
    previewText: "",
    category: "newsletter",
    htmlContent: "",
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/email-marketing/templates/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) {
            setTemplate({
              id: data.id,
              name: data.name || "",
              subject: data.subject || "",
              previewText: data.previewText || "",
              category: data.category || "newsletter",
              htmlContent: data.htmlContent || "",
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id, isNew]);

  const handleSave = async () => {
    if (!template.name.trim()) return;
    setSaving(true);

    try {
      const url = isNew
        ? "/api/email-marketing/templates"
        : `/api/email-marketing/templates/${params.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          subject: template.subject || undefined,
          previewText: template.previewText || undefined,
          category: template.category || undefined,
          htmlContent: template.htmlContent || undefined,
        }),
      });

      const data = await res.json();
      if (isNew && data.id) {
        router.push(`/email-marketing/templates/${data.id}/edit`);
      }
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof TemplateData, value: string) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/email-marketing/templates")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? "Create Template" : "Edit Template"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !template.name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors font-medium text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Template Settings</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject Line</label>
              <input
                type="text"
                value={template.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="e.g., Welcome to {{company_name}}!"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preview Text</label>
              <input
                type="text"
                value={template.previewText}
                onChange={(e) => update("previewText", e.target.value)}
                placeholder="Text shown in inbox preview"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={template.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              >
                <option value="newsletter">Newsletter</option>
                <option value="promotional">Promotional</option>
                <option value="transactional">Transactional</option>
                <option value="welcome">Welcome</option>
              </select>
            </div>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="lg:col-span-2">
          {showPreview ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Preview</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="text-xs text-gray-500">Subject: {template.subject || "(no subject)"}</div>
                  <div className="text-xs text-gray-400">Preview: {template.previewText || "(no preview text)"}</div>
                </div>
                <div
                  className="p-4 min-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: template.htmlContent || "<p style='color:#999;'>No content yet.</p>" }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">HTML Content</h3>
              <textarea
                value={template.htmlContent}
                onChange={(e) => update("htmlContent", e.target.value)}
                rows={20}
                placeholder="Paste your HTML email content here..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#0891b2] resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                Supports merge tags: {"{{first_name}}"}, {"{{last_name}}"}, {"{{company_name}}"}, {"{{email}}"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
