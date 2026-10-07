"use client";

import React from "react";
import {
  DollarSign,
  TrendingDown,
  BarChart3,
  Fuel,
  Wrench,
  Disc,
  FileSpreadsheet,
} from "lucide-react";

export default function CostManagementPage() {
  const costBreakdown = [
    { category: "Fuel & Energy", amount: "$38,450", percentage: "48%", icon: Fuel, color: "text-cyan-500" },
    { category: "Workshop Maintenance", amount: "$21,200", percentage: "26%", icon: Wrench, color: "text-amber-500" },
    { category: "Tyre Wear & Replacement", amount: "$11,600", percentage: "15%", icon: Disc, color: "text-violet-500" },
    { category: "Insurance & Licenses", amount: "$8,900", percentage: "11%", icon: FileSpreadsheet, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cost Management &amp; Total Cost of Ownership (TCO)
          </h1>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Module 8
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Financial cost tracking, cost-per-kilometer, parts procurement, and operational budget controls.
        </p>
      </div>

      {/* Top Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monthly Operating Expenses</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">$80,150</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            &darr; 4.2% reduction vs prior month
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Cost Per Kilometer</span>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">$0.78 / km</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Target benchmark: $0.82 / km
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fuel Card Reconciliation</span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">99.4%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Verified with telematics fuel logs
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Expenditure Breakdown by Category
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {costBreakdown.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.category} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{c.category}</span>
                  <Icon className={`h-4 w-4 ${c.color}`} />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">{c.amount}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">{c.percentage} of fleet total</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
