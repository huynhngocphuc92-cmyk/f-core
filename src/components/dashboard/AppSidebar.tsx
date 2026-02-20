"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  CircleDollarSign,
  Send,
  Calendar,
  CalendarCheck,
  Ticket,
  Mail,
  Zap,
  BarChart3,
  FileText,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Plus,
  ListOrdered,
  Receipt,
  Layout,
  MessageCircle,
  Inbox,
  Shield,
  Route,
  Smile,
  LineChart,
  TrendingUp,
  ClipboardCheck,
  PhoneCall,
  BrainCircuit,
  CreditCard,
  RefreshCw,
  BellRing,
  ChartNoAxesCombined,
  Megaphone,
  CalendarClock,
  Target,
  Map,
  FlaskConical,
  PieChart,
  PenSquare,
  WandSparkles,
  Database,
  Blocks,
  Bot,
  Gauge,
  type LucideIcon,
} from "lucide-react";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

type NavigationItem = {
  key: string;
  fallback: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  { key: "sidebar.navigation.dashboard", fallback: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "sidebar.navigation.contacts", fallback: "Contacts", href: "/contacts", icon: Users },
  { key: "sidebar.navigation.companies", fallback: "Companies", href: "/companies", icon: Building2 },
  { key: "sidebar.navigation.deals", fallback: "Deals", href: "/deals", icon: CircleDollarSign },
  { key: "sidebar.navigation.salesForecast", fallback: "Sales Forecast", href: "/sales/forecast", icon: TrendingUp },
  {
    key: "sidebar.navigation.salesPlaybooks",
    fallback: "Sales Playbooks",
    href: "/sales/playbooks",
    icon: ClipboardCheck,
  },
  {
    key: "sidebar.navigation.documentTracking",
    fallback: "Document Tracking",
    href: "/sales/documents",
    icon: FileText,
  },
  {
    key: "sidebar.navigation.callIntelligence",
    fallback: "Call Intelligence",
    href: "/sales/calls",
    icon: PhoneCall,
  },
  {
    key: "sidebar.navigation.salesCoaching",
    fallback: "Sales Coaching",
    href: "/sales/coaching",
    icon: BrainCircuit,
  },
  { key: "sidebar.navigation.payments", fallback: "Payments", href: "/commerce/payments", icon: CreditCard },
  { key: "sidebar.navigation.invoices", fallback: "Invoices", href: "/commerce/invoices", icon: Receipt },
  {
    key: "sidebar.navigation.subscriptions",
    fallback: "Subscriptions",
    href: "/commerce/subscriptions",
    icon: RefreshCw,
  },
  { key: "sidebar.navigation.dunning", fallback: "Dunning", href: "/commerce/dunning", icon: BellRing },
  { key: "sidebar.navigation.revenue", fallback: "Revenue", href: "/commerce/revenue", icon: ChartNoAxesCombined },
  { key: "sidebar.navigation.emails", fallback: "Emails", href: "/emails", icon: Send },
  { key: "sidebar.navigation.meetings", fallback: "Meetings", href: "/meetings", icon: Calendar },
  { key: "sidebar.navigation.tickets", fallback: "Tickets", href: "/tickets", icon: Ticket },
  { key: "sidebar.navigation.marketing", fallback: "Marketing", href: "/email-marketing", icon: Mail },
  {
    key: "sidebar.navigation.adsConnectors",
    fallback: "Ads Connectors",
    href: "/marketing/ads",
    icon: Megaphone,
  },
  {
    key: "sidebar.navigation.socialScheduler",
    fallback: "Social Scheduler",
    href: "/marketing/social",
    icon: CalendarClock,
  },
  {
    key: "sidebar.navigation.attributionModels",
    fallback: "Attribution Models",
    href: "/marketing/attribution",
    icon: Target,
  },
  {
    key: "sidebar.navigation.journeyTimeline",
    fallback: "Journey Timeline",
    href: "/marketing/journey",
    icon: Map,
  },
  {
    key: "sidebar.navigation.abTesting",
    fallback: "A/B Testing",
    href: "/marketing/experiments",
    icon: FlaskConical,
  },
  {
    key: "sidebar.navigation.marketingAnalytics",
    fallback: "Marketing Analytics",
    href: "/marketing/analytics",
    icon: PieChart,
  },
  { key: "sidebar.navigation.contentBlog", fallback: "Content Blog", href: "/content/blog", icon: PenSquare },
  {
    key: "sidebar.navigation.seoRecommendations",
    fallback: "SEO Recommendations",
    href: "/content/seo",
    icon: Search,
  },
  {
    key: "sidebar.navigation.contentApprovals",
    fallback: "Content Approvals",
    href: "/content/approvals",
    icon: Shield,
  },
  {
    key: "sidebar.navigation.contentRemix",
    fallback: "Content Remix",
    href: "/content/remix",
    icon: WandSparkles,
  },
  {
    key: "sidebar.navigation.contentPerformance",
    fallback: "Content Performance",
    href: "/content/performance",
    icon: BarChart3,
  },
  { key: "sidebar.navigation.pageBuilder", fallback: "Page Builder", href: "/content/pages", icon: Blocks },
  { key: "sidebar.navigation.dataSync", fallback: "Data Sync", href: "/data/sync", icon: Database },
  { key: "sidebar.navigation.dataMappings", fallback: "Data Mappings", href: "/data/mappings", icon: Database },
  { key: "sidebar.navigation.dataQuality", fallback: "Data Quality", href: "/data/quality", icon: Shield },
  { key: "sidebar.navigation.dataLineage", fallback: "Data Lineage", href: "/data/lineage", icon: Database },
  {
    key: "sidebar.navigation.apiPerformance",
    fallback: "API Performance",
    href: "/qa/performance",
    icon: Gauge,
  },
  {
    key: "sidebar.navigation.frontendPerformance",
    fallback: "Frontend Performance",
    href: "/qa/frontend-performance",
    icon: Gauge,
  },
  {
    key: "sidebar.navigation.releaseReadiness",
    fallback: "Release Readiness",
    href: "/qa/release-readiness",
    icon: Shield,
  },
  { key: "sidebar.navigation.workflows", fallback: "Workflows", href: "/workflows", icon: Zap },
  {
    key: "sidebar.navigation.workflowRuntime",
    fallback: "Workflow Runtime",
    href: "/workflows/runtime",
    icon: RefreshCw,
  },
  { key: "sidebar.navigation.sequences", fallback: "Sequences", href: "/sequences", icon: ListOrdered },
  { key: "sidebar.navigation.quotes", fallback: "Quotes", href: "/quotes", icon: Receipt },
  { key: "sidebar.navigation.landingPages", fallback: "Landing Pages", href: "/landing-pages", icon: Layout },
  { key: "sidebar.navigation.chat", fallback: "Chat", href: "/chat", icon: MessageCircle },
  { key: "sidebar.navigation.serviceInbox", fallback: "Service Inbox", href: "/service/inbox", icon: Inbox },
  { key: "sidebar.navigation.slaMonitor", fallback: "SLA Monitor", href: "/service/sla", icon: Shield },
  { key: "sidebar.navigation.routingRules", fallback: "Routing Rules", href: "/service/routing", icon: Route },
  { key: "sidebar.navigation.csatNps", fallback: "CSAT & NPS", href: "/service/surveys", icon: Smile },
  {
    key: "sidebar.navigation.serviceAnalytics",
    fallback: "Service Analytics",
    href: "/service/analytics",
    icon: LineChart,
  },
  { key: "sidebar.navigation.tasks", fallback: "Tasks", href: "/tasks", icon: CalendarCheck },
  { key: "sidebar.navigation.forms", fallback: "Forms", href: "/forms", icon: FileText },
  {
    key: "sidebar.navigation.knowledgeBase",
    fallback: "Knowledge Base",
    href: "/knowledge-base",
    icon: BookOpen,
  },
  { key: "sidebar.navigation.reports", fallback: "Reports", href: "/reports", icon: BarChart3 },
  { key: "sidebar.navigation.aiCopilot", fallback: "AI Copilot", href: "/ai-assistant", icon: Bot },
  {
    key: "sidebar.navigation.aiOrchestration",
    fallback: "AI Orchestration",
    href: "/ai-assistant/orchestration",
    icon: Bot,
  },
  {
    key: "sidebar.navigation.aiPromptGovernance",
    fallback: "AI Prompt Governance",
    href: "/ai-assistant/prompts",
    icon: Bot,
  },
  {
    key: "sidebar.navigation.aiEvalHarness",
    fallback: "AI Eval Harness",
    href: "/ai-assistant/evals",
    icon: Bot,
  },
  {
    key: "sidebar.navigation.aiSalesAgent",
    fallback: "AI Sales Agent",
    href: "/ai-assistant/agents/sales",
    icon: Bot,
  },
  {
    key: "sidebar.navigation.aiServiceAgent",
    fallback: "AI Service Agent",
    href: "/ai-assistant/agents/service",
    icon: Bot,
  },
  {
    key: "sidebar.navigation.aiKnowledgeAgent",
    fallback: "AI Knowledge Agent",
    href: "/ai-assistant/agents/knowledge",
    icon: Bot,
  },
  {
    key: "sidebar.navigation.aiProspectingAgent",
    fallback: "AI Prospecting Agent",
    href: "/ai-assistant/agents/prospecting",
    icon: Bot,
  },
];

