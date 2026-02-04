"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1",
            "animate-in fade-in slide-in-from-top-2 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => {
            const commonClasses = cn(
              "w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors",
              item.destructive
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50",
              item.disabled && "opacity-50 cursor-not-allowed"
            );

            if (item.href) {
              return (
                <a
                  key={item.value}
                  href={item.href}
                  className={commonClasses}
                  onClick={() => {
                    if (!item.disabled) {
                      setIsOpen(false);
                      item.onClick?.();
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </a>
              );
            }

            return (
              <button
                key={item.value}
                className={commonClasses}
                onClick={() => {
                  if (!item.disabled) {
                    setIsOpen(false);
                    item.onClick?.();
                  }
                }}
                disabled={item.disabled}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple dropdown button with chevron
interface DropdownButtonProps {
  children: React.ReactNode;
  items: DropdownItem[];
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}

export function DropdownButton({
  children,
  items,
  variant = "secondary",
  className,
}: DropdownButtonProps) {
  const variantStyles = {
    primary: "bg-[#0891b2] text-white hover:bg-[#0ea5e9]",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
  };

  return (
    <Dropdown
      items={items}
      trigger={
        <button
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            variantStyles[variant],
            className
          )}
        >
          {children}
          <ChevronDown className="w-4 h-4" />
        </button>
      }
    />
  );
}
