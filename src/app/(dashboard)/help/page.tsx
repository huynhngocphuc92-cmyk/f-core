import {
  BookOpen,
  MessageCircle,
  FileText,
  Video,
  ExternalLink,
  Search,
  Zap,
  Users,
  CircleDollarSign,
  BarChart3,
  Mail,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

const quickStartGuides = [
  {
    title: "Getting Started with Contacts",
    desc: "Learn how to create, import, and manage your contacts",
    icon: Users,
    href: "/contacts",
  },
  {
    title: "Managing Your Deals Pipeline",
    desc: "Set up deal stages and track your sales pipeline",
    icon: CircleDollarSign,
    href: "/deals",
  },
  {
    title: "Creating Reports & Dashboards",
    desc: "Build custom reports to visualize your data",
    icon: BarChart3,
    href: "/reports",
  },
  {
    title: "Building Forms",
    desc: "Create forms to capture leads from your website",
    icon: FileText,
    href: "/forms",
  },
];

const faqItems = [
  {
    q: "How do I import contacts?",
    a: "Navigate to Contacts, click 'Create contact', and fill in the contact details. Bulk import via CSV is coming soon.",
  },
  {
    q: "How do I customize deal stages?",
    a: "Deal stages are managed through your pipeline settings. Contact your administrator to add or modify stages.",
  },
  {
    q: "Can I export my data?",
    a: "Yes, most list views have an Export button that lets you download your data as CSV.",
  },
  {
    q: "How do I assign contacts to team members?",
    a: "Open a contact's detail page and use the Owner field to assign them to a team member.",
  },
  {
    q: "How do I create a custom report?",
    a: "Go to Reports, click 'Create report', select your data source, and configure the filters and visualization.",
  },
];

export default function HelpPage() {
  return (
    <div className="p-6 pt-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-600 mt-1">
          Find answers, guides, and support resources
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for help articles..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0891b2] shadow-sm"
        />
      </div>

      <div className="space-y-8">
        {/* Quick Start Guides */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Start Guides
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickStartGuides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#0891b2]/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0891b2]/10 flex items-center justify-center flex-shrink-0">
                  <guide.icon className="w-5 h-5 text-[#0891b2]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-[#0891b2] transition-colors">
                    {guide.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{guide.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {faqItems.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                  <span className="text-sm font-medium text-gray-900">
                    {item.q}
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Support Resources */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Support Resources
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <BookOpen className="w-8 h-8 text-[#0891b2] mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Documentation
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Browse our comprehensive docs
              </p>
              <button className="text-sm text-[#0891b2] font-medium hover:underline inline-flex items-center gap-1">
                View docs
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Video className="w-8 h-8 text-[#0891b2] mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Video Tutorials
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Watch step-by-step guides
              </p>
              <button className="text-sm text-[#0891b2] font-medium hover:underline inline-flex items-center gap-1">
                Watch now
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Mail className="w-8 h-8 text-[#0891b2] mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Contact Support
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Get help from our team
              </p>
              <button className="text-sm text-[#0891b2] font-medium hover:underline inline-flex items-center gap-1">
                Email us
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { keys: "⌘ K", action: "Open search" },
              { keys: "⌘ N", action: "Create new record" },
              { keys: "Esc", action: "Close modal / go back" },
              { keys: "⌘ /", action: "Toggle sidebar" },
            ].map((shortcut) => (
              <div
                key={shortcut.keys}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-gray-600">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
