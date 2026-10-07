"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_CONFIGS } from "@/lib/auth/rbac";
import { MetricsCards } from "@/components/modules/MetricsCards";
import { VehicleTableWidget } from "@/components/modules/VehicleTableWidget";
import { AIPredictionsWidget } from "@/components/modules/AIPredictionsWidget";
import { fetchVehicles, fetchVehicleMetrics } from "@/lib/api";
import { Vehicle, FleetMetrics } from "@/types/fleet";
import {
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Wrench,
  ClipboardCheck,
  Send,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const userRole = user?.role || "owner";
  const roleConfig = ROLE_CONFIGS[userRole];

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics>({
    active: 0,
    maintenance: 0,
    critical_failure: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [vRes, mRes] = await Promise.all([
        fetchVehicles(),
        fetchVehicleMetrics(),
      ]);
      setVehicles(vRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      toast.error("Failed to refresh fleet telemetry");
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
      {/* Role-Aware Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {userRole === "owner" || userRole === "admin"
                ? "Executive Command Center"
                : `${roleConfig.label} Workspace`}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="h-3 w-3" />
              {roleConfig.label}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {roleConfig.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {(userRole === "owner" || userRole === "admin" || userRole === "fleet_manager") && (
            <Link
              href="/dashboard/fleet"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register Vehicle</span>
            </Link>
          )}
        </div>
      </div>

      {/* Role-Specific Priority Action Deck */}
      {userRole === "fleet_manager" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Readiness</span>
              <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {metrics.active} <span className="text-xs text-slate-400 font-normal">Active Units</span>
            </div>
            <Link href="/dashboard/fleet" className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-1">
              <span>Manage fleet registry</span> <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Workshop Attention</span>
              <Wrench className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {metrics.maintenance} <span className="text-xs text-slate-400 font-normal">In Service</span>
            </div>
            <Link href="/dashboard/workshop" className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
              <span>View open work orders</span> <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">eDVIR Defect Queue</span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {metrics.critical_failure} <span className="text-xs text-slate-400 font-normal">Grounded</span>
            </div>
            <Link href="/dashboard/inspections" className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-3 flex items-center gap-1">
              <span>Review defect reports</span> <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {userRole === "workshop_manager" || userRole === "technician" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Workshop Management Hub
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {metrics.maintenance} assets currently flagged for scheduled or preventive maintenance.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/workshop"
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2"
            >
              Go to Workshop Module
            </Link>
          </div>
        </div>
      ) : null}

      {/* Universal Executive KPIs */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Grid: Live Fleet Registry + Gemini Predictive Telematics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VehicleTableWidget
            vehicles={vehicles}
            loading={loading}
            isFallback={false}
            onRefresh={loadData}
          />
        </div>

        <div className="space-y-6">
          <AIPredictionsWidget vehicles={vehicles} />

          {/* Quick Module Shortcuts based on allowed permissions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Quick Operations
            </h4>
            <div className="space-y-2">
              <Link
                href="/dashboard/fleet"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Full Vehicle Registry (CRUD)
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/workshop"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Workshop &amp; Work Orders
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/inspections"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    eDVIR Driver Inspections
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
