"use client";

import React from "react";
import { Radio, MapPin, Activity, Wifi, Cpu, Signal } from "lucide-react";

export default function TelematicsModulePage() {
  const telemetryFeeds = [
    { plate: "KBZ-482L", speed: "68 km/h", coords: "-1.2863, 36.8172", satLock: "12 Sats", ping: "4s ago", canbus: "OK" },
    { plate: "KCE-771P", speed: "74 km/h", coords: "-0.4201, 36.9475", satLock: "14 Sats", ping: "2s ago", canbus: "OK" },
    { plate: "KDD-109X", speed: "0 km/h", coords: "-1.3197, 36.8522", satLock: "8 Sats", ping: "1m ago", canbus: "Workshop Diagnostic Port" },
    { plate: "KBW-302R", speed: "0 km/h", coords: "-1.2921, 36.8219", satLock: "11 Sats", ping: "12s ago", canbus: "Ignition Off" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Telematics, GPS Tracking &amp; IoT Ingestion
          </h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Module 9
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          High-frequency CAN-bus sensor feeds, OBD-II telemetry pings, geofencing, and GPS coordinate tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {telemetryFeeds.map((feed) => (
          <div key={feed.plate} className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{feed.plate}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Velocity:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{feed.speed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GPS Coordinates:</span>
                <span className="font-mono text-[11px]">{feed.coords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CAN-Bus Bus:</span>
                <span className="text-slate-800 dark:text-slate-200">{feed.canbus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Telemetry Delay:</span>
                <span className="text-slate-500">{feed.ping}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
