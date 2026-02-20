"use client";

import { useEffect, useState } from "react";
import { LayoutTemplate } from "lucide-react";

type Template = {
  key: string;
  name: string;
  description: string;
  sections: Array<{
    type: string;
    label: string;
    required: boolean;
  }>;
};

type ReusableBlock = {
  id: string;
  name: string;
  sectionType: string;
  headline: string;
  body: string;
};

type LandingPage = {
  id: string;
  name: string;
};

export default function ContentPagesBuilderPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [blocks, setBlocks] = useState<ReusableBlock[]>([]);
  const [pages, setPages] = useState<LandingPage[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  const [newBlockName, setNewBlockName] = useState("Hero - Product Launch");
  const [newBlockType, setNewBlockType] = useState("hero");
  const [newBlockHeadline, setNewBlockHeadline] = useState("Launch faster with a unified CRM");
  const [newBlockBody, setNewBlockBody] = useState("Manage pipeline, automate outreach, and convert leads with one workflow.");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [templateResponse, blockResponse, pagesResponse] = await Promise.all([
        fetch("/api/content/pages/templates"),
        fetch("/api/content/pages/blocks"),
        fetch("/api/landing-pages?limit=100"),
      ]);

      const [templateBody, blockBody, pagesBody] = await Promise.all([
        templateResponse.json(),
        blockResponse.json(),
        pagesResponse.json(),
      ]);

      if (!templateResponse.ok) throw new Error(templateBody.error || "Unable to load templates");
      if (!blockResponse.ok) throw new Error(blockBody.error || "Unable to load blocks");
      if (!pagesResponse.ok) throw new Error(pagesBody.error || "Unable to load landing pages");

      setTemplates(templateBody.data || []);
      setBlocks(blockBody.data || []);
      setPages((pagesBody.data || []).map((item: any) => ({ id: item.id, name: item.name })));

      if (!selectedTemplate && templateBody.data?.length) {
        setSelectedTemplate(templateBody.data[0].key);
      }
      if (!selectedPage && pagesBody.data?.length) {
        setSelectedPage(pagesBody.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load page builder");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createBlock() {
    setSaving(true);
    setError(null);
    setResultMessage(null);
    try {
      const response = await fetch("/api/content/pages/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBlockName,
          sectionType: newBlockType,
          headline: newBlockHeadline,
          body: newBlockBody,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create block");

      setResultMessage("Reusable block created");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create block");
    } finally {
      setSaving(false);
    }
  }

  function toggleBlock(blockId: string) {
    setSelectedBlocks((current) =>
      current.includes(blockId) ? current.filter((id) => id !== blockId) : [...current, blockId]
    );
  }

  async function composePage() {
    if (!selectedTemplate || !selectedPage || selectedBlocks.length === 0) {
      setError("Choose template, page, and at least one block");
      return;
    }

    setSaving(true);
    setError(null);
    setResultMessage(null);
    try {
      const response = await fetch("/api/content/pages/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landingPageId: selectedPage,
          templateKey: selectedTemplate,
          blockIds: selectedBlocks,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to compose landing page");

      setResultMessage(`Applied template ${body.template.name} with ${body.sections.length} sections`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to compose landing page");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Page Builder Enhancements</h1>
        <p className="mt-1 text-gray-600">Compose landing pages using structured templates and reusable blocks.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {resultMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {resultMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading builder...
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Reusable Block Library</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={newBlockName}
                onChange={(event) => setNewBlockName(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="Block name"
              />
              <select
                value={newBlockType}
                onChange={(event) => setNewBlockType(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="hero">Hero</option>
                <option value="benefits">Benefits</option>
                <option value="social_proof">Social Proof</option>
                <option value="faq">FAQ</option>
                <option value="cta">CTA</option>
              </select>
              <input
                value={newBlockHeadline}
                onChange={(event) => setNewBlockHeadline(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="Headline"
              />
              <input
                value={newBlockBody}
                onChange={(event) => setNewBlockBody(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="Body"
              />
            </div>

            <button
              onClick={createBlock}
              disabled={saving}
              className="mt-3 rounded border border-gray-200 px-3 py-2 text-sm"
            >
              Create Block
            </button>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Apply Template To Landing Page</p>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={selectedTemplate}
                onChange={(event) => setSelectedTemplate(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedPage}
                onChange={(event) => setSelectedPage(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="">Select landing page</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {blocks.length === 0 ? (
                <p className="text-sm text-gray-500">No reusable blocks yet.</p>
              ) : (
                blocks.map((block) => (
                  <label key={block.id} className="flex items-start gap-2 rounded border border-gray-200 p-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedBlocks.includes(block.id)}
                      onChange={() => toggleBlock(block.id)}
                    />
                    <span>
                      <span className="font-medium text-gray-900">{block.name}</span>
                      <span className="block text-gray-500">
                        {block.sectionType} • {block.headline}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <button
              onClick={composePage}
              disabled={saving || !selectedTemplate || !selectedPage || selectedBlocks.length === 0}
              className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
            >
              Compose Structured Page
            </button>
          </div>
        </>
      )}
    </div>
  );
}
