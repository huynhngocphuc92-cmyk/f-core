"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

// =============================================================================
// NEW ARTICLE PAGE
// =============================================================================

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/kb/categories");
        if (!res.ok) return;
        const data = await res.json();
        setCategories(data.data || []);
      } catch {
        // silent fail
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Article title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/kb/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          categoryId: categoryId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create article");
      }

      const article = await res.json();
      router.push(`/knowledge-base/${article.id || article.data?.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pt-8 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/knowledge-base"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Knowledge Base
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Article
        </h1>
        <p className="text-gray-600 mt-1">
          Set up your article details, then write the content in the editor.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#0891b2]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Article Details
            </h2>
            <p className="text-sm text-gray-500">
              Give your article a title and choose a category.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Article Title */}
          <div>
            <label
              htmlFor="articleTitle"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              id="articleTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to get started with..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="articleCategory"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Category{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="articleCategory"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors bg-white"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentId ? `  -- ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/knowledge-base"
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Article
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
