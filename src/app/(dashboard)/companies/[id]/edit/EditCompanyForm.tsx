"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { updateCompany } from "@/app/actions/crm";

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  type: string | null;
  size: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
}

export default function EditCompanyForm({ company }: { company: Company }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const boundUpdate = updateCompany.bind(null, company.id);

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
        href={`/companies/${company.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Company
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Company</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
              <input name="name" type="text" required defaultValue={company.name} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input name="domain" type="text" defaultValue={company.domain || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input name="website" type="url" defaultValue={company.website || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select name="industry" defaultValue={company.industry || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Media">Media</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" defaultValue={company.type || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option value="">Select type</option>
                <option value="Prospect">Prospect</option>
                <option value="Partner">Partner</option>
                <option value="Reseller">Reseller</option>
                <option value="Vendor">Vendor</option>
                <option value="Customer">Customer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <select name="size" defaultValue={company.size || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option value="">Select size</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1001-5000">1001-5000</option>
                <option value="5001+">5001+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" type="tel" defaultValue={company.phone || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="city" type="text" defaultValue={company.city || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input name="state" type="text" defaultValue={company.state || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input name="country" type="text" defaultValue={company.country || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Description</h2>
          <textarea name="description" rows={4} defaultValue={company.description || ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none" />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/companies/${company.id}`} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
