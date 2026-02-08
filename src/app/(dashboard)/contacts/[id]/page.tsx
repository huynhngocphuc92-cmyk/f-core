"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Clock,
  Plus,
  X,
  Search,
  Star,
} from "lucide-react";

type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  jobTitle: string | null;
  department: string | null;
  lifecycleStage: string | null;
  leadStatus: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  companies: Array<{
    companyId: string;
    isPrimary: boolean;
    company: { id: string; name: string; domain: string | null; industry: string | null };
  }>;
  deals: Array<{
    deal: { id: string; name: string; amount: number | null; stage: string | null };
  }>;
  activities: Array<{
    id: string;
    type: string;
    subject: string | null;
    body: string | null;
    createdAt: string;
  }>;
  createdAt: string;
};

type CompanySearchResult = {
  id: string;
  name: string;
  domain: string | null;
};

const LIFECYCLE_COLORS: Record<string, string> = {
  subscriber: "bg-gray-100 text-gray-700",
  lead: "bg-blue-100 text-blue-700",
  mql: "bg-purple-100 text-purple-700",
  sql: "bg-orange-100 text-orange-700",
  opportunity: "bg-yellow-100 text-yellow-700",
  customer: "bg-green-100 text-green-700",
  evangelist: "bg-pink-100 text-pink-700",
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  open: "bg-green-100 text-green-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  open_deal: "bg-purple-100 text-purple-700",
  unqualified: "bg-gray-100 text-gray-700",
  attempted_to_contact: "bg-orange-100 text-orange-700",
  connected: "bg-teal-100 text-teal-700",
  bad_timing: "bg-red-100 text-red-700",
};

