"use client";

import React, { useState, useEffect } from "react";

interface HeaderProps {
  backendOnline: boolean;
  activeOrg?: string;
}

export function Header({ backendOnline, activeOrg = "National Logistics Hub" }: HeaderProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-700/60 bg-slate-900/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-sm tracking-wider shadow-inner">
            FI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">FI360</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none">Fleet Intelligence OS</p>
          </div>
        </div>

        <div className="hidden md:flex items-center ml-6 pl-6 border-l border-slate-800">
          <span className="text-xs text-slate-400 mr-2">Org:</span>
          <div className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 border border-slate-700/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{activeOrg}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Anti-Hibernation / Health Ping Badge */}
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              backendOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
            }`}
          />
          <span className="font-medium text-slate-300">
            {backendOnline ? "API Online (14m Ping Active)" : "Offline Mode (Fallback Active)"}
          </span>
        </div>

        {/* Live Clock for Command Centers */}
        <div className="hidden sm:block font-mono text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded border border-slate-700/50">
          {time || "00:00:00"} UTC
        </div>
      </div>
    </header>
  );
}
