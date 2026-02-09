"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText } from "lucide-react";

export default function NewFormPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Form name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create form");
      }

      const form = await res.json();
      router.push(`/forms/${form.id}/edit`);
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
        href="/forms"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Forms
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Form</h1>
        <p className="text-gray-600 mt-1">
          Set up your form details, then customize it in the builder.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0891b2]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Form Details
            </h2>
            <p className="text-sm text-gray-500">
              Give your form a name and description.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form Name */}
          <div>
            <label
              htmlFor="formName"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Form Name <span className="text-red-500">*</span>
            </label>
            <input
              id="formName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Contact Us, Newsletter Signup"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="formDescription"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="formDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this form is for..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/forms"
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
