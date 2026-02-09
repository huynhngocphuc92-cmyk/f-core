"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  BookOpen,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  Loader2,
  Inbox,
  X,
  Globe,
  ThumbsUp,
  Filter,
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
  slug: string;
  status: "draft" | "published" | "archived";
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  category?: Category | null;
}

type FilterTab = "all" | "draft" | "published" | "archived";

// =============================================================================
// KNOWLEDGE BASE ARTICLES LIST PAGE
// =============================================================================

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/kb/articles?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      setArticles(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryFilter, searchQuery]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/kb/categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.data || []);
    } catch {
      // silent fail for categories
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Delete article
  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/kb/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete article");
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Publish article
  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/kb/articles/${id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish article");
      setArticles((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "published" as const } : a
        )
      );
      setActionMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    }
  };

  // Duplicate article
  const handleDuplicate = async (id: string) => {
    try {
      const article = articles.find((a) => a.id === id);
      if (!article) return;
      const res = await fetch("/api/kb/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${article.title} (Copy)`,
          categoryId: article.category?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to duplicate article");
      await fetchArticles();
      setActionMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  // Tab counts (from all loaded articles for the current filter)
  const tabCounts = {
    all: articles.length,
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    archived: articles.filter((a) => a.status === "archived").length,
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "published", label: "Published" },
    { key: "archived", label: "Archived" },
  ];

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Status badge color
  const statusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-50 text-green-700";
      case "draft":
        return "bg-yellow-50 text-yellow-700";
      case "archived":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Helpful percentage
  const helpfulPercent = (article: Article) => {
    const total = article.helpfulCount + article.notHelpfulCount;
    if (total === 0) return "--";
    return `${Math.round((article.helpfulCount / total) * 100)}%`;
  };

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1.5 text-sm font-medium text-cyan-700">
            {articles.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/knowledge-base/categories"
            className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Categories
          </Link>
          <Link
            href="/knowledge-base/new"
            className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Article
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#0891b2] text-[#0891b2]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Category Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors bg-white text-sm text-gray-700"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
        </div>
      )}

      {/* Articles Table */}
      {!loading && articles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Helpful %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="w-16 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/knowledge-base/${article.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-[#0891b2]" />
                      </div>
                      <span className="font-medium text-gray-900 hover:text-[#0891b2] transition-colors">
                        {article.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {article.category?.name || "Uncategorized"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusColor(article.status)}`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      {article.viewCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
                      {helpfulPercent(article)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(article.updatedAt)}
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() =>
                        setActionMenuOpen(
                          actionMenuOpen === article.id ? null : article.id
                        )
                      }
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Action Menu Dropdown */}
                    {actionMenuOpen === article.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div className="absolute right-6 top-12 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                          <Link
                            href={`/knowledge-base/${article.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setActionMenuOpen(null)}
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Link>
                          {article.status !== "published" && (
                            <button
                              onClick={() => handlePublish(article.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                            >
                              <Globe className="w-4 h-4" />
                              Publish
                            </button>
                          )}
                          <Link
                            href={`/knowledge-base/${article.id}/preview`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setActionMenuOpen(null)}
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </Link>
                          <button
                            onClick={() => handleDuplicate(article.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              setDeleteConfirm(article.id);
                              setActionMenuOpen(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-[#0891b2]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {searchQuery || activeTab !== "all" || categoryFilter
              ? "No articles found"
              : "No articles yet"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchQuery || activeTab !== "all" || categoryFilter
              ? "Try adjusting your search or filter."
              : "Create your first knowledge base article."}
          </p>
          {!searchQuery && activeTab === "all" && !categoryFilter && (
            <Link
              href="/knowledge-base/new"
              className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Article
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Article
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete this article? It will be moved
              to trash.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
