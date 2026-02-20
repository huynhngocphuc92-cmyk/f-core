"use client";

import { useState } from "react";
import { createQuote, type QuoteLineItemInput } from "@/app/actions/quotes";
import { Plus, Trash2, DollarSign, Package } from "lucide-react";

interface FormOption {
  id: string;
  name: string;
}

interface QuoteCreateFormProps {
  deals: FormOption[];
  contacts: FormOption[];
  companies: FormOption[];
}

interface LineItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

const emptyLineItem: LineItem = {
  name: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
};

export function QuoteCreateForm({ deals, contacts, companies }: QuoteCreateFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLineItem }]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLineItem = () => {
    setLineItems([...lineItems, { ...emptyLineItem }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const getLineTotal = (item: LineItem) => {
    return item.quantity * item.unitPrice * (1 - item.discount / 100);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + getLineTotal(item), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      title: formData.get("title") as string,
      dealId: (formData.get("dealId") as string) || undefined,
      contactId: (formData.get("contactId") as string) || undefined,
      companyId: (formData.get("companyId") as string) || undefined,
      expiresAt: (formData.get("expiresAt") as string) || undefined,
      paymentTerms: (formData.get("paymentTerms") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      terms: (formData.get("terms") as string) || undefined,
      lineItems: lineItems.filter((li) => li.name.trim() !== "") as QuoteLineItemInput[],
    };

    try {
      const result = await createQuote(data);
      if (result && "error" in result) {
        setError(result.error);
        setPending(false);
      }
    } catch {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quote Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Quote Details
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g., Enterprise Package Q1 2026"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label htmlFor="dealId" className="block text-sm font-medium text-gray-700 mb-1">
                  Deal
                </label>
                <select
                  id="dealId"
                  name="dealId"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                >
                  <option value="">Select a deal...</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <select
                  id="contactId"
                  name="contactId"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                >
                  <option value="">Select a contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                >
                  <option value="">Select a company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  id="expiresAt"
                  name="expiresAt"
                  type="date"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <select
                  id="paymentTerms"
                  name="paymentTerms"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                >
                  <option value="">Select terms...</option>
                  <option value="due_on_receipt">Due on Receipt</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                  <option value="net_60">Net 60</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Notes & Terms
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Notes for your team..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  id="terms"
                  name="terms"
                  rows={3}
                  placeholder="Terms visible to the buyer..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Line Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Line Items ({lineItems.length})
              </h2>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1.5 text-sm text-[#0891b2] hover:text-[#0e7490] font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
              <div className="col-span-4">Item</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Discount %</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            <div className="divide-y divide-gray-100">
              {lineItems.map((item, index) => (
                <div key={index} className="px-5 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateLineItem(index, "name", e.target.value)}
                        placeholder="Item name"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-1.5 mt-1 rounded border border-gray-100 text-xs text-gray-500 focus:border-[#0891b2] outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, "unitPrice", Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={item.discount}
                        onChange={(e) => updateLineItem(index, "discount", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end">
                      <span className="text-sm font-medium text-gray-900">
                        ${getLineTotal(item).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-end gap-8">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Subtotal</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <a
              href="/quotes"
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 px-6 py-2 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] transition-colors disabled:opacity-50"
            >
              <Package className="w-4 h-4" />
              {pending ? "Creating..." : "Create Quote"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
