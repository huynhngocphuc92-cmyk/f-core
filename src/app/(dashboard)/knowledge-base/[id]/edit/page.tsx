"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Globe,
  Loader2,
  X,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  contentHtml: string | null;
  excerpt: string | null;
  status: "draft" | "published" | "archived";
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  category?: Category | null;
}

// =============================================================================
// ARTICLE EDITOR PAGE
// =============================================================================

export default function ArticleEditorPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Load article and categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [articleRes, categoriesRes] = await Promise.all([
          fetch(`/api/kb/articles/${articleId}`),
          fetch("/api/kb/categories"),
        ]);

        if (!articleRes.ok) throw new Error("Failed to load article");
        const articleData = await articleRes.json();
        const art = articleData.data || articleData;
        setArticle(art);
        setTitle(art.title || "");
        setSubtitle(art.subtitle || "");
        setContent(art.contentHtml || "");
        setExcerpt(art.excerpt || "");
        setCategoryId(art.categoryId || "");
        setTagsInput(
          Array.isArray(art.tags) ? art.tags.join(", ") : ""
        );
        setMetaTitle(art.metaTitle || "");
        setMetaDescription(art.metaDescription || "");

        if (categoriesRes.ok) {
          const catData = await categoriesRes.json();
          setCategories(catData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [articleId]);

  // Parse tags
  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const newTags = parsedTags.filter((t) => t !== tagToRemove);
    setTagsInput(newTags.join(", "));
  };

  // Save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const res = await fetch(`/api/kb/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          contentHtml: content,
          excerpt: excerpt || null,
          categoryId: categoryId || null,
          tags: parsedTags,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save article");
      }

      const updated = await res.json();
      setArticle(updated.data || updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);

      // Save first
      await handleSave();

      const res = await fetch(`/api/kb/articles/${articleId}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to publish article");
      }

      setArticle((prev) =>
        prev
          ? { ...prev, status: "published", publishedAt: new Date().toISOString() }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  // Error state (no article)
  if (error && !article) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <Link
          href="/knowledge-base"
          className="text-[#0891b2] hover:text-[#0ea5e9] text-sm font-medium"
        >
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  const statusColor =
    article?.status === "published"
      ? "bg-green-50 text-green-700"
      : article?.status === "draft"
        ? "bg-yellow-50 text-yellow-700"
        : "bg-gray-100 text-gray-600";

  return (
    <div className="flex flex-col h-screen">
      {/* Top Toolbar */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/knowledge-base/${articleId}`}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold text-gray-900 border-none outline-none bg-transparent focus:ring-0 w-64"
            placeholder="Article title..."
          />
          {article?.status && (
            <span
              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusColor}`}
            >
              {article.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-500 mr-2">{error}</span>
          )}
          {saveSuccess && (
            <span className="text-sm text-green-600 mr-2">Saved!</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 rounded-md bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0ea5e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left - Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article Title"
                className="w-full text-3xl font-bold text-gray-900 border-none outline-none bg-transparent placeholder-gray-300"
              />
            </div>

            {/* Subtitle */}
            <div>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Add a subtitle (optional)"
                className="w-full text-lg text-gray-600 border-none outline-none bg-transparent placeholder-gray-300"
              />
            </div>

            {/* Content Editor */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="px-6 py-3 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content (HTML)
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here... HTML is supported."
                rows={24}
                className="w-full px-6 py-4 font-mono text-sm text-gray-800 border-none outline-none resize-none bg-transparent leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-6">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm bg-white"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? `  -- ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tags
              </label>
              {parsedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {parsedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-cyan-400 hover:text-cyan-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tag1, tag2, tag3..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">
                Separate tags with commas
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the article..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm resize-none"
              />
            </div>

            {/* SEO Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                SEO
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO title..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {metaTitle.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO description..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {metaDescription.length}/160 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-700 font-medium">
                    {formatDate(article?.createdAt || null)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Updated:</span>
                  <span className="text-gray-700 font-medium">
                    {formatDate(article?.updatedAt || null)}
                  </span>
                </div>
                {article?.publishedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Published:</span>
                    <span className="text-gray-700 font-medium">
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
