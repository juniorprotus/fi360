"use client";

import React, { useState } from "react";
import { Disc, Plus, AlertTriangle, CheckCircle2, RotateCw } from "lucide-react";
import { toast } from "sonner";

interface Tyre {
  id: string;
  serialNumber: string;
  vehiclePlate: string;
  position: string;
  brand: string;
  treadDepthMm: number;
  pressurePsi: number;
  status: "good" | "warning" | "critical_wear";
}

const INITIAL_TYRES: Tyre[] = [
  {
    id: "tyre_1",
    serialNumber: "TY-MIC-9921",
    vehiclePlate: "KBZ-482L",
    position: "Steer Axle - Front Left",
    brand: "Michelin X Multiway 315/80R22.5",
    treadDepthMm: 12.5,
    pressurePsi: 120,
    status: "good",
  },
  {
    id: "tyre_2",
    serialNumber: "TY-MIC-9922",
    vehiclePlate: "KBZ-482L",
    position: "Steer Axle - Front Right",
    brand: "Michelin X Multiway 315/80R22.5",
    treadDepthMm: 11.8,
    pressurePsi: 118,
    status: "good",
  },
  {
    id: "tyre_3",
    serialNumber: "TY-BRI-8401",
    vehiclePlate: "KDD-109X",
    position: "Drive Axle - Rear Outer Right",
    brand: "Bridgestone M729",
    treadDepthMm: 3.2,
    pressurePsi: 95,
    status: "warning",
  },
];

export default function TyreManagementPage() {
  const [tyres, setTyres] = useState<Tyre[]>(INITIAL_TYRES);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tyre Management &amp; Tread Life
            </h1>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              Module 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Axle configuration mapping, tread depth wear inspection, pressure monitoring, and retread tracking.
          </p>
        </div>

        <button
          onClick={() => toast.info("New tyre inspection log logged")}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Mount / Register Tyre</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Serial Number / Brand</th>
              <th className="px-4 py-3">Vehicle Plate</th>
              <th className="px-4 py-3">Axle Position</th>
              <th className="px-4 py-3">Tread Depth</th>
              <th className="px-4 py-3">Pressure</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {tyres.map((t) => (
              <tr key={t.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{t.serialNumber}</div>
                  <div className="text-[11px] text-slate-500">{t.brand}</div>
                </td>
                <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">
                  {t.vehiclePlate}
                </td>
                <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                  {t.position}
                </td>
                <td className="px-4 py-3.5 font-bold">
                  {t.treadDepthMm} mm
                </td>
                <td className="px-4 py-3.5 font-mono">
                  {t.pressurePsi} PSI
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      t.status === "good"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                    }`}
                  >
                    {t.status === "good" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
