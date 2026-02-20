"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

type ContentSpace = "blog_post" | "landing_page";

type ApprovalPolicy = {
  space: ContentSpace;
  enabled: boolean;
  requiredApprovals: number;
  updatedAt: string;
};

type ApprovalRequest = {
  id: string;
  space: ContentSpace;
  assetId: string;
  assetTitle: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  decidedAt: string | null;
};

type BlogPost = {
  id: string;
  title: string;
  status: "draft" | "in_review" | "scheduled" | "published" | "archived";
  updatedAt: string;
};

const spaceLabels: Record<ContentSpace, string> = {
  blog_post: "Blog Posts",
  landing_page: "Landing Pages",
};

export default function ContentApprovalsPage() {
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([]);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [policiesResponse, requestsResponse, postsResponse] = await Promise.all([
        fetch("/api/content/approvals/policies"),
        fetch("/api/content/approvals/requests"),
        fetch("/api/content/blog/posts?status=in_review"),
      ]);

      const [policiesBody, requestsBody, postsBody] = await Promise.all([
        policiesResponse.json(),
        requestsResponse.json(),
        postsResponse.json(),
      ]);

      if (!policiesResponse.ok) throw new Error(policiesBody.error || "Unable to load policies");
      if (!requestsResponse.ok) throw new Error(requestsBody.error || "Unable to load requests");
      if (!postsResponse.ok) throw new Error(postsBody.error || "Unable to load posts");

      setPolicies(policiesBody.data || []);
      setRequests(requestsBody.data || []);
      setBlogPosts(postsBody.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load approval workflow");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function togglePolicy(policy: ApprovalPolicy, enabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/content/approvals/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space: policy.space,
          enabled,
          requiredApprovals: policy.requiredApprovals,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update policy");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update policy");
    } finally {
      setSaving(false);
    }
  }

  async function requestApproval(post: BlogPost) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/content/approvals/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space: "blog_post",
          assetId: post.id,
          assetTitle: post.title,
          assetUpdatedAt: post.updatedAt,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create approval request");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create approval request");
    } finally {
      setSaving(false);
    }
  }

  async function decideRequest(requestId: string, decision: "approved" | "rejected") {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/approvals/requests/${requestId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to decide request");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to decide request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Approvals</h1>
        <p className="mt-1 text-gray-600">Configure review gates and process pending approvals before publish.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading approval workflow...
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Approval Policies</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {policies.map((policy) => (
                <div key={policy.space} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{spaceLabels[policy.space]}</p>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        policy.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {policy.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <button
                    onClick={() => togglePolicy(policy, !policy.enabled)}
                    disabled={saving}
                    className="rounded border border-gray-200 px-2 py-1 text-xs"
                  >
                    {policy.enabled ? "Disable" : "Enable"} Gate
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Posts In Review</p>
            {blogPosts.length === 0 ? (
              <p className="text-sm text-gray-500">No blog posts currently in review.</p>
            ) : (
              <div className="space-y-2">
                {blogPosts.map((post) => (
                  <div key={post.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{post.title}</p>
                      <p className="text-xs text-gray-500">Updated {new Date(post.updatedAt).toLocaleString("en-US")}</p>
                    </div>
                    <button
                      onClick={() => requestApproval(post)}
                      disabled={saving}
                      className="rounded border border-gray-200 px-2 py-1 text-xs"
                    >
                      Request Approval
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Approval Queue</p>
            {requests.length === 0 ? (
              <p className="text-sm text-gray-500">No approval requests yet.</p>
            ) : (
              <div className="space-y-2">
                {requests.map((request) => (
                  <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.assetTitle}</p>
                      <p className="text-xs text-gray-500">
                        {spaceLabels[request.space]} • {request.status} • requested {new Date(request.requestedAt).toLocaleString("en-US")}
                      </p>
                    </div>
                    {request.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => decideRequest(request.id, "approved")}
                          disabled={saving}
                          className="rounded border border-gray-200 px-2 py-1 text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decideRequest(request.id, "rejected")}
                          disabled={saving}
                          className="rounded border border-gray-200 px-2 py-1 text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Decided</span>
                    )}
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
