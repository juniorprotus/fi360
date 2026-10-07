import React from "react";
import { FleetMetrics } from "../../types/fleet";
import { CheckCircle2, Wrench, AlertTriangle, PauseCircle } from "lucide-react";

interface MetricsCardsProps {
  metrics: FleetMetrics;
  loading?: boolean;
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  const total =
    metrics.total ||
    metrics.active + metrics.maintenance + metrics.critical_failure + metrics.inactive;
  const activeRate = total > 0 ? Math.round((metrics.active / total) * 100) : 0;
  const maintRate = total > 0 ? Math.round((metrics.maintenance / total) * 100) : 0;
  const criticalRate =
    total > 0 ? Math.round((metrics.critical_failure / total) * 100) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. On-Road / Active */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            On-Road / Active
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Operational
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.active}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">/ {total} units</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Fleet Active Rate</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {activeRate}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${activeRate}%` }}
          />
        </div>
      </div>

      {/* 2. In Workshop / Due */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            In Workshop / Due
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <Wrench className="h-3 w-3" />
            Maintenance
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.maintenance}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">scheduled</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Maintenance Ratio</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {maintRate}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500"
            style={{ width: `${maintRate}%` }}
          />
        </div>
      </div>

      {/* 3. Critical Failure */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Critical Grounded
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
            <AlertTriangle className="h-3 w-3" />
            Red Alert
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.critical_failure}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">grounded</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Failure Impact</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {criticalRate}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-rose-500"
            style={{ width: `${criticalRate}%` }}
          />
        </div>
      </div>

      {/* 4. Inactive / Standby */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Standby / Reserve
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <PauseCircle className="h-3 w-3" />
            Reserve
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.inactive}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">in reserve</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Readiness Capacity</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            100% Ready
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500" style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
}
