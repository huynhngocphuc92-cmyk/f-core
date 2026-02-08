"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  Mail,
  Newspaper,
  Megaphone,
  HandMetal,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string | null;
  previewText: string | null;
  category: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  newsletter: { label: "Newsletter", color: "bg-blue-100 text-blue-700", icon: Newspaper },
  promotional: { label: "Promotional", color: "bg-purple-100 text-purple-700", icon: Megaphone },
  transactional: { label: "Transactional", color: "bg-green-100 text-green-700", icon: Mail },
  welcome: { label: "Welcome", color: "bg-amber-100 text-amber-700", icon: HandMetal },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTemplates = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);

    fetch(`/api/email-marketing/templates?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, [debouncedSearch, category]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/email-marketing/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage reusable email templates</p>
        </div>
        <Link
          href="/email-marketing/templates/new/edit"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {["", "welcome", "newsletter", "promotional", "transactional"].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                category === c
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {c === "" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No templates found</p>
          <Link
            href="/email-marketing/templates/new/edit"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#0891b2] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Create your first template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const cat = categoryConfig[tpl.category || ""] || null;
            return (
              <div
                key={tpl.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Preview area */}
                <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b border-gray-100">
                  <FileText className="w-10 h-10 text-gray-300" />
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{tpl.name}</h3>
                      {tpl.subject && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{tpl.subject}</p>
                      )}
                    </div>
                    {cat && (
                      <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded ${cat.color}`}>
                        {cat.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      {new Date(tpl.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Link
                        href={`/email-marketing/templates/${tpl.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-[#0891b2] rounded hover:bg-gray-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      {!tpl.isSystem && (
                        <button
                          onClick={() => handleDelete(tpl.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back link */}
      <div className="mt-6">
        <Link href="/email-marketing" className="text-sm text-gray-500 hover:text-[#0891b2]">
          &larr; Back to Email Marketing
        </Link>
      </div>
    </div>
  );
}
