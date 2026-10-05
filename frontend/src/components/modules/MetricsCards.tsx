import React from "react";
import { FleetMetrics } from "../../types/fleet";

interface MetricsCardsProps {
  metrics: FleetMetrics;
  isFallback: boolean;
}

export function MetricsCards({ metrics, isFallback }: MetricsCardsProps) {
  const total = metrics.total || (metrics.active + metrics.maintenance + metrics.critical_failure + metrics.inactive);
  const activeRate = total > 0 ? Math.round((metrics.active / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. On-Road / Active (emerald-500) */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">On-Road / Active</span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            Operational
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{metrics.active}</span>
          <span className="text-xs text-slate-400">/ {total} units</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Fleet Active Rate</span>
          <span className="font-semibold text-emerald-400">{activeRate}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${activeRate}%` }} />
        </div>
      </div>

      {/* 2. Maintenance Due / Warning (amber-500) */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">In Workshop / Due</span>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
            Maintenance
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{metrics.maintenance}</span>
          <span className="text-xs text-slate-400">scheduled</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Inspection Queue</span>
          <span className="font-semibold text-amber-400">1 Urgent</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500"
            style={{ width: `${total > 0 ? (metrics.maintenance / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 3. Critical Failure / Compliance Breach (rose-500) */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Critical Alerts</span>
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
            Action Req.
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{metrics.critical_failure}</span>
          <span className="text-xs text-slate-400">incidents</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Severity</span>
          <span className="font-semibold text-rose-400">High (Alternator)</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-rose-500"
            style={{ width: `${total > 0 ? (metrics.critical_failure / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 4. Total Asset Health Score */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Fleet Health Index</span>
          {isFallback ? (
            <span className="text-[10px] text-slate-400 font-mono">Offline Cache</span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-mono">Live Sync</span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">92.4</span>
          <span className="text-xs text-emerald-400 font-medium">+1.8% vs last wk</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Telematics Uptime</span>
          <span className="font-semibold text-slate-200">99.8%</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500" style={{ width: "92.4%" }} />
        </div>
      </div>
    </div>
  );
}
