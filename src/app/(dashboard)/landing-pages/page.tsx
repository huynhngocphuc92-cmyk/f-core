import Link from "next/link";
import {
  Plus,
  Search,
  Layout,
  Eye,
  MousePointerClick,
  Globe,
} from "lucide-react";
import { getLandingPages, getLandingPageStats } from "@/app/actions/landing-pages";
import { FilterSelect } from "@/components/crm/FilterSelect";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  published: { label: "Published", color: "bg-green-50 text-green-700" },
  archived: { label: "Archived", color: "bg-red-50 text-red-700" },
};

export default async function LandingPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [pages, stats] = await Promise.all([
    getLandingPages({ search: params.search, status: params.status }),
    getLandingPageStats(),
  ]);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your marketing landing pages
          </p>
        </div>
        <Link
          href="/landing-pages/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Page
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Pages</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.published}</p>
              <p className="text-xs text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.draft}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalViews.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Views</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <MousePointerClick className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalConversions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Conversions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            type="text"
            defaultValue={params.search || ""}
            placeholder="Search landing pages..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <FilterSelect
          name="status"
          defaultValue={params.status || "all"}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
      </form>

      {/* Landing Pages List */}
      {pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No landing pages yet</p>
          <p className="text-sm text-gray-400">
            Create your first landing page to start converting visitors
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => {
            const st = statusConfig[page.status] || statusConfig.draft;
            const conversionRate =
              page.viewCount > 0
                ? ((page.conversionCount / page.viewCount) * 100).toFixed(1)
                : "0.0";
            return (
              <Link
                key={page.id}
                href={`/landing-pages/${page.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-[#0891b2]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {page.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${st.color}`}
                  >
                    {st.label}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  <Globe className="w-3 h-3 inline mr-1" />
                  /p/{page.slug}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 mt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {page.viewCount.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" />
                    {page.conversionCount.toLocaleString()} conversions
                  </span>
                  <span className="ml-auto text-gray-500 font-medium">
                    {conversionRate}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
