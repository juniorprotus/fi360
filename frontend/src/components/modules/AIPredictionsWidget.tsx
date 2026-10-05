"use client";

import React, { useState } from "react";
import { Vehicle, AIPredictionResponse } from "../../types/fleet";
import { fetchAIPrediction } from "../../lib/api";

interface AIPredictionsWidgetProps {
  vehicles: Vehicle[];
}

export function AIPredictionsWidget({ vehicles }: AIPredictionsWidgetProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [prediction, setPrediction] = useState<AIPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const res = await fetchAIPrediction({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        odometerKm: vehicle.telematicsData.odometerKm,
        engineHours: vehicle.telematicsData.engineHours,
        batteryVoltage: vehicle.telematicsData.batteryVoltage,
        recentFaultCodes: [], // Add logic to pull fault codes if available
      });
      setPrediction(res.data);
    } catch (err) {
      setError("Failed to fetch AI prediction. Ensure the backend is reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[300px]">
      {/* Sidebar: Vehicle Selection */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Predictive Maintenance
          </h3>
        </div>
        
        <p className="text-xs text-slate-400 mb-4">
          Select an asset to generate a Gemini AI wear-and-tear forecast.
        </p>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {vehicles.slice(0, 5).map(v => (
            <button
              key={v._id}
              onClick={() => analyzeVehicle(v)}
              className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                selectedVehicle?._id === v._id
                  ? "bg-purple-500/10 border-purple-500/50 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold font-mono">{v.plateNumber}</div>
              <div className="text-slate-500 truncate">{v.year} {v.make} {v.model}</div>
            </button>
          ))}
          {vehicles.length === 0 && (
            <div className="text-xs text-slate-500 text-center py-4">No vehicles available for analysis.</div>
          )}
        </div>
      </div>

      {/* Main Area: Analysis Results */}
      <div className="flex-1 p-6 relative flex flex-col">
        {!selectedVehicle && !loading && !prediction && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <svg className="w-12 h-12 mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <p className="text-sm font-medium">Select a vehicle to begin AI analysis</p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-purple-400 animate-pulse">Analyzing telematics data with Gemini...</p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        {prediction && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {selectedVehicle?.plateNumber} Analysis
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  {prediction.isFallback && (
                    <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider">
                      Heuristic Fallback
                    </span>
                  )}
                  {prediction.summary}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Health Score</span>
                <div className={`text-3xl font-black ${
                  prediction.healthScore >= 80 ? "text-emerald-400" :
                  prediction.healthScore >= 50 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {prediction.healthScore}
                  <span className="text-sm text-slate-600 font-medium">/100</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <h5 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">Predicted Issues</h5>
              
              {prediction.predictedIssues.length === 0 ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4 flex items-start gap-3">
                  <div className="mt-0.5"><span className="h-2 w-2 rounded-full bg-emerald-500 block shadow-[0_0_8px_rgba(16,185,129,0.5)]" /></div>
                  <div className="text-sm text-emerald-200/70">No immediate issues predicted based on current telematics.</div>
                </div>
              ) : (
                prediction.predictedIssues.map((issue, idx) => {
                  const probColor = 
                    issue.probability === "High" ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                    issue.probability === "Medium" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                    "bg-slate-800 border-slate-700 text-slate-300";

                  return (
                    <div key={idx} className={`rounded-lg border p-4 ${probColor}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {issue.component}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-black/20 uppercase tracking-wider`}>
                            {issue.probability} Risk
                          </span>
                        </div>
                        <div className="text-xs font-mono font-medium opacity-80">
                          ~{issue.timeToFailureDays} days
                        </div>
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        {issue.recommendation}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
