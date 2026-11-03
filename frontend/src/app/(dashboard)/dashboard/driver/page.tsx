"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
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
  fetchDriverPortalProfile,
  submitDriverPreTripInspection,
} from "@/lib/api";

export default function DriverPortalPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverPortalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [completedPreTrip, setCompletedPreTrip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkResults, setCheckResults] = useState<Array<boolean | null>>([null, null, null]);
  const [defectsSummary, setDefectsSummary] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setProfile(await fetchDriverPortalProfile());
    } catch (error) {
      setProfile(null);
      setLoadError(
        error instanceof Error ? error.message : "The driver profile could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchDriverPortalProfile()
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setProfile(null);
          setLoadError(
            error instanceof Error ? error.message : "The driver profile could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSignPreTrip = async () => {
    if (!profile?.vehicle) return;
    if (checkResults.some((result) => result === null)) {
      toast.error("Review each pre-trip item before submitting.");
      return;
    }
    const hasIssues = checkResults.some((result) => result === false);
    if (hasIssues && !defectsSummary.trim()) {
      toast.error("Describe the issue before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await submitDriverPreTripInspection({
        type: "Pre-Trip Walkaround",
        outcome: hasIssues ? "requires_attention" : "passed",
        defectsSummary: hasIssues ? defectsSummary.trim() : "All pre-trip items checked and passed.",
      });
      setCompletedPreTrip(true);
      toast.success("Pre-trip inspection submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit pre-trip inspection");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading your driver assignment...
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-6 dark:border-amber-900 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <h1 className="font-bold text-slate-900 dark:text-white">Driver profile unavailable</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {loadError || "No driver profile is linked to your account. Ask your organization manager to link it."}
            </p>
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
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
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Driver Dispatch &amp; Vehicle Portal
          </h1>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
            {vehicle ? `Assigned: ${vehicle.plateNumber}` : "No vehicle assigned"}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Welcome, {profile.driver.fullName || user?.name || "Driver"}.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Truck className="h-6 w-6" />
          </div>
          {vehicle ? (
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {vehicle.plateNumber} · {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle.year} · {vehicle.type.replace("_", " ")} · {vehicle.status.replace("_", " ")}
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">No vehicle assigned</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contact your organization manager to receive a vehicle assignment.
              </p>
            </div>
          )}
          {vehicle && (
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {vehicle.odometerKm === null ? "—" : `${vehicle.odometerKm.toLocaleString()} km`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Odometer</div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Pre-Trip Inspection</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm your assigned vehicle has been checked before departure.
              </p>
            </div>
          </div>
          {completedPreTrip && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Submitted
            </span>
          )}
        </div>
        <div className="space-y-3 border-y border-slate-100 py-3 dark:border-slate-800">
          {[
            "Service brakes and air pressure",
            "Tyre tread and inflation pressure",
            "Lights, steering, fluid levels, and emergency equipment",
          ].map((item, index) => (
            <div key={item} className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-700 dark:text-slate-300">{item}</span>
              <div className="flex gap-2">
                {[true, false].map((result) => (
                  <button
                    key={String(result)}
                    type="button"
                    aria-pressed={checkResults[index] === result}
                    onClick={() =>
                      setCheckResults((current) =>
                        current.map((value, resultIndex) => resultIndex === index ? result : value)
                      )
                    }
                    disabled={completedPreTrip || submitting}
                    className={`rounded-md border px-3 py-1 font-semibold ${
                      checkResults[index] === result
                        ? result
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    {result ? "OK" : "Needs attention"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {checkResults.some((result) => result === false) && (
          <label className="mt-3 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Describe the issue(s)
            <textarea
              value={defectsSummary}
              onChange={(event) => setDefectsSummary(event.target.value)}
              disabled={completedPreTrip || submitting}
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSignPreTrip()}
            disabled={
              !vehicle ||
              completedPreTrip ||
              submitting ||
              checkResults.some((result) => result === null) ||
              (checkResults.some((result) => result === false) && !defectsSummary.trim())
            }
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {vehicle ? "Sign & Submit Pre-Trip" : "Vehicle Assignment Required"}
          </button>
        </div>
      </section>
    </div>
  );
}
