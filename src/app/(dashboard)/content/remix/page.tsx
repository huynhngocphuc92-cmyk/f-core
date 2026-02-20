"use client";

import { useEffect, useMemo, useState } from "react";
import { WandSparkles } from "lucide-react";

type SourceType = "blog_post" | "landing_page";
type TargetFormat =
  | "email_newsletter"
  | "social_post"
  | "linkedin_post"
  | "sales_snippet"
  | "ad_copy";
type Tone = "professional" | "friendly" | "concise" | "bold";

type SourceItem = {
  id: string;
  title: string;
  updatedAt?: string;
};

type RemixVariant = {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  sourceTitle: string;
  targetFormat: TargetFormat;
  tone: Tone;
  content: string;
  createdAt: string;
};

const formatLabels: Record<TargetFormat, string> = {
  email_newsletter: "Email Newsletter",
  social_post: "Social Post",
  linkedin_post: "LinkedIn Post",
  sales_snippet: "Sales Snippet",
  ad_copy: "Ad Copy",
};

export default function ContentRemixPage() {
  const [sourceType, setSourceType] = useState<SourceType>("blog_post");
  const [sourceId, setSourceId] = useState("");
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("social_post");
  const [tone, setTone] = useState<Tone>("professional");
  const [maxLength, setMaxLength] = useState("500");

  const [blogSources, setBlogSources] = useState<SourceItem[]>([]);
  const [landingSources, setLandingSources] = useState<SourceItem[]>([]);
  const [variants, setVariants] = useState<RemixVariant[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceOptions = useMemo(
    () => (sourceType === "blog_post" ? blogSources : landingSources),
    [sourceType, blogSources, landingSources]
  );

  async function loadSources() {
    const [blogResponse, landingResponse] = await Promise.all([
      fetch("/api/content/blog/posts"),
      fetch("/api/landing-pages?limit=50"),
    ]);

    const [blogBody, landingBody] = await Promise.all([blogResponse.json(), landingResponse.json()]);

    if (!blogResponse.ok) throw new Error(blogBody.error || "Unable to load blog posts");
    if (!landingResponse.ok) throw new Error(landingBody.error || "Unable to load landing pages");

    setBlogSources(
      (blogBody.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        updatedAt: item.updatedAt,
      }))
    );

    setLandingSources(
      (landingBody.data || []).map((item: any) => ({
        id: item.id,
        title: item.name,
        updatedAt: item.updatedAt,
      }))
    );
  }

  async function loadVariants(nextSourceType = sourceType, nextSourceId = sourceId) {
    const query = new URLSearchParams();
    query.set("sourceType", nextSourceType);
    if (nextSourceId) {
      query.set("sourceId", nextSourceId);
    }

    const response = await fetch(`/api/content/remix?${query.toString()}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load remix variants");
    setVariants(body.data || []);
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await loadSources();
      await loadVariants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load remix assistant");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const firstId = sourceOptions[0]?.id || "";
    setSourceId((current) => {
      if (current && sourceOptions.some((item) => item.id === current)) {
        return current;
      }
      return firstId;
    });
  }, [sourceOptions]);

  async function generateVariant() {
    if (!sourceId) {
      setError("Please choose a source content item");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/content/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId,
          targetFormat,
          tone,
          maxLength: Number(maxLength) || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to generate remix variant");
      await loadVariants(sourceType, sourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate remix variant");
    } finally {
      setSaving(false);
    }
  }

  async function changeSourceType(next: SourceType) {
    setSourceType(next);
    const nextSourceId = (next === "blog_post" ? blogSources : landingSources)[0]?.id || "";
    setSourceId(nextSourceId);
    await loadVariants(next, nextSourceId);
  }

  async function changeSource(nextId: string) {
    setSourceId(nextId);
    await loadVariants(sourceType, nextId);
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Remix Assistant</h1>
        <p className="mt-1 text-gray-600">
          Generate reusable content variants from approved source assets.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading remix assistant...
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <WandSparkles className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Generate Variant</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={sourceType}
                onChange={(event) => changeSourceType(event.target.value as SourceType)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="blog_post">Blog Post</option>
                <option value="landing_page">Landing Page</option>
              </select>

              <select
                value={sourceId}
                onChange={(event) => changeSource(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="">Select source</option>
                {sourceOptions.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </select>

              <select
                value={targetFormat}
                onChange={(event) => setTargetFormat(event.target.value as TargetFormat)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                {Object.entries(formatLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={tone}
                onChange={(event) => setTone(event.target.value as Tone)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                value={maxLength}
                onChange={(event) => setMaxLength(event.target.value)}
                className="h-10 w-44 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="Max length"
              />
              <button
                onClick={generateVariant}
                disabled={saving || !sourceId}
                className="rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
              >
                Generate Remix
              </button>
              <p className="text-xs text-gray-500">Source content must be approved in `/content/approvals`.</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Generated Variants</p>
            {variants.length === 0 ? (
              <p className="text-sm text-gray-500">No variants generated for this source yet.</p>
            ) : (
              <div className="space-y-3">
                {variants.map((variant) => (
                  <div key={variant.id} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {formatLabels[variant.targetFormat]} • {variant.tone}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{variant.content}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Source: {variant.sourceTitle} • {new Date(variant.createdAt).toLocaleString("en-US")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
