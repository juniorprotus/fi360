"use client";

import React from "react";
import { Layers, Terminal, ExternalLink, Code2, CheckCircle2 } from "lucide-react";

export default function InteropModulePage() {
  const endpoints = [
    { method: "GET", path: "/api/v1/vehicles", desc: "List all tenant fleet vehicles with telematics" },
    { method: "POST", path: "/api/v1/vehicles", desc: "Create new asset with schema validation" },
    { method: "GET", path: "/api/v1/work-orders", desc: "Fetch workshop maintenance work orders" },
    { method: "POST", path: "/api/v1/inspections/dvir", desc: "Submit digital driver walkaround payload" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Interoperability &amp; API Contracts
          </h1>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Module 12
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Standalone but Connectable API endpoints, webhooks, and third-party ERP/telematics integration contracts.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Documented REST Service Interfaces</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Service Endpoint</th>
              <th className="px-4 py-3">Domain Contract Description</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {endpoints.map((ep) => (
              <tr key={ep.path} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5">
                  <span className="rounded px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {ep.method}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono font-semibold text-slate-900 dark:text-white">
                  {ep.path}
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                  {ep.desc}
                </td>
                <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  Connected
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
