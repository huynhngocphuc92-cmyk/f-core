"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PenSquare } from "lucide-react";

import { toIntlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

type BlogStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";
type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: BlogStatus;
  scheduledAt: string | null;
  updatedAt: string;
};

type BlogResponse = {
  data: BlogPost[];
  summary: {
    total: number;
    draft: number;
    in_review: number;
    scheduled: number;
    published: number;
    archived: number;
  };
};

export default function ContentBlogPage() {
  const { locale, t } = useI18n();
  const intlLocale = toIntlLocale(locale);
  const [status, setStatus] = useState<BlogStatus | "all">("all");
  const [data, setData] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Quarterly Product Update");
  const [content, setContent] = useState("Write your article body here...");
  const [excerpt, setExcerpt] = useState("Highlights from this quarter release.");
  const [scheduledAt, setScheduledAt] = useState("");

  const statusOptions: Array<{ label: string; value: BlogStatus | "all" }> = useMemo(
    () => [
      { label: t("dashboard.contentBlog.statusOptions.all", "All"), value: "all" },
      {
        label: t("dashboard.contentBlog.statusOptions.draft", "Draft"),
        value: "draft",
      },
      {
        label: t("dashboard.contentBlog.statusOptions.inReview", "In Review"),
        value: "in_review",
      },
      {
        label: t("dashboard.contentBlog.statusOptions.scheduled", "Scheduled"),
        value: "scheduled",
      },
      {
        label: t("dashboard.contentBlog.statusOptions.published", "Published"),
        value: "published",
      },
      {
        label: t("dashboard.contentBlog.statusOptions.archived", "Archived"),
        value: "archived",
      },
    ],
    [t]
  );

  const loadPosts = useCallback(
    async (nextStatus = status) => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (nextStatus !== "all") query.set("status", nextStatus);

        const response = await fetch(`/api/content/blog/posts?${query.toString()}`);
        const body = (await response.json()) as BlogResponse & { error?: string };
        if (!response.ok) {
          throw new Error(
            body.error ||
              t("dashboard.contentBlog.errors.load", "Unable to load blog posts")
          );
        }
        setData(body);
      } catch (err) {
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : t("dashboard.contentBlog.errors.load", "Unable to load blog posts")
        );
      } finally {
        setLoading(false);
      }
    },
    [status, t]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function createPost() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/content/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          body.error ||
            t("dashboard.contentBlog.errors.create", "Unable to create post")
        );
      }
      await loadPosts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("dashboard.contentBlog.errors.create", "Unable to create post")
      );
    } finally {
      setSaving(false);
    }
  }

  async function transition(postId: string, action: string, scheduleValue?: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/blog/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          scheduledAt: scheduleValue ? new Date(scheduleValue).toISOString() : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          body.error ||
            t("dashboard.contentBlog.errors.update", "Unable to update post")
        );
      }
      await loadPosts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("dashboard.contentBlog.errors.update", "Unable to update post")
      );
    } finally {
      setSaving(false);
    }
  }

  async function applyStatus(nextStatus: BlogStatus | "all") {
    setStatus(nextStatus);
    await loadPosts(nextStatus);
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard.contentBlog.title", "Blog Manager")}
        </h1>
        <p className="mt-1 text-gray-600">
          {t(
            "dashboard.contentBlog.subtitle",
            "Create, edit, review, publish, and schedule blog posts."
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">
          {t("dashboard.contentBlog.newPost.title", "New Post")}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder={t("dashboard.contentBlog.newPost.titlePlaceholder", "Title")}
          />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          />
        </div>
        <input
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          className="mt-3 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
          placeholder={t("dashboard.contentBlog.newPost.excerptPlaceholder", "Excerpt")}
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-3 min-h-28 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder={t("dashboard.contentBlog.newPost.contentPlaceholder", "Content")}
        />
        <button
          onClick={createPost}
          disabled={saving}
          className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          {scheduledAt
            ? t(
                "dashboard.contentBlog.newPost.createScheduled",
                "Create Scheduled Post"
              )
            : t("dashboard.contentBlog.newPost.createDraft", "Create Draft")}
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          {t("dashboard.contentBlog.loading", "Loading posts...")}
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => applyStatus(option.value)}
                className={`rounded border px-3 py-1 text-xs ${
                  status === option.value
                    ? "border-[#0891b2] text-[#0891b2]"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4 md:grid-cols-6">
            <Metric
              label={t("dashboard.contentBlog.metrics.total", "Total")}
              value={String(data.summary.total)}
            />
            <Metric
              label={t("dashboard.contentBlog.metrics.draft", "Draft")}
              value={String(data.summary.draft)}
            />
            <Metric
              label={t("dashboard.contentBlog.metrics.review", "Review")}
              value={String(data.summary.in_review)}
            />
            <Metric
              label={t("dashboard.contentBlog.metrics.scheduled", "Scheduled")}
              value={String(data.summary.scheduled)}
            />
            <Metric
              label={t("dashboard.contentBlog.metrics.published", "Published")}
              value={String(data.summary.published)}
            />
            <Metric
              label={t("dashboard.contentBlog.metrics.archived", "Archived")}
              value={String(data.summary.archived)}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <PenSquare className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">
                {t("dashboard.contentBlog.workflowTitle", "Post Workflow")}
              </p>
            </div>
            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {t("dashboard.contentBlog.emptyFilter", "No posts in this filter.")}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((post) => (
                  <div key={post.id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{post.title}</p>
                        <p className="text-xs text-gray-500">
                          /{post.slug} • {statusOptions.find((s) => s.value === post.status)?.label || post.status} •{" "}
                          {t("dashboard.contentBlog.metaUpdated", "updated {value}", {
                            value: new Date(post.updatedAt).toLocaleString(intlLocale),
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(post.status === "draft" || post.status === "archived") && (
                          <button
                            onClick={() => transition(post.id, "submit_review")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            {t(
                              "dashboard.contentBlog.actions.submitReview",
                              "Submit Review"
                            )}
                          </button>
                        )}
                        {post.status === "in_review" && (
                          <button
                            onClick={() => transition(post.id, "approve")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            {t("dashboard.contentBlog.actions.approve", "Approve")}
                          </button>
                        )}
                        {post.status !== "published" && (
                          <button
                            onClick={() => transition(post.id, "publish_now")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            {t("dashboard.contentBlog.actions.publish", "Publish")}
                          </button>
                        )}
                        {post.status !== "published" && (
                          <button
                            onClick={() => transition(post.id, "schedule", scheduledAt)}
                            disabled={saving || !scheduledAt}
                            className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-50"
                          >
                            {t("dashboard.contentBlog.actions.schedule", "Schedule")}
                          </button>
                        )}
                        {post.status !== "archived" && (
                          <button
                            onClick={() => transition(post.id, "archive")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            {t("dashboard.contentBlog.actions.archive", "Archive")}
                          </button>
                        )}
                      </div>
                    </div>
                    {post.excerpt && <p className="text-xs text-gray-600">{post.excerpt}</p>}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
