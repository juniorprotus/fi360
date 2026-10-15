"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Plus,
  Loader2,
  X,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { fetchInspections, createInspection, InspectionItem } from "@/lib/api";

export default function InspectionsCompliancePage() {
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<InspectionItem>({
    reportNumber: "",
    vehiclePlate: "KBZ-482L",
    inspectorName: "Samuel Karanja (Safety Officer)",
    type: "Pre-Trip Walkaround",
    outcome: "passed",
    defectsSummary: "Zero critical defects noted. 12-point walkaround completed.",
    date: new Date().toISOString().replace("T", " ").substring(0, 16),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInspections();
      setInspections(data);
    } catch {
      toast.error("Failed to load eDVIR inspections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setFormData({
      reportNumber: `EDVIR-${Math.floor(1000 + Math.random() * 9000)}`,
      vehiclePlate: "KBZ-482L",
      inspectorName: "Samuel Karanja (Safety Officer)",
      type: "Pre-Trip Walkaround",
      outcome: "passed",
      defectsSummary: "Tyres, brakes, coupling mechanism and fluid levels verified.",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehiclePlate || !formData.inspectorName) {
      toast.error("Please fill in vehicle plate and inspector name");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createInspection(formData);
      setInspections((prev) => [created, ...prev]);
      toast.success(`Inspection audit ${created.reportNumber} registered`);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit inspection audit");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInspections = inspections.filter((i) => {
    const matchesSearch =
      i.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.inspectorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOutcome = outcomeFilter === "all" || i.outcome === outcomeFilter;
    return matchesSearch && matchesOutcome;
  });

  const passedCount = inspections.filter((i) => i.outcome === "passed").length;
  const defectCount = inspections.filter((i) => i.outcome === "failed" || i.outcome === "requires_attention").length;

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

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Inspection Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Compliance Pass Rate</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {inspections.length > 0 ? `${Math.round((passedCount / inspections.length) * 100)}%` : "100%"}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">{passedCount} fully passed audits</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Flagged Defect Reports</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {defectCount}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Requires workshop rectification</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Inspections Executed</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {inspections.length}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Audited &amp; archived digitally</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report #, vehicle plate, inspector..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Outcome:</span>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="all">All Outcomes ({inspections.length})</option>
            <option value="passed">Passed</option>
            <option value="requires_attention">Requires Attention</option>
            <option value="failed">Failed / Grounded</option>
          </select>
        </div>
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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    <span>Loading audit records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInspections.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      No Inspections Found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                      {searchTerm || outcomeFilter !== "all"
                        ? "No inspections match the active search filter."
                        : "Record your first digital eDVIR walkaround to establish safety compliance."}
                    </p>
                    <button
                      onClick={openCreateModal}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2"
                    >
                      Record First Inspection
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInspections.map((i) => {
                const id = i._id || i.id || i.reportNumber;
                return (
                  <tr key={id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
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
                      {i.type}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          i.outcome === "passed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : i.outcome === "requires_attention"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        {i.outcome === "passed" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : i.outcome === "requires_attention" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {i.outcome.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {i.defectsSummary}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {i.date}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Inspection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  New eDVIR Inspection Audit
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inspector Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inspectorName}
                    onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Pre-Trip Walkaround">Pre-Trip Walkaround</option>
                    <option value="Post-Trip Walkaround">Post-Trip Walkaround</option>
                    <option value="Workshop Audit">Workshop Audit</option>
                    <option value="Annual MOT Compliance">Annual MOT Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Outcome
                  </label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="passed">Passed (Fit for Service)</option>
                    <option value="requires_attention">Requires Attention</option>
                    <option value="failed">Failed / Grounded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Defects &amp; Observation Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.defectsSummary}
                  onChange={(e) => setFormData({ ...formData, defectsSummary: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Sign &amp; Certify Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
