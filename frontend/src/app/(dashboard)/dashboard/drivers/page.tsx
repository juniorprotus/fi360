"use client";

import React, { useState } from "react";
import { Users, Plus, ShieldCheck, Calendar, Phone, Mail, Award, Search } from "lucide-react";
import { toast } from "sonner";

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  phone: string;
  status: "active" | "on_trip" | "suspended" | "rest_period";
  assignedVehicle: string;
  safetyScore: number;
}

const INITIAL_DRIVERS: Driver[] = [
  {
    id: "drv_1",
    name: "Daniel Ochieng",
    licenseNumber: "DL-NRB-88219",
    licenseExpiry: "2027-04-15",
    phone: "+254 712 345 678",
    status: "on_trip",
    assignedVehicle: "KBZ-482L (Actros)",
    safetyScore: 98,
  },
  {
    id: "drv_2",
    name: "Samuel Kamau",
    licenseNumber: "DL-NRB-77102",
    licenseExpiry: "2026-11-30",
    phone: "+254 723 456 789",
    status: "active",
    assignedVehicle: "KCE-771P (Scania)",
    safetyScore: 94,
  },
  {
    id: "drv_3",
    name: "David Mwangi",
    licenseNumber: "DL-ELD-44012",
    licenseExpiry: "2026-10-28",
    phone: "+254 734 567 890",
    status: "rest_period",
    assignedVehicle: "KDD-109X (Isuzu)",
    safetyScore: 91,
  },
];

export default function DriversModulePage() {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [search, setSearch] = useState("");

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.assignedVehicle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Driver Operations &amp; Compliance
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Module 2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Driver profiles, license expiration tracking, telematics safety scorecards, and asset assignment.
          </p>
        </div>

        <button
          onClick={() => toast.info("Driver registration form available")}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Driver</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search driver by name, license..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Driver Name</th>
                <th className="px-4 py-3">License &amp; Expiry</th>
                <th className="px-4 py-3">Assigned Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Safety Score</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((d) => (
                <tr key={d.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {d.name}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                    <div className="font-mono">{d.licenseNumber}</div>
                    <div className="text-[11px] text-slate-500">Exp: {d.licenseExpiry}</div>
                  </td>
                  <td className="px-4 py-3.5 text-blue-600 dark:text-blue-400 font-medium">
                    {d.assignedVehicle}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {d.safetyScore}%
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => toast.success(`Viewing profile of ${d.name}`)}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
