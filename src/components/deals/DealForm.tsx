"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Search, Building2, User } from "lucide-react";

interface StageOption {
  id: string;
  name: string;
  orderIndex: number;
  probability: number;
  color: string | null;
  isClosed: boolean;
  isWon: boolean;
}

interface DealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pipelineId: string;
  stageId?: string;
  stages: StageOption[];
}

interface CompanyResult {
  id: string;
  name: string;
  domain: string | null;
}

interface ContactResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export default function DealForm({
  isOpen,
  onClose,
  onSuccess,
  pipelineId,
  stageId,
  stages,
}: DealFormProps) {
  const [name, setName] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(stageId || "");
  const [amount, setAmount] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [dealType, setDealType] = useState("newbusiness");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  // Company search
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyResult[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // Contact search
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<ContactResult[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<ContactResult[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const contactTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedStageId(stageId || stages[0]?.id || "");
      setAmount("");
      setCloseDate("");
      setDealType("newbusiness");
      setPriority("medium");
      setDescription("");
      setSelectedCompanies([]);
      setSelectedContacts([]);
      setCompanySearch("");
      setContactSearch("");
      setError(null);
    }
  }, [isOpen, stageId, stages]);

  // Company search with debounce
  const searchCompanies = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCompanyResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/companies?search=${encodeURIComponent(query)}&limit=5`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setCompanyResults(
          data.filter(
            (c: CompanyResult) => !selectedCompanies.some((sc) => sc.id === c.id)
          )
        );
      }
    } catch {
      // ignore
    }
  }, [selectedCompanies]);

  useEffect(() => {
    clearTimeout(companyTimeoutRef.current);
    companyTimeoutRef.current = setTimeout(() => searchCompanies(companySearch), 300);
    return () => clearTimeout(companyTimeoutRef.current);
  }, [companySearch, searchCompanies]);

  // Contact search with debounce
  const searchContacts = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setContactResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(query)}&limit=5`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setContactResults(
          data.filter(
            (c: ContactResult) => !selectedContacts.some((sc) => sc.id === c.id)
          )
        );
      }
    } catch {
      // ignore
    }
  }, [selectedContacts]);

  useEffect(() => {
    clearTimeout(contactTimeoutRef.current);
    contactTimeoutRef.current = setTimeout(() => searchContacts(contactSearch), 300);
    return () => clearTimeout(contactTimeoutRef.current);
  }, [contactSearch, searchContacts]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Deal name is required");
      return;
    }
    if (!selectedStageId) {
      setError("Stage is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          pipelineId,
          stageId: selectedStageId,
          amount: amount ? parseFloat(amount.replace(/,/g, "")) : null,
          closeDate: closeDate || null,
          dealType,
          priority,
          description: description || null,
          companyIds: selectedCompanies.map((c) => c.id),
          contactIds: selectedContacts.map((c) => c.id),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create deal");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[512px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Deal</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Section 1: Deal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Deal Information
            </h3>
            <div className="space-y-3">
              {/* Deal Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Enterprise License Renewal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.probability}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Deal Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Deal Details
            </h3>
            <div className="space-y-3">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "");
                      setAmount(val);
                    }}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Close Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
                <input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Deal Type + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
                  <select
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="newbusiness">New Business</option>
                    <option value="existingbusiness">Existing Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Associations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Associations
            </h3>
            <div className="space-y-3">
              {/* Company Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                {selectedCompanies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedCompanies.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs"
                      >
                        <Building2 className="w-3 h-3" />
                        {c.name}
                        <button
                          onClick={() => setSelectedCompanies((prev) => prev.filter((x) => x.id !== c.id))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setShowCompanyDropdown(true);
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    placeholder="Search companies..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  {showCompanyDropdown && companyResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                      {companyResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCompanies((prev) => [...prev, c]);
                            setCompanySearch("");
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{c.name}</div>
                            {c.domain && <div className="text-xs text-gray-400">{c.domain}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                {selectedContacts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedContacts.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs"
                      >
                        <User className="w-3 h-3" />
                        {[c.firstName, c.lastName].filter(Boolean).join(" ") || c.email}
                        <button
                          onClick={() => setSelectedContacts((prev) => prev.filter((x) => x.id !== c.id))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => {
                      setContactSearch(e.target.value);
                      setShowContactDropdown(true);
                    }}
                    onFocus={() => setShowContactDropdown(true)}
                    placeholder="Search contacts..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  {showContactDropdown && contactResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                      {contactResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedContacts((prev) => [...prev, c]);
                            setContactSearch("");
                            setShowContactDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {[c.firstName, c.lastName].filter(Boolean).join(" ") || "No name"}
                            </div>
                            {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Additional */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Additional Info
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add any relevant details..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Deal"}
          </button>
        </div>
      </div>
    </>
  );
}
