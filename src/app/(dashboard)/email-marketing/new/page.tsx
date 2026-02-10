import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCampaign } from "@/app/actions/campaigns";

export default function NewCampaignPage() {
  return (
    <div className="p-6 pt-8">
      <Link
        href="/email-marketing"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          New Campaign
        </h1>

        <form
          action={createCampaign}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              placeholder="e.g. Monthly Newsletter - February"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              name="subject"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              placeholder="Email subject that recipients will see"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preview Text
            </label>
            <input
              name="previewText"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              placeholder="Text shown in email preview (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body <span className="text-red-500">*</span>
            </label>
            <textarea
              name="body"
              required
              rows={12}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
              placeholder="Write your email content..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/email-marketing"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490]"
            >
              Create Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
