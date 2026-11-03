"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  DriverPortalProfile,
  fetchDriverInspectionChecklist,
  fetchDriverInspections,
  fetchDriverPortalProfile,
  InspectionChecklistItem,
  InspectionItem,
  submitDriverInspection,
} from "@/lib/api";

type ChecklistAnswer = {
  result: "pass" | "fail";
  description: string;
  severity: "minor" | "major";
};

const fieldClass =
  "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export default function DriverPortalPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverPortalProfile | null>(null);
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>([]);
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [inspectionType, setInspectionType] = useState<"pre_trip" | "post_trip">("pre_trip");
  const [odometerKm, setOdometerKm] = useState("");
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [driverAttested, setDriverAttested] = useState(false);

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const nextProfile = await fetchDriverPortalProfile();
      setProfile(nextProfile);
      const historyPromise = fetchDriverInspections();
      if (nextProfile.vehicle) {
        const [nextChecklist, history] = await Promise.all([fetchDriverInspectionChecklist(), historyPromise]);
        setChecklist(nextChecklist);
        setInspections(history);
        setOdometerKm(String(nextProfile.vehicle.odometerKm ?? ""));
      } else {
        setInspections(await historyPromise);
        setChecklist([]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "The driver portal could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadPortal());
  }, [loadPortal]);

  const failedItems = checklist.filter((item) => answers[item.id]?.result === "fail");
  const complete = checklist.length > 0 && checklist.every((item) => answers[item.id]);
  const descriptionsComplete = failedItems.every((item) => answers[item.id]?.description.trim());
  const odometerValue = Number(odometerKm);
  const currentOdometer = profile?.vehicle?.odometerKm ?? 0;
  const odometerValid =
    odometerKm.trim() !== "" &&
    Number.isFinite(odometerValue) &&
    odometerValue >= currentOdometer;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile?.vehicle || !complete || !descriptionsComplete || !odometerValid || !driverAttested) return;
    setSubmitting(true);
    const requestId = submissionId || crypto.randomUUID();
    setSubmissionId(requestId);
    try {
      const created = await submitDriverInspection({
        type: inspectionType,
        odometerKm: odometerValue,
        clientSubmissionId: requestId,
        driverAttested: true,
        checklist: checklist.map((item) => {
          const answer = answers[item.id];
          return {
            itemId: item.id,
            result: answer.result,
            ...(answer.result === "fail"
              ? {
                  description: answer.description.trim(),
                  ...(!item.critical ? { severity: answer.severity } : {}),
                }
              : {}),
          };
        }),
      });
      setSubmissionId("");
      setAnswers({});
      setDriverAttested(false);
      setInspections((current) => [
        created,
        ...current.filter((record) => record._id !== created._id),
      ]);
      await loadPortal();
      toast.success(`Inspection ${created.reportNumber} submitted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit the inspection");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading your vehicle and inspection history...
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-6 dark:border-amber-900 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <h1 className="font-bold text-slate-900 dark:text-white">Driver portal unavailable</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{loadError}</p>
            <button type="button" onClick={() => void loadPortal()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              <RotateCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vehicle = profile.vehicle;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Driver Inspection Portal
          </h1>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
            {vehicle ? `Assigned: ${vehicle.plateNumber}` : "No vehicle assigned"}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Welcome, {profile.driver.fullName || user?.name || "Driver"}.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Truck className="h-6 w-6" />
          </div>
          {vehicle ? (
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {vehicle.plateNumber} · {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                {vehicle.year} · {vehicle.type.replace("_", " ")} · Vehicle: {vehicle.status.replace("_", " ")}
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">No vehicle assigned</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Contact your organization manager to receive a vehicle assignment.</p>
            </div>
          )}
          {vehicle && (
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {vehicle.odometerKm === null ? "—" : `${vehicle.odometerKm.toLocaleString()} km`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Recorded odometer</div>
            </div>
          )}
        </div>
        {vehicle && vehicle.safetyState !== "available" && (
          <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
            vehicle.safetyState === "out_of_service"
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
          }`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {vehicle.safetyState === "out_of_service"
              ? "This vehicle is out of service. Do not operate it until an authorized reviewer clears it."
              : "This vehicle is restricted pending an authorized safety assessment."}
          </div>
        )}
      </section>

      {vehicle && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Digital Vehicle Inspection (eDVIR)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete the applicable items. Every failed item requires a description.</p>
            </div>
          </div>

          {checklist.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No inspection checklist is available for this vehicle type.
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Inspection type
                  <select value={inspectionType} onChange={(event) => setInspectionType(event.target.value as "pre_trip" | "post_trip")} className={fieldClass}>
                    <option value="pre_trip">Pre-trip</option>
                    <option value="post_trip">Post-trip</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Odometer (km)
                  <input type="number" min={currentOdometer} step="1" required value={odometerKm} onChange={(event) => setOdometerKm(event.target.value)} className={fieldClass} />
                  {!odometerValid && odometerKm && <span className="font-normal text-rose-600">Reading must be at least {currentOdometer.toLocaleString()} km.</span>}
                </label>
              </div>

              <div className="divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {checklist.map((item) => {
                  const answer = answers[item.id];
                  return (
                    <div key={item.id} className="space-y-2 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.category}{item.critical ? " · Critical safety item" : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {(["pass", "fail"] as const).map((result) => (
                            <button
                              key={result}
                              type="button"
                              aria-pressed={answer?.result === result}
                              onClick={() => setAnswers((current) => ({
                                ...current,
                                [item.id]: {
                                  result,
                                  description: result === "fail" ? current[item.id]?.description || "" : "",
                                  severity: current[item.id]?.severity || "major",
                                },
                              }))}
                              disabled={submitting}
                              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                                answer?.result === result
                                  ? result === "pass"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                              }`}
                            >
                              {result === "pass" ? "OK" : "Needs attention"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {answer?.result === "fail" && (
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <textarea
                            value={answer.description}
                            onChange={(event) => setAnswers((current) => ({
                              ...current,
                              [item.id]: { ...answer, description: event.target.value },
                            }))}
                            maxLength={1000}
                            required
                            rows={2}
                            aria-label={`${item.label} defect description`}
                            placeholder="Describe the defect and its location"
                            className={`${fieldClass} text-xs`}
                          />
                          {item.critical ? (
                            <span className="self-start rounded-md bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Critical
                            </span>
                          ) : (
                            <label className="grid gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                              Initial severity
                              <select
                                value={answer.severity}
                                onChange={(event) => setAnswers((current) => ({
                                  ...current,
                                  [item.id]: { ...answer, severity: event.target.value as "minor" | "major" },
                                }))}
                                className={fieldClass}
                              >
                                <option value="minor">Minor</option>
                                <option value="major">Major</option>
                              </select>
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Failed critical items automatically place the vehicle out of service. Major defects restrict it pending review.
                  </p>
                  <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={driverAttested} onChange={(event) => setDriverAttested(event.target.checked)} disabled={submitting} className="mt-0.5 accent-emerald-600" />
                    I completed this inspection and reported the vehicle condition accurately.
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !complete || !descriptionsComplete || !odometerValid || !driverAttested}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit {inspectionType === "pre_trip" ? "pre-trip" : "post-trip"} inspection
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your Inspection History</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Only inspections submitted for your linked driver profile appear here.</p>
          </div>
          <button type="button" onClick={() => void loadPortal()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <RotateCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        {inspections.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4" /> No inspections have been submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {inspections.map((inspection) => (
              <article key={inspection._id || inspection.reportNumber} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {inspection.reportNumber} · {inspection.type.replace("_", " ")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {inspection.vehiclePlate} · {inspection.odometerKm?.toLocaleString() ?? "—"} km · {new Date(inspection.submittedAt || inspection.date).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    inspection.outcome === "passed"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : inspection.outcome === "passed_with_defects"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  }`}>
                    {(inspection.reviewedOutcome || inspection.outcome).replaceAll("_", " ")}
                  </span>
                </div>
                {!!inspection.defects?.length && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {inspection.defects.map((defect) => (
                      <li key={defect._id} className="flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-semibold">{defect.category} ({defect.severity})</span>
                        <span>{defect.description}</span>
                        <span className="text-slate-400">· {defect.status.replaceAll("_", " ")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
