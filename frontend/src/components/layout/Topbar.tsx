"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { ROLE_CONFIGS } from "@/lib/auth/rbac";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  Clock,
} from "lucide-react";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [clock, setClock] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const planBadge = user?.plan?.toUpperCase() || "PROFESSIONAL";
  const roleLabel = ROLE_CONFIGS[user?.role || "fleet_manager"]?.label;

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/95 sm:px-6">
      {/* Left Section: Mobile Menu + Brand Logo/Name + Single PROFESSIONAL Badge + Tenant Plain Text */}
      <div className="flex items-center gap-3 md:gap-4">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Logo + Product Name + Single PROFESSIONAL badge */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 focus:outline-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-black tracking-wider text-white shadow-sm shadow-blue-500/20">
              FI
            </div>
            <span className="font-extrabold tracking-tight text-sm text-slate-900 dark:text-white">
              FI360
            </span>
          </Link>
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-blue-700 border border-blue-200/60 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/60">
            {planBadge}
          </span>
        </div>

        {/* Tenant name shown strictly as plain text (no badge, no dropdown, no switching) */}
        <div className="hidden lg:flex items-center pl-3 border-l border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate max-w-[220px]">
            {user?.organizationName || "Metro Fleet Logistics Ltd"}
          </span>
        </div>

        {/* Search Bar with generous breathing room */}
        <div className="relative hidden md:block w-52 lg:w-72 ml-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search assets, VIN, work orders..."
            className="h-8 w-full rounded-lg border border-slate-200/90 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Right Section: UTC Clock + Theme + Notifications + Single Compact User Unit */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* UTC Clock with tight, consistent spacing */}
        <div className="hidden xl:flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400 px-2">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{clock || "00:00:00"} UTC</span>
        </div>

        {/* Theme Toggle (Light / Dark / System) */}
        <ThemeToggle />

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Single Compact User Unit: Avatar + Name + Role Label (No Role Switcher Dropdown) */}
        <div className="relative ml-1" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white p-1 pr-2 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-bold text-white shadow-sm shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "OP"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {user?.name || "Alex Sterling"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {/* Simple Clean Account Popover (Profile info + Sign out only) */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || "Alex Sterling"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || "alex@metrologistics.com"}
                </p>
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1">
                  Role: <span className="text-blue-600 dark:text-blue-400 font-semibold">{roleLabel}</span>
                </p>
              </div>

              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
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
