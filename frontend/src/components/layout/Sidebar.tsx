"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_CONFIGS } from "@/lib/auth/rbac";
import {
  Truck,
  Users,
  Wrench,
  Disc,
  Fuel,
  ClipboardCheck,
  Send,
  DollarSign,
  Radio,
  BarChart3,
  Shield,
  Layers,
  Settings,
  Sparkles,
  LayoutDashboard,
  LucideIcon,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role || "fleet_manager";
  const allowedHrefs = ROLE_CONFIGS[userRole]?.allowedNavHrefs || [];

  const allNavigationSections: NavSection[] = [
    {
      group: "Core Operations",
      items: [
        { name: "Executive Overview", href: "/dashboard", icon: LayoutDashboard, badge: "Live" },
        { name: "Vehicles & Assets", href: "/dashboard/fleet", icon: Truck },
        { name: "Driver Operations", href: "/dashboard/drivers", icon: Users },
        { name: "Driver Portal", href: "/dashboard/driver", icon: Users, badge: "Mobile" },
        { name: "Workshop & Repairs", href: "/dashboard/workshop", icon: Wrench },
        { name: "Inspections (eDVIR)", href: "/dashboard/inspections", icon: ClipboardCheck },
      ],
    },
    {
      group: "Asset & Cost Control",
      items: [
        { name: "Tyre Management", href: "/dashboard/tyres", icon: Disc },
        { name: "Fuel & Energy", href: "/dashboard/fuel", icon: Fuel },
        { name: "Dispatch & Transport", href: "/dashboard/transport", icon: Send },
        { name: "Total Cost of Ownership", href: "/dashboard/costs", icon: DollarSign },
      ],
    },
    {
      group: "Intelligence & Platform",
      items: [
        { name: "Telematics & IoT", href: "/dashboard/telematics", icon: Radio },
        { name: "Fleet Intelligence AI", href: "/dashboard/analytics", icon: Sparkles, badge: "AI 360" },
        { name: "Security & Tenancy", href: "/dashboard/admin", icon: Shield },
        { name: "Interoperability API", href: "/dashboard/interop", icon: Layers },
        { name: "Organization Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ];

  // Filter sections and items based on the active role's allowed permissions
  const filteredSections = allNavigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        allowedHrefs.some((allowed) => item.href === allowed || item.href.startsWith(allowed + "/"))
      ),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-black text-sm tracking-wider text-white shadow-md shadow-blue-500/20">
              FI
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                FI360
              </span>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Fleet Intelligence OS
              </p>
            </div>
          </Link>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Role
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {ROLE_CONFIGS[userRole]?.label || userRole}
            </span>
          </div>
        </div>

        {/* Navigation list filtered by role */}
        <div className="space-y-6 px-3 py-3 max-h-[calc(100vh-170px)] overflow-y-auto">
          {filteredSections.map((section) => (
            <div key={section.group}>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                            isActive
                              ? "bg-white/20 text-white"
                              : item.badge === "Live"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : item.badge.includes("AI")
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Tenant Details */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <span className="truncate">{user?.organizationName || "Metro Fleet"}</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            Enterprise Fleet Intelligence
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 flex-shrink-0 md:block">{sidebarContent}</aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-50 w-72 max-w-xs">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
