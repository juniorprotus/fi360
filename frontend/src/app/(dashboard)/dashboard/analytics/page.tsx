"use client";

import React from "react";
import { Sparkles, TrendingUp, Cpu, AlertTriangle, ShieldCheck, BarChart3 } from "lucide-react";

export default function AnalyticsModulePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fleet Intelligence &amp; AI Predictive Analytics
          </h1>
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Module 10
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Google Gemini predictive models for component failure, route fuel optimization, and fleet lifecycle forecasting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-3">
            <Sparkles className="h-4 w-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Predictive Breakdown Index</h3>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">96.8%</div>
          <p className="text-xs text-slate-500 mt-2">
            AI failure model confidence across heavy-duty prime mover engines.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
            <TrendingUp className="h-4 w-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Idle Fuel Savings Forecast</h3>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">$4,820/mo</div>
          <p className="text-xs text-slate-500 mt-2">
            Estimated monthly cost reduction through idle reduction recommendations.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mean Time Between Failures</h3>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">41,200 km</div>
          <p className="text-xs text-slate-500 mt-2">
            +18% improvement over last quarter following proactive work order scheduling.
          </p>
        </div>
      </div>
    </div>
  );
}
