"use client";

import { forwardRef, memo, useMemo, useCallback, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Building2,
  Handshake,
  Mail,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  activeItemId?: string;
  onNavigate?: (item: NavItem) => void;
}

// =============================================================================
// CONSTANTS - Hoisted outside component (Vercel Best Practice 6.3)
// =============================================================================

const MAIN_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "contacts", label: "Contacts", icon: Users, href: "/contacts", badge: 12 },
  { id: "companies", label: "Companies", icon: Building2, href: "/companies" },
  { id: "deals", label: "Deals", icon: Handshake, href: "/deals", badge: 5 },
  { id: "marketing", label: "Marketing", icon: Mail, href: "/marketing" },
  { id: "reports", label: "Reports", icon: BarChart3, href: "/reports" },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  { id: "help", label: "Help", icon: HelpCircle, href: "/help" },
];

// =============================================================================
// CVA VARIANTS - Design System Tokens
// =============================================================================

/**
 * Sidebar container variants
 * @see docs/DESIGN_SYSTEM.md Section 9
 */
const sidebarVariants = cva(
  cn(
    // Base styles
    "flex flex-col h-screen",
    "bg-background border-r border-border",
    "transition-all duration-300 ease-in-out",
    // Dark mode support via CSS variables
    "dark:bg-background dark:border-border"
  ),
  {
    variants: {
      collapsed: {
        true: "w-[72px]",
        false: "w-[260px]",
      },
    },
    defaultVariants: {
      collapsed: false,
    },
  }
);

/**
 * Nav item variants with hover effects
 */
const navItemVariants = cva(
  cn(
    // Base styles
    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
    "text-sm font-medium text-muted-foreground",
    "cursor-pointer select-none",
    // Transition - only transform & opacity (Vercel Best Practice)
    "transition-all duration-150 ease-out",
    // Focus ring for accessibility
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-ring focus-visible:ring-offset-2",
    // Hover effect - subtle translateY (not scale to avoid layout shift)
    "hover:bg-accent hover:text-accent-foreground",
    "hover:translate-x-0.5"
  ),
  {
    variants: {
      active: {
        true: cn(
          "bg-primary/10 text-primary",
          "dark:bg-primary/20 dark:text-primary-foreground"
        ),
        false: "",
      },
      collapsed: {
        true: "justify-center px-0",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      collapsed: false,
    },
  }
);

/**
 * Badge variants
 */
const badgeVariants = cva(
  cn(
    "flex items-center justify-center",
    "min-w-[20px] h-5 px-1.5 rounded-full",
    "text-xs font-semibold",
    "bg-destructive text-destructive-foreground"
  ),
  {
    variants: {
      collapsed: {
        true: "absolute -top-1 -right-1 min-w-[16px] h-4 text-[10px]",
        false: "ml-auto",
      },
    },
    defaultVariants: {
      collapsed: false,
    },
  }
);

// =============================================================================
// SUB-COMPONENTS - Memoized (Vercel Best Practice 5.5)
// =============================================================================

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

/**
 * Memoized NavItem component
 * Prevents re-render when parent state changes
 */
const NavItemButton = memo(function NavItemButton({
  item,
  isActive,
  collapsed,
  onClick,
}: NavItemButtonProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={cn(navItemVariants({ active: isActive, collapsed }))}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
    >
      <span className="relative flex-shrink-0">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
        {item.badge && collapsed && (
          <span className={cn(badgeVariants({ collapsed: true }))}>
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge && (
            <span className={cn(badgeVariants({ collapsed: false }))}>
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
});

/**
 * Sidebar Header with Logo
 */
const SidebarHeader = memo(function SidebarHeader({
  collapsed,
}: {
  collapsed: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-16 px-4 border-b border-border",
        "transition-all duration-300"
      )}
    >
      {/* HubSpot-style Logo */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center",
            "w-8 h-8 rounded-lg",
            "bg-primary text-primary-foreground",
            "font-bold text-lg"
          )}
        >
          H
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground">HubSpot</span>
        )}
      </div>
    </div>
  );
});

/**
 * Search Box
 */
