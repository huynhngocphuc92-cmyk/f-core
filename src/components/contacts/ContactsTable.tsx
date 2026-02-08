"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
} from "lucide-react";
import { ContactForm } from "./ContactForm";

// Types
type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  lifecycleStage: string | null;
  leadStatus: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  companies: Array<{
    company: { id: string; name: string; domain: string | null };
    isPrimary: boolean;
  }>;
  createdAt: string;
};

type SortField = "firstName" | "email" | "lifecycleStage" | "createdAt";
type SortOrder = "asc" | "desc";

const LIFECYCLE_STAGES = [
  { value: "subscriber", label: "Subscriber", color: "gray" },
  { value: "lead", label: "Lead", color: "blue" },
  { value: "mql", label: "MQL", color: "purple" },
  { value: "sql", label: "SQL", color: "orange" },
  { value: "opportunity", label: "Opportunity", color: "yellow" },
  { value: "customer", label: "Customer", color: "green" },
  { value: "evangelist", label: "Evangelist", color: "pink" },
];

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "blue" },
  { value: "open", label: "Open", color: "green" },
  { value: "in_progress", label: "In Progress", color: "yellow" },
  { value: "open_deal", label: "Open Deal", color: "purple" },
  { value: "unqualified", label: "Unqualified", color: "gray" },
  { value: "attempted_to_contact", label: "Attempted", color: "orange" },
  { value: "connected", label: "Connected", color: "teal" },
  { value: "bad_timing", label: "Bad Timing", color: "red" },
];

export function ContactsTable() {
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLifecycleStage, setSelectedLifecycleStage] = useState<string>("");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedLifecycleStage && { lifecycleStage: selectedLifecycleStage }),
        ...(selectedLeadStatus && { leadStatus: selectedLeadStatus }),
      });

      const response = await fetch(`/api/contacts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch contacts");

      const data = await response.json();

      // Client-side sorting (since API doesn't support it yet)
      let sortedContacts = data.data;
      if (sortField) {
        sortedContacts = [...sortedContacts].sort((a: Contact, b: Contact) => {
          let aVal: string | null = a[sortField];
          let bVal: string | null = b[sortField];

          // Handle null values
          if (aVal === null) return 1;
          if (bVal === null) return -1;

          // String comparison
          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();

          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
      }

      setContacts(sortedContacts);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedLifecycleStage, selectedLeadStatus, sortField, sortOrder]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [openMenuId]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      fetchContacts();
    } catch {
      alert("Failed to delete contact");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} contacts?`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/contacts/${id}`, { method: "DELETE" })
        )
      );
      setSelectedIds(new Set());
      fetchContacts();
    } catch {
      alert("Failed to delete contacts");
    }
  };

  const handleExport = () => {
    const exportData = selectedIds.size > 0
      ? contacts.filter((c) => selectedIds.has(c.id))
      : contacts;

    const headers = ["First Name", "Last Name", "Email", "Phone", "Company", "Lifecycle Stage", "Lead Status"];
    const rows = exportData.map((c) => [
      c.firstName || "",
      c.lastName || "",
      c.email || "",
      c.phone || "",
      c.companies?.[0]?.company?.name || "",
      c.lifecycleStage || "",
      c.leadStatus || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString()}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLifecycleStage("");
    setSelectedLeadStatus("");
    setPage(1);
  };

  const activeFilterCount = [selectedLifecycleStage, selectedLeadStatus].filter(Boolean).length;

  // Render sorting icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  // Lifecycle stage badge color
  const getLifecycleColor = (stage: string | null) => {
    const stageConfig = LIFECYCLE_STAGES.find((s) => s.value === stage);
    const color = stageConfig?.color || "gray";

    const colorMap: Record<string, string> = {
      gray: "bg-gray-50 text-gray-700",
      blue: "bg-blue-50 text-blue-700",
      purple: "bg-purple-50 text-purple-700",
      orange: "bg-orange-50 text-orange-700",
      yellow: "bg-yellow-50 text-yellow-700",
      green: "bg-green-50 text-green-700",
      pink: "bg-pink-50 text-pink-700",
    };

    return colorMap[color] || colorMap.gray;
  };

  // Lead status badge color
  const getLeadStatusColor = (status: string | null) => {
    const statusConfig = LEAD_STATUSES.find((s) => s.value === status);
    const color = statusConfig?.color || "gray";

    const colorMap: Record<string, string> = {
      blue: "bg-blue-50 text-blue-700",
      green: "bg-green-50 text-green-700",
      yellow: "bg-yellow-50 text-yellow-700",
      purple: "bg-purple-50 text-purple-700",
      gray: "bg-gray-50 text-gray-700",
      orange: "bg-orange-50 text-orange-700",
      teal: "bg-teal-50 text-teal-700",
      red: "bg-red-50 text-red-700",
    };

    return colorMap[color] || colorMap.gray;
  };

  const getContactName = (contact: Contact) => {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    return name || contact.email || "Unknown";
  };

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            {total} contact{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create contact
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {selectedIds.size} contact{selectedIds.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-700 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-blue-700 hover:bg-blue-100 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters || activeFilterCount > 0
              ? "bg-primary text-white border-primary"
              : "text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">{activeFilterCount}</span>
          )}
        </button>

        {/* Clear Filters */}
        {(searchQuery || selectedLifecycleStage || selectedLeadStatus) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lifecycle Stage Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lifecycle Stage
              </label>
              <select
                value={selectedLifecycleStage}
                onChange={(e) => {
                  setSelectedLifecycleStage(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="">All stages</option>
                {LIFECYCLE_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Status
              </label>
              <select
                value={selectedLeadStatus}
                onChange={(e) => {
                  setSelectedLeadStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="">All statuses</option>
                {LEAD_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading contacts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchContacts}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Create your first contact
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === contacts.length && contacts.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th
                      onClick={() => handleSort("firstName")}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Name
                        <SortIcon field="firstName" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("email")}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Email
                        <SortIcon field="email" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th
                      onClick={() => handleSort("lifecycleStage")}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Lifecycle
                        <SortIcon field="lifecycleStage" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th
                      onClick={() => handleSort("createdAt")}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Created
                        <SortIcon field="createdAt" />
                      </div>
                    </th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contact.id)}
                          onChange={() => handleSelectOne(contact.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                            {contact.firstName?.charAt(0) || "?"}
                            {contact.lastName?.charAt(0) || ""}
                          </div>
                          <span className="font-medium text-gray-900 hover:text-primary">
                            {getContactName(contact)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {contact.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {contact.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {contact.companies?.[0]?.company?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLifecycleColor(
                            contact.lifecycleStage
                          )}`}
                        >
                          {LIFECYCLE_STAGES.find((s) => s.value === contact.lifecycleStage)?.label || contact.lifecycleStage || "subscriber"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {contact.leadStatus ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLeadStatusColor(
                              contact.leadStatus
                            )}`}
                          >
                            {LEAD_STATUSES.find((s) => s.value === contact.leadStatus)?.label || contact.leadStatus}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {contact.owner?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === contact.id ? null : contact.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === contact.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <Link
                                href={`/contacts/${contact.id}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                View details
                              </Link>
                              <button
                                onClick={() => handleDelete(contact.id, getContactName(contact))}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} contacts
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Contact Form */}
      <ContactForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          fetchContacts();
        }}
      />
    </div>
  );
}
