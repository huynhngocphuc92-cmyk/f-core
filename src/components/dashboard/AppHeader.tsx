"use client";

import { Bell, Search, Plus, ChevronDown } from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
  sidebarCollapsed?: boolean;
}

export default function AppHeader({ sidebarCollapsed = false }: AppHeaderProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const createOptions = [
    { name: "Contact", href: "/contacts/new" },
    { name: "Company", href: "/companies/new" },
    { name: "Deal", href: "/deals/new" },
    { name: "Task", href: "/tasks/new" },
    { name: "Note", href: "/notes/new" },
  ];

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? "left-16" : "left-64"
      }`}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts, companies, deals..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] focus:bg-white transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Create Button */}
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="flex items-center gap-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create
              <ChevronDown className="w-4 h-4" />
            </button>

            {showCreateMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowCreateMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {createOptions.map((option) => (
                    <a
                      key={option.name}
                      href={option.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowCreateMenu(false)}
                    >
                      {option.name}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Avatar */}
          <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#0891b2] flex items-center justify-center text-white font-medium text-sm">
              A
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
