"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCw,
  Search,
  ShieldAlert,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  createDefectWorkOrder,
  fetchInspections,
  InspectionItem,
  reviewInspection,
} from "@/lib/api";

type SafetyDecision = "available" | "restricted" | "out_of_service";
type ReviewedOutcome = "passed" | "passed_with_defects" | "failed";
type DefectStatus = "open" | "awaiting_verification" | "resolved";

const managerRoles = new Set(["owner", "admin", "fleet_manager", "compliance"]);
const workshopRoles = new Set(["owner", "admin", "fleet_manager", "workshop_manager", "technician"]);

function outcomeLabel(outcome: InspectionItem["outcome"]) {
  return outcome.replaceAll("_", " ");
}

export default function InspectionsCompliancePage() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [selected, setSelected] = useState<InspectionItem | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [busyDefect, setBusyDefect] = useState("");
  const [reviewedOutcome, setReviewedOutcome] = useState<ReviewedOutcome>("failed");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision>("restricted");
  const [reviewNotes, setReviewNotes] = useState("");
  const [defectUpdates, setDefectUpdates] = useState<Record<string, DefectStatus>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setInspections(await fetchInspections());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load eDVIR inspections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  const filteredInspections = useMemo(() => inspections.filter((inspection) => {
    const matchesSearch =
      inspection.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspectorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOutcome = outcomeFilter === "all" ||
      inspection.outcome === outcomeFilter ||
      inspection.reviewedOutcome === outcomeFilter;
    return matchesSearch && matchesOutcome;
  }), [inspections, outcomeFilter, searchTerm]);

  const openReview = (inspection: InspectionItem) => {
    const defects = inspection.defects || [];
    setSelected(inspection);
    setReviewedOutcome(
      inspection.reviewedOutcome ||
      (inspection.outcome === "passed" ? "passed" :
        inspection.outcome === "passed_with_defects" ? "passed_with_defects" : "failed")
    );
    setSafetyDecision(
      defects.some((defect) => defect.severity === "critical")
        ? "out_of_service"
        : defects.some((defect) => defect.severity === "major")
          ? "restricted"
          : "available"
    );
    setDefectUpdates(Object.fromEntries(defects.map((defect) => [
      defect._id,
      defect.status === "resolved" ? "resolved" :
        defect.status === "awaiting_verification" ? "awaiting_verification" : "open",
    ])));
    setReviewNotes("");
  };

  const handleReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected?._id) return;
    setSubmittingReview(true);
    try {
      const updated = await reviewInspection(selected._id, {
        reviewedOutcome,
        safetyDecision,
        notes: reviewNotes.trim(),
        defectUpdates: Object.entries(defectUpdates).map(([defectId, status]) => ({ defectId, status })),
      });
      setInspections((current) => current.map((inspection) =>
        inspection._id === updated._id ? updated : inspection
      ));
      setSelected(null);
      toast.success(`Inspection ${updated.reportNumber} review saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save inspection review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleWorkOrder = async (inspection: InspectionItem, defectId: string) => {
    if (!inspection._id) return;
    setBusyDefect(defectId);
    try {
      await createDefectWorkOrder(inspection._id, defectId);
      toast.success("Maintenance work order created for the defect");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create a work order");
    } finally {
      setBusyDefect("");
    }
  };

  const passedCount = inspections.filter((item) => (item.reviewedOutcome || item.outcome) === "passed").length;
  const openDefectCount = inspections.reduce(
    (total, item) => total + (item.defects || []).filter((defect) => defect.status !== "resolved").length,
    0
  );
  const canReview = !!user && managerRoles.has(user.role);
  const canCreateWorkOrders = !!user && workshopRoles.has(user.role);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Inspection &amp; Safety Compliance (eDVIR)</h1>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">Module 6</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review driver inspections, track defects, link repairs, and make recorded vehicle safety decisions.</p>
        </div>
        <button type="button" onClick={() => void loadData()} disabled={loading} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh reports
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total inspection reports</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{inspections.length}</div>
          <span className="text-[11px] text-slate-500">Most recent reports shown below</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reviewed as passed</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{passedCount}</div>
          <span className="text-[11px] text-slate-500">Based on saved review outcomes</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Unresolved defects</span>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{openDefectCount}</div>
          <span className="text-[11px] text-slate-500">Open, repair-in-progress, or awaiting verification</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search report, vehicle, or driver..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          Outcome
          <select value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            <option value="all">All ({inspections.length})</option>
            <option value="passed">Passed</option>
            <option value="passed_with_defects">Passed with defects</option>
            <option value="failed">Failed</option>
            <option value="requires_attention">Legacy: requires attention</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Loading inspection reports...
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <ClipboardCheck className="mb-3 h-8 w-8 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">No inspection reports found</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {inspections.length ? "No report matches the current filters." : "Driver-submitted eDVIR reports will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredInspections.map((inspection) => {
              const defects = inspection.defects || [];
              const displayOutcome = inspection.reviewedOutcome || inspection.outcome;
              return (
                <article key={inspection._id || inspection.reportNumber} className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-mono text-sm font-bold text-slate-900 dark:text-white">{inspection.reportNumber}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          displayOutcome === "passed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : displayOutcome === "passed_with_defects"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}>{outcomeLabel(displayOutcome)}</span>
                        {!!inspection.reviewHistory?.length && <span className="text-[11px] text-slate-500">Reviewed</span>}
                        {inspection.driverAttested && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Driver attested</span>}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{inspection.vehiclePlate}</span>
                        {" · "}{inspection.inspectorName}{" · "}{inspection.type.replaceAll("_", " ")}
                        {" · "}{new Date(inspection.submittedAt || inspection.date).toLocaleString()}
                        {inspection.odometerKm !== undefined ? ` · ${inspection.odometerKm.toLocaleString()} km` : ""}
                      </p>
                      {inspection.defectsSummary && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{inspection.defectsSummary}</p>}
                    </div>
                    {canReview && inspection.vehicleId && (
                      <button type="button" onClick={() => openReview(inspection)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        <ShieldAlert className="h-3.5 w-3.5" /> Review safety
                      </button>
                    )}
                  </div>

                  {!!inspection.checklist?.length && (
                    <details className="mt-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Checklist results ({inspection.checklist.length} items)
                      </summary>
                      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {inspection.checklist.map((answer) => (
                          <li key={answer.itemId} className="flex items-start gap-2 text-xs">
                            {answer.result === "pass"
                              ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />}
                            <span className="text-slate-700 dark:text-slate-300">
                              <span className="font-medium">{answer.itemId.replaceAll("-", " ")}</span>
                              {answer.description ? ` — ${answer.description}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {defects.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {defects.map((defect) => (
                        <div key={defect._id} className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 items-start gap-2">
                            <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${defect.severity === "critical" ? "text-rose-600" : "text-amber-600"}`} />
                            <div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{defect.category} · {defect.severity} · {defect.status.replaceAll("_", " ")}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{defect.description}</p>
                              {!!defect.history?.length && (
                                <ul className="mt-1 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                  {defect.history.map((event, index) => (
                                    <li key={`${event.changedAt}-${index}`}>
                                      {new Date(event.changedAt).toLocaleString()} · {event.actorName} · {event.status.replaceAll("_", " ")}
                                      {event.note ? ` · ${event.note}` : ""}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                          {canCreateWorkOrders && defect.status !== "resolved" && (
                            <button type="button" disabled={!!busyDefect || !!defect.workOrderId} onClick={() => void handleWorkOrder(inspection, defect._id)} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300">
                              {busyDefect === defect._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
                              {defect.workOrderId ? "Work order linked" : "Create work order"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {inspection.reviewHistory?.[inspection.reviewHistory.length - 1] && (
                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                      Latest review by {inspection.reviewHistory[inspection.reviewHistory.length - 1].reviewerName} · {new Date(inspection.reviewHistory[inspection.reviewHistory.length - 1].reviewedAt).toLocaleString()}
                      {" · Safety decision: "}{inspection.reviewHistory[inspection.reviewHistory.length - 1].safetyDecision.replaceAll("_", " ")}
                      {inspection.reviewHistory[inspection.reviewHistory.length - 1].notes ? ` · ${inspection.reviewHistory[inspection.reviewHistory.length - 1].notes}` : ""}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Review {selected.reportNumber}</h2>
                <p className="text-xs text-slate-500">{selected.vehiclePlate} · Submitted by {selected.inspectorName}</p>
              </div>
              <button type="button" disabled={submittingReview} onClick={() => setSelected(null)} aria-label="Close review" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </header>
            <form onSubmit={(event) => void handleReview(event)} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assessed inspection outcome
                  <select value={reviewedOutcome} onChange={(event) => setReviewedOutcome(event.target.value as ReviewedOutcome)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                    <option value="passed">Passed</option>
                    <option value="passed_with_defects">Passed with defects</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Vehicle safety decision
                  <select value={safetyDecision} onChange={(event) => setSafetyDecision(event.target.value as SafetyDecision)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                    <option value="available">Cleared for operation</option>
                    <option value="restricted">Restricted pending further work</option>
                    <option value="out_of_service">Out of service</option>
                  </select>
                </label>
              </div>

              {!!selected.defects?.length && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Defect verification</h3>
                  {selected.defects.map((defect) => (
                    <label key={defect._id} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-[1fr_auto] sm:items-center">
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>{defect.category} ({defect.severity})</strong> — {defect.description}
                        {defect.workOrderId ? <span className="block text-slate-500">Linked work order: {defect.workOrderId}</span> : <span className="block text-amber-700 dark:text-amber-400">No linked work order</span>}
                      </span>
                      <select
                        value={defectUpdates[defect._id] || "open"}
                        onChange={(event) => setDefectUpdates((current) => ({ ...current, [defect._id]: event.target.value as DefectStatus }))}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="open">Open</option>
                        <option value="awaiting_verification">Awaiting verification</option>
                        <option value="resolved" disabled={!defect.workOrderId}>Verify completed repair</option>
                      </select>
                    </label>
                  ))}
                </div>
              )}
              <label className="grid gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Review notes
                <textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} maxLength={1000} rows={3} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" placeholder="Assessment, evidence, and operational instructions" />
              </label>
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                Major and critical defects must be verified resolved before choosing “Cleared for operation.” Critical driver-reported findings remain out of service until a successful review.
              </div>
              <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" disabled={submittingReview} onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={submittingReview} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save review
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