const SearchBox = memo(function SearchBox({
  collapsed,
}: {
  collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <button
        className={cn(
          "flex items-center justify-center",
          "w-10 h-10 mx-auto rounded-lg",
          "text-muted-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-colors duration-150 cursor-pointer"
        )}
        title="Search"
      >
        <Search className="h-5 w-5" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        "bg-muted/50 rounded-lg",
        "text-sm text-muted-foreground",
        "hover:bg-muted transition-colors duration-150",
        "cursor-pointer"
      )}
    >
      <Search className="h-4 w-4" strokeWidth={1.75} />
      <span>Search...</span>
      <kbd
        className={cn(
          "ml-auto hidden sm:inline-flex",
          "px-1.5 py-0.5 rounded",
          "bg-background border border-border",
          "text-[10px] font-medium"
        )}
      >
        ⌘K
      </kbd>
    </div>
  );
});

/**
 * Collapse Toggle Button
 */
const CollapseButton = memo(function CollapseButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute -right-3 top-20",
        "flex items-center justify-center",
        "w-6 h-6 rounded-full",
        "bg-background border border-border shadow-sm",
        "text-muted-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-all duration-150 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring"
      )}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );
});

/**
 * Notification Bell
 */
const NotificationBell = memo(function NotificationBell({
  collapsed,
  count = 0,
}: {
  collapsed: boolean;
  count?: number;
}) {
  return (
    <button
      className={cn(
        "relative flex items-center justify-center",
        collapsed ? "w-10 h-10 mx-auto" : "w-full px-3 py-2.5",
        "rounded-lg text-muted-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-150 cursor-pointer"
      )}
      title="Notifications"
    >
      <Bell className="h-5 w-5" strokeWidth={1.75} />
      {!collapsed && <span className="ml-3 text-sm font-medium">Notifications</span>}
      {count > 0 && (
        <span
          className={cn(
            collapsed
              ? "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-[10px]"
              : "ml-auto min-w-[20px] h-5 text-xs",
            "flex items-center justify-center px-1 rounded-full",
            "bg-destructive text-destructive-foreground font-semibold"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
});

// =============================================================================
// MAIN SIDEBAR COMPONENT
// =============================================================================

/**
 * HubSpot-style Sidebar Component
 *
 * Features:
 * - Collapsible with smooth animation
 * - Dark mode support via CSS variables
 * - Lucide icons with consistent sizing
 * - Accessible focus states
 * - Memoized sub-components for performance
 *
 * @see docs/DESIGN_SYSTEM.md
 * @see docs/REACT_BEST_PRACTICES.md
 */
const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      collapsed: controlledCollapsed,
      onCollapsedChange,
      activeItemId = "home",
      onNavigate,
    },
    ref
  ) => {
    // Internal state for uncontrolled mode
    const [internalCollapsed, setInternalCollapsed] = useState(false);

    // Determine if controlled or uncontrolled
    const isControlled = controlledCollapsed !== undefined;
    const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

    // Functional setState pattern (Vercel Best Practice 5.9)
    const handleToggleCollapse = useCallback(() => {
      if (isControlled) {
        onCollapsedChange?.(!collapsed);
      } else {
        setInternalCollapsed((prev) => !prev);
      }
    }, [isControlled, collapsed, onCollapsedChange]);

    // Stable callback for navigation (Vercel Best Practice 5.9)
    const handleNavigate = useCallback(
      (item: NavItem) => {
        onNavigate?.(item);
      },
      [onNavigate]
    );

    // Memoize nav item renderer to prevent unnecessary re-renders
    const renderNavItems = useMemo(
      () =>
        (items: NavItem[]) =>
          items.map((item) => (
            <NavItemButton
              key={item.id}
              item={item}
              isActive={item.id === activeItemId}
              collapsed={collapsed}
              onClick={() => handleNavigate(item)}
            />
          )),
      [activeItemId, collapsed, handleNavigate]
    );

    return (
      <aside
        ref={ref}
        className={cn(sidebarVariants({ collapsed }), "relative")}
      >
        {/* Header */}
        <SidebarHeader collapsed={collapsed} />

        {/* Collapse Toggle */}
        <CollapseButton collapsed={collapsed} onClick={handleToggleCollapse} />

        {/* Search */}
        <div className="p-4">
          <SearchBox collapsed={collapsed} />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="space-y-1">{renderNavItems(MAIN_NAV_ITEMS)}</div>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-border">
          {/* Notifications */}
          <div className="p-3">
            <NotificationBell collapsed={collapsed} count={3} />
          </div>

          {/* Bottom Nav */}
          <div className="px-3 pb-4 space-y-1">
            {renderNavItems(BOTTOM_NAV_ITEMS)}
          </div>
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";

export { Sidebar, type SidebarProps, type NavItem };
