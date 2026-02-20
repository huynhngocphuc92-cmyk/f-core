"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

type SocialChannel = "facebook" | "instagram" | "linkedin" | "x";

type SocialPost = {
  id: string;
  title: string;
  channels: SocialChannel[];
  status: "draft" | "scheduled" | "published" | "failed" | "canceled";
  scheduledAt: string | null;
  publishedAt: string | null;
  failureReason: string | null;
  createdAt: string;
};

type SocialSummary = {
  total: number;
  draft: number;
  scheduled: number;
  published: number;
  failed: number;
  canceled: number;
  channelMix: Record<SocialChannel, number>;
};

type SocialResponse = {
  data: SocialPost[];
  summary: SocialSummary;
};

const ALL_CHANNELS: SocialChannel[] = ["facebook", "instagram", "linkedin", "x"];

export default function MarketingSocialPage() {
  const [data, setData] = useState<SocialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Weekly Product Update");
  const [content, setContent] = useState("New onboarding flow is live. Check release notes.");
  const [scheduledAt, setScheduledAt] = useState("");
  const [channels, setChannels] = useState<Record<SocialChannel, boolean>>({
    facebook: true,
    instagram: false,
    linkedin: true,
    x: false,
  });

  async function loadPosts() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/marketing/social/posts");
      const body = (await response.json()) as SocialResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load social posts");
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load social posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function selectedChannels() {
    return ALL_CHANNELS.filter((channel) => channels[channel]);
  }

  async function createPost() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/marketing/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          channels: selectedChannels(),
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create post");

      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create post");
    } finally {
      setSaving(false);
    }
  }

  async function transition(
    id: string,
    action: "schedule" | "publish_now" | "mark_failed" | "cancel"
  ) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketing/social/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          scheduledAt: action === "schedule" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update post");

      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Social Scheduler</h1>
        <p className="mt-1 text-gray-600">
          Schedule and monitor social posts across channels in one publishing calendar.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Create Social Post</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="Post title"
          />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          />
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-3 min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Post content"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          {ALL_CHANNELS.map((channel) => (
            <label key={channel} className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={channels[channel]}
                onChange={(event) =>
                  setChannels((prev) => ({ ...prev, [channel]: event.target.checked }))
                }
              />
              {channel}
            </label>
          ))}
        </div>
        <button
          onClick={createPost}
          disabled={saving}
          className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          {scheduledAt ? "Create Scheduled Post" : "Create Draft"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading social posts...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            <Metric label="Total" value={String(data.summary.total)} />
            <Metric label="Draft" value={String(data.summary.draft)} />
            <Metric label="Scheduled" value={String(data.summary.scheduled)} />
            <Metric label="Published" value={String(data.summary.published)} />
            <Metric label="Failed" value={String(data.summary.failed)} />
            <Metric label="Canceled" value={String(data.summary.canceled)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <CalendarClock className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Publishing Queue</p>
            </div>

            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No social posts yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((post) => (
                  <div key={post.id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{post.title}</p>
                        <p className="text-xs text-gray-500">
                          {post.channels.join(", ")} • {post.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          Scheduled: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString("en-US") : "-"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {post.status !== "published" && (
                          <button
                            onClick={() => transition(post.id, "publish_now")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Publish Now
                          </button>
                        )}
                        {(post.status === "draft" || post.status === "failed") && (
                          <button
                            onClick={() => transition(post.id, "schedule")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Schedule
                          </button>
                        )}
                        {(post.status === "draft" || post.status === "scheduled") && (
                          <button
                            onClick={() => transition(post.id, "mark_failed")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Mark Failed
                          </button>
                        )}
                        {post.status !== "published" && post.status !== "canceled" && (
                          <button
                            onClick={() => transition(post.id, "cancel")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
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
