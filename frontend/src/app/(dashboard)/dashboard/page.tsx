"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MetricsCards } from "@/components/modules/MetricsCards";
import { VehicleTableWidget } from "@/components/modules/VehicleTableWidget";
import { HealthMonitorWidget } from "@/components/modules/HealthMonitorWidget";
import { AIPredictionsWidget } from "@/components/modules/AIPredictionsWidget";
import { fetchHealth, fetchVehicles, fetchVehicleMetrics } from "@/lib/api";
import { Vehicle, FleetMetrics, BackendHealth } from "@/types/fleet";
import { RefreshCw, Plus, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";

export default function DashboardOverviewPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics>({
    active: 0,
    maintenance: 0,
    critical_failure: 0,
    inactive: 0,
  });
  const [health, setHealth] = useState<BackendHealth>({
    status: "connecting",
    service: "fi360-backend",
    version: "1.0.0",
    uptime: 0,
    timestamp: new Date().toISOString(),
    database: "offline_fallback",
    modules: { vehicles: "loading", drivers: "loading", maintenance: "loading" },
  });
  const [isFallback, setIsFallback] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [hRes, vRes, mRes] = await Promise.all([
        fetchHealth(),
        fetchVehicles(),
        fetchVehicleMetrics(),
      ]);

      setHealth(hRes.data);
      setVehicles(vRes.data);
      setMetrics(mRes.data);
      setIsFallback(hRes.isFallback);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Fleet Overview
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time fleet operational metrics, AI predictive health, and connected module statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <Link
            href="/dashboard/fleet"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Vehicle</span>
          </Link>
        </div>
      </div>

      {/* High-level KPIs */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Grid: Live Vehicle Table + System Telemetry / Gemini AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VehicleTableWidget vehicles={vehicles} loading={loading} isFallback={isFallback} />
          
          {/* Quick link banner to modules */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-5 dark:border-blue-900/30 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Standalone &amp; Connectable Architecture Ready
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage Vehicles, Drivers, Work Orders, Inspections, Tyres, and Fuel with dedicated APIs.
                </p>
              </div>
              <Link
                href="/dashboard/fleet"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>Explore Vehicle Registry</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <HealthMonitorWidget health={health} isFallback={isFallback} />
          <AIPredictionsWidget vehicles={vehicles} />
        </div>
      </div>
    </div>
  );
}