const bottomNavigation: NavigationItem[] = [
  { key: "sidebar.bottom.settings", fallback: "Settings", href: "/settings", icon: Settings },
  { key: "sidebar.bottom.help", fallback: "Help", href: "/help", icon: HelpCircle },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useI18n();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-gray-900 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0891b2] flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-white font-semibold text-lg">{t("common.appName", "F-CORE")}</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-[#0891b2] flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">F</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="px-3 py-4">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0891b2] text-white font-medium hover:bg-[#0ea5e9] transition-colors">
              <Plus className="w-4 h-4" />
              {t("common.create", "Create")}
            </button>
          </div>
        )}

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("common.searchPlaceholder", "Search...")}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#0891b2]"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const label = t(item.key, item.fallback);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#0891b2] text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-3 py-2 border-t border-gray-800">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            const label = t(item.key, item.fallback);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Language */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-gray-800">
            <LanguageSwitcher variant="dark" />
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="px-3 py-3 border-t border-gray-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label={t("common.collapse", "Collapse")}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">{t("common.collapse", "Collapse")}</span>
              </>
            )}
          </button>
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-gray-800">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#0891b2] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
              A
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {t("sidebar.user.adminUser", "Admin User")}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {t("sidebar.user.adminEmail", "admin@f-core.com")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
