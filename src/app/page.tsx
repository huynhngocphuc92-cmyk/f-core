"use client";

import { useState, useCallback } from "react";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";

/**
 * F-CORE - CRM Platform
 * Demonstrates the Sidebar component with Dark Mode toggle
 */
export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("home");
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newValue;
    });
  }, []);

  const handleNavigate = useCallback((item: NavItem) => {
    setActiveItem(item.id);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        activeItemId={activeItem}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                F-CORE
              </h1>
              <p className="text-muted-foreground mt-1">
                Sidebar built with Tailwind Design System & Vercel Best Practices
              </p>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors duration-150 cursor-pointer"
            >
              {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-card-foreground mb-3">
                Design System Features
              </h2>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  CSS Variables for theming
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  CVA for component variants
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Semantic color tokens
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Dark mode support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Lucide icons (consistent 24x24)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Subtle hover effects
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-card-foreground mb-3">
                React Best Practices
              </h2>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Memoized sub-components
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Functional setState
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Hoisted static constants
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Stable callbacks with useCallback
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  forwardRef for composition
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Accessible focus states
                </li>
              </ul>
            </div>
          </div>

          {/* Current State */}
          <div className="p-6 rounded-xl bg-muted/50 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Current State
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Sidebar:</span>
                <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                  {collapsed ? "Collapsed" : "Expanded"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Active Page:</span>
                <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium capitalize">
                  {activeItem}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Theme:</span>
                <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                  {isDark ? "Dark" : "Light"}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 rounded-xl border border-dashed border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Try it out!
            </h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>👆 Click sidebar items to navigate</li>
              <li>◀️ Click the arrow button to collapse/expand sidebar</li>
              <li>🌙 Click "Dark Mode" button to toggle theme</li>
              <li>⌨️ Use Tab to navigate with keyboard</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
