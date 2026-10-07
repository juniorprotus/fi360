import React from "react";
import { BackendHealth } from "../../types/fleet";
import { ShieldCheck, Activity, Database, Server } from "lucide-react";

interface HealthMonitorWidgetProps {
  health: BackendHealth;
  isFallback: boolean;
}

export function HealthMonitorWidget({ health, isFallback }: HealthMonitorWidgetProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Anti-Hibernation & Health
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cloud Infrastructure 24/7 Resilience
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isFallback
              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
          }`}
        >
          {isFallback ? "Standby" : "Active"}
        </span>
      </div>

      <div className="space-y-3">
        {/* Anti-Hibernation Rule Info */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Uptime Ping Interval
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
              14 Min
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Endpoint: <code className="font-mono text-slate-700 dark:text-slate-300">/api/health</code> prevents cold start latencies.
          </p>
        </div>

        {/* Database Connectivity */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Database className="h-3.5 w-3.5 text-blue-500" />
              <span>Database Layer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  health.database === "connected" ? "bg-emerald-500" : "bg-cyan-500 animate-pulse"
                }`}
              />
              <span className="text-xs font-bold capitalize text-slate-800 dark:text-slate-200">
                {health.database || "offline_fallback"}
              </span>
            </div>
          </div>
        </div>

        {/* API Microservices Status */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Server className="h-3.5 w-3.5 text-indigo-500" />
              <span>Service Version</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              v{health.version}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
