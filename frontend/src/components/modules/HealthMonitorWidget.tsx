import React from "react";
import { BackendHealth } from "../../types/fleet";

interface HealthMonitorWidgetProps {
  health: BackendHealth;
  isFallback: boolean;
}

export function HealthMonitorWidget({ health, isFallback }: HealthMonitorWidgetProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Anti-Hibernation & Health Monitor
            </h4>
            <p className="text-[11px] text-slate-400">Render Free-Tier 24/7 Always-On Strategy</p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isFallback
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {isFallback ? "Standby / Polling" : "Active / Resilient"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Anti-Hibernation Rule Info */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400">Uptime Ping Contract</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">14 Min</span>
            <span className="text-xs text-slate-400">cron interval</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Target: <code className="text-slate-300">GET /api/health</code>. Prevents Render cold boot delay.
          </p>
        </div>

        {/* Database Connectivity */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400">Database Layer</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                health.database === "connected" ? "bg-emerald-500" : "bg-cyan-500 animate-pulse"
              }`}
            />
            <span className="text-sm font-bold text-white capitalize">
              {health.database === "connected" ? "MongoDB Atlas (M0)" : "Resilient Local Mode"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Auto-reconnecting listeners guard against Render restart drops.
          </p>
        </div>

        {/* Modular Ecosystem Contracts */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400">Active Modular Contracts</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(health.modules || {}).map(([name, status]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {name}: {status}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Strict internal service isolation enabled.</p>
        </div>
      </div>
    </div>
  );
}
