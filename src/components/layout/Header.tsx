"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Search } from "lucide-react";

const navigation = [
  {
    name: "Products",
    href: "#",
    children: [
      { name: "Marketing Hub", href: "#", description: "Marketing automation software" },
      { name: "Sales Hub", href: "#", description: "Sales CRM software" },
      { name: "Service Hub", href: "#", description: "Customer service software" },
      { name: "CMS Hub", href: "#", description: "Content management software" },
      { name: "Operations Hub", href: "#", description: "Operations software" },
      { name: "Commerce Hub", href: "#", description: "B2B commerce software" },
    ],
  },
  {
    name: "Solutions",
    href: "#",
    children: [
      { name: "By Team", href: "#", description: "Solutions for every team" },
      { name: "By Industry", href: "#", description: "Industry-specific solutions" },
      { name: "By Business Size", href: "#", description: "Solutions that scale" },
    ],
  },
  { name: "Pricing", href: "#" },
  {
    name: "Resources",
    href: "#",
    children: [
      { name: "Blog", href: "#", description: "Marketing, sales, and service tips" },
      { name: "Academy", href: "#", description: "Free online training" },
      { name: "Community", href: "#", description: "Connect with other users" },
      { name: "Developer Docs", href: "#", description: "API documentation" },
    ],
  },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-[#0891b2]"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">F-CORE</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {item.name}
                  {item.children && <ChevronDown className="h-4 w-4" />}
                </Link>

                {/* Dropdown */}
                {item.children && activeDropdown === item.name && (
                  <div className="absolute left-0 top-full mt-1 w-72 rounded-lg bg-white shadow-lg ring-1 ring-black/5 p-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block rounded-md px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {child.name}
                        </div>
                        <div className="text-sm text-gray-500">{child.description}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button className="hidden lg:flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            {/* CTA Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="#"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Get a demo
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-4 py-2 text-sm font-medium text-white hover:bg-[#0ea5e9] transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    {item.name}
                  </Link>
                  {item.children && (
                    <div className="pl-6 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 px-4">
              <Link
                href="#"
                className="block text-center py-2 text-sm font-medium text-gray-700"
              >
                Get a demo
              </Link>
              <Link
                href="#"
                className="block text-center rounded-md bg-[#ff7a59] px-4 py-2 text-sm font-medium text-white"
              >
                Get started free
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
