"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Link2 } from "lucide-react";
import {
  createMeetingType,
  deleteMeetingType,
  createMeetingLink,
} from "@/app/actions/meetings";

export function CreateMeetingTypeButton() {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createMeetingType(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowModal(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        New Meeting Type
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                New Meeting Type
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form action={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder="e.g. 30-Minute Demo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="duration"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30" selected>
                      30 minutes
                    </option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    name="color"
                    type="color"
                    defaultValue="#0891b2"
                    className="w-full h-[38px] px-1 py-1 border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder="e.g. Zoom, Google Meet, or a link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
                  placeholder="Brief description shown on booking page"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function MeetingTypeActions({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [linkCreated, setLinkCreated] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteMeetingType(id);
      setShowDelete(false);
      router.refresh();
    });
  }

  function handleCreateLink() {
    startTransition(async () => {
      const result = await createMeetingLink(id);
      if (result?.slug) {
        setLinkCreated(result.slug);
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={handleCreateLink}
          disabled={isPending}
          className="p-1.5 text-gray-400 hover:text-[#0891b2] transition-colors rounded"
          title="Create booking link"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {linkCreated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setLinkCreated(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Booking Link Created
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Share this link with your contacts:
            </p>
            <code className="block px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 break-all mb-4">
              /book/{linkCreated}
            </code>
            <button
              onClick={() => setLinkCreated(null)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDelete(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Meeting Type
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Delete &ldquo;{name}&rdquo;? Associated booking links will also be
              deactivated.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
