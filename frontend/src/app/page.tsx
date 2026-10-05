"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { MetricsCards } from "../components/modules/MetricsCards";
import { VehicleTableWidget } from "../components/modules/VehicleTableWidget";
import { HealthMonitorWidget } from "../components/modules/HealthMonitorWidget";
import { AIPredictionsWidget } from "../components/modules/AIPredictionsWidget";
import { fetchHealth, fetchVehicles, fetchVehicleMetrics } from "../lib/api";
import { Vehicle, FleetMetrics, BackendHealth } from "../types/fleet";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("overview");
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
    // Poll health status every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Command Center Header */}
      <Header backendOnline={!isFallback && health.status === "ok"} />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Modular Navigation Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome & Live Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Fleet Operations Command
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Phase 1 Foundation: Modular Next.js frontend connected to Node/Express backend.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 transition"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{loading ? "Syncing..." : "Sync Fleet"}</span>
              </button>

              <button
                onClick={() => alert("Module Action: Add Asset form is scheduled for Phase 3.")}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>

          {/* 1. Fleet Telematics Metrics KPI Cards */}
          <MetricsCards metrics={metrics} isFallback={isFallback} />

          {/* 2. Core Vehicle & Telematics Data Grid */}
          <VehicleTableWidget vehicles={vehicles} isFallback={isFallback} onRefresh={loadData} />

          {/* 3. AI Predictive Maintenance */}
          <AIPredictionsWidget vehicles={vehicles} />

          {/* 4. Render Free-Tier Anti-Hibernation & Architecture Monitor */}
          <HealthMonitorWidget health={health} isFallback={isFallback} />
        </main>
      </div>
    </div>
  );
}
