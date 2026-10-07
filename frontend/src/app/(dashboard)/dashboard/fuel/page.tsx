"use client";

import React, { useState } from "react";
import { Fuel, Plus, TrendingDown, DollarSign, Calendar, Search } from "lucide-react";
import { toast } from "sonner";

interface FuelTransaction {
  id: string;
  receiptNumber: string;
  vehiclePlate: string;
  litres: number;
  costTotal: number;
  odometerKm: number;
  station: string;
  date: string;
}

const INITIAL_FUEL: FuelTransaction[] = [
  {
    id: "f_1",
    receiptNumber: "TX-FUEL-8819",
    vehiclePlate: "KBZ-482L",
    litres: 280,
    costTotal: 392.0,
    odometerKm: 48250,
    station: "TotalEnergies Mtito Andei Highway",
    date: "2026-10-06 14:20",
  },
  {
    id: "f_2",
    receiptNumber: "TX-FUEL-8820",
    vehiclePlate: "KCE-771P",
    litres: 340,
    costTotal: 476.0,
    odometerKm: 112400,
    station: "Rubis Nakuru Bypass",
    date: "2026-10-06 18:05",
  },
];

export default function FuelManagementPage() {
  const [logs, setLogs] = useState<FuelTransaction[]>(INITIAL_FUEL);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fuel &amp; Energy Intelligence
            </h1>
            <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Module 5
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fuel card transactions, consumption anomalies, idle-time theft detection, and L/100km efficiency.
          </p>
        </div>

        <button
          onClick={() => toast.info("New fuel fill-up transaction logged")}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Fill-Up</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Receipt / Ref</th>
              <th className="px-4 py-3">Vehicle Plate</th>
              <th className="px-4 py-3">Fuel Volume</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Dispensing Station</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {logs.map((f) => (
              <tr key={f.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                  {f.receiptNumber}
                </td>
                <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">
                  {f.vehiclePlate}
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                  {f.litres} L
                </td>
                <td className="px-4 py-3.5 font-mono font-medium text-slate-900 dark:text-white">
                  ${f.costTotal.toFixed(2)}
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                  {f.odometerKm.toLocaleString()} km
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                  {f.station}
                </td>
                <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                  {f.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
