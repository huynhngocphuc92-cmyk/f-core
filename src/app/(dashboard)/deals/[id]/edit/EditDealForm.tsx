"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { updateDeal } from "@/app/actions/crm";

interface Stage {
  id: string;
  name: string;
  probability: number;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  closeDate: string | null;
  priority: string | null;
  dealType: string | null;
  description: string | null;
  pipelineId: string;
  stageId: string;
}

export default function EditDealForm({
  deal,
  pipelines,
}: {
  deal: Deal;
  pipelines: Pipeline[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(deal.pipelineId);

  const stages =
    pipelines.find((p) => p.id === selectedPipeline)?.stages || [];

  const boundUpdate = updateDeal.bind(null, deal.id);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await boundUpdate(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="p-6 pt-8 max-w-3xl">
      <Link
        href={`/deals/${deal.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Deal
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Deal</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            Deal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name <span className="text-red-500">*</span></label>
              <input name="name" type="text" required defaultValue={deal.name} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input name="amount" type="number" step="0.01" min="0" defaultValue={deal.amount ?? ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select name="currency" defaultValue={deal.currency} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="VND">VND</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            Pipeline & Stage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline <span className="text-red-500">*</span></label>
              <select name="pipelineId" value={selectedPipeline} onChange={(e) => setSelectedPipeline(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage <span className="text-red-500">*</span></label>
              <select name="stageId" defaultValue={deal.stageId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.probability}%)</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
              <input name="closeDate" type="date" defaultValue={deal.closeDate || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select name="priority" defaultValue={deal.priority || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
              <select name="dealType" defaultValue={deal.dealType || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option value="">Select type</option>
                <option value="new_business">New Business</option>
                <option value="existing_business">Existing Business</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={3} defaultValue={deal.description || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/deals/${deal.id}`} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={pending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
