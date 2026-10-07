"use client";

import React, { useState } from "react";
import {
  Send,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface TripManifest {
  id: string;
  tripId: string;
  vehiclePlate: string;
  driverName: string;
  origin: string;
  destination: string;
  cargo: string;
  departureTime: string;
  eta: string;
  status: "dispatched" | "in_transit" | "delivered" | "delayed";
}

const INITIAL_TRIPS: TripManifest[] = [
  {
    id: "trip_1",
    tripId: "DISP-2026-441",
    vehiclePlate: "KBZ-482L",
    driverName: "Daniel Ochieng",
    origin: "Nairobi ICD Depot",
    destination: "Mombasa Port Terminal 2",
    cargo: "Refrigerated Pharmaceuticals (24T)",
    departureTime: "06:30 UTC",
    eta: "14:45 UTC",
    status: "in_transit",
  },
  {
    id: "trip_2",
    tripId: "DISP-2026-442",
    vehiclePlate: "KCE-771P",
    driverName: "Samuel Kamau",
    origin: "Eldoret Grain Silos",
    destination: "Nairobi Central Millers",
    cargo: "Bulk Wheat (32T)",
    departureTime: "08:15 UTC",
    eta: "15:30 UTC",
    status: "in_transit",
  },
  {
    id: "trip_3",
    tripId: "DISP-2026-439",
    vehiclePlate: "KBW-302R",
    driverName: "John K.",
    origin: "Nairobi Airport Hub",
    destination: "Westlands Retail Centers",
    cargo: "Express Air Parcels",
    departureTime: "05:00 UTC",
    eta: "09:30 UTC",
    status: "delivered",
  },
];

export default function TransportDispatchPage() {
  const [trips, setTrips] = useState<TripManifest[]>(INITIAL_TRIPS);

  const handleUpdateStatus = (id: string, newStatus: TripManifest["status"]) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    toast.success(`Trip status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Transport Operations &amp; Dispatch
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Module 7
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Active haulage manifests, route assignments, trip schedules, and live delivery statuses.
          </p>
        </div>

        <button
          onClick={() => toast.info("New dispatch manifest form ready")}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Dispatch Order</span>
        </button>
      </div>

      {/* Trips Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Trip ID / Vehicle</th>
              <th className="px-4 py-3">Assigned Driver</th>
              <th className="px-4 py-3">Route (Origin &rarr; Destination)</th>
              <th className="px-4 py-3">Cargo Description</th>
              <th className="px-4 py-3">ETA</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {trips.map((t) => (
              <tr key={t.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {t.tripId}
                  </div>
                  <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    {t.vehiclePlate}
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                  {t.driverName}
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                  <div>{t.origin}</div>
                  <div className="text-[10px] text-slate-400">&rarr; {t.destination}</div>
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                  {t.cargo}
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                  {t.eta}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      t.status === "delivered"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : t.status === "in_transit"
                        ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400"
                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}
                  >
                    {t.status === "delivered" && <CheckCircle2 className="h-3 w-3" />}
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {t.status !== "delivered" ? (
                    <button
                      onClick={() => handleUpdateStatus(t.id, "delivered")}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      Confirm Delivery
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs">Arrived</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
