import { Building2, Plus, Filter, Download, MoreHorizontal, Globe } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import SearchInput from "@/components/crm/SearchInput";
import { Prisma } from "@prisma/client";
import { getServerI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

async function getCompanies(search?: string) {
  const where: Prisma.CompanyWhereInput = { deletedAt: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.company.findMany({
    where,
    include: {
      owner: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { t } = await getServerI18n();
  const { search } = await searchParams;
  const companies = await getCompanies(search);

  const typeLabelByValue: Record<string, string> = {
    partner: t("dashboard.companies.types.partner", "Partner"),
    prospect: t("dashboard.companies.types.prospect", "Prospect"),
    reseller: t("dashboard.companies.types.reseller", "Reseller"),
    vendor: t("dashboard.companies.types.vendor", "Vendor"),
  };

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.companies.title", "Companies")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("dashboard.companies.countLabel", "{count} companies", {
              count: companies.length,
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            {t("dashboard.companies.export", "Export")}
          </button>
          <Link
            href="/companies/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("dashboard.companies.createCompany", "Create company")}
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-6">
        <SearchInput
          placeholder={t(
            "dashboard.companies.searchPlaceholder",
            "Search companies..."
          )}
        />
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          {t("dashboard.companies.filters", "Filters")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("dashboard.companies.table.name", "Name")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("dashboard.companies.table.domain", "Domain")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("dashboard.companies.table.industry", "Industry")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("dashboard.companies.table.type", "Type")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("dashboard.companies.table.size", "Size")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("dashboard.companies.table.owner", "Owner")}
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
                    className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/companies/${company.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0891b2] flex items-center justify-center text-white font-medium text-sm">
                      {company.name?.charAt(0) || "?"}
                    </div>
                    <span className="font-medium text-gray-900 hover:text-[#0891b2]">
                      {company.name}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {company.domain ? (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3 text-gray-400" />
                      {company.domain}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {company.industry || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      company.type === "partner"
                        ? "bg-green-50 text-green-700"
                        : company.type === "prospect"
                        ? "bg-blue-50 text-blue-700"
                        : company.type === "reseller"
                        ? "bg-purple-50 text-purple-700"
                        : company.type === "vendor"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {typeLabelByValue[company.type || ""] ||
                      t("dashboard.companies.types.other", "Other")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {company.size || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {company.owner?.name || "-"}
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {companies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search
                ? t("dashboard.companies.empty.noMatch", 'No companies matching "{search}"', {
                    search,
                  })
                : t("dashboard.companies.empty.noCompanies", "No companies found")}
            </p>
            {!search && (
              <Link
                href="/companies/new"
                className="inline-flex items-center gap-2 mt-4 text-[#0891b2] hover:text-[#0ea5e9]"
              >
                <Plus className="w-4 h-4" />
                {t("dashboard.companies.empty.createFirst", "Create your first company")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
