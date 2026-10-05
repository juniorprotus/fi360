"use client";

import React from "react";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  enabledModules?: {
    vehicles: boolean;
    drivers: boolean;
    maintenance: boolean;
    ai: boolean;
  };
}

export function Sidebar({
  currentTab,
  onTabChange,
  enabledModules = { vehicles: true, drivers: true, maintenance: true, ai: true },
}: SidebarProps) {
  const navItems = [
    {
      id: "overview",
      label: "Overview",
      enabled: true,
      badge: "Live",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "vehicles",
      label: "Vehicles & Assets",
      enabled: enabledModules.vehicles,
      badge: "Module 1",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: "drivers",
      label: "Drivers & Compliance",
      enabled: enabledModules.drivers,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "maintenance",
      label: "Workshop & Repairs",
      enabled: enabledModules.maintenance,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "ai",
      label: "Gemini Telematics",
      enabled: enabledModules.ai,
      badge: "AI 360",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between hidden md:flex">
      <div>
        <div className="px-3 mb-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Ecosystem Modules
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === item.id
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={currentTab === item.id ? "text-emerald-400" : "text-slate-500"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    item.id === "ai"
                      ? "bg-purple-900/50 text-purple-300 border border-purple-700/50"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Deployment & Architecture Badge */}
      <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-slate-400 font-semibold mb-1">
          <span>Stack Status</span>
          <span className="text-[10px] text-emerald-400 font-mono">Zero-Cost</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-400">
          <div className="flex justify-between">
            <span>Frontend:</span>
            <span className="text-slate-300">Vercel (App Router)</span>
          </div>
          <div className="flex justify-between">
            <span>Backend:</span>
            <span className="text-slate-300">Render (Node/Express)</span>
          </div>
          <div className="flex justify-between">
            <span>DB:</span>
            <span className="text-slate-300">MongoDB Atlas M0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
