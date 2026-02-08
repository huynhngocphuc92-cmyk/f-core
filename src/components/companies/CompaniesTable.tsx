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
  Building2,
  Globe,
  Phone,
} from "lucide-react";
import { CompanyForm } from "./CompanyForm";

// Types
type Company = {
  id: string;
  name: string;
  domain: string | null;
  phone: string | null;
  industry: string | null;
  type: string | null;
  size: string | null;
  city: string | null;
  country: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  _count: { contacts: number; deals: number };
  createdAt: string;
};

type SortField = "name" | "industry" | "city" | "createdAt";
type SortOrder = "asc" | "desc";

const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "software", label: "Software" },
  { value: "consulting", label: "Consulting" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

const COMPANY_TYPES = [
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
  { value: "reseller", label: "Reseller" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
];

export function CompaniesTable() {
  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
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

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedIndustry && { industry: selectedIndustry }),
        ...(selectedType && { type: selectedType }),
      });

      const response = await fetch(`/api/companies?${params}`);
      if (!response.ok) throw new Error("Failed to fetch companies");

      const data = await response.json();

      // Client-side sorting
      let sortedCompanies = data.data;
      if (sortField) {
        sortedCompanies = [...sortedCompanies].sort((a: Company, b: Company) => {
          let aVal: string | null = a[sortField];
          let bVal: string | null = b[sortField];

          if (aVal === null) return 1;
          if (bVal === null) return -1;

          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();

          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
      }

      setCompanies(sortedCompanies);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedIndustry, selectedType, sortField, sortOrder]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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
    if (selectedIds.size === companies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(companies.map((c) => c.id)));
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

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} companies?`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/companies/${id}`, { method: "DELETE" })
        )
      );
      setSelectedIds(new Set());
      fetchCompanies();
    } catch {
      alert("Failed to delete companies");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      await fetch(`/api/companies/${id}`, { method: "DELETE" });
      fetchCompanies();
    } catch {
      alert("Failed to delete company");
    }
  };

  const handleExport = () => {
    const exportData = selectedIds.size > 0
      ? companies.filter((c) => selectedIds.has(c.id))
      : companies;

    const headers = ["Name", "Domain", "Phone", "Industry", "Type", "City", "Country", "Contacts", "Deals"];
    const rows = exportData.map((c) => [
      c.name,
      c.domain || "",
      c.phone || "",
      c.industry || "",
      c.type || "",
      c.city || "",
      c.country || "",
      c._count.contacts.toString(),
      c._count.deals.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companies-${new Date().toISOString()}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("");
    setSelectedType("");
    setPage(1);
  };

  const activeFilterCount = [selectedIndustry, selectedType].filter(Boolean).length;

  // Render sorting icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  // Industry badge color
  const getIndustryColor = (industry: string | null) => {
    const colorMap: Record<string, string> = {
      technology: "bg-blue-50 text-blue-700",
      software: "bg-indigo-50 text-indigo-700",
      consulting: "bg-purple-50 text-purple-700",
      marketing: "bg-pink-50 text-pink-700",
      finance: "bg-green-50 text-green-700",
      healthcare: "bg-red-50 text-red-700",
      education: "bg-yellow-50 text-yellow-700",
      manufacturing: "bg-orange-50 text-orange-700",
      retail: "bg-teal-50 text-teal-700",
      real_estate: "bg-cyan-50 text-cyan-700",
    };
    return colorMap[industry || ""] || "bg-gray-50 text-gray-700";
  };

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">
            {total} compan{total !== 1 ? "ies" : "y"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={companies.length === 0}
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
            Create company
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {selectedIds.size} compan{selectedIds.size !== 1 ? "ies" : "y"} selected
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
            placeholder="Search companies..."
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
        {(searchQuery || selectedIndustry || selectedType) && (
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
            {/* Industry Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => {
                  setSelectedIndustry(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="">All industries</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.value} value={ind.value}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="">All types</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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
            <p className="text-gray-500">Loading companies...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchCompanies}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No companies found</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Create your first company
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
                        checked={selectedIds.size === companies.length && companies.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Name
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th
                      onClick={() => handleSort("city")}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Location
                        <SortIcon field="city" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("industry")}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Industry
                        <SortIcon field="industry" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deals
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
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(company.id)}
                          onChange={() => handleSelectOne(company.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/companies/${company.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 hover:text-primary block">
                              {company.name}
                            </span>
                            {company.domain && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {company.domain}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {company.phone}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {[company.city, company.country].filter(Boolean).join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {company.industry ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getIndustryColor(
                              company.industry
                            )}`}
                          >
                            {INDUSTRIES.find((i) => i.value === company.industry)?.label || company.industry}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company._count.contacts}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company._count.deals}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company.owner?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group">
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <Link
                              href={`/companies/${company.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              View details
                            </Link>
                            <button
                              onClick={() => handleDelete(company.id, company.name)}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
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
                  {Math.min(page * limit, total)} of {total} companies
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

      {/* Create Company Form */}
      <CompanyForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          fetchCompanies();
        }}
      />
    </div>
  );
}
