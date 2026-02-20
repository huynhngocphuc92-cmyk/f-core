"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type SourceType = "landing_page" | "blog_post";

type SourceOption = {
  id: string;
  title: string;
  slug: string;
};

type SeoResponse = {
  source: {
    type: SourceType;
    id: string;
    title: string;
    slug: string;
  };
  keyword: string | null;
  score: number;
  grade: string;
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
  suggestions: string[];
  metrics: {
    wordCount: number;
    keywordDensityPct: number;
    titleLength: number;
    metaDescriptionLength: number;
  };
};

export default function ContentSeoPage() {
  const [sourceType, setSourceType] = useState<SourceType>("blog_post");
  const [blogSources, setBlogSources] = useState<SourceOption[]>([]);
  const [landingSources, setLandingSources] = useState<SourceOption[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [report, setReport] = useState<SeoResponse | null>(null);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSources = useMemo(
    () => (sourceType === "blog_post" ? blogSources : landingSources),
    [sourceType, blogSources, landingSources]
  );

  useEffect(() => {
    async function loadSources() {
      setLoadingSources(true);
      setError(null);
      try {
        const [blogRes, landingRes] = await Promise.all([
          fetch("/api/content/blog/posts"),
          fetch("/api/landing-pages?limit=50"),
        ]);
        const blogBody = await blogRes.json();
        const landingBody = await landingRes.json();

        if (!blogRes.ok) throw new Error(blogBody.error || "Unable to load blog posts");
        if (!landingRes.ok) throw new Error(landingBody.error || "Unable to load landing pages");

        const blogs = (blogBody.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
        }));
        const landings = (landingBody.data || []).map((item: any) => ({
          id: item.id,
          title: item.name,
          slug: item.slug,
        }));

        setBlogSources(blogs);
        setLandingSources(landings);
        setSourceId((blogs[0]?.id || landings[0]?.id || "") as string);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load sources");
      } finally {
        setLoadingSources(false);
      }
    }

    loadSources();
  }, []);

  useEffect(() => {
    const next = currentSources[0]?.id || "";
    setSourceId(next);
  }, [sourceType, currentSources]);

  async function runAnalysis() {
    if (!sourceId) return;
    setLoadingReport(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        sourceType,
        sourceId,
      });
      if (keyword.trim()) query.set("keyword", keyword.trim());

      const response = await fetch(`/api/content/seo/recommendations?${query.toString()}`);
      const body = (await response.json()) as SeoResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to run SEO analysis");
      setReport(body);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Unable to run SEO analysis");
    } finally {
      setLoadingReport(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Recommendations</h1>
        <p className="mt-1 text-gray-600">Analyze pages/posts and get on-page SEO improvement suggestions.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Analyzer</p>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as SourceType)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="blog_post">Blog Post</option>
            <option value="landing_page">Landing Page</option>
          </select>

          <select
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            disabled={loadingSources || currentSources.length === 0}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm disabled:opacity-50"
          >
            {currentSources.length === 0 ? (
              <option value="">No source</option>
            ) : (
              currentSources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))
            )}
          </select>

          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Focus keyword (optional)"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          />
        </div>

        <button
          onClick={runAnalysis}
          disabled={loadingReport || !sourceId}
          className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          {loadingReport ? "Analyzing..." : "Run SEO Analysis"}
        </button>
      </div>

      {report && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="SEO Score" value={String(report.score)} />
            <Metric label="Grade" value={report.grade} />
            <Metric label="Word Count" value={String(report.metrics.wordCount)} />
            <Metric label="Keyword Density" value={`${report.metrics.keywordDensityPct}%`} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <Search className="h-4 w-4 text-[#0891b2]" />
                <p className="text-sm font-medium text-gray-900">Checks</p>
              </div>
              <div className="space-y-2 p-4">
                {report.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      check.passed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <p className="font-medium">{check.label}</p>
                    <p className="text-xs">{check.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">Suggestions</p>
              </div>
              <div className="space-y-2 p-4">
                {report.suggestions.length === 0 ? (
                  <p className="text-sm text-gray-500">No immediate SEO improvements needed.</p>
                ) : (
                  report.suggestions.map((suggestion) => (
                    <div
                      key={suggestion}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    >
                      {suggestion}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
