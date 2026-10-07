"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Settings, Building2, CreditCard, Bell, Shield, Check } from "lucide-react";
import { toast } from "sonner";

export default function SettingsModulePage() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState(user?.organizationName || "Metro Fleet Logistics Ltd");
  const [billingContact, setBillingContact] = useState(user?.email || "alex@metrologistics.com");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Organization preferences saved successfully");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Organization &amp; Tenant Settings
          </h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Module 13
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tenant organization profile, subscription tier, billing preferences, and platform configurations.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Organization Legal Entity Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Primary Billing Contact
          </label>
          <input
            type="email"
            value={billingContact}
            onChange={(e) => setBillingContact(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 transition"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
