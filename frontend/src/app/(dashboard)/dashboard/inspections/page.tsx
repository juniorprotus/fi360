"use client";

import React, { useState } from "react";
import {
  ClipboardCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface InspectionRecord {
  id: string;
  reportNumber: string;
  vehiclePlate: string;
  inspectorName: string;
  type: "pre_trip" | "post_trip" | "annual_dot" | "safety_audit";
  result: "passed" | "defects_found" | "grounded";
  defectsSummary: string;
  date: string;
}

const INITIAL_INSPECTIONS: InspectionRecord[] = [
  {
    id: "insp_1",
    reportNumber: "eDVIR-2026-901",
    vehiclePlate: "KBZ-482L",
    inspectorName: "Daniel Ochieng (Driver)",
    type: "pre_trip",
    result: "passed",
    defectsSummary: "Zero critical or minor defects reported. All 12 items verified.",
    date: "2026-10-07 06:15",
  },
  {
    id: "insp_2",
    reportNumber: "eDVIR-2026-902",
    vehiclePlate: "KDA-553M",
    inspectorName: "David Mwangi (Compliance Tech)",
    type: "safety_audit",
    result: "grounded",
    defectsSummary: "Alternator output under-voltage (11.2V) and severe battery leakage.",
    date: "2026-10-07 07:30",
  },
  {
    id: "insp_3",
    reportNumber: "eDVIR-2026-895",
    vehiclePlate: "KDD-109X",
    inspectorName: "James Wachira (Workshop)",
    type: "post_trip",
    result: "defects_found",
    defectsSummary: "Hydraulic tail lift seal weeping oil. Work order opened.",
    date: "2026-10-06 17:00",
  },
];

export default function InspectionsCompliancePage() {
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Inspection &amp; Safety Compliance (eDVIR)
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Module 6
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Paperless digital pre-trip/post-trip inspections, defect auditing, and compliance certificates.
          </p>
        </div>

        <button
          onClick={() => toast.info("New inspection audit form ready")}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Inspection Audit</span>
        </button>
      </div>

      {/* Inspections Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Report Number</th>
              <th className="px-4 py-3">Vehicle Plate</th>
              <th className="px-4 py-3">Inspector</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Audit Outcome</th>
              <th className="px-4 py-3">Defects Summary</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {inspections.map((i) => (
              <tr key={i.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                  {i.reportNumber}
                </td>
                <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">
                  {i.vehiclePlate}
                </td>
                <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                  {i.inspectorName}
                </td>
                <td className="px-4 py-3.5 capitalize text-slate-600 dark:text-slate-400">
                  {i.type.replace("_", " ")}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      i.result === "passed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : i.result === "defects_found"
                        ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"
                    }`}
                  >
                    {i.result === "passed" && <CheckCircle2 className="h-3 w-3" />}
                    {i.result === "grounded" && <AlertTriangle className="h-3 w-3" />}
                    {i.result.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3.5 max-w-xs text-slate-600 dark:text-slate-300">
                  {i.defectsSummary}
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                  {i.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
