"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Truck,
  ClipboardCheck,
  Fuel,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export default function DriverPortalPage() {
  const { user } = useAuth();
  const [completedPreTrip, setCompletedPreTrip] = useState(false);
  const [fuelLogged, setFuelLogged] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Driver Dispatch &amp; Vehicle Portal
          </h1>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Assigned: KBZ-482L
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Welcome, {user?.name || "Driver"}. Submit your pre-trip walkaround and log duty shifts.
        </p>
      </div>

      {/* Vehicle Current Assignment Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-base">
              KBZ
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                KBZ-482L &bull; Mercedes-Benz Actros 2645
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assigned Route: Nairobi to Mombasa Freight Corridor
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900 dark:text-white">48,250 km</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready for Dispatch</div>
          </div>
        </div>
      </div>

      {/* Pre-Trip Inspection Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Electronic Pre-Trip Inspection (eDVIR)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12-Point Walkaround: Brakes, Tyres, Lights, Fluid Levels
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              completedPreTrip
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {completedPreTrip ? "Signed & Passed" : "Pending Signature"}
          </span>
        </div>

        <div className="space-y-2 text-xs border-y border-slate-100 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">&bull; Service Brakes &amp; Air Pressure</span>
            <span className="text-emerald-600 font-semibold">&check; PASS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">&bull; Tyre Tread Depth &amp; Inflation Pressure</span>
            <span className="text-emerald-600 font-semibold">&check; PASS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">&bull; Steering &amp; Coupling Mechanism</span>
            <span className="text-emerald-600 font-semibold">&check; PASS</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setCompletedPreTrip(true);
              toast.success("eDVIR walkaround inspection submitted to Safety Officer");
            }}
            disabled={completedPreTrip}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 transition disabled:opacity-50"
          >
            {completedPreTrip ? "Submitted for Departure" : "Sign & Complete Pre-Trip eDVIR"}
          </button>
        </div>
      </div>
    </div>
  );
}
