"use client";

import React, { useState, useEffect } from "react";
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
  UserCheck,
} from "lucide-react";

interface TopbarProps {
  onToggleSidebar?: () => void;
  backendOnline?: boolean;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout, switchRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const rolesList: UserRole[] = [
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

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      {/* Left section: mobile hamburger + tenant info */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Tenant
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              {user?.organizationName || "Metro Fleet Logistics Ltd"}
            </span>
          </div>
          <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {user?.plan?.toUpperCase() || "PRO"}
          </span>
        </div>

        {/* Global search bar */}
        <div className="relative hidden sm:block md:w-56 lg:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search fleet assets, work orders..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Right section: Role switcher, Live clock, Theme toggle, Notifications, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Quick Switcher for testing all 10 perspectives */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Switch User Role"
          >
            <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline text-slate-500 dark:text-slate-400">Role:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {ROLE_CONFIGS[user?.role || "fleet_manager"]?.label}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {roleSwitcherOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Switch Active Persona
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Dynamically test role-based dashboards &amp; navigation
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {rolesList.map((r) => {
                  const isCurrent = user?.role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRoleSwitcherOpen(false);
                        switchRole(r);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                        isCurrent
                          ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/40 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div>
                        <div>{ROLE_CONFIGS[r].label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {ROLE_CONFIGS[r].defaultRoute}
                        </div>
                      </div>
                      {isCurrent && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <span>{clock || "00:00:00"} UTC</span>
        </div>

        {/* Theme Toggle (Light / Dark / System) */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-2.5 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "OP"}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">
                {user?.name || "Alex Sterling"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {ROLE_CONFIGS[user?.role || "fleet_manager"]?.label}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Signed in as
                </p>
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {user?.email || "alex@metrologistics.com"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {ROLE_CONFIGS[user?.role || "fleet_manager"]?.label}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" />
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
