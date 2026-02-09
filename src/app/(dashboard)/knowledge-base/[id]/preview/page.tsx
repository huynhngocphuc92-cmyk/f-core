"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  BookOpen,
  ChevronRight,
  Check,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  contentHtml: string | null;
  status: "draft" | "published" | "archived";
  category?: Category | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// =============================================================================
// ARTICLE PREVIEW PAGE
// =============================================================================

export default function ArticlePreviewPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<boolean | null>(null);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Load article
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/kb/articles/${articleId}`);
        if (!res.ok) throw new Error("Failed to load article");
        const data = await res.json();
        const art = data.data || data;
        setArticle(art);

        // Fetch related articles (same category)
        if (art.category?.id) {
          const relRes = await fetch(
            `/api/kb/articles?categoryId=${art.category.id}&status=published&limit=5`
          );
          if (relRes.ok) {
            const relData = await relRes.json();
            const related = (relData.data || []).filter(
              (a: RelatedArticle) => a.id !== articleId
            );
            setRelatedArticles(related.slice(0, 4));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [articleId]);

  // Submit feedback
  const handleFeedback = async (isHelpful: boolean) => {
    try {
      setSendingFeedback(true);
      const res = await fetch(`/api/kb/articles/${articleId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHelpful }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setFeedbackSent(isHelpful);
    } catch {
      // silent fail for feedback
    } finally {
      setSendingFeedback(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
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

  return (
    <div className="p-6 pt-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto">
        <Link
          href={`/knowledge-base/${articleId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Article
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
            Preview Mode
          </span>
          <Link
            href={`/knowledge-base/${articleId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto">
        {/* Category Breadcrumb */}
        {article.category && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link
              href="/knowledge-base"
              className="hover:text-[#0891b2] transition-colors"
            >
              Knowledge Base
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700 font-medium">
              {article.category.name}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-lg text-gray-600 mb-6">{article.subtitle}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          {article.publishedAt && (
            <span>Published {formatDate(article.publishedAt)}</span>
          )}
          {article.updatedAt && (
            <span>Updated {formatDate(article.updatedAt)}</span>
          )}
        </div>

        {/* Content */}
        <div className="mb-12">
          {article.contentHtml ? (
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#0891b2] prose-a:no-underline hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">
                This article has no content yet.
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-8 pb-8 border-b border-gray-200">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Feedback Section */}
        <div className="rounded-2xl bg-gray-50 p-8 text-center mb-12">
          {feedbackSent !== null ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium">
                Thank you for your feedback!
              </p>
              <p className="text-gray-500 text-sm">
                Your response helps us improve our documentation.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Was this article helpful?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Let us know if this article answered your question.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={sendingFeedback}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors disabled:opacity-50"
                >
                  {sendingFeedback ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  Yes, helpful
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  disabled={sendingFeedback}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {sendingFeedback ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsDown className="w-4 h-4" />
                  )}
                  Not helpful
                </button>
              </div>
            </>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Related Articles
            </h3>
            <div className="space-y-3">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/knowledge-base/${rel.id}/preview`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-[#0891b2] hover:shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[#0891b2]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#0891b2] transition-colors">
                    {rel.title}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