const ACTIVITY_COLORS: Record<string, { bg: string; text: string }> = {
  email: { bg: "bg-blue-50", text: "text-blue-700" },
  call: { bg: "bg-green-50", text: "text-green-700" },
  meeting: { bg: "bg-purple-50", text: "text-purple-700" },
  note: { bg: "bg-yellow-50", text: "text-yellow-700" },
  task: { bg: "bg-orange-50", text: "text-orange-700" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

  // Association search
  const [showAssociateSearch, setShowAssociateSearch] = useState(false);
  const [associateSearch, setAssociateSearch] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanySearchResult[]>([]);

  const fetchContact = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error("Contact not found");
      const data = await res.json();
      setContact(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  // Search companies for association
  useEffect(() => {
    if (!associateSearch.trim()) {
      setCompanyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies?search=${encodeURIComponent(associateSearch)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setCompanyResults(
            data.data.map((c: { id: string; name: string; domain: string | null }) => ({
              id: c.id,
              name: c.name,
              domain: c.domain,
            }))
          );
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [associateSearch]);

  const handleAssociate = async (companyId: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}/associations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "company", targetId: companyId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to associate");
        return;
      }
      setShowAssociateSearch(false);
      setAssociateSearch("");
      fetchContact();
    } catch {
      alert("Failed to associate company");
    }
  };

  const handleRemoveAssociation = async (companyId: string) => {
    if (!confirm("Remove this company association?")) return;
    try {
      await fetch(`/api/contacts/${id}/associations?companyId=${companyId}`, {
        method: "DELETE",
      });
      fetchContact();
    } catch {
      alert("Failed to remove association");
    }
  };

  if (loading) {
    return (
      <div className="p-6 pt-8">
        <p className="text-gray-500">Loading contact...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-6 pt-8">
        <Link href="/contacts" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
        <div className="text-center py-12">
          <p className="text-red-500">{error || "Contact not found"}</p>
        </div>
      </div>
    );
  }

  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email || "Unknown";
  const initials = `${contact.firstName?.charAt(0) || "?"}${contact.lastName?.charAt(0) || ""}`;

  return (
    <div className="p-6 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/contacts" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-6">
        {/* LEFT SIDEBAR - About Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Avatar + Name */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {initials}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{contactName}</h1>
              {contact.jobTitle && (
                <p className="text-sm text-gray-500 mt-1">{contact.jobTitle}</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-2 mb-6">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Send email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* About Fields */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">About</h3>

              {contact.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <a href={`tel:${contact.phone}`} className="text-sm text-gray-900">
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact.mobilePhone && (
                <div>
                  <p className="text-xs text-gray-500">Mobile</p>
                  <a href={`tel:${contact.mobilePhone}`} className="text-sm text-gray-900">
                    {contact.mobilePhone}
                  </a>
                </div>
              )}

              {contact.lifecycleStage && (
                <div>
                  <p className="text-xs text-gray-500">Lifecycle Stage</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${LIFECYCLE_COLORS[contact.lifecycleStage] || "bg-gray-100 text-gray-700"}`}>
                    {contact.lifecycleStage}
                  </span>
                </div>
              )}

              {contact.leadStatus && (
                <div>
                  <p className="text-xs text-gray-500">Lead Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${LEAD_STATUS_COLORS[contact.leadStatus] || "bg-gray-100 text-gray-700"}`}>
                    {contact.leadStatus}
                  </span>
                </div>
              )}

              {contact.department && (
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm text-gray-900">{contact.department}</p>
                </div>
              )}

              {contact.owner && (
                <div>
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="text-sm text-gray-900">{contact.owner.name}</p>
                </div>
              )}

              {(contact.city || contact.country) && (
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm text-gray-900">
                    {[contact.city, contact.state, contact.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER - Tabs + Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Tab Bar */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6 px-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "activity"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Activity
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{contact.companies.length}</p>
                      <p className="text-xs text-gray-500">Companies</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{contact.deals.length}</p>
                      <p className="text-xs text-gray-500">Deals</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{contact.activities.length}</p>
                      <p className="text-xs text-gray-500">Activities</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
                    {contact.activities.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No activities yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contact.activities.slice(0, 5).map((activity) => {
                          const colors = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.note;
                          return (
                            <div key={activity.id} className="flex gap-3">
                              <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                <span className={`text-xs font-medium ${colors.text}`}>
                                  {activity.type.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-medium ${colors.text}`}>
                                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {timeAgo(activity.createdAt)}
                                  </span>
                                </div>
                                {activity.subject && (
                                  <p className="text-sm text-gray-900 truncate">{activity.subject}</p>
                                )}
                                {activity.body && (
                                  <p className="text-xs text-gray-500 line-clamp-2">{activity.body}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <div>
                  {contact.activities.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No activities yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contact.activities.map((activity) => {
                        const colors = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.note;
                        return (
                          <div key={activity.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                            <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                              <span className={`text-xs font-medium ${colors.text}`}>
                                {activity.type.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${colors.text}`}>
                                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {timeAgo(activity.createdAt)}
                                </span>
                              </div>
                              {activity.subject && (
                                <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                              )}
                              {activity.body && (
                                <p className="text-sm text-gray-600 mt-1">{activity.body}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Associations */}
        <div className="space-y-6">
          {/* Companies Card */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Companies</h3>
                <span className="text-xs text-gray-400">({contact.companies.length})</span>
              </div>
              <button
                onClick={() => setShowAssociateSearch(!showAssociateSearch)}
                className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Associate Search */}
            {showAssociateSearch && (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    value={associateSearch}
                    onChange={(e) => setAssociateSearch(e.target.value)}
                    placeholder="Search companies..."
                    className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                {companyResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded max-h-32 overflow-y-auto">
                    {companyResults.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => handleAssociate(company.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="font-medium">{company.name}</span>
                        {company.domain && (
                          <span className="text-gray-400 ml-1 text-xs">{company.domain}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-2">
              {contact.companies.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No companies associated</p>
              ) : (
                contact.companies.map((assoc) => (
                  <div
                    key={assoc.company.id}
                    className="flex items-center justify-between px-2 py-2 rounded hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-2">
                      {assoc.isPrimary && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{assoc.company.name}</p>
                        {assoc.company.domain && (
                          <p className="text-xs text-gray-400">{assoc.company.domain}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssociation(assoc.company.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deals Card */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Deals</h3>
                <span className="text-xs text-gray-400">({contact.deals.length})</span>
              </div>
            </div>
            <div className="p-2">
              {contact.deals.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No deals associated</p>
              ) : (
                contact.deals.map((assoc) => (
                  <div
                    key={assoc.deal.id}
                    className="px-2 py-2 rounded hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-900">{assoc.deal.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {assoc.deal.amount !== null && (
                        <span className="text-xs text-gray-500">
                          ${assoc.deal.amount.toLocaleString()}
                        </span>
                      )}
                      {assoc.deal.stage && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {assoc.deal.stage}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
