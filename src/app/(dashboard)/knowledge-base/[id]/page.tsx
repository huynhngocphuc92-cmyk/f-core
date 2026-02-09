"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Eye,
  Globe,
  GlobeLock,
  Trash2,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  X,
  BookOpen,
  Calendar,
  Tag,
  ExternalLink,
  Clock,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  contentHtml: string | null;
  excerpt: string | null;
  status: "draft" | "published" | "archived";
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  category?: Category | null;
  feedbackSummary?: { helpful: number; notHelpful: number; total: number };
}

// =============================================================================
// ARTICLE DETAIL PAGE
// =============================================================================

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Load article
  useEffect(() => {
    async function loadArticle() {
      try {
        setLoading(true);
        const res = await fetch(`/api/kb/articles/${articleId}`);
        if (!res.ok) throw new Error("Failed to load article");
        const data = await res.json();
        setArticle(data.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [articleId]);

  // Toggle publish/unpublish
  const handleTogglePublish = async () => {
    if (!article) return;
    try {
      setToggling(true);
      if (article.status === "published") {
        const res = await fetch(`/api/kb/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "draft" }),
        });
        if (!res.ok) throw new Error("Failed to update status");
        setArticle({ ...article, status: "draft" });
      } else {
        const res = await fetch(`/api/kb/articles/${articleId}/publish`, {
          method: "POST",
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to publish article");
        }
        setArticle({ ...article, status: "published", publishedAt: new Date().toISOString() });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setToggling(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/kb/articles/${articleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete article");
      router.push("/knowledge-base");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">Article not found</p>
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
    article.status === "published"
      ? "bg-green-50 text-green-700"
      : article.status === "draft"
        ? "bg-yellow-50 text-yellow-700"
        : "bg-gray-100 text-gray-600";

  return (
    <div className="p-6 pt-8 max-w-5xl">
      {/* Back link */}
      <Link
        href="/knowledge-base"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Knowledge Base
      </Link>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#0891b2]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {article.title}
              </h1>
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusColor}`}
              >
                {article.status}
              </span>
            </div>
            {article.subtitle && (
              <p className="text-gray-500 mt-1 text-sm">{article.subtitle}</p>
            )}
            {article.category && (
              <div className="flex items-center gap-1.5 mt-1">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {article.category.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Views
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {article.viewCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Helpful Votes
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {article.helpfulCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <ThumbsDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Not Helpful
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {article.notHelpfulCount}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/knowledge-base/${articleId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Article
          </Link>
          <Link
            href={`/knowledge-base/${articleId}/preview`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </Link>
          <button
            onClick={handleTogglePublish}
            disabled={toggling}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : article.status === "published" ? (
              <GlobeLock className="w-4 h-4" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {article.status === "published" ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Content Preview
          </h2>
        </div>
        <div className="p-6">
          {article.contentHtml ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : (
            <p className="text-gray-400 text-sm italic">
              No content yet. Click Edit Article to add content.
            </p>
          )}
        </div>
      </div>

      {/* Feedback Summary */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Feedback Summary
          </h2>
        </div>
        {(article.feedbackSummary?.total ?? 0) > 0 ? (
          <div className="p-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {article.feedbackSummary?.helpful ?? article.helpfulCount}
                  </p>
                  <p className="text-xs text-gray-500">Helpful</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {article.feedbackSummary?.notHelpful ?? article.notHelpfulCount}
                  </p>
                  <p className="text-xs text-gray-500">Not Helpful</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">No feedback yet.</p>
          </div>
        )}
      </div>

      {/* SEO Info */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          SEO Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Slug
            </label>
            <p className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg">
              {article.slug || "--"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Meta Title
            </label>
            <p className="text-sm text-gray-700">
              {article.metaTitle || "--"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Meta Description
            </label>
            <p className="text-sm text-gray-700">
              {article.metaDescription || "--"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Created
              </label>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(article.createdAt)}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Last Updated
              </label>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(article.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Article
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete &quot;{article.title}&quot;? It
              will be moved to trash.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
