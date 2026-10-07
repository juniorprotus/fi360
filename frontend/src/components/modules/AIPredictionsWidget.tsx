"use client";

import React, { useState } from "react";
import { Vehicle, AIPredictionResponse } from "../../types/fleet";
import { fetchAIPrediction } from "../../lib/api";
import { Sparkles, Loader2, AlertCircle, Cpu } from "lucide-react";

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
        odometerKm: vehicle.telematicsData?.odometerKm || 45000,
        engineHours: vehicle.telematicsData?.engineHours || 1200,
        batteryVoltage: vehicle.telematicsData?.batteryVoltage || 13.8,
        recentFaultCodes: [],
      });
      setPrediction(res.data);
    } catch {
      setError("Unable to contact Gemini AI engine. Please verify backend.");
    } finally {
      setLoading(false);
    }
  };

  const getVehicleKey = (v: Vehicle) => v._id || v.id || v.vin;

  const derivedRiskLevel: "low" | "medium" | "high" = prediction
    ? prediction.riskLevel ||
      (prediction.healthScore < 60
        ? "high"
        : prediction.healthScore < 80
        ? "medium"
        : "low")
    : "low";

  const topIssue = prediction?.predictedIssues?.[0];
  const recommendedAction =
    prediction?.recommendedAction || topIssue?.recommendation;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Gemini Predictive Maintenance
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select an asset to generate intelligent failure prediction insights.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick select assets */}
        <div className="flex flex-wrap gap-2">
          {vehicles.slice(0, 4).map((v) => {
            const key = getVehicleKey(v);
            const isSelected = selectedVehicle && getVehicleKey(selectedVehicle) === key;
            return (
              <button
                key={key}
                onClick={() => analyzeVehicle(v)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                  isSelected
                    ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-850"
                }`}
              >
                {v.plateNumber} ({v.model})
              </button>
            );
          })}
        </div>

        {/* Prediction Display Area */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 min-h-[140px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-4 text-purple-600 dark:text-purple-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-medium">Running Gemini Telematics Model...</span>
            </div>
          ) : prediction ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Risk Level:
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                    derivedRiskLevel === "high"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                      : derivedRiskLevel === "medium"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  }`}
                >
                  {derivedRiskLevel} ({prediction.healthScore ?? 85}% Score)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {prediction.summary}
              </p>
              {recommendedAction && (
                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Recommended Action:{" "}
                  </span>
                  {recommendedAction}
                </div>
              )}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-3">
              <Cpu className="h-6 w-6 mb-1 opacity-50" />
              <p className="text-xs">Click any asset above to trigger an AI wear analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
