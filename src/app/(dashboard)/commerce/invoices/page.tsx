"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "void";
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

type InvoiceResponse = {
  data: Invoice[];
  summary: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    void: number;
    totalAmount: number;
    paidAmount: number;
  };
};

export default function CommerceInvoicesPage() {
  const [data, setData] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("ACME Corp");
  const [amount, setAmount] = useState("12000");
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");

  async function loadInvoices() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/commerce/invoices");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load invoices");
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/commerce/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          amount: Number(amount),
          currency,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create invoice");
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create invoice");
    } finally {
      setSaving(false);
    }
  }

  async function transition(id: string, status: "sent" | "paid" | "void") {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/commerce/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update invoice status");
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update invoice status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="mt-1 text-gray-600">Manage draft/sent/paid/void lifecycle with safe transitions.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Create Invoice</p>
        <div className="grid gap-3 md:grid-cols-4">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Customer" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Amount" />
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Currency" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
        </div>
        <button onClick={create} disabled={saving} className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50">Create Draft</button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading invoices...</div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Total" value={String(data.summary.total)} />
            <Metric label="Draft" value={String(data.summary.draft)} />
            <Metric label="Sent" value={String(data.summary.sent)} />
            <Metric label="Paid" value={String(data.summary.paid)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <Receipt className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Invoice Lifecycle</p>
            </div>
            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No invoices yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((invoice) => (
                  <div key={invoice.id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber} • {invoice.customerName}</p>
                        <p className="text-xs text-gray-500">{formatMoney(invoice.amount, invoice.currency)} • {invoice.status}</p>
                      </div>
                      <div className="flex gap-2">
                        {invoice.status === "draft" && (
                          <button onClick={() => transition(invoice.id, "sent")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Send</button>
                        )}
                        {invoice.status === "sent" && (
                          <button onClick={() => transition(invoice.id, "paid")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Mark Paid</button>
                        )}
                        {(invoice.status === "draft" || invoice.status === "sent") && (
                          <button onClick={() => transition(invoice.id, "void")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Void</button>
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

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
