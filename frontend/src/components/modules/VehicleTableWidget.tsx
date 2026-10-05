"use client";

import React, { useState } from "react";
import { Vehicle, VehicleStatus } from "../../types/fleet";

interface VehicleTableWidgetProps {
  vehicles: Vehicle[];
  isFallback: boolean;
  onRefresh?: () => void;
}

export function VehicleTableWidget({ vehicles, isFallback, onRefresh }: VehicleTableWidgetProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = filter === "all" || v.status === filter;
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.make.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.vin.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            On-Road
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Maintenance
          </span>
        );
      case "critical_failure":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Critical Fault
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 p-4 bg-slate-900/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm">Asset & Vehicle Telematics</h3>
            {isFallback && (
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-amber-400 font-mono border border-amber-500/30">
                Fallback Cache
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status, odometry, and fuel telematics data grid</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search plate, VIN, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 sm:w-56 rounded-lg bg-slate-950 px-3 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            {["all", "active", "maintenance", "critical_failure"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-all ${
                  filter === type ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type === "all" ? "All" : type === "critical_failure" ? "Fault" : type}
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Vehicle Data"
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* High Information Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Plate & Model</th>
              <th className="px-4 py-3 font-semibold">VIN</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Odometry</th>
              <th className="px-4 py-3 font-semibold">Fuel Level</th>
              <th className="px-4 py-3 font-semibold">Speed</th>
              <th className="px-4 py-3 font-semibold">Current Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No vehicles matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => {
                const fuel = vehicle.telematicsData?.fuelLevelPercent ?? 0;
                const fuelColor = fuel > 50 ? "bg-emerald-500" : fuel > 20 ? "bg-amber-500" : "bg-rose-500";

                return (
                  <tr key={vehicle._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Plate & Model */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white font-mono text-sm tracking-wide">
                        {vehicle.plateNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </div>
                    </td>

                    {/* VIN */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">
                      {vehicle.vin}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      {getStatusBadge(vehicle.status)}
                    </td>

                    {/* Odometry */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">
                        {vehicle.telematicsData?.odometerKm.toLocaleString()} km
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {vehicle.telematicsData?.engineHours} hrs engine
                      </div>
                    </td>

                    {/* Fuel Level */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full ${fuelColor}`} style={{ width: `${fuel}%` }} />
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-200">{fuel}%</span>
                      </div>
                      {vehicle.telematicsData?.batteryVoltage && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {vehicle.telematicsData.batteryVoltage}V battery
                        </div>
                      )}
                    </td>

                    {/* Speed */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-semibold text-slate-200">
                        {vehicle.telematicsData?.currentSpeedKmh ?? 0} km/h
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(vehicle.telematicsData?.currentSpeedKmh ?? 0) > 0 ? "Moving" : "Stationary"}
                      </div>
                    </td>

                    {/* Current Location */}
                    <td className="px-4 py-3.5 text-slate-300 max-w-[200px]">
                      <div className="truncate font-medium">
                        {vehicle.telematicsData?.location?.address || "Coordinates logged"}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {vehicle.telematicsData?.location?.latitude?.toFixed(4)},{" "}
                        {vehicle.telematicsData?.location?.longitude?.toFixed(4)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 bg-slate-950/60 text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredVehicles.length}</span> of{" "}
          <span className="font-semibold text-slate-200">{vehicles.length}</span> assets
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Maintenance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Critical
          </span>
        </div>
      </div>
    </div>
  );
}
