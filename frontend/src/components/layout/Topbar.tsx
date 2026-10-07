"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { ROLE_CONFIGS, UserRole } from "@/lib/auth/rbac";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Building2,
  ShieldCheck,
  Menu,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

interface TopbarProps {
  onToggleSidebar?: () => void;
  backendOnline?: boolean;
}

const AVAILABLE_TENANTS = [
  { id: "org_metro_global", name: "Metro Fleet Logistics Ltd", plan: "Professional" },
  { id: "org_apex_freight", name: "Apex Trans-East Logistics", plan: "Enterprise" },
  { id: "org_safari_cargo", name: "Rift Haulage & Cargo Services", plan: "Starter" },
];

const ROLES_LIST: UserRole[] = [
  "owner",
  "admin",
  "fleet_manager",
  "workshop_manager",
  "technician",
  "driver",
  "dispatcher",
  "compliance",
  "finance",
  "viewer",
];

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout, switchRole } = useAuth();
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [clock, setClock] = useState("");

  const tenantMenuRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tenantMenuRef.current && !tenantMenuRef.current.contains(e.target as Node)) {
        setTenantDropdownOpen(false);
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchTenant = (tenant: typeof AVAILABLE_TENANTS[0]) => {
    if (!user) return;
    const updated = {
      ...user,
      organizationId: tenant.id,
      organizationName: tenant.name,
      plan: tenant.plan as any,
    };
    localStorage.setItem("fi360_auth_user", JSON.stringify(updated));
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/90 sm:px-6">
      {/* Left Section: Mobile toggle + Compact Tenant Dropdown + Search */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Compact Tenant Dropdown (Clickable to switch organizations) */}
        <div className="relative" ref={tenantMenuRef}>
          <button
            type="button"
            onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Switch fleet organization"
          >
            <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="max-w-[140px] truncate sm:max-w-[190px]">
              {user?.organizationName || "Metro Fleet Logistics Ltd"}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {tenantDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Switch Organization
                </span>
              </div>
              <div className="py-1">
                {AVAILABLE_TENANTS.map((t) => {
                  const isSelected = user?.organizationName === t.name;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTenantDropdownOpen(false);
                        handleSwitchTenant(t);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                        isSelected
                          ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate font-medium">{t.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{t.plan} Tier</div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Compact Search Bar with breathing room */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search assets, VIN, orders..."
            className="h-8 w-full rounded-lg border border-slate-200/90 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Right Section: UTC Clock + Theme + Notifications + Unified Avatar & Role Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Subtle Live UTC Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 px-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{clock || "00:00:00"} UTC</span>
        </div>

        {/* Theme Toggle (Light / Dark / System) */}
        <ThemeToggle />

        {/* Notifications Button */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Collapsed Compact Avatar + Persona & Account Menu */}
        <div className="relative ml-1" ref={avatarMenuRef}>
          <button
            type="button"
            onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white p-1 pr-2 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-bold text-white shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "OP"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-none text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                {user?.name || "Alex Sterling"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                {ROLE_CONFIGS[user?.role || "fleet_manager"]?.label}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {avatarDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              {/* User Identity & Active Role */}
              <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || "Alex Sterling"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || "alex@metrologistics.com"}
                </p>
                <div className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Current Role</span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {ROLE_CONFIGS[user?.role || "fleet_manager"]?.label}
                  </span>
                </div>
              </div>

              {/* Persona Switcher inside Avatar Menu */}
              <div className="px-3.5 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Switch Role Persona
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto px-1 py-0.5">
                {ROLES_LIST.map((r) => {
                  const isCurrent = user?.role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        switchRole(r);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        isCurrent
                          ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{ROLE_CONFIGS[r].label}</span>
                      {isCurrent && <Check className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Sign out */}
              <div className="border-t border-slate-100 pt-1 mt-1 px-1 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out of FI360</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
